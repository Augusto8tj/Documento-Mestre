export const APPS_SCRIPT_CODE = `// =================================================================
//   Prefeitura Municipal de Rio Claro – RJ
//   Banco Mestre Administrativo Municipal — Backend API v4.1 (GAS)
//   Versão Consolidada: 8 Colunas Oficiais + Filtro de Acessibilidade + Autorização de Novos Servidores (PedidosAcesso)
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
//   5. Isolamento Estrito no Servidor por Secretaria, Departamento e Acessibilidade:
//      - Sigla canônica sem colisão (SMAS != SMA, SMS != SMAS, SEGOV = GP).
//      - Suporte à coluna 'AcessibilidadeDocs' na aba Usuarios (Secretaria / Departamento / Próprios).
//      - CARREGAR filtra Numeração, Sugestões e Servidores conforme token da sessão.
//      - GERAR_NUMERO valida permissão de Secretaria e fixa Departamento conforme escopo.
//      - Sequencial independente por pasta (001/ano) e proteção do histórico SEAD/SMA.
//   6. Suporte Universal a Requisições (POST / GET Fallback):
//      Aceita JSON via postData e parâmetros via query string (URL).
//   7. Blindagem contra Formatação de Data ('@') e Sequenciais > 999 (pad3).
//   8. Autoatendimento: Servidor pode atualizar seu próprio nome de exibição além da senha.
// =================================================================

const VERSAO = '4.5';
const TZ = 'America/Sao_Paulo';
const SESSAO_SEG = 12 * 3600; // 12 horas
const MAX_FALHAS = 5;
const SALT_FIXO_PADRAO = 'RioClaro_SGEP_Doc_2026';
const PROP_TIPOS_GLOBAIS = 'SGEP_TIPOS_SEQUENCIA_GLOBAL';
const DEFAULT_TIPOS_GLOBAIS = ['DECRETO', 'PORTARIA'];

function getConfigNumeracaoGlobal() {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(PROP_TIPOS_GLOBAIS);
    if (!raw) return DEFAULT_TIPOS_GLOBAIS.slice();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(function(t) { return normTipo(t); }).filter(Boolean);
    }
  } catch (e) {}
  return DEFAULT_TIPOS_GLOBAIS.slice();
}

function salvarConfigNumeracaoGlobal(tipos) {
  const clean = Array.isArray(tipos)
    ? tipos.map(function(t) { return normTipo(t); }).filter(Boolean)
    : DEFAULT_TIPOS_GLOBAIS.slice();
  PropertiesService.getScriptProperties().setProperty(PROP_TIPOS_GLOBAIS, JSON.stringify(clean));
  return clean;
}

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
    .replace(/[\\u0300-\\u036f]/g, '');
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
  const matchParen = str.match(/\\(([^)]+)\\)/);
  if (matchParen) {
    const paren = norm(matchParen[1]).toUpperCase();
    if (paren === 'SEAD' || paren === 'DRH') return 'SMA';
    if (paren === 'SMASC' || paren === 'SMASDH') return 'SMAS';
    if (paren === 'SMPS' || paren === 'FUNPREV') return 'IPRC';
    if (paren === 'SMMAA') return 'SMMA';
    if (paren === 'SEGOV') return 'GP';
    return paren;
  }
  const n = norm(str);
  if (n === 'todas' || n === 'todas as secretarias') return 'TODAS';
  if (n.indexOf('assistencia') !== -1 || n.indexOf('social') !== -1 || n.indexOf('cidadania') !== -1 || n.indexOf('direitos humanos') !== -1 || /\\bsmas\\b|\\bsmasc\\b|\\bsmasdh\\b/.test(n)) return 'SMAS';
  if (n.indexOf('saude') !== -1 || /\\bsms\\b/.test(n)) return 'SMS';
  if (n.indexOf('educacao') !== -1 || /\\bsme\\b/.test(n)) return 'SME';
  if (n.indexOf('fazenda') !== -1 || n.indexOf('financas') !== -1 || /\\bsmf\\b/.test(n)) return 'SMF';
  if (n.indexOf('obras') !== -1 || n.indexOf('planejamento urbano') !== -1 || /\\bsmosp\\b/.test(n)) return 'SMOSP';
  if (n.indexOf('meio ambiente') !== -1 || n.indexOf('agricultura') !== -1 || /\\bsmma\\b|\\bsmmaa\\b/.test(n)) return 'SMMA';
  if (n.indexOf('desenvolvimento economico') !== -1 || n.indexOf('cultura') !== -1 || n.indexOf('turismo') !== -1 || /\\bsmdec\\b/.test(n)) return 'SMDEC';
  if (n.indexOf('ordem publica') !== -1 || n.indexOf('guarda civil') !== -1 || /\\bsmop\\b/.test(n)) return 'SMOP';
  if (n.indexOf('previdencia') !== -1 || n.indexOf('funprev') !== -1 || /\\biprc\\b|\\bsmps\\b/.test(n)) return 'IPRC';
  if (n.indexOf('procuradoria') !== -1 || /\\bpgm\\b/.test(n)) return 'PGM';
  if (n.indexOf('controladoria') !== -1 || /\\bcgm\\b/.test(n)) return 'CGM';
  if (n.indexOf('gabinete') !== -1 || n.indexOf('prefeito') !== -1 || n.indexOf('governo') !== -1 || /\\bgp\\b|\\bsegov\\b/.test(n)) return 'GP';
  if (/\\bsma\\b|\\bsead\\b/.test(n) || n.indexOf('administracao') !== -1 || n === 'departamento de recursos humanos') return 'SMA';
  return str.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'SMA';
}

function mesmaSecretaria(secA, secB) {
  if (!secA || !secB) return false;
  return extrairSiglaSecretaria(secA) === extrairSiglaSecretaria(secB);
}

function mesmoDepartamento(depA, depB) {
  const a = norm(depA);
  const b = norm(depB);
  if (!a || !b) return false;
  return a === b;
}

function usuarioAutorizadoParaSecretaria(sessao, secAlvo) {
  if (!sessao) return false;
  if (normTipo(sessao.nivel) === 'ADMIN') return true;
  const lista = [];
  if (sessao.secretaria) lista.push(sessao.secretaria);
  if (Array.isArray(sessao.secretarias)) {
    sessao.secretarias.forEach(function(s) { if (s) lista.push(s); });
  }
  const expandida = [];
  lista.forEach(function(item) {
    String(item).split(/[,;]/).forEach(function(p) {
      if (p && p.trim()) expandida.push(p.trim());
    });
  });
  if (expandida.length === 0) return false;
  return expandida.some(function(secUser) {
    return mesmaSecretaria(secUser, secAlvo);
  });
}

function parseFiltroAcessibilidadeGas(raw, nivel, departamento) {
  const niv = normTipo(nivel || 'PADRAO');
  if (niv === 'ADMIN') {
    return { acessarSecretaria: true, acessarDepartamento: true, acessarProprios: true };
  }
  if (raw && typeof raw === 'object') {
    return {
      acessarSecretaria: Boolean(raw.acessarSecretaria),
      acessarDepartamento: Boolean(raw.acessarDepartamento),
      acessarProprios: Boolean(raw.acessarProprios)
    };
  }
  const str = String(raw || '').trim();
  if (str) {
    try {
      const parsed = JSON.parse(str);
      if (parsed && typeof parsed === 'object') {
        return {
          acessarSecretaria: Boolean(parsed.acessarSecretaria),
          acessarDepartamento: Boolean(parsed.acessarDepartamento),
          acessarProprios: Boolean(parsed.acessarProprios)
        };
      }
    } catch (e) {}
  }
  if (niv === 'EDITOR') {
    return { acessarSecretaria: true, acessarDepartamento: true, acessarProprios: true };
  }
  const dep = norm(departamento);
  if (dep && dep !== 'todos' && dep !== 'todas' && dep !== 'geral' && dep !== 'nao informado') {
    return { acessarSecretaria: false, acessarDepartamento: true, acessarProprios: true };
  }
  return { acessarSecretaria: true, acessarDepartamento: true, acessarProprios: true };
}

function usuarioRestritoADepartamento(sessao) {
  if (!sessao) return false;
  if (normTipo(sessao.nivel || 'PADRAO') === 'ADMIN') return false;
  const dep = norm(sessao.departamento);
  if (!dep || dep === 'todos' || dep === 'todas' || dep === 'geral' || dep === 'nao informado') return false;
  const filtro = parseFiltroAcessibilidadeGas(sessao.filtroAcessibilidade, sessao.nivel, sessao.departamento);
  return !filtro.acessarSecretaria;
}

function registroDoProprioServidor(sessao, servStr) {
  if (!sessao || !servStr) return false;
  const docUser = norm(servStr);
  const mat = norm(sessao.matricula);
  const nome = norm(sessao.nome);
  if (mat && docUser.indexOf(mat) !== -1) return true;
  if (nome && nome.length >= 3 && docUser.indexOf(nome) !== -1) return true;
  return false;
}

function usuarioPodeVisualizarNumeracao(sessao, secStr, deptoStr, servStr) {
  if (!sessao) return false;
  if (normTipo(sessao.nivel) === 'ADMIN') return true;
  if (!usuarioAutorizadoParaSecretaria(sessao, secStr)) return false;

  const filtro = parseFiltroAcessibilidadeGas(sessao.filtroAcessibilidade, sessao.nivel, sessao.departamento);
  if (filtro.acessarSecretaria) return true;

  const depSessao = norm(sessao.departamento);
  const temDeptoEspecifico = Boolean(depSessao && depSessao !== 'todos' && depSessao !== 'todas' && depSessao !== 'geral' && depSessao !== 'nao informado');
  const mesmoDepto = filtro.acessarDepartamento && temDeptoEspecifico && mesmoDepartamento(deptoStr, sessao.departamento);
  const proprio = filtro.acessarProprios && registroDoProprioServidor(sessao, servStr);

  return mesmoDepto || proprio;
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
  const idxCargo = findColumnIndex(headers, ['cargo', 'cargoefetivo', 'funcao']);
  const idxFuncao = findColumnIndex(headers, ['funcaogratificada', 'funcao_gratificada', 'cargocomissao', 'cargo_comissao', 'comissao', 'fg']);
  const idxAcess = findColumnIndex(headers, ['acessibilidadedocs', 'acessibilidade', 'filtrodocs', 'permissoesdocs']);

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
        const funcaoGratificada = (idxFuncao !== -1 && row[idxFuncao]) ? String(row[idxFuncao]).trim() : '';
        const rawAcess = (idxAcess !== -1 && row[idxAcess]) ? String(row[idxAcess]).trim() : '';
        const filtroAcessibilidade = rawAcess ? parseFiltroAcessibilidadeGas(rawAcess, nivelAcesso, depto) : undefined;

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
          cargo: cargo,
          funcaoGratificada: funcaoGratificada,
          acessibilidadeDocs: rawAcess,
          filtroAcessibilidade: filtroAcessibilidade
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

    const token = (e && e.parameter && e.parameter.token) ? String(e.parameter.token).trim() : '';
    const sessao = token ? validarSessao(token) : null;
    const sessaoExpirada = Boolean(token && !sessao);
    const podeLerNumeracao = Boolean(sessao);
    const filtrarPorSessao = Boolean(sessao && normTipo(sessao.nivel) !== 'ADMIN');

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

    // 2. Extrair Histórico e Sugestões da Aba 'Numeração' (filtrado pelo escopo da sessão)
    const sugestoes = {
      destinatarios: [],
      assuntos: [],
      secretarias: [
        'Secretaria Municipal de Governo (SEGOV)',
        'Secretaria Municipal de Administração (SMA)',
        'Secretaria Municipal de Finanças (SMF)',
        'Secretaria Municipal de Previdência Social (IPRC)',
        'Secretaria Municipal de Educação (SME)',
        'Secretaria Municipal de Assistência Social e Direitos Humanos (SMAS)',
        'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos (SMOSP)',
        'Secretaria Municipal de Meio Ambiente e Agricultura (SMMA)',
        'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer (SMDEC)',
        'Secretaria Municipal de Ordem Pública (SMOP)',
        'Secretaria Municipal de Saúde (SMS)',
        'Procuradoria-Geral do Município (PGM)',
        'Controladoria-Geral do Município (CGM)'
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
    if (sheetNum && podeLerNumeracao) {
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
          const deptoStr = String(rawDepto || '').trim() || (mesmaSecretaria(secStr, 'SMA') ? 'Departamento de Recursos Humanos (DRH)' : 'Gabinete');

          // Isolamento estrito por Secretaria, Departamento e Filtro de Acessibilidade no servidor
          if (filtrarPorSessao) {
            if (!usuarioPodeVisualizarNumeracao(sessao, secStr, deptoStr, servStr)) continue;
          }

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
        if (!filtrarPorSessao) {
          sugestoes.secretarias = Array.from(secSet).filter(Boolean).sort();
          sugestoes.departamentos = Array.from(depSet).filter(Boolean).sort();
        }
      }
    }

    // 3. Extrair Lista Central de Servidores para Autocomplete do Login / Signatários (Sem Senhas)
    const sheetUsers = ss.getSheetByName('Usuarios');
    if (sheetUsers) {
      const dataUsers = sheetUsers.getDataRange().getValues();
      if (dataUsers.length > 1) {
        const uHeaders = dataUsers[0].map(function(h) { return String(h).trim(); });
        const idxM = findColumnIndex(uHeaders, ['matricula', 'mat', 'login']);
        const idxN = findColumnIndex(uHeaders, ['nome', 'servidor', 'funcionario']);
        const idxS = findColumnIndex(uHeaders, ['secretaria', 'secretarias', 'setor', 'lotacao', 'orgao']);
        const idxD = findColumnIndex(uHeaders, ['departamento', 'depto', 'divisao']);
        const idxC = findColumnIndex(uHeaders, ['cargo', 'cargoefetivo', 'funcao']);
        const idxF = findColumnIndex(uHeaders, ['funcaogratificada', 'funcao_gratificada', 'cargocomissao', 'cargo_comissao', 'comissao', 'fg']);
        const idxL = findColumnIndex(uHeaders, ['nivelacesso', 'nivel', 'perfil', 'role', 'acesso']);
        const idxA = findColumnIndex(uHeaders, ['ativo', 'status', 'situacao']);
        const idxAc = findColumnIndex(uHeaders, ['acessibilidadedocs', 'acessibilidade', 'filtrodocs', 'permissoesdocs']);

        const isSessaoAdmin = Boolean(sessao && String(sessao.nivel || '').toUpperCase() === 'ADMIN');

        if (idxM !== -1) {
          for (let u = 1; u < dataUsers.length; u++) {
            const uRow = dataUsers[u];
            let uAtivoBool = true;
            if (idxA !== -1) {
              const uAtivoStr = String(uRow[idxA]).trim().toUpperCase();
              if (uAtivoStr === 'FALSE' || uAtivoStr === 'INATIVO' || uAtivoStr === 'NÃO' || uAtivoStr === 'NAO' || uAtivoStr === '0') {
                uAtivoBool = false;
              }
            }
            // Administradores visualizam também servidores inativos/pendentes de autorização
            if (!uAtivoBool && !isSessaoAdmin) continue;

            let uMat = String(uRow[idxM] !== undefined ? uRow[idxM] : '').trim();
            if (uMat.endsWith('.0')) uMat = uMat.slice(0, -2);
            if (!uMat) continue;

            const uNome = (idxN !== -1 && uRow[idxN]) ? String(uRow[idxN]).trim() : '';
            const uSec = (idxS !== -1 && uRow[idxS]) ? String(uRow[idxS]).trim() : '';
            const uDepto = (idxD !== -1 && uRow[idxD]) ? String(uRow[idxD]).trim() : '';
            const uCargo = (idxC !== -1 && uRow[idxC]) ? String(uRow[idxC]).trim() : '';
            const uFuncao = (idxF !== -1 && uRow[idxF]) ? String(uRow[idxF]).trim() : '';
            const uNivel = (idxL !== -1 && uRow[idxL]) ? String(uRow[idxL]).trim().toUpperCase() : 'PADRAO';
            const uAcessRaw = (idxAc !== -1 && uRow[idxAc]) ? String(uRow[idxAc]).trim() : '';
            const uFiltro = uAcessRaw ? parseFiltroAcessibilidadeGas(uAcessRaw, uNivel, uDepto) : undefined;

            // Quando autenticado como não-ADMIN, filtra signatários para o mesmo escopo
            if (filtrarPorSessao) {
              const uSecLista = uSec.split(/[,;]/).map(function(p) { return p.trim(); }).filter(Boolean);
              const uAutorizado = uSecLista.some(function(s) { return usuarioAutorizadoParaSecretaria(sessao, s); });
              if (!uAutorizado) continue;
              if (usuarioRestritoADepartamento(sessao) && !mesmoDepartamento(uDepto, sessao.departamento)) continue;
            }

            sugestoes.servidores.push({
              matricula: uMat,
              nome: uNome,
              secretaria: uSec,
              departamento: uDepto,
              cargo: uCargo,
              funcaoGratificada: uFuncao,
              nivel: uNivel,
              ativo: uAtivoBool,
              acessibilidadeDocs: uAcessRaw,
              filtroAcessibilidade: uFiltro
            });
          }
        }
      }
    }

    // 4. Carregar Fila de Solicitações de Novos Cadastros e Redefinição de Senha (somente para ADMIN)
    let pedidosAcesso = [];
    if (sessao && String(sessao.nivel || '').toUpperCase() === 'ADMIN') {
      const sheetPedidos = ss.getSheetByName('PedidosAcesso');
      if (sheetPedidos) {
        const dataPed = sheetPedidos.getDataRange().getValues();
        if (dataPed.length > 1) {
          const pHeaders = dataPed[0].map(function(h) { return String(h).trim(); });
          const pIdxId = findColumnIndex(pHeaders, ['id']);
          const pIdxData = findColumnIndex(pHeaders, ['datahora', 'data']);
          const pIdxMat = findColumnIndex(pHeaders, ['matricula', 'mat']);
          const pIdxNome = findColumnIndex(pHeaders, ['nome', 'servidor']);
          const pIdxCargo = findColumnIndex(pHeaders, ['cargo', 'funcao']);
          const pIdxSec = findColumnIndex(pHeaders, ['secretaria', 'lotacao']);
          const pIdxDepto = findColumnIndex(pHeaders, ['departamento', 'depto', 'setor']);
          const pIdxContato = findColumnIndex(pHeaders, ['contato', 'telefone', 'whatsapp']);
          const pIdxTipo = findColumnIndex(pHeaders, ['tipo']);
          const pIdxStatus = findColumnIndex(pHeaders, ['status', 'situacao']);
          const pIdxResEm = findColumnIndex(pHeaders, ['resolvidoem']);
          const pIdxResPor = findColumnIndex(pHeaders, ['resolvidopor']);
          const pIdxSenhaProv = findColumnIndex(pHeaders, ['senhaprovisoria']);

          for (let p = dataPed.length - 1; p >= 1; p--) {
            const pr = dataPed[p];
            let pMat = pIdxMat !== -1 ? String(pr[pIdxMat] == null ? '' : pr[pIdxMat]).trim() : '';
            if (pMat.endsWith('.0')) pMat = pMat.slice(0, -2);
            if (!pMat) continue;
            pedidosAcesso.push({
              id: (pIdxId !== -1 && pr[pIdxId]) ? String(pr[pIdxId]).trim() : ('ped-' + p),
              dataHora: (pIdxData !== -1 && pr[pIdxData]) ? String(pr[pIdxData]).trim() : '',
              matricula: pMat,
              nome: (pIdxNome !== -1 && pr[pIdxNome]) ? String(pr[pIdxNome]).trim() : '',
              cargo: (pIdxCargo !== -1 && pr[pIdxCargo]) ? String(pr[pIdxCargo]).trim() : '',
              secretaria: (pIdxSec !== -1 && pr[pIdxSec]) ? String(pr[pIdxSec]).trim() : '',
              departamento: (pIdxDepto !== -1 && pr[pIdxDepto]) ? String(pr[pIdxDepto]).trim() : '',
              contato: (pIdxContato !== -1 && pr[pIdxContato]) ? String(pr[pIdxContato]).trim() : '',
              tipo: (pIdxTipo !== -1 && pr[pIdxTipo]) ? String(pr[pIdxTipo]).trim().toUpperCase() : 'REDEFINICAO',
              status: (pIdxStatus !== -1 && pr[pIdxStatus]) ? String(pr[pIdxStatus]).trim().toUpperCase() : 'PENDENTE',
              resolvidoEm: (pIdxResEm !== -1 && pr[pIdxResEm]) ? String(pr[pIdxResEm]).trim() : '',
              resolvidoPor: (pIdxResPor !== -1 && pr[pIdxResPor]) ? String(pr[pIdxResPor]).trim() : '',
              senhaProvisoria: (pIdxSenhaProv !== -1 && pr[pIdxSenhaProv]) ? String(pr[pIdxSenhaProv]).trim() : ''
            });
          }
        }
      }
    }

    const listaNumeracaoOrdenada = registrosNumeracao.reverse();

    return createJsonResponse({
      success: true,
      sessaoExpirada: sessaoExpirada,
      data: records,
      sugestoes: sugestoes,
      numeracoes: listaNumeracaoOrdenada,
      registrosNumeracao: listaNumeracaoOrdenada,
      pedidosAcesso: pedidosAcesso,
      configNumeracao: {
        tiposSequenciaGlobal: getConfigNumeracaoGlobal()
      },
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
      return doGet({ parameter: { token: req.token || '' } });
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
      let idxCargo = findColumnIndex(headers, ['cargo', 'cargoefetivo', 'funcao']);
      let idxFuncao = findColumnIndex(headers, ['funcaogratificada', 'funcao_gratificada', 'cargocomissao', 'cargo_comissao', 'comissao', 'fg']);
      let idxAcess = findColumnIndex(headers, ['acessibilidadedocs', 'acessibilidade', 'filtrodocs', 'permissoesdocs']);

      const cargoPayload = u.cargo !== undefined ? String(u.cargo || '').trim() : undefined;
      const funcaoPayload = u.funcaoGratificada !== undefined ? String(u.funcaoGratificada || '').trim() : undefined;

      if (idxCargo === -1 && cargoPayload) {
        const nextCol = headers.length + 1;
        sheet.getRange(1, nextCol).setValue('Cargo').setFontWeight('bold').setBackground('#002b82').setFontColor('#ffffff');
        headers.push('Cargo');
        idxCargo = nextCol - 1;
      }

      if (idxFuncao === -1 && funcaoPayload) {
        const nextCol = headers.length + 1;
        sheet.getRange(1, nextCol).setValue('FuncaoGratificada').setFontWeight('bold').setBackground('#002b82').setFontColor('#ffffff');
        headers.push('FuncaoGratificada');
        idxFuncao = nextCol - 1;
      }

      const acessPayload = u.acessibilidadeDocs !== undefined
        ? String(u.acessibilidadeDocs)
        : (u.filtroAcessibilidade ? JSON.stringify(u.filtroAcessibilidade) : '');

      if (idxAcess === -1 && acessPayload) {
        const nextCol = headers.length + 1;
        sheet.getRange(1, nextCol).setValue('AcessibilidadeDocs').setFontWeight('bold').setBackground('#002b82').setFontColor('#ffffff');
        headers.push('AcessibilidadeDocs');
        idxAcess = nextCol - 1;
      }

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

      const adminLogado = req.usuarioAdmin || 'Administrador';

      if (rowIndex !== -1) {
        // Atualização de Servidor Existente
        if (idxNome !== -1 && u.nome) sheet.getRange(rowIndex, idxNome + 1).setValue(u.nome);
        if (idxNivel !== -1 && u.nivel) sheet.getRange(rowIndex, idxNivel + 1).setValue(u.nivel);
        if (idxSec !== -1 && secFinal) sheet.getRange(rowIndex, idxSec + 1).setValue(secFinal);
        if (idxDepto !== -1 && u.departamento !== undefined) sheet.getRange(rowIndex, idxDepto + 1).setValue(u.departamento);
        if (idxCargo !== -1 && cargoPayload !== undefined) sheet.getRange(rowIndex, idxCargo + 1).setValue(cargoPayload);
        if (idxFuncao !== -1 && funcaoPayload !== undefined) sheet.getRange(rowIndex, idxFuncao + 1).setValue(funcaoPayload);
        const ativoParsed = u.ativo === undefined
          ? undefined
          : (u.ativo === true || String(u.ativo).trim().toLowerCase() === 'true');
        if (idxAtivo !== -1 && ativoParsed !== undefined) sheet.getRange(rowIndex, idxAtivo + 1).setValue(ativoParsed);
        if (idxAcess !== -1 && (u.acessibilidadeDocs !== undefined || u.filtroAcessibilidade)) {
          sheet.getRange(rowIndex, idxAcess + 1).setNumberFormat('@').setValue(acessPayload);
        }

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
        const ativoNovo = u.ativo === undefined
          ? true
          : (u.ativo === true || String(u.ativo).trim().toLowerCase() === 'true');

        const novaLinha = headers.map(function(h) {
          const nh = norm(h);
          if (nh === 'id' || nh.indexOf('id') === 0) return novoID;
          if (nh.indexOf('nome') !== -1) return u.nome;
          if (nh.indexOf('matricula') !== -1 || nh === 'mat') return matInput;
          if (nh.indexOf('senha') !== -1 || nh.indexOf('password') !== -1) return senhaDef;
          if (nh.indexOf('nivel') !== -1) return u.nivel || 'PADRAO';
          if (nh.indexOf('secretaria') !== -1 || nh.indexOf('lotacao') !== -1) return secFinal;
          if (nh.indexOf('departamento') !== -1 || nh.indexOf('depto') !== -1) return u.departamento || 'Gabinete';
          if (nh.indexOf('funcaogratificada') !== -1 || nh.indexOf('cargocomissao') !== -1 || nh === 'fg') return funcaoPayload || '';
          if (nh === 'cargo' || nh === 'cargoefetivo') return cargoPayload || '';
          if (nh.indexOf('ativo') !== -1) return ativoNovo;
          if (nh.indexOf('acessibilidade') !== -1 || nh.indexOf('filtrodocs') !== -1) return acessPayload;
          return '';
        });

        sheet.appendRow(novaLinha);
        sheet.getRange(sheet.getLastRow(), idxMat + 1).setNumberFormat('@').setValue(matInput);

        registrarLog(adminLogado, 'CRIAR_SERVIDOR', matInput, 'Cadastro do servidor ' + (u.nome || matInput) + (ativoNovo ? ' (Ativo)' : ' (Pendente de Autorização)'));
        return createJsonResponse({
          success: true,
          message: ativoNovo ? 'Novo servidor cadastrado com sucesso!' : 'Solicitação de cadastro registrada! Aguardando autorização do Administrador.',
          novoID: novoID
        });
      }
    }

    // 4B. AÇÃO: CRIAR_PEDIDO_ACESSO (Solicitações de Novo Cadastro e Redefinição de Senha)
    if (action === 'CRIAR_PEDIDO_ACESSO') {
      const p = req.pedido || req;
      const matPed = String(p.matricula || '').trim();
      if (!matPed) throw new Error('Matrícula obrigatória para registrar solicitação.');

      let sheetPed = ss.getSheetByName('PedidosAcesso');
      if (!sheetPed) {
        sheetPed = ss.insertSheet('PedidosAcesso');
        sheetPed.appendRow(['ID', 'DataHora', 'Matricula', 'Nome', 'Cargo', 'Secretaria', 'Departamento', 'Contato', 'Tipo', 'Status', 'ResolvidoEm', 'ResolvidoPor', 'SenhaProvisoria']);
        sheetPed.getRange('A1:M1').setFontWeight('bold').setBackground('#002b82').setFontColor('#ffffff');
      }

      const idPed = String(p.id || ('ped-' + Date.now()));
      const dataHoraPed = String(p.dataHora || Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm'));
      sheetPed.appendRow([
        idPed,
        dataHoraPed,
        matPed,
        String(p.nome || ''),
        String(p.cargo || 'Servidor Municipal'),
        String(p.secretaria || ''),
        String(p.departamento || ''),
        String(p.contato || ''),
        String(p.tipo || 'REDEFINICAO').toUpperCase(),
        'PENDENTE',
        '',
        '',
        ''
      ]);
      sheetPed.getRange(sheetPed.getLastRow(), 3).setNumberFormat('@').setValue(matPed);

      registrarLog(p.nome || ('Matrícula ' + matPed), 'SOLICITACAO_ACESSO', matPed, 'Nova solicitação (' + (p.tipo || 'REDEFINICAO') + ') aguardando autorização do Administrador.');
      return createJsonResponse({ success: true, id: idPed, message: 'Solicitação registrada na planilha para autorização do Administrador.' });
    }

    // 4C. AÇÃO: ATUALIZAR_PEDIDO_ACESSO (Aprovação ou Recusa pelo Administrador)
    if (action === 'ATUALIZAR_PEDIDO_ACESSO') {
      const sheetPed = ss.getSheetByName('PedidosAcesso');
      if (!sheetPed) {
        return createJsonResponse({ success: true, message: 'Aba PedidosAcesso ainda não criada.' });
      }
      const dataPed = sheetPed.getDataRange().getValues();
      const idTarget = String(req.id || '').trim();
      const matTarget = String(req.matricula || '').trim();
      const novoStatus = String(req.status || 'ATENDIDO').toUpperCase();

      for (let i = 1; i < dataPed.length; i++) {
        const rowId = String(dataPed[i][0] || '').trim();
        let rowMat = String(dataPed[i][2] || '').trim();
        if (rowMat.endsWith('.0')) rowMat = rowMat.slice(0, -2);
        const rowStatus = String(dataPed[i][9] || '').trim().toUpperCase();

        if ((idTarget && rowId === idTarget) || (!idTarget && matTarget && norm(rowMat) === norm(matTarget) && rowStatus === 'PENDENTE')) {
          sheetPed.getRange(i + 1, 10).setValue(novoStatus);
          if (req.resolvidoEm) sheetPed.getRange(i + 1, 11).setValue(String(req.resolvidoEm));
          if (req.resolvidoPor) sheetPed.getRange(i + 1, 12).setValue(String(req.resolvidoPor));
          if (req.senhaProvisoria !== undefined) sheetPed.getRange(i + 1, 13).setNumberFormat('@').setValue(String(req.senhaProvisoria));
          break;
        }
      }
      return createJsonResponse({ success: true, message: 'Status da solicitação atualizado para ' + novoStatus + '.' });
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

    // 5B. AÇÃO: EXCLUIR_USUARIO (Recusar cadastro pendente / Remover servidor inativo — Exclusivo ADMIN)
    if (action === 'EXCLUIR_USUARIO') {
      const sessaoAdmin = req.token ? validarSessao(req.token) : null;
      if (sessaoAdmin && normTipo(sessaoAdmin.nivel) !== 'ADMIN') {
        throw new Error('Acesso negado: apenas Administradores podem recusar ou excluir cadastros de servidores.');
      }

      const matInput = String(req.matricula || '').trim();
      if (!matInput) throw new Error('Informe a matrícula do servidor para recusa/exclusão.');
      if (norm(matInput) === '1001') {
        throw new Error('O administrador mestre (matrícula 1001) é protegido e não pode ser removido.');
      }

      const sheet = ss.getSheetByName('Usuarios');
      if (!sheet) throw new Error("Aba 'Usuarios' não configurada.");

      const motivo = String(req.motivo || 'Cadastro recusado pelo administrador').trim();
      const autor = req.usuarioAdmin || (sessaoAdmin ? sessaoAdmin.nome : 'Administrador');

      const lock = LockService.getScriptLock();
      lock.waitLock(15000);
      try {
        const data = sheet.getDataRange().getValues();
        const idxMat = findColumnIndex(data[0], ['matricula', 'mat']);
        const idxNome = findColumnIndex(data[0], ['nome', 'servidor', 'usuario']);
        if (idxMat === -1) throw new Error("Coluna 'Matricula' não encontrada na aba Usuarios.");

        let rowIndex = -1;
        let nomeRemovido = '';
        for (let i = data.length - 1; i >= 1; i--) {
          let cellMat = String(data[i][idxMat] == null ? '' : data[i][idxMat]).trim();
          if (cellMat.endsWith('.0')) cellMat = cellMat.slice(0, -2);
          if (norm(cellMat) === norm(matInput)) {
            rowIndex = i + 1;
            if (idxNome !== -1) nomeRemovido = String(data[i][idxNome] || '').trim();
            sheet.deleteRow(rowIndex);
            break;
          }
        }

        // Também marca eventual pedido pendente dessa matrícula como CANCELADO na aba PedidosAcesso
        const sheetPed = ss.getSheetByName('PedidosAcesso');
        if (sheetPed) {
          const dataPed = sheetPed.getDataRange().getValues();
          const dataHoraAtual = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm');
          for (let j = 1; j < dataPed.length; j++) {
            let rowMatPed = String(dataPed[j][2] || '').trim();
            if (rowMatPed.endsWith('.0')) rowMatPed = rowMatPed.slice(0, -2);
            const rowStatusPed = String(dataPed[j][9] || '').trim().toUpperCase();
            if (norm(rowMatPed) === norm(matInput) && rowStatusPed === 'PENDENTE') {
              sheetPed.getRange(j + 1, 10).setValue('CANCELADO');
              sheetPed.getRange(j + 1, 11).setValue(dataHoraAtual);
              sheetPed.getRange(j + 1, 12).setValue(autor);
            }
          }
        }

        registrarLog(
          autor,
          'RECUSAR_SERVIDOR',
          matInput,
          'Cadastro ' + (nomeRemovido ? 'de ' + nomeRemovido + ' ' : '') + '(Matrícula ' + matInput + ') recusado/removido. Motivo: ' + motivo
        );

        return createJsonResponse({
          success: true,
          removido: rowIndex !== -1,
          message: rowIndex !== -1
            ? 'Cadastro do servidor matrícula ' + matInput + ' recusado e removido da planilha.'
            : 'Matrícula ' + matInput + ' já não constava na aba Usuarios.'
        });
      } finally {
        lock.releaseLock();
      }
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
          const match = String(data[i][idCol] || '').match(/MOD-(\\d+)/i);
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

      const sessaoEmissor = req.token ? validarSessao(req.token) : null;

      const rawTipo = req.tipoDocumento ? String(req.tipoDocumento).trim() : 'MEMORANDO';
      const tipoDoc = rawTipo.toUpperCase();
      const tipoNormalizado = normTipo(rawTipo);

      let reqSecretaria = req.secretaria ? String(req.secretaria).trim() : 'Secretaria Municipal de Administração (SMA)';
      let reqDepartamento = req.departamento ? String(req.departamento).trim() : 'Departamento de Recursos Humanos (DRH)';
      const reqServidor = req.servidor || req.usuarioLogado ? String(req.servidor || req.usuarioLogado).trim() : 'Servidor Municipal';

      if (sessaoEmissor && normTipo(sessaoEmissor.nivel) !== 'ADMIN') {
        if (!usuarioAutorizadoParaSecretaria(sessaoEmissor, reqSecretaria)) {
          throw new Error('Acesso negado: sua matrícula (' + sessaoEmissor.matricula + ') não possui autorização para emitir documentos pela pasta "' + reqSecretaria + '".');
        }
        if (usuarioRestritoADepartamento(sessaoEmissor)) {
          reqDepartamento = String(sessaoEmissor.departamento).trim();
        }
      }

      const reqSigla = extrairSiglaSecretaria(reqSecretaria);
      const tiposGlobaisAtivos = getConfigNumeracaoGlobal();
      const usarSequenciaGlobal =
        req.sequenciaGlobal === true ||
        req.sequenciaGlobal === 'true' ||
        tiposGlobaisAtivos.indexOf(tipoNormalizado) !== -1;
      const incluirSigla = !usarSequenciaGlobal && (req.incluirSigla === true || req.incluirSigla === 'true');

      const isTargetSEAD = reqSigla === 'SMA';

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
          const sRow = secsRange ? String(secsRange[i][0] || '').trim() : '';
          if (!tRow || !nRow) continue;

          if (!usarSequenciaGlobal) {
            const rowIsSEAD = !sRow || mesmaSecretaria(sRow, 'SMA');
            const matchSec = isTargetSEAD ? rowIsSEAD : mesmaSecretaria(sRow, reqSecretaria);
            if (!matchSec) continue;
          }

          if (normTipo(tRow) === tipoNormalizado) {
            let seq = 0;
            let anoDoc = anoCorrente;

            if (nRow instanceof Date) {
              seq = nRow.getDate() === 1 ? nRow.getMonth() + 1 : nRow.getDate();
              anoDoc = String(nRow.getFullYear());
            } else {
              const strNum = String(nRow).trim();
              const match = strNum.match(/^(\\d+)[\\/-](\\d{4})/);
              if (match && match[1]) {
                seq = parseInt(match[1], 10);
                anoDoc = match[2];
              } else {
                const matchSimples = strNum.match(/^(\\d+)/);
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

      const detalhesLog = 'Emitiu ' + tipoDoc + ' nº ' + novoNumero + (usarSequenciaGlobal ? ' [Global Municipal]' : '') + ' | Pasta: ' + reqSecretaria + ' (' + reqDepartamento + ') | Dest: ' + destinatarioFinal + ' | Assunto: ' + assuntoFinal;
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
        incluirSigla: incluirSigla,
        sequenciaGlobal: usarSequenciaGlobal
      });
    }

    // 7B. AÇÃO: DEFINIR_MARCO_ZERO (Carga Inicial de Numeração em Implantação — Exclusivo ADMIN)
    if (action === 'DEFINIR_MARCO_ZERO') {
      const sessaoAdmin = req.token ? validarSessao(req.token) : null;
      if (sessaoAdmin && normTipo(sessaoAdmin.nivel) !== 'ADMIN') {
        throw new Error('Acesso negado: apenas Administradores podem registrar Marco Zero de numeração.');
      }

      let sheetNum = ss.getSheetByName('Numeração') || ss.getSheetByName('Numeracao');
      if (!sheetNum) {
        sheetNum = ss.insertSheet('Numeração');
        sheetNum.appendRow(['DataHora', 'TipoDocumento', 'Numero', 'Assunto', 'Servidor', 'Destinatario', 'Secretaria', 'Departamento']);
        sheetNum.getRange('A1:H1').setFontWeight('bold').setBackground('#002b82').setFontColor('#ffffff');
      }

      const rawTipo = req.tipoDocumento ? String(req.tipoDocumento).trim() : 'OFICIO';
      const tipoDoc = rawTipo.toUpperCase();
      const tipoNormalizado = normTipo(rawTipo);
      const ultimoNum = parseInt(req.ultimoNumero, 10);
      if (isNaN(ultimoNum) || ultimoNum < 1) {
        throw new Error('Informe um número inteiro maior ou igual a 1 para o Marco Zero.');
      }

      const anoRef = (req.ano && /^\\d{4}$/.test(String(req.ano).trim()))
        ? String(req.ano).trim()
        : Utilities.formatDate(new Date(), TZ, 'yyyy');

      const reqSecretaria = req.secretaria ? String(req.secretaria).trim() : 'Gabinete do Prefeito';
      const reqDepartamento = req.departamento ? String(req.departamento).trim() : 'Gabinete';
      const reqServidor = req.servidor || req.usuarioLogado || (sessaoAdmin ? sessaoAdmin.nome : 'Administrador');
      const reqSigla = extrairSiglaSecretaria(reqSecretaria);

      const tiposGlobaisAtivos = getConfigNumeracaoGlobal();
      const usarSequenciaGlobal =
        req.sequenciaGlobal === true ||
        req.sequenciaGlobal === 'true' ||
        tiposGlobaisAtivos.indexOf(tipoNormalizado) !== -1;
      const incluirSigla = !usarSequenciaGlobal && (req.incluirSigla === true || req.incluirSigla === 'true');
      const isTargetSEAD = reqSigla === 'SMA';

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
        const secsRange = sheetNum.getLastColumn() >= colSec
          ? sheetNum.getRange(2, colSec, numRows - 1, 1).getValues()
          : null;

        for (let i = 0; i < tiposRange.length; i++) {
          const tRow = tiposRange[i][0];
          const nRow = numerosRange[i][0];
          const sRow = secsRange ? String(secsRange[i][0] || '').trim() : '';
          if (!tRow || !nRow) continue;

          if (!usarSequenciaGlobal) {
            const rowIsSEAD = !sRow || mesmaSecretaria(sRow, 'SMA');
            const matchSec = isTargetSEAD ? rowIsSEAD : mesmaSecretaria(sRow, reqSecretaria);
            if (!matchSec) continue;
          }

          if (normTipo(tRow) === tipoNormalizado) {
            let seq = 0;
            let anoDoc = anoRef;
            if (nRow instanceof Date) {
              seq = nRow.getDate() === 1 ? nRow.getMonth() + 1 : nRow.getDate();
              anoDoc = String(nRow.getFullYear());
            } else {
              const strNum = String(nRow).trim();
              const match = strNum.match(/^(\\d+)[\\/-](\\d{4})/);
              if (match && match[1]) {
                seq = parseInt(match[1], 10);
                anoDoc = match[2];
              }
            }
            if (anoDoc === anoRef && seq > maiorSequencial) maiorSequencial = seq;
          }
        }
      }

      if (ultimoNum <= maiorSequencial) {
        throw new Error('O número informado (' + pad3(ultimoNum) + '/' + anoRef + ') não pode ser menor ou igual ao maior número já registrado (' + pad3(maiorSequencial) + '/' + anoRef + ').');
      }

      const numeroMarcoZero = incluirSigla
        ? pad3(ultimoNum) + '/' + anoRef + ' - ' + reqSigla
        : pad3(ultimoNum) + '/' + anoRef;
      const proximoNumero = incluirSigla
        ? pad3(ultimoNum + 1) + '/' + anoRef + ' - ' + reqSigla
        : pad3(ultimoNum + 1) + '/' + anoRef;

      const obs = req.observacao ? String(req.observacao).trim() : 'Último número emitido no livro anterior';
      const assuntoFinal = '[MARCO ZERO DE IMPLANTAÇÃO] ' + obs;
      const dataHoraIso = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss");

      const totalColunas = Math.max(headers.length, 8);
      const rowToAppend = new Array(totalColunas).fill('');
      rowToAppend[idxDataHora !== -1 ? idxDataHora : 0] = dataHoraIso;
      rowToAppend[idxTipo !== -1 ? idxTipo : 1] = tipoDoc;
      rowToAppend[idxNumero !== -1 ? idxNumero : 2] = numeroMarcoZero;
      rowToAppend[idxAssunto !== -1 ? idxAssunto : 3] = assuntoFinal;
      rowToAppend[idxServidor !== -1 ? idxServidor : 4] = reqServidor;
      rowToAppend[idxDestinatario !== -1 ? idxDestinatario : 5] = 'Livro Anterior / Carga Inicial';
      rowToAppend[idxSecretaria !== -1 ? idxSecretaria : 6] = reqSecretaria;
      rowToAppend[idxDepartamento !== -1 ? idxDepartamento : 7] = reqDepartamento;

      sheetNum.appendRow(rowToAppend);
      const ultimaLinha = sheetNum.getLastRow();
      sheetNum.getRange(ultimaLinha, (idxNumero !== -1 ? idxNumero + 1 : 3)).setNumberFormat('@').setValue(numeroMarcoZero);

      registrarLog(
        reqServidor,
        'DEFINIR_MARCO_ZERO',
        numeroMarcoZero,
        'Marco Zero definido para ' + tipoDoc + ' em ' + reqSecretaria + (usarSequenciaGlobal ? ' [Global Municipal]' : '') + '. Próximo nº oficial: ' + proximoNumero
      );

      return createJsonResponse({
        success: true,
        numeroMarcoZero: numeroMarcoZero,
        proximoNumero: proximoNumero,
        tipoDocumento: tipoDoc,
        secretaria: reqSecretaria,
        departamento: reqDepartamento,
        assunto: assuntoFinal,
        dataHora: dataHoraIso,
        sequenciaGlobal: usarSequenciaGlobal
      });
    }

    // 7C. AÇÃO: SALVAR_CONFIG_NUMERACAO (Regras de Sequência Global Municipal — Exclusivo ADMIN)
    if (action === 'SALVAR_CONFIG_NUMERACAO') {
      const sessaoAdmin = req.token ? validarSessao(req.token) : null;
      if (sessaoAdmin && normTipo(sessaoAdmin.nivel) !== 'ADMIN') {
        throw new Error('Acesso negado: apenas Administradores podem alterar regras globais de numeração.');
      }

      const tiposSalvos = salvarConfigNumeracaoGlobal(req.tiposSequenciaGlobal);
      const autor = req.usuarioLogado || (sessaoAdmin ? sessaoAdmin.nome : 'Administrador');
      registrarLog(autor, 'CONFIG_NUMERACAO', 'GLOBAL', 'Tipos em sequência global municipal: ' + (tiposSalvos.length ? tiposSalvos.join(', ') : 'Nenhum (todos por Secretaria)'));

      return createJsonResponse({
        success: true,
        configNumeracao: {
          tiposSequenciaGlobal: tiposSalvos
        }
      });
    }

    // 7D. AÇÃO: EXCLUIR_NUMERACAO (Higienização / Exclusão definitiva unitária ou em lote — Exclusivo ADMIN)
    if (action === 'EXCLUIR_NUMERACAO') {
      const sessaoAdmin = req.token ? validarSessao(req.token) : null;
      if (sessaoAdmin && normTipo(sessaoAdmin.nivel) !== 'ADMIN') {
        throw new Error('Acesso negado: apenas Administradores podem excluir registros da aba Numeração.');
      }

      const sheetNum = ss.getSheetByName('Numeração') || ss.getSheetByName('Numeracao');
      if (!sheetNum) throw new Error("Aba 'Numeração' não encontrada na planilha.");

      const listaAlvos = Array.isArray(req.registros) && req.registros.length > 0
        ? req.registros
        : (req.numero ? [{
            numero: req.numero,
            tipoDocumento: req.tipoDocumento || '',
            secretaria: req.secretaria || '',
            dataHora: req.dataHora || ''
          }] : []);

      if (listaAlvos.length === 0) {
        throw new Error('Informe ao menos um registro de numeração para exclusão.');
      }

      const motivo = String(req.motivo || 'Higienização administrativa (teste/duplicidade)').trim();
      const autor = req.usuarioLogado || (sessaoAdmin ? sessaoAdmin.nome : 'Administrador');

      const lock = LockService.getScriptLock();
      lock.waitLock(15000);
      try {
        const data = sheetNum.getDataRange().getValues();
        const headers = data[0] ? data[0].map(function(h) { return String(h).trim(); }) : [];
        const idxData = findColumnIndex(headers, ['datahora', 'data']);
        const idxTipo = findColumnIndex(headers, ['tipodocumento', 'tipodoc', 'tipo']);
        const idxNum = findColumnIndex(headers, ['numero', 'num', 'nº']);
        const idxSec = findColumnIndex(headers, ['secretaria', 'orgao', 'pasta']);

        const colData = idxData !== -1 ? idxData : 0;
        const colTipo = idxTipo !== -1 ? idxTipo : 1;
        const colNum = idxNum !== -1 ? idxNum : 2;
        const colSec = idxSec !== -1 ? idxSec : 6;

        let removidos = 0;
        const numerosRemovidos = [];
        const alvosPendentes = listaAlvos.slice();

        for (let r = data.length - 1; r >= 1; r--) {
          if (alvosPendentes.length === 0) break;
          const rowNum = String(data[r][colNum] || '').trim();
          const rowTipo = normTipo(data[r][colTipo] || '');
          const rowSec = canonicalSigla(data[r][colSec] || '');
          const rowDataRaw = data[r][colData];
          const rowDataStr = rowDataRaw instanceof Date
            ? Utilities.formatDate(rowDataRaw, TZ, 'dd/MM/yyyy HH:mm')
            : String(rowDataRaw || '').trim();

          let matchedIdx = -1;
          for (let k = 0; k < alvosPendentes.length; k++) {
            const alvo = alvosPendentes[k];
            const alvoNum = String(alvo.numero || '').trim();
            const alvoTipo = normTipo(alvo.tipoDocumento || '');
            const alvoSec = alvo.secretaria ? canonicalSigla(alvo.secretaria) : '';
            const alvoData = String(alvo.dataHora || '').trim();

            if (rowNum !== alvoNum) continue;
            if (alvoTipo && rowTipo && rowTipo !== alvoTipo) continue;
            if (alvoSec && rowSec && rowSec !== alvoSec) continue;
            // Se houver múltiplos com mesmo número, prioriza bater dataHora quando informada
            if (alvoData && rowDataStr && alvoData !== rowDataStr && alvosPendentes.length === 1) {
              // tolera diferença de formato ISO vs dd/MM/yyyy HH:mm
            }
            matchedIdx = k;
            break;
          }

          if (matchedIdx !== -1) {
            sheetNum.deleteRow(r + 1);
            removidos++;
            numerosRemovidos.push((rowTipo ? rowTipo + ' ' : '') + rowNum);
            alvosPendentes.splice(matchedIdx, 1);
          }
        }

        registrarLog(
          autor,
          'EXCLUIR_NUMERACAO',
          numerosRemovidos.slice(0, 5).join(', ') + (numerosRemovidos.length > 5 ? ' (+' + (numerosRemovidos.length - 5) + ')' : ''),
          'Higienização: ' + removidos + ' registro(s) excluído(s). Motivo: ' + motivo
        );

        return createJsonResponse({
          success: true,
          removidos: removidos,
          numerosRemovidos: numerosRemovidos
        });
      } finally {
        lock.releaseLock();
      }
    }

    // 7E. AÇÃO: ANULAR_NUMERACAO (Mantém número reservado no protocolo com marcação [ANULADO] — Exclusivo ADMIN)
    if (action === 'ANULAR_NUMERACAO') {
      const sessaoAdmin = req.token ? validarSessao(req.token) : null;
      if (sessaoAdmin && normTipo(sessaoAdmin.nivel) !== 'ADMIN') {
        throw new Error('Acesso negado: apenas Administradores podem anular números oficiais.');
      }

      const sheetNum = ss.getSheetByName('Numeração') || ss.getSheetByName('Numeracao');
      if (!sheetNum) throw new Error("Aba 'Numeração' não encontrada na planilha.");

      const alvoNum = String(req.numero || '').trim();
      const alvoTipo = normTipo(req.tipoDocumento || '');
      const alvoSec = req.secretaria ? canonicalSigla(req.secretaria) : '';
      const motivo = String(req.motivo || 'Cancelado administrativamente').trim();
      const autor = req.usuarioLogado || (sessaoAdmin ? sessaoAdmin.nome : 'Administrador');

      if (!alvoNum) throw new Error('Número do documento é obrigatório para anulação.');

      const lock = LockService.getScriptLock();
      lock.waitLock(15000);
      try {
        const data = sheetNum.getDataRange().getValues();
        const headers = data[0] ? data[0].map(function(h) { return String(h).trim(); }) : [];
        const idxTipo = findColumnIndex(headers, ['tipodocumento', 'tipodoc', 'tipo']);
        const idxNum = findColumnIndex(headers, ['numero', 'num', 'nº']);
        const idxAssunto = findColumnIndex(headers, ['assunto', 'objeto', 'descricao']);
        const idxSec = findColumnIndex(headers, ['secretaria', 'orgao', 'pasta']);

        const colTipo = idxTipo !== -1 ? idxTipo : 1;
        const colNum = idxNum !== -1 ? idxNum : 2;
        const colAssunto = idxAssunto !== -1 ? idxAssunto : 3;
        const colSec = idxSec !== -1 ? idxSec : 6;

        let atualizado = false;
        let novoAssunto = '';
        for (let r = data.length - 1; r >= 1; r--) {
          const rowNum = String(data[r][colNum] || '').trim();
          const rowTipo = normTipo(data[r][colTipo] || '');
          const rowSec = canonicalSigla(data[r][colSec] || '');

          if (rowNum !== alvoNum) continue;
          if (alvoTipo && rowTipo && rowTipo !== alvoTipo) continue;
          if (alvoSec && rowSec && rowSec !== alvoSec) continue;

          const assuntoAtual = String(data[r][colAssunto] || '').trim();
          const assuntoSemPrefixo = assuntoAtual.replace(/^\[ANULADO[^\]]*\]\s*/i, '');
          novoAssunto = '[ANULADO - ' + motivo + '] ' + assuntoSemPrefixo;
          sheetNum.getRange(r + 1, colAssunto + 1).setValue(novoAssunto);
          atualizado = true;
          break;
        }

        if (!atualizado) {
          throw new Error('Registro não encontrado na aba Numeração para anulação.');
        }

        registrarLog(
          autor,
          'ANULAR_NUMERACAO',
          (alvoTipo ? alvoTipo + ' ' : '') + alvoNum,
          'Número anulado (mantido no protocolo). Motivo: ' + motivo
        );

        return createJsonResponse({
          success: true,
          numero: alvoNum,
          novoAssunto: novoAssunto
        });
      } finally {
        lock.releaseLock();
      }
    }

    // 8. AÇÃO: ALTERAR_SENHA (com suporte opcional a novoNome)
    if (action === 'ALTERAR_SENHA') {
      const sheet = ss.getSheetByName('Usuarios');
      if (!sheet) throw new Error("Aba 'Usuarios' não configurada na planilha.");

      const matricula = String(req.matricula || '').trim();
      const senhaAtual = String(req.senhaAtual || '').trim();
      const novaSenha = String(req.novaSenha || '').trim();
      const novoNome = String(req.novoNome || '').trim();

      if (!matricula || (!novaSenha && !novoNome)) throw new Error('Matrícula e alteração de senha ou nome são obrigatórias.');
      if (novaSenha && novaSenha.length < 3) throw new Error('A nova senha deve possuir pelo menos 3 caracteres.');

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

          if (novaSenha && senhaAtual && !confereSenha(rawSen, senhaAtual)) {
            throw new Error('A senha atual informada está incorreta.');
          }

          if (novaSenha) {
            const novaSenhaHash = hashSenha(novaSenha);
            sheet.getRange(i + 1, idxSenha + 1).setNumberFormat('@').setValue(novaSenhaHash);
          }
          if (novoNome && idxNome !== -1) {
            sheet.getRange(i + 1, idxNome + 1).setValue(novoNome);
          }

          const nomeUsuario = novoNome || ((idxNome !== -1 && data[i][idxNome]) ? data[i][idxNome] : matricula);
          registrarLog(nomeUsuario, novaSenha ? 'ALTERAR_SENHA' : 'ALTERAR_PERFIL', matricula, 'Atualização de perfil/senha pelo servidor.');

          return createJsonResponse({
            success: true,
            message: 'Dados atualizados com sucesso!'
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
}`;

export const PLANILHA_ESTRUTURA = [
  {
    aba: "Modelos",
    descricao: "Contém todos os 86 modelos documentais catalogados de despachos, pareceres, memorandos, ofícios e circulares.",
    colunas: [
      { nome: "A", campo: "ID", tipo: "Texto", exemplo: "MOD-001", desc: "Identificador único do modelo documental" },
      { nome: "B", campo: "TipoDocumento", tipo: "Texto", exemplo: "DESPACHO", desc: "Tipo do ato (DESPACHO, OFICIO, MEMORANDO, etc.)" },
      { nome: "C", campo: "Categoria", tipo: "Texto", exemplo: "1. Geral", desc: "Grupo temático para navegação e filtro" },
      { nome: "D", campo: "Titulo", tipo: "Texto", exemplo: "Aprovação de Férias Regulamentares", desc: "Título descritivo da minuta" },
      { nome: "E", campo: "Texto", tipo: "Texto Longo", exemplo: "DEFIRO o requerimento...", desc: "Minuta padronizada contendo variáveis entre colchetes [NOME]" },
      { nome: "F", campo: "PalavrasChave", tipo: "Texto", exemplo: "férias, deferimento, rh", desc: "Tags para busca instantânea" },
      { nome: "G", campo: "BaseLegal", tipo: "Texto", exemplo: "Lei Complementar nº 01/1990", desc: "Fundamentação jurídica municipal" },
      { nome: "H", campo: "Ativo", tipo: "Booleano", exemplo: "TRUE", desc: "Define se o modelo aparece ativo no sistema" },
      { nome: "I", campo: "UsoFrequente", tipo: "Número", exemplo: "15", desc: "Contador de emissões para ordenar modelos populares" },
      { nome: "J", campo: "Versao", tipo: "Texto", exemplo: "1.0", desc: "Versão da minuta revisada" }
    ]
  },
  {
    aba: "Numeração",
    descricao: "Livro oficial de registro e controle sequencial anual de todos os expedientes e atos administrativos emitidos na prefeitura.",
    colunas: [
      { nome: "A", campo: "DataHora", tipo: "Data/Hora ISO", exemplo: "2026-11-01T10:15:00", desc: "Carimbo de data e hora em que o número foi reservado" },
      { nome: "B", campo: "TipoDocumento", tipo: "Texto", exemplo: "MEMORANDO", desc: "Tipo do expediente oficial (MEMORANDO, OFÍCIO, DESPACHO, CIRCULAR)" },
      { nome: "C", campo: "Numero", tipo: "Texto Puro (@)", exemplo: "001/2026 - SMA", desc: "Numeração sequencial formatada como texto para não virar data" },
      { nome: "D", campo: "Assunto", tipo: "Texto", exemplo: "Quantitativo de Servidores", desc: "Ementa ou resumo do documento emitido" },
      { nome: "E", campo: "Servidor", tipo: "Texto", exemplo: "Augusto Junior (20851)", desc: "Nome oficial e matrícula do servidor responsável pela emissão" },
      { nome: "F", campo: "Destinatario", tipo: "Texto", exemplo: "Secretaria de Saúde", desc: "Setor, autoridade ou órgão destinatário" },
      { nome: "G", campo: "Secretaria", tipo: "Texto", exemplo: "Secretaria Municipal de Administração", desc: "Secretaria proprietária / emissora do documento" },
      { nome: "H", campo: "Departamento", tipo: "Texto", exemplo: "Departamento de Recursos Humanos", desc: "Divisão, departamento ou setor interno emissor" }
    ]
  },
  {
    aba: "Usuarios",
    descricao: "Base cadastral de servidores municipais autorizados, perfis de acesso e lotações administrativas.",
    colunas: [
      { nome: "A", campo: "ID", tipo: "Texto", exemplo: "USR-001", desc: "Código identificador do usuário" },
      { nome: "B", campo: "Nome", tipo: "Texto", exemplo: "Augusto Lourenço da Silva Júnior", desc: "Nome completo do servidor público" },
      { nome: "C", campo: "Matricula", tipo: "Texto/Número", exemplo: "20851", desc: "Matrícula funcional utilizada para o login" },
      { nome: "D", campo: "Senha", tipo: "Texto / Hash", exemplo: "sha256$...", desc: "Senha criptografada ou senha inicial de acesso" },
      { nome: "E", campo: "NivelAcesso", tipo: "Texto", exemplo: "ADMIN", desc: "Permissão no sistema: ADMIN, EDITOR ou PADRAO" },
      { nome: "F", campo: "Secretaria", tipo: "Texto", exemplo: "SMA", desc: "Secretaria ou departamento de lotação oficial" },
      { nome: "G", campo: "Ativo", tipo: "Booleano", exemplo: "TRUE", desc: "Indica se o acesso funcional está liberado ou suspenso" }
    ]
  },
  {
    aba: "Logs_Auditoria",
    descricao: "Registro contínuo e irreversível de auditoria de autenticações, alterações cadastrais e emissões.",
    colunas: [
      { nome: "A", campo: "DataHora", tipo: "Data/Hora ISO", exemplo: "2026-10-31T14:30:12", desc: "Registro temporal exato da operação" },
      { nome: "B", campo: "Usuario", tipo: "Texto", exemplo: "Augusto Lourenço", desc: "Identificação do autor da ação" },
      { nome: "C", campo: "Acao", tipo: "Texto", exemplo: "GERAR_NUMERO", desc: "Operação executada (LOGIN, GERAR_NUMERO, etc.)" },
      { nome: "D", campo: "DocID_Numero", tipo: "Texto", exemplo: "710/2026", desc: "Número do documento ou ID do modelo afetado" },
      { nome: "E", campo: "Detalhes", tipo: "Texto", exemplo: "Emitiu MEMORANDO nº 710/2026", desc: "Informações adicionais para auditoria" }
    ]
  }
];
