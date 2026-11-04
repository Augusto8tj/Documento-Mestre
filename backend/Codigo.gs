// =================================================================
//   Prefeitura Municipal de Rio Claro – RJ
//   Banco Mestre Administrativo Municipal — Backend API v3.8 (GAS)
//   Versão Consolidada: 8 Colunas Oficiais + Autenticação Híbrida Resiliente
//
//   Resumo das Melhorias e Correções Integradas:
//   1. Autenticação 100% Retrocompatível (confereSenha Híbrida):
//      - Reconhece o padrão v3.6 (sha256$UUID$HASH).
//      - Reconhece o padrão v3.7 (sha256$HASH com salt fixo).
//      - Reconhece texto puro / legados numéricos (.0) com migração automática.
//   2. Comparação Resiliente de Matrícula:
//      - Busca exata normalizada e case-insensitive, prevenindo bloqueio
//        por formatação de texto ou número no Google Sheets.
//   3. Estrutura Canônica de 8 Colunas Oficiais na aba 'Numeração':
//      A: DataHora | B: TipoDocumento | C: Numero | D: Assunto
//      E: Servidor | F: Destinatario | G: Secretaria | H: Departamento
//   4. Self-Healing Inteligente de Cabeçalhos:
//      Garante a existência das colunas G e H sem risco de truncar dados.
//   5. Isolamento e Confidencialidade por Secretaria e Departamento:
//      Sequencial independente por pasta (001/ano) e proteção do histórico SEAD/SMA.
//   6. Suporte Universal a Requisições (POST / GET Fallback):
//      Aceita JSON via postData e parâmetros via query string (URL).
//   7. Blindagem contra Formatação de Data ('@') e Sequenciais > 999 (pad3).
//   8. Funções Administrativas de Manutenção Manual Preservadas.
// =================================================================

const VERSAO = '3.8';
const TZ = 'America/Sao_Paulo';
const SESSAO_SEG = 12 * 3600; // 12 horas
const MAX_FALHAS = 5;
const SALT_FIXO_PADRAO = 'RioClaro_SGEP_Doc_2026';

// -------------------------------------------------------------
// Resposta pré-voo para requisições CORS
// -------------------------------------------------------------
function doOptions(e) {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------------
// Utilitários de Normalização de Texto e Datas
// -------------------------------------------------------------
function norm(str) {
  return String(str == null ? '' : str)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normTipo(str) {
  return norm(str).toUpperCase();
}

function pad3(num) {
  const n = parseInt(num, 10);
  if (isNaN(n)) return String(num || '');
  return n < 1000 ? ('000' + n).slice(-3) : String(n);
}

function textoNumero(v) {
  if (v instanceof Date) {
    const diaOuMes = v.getDate() === 1 ? v.getMonth() + 1 : v.getDate();
    return pad3(diaOuMes) + '/' + v.getFullYear();
  }
  return String(v == null ? '' : v).trim();
}

function textoData(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, TZ, "yyyy-MM-dd'T'HH:mm:ss");
  }
  return String(v == null ? '' : v).trim();
}

function extrairSiglaSecretaria(sec) {
  if (!sec) return 'SMA';
  const str = String(sec).trim();
  const matchParen = str.match(/\(([^)]+)\)/);
  if (matchParen) return matchParen[1].toUpperCase().trim();
  const n = norm(str);
  if (n.includes('administracao') || n.includes('sead') || n.includes('recursos humanos')) return 'SMA';
  if (n.includes('saude')) return 'SMS';
  if (n.includes('educacao')) return 'SME';
  if (n.includes('fazenda') || n.includes('financas')) return 'SMF';
  if (n.includes('obras')) return 'SMOSP';
  if (n.includes('social') || n.includes('cidadania')) return 'SMAS';
  if (n.includes('meio ambiente')) return 'SMMA';
  if (n.includes('procuradoria')) return 'PGM';
  if (n.includes('gabinete') || n.includes('prefeito') || n.includes('governo')) return 'GP';
  return str.slice(0, 5).toUpperCase();
}

// -------------------------------------------------------------
// Localizador Resiliente de Colunas (Exato Primeiro, Parcial Depois)
// -------------------------------------------------------------
function findColumnIndex(headers, possibleNames) {
  const cleanHeaders = headers.map(norm);
  const searchTerms = possibleNames.map(norm);

  // 1ª Passagem: Correspondência exata (evita que 'id' case com 'matricula' ou vice-versa)
  for (let i = 0; i < searchTerms.length; i++) {
    const idx = cleanHeaders.indexOf(searchTerms[i]);
    if (idx !== -1) return idx;
  }

  // 2ª Passagem: Correspondência parcial
  for (let i = 0; i < searchTerms.length; i++) {
    const term = searchTerms[i];
    const idx = cleanHeaders.findIndex(function(h) { return h.indexOf(term) !== -1; });
    if (idx !== -1) return idx;
  }

  return -1;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------------
// Criptografia e Verificação Híbrida de Senhas (v3.6 + v3.7 + Texto)
// -------------------------------------------------------------
function hashSenha(senha, sal) {
  sal = sal || Utilities.getUuid().replace(/-/g, '');
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    sal + ':' + senha,
    Utilities.Charset.UTF_8
  );
  const hex = digest.map(function(b) {
    return ('0' + (b & 0xff).toString(16)).slice(-2);
  }).join('');
  return 'sha256$' + sal + '$' + hex;
}

function confereSenha(armazenada, informada) {
  const arm = String(armazenada == null ? '' : armazenada).trim();
  const inf = String(informada == null ? '' : informada).trim();

  // Senha já migrada com hash SHA-256
  if (arm.indexOf('sha256$') === 0) {
    const partes = arm.split('$');
    // Padrão com Salt Dinâmico (v3.6 e v3.8) -> sha256$SALT$HASH
    if (partes.length >= 3) {
      return hashSenha(inf, partes[1]) === arm;
    }
    // Padrão com Salt Fixo (v3.7) -> sha256$HASH
    if (partes.length === 2) {
      const digest = Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        SALT_FIXO_PADRAO + inf,
        Utilities.Charset.UTF_8
      );
      const hex = digest.map(function(b) {
        return ('0' + (b & 0xff).toString(16)).slice(-2);
      }).join('');
      return ('sha256$' + hex) === arm;
    }
  }

  // Senha legada em texto puro (remove formatação .0 do Sheets se houver)
  let senSheet = arm.endsWith('.0') ? arm.slice(0, -2) : arm;
  let senComp = inf.endsWith('.0') ? inf.slice(0, -2) : inf;

  return senSheet === senComp;
}

// -------------------------------------------------------------
// Gerenciamento de Sessão por Token (CacheService)
// -------------------------------------------------------------
function criarSessao(usuario) {
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  const cache = CacheService.getScriptCache();
  cache.put('sess_' + token, JSON.stringify(usuario), SESSAO_SEG);
  return token;
}

function validarSessao(token) {
  if (!token) return null;
  const cache = CacheService.getScriptCache();
  const raw = cache.get('sess_' + token);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// -------------------------------------------------------------
// Gravação Padronizada em Logs_Auditoria
// -------------------------------------------------------------
function registrarLog(usuario, acao, idDoc, detalhes) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheetLogs = ss.getSheetByName('Logs_Auditoria');
    if (!sheetLogs) {
      sheetLogs = ss.insertSheet('Logs_Auditoria');
      sheetLogs.appendRow(['DataHora', 'Usuario', 'Acao', 'DocID_Numero', 'Detalhes']);
      sheetLogs.getRange('A1:E1').setFontWeight('bold').setBackground('#002b82').setFontColor('#ffffff');
    }
    const dataHoraIso = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss");
    sheetLogs.appendRow([dataHoraIso, usuario || 'Sistema', acao, String(idDoc || ''), String(detalhes || '')]);
  } catch (e) {
    Logger.log('Erro ao registrar log de auditoria: ' + e);
  }
}

// -------------------------------------------------------------
// Autenticação Centralizada de Servidores Municipais
// -------------------------------------------------------------
function autenticarServidor(ss, matriculaInformada, senhaInformada) {
  let sheet = ss.getSheetByName('Usuarios');
  if (!sheet) {
    sheet = ss.insertSheet('Usuarios');
    sheet.appendRow(['ID', 'Nome', 'Matricula', 'Senha', 'NivelAcesso', 'Secretaria', 'Departamento', 'Ativo']);
    sheet.getRange('A1:H1').setFontWeight('bold').setBackground('#002b82').setFontColor('#ffffff');
    sheet.appendRow(['USR-001', 'Augusto Lourenço da Silva Júnior', '20851', hashSenha('123456'), 'ADMIN', 'Secretaria Municipal de Administração (SMA)', 'Departamento de Recursos Humanos (DRH)', true]);
  }

  const matInput = String(matriculaInformada || '').trim();
  const senInput = String(senhaInformada || '').trim();

  if (!matInput) throw new Error('Matrícula funcional não informada.');
  if (!senInput) throw new Error('Senha de acesso não informada.');

  // Verificação de bloqueio por tentativas excessivas (Brute Force Protection)
  const cache = CacheService.getScriptCache();
  const chaveBloqueio = 'lock_mat_' + norm(matInput);
  const bloqueadoAte = cache.get(chaveBloqueio);
  if (bloqueadoAte) {
    const segundosRestantes = Math.max(1, Math.round((parseInt(bloqueadoAte, 10) - Date.now()) / 1000));
    const minutos = Math.ceil(segundosRestantes / 60);
    throw new Error('Matrícula temporariamente bloqueada por segurança (' + minutos + ' min restantes após erros consecutivos).');
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    throw new Error("Nenhum registro encontrado na aba 'Usuarios'.");
  }

  const headers = data[0].map(function(h) { return String(h).trim(); });

  const idxMatricula = findColumnIndex(headers, ['matricula', 'mat', 'login']);
  const idxSenha = findColumnIndex(headers, ['senha', 'password', 'pass']);
  const idxAtivo = findColumnIndex(headers, ['ativo', 'status', 'situacao']);
  const idxNome = findColumnIndex(headers, ['nome', 'servidor', 'funcionario']);
  const idxNivel = findColumnIndex(headers, ['nivelacesso', 'nivel', 'perfil', 'role', 'acesso']);
  const idxSec = findColumnIndex(headers, ['secretaria', 'secretarias', 'setor', 'lotacao', 'orgao']);
  const idxDepto = findColumnIndex(headers, ['departamento', 'depto', 'divisao', 'setorinterno']);
  const idxCargo = findColumnIndex(headers, ['cargo', 'funcao']);

  if (idxMatricula === -1) throw new Error("Coluna 'Matrícula' não encontrada na aba 'Usuarios'.");
  if (idxSenha === -1) throw new Error("Coluna 'Senha' não encontrada na aba 'Usuarios'.");

  let matriculaLocalizada = false;
  let usuarioInativo = false;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rawMat = row[idxMatricula];
    if (rawMat === undefined || rawMat === null || rawMat === '') continue;

    let matSheet = String(rawMat).trim();
    if (matSheet.endsWith('.0')) matSheet = matSheet.slice(0, -2);

    let matComp = matInput;
    if (matComp.endsWith('.0')) matComp = matComp.slice(0, -2);

    // Comparação normalizada (elimina falhas por case-sensitive ou acentuação)
    if (norm(matSheet) === norm(matComp)) {
      matriculaLocalizada = true;

      if (idxAtivo !== -1) {
        const valAtivo = String(row[idxAtivo]).trim().toUpperCase();
        if (valAtivo === 'FALSE' || valAtivo === 'INATIVO' || valAtivo === 'NÃO' || valAtivo === 'NAO' || valAtivo === '0') {
          usuarioInativo = true;
          break;
        }
      }

      const rawSen = row[idxSenha];

      if (confereSenha(rawSen, senInput)) {
        cache.remove('falhas_mat_' + norm(matInput));

        const nomeUsuario = (idxNome !== -1 && row[idxNome]) ? String(row[idxNome]).trim() : 'Servidor Municipal';
        const nivelAcesso = (idxNivel !== -1 && row[idxNivel]) ? String(row[idxNivel]).trim().toUpperCase() : 'PADRAO';
        const secBruta = (idxSec !== -1 && row[idxSec]) ? String(row[idxSec]).trim() : 'Secretaria Municipal de Administração (SMA)';
        const depto = (idxDepto !== -1 && row[idxDepto]) ? String(row[idxDepto]).trim() : 'Departamento de Recursos Humanos (DRH)';
        const cargo = (idxCargo !== -1 && row[idxCargo]) ? String(row[idxCargo]).trim() : '';

        const secretariasList = secBruta.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        const secretariaPrincipal = secretariasList[0] || 'Secretaria Municipal de Administração (SMA)';

        // Migração suave: se a senha estava em texto puro ou no salt fixo antigo, atualiza para o hash dinâmico
        const senhaStr = String(rawSen || '').trim();
        if (senhaStr.indexOf('sha256$') !== 0 || senhaStr.split('$').length < 3) {
          try {
            sheet.getRange(i + 1, idxSenha + 1).setNumberFormat('@').setValue(hashSenha(senInput));
          } catch (e) {
            Logger.log('Não foi possível gravar o novo hash no Sheets: ' + e);
          }
        }

        const usuarioObj = {
          nome: nomeUsuario,
          matricula: matComp,
          nivel: nivelAcesso,
          secretaria: secretariaPrincipal,
          secretarias: secretariasList,
          departamento: depto,
          cargo: cargo
        };

        const token = criarSessao(usuarioObj);
        usuarioObj.token = token;

        registrarLog(nomeUsuario, 'LOGIN', matComp, 'Autenticação bem-sucedida (' + secretariaPrincipal + ')');

        return createJsonResponse({
          success: true,
          usuario: usuarioObj,
          token: token
        });
      } else {
        const chaveFalhas = 'falhas_mat_' + norm(matInput);
        let falhas = parseInt(cache.get(chaveFalhas) || '0', 10) + 1;
        cache.put(chaveFalhas, String(falhas), 15 * 60);

        registrarLog(matInput, 'LOGIN_FALHA', matInput, 'Senha incorreta (Tentativa ' + falhas + '/' + MAX_FALHAS + ')');

        if (falhas >= MAX_FALHAS) {
          cache.put(chaveBloqueio, String(Date.now() + 15 * 60 * 1000), 15 * 60);
          throw new Error('Limite de 5 tentativas atingido. Matrícula bloqueada temporariamente por 15 minutos.');
        }

        throw new Error('Senha incorreta para a matrícula ' + matInput + '. Tentativa ' + falhas + ' de ' + MAX_FALHAS + '.');
      }
    }
  }

  if (usuarioInativo) {
    throw new Error('A matrícula ' + matInput + ' está desativada no sistema municipal.');
  }

  if (!matriculaLocalizada) {
    throw new Error('Matrícula ' + matInput + ' não cadastrada na base de servidores da Prefeitura.');
  }
}

// -------------------------------------------------------------
// Endpoint GET: Modelos, Histórico, Sugestões e Fallback de Login
// -------------------------------------------------------------
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Suporte a LOGIN via GET (compatibilidade com browsers locais file://)
    if (e && e.parameter && String(e.parameter.action).toUpperCase() === 'LOGIN') {
      return autenticarServidor(ss, e.parameter.matricula, e.parameter.senha);
    }

    // 1. Carregar Modelos Documentais Ativos (Aba 'Modelos')
    const sheetModelos = ss.getSheetByName('Modelos') || ss.getSheets()[0];
    const dataModelos = sheetModelos.getDataRange().getValues();
    const records = [];

    if (dataModelos.length > 1) {
      const headers = dataModelos[0].map(function(h) { return String(h).trim(); });

      for (let i = 1; i < dataModelos.length; i++) {
        const row = dataModelos[i];
        if (!row[0]) continue;

        const record = {};
        headers.forEach(function(header, index) {
          let val = row[index];
          if (val === 'TRUE' || val === true) val = true;
          else if (val === 'FALSE' || val === false) val = false;
          record[header] = val !== undefined ? val : '';
        });

        // Filtro estrito: apenas modelos ativos
        if (record.Ativo !== false && String(record.Ativo).toUpperCase() !== 'FALSE') {
          records.push(record);
        }
      }
    }

    // 2. Extrair Histórico e Sugestões da Aba 'Numeração' (8 Colunas Oficiais)
    const sugestoes = {
      destinatarios: [],
      assuntos: [],
      secretarias: [
        'Secretaria Municipal de Administração (SMA)',
        'Secretaria Municipal de Saúde (SMS)',
        'Secretaria Municipal de Educação (SME)',
        'Secretaria Municipal de Fazenda (SMF)',
        'Secretaria Municipal de Obras e Serviços Públicos (SMOSP)',
        'Secretaria Municipal de Assistência Social (SMAS)',
        'Secretaria Municipal de Meio Ambiente (SMMA)',
        'Procuradoria-Geral do Município (PGM)',
        'Gabinete do Prefeito (GP)'
      ],
      departamentos: [
        'Gabinete',
        'Departamento de Recursos Humanos (DRH)',
        'Divisão de Treinamento e Desenvolvimento',
        'Coordenação de Folha de Pagamento',
        'Departamento de Compras e Licitações',
        'Setor de Protocolo e Arquivo Geral'
      ],
      servidores: []
    };

    const registrosNumeracao = [];
    const sheetNum = ss.getSheetByName('Numeração') || ss.getSheetByName('Numeracao');
    if (sheetNum) {
      const dataNum = sheetNum.getDataRange().getValues();
      if (dataNum.length > 1) {
        const numHeaders = dataNum[0].map(function(h) { return String(h).trim(); });
        const idxDataHora = findColumnIndex(numHeaders, ['datahora', 'data_hora', 'data', 'hora']);
        const idxTipo = findColumnIndex(numHeaders, ['tipodocumento', 'tipo_documento', 'tipo', 'documento']);
        const idxNumero = findColumnIndex(numHeaders, ['numero', 'num', 'numeracao']);
        const idxAssunto = findColumnIndex(numHeaders, ['assunto', 'ementa', 'titulo']);
        const idxServidor = findColumnIndex(numHeaders, ['servidor', 'usuario', 'autor', 'responsavel']);
        const idxDestinatario = findColumnIndex(numHeaders, ['destinatario', 'destino', 'orgao', 'para']);
        const idxSecretaria = findColumnIndex(numHeaders, ['secretaria', 'secretariaorigem', 'lotacao', 'orgao']);
        const idxDepartamento = findColumnIndex(numHeaders, ['departamento', 'depto', 'divisao', 'setorinterno', 'setor']);

        const destSet = new Set();
        const assSet = new Set();
        const secSet = new Set(sugestoes.secretarias);
        const depSet = new Set(sugestoes.departamentos);

        for (let i = 1; i < dataNum.length; i++) {
          const row = dataNum[i];
          const rawData = idxDataHora !== -1 ? row[idxDataHora] : row[0];
          const rawTipo = idxTipo !== -1 ? row[idxTipo] : row[1];
          const rawNum = idxNumero !== -1 ? row[idxNumero] : row[2];
          const rawAss = idxAssunto !== -1 ? row[idxAssunto] : row[3];
          const rawServ = idxServidor !== -1 ? row[idxServidor] : (row.length > 4 ? row[4] : '');
          const rawDest = idxDestinatario !== -1 ? row[idxDestinatario] : (row.length > 5 ? row[5] : '');
          const rawSec = idxSecretaria !== -1 ? row[idxSecretaria] : (row.length > 6 ? row[6] : '');
          const rawDepto = idxDepartamento !== -1 ? row[idxDepartamento] : (row.length > 7 ? row[7] : '');

          let dataHoraStr = '';
          if (rawData instanceof Date) {
            dataHoraStr = Utilities.formatDate(rawData, TZ, "dd/MM/yyyy HH:mm");
          } else {
            dataHoraStr = String(rawData || '').trim();
          }

          const tipoStr = String(rawTipo || 'MEMORANDO').trim().toUpperCase();
          const numStr = textoNumero(rawNum);
          if (!numStr) continue;

          const assStr = String(rawAss || '').trim();
          const servStr = String(rawServ || '').trim() || 'Servidor Municipal';
          const destStr = String(rawDest || '').trim();
          const secStr = String(rawSec || '').trim() || 'Secretaria Municipal de Administração (SMA)';
          const deptoStr = String(rawDepto || '').trim() || 'Departamento de Recursos Humanos (DRH)';

          if (destStr && destStr !== 'Não informado') destSet.add(destStr);
          if (assStr && assStr !== 'Sem assunto' && assStr !== 'Sem Assunto') assSet.add(assStr);
          if (secStr) secSet.add(secStr);
          if (deptoStr) depSet.add(deptoStr);

          registrosNumeracao.push({
            dataHora: dataHoraStr,
            tipoDocumento: tipoStr,
            numero: numStr,
            assunto: assStr,
            usuario: servStr,
            servidor: servStr,
            destinatario: destStr,
            secretaria: secStr,
            departamento: deptoStr
          });
        }
        sugestoes.destinatarios = Array.from(destSet).filter(Boolean).sort();
        sugestoes.assuntos = Array.from(assSet).filter(Boolean).sort();
        sugestoes.secretarias = Array.from(secSet).filter(Boolean).sort();
        sugestoes.departamentos = Array.from(depSet).filter(Boolean).sort();
      }
    }

    // 3. Extrair Lista Central de Servidores para Autocomplete do Login (Sem Senhas)
    const sheetUsers = ss.getSheetByName('Usuarios');
    if (sheetUsers) {
      const dataUsers = sheetUsers.getDataRange().getValues();
      if (dataUsers.length > 1) {
        const uHeaders = dataUsers[0].map(function(h) { return String(h).trim(); });
        const idxM = findColumnIndex(uHeaders, ['matricula', 'mat', 'login']);
        const idxN = findColumnIndex(uHeaders, ['nome', 'servidor', 'funcionario']);
        const idxS = findColumnIndex(uHeaders, ['secretaria', 'setor', 'lotacao', 'orgao']);
        const idxD = findColumnIndex(uHeaders, ['departamento', 'depto', 'divisao']);
        const idxC = findColumnIndex(uHeaders, ['cargo', 'funcao']);
        const idxA = findColumnIndex(uHeaders, ['ativo', 'status', 'situacao']);

        if (idxM !== -1) {
          for (let u = 1; u < dataUsers.length; u++) {
            const uRow = dataUsers[u];
            if (idxA !== -1) {
              const uAtivo = String(uRow[idxA]).trim().toUpperCase();
              if (uAtivo === 'FALSE' || uAtivo === 'INATIVO' || uAtivo === 'NÃO' || uAtivo === '0') continue;
            }
            let uMat = String(uRow[idxM] !== undefined ? uRow[idxM] : '').trim();
            if (uMat.endsWith('.0')) uMat = uMat.slice(0, -2);
            if (!uMat) continue;

            const uNome = (idxN !== -1 && uRow[idxN]) ? String(uRow[idxN]).trim() : '';
            const uSec = (idxS !== -1 && uRow[idxS]) ? String(uRow[idxS]).trim() : '';
            const uDepto = (idxD !== -1 && uRow[idxD]) ? String(uRow[idxD]).trim() : '';
            const uCargo = (idxC !== -1 && uRow[idxC]) ? String(uRow[idxC]).trim() : '';

            sugestoes.servidores.push({
              matricula: uMat,
              nome: uNome,
              secretaria: uSec,
              departamento: uDepto,
              cargo: uCargo
            });
          }
        }
      }
    }

    const listaNumeracaoOrdenada = registrosNumeracao.reverse();

    return createJsonResponse({
      success: true,
      data: records,
      sugestoes: sugestoes,
      numeracoes: listaNumeracaoOrdenada,
      registrosNumeracao: listaNumeracaoOrdenada,
      versao: VERSAO,
      versaoBackend: VERSAO
    });

  } catch (error) {
    return createJsonResponse({ success: false, error: error.message || error.toString() });
  }
}

// -------------------------------------------------------------
// Endpoint POST: Ações Transacionais com Trava de Concorrência
// -------------------------------------------------------------
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000); // Trava atômica de 15 segundos

  try {
    if (!e || (!e.postData && !e.parameter)) {
      throw new Error('Payload da requisição não fornecido.');
    }

    let req = {};
    if (e.postData && e.postData.contents) {
      try {
        req = JSON.parse(e.postData.contents);
      } catch (err) {
        req = e.parameter || {};
      }
    } else if (e.parameter) {
      req = e.parameter;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = req.action ? String(req.action).toUpperCase() : 'CARREGAR';

    // 1. AÇÃO: LOGIN
    if (action === 'LOGIN') {
      return autenticarServidor(ss, req.matricula, req.senha);
    }

    // 2. AÇÃO: LOGOUT
    if (action === 'LOGOUT') {
      if (req.token) {
        CacheService.getScriptCache().remove('sess_' + req.token);
      }
      return createJsonResponse({ success: true, message: 'Sessão encerrada com sucesso.' });
    }

    // 3. AÇÃO: CARREGAR
    if (action === 'CARREGAR') {
      return doGet(null);
    }

    // 4. AÇÃO: SALVAR_USUARIO (Gestão Administrativa de Servidores e Senhas)
    if (action === 'SALVAR_USUARIO') {
      // Suporte flexível ao payload
      const u = req.usuario || req;
      const matInput = String(u.matricula || '').trim();
      const nomeInput = String(u.nome || '').trim();

      if (!matInput || !nomeInput) {
        throw new Error("Matrícula e nome funcional são obrigatórios.");
      }

      let sheet = ss.getSheetByName('Usuarios');
      if (!sheet) {
        sheet = ss.insertSheet('Usuarios');
        sheet.appendRow(['ID', 'Nome', 'Matricula', 'Senha', 'NivelAcesso', 'Secretaria', 'Departamento', 'Ativo']);
        sheet.getRange('A1:H1').setFontWeight('bold').setBackground('#002b82').setFontColor('#ffffff');
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0].map(function(h) { return String(h).trim(); });

      const idxMat = findColumnIndex(headers, ['matricula', 'mat']);
      const idxNome = findColumnIndex(headers, ['nome', 'servidor']);
      const idxSenha = findColumnIndex(headers, ['senha', 'password', 'pass']);
      const idxNivel = findColumnIndex(headers, ['nivelacesso', 'nivel', 'perfil', 'role']);
      const idxSec = findColumnIndex(headers, ['secretaria', 'secretarias', 'lotacao']);
      const idxDepto = findColumnIndex(headers, ['departamento', 'depto', 'setor']);
      const idxAtivo = findColumnIndex(headers, ['ativo', 'status', 'liberado']);

      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        let cellMat = String(data[i][idxMat] == null ? '' : data[i][idxMat]).trim();
        if (cellMat.endsWith('.0')) cellMat = cellMat.slice(0, -2);
        if (norm(cellMat) === norm(matInput)) {
          rowIndex = i + 1;
          break;
        }
      }

      const secFinal = Array.isArray(u.secretarias) && u.secretarias.length > 0 
        ? u.secretarias.join(', ') 
        : (u.secretaria || 'Secretaria Municipal de Administração (SMA)');

      const adminLogado = req.usuarioAdmin || (currentUser => currentUser && currentUser.nome) || 'Administrador';

      if (rowIndex !== -1) {
        // Atualização de Servidor Existente
        if (idxNome !== -1 && u.nome) sheet.getRange(rowIndex, idxNome + 1).setValue(u.nome);
        if (idxNivel !== -1 && u.nivel) sheet.getRange(rowIndex, idxNivel + 1).setValue(u.nivel);
        if (idxSec !== -1 && secFinal) sheet.getRange(rowIndex, idxSec + 1).setValue(secFinal);
        if (idxDepto !== -1 && u.departamento) sheet.getRange(rowIndex, idxDepto + 1).setValue(u.departamento);
        if (idxAtivo !== -1 && u.ativo !== undefined) sheet.getRange(rowIndex, idxAtivo + 1).setValue(Boolean(u.ativo));

        const novaSenha = u.novaSenha || u.senha;
        if (idxSenha !== -1 && novaSenha && String(novaSenha).trim()) {
          sheet.getRange(rowIndex, idxSenha + 1).setNumberFormat('@').setValue(hashSenha(String(novaSenha).trim()));
        }

        registrarLog(adminLogado, 'EDITAR_SERVIDOR', matInput, 'Atualização cadastral do servidor ' + (u.nome || matInput));
        return createJsonResponse({ success: true, message: 'Servidor atualizado com sucesso na aba Usuarios.' });
      } else {
        // Cadastro de Novo Servidor
        const novoID = 'USR-' + ('000' + data.length).slice(-3);
        const senhaDef = u.senha && String(u.senha).trim() ? hashSenha(String(u.senha).trim()) : hashSenha('123456');

        const novaLinha = headers.map(function(h) {
          const nh = norm(h);
          if (nh.indexOf('id') !== -1) return novoID;
          if (nh.indexOf('nome') !== -1) return u.nome;
          if (nh.indexOf('matricula') !== -1 || nh.indexOf('mat') !== -1) return matInput;
          if (nh.indexOf('senha') !== -1 || nh.indexOf('password') !== -1) return senhaDef;
          if (nh.indexOf('nivel') !== -1) return u.nivel || 'PADRAO';
          if (nh.indexOf('secretaria') !== -1 || nh.indexOf('lotacao') !== -1) return secFinal;
          if (nh.indexOf('departamento') !== -1 || nh.indexOf('depto') !== -1) return u.departamento || 'Gabinete';
          if (nh.indexOf('ativo') !== -1) return u.ativo !== undefined ? Boolean(u.ativo) : true;
          return '';
        });

        sheet.appendRow(novaLinha);
        sheet.getRange(sheet.getLastRow(), idxMat + 1).setNumberFormat('@').setValue(matInput);

        registrarLog(adminLogado, 'CRIAR_SERVIDOR', matInput, 'Cadastro do servidor ' + (u.nome || matInput));
        return createJsonResponse({ success: true, message: 'Novo servidor cadastrado com sucesso!', novoID: novoID });
      }
    }

    // 5. AÇÃO: ALTERAR_STATUS_USUARIO
    if (action === 'ALTERAR_STATUS_USUARIO') {
      const sheet = ss.getSheetByName('Usuarios');
      if (!sheet) throw new Error("Aba 'Usuarios' não configurada.");

      const data = sheet.getDataRange().getValues();
      const idxMat = findColumnIndex(data[0], ['matricula', 'mat']);
      const idxAtivo = findColumnIndex(data[0], ['ativo', 'status', 'liberado']);
      if (idxMat === -1 || idxAtivo === -1) throw new Error("Colunas obrigatórias não encontradas.");

      const matInput = String(req.matricula || '').trim();
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        let cellMat = String(data[i][idxMat] == null ? '' : data[i][idxMat]).trim();
        if (cellMat.endsWith('.0')) cellMat = cellMat.slice(0, -2);
        if (norm(cellMat) === norm(matInput)) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex === -1) throw new Error("Servidor não localizado na aba Usuarios.");
      const novoStatus = req.ativo === true || req.ativo === 'true';
      sheet.getRange(rowIndex, idxAtivo + 1).setValue(novoStatus);
      registrarLog(req.usuarioAdmin || 'Administrador', 'ALTERAR_STATUS', matInput, (novoStatus ? 'Ativação' : 'Desativação') + ' do servidor matrícula ' + matInput);
      return createJsonResponse({ success: true, message: 'Status do servidor alterado para ' + (novoStatus ? 'ATIVO' : 'INATIVO') + '.' });
    }

    // 6. AÇÃO: SALVAR_MODELO
    if (action === 'SALVAR_MODELO') {
      const sheet = ss.getSheetByName('Modelos');
      if (!sheet) throw new Error("Aba 'Modelos' não encontrada.");

      const data = sheet.getDataRange().getValues();
      const headers = data[0].map(function(h) { return String(h).trim(); });
      const payload = req.documento || {};
      const usuarioLogado = req.usuarioLogado || 'Sistema';

      let rowIndex = -1;
      if (payload.ID) {
        const idCol = headers.indexOf('ID');
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][idCol]).trim() === String(payload.ID).trim()) {
            rowIndex = i + 1;
            break;
          }
        }
      }

      if (rowIndex !== -1) {
        headers.forEach(function(h, colIndex) {
          if (payload[h] !== undefined && h !== 'ID') {
            sheet.getRange(rowIndex, colIndex + 1).setValue(payload[h]);
          }
        });
        registrarLog(usuarioLogado, 'EDITAR_MODELO', payload.ID, 'Edição de ' + payload.TipoDocumento + ': ' + payload.Titulo);
        return createJsonResponse({ success: true, message: 'Modelo atualizado com sucesso.' });
      } else {
        let maiorId = 0;
        const idCol = headers.indexOf('ID') !== -1 ? headers.indexOf('ID') : 0;
        for (let i = 1; i < data.length; i++) {
          const match = String(data[i][idCol] || '').match(/MOD-(\d+)/i);
          if (match) {
            const val = parseInt(match[1], 10);
            if (val > maiorId) maiorId = val;
          }
        }

        const novoID = 'MOD-' + ('000' + (maiorId + 1)).slice(-3);
        payload.ID = novoID;
        payload.Ativo = true;
        payload.UsoFrequente = 0;
        payload.Versao = '1.0';

        const newRow = headers.map(function(h) { return payload[h] !== undefined ? payload[h] : ''; });
        sheet.appendRow(newRow);

        registrarLog(usuarioLogado, 'CRIAR_MODELO', novoID, 'Criação de ' + payload.TipoDocumento + ': ' + payload.Titulo);
        return createJsonResponse({ success: true, message: 'Novo modelo cadastrado com sucesso.', novoID: novoID, idGerado: novoID });
      }
    }

    // 7. AÇÃO: GERAR_NUMERO (8 Colunas Oficiais)
    if (action === 'GERAR_NUMERO') {
      let sheetNum = ss.getSheetByName('Numeração') || ss.getSheetByName('Numeracao');
      if (!sheetNum) {
        sheetNum = ss.insertSheet('Numeração');
        sheetNum.appendRow(['DataHora', 'TipoDocumento', 'Numero', 'Assunto', 'Servidor', 'Destinatario', 'Secretaria', 'Departamento']);
        sheetNum.getRange('A1:H1').setFontWeight('bold').setBackground('#002b82').setFontColor('#ffffff');
      }

      const rawTipo = req.tipoDocumento ? String(req.tipoDocumento).trim() : 'MEMORANDO';
      const tipoDoc = rawTipo.toUpperCase();
      const tipoNormalizado = normTipo(rawTipo);

      const reqSecretaria = req.secretaria ? String(req.secretaria).trim() : 'Secretaria Municipal de Administração (SMA)';
      const reqDepartamento = req.departamento ? String(req.departamento).trim() : 'Departamento de Recursos Humanos (DRH)';
      const reqServidor = req.servidor || req.usuarioLogado ? String(req.servidor || req.usuarioLogado).trim() : 'Servidor Municipal';
      const reqSigla = req.sigla ? String(req.sigla).trim().toUpperCase() : extrairSiglaSecretaria(reqSecretaria);
      const incluirSigla = req.incluirSigla === true || req.incluirSigla === 'true';

      const isTargetSEAD = reqSigla === 'SMA' || reqSecretaria.toLowerCase().indexOf('administra') !== -1 || reqSecretaria.toLowerCase().indexOf('sead') !== -1;

      const anoCorrente = Utilities.formatDate(new Date(), TZ, 'yyyy');
      const numRows = sheetNum.getLastRow();
      const numCols = Math.max(sheetNum.getLastColumn(), 8);
      let headers = sheetNum.getRange(1, 1, 1, numCols).getValues()[0].map(function(h) { return String(h).trim(); });

      const idxDataHora = findColumnIndex(headers, ['datahora', 'data_hora', 'data', 'hora']);
      const idxTipo = findColumnIndex(headers, ['tipodocumento', 'tipo_documento', 'tipo', 'documento']);
      const idxNumero = findColumnIndex(headers, ['numero', 'num', 'numeracao']);
      const idxAssunto = findColumnIndex(headers, ['assunto', 'ementa', 'titulo']);
      const idxServidor = findColumnIndex(headers, ['servidor', 'usuario', 'autor', 'responsavel']);
      const idxDestinatario = findColumnIndex(headers, ['destinatario', 'destino', 'orgao', 'para']);
      let idxSecretaria = findColumnIndex(headers, ['secretaria', 'secretariaorigem', 'lotacao', 'orgao']);
      let idxDepartamento = findColumnIndex(headers, ['departamento', 'depto', 'divisao', 'setorinterno', 'setor']);

      // Auto-criação / Garantia de colunas G e H
      if (idxSecretaria === -1) {
        const colNovaSec = sheetNum.getLastColumn() + 1;
        sheetNum.getRange(1, colNovaSec).setValue('Secretaria').setFontWeight('bold').setBackground('#002b82').setFontColor('#ffffff');
        idxSecretaria = colNovaSec - 1;
      }
      if (idxDepartamento === -1) {
        const colNovaDep = sheetNum.getLastColumn() + 1;
        sheetNum.getRange(1, colNovaDep).setValue('Departamento').setFontWeight('bold').setBackground('#002b82').setFontColor('#ffffff');
        idxDepartamento = colNovaDep - 1;
      }

      headers = sheetNum.getRange(1, 1, 1, sheetNum.getLastColumn()).getValues()[0].map(function(h) { return String(h).trim(); });

      const colTipo = idxTipo !== -1 ? idxTipo + 1 : 2;
      const colNum = idxNumero !== -1 ? idxNumero + 1 : 3;
      const colSec = idxSecretaria + 1;

      let maiorSequencial = 0;
      if (numRows > 1) {
        const tiposRange = sheetNum.getRange(2, colTipo, numRows - 1, 1).getValues();
        const numerosRange = sheetNum.getRange(2, colNum, numRows - 1, 1).getValues();
        let secsRange = null;
        if (sheetNum.getLastColumn() >= colSec) {
          secsRange = sheetNum.getRange(2, colSec, numRows - 1, 1).getValues();
        }

        for (let i = 0; i < tiposRange.length; i++) {
          const tRow = tiposRange[i][0];
          const nRow = numerosRange[i][0];
          const sRow = secsRange ? String(secsRange[i][0] || '').trim().toLowerCase() : '';
          if (!tRow || !nRow) continue;

          const rowIsSEAD = !sRow || sRow.indexOf('administra') !== -1 || sRow.indexOf('sma') !== -1 || sRow.indexOf('sead') !== -1;
          const matchSec = isTargetSEAD ? rowIsSEAD : (sRow.indexOf(reqSecretaria.toLowerCase()) !== -1 || sRow.indexOf(reqSigla.toLowerCase()) !== -1);
          if (!matchSec) continue;

          if (normTipo(tRow) === tipoNormalizado) {
            let seq = 0;
            let anoDoc = anoCorrente;

            if (nRow instanceof Date) {
              seq = nRow.getDate() === 1 ? nRow.getMonth() + 1 : nRow.getDate();
              anoDoc = String(nRow.getFullYear());
            } else {
              const strNum = String(nRow).trim();
              const match = strNum.match(/^(\d+)[\/-](\d{4})/);
              if (match && match[1]) {
                seq = parseInt(match[1], 10);
                anoDoc = match[2];
              } else {
                const matchSimples = strNum.match(/^(\d+)/);
                if (matchSimples) seq = parseInt(matchSimples[1], 10);
              }
            }

            if (anoDoc === anoCorrente && seq > maiorSequencial) {
              maiorSequencial = seq;
            }
          }
        }
      }

      const proximoSequencial = maiorSequencial + 1;
      const numeroFormatado = pad3(proximoSequencial);
      const novoNumero = incluirSigla
        ? numeroFormatado + '/' + anoCorrente + ' - ' + reqSigla
        : numeroFormatado + '/' + anoCorrente;

      const dataHoraIso = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss");
      const assuntoFinal = req.assunto ? String(req.assunto).trim() : 'Sem assunto informado';
      const destinatarioFinal = req.destinatario ? String(req.destinatario).trim() : 'Administração Geral';

      const totalColunas = Math.max(headers.length, 8);
      const rowToAppend = new Array(totalColunas).fill('');

      rowToAppend[idxDataHora !== -1 ? idxDataHora : 0] = dataHoraIso;
      rowToAppend[idxTipo !== -1 ? idxTipo : 1] = tipoDoc;
      rowToAppend[idxNumero !== -1 ? idxNumero : 2] = novoNumero;
      rowToAppend[idxAssunto !== -1 ? idxAssunto : 3] = assuntoFinal;
      rowToAppend[idxServidor !== -1 ? idxServidor : 4] = reqServidor;
      rowToAppend[idxDestinatario !== -1 ? idxDestinatario : 5] = destinatarioFinal;
      rowToAppend[idxSecretaria !== -1 ? idxSecretaria : 6] = reqSecretaria;
      rowToAppend[idxDepartamento !== -1 ? idxDepartamento : 7] = reqDepartamento;

      sheetNum.appendRow(rowToAppend);

      const ultimaLinha = sheetNum.getLastRow();
      sheetNum.getRange(ultimaLinha, (idxNumero !== -1 ? idxNumero + 1 : 3)).setNumberFormat('@').setValue(novoNumero);

      const detalhesLog = 'Emitiu ' + tipoDoc + ' nº ' + novoNumero + ' | Pasta: ' + reqSecretaria + ' (' + reqDepartamento + ') | Dest: ' + destinatarioFinal + ' | Assunto: ' + assuntoFinal;
      registrarLog(reqServidor, 'GERAR_NUMERO', novoNumero, detalhesLog);

      return createJsonResponse({
        success: true,
        numeroGerado: novoNumero,
        sequencial: proximoSequencial,
        ano: anoCorrente,
        tipoDocumento: tipoDoc,
        assunto: assuntoFinal,
        destinatario: destinatarioFinal,
        secretaria: reqSecretaria,
        departamento: reqDepartamento,
        servidor: reqServidor,
        dataHora: dataHoraIso,
        incluirSigla: incluirSigla
      });
    }

    // 8. AÇÃO: ALTERAR_SENHA
    if (action === 'ALTERAR_SENHA') {
      const sheet = ss.getSheetByName('Usuarios');
      if (!sheet) throw new Error("Aba 'Usuarios' não configurada na planilha.");

      const matricula = String(req.matricula || '').trim();
      const senhaAtual = String(req.senhaAtual || '').trim();
      const novaSenha = String(req.novaSenha || '').trim();

      if (!matricula || !novaSenha) throw new Error('Matrícula e nova senha são obrigatórias.');
      if (novaSenha.length < 3) throw new Error('A nova senha deve possuir pelo menos 3 caracteres.');

      const data = sheet.getDataRange().getValues();
      const headers = data[0].map(function(h) { return String(h).trim(); });
      const idxMatricula = findColumnIndex(headers, ['matricula', 'mat', 'login']);
      const idxSenha = findColumnIndex(headers, ['senha', 'password', 'pass']);
      const idxNome = findColumnIndex(headers, ['nome', 'servidor', 'funcionario']);

      if (idxMatricula === -1 || idxSenha === -1) {
        throw new Error("Colunas 'Matrícula' ou 'Senha' não encontradas na aba Usuarios.");
      }

      let encontrado = false;
      for (let i = 1; i < data.length; i++) {
        let matSheet = String(data[i][idxMatricula] !== undefined ? data[i][idxMatricula] : '').trim();
        if (matSheet.endsWith('.0')) matSheet = matSheet.slice(0, -2);

        let matComp = matricula.endsWith('.0') ? matricula.slice(0, -2) : matricula;

        if (norm(matSheet) === norm(matComp)) {
          encontrado = true;
          const rawSen = data[i][idxSenha];

          if (senhaAtual && !confereSenha(rawSen, senhaAtual)) {
            throw new Error('A senha atual informada está incorreta.');
          }

          const novaSenhaHash = hashSenha(novaSenha);
          sheet.getRange(i + 1, idxSenha + 1).setNumberFormat('@').setValue(novaSenhaHash);

          const nomeUsuario = (idxNome !== -1 && data[i][idxNome]) ? data[i][idxNome] : matricula;
          registrarLog(nomeUsuario, 'ALTERAR_SENHA', matricula, 'Senha de acesso alterada com sucesso.');

          return createJsonResponse({
            success: true,
            message: 'Senha alterada com sucesso!'
          });
        }
      }

      if (!encontrado) {
        throw new Error('Servidor com matrícula ' + matricula + ' não encontrado na base de dados.');
      }
    }

    throw new Error("Ação '" + (action || 'desconhecida') + "' não reconhecida pelo backend.");

  } catch (error) {
    return createJsonResponse({ success: false, error: error.message || error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// =================================================================
// FUNÇÕES ADMINISTRATIVAS DE MANUTENÇÃO (EXECUÇÃO MANUAL NO APPS SCRIPT)
// =================================================================

/**
 * Corrige registros legados na aba 'Numeração':
 * - Restaura números que foram convertidos em Data pelo Sheets (ex: 01/01/2026 -> 001/2026)
 * - Aplica formatação '@' (texto puro) na coluna de número
 */
function corrigirDadosLegados() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetNum = ss.getSheetByName('Numeração') || ss.getSheetByName('Numeracao');
  if (!sheetNum || sheetNum.getLastRow() <= 1) {
    Logger.log('Aba Numeração vazia ou não encontrada.');
    return;
  }

  const data = sheetNum.getDataRange().getValues();
  const idxNum = findColumnIndex(data[0], ['numero', 'num', 'numeracao']);
  const colNum = idxNum !== -1 ? idxNum + 1 : 3;

  let corrigidos = 0;
  for (let i = 1; i < data.length; i++) {
    const val = data[i][colNum - 1];
    if (val instanceof Date) {
      const diaOuMes = val.getDate() === 1 ? val.getMonth() + 1 : val.getDate();
      const numTxt = pad3(diaOuMes) + '/' + val.getFullYear();
      sheetNum.getRange(i + 1, colNum).setNumberFormat('@').setValue(numTxt);
      corrigidos++;
    }
  }

  Logger.log('Manutenção concluída: ' + corrigidos + ' números corrigidos de Data para Texto puro.');
}

/**
 * Converte todas as senhas em texto puro na aba 'Usuarios' para o padrão hash SHA-256 + salt dinâmico
 */
function migrarSenhasParaHash() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Usuarios');
  if (!sheet || sheet.getLastRow() <= 1) return;

  const data = sheet.getDataRange().getValues();
  const idxSenha = findColumnIndex(data[0], ['senha', 'password', 'pass']);
  if (idxSenha === -1) return;

  let migradas = 0;
  for (let i = 1; i < data.length; i++) {
    let senha = String(data[i][idxSenha] || '').trim();
    if (senha.endsWith('.0')) senha = senha.slice(0, -2);
    if (senha && (senha.indexOf('sha256$') !== 0 || senha.split('$').length < 3)) {
      sheet.getRange(i + 1, idxSenha + 1).setNumberFormat('@').setValue(hashSenha(senha));
      migradas++;
    }
  }
  Logger.log('Senhas migradas com sucesso para SHA-256 + Salt: ' + migradas);
}