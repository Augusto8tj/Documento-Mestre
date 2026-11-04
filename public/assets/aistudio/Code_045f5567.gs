// =================================================================
//  Prefeitura Municipal de Rio Claro – RJ
//  Banco Mestre Administrativo — Backend API v4.0 (Google Apps Script)
//
//  Novidades da v4.0
//  - Login devolve um TOKEN de sessão (6 h). Toda ação exige o token.
//  - Senhas guardadas com hash SHA-256 + sal (senhas antigas em texto
//    puro continuam funcionando e são convertidas no 1º login).
//  - Leitura de dados só com sessão válida (nada mais é público).
//  - Perfis: ADMIN, EDITOR, PADRAO. Permissão conferida AQUI no servidor.
//  - Gestão de usuários (cadastrar / alterar matrícula, acesso,
//    secretaria, local, cargo, ativo / redefinir senha) só para ADMIN.
//  - Bloqueio de 15 min após 5 senhas erradas; falhas vão para o log.
//  - Correção: coluna da matrícula (antes pegava a coluna "ID").
//  - Correção: numeração (OFICIO/OFÍCIO, 1000+, número virando data).
// =================================================================

const VERSAO = '4.0';
const TZ = 'America/Sao_Paulo';
const SESSAO_SEG = 6 * 3600;           // máximo do CacheService
const MAX_FALHAS = 5;
const NIVEIS = ['ADMIN', 'EDITOR', 'PADRAO'];
const SECRETARIAS_PADRAO = [
  'Secretaria Municipal de Administração (SMA)',
  'Secretaria Municipal de Saúde (SMS)',
  'Secretaria Municipal de Educação (SME)',
  'Secretaria Municipal de Fazenda (SMF)',
  'Secretaria Municipal de Obras e Serviços Públicos (SMOSP)',
  'Secretaria Municipal de Assistência Social (SMAS)',
  'Secretaria Municipal de Meio Ambiente (SMMA)',
  'Procuradoria-Geral do Município (PGM)',
  'Gabinete do Prefeito (GP)'
];

// ----------------------------- utilitários ------------------------
const norm = s => String(s == null ? '' : s).trim().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const normMat = v => String(v == null ? '' : v).trim().replace(/\.0$/, '').toLowerCase();
const normTipo = s => norm(s).toUpperCase();
const pad3 = n => String(n).padStart(3, '0');   // 7 → 007, 1000 → 1000 (o slice(-3) antigo quebrava no 1000)
const seguro = v => (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v; // anti-injeção de fórmula
const isAtivo = v => ['FALSE', 'INATIVO', 'NAO', 'NÃO', '0'].indexOf(String(v).trim().toUpperCase()) === -1;

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function erroSessao() {
  const e = new Error('Sessão expirada. Faça login novamente.');
  e.authRequired = true;
  return e;
}

/** Localiza coluna: 1º igualdade exata (na ordem dos termos), depois "contém". */
function findColumnIndex(headers, possibleNames) {
  const hs = headers.map(norm), terms = possibleNames.map(norm);
  for (const t of terms) { const i = hs.indexOf(t); if (i !== -1) return i; }
  for (const t of terms) { const i = hs.findIndex(h => h.indexOf(t) !== -1); if (i !== -1) return i; }
  return -1;
}

// ----------------------------- senhas -----------------------------
function hashSenha(senha, sal) {
  sal = sal || Utilities.getUuid().replace(/-/g, '');
  const d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, sal + ':' + senha, Utilities.Charset.UTF_8);
  return 'sha256$' + sal + '$' + d.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}
function confereSenha(armazenada, informada) {
  const a = String(armazenada == null ? '' : armazenada).trim();
  if (a.indexOf('sha256$') === 0) return hashSenha(informada, a.split('$')[1]) === a;
  return a.replace(/\.0$/, '') === String(informada).trim();      // senha antiga (texto puro)
}

// ----------------------------- usuários ---------------------------
/** Lê a aba Usuarios; cria colunas que faltarem (ID, Local, Cargo...) e IDs vazios. */
function carregarUsuarios(ss) {
  const sheet = ss.getSheetByName('Usuarios');
  if (!sheet) throw new Error("Aba 'Usuarios' não configurada na planilha.");
  const hdr = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(h => String(h).trim());
  ['ID', 'Nome', 'Matricula', 'Senha', 'NivelAcesso', 'Secretaria', 'Local', 'Cargo', 'Ativo'].forEach(c => {
    if (hdr.map(norm).indexOf(norm(c)) === -1) { sheet.getRange(1, hdr.length + 1).setValue(c); hdr.push(c); }
  });
  const col = {};
  hdr.forEach((h, i) => { col[norm(h)] = i; });
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, hdr.length).getValues() : [];
  let n = 0;
  rows.forEach(r => { const m = /(\d+)$/.exec(String(r[col.id])); if (m) n = Math.max(n, +m[1]); });
  rows.forEach((r, i) => {
    if (!String(r[col.id]).trim() && String(r[col.matricula]).trim()) {
      r[col.id] = 'USR-' + pad3(++n);
      sheet.getRange(i + 2, col.id + 1).setValue(r[col.id]);
    }
  });
  return { sheet: sheet, col: col, rows: rows };
}
function paraUsuario(r, col) {
  return {
    id: String(r[col.id]).trim(),
    nome: String(r[col.nome] || '').trim(),
    matricula: String(r[col.matricula]).trim().replace(/\.0$/, ''),
    nivel: String(r[col.nivelacesso] || 'PADRAO').trim().toUpperCase(),
    secretaria: String(r[col.secretaria] || '').trim(),
    local: String(r[col.local] || '').trim(),
    cargo: String(r[col.cargo] || '').trim(),
    ativo: isAtivo(r[col.ativo])
  };
}
function listarUsuarios(ss) {
  const U = carregarUsuarios(ss);
  const usuarios = U.rows.filter(r => String(r[U.col.matricula]).trim()).map(r => paraUsuario(r, U.col));
  const uniq = k => Array.from(new Set(usuarios.map(u => u[k]).filter(Boolean))).sort();
  return {
    usuarios: usuarios,
    secretarias: Array.from(new Set(SECRETARIAS_PADRAO.concat(uniq('secretaria')))).sort(),
    locais: uniq('local')
  };
}

// ----------------------------- sessão / login ---------------------
function criarSessao(u) {
  const t = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('s:' + t, u.id, SESSAO_SEG);
  return t;
}
/** Confere token E reconfere a planilha: desativar/rebaixar alguém vale na hora. */
function exigirSessao(ss, token) {
  const id = token ? CacheService.getScriptCache().get('s:' + token) : null;
  if (!id) throw erroSessao();
  const U = carregarUsuarios(ss);
  const row = U.rows.find(r => String(r[U.col.id]).trim() === id);
  const u = row ? paraUsuario(row, U.col) : null;
  if (!u || !u.ativo) throw erroSessao();
  return u;
}
function autenticar(ss, matricula, senha) {
  const mat = String(matricula || '').trim(), sen = String(senha || '').trim();
  if (!mat || !sen) throw new Error('Informe a matrícula e a senha.');
  const cache = CacheService.getScriptCache(), kf = 'f:' + normMat(mat);
  if (+cache.get(kf) >= MAX_FALHAS) throw new Error('Muitas tentativas. Aguarde 15 minutos e tente de novo.');

  const U = carregarUsuarios(ss);
  const i = U.rows.findIndex(r => normMat(r[U.col.matricula]) === normMat(mat));
  const u = i === -1 ? null : paraUsuario(U.rows[i], U.col);
  if (!u || !u.ativo || !confereSenha(U.rows[i][U.col.senha], sen)) {
    cache.put(kf, String((+cache.get(kf) || 0) + 1), 900);
    registrarLog('-', 'LOGIN_FALHA', mat, !u ? 'Matrícula inexistente' : !u.ativo ? 'Conta desativada' : 'Senha incorreta');
    throw new Error('Matrícula ou senha inválida.');   // mensagem única: não revela qual está errada
  }
  cache.remove(kf);
  if (String(U.rows[i][U.col.senha]).indexOf('sha256$') !== 0) {           // migra senha antiga para hash
    U.sheet.getRange(i + 2, U.col.senha + 1).setNumberFormat('@').setValue(hashSenha(sen));
  }
  registrarLog(u.nome, 'LOGIN', u.matricula, 'Autenticação bem-sucedida (' + u.secretaria + ')');
  u.token = criarSessao(u);
  return { success: true, usuario: u };
}

// ----------------------------- endpoints --------------------------
/** GET não devolve mais dados: serve só para conferir se a implantação está no ar. */
function doGet() {
  return resposta({ success: true, status: 'online', versao: VERSAO });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (req.action === 'LOGIN') return resposta(autenticar(ss, req.matricula, req.senha));

    const u = exigirSessao(ss, req.token);
    const exige = function () {
      if (Array.prototype.indexOf.call(arguments, u.nivel) === -1) throw new Error('Permissão negada para esta ação.');
    };

    switch (req.action) {
      case 'CARREGAR':        return resposta(carregarTudo(ss));
      case 'LOGOUT':          CacheService.getScriptCache().remove('s:' + req.token); return resposta({ success: true });
      case 'GERAR_NUMERO':    return resposta(gerarNumero(ss, u, req));
      case 'ALTERAR_SENHA':   return resposta(alterarSenha(ss, u, req));
      case 'SALVAR_MODELO':   exige('ADMIN', 'EDITOR'); return resposta(salvarModelo(ss, u, req));
      case 'LISTAR_USUARIOS': exige('ADMIN');           return resposta(Object.assign({ success: true }, listarUsuarios(ss)));
      case 'SALVAR_USUARIO':  exige('ADMIN');           return resposta(salvarUsuario(ss, u, req.usuario || {}));
    }
    throw new Error("Ação '" + (req.action || 'desconhecida') + "' não reconhecida.");
  } catch (err) {
    return resposta({ success: false, error: err.message, authRequired: !!err.authRequired });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// ----------------------------- leitura ----------------------------
function textoNumero(v) {
  if (v instanceof Date) return pad3(v.getMonth() + 1) + '/' + v.getFullYear();   // "001/2026" que virou data
  return String(v == null ? '' : v).trim();
}
function textoData(v) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, "yyyy-MM-dd'T'HH:mm:ss") : String(v == null ? '' : v).trim();
}

function carregarTudo(ss) {
  const sheetModelos = ss.getSheetByName('Modelos');
  if (!sheetModelos) throw new Error("Aba 'Modelos' não encontrada.");
  const dm = sheetModelos.getDataRange().getValues();
  const records = [];
  if (dm.length > 1) {
    const hdr = dm[0].map(h => String(h).trim());
    for (let i = 1; i < dm.length; i++) {
      if (!dm[i][0]) continue;
      const rec = {};
      hdr.forEach((h, k) => {
        let v = dm[i][k];
        if (v === 'TRUE' || v === true) v = true; else if (v === 'FALSE' || v === false) v = false;
        rec[h] = v !== undefined ? v : '';
      });
      if (rec.Ativo !== false && String(rec.Ativo).toUpperCase() !== 'FALSE') records.push(rec);
    }
  }

  const registros = [], dest = new Set(), ass = new Set();
  const sn = ss.getSheetByName('Numeração') || ss.getSheetByName('Numeracao');
  if (sn && sn.getLastRow() > 1) {
    sn.getRange(2, 1, sn.getLastRow() - 1, 6).getValues().forEach(r => {
      const numero = textoNumero(r[2]);
      if (r[5]) dest.add(String(r[5]).trim());
      if (r[3]) ass.add(String(r[3]).trim());
      if (numero) registros.push({
        dataHora: textoData(r[0]), tipoDocumento: normTipo(r[1]), numero: numero,
        assunto: String(r[3] || '').trim(), usuario: String(r[4] || '').trim(), destinatario: String(r[5] || '').trim()
      });
    });
  }
  const lu = listarUsuarios(ss);
  return {
    success: true, versao: VERSAO, data: records,
    registrosNumeracao: registros.reverse(),
    sugestoes: {
      destinatarios: Array.from(dest).sort(), assuntos: Array.from(ass).sort(),
      secretarias: lu.secretarias, servidores: []          // lista de servidores não circula mais
    }
  };
}

// ----------------------------- numeração --------------------------
function parseNumero(v) {
  if (v instanceof Date) return { seq: v.getMonth() + 1, ano: String(v.getFullYear()) };
  const m = String(v == null ? '' : v).trim().match(/^(\d+)[\/-](\d{4})$/);
  return m ? { seq: parseInt(m[1], 10), ano: m[2] } : null;
}

/** Colunas fixas: A DataHora | B TipoDocumento | C Numero | D Assunto | E Usuario | F Destinatario */
function gerarNumero(ss, u, req) {
  let sh = ss.getSheetByName('Numeração') || ss.getSheetByName('Numeracao');
  if (!sh) { sh = ss.insertSheet('Numeração'); sh.appendRow(['DataHora', 'TipoDocumento', 'Numero', 'Assunto', 'Usuario', 'Destinatario']); }

  const tipo = req.tipoDocumento ? normTipo(req.tipoDocumento) : 'MEMORANDO';   // OFÍCIO e OFICIO = mesma série
  const ano = Utilities.formatDate(new Date(), TZ, 'yyyy');
  let maior = 0;
  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues().forEach(r => {
      if (normTipo(r[1]) !== tipo) return;
      const p = parseNumero(r[2]);
      if (p && p.ano === ano && p.seq > maior) maior = p.seq;
    });
  }
  const numero = pad3(maior + 1) + '/' + ano;
  const assunto = String(req.assunto || 'Sem assunto informado').trim();
  const destinatario = String(req.destinatario || 'Administração Geral').trim();
  const iso = new Date().toISOString();

  // formato texto ANTES de gravar: "001/2026" não vira data e "=..." não vira fórmula
  sh.getRange(sh.getLastRow() + 1, 1, 1, 6).setNumberFormat('@')
    .setValues([[iso, tipo, numero, assunto, u.nome, destinatario]]);

  registrarLog(u.nome, 'GERAR_NUMERO', numero, 'Emitiu ' + tipo + ' nº ' + numero + ' | Dest: ' + destinatario + ' | Assunto: ' + assunto);
  return { success: true, numeroGerado: numero, tipoDocumento: tipo, assunto: assunto, destinatario: destinatario, dataHora: iso };
}

// ----------------------------- modelos ----------------------------
function salvarModelo(ss, u, req) {
  const sheet = ss.getSheetByName('Modelos');
  if (!sheet) throw new Error("Aba 'Modelos' não encontrada.");
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const p = req.documento || {};
  let linha = -1;
  if (p.ID) {
    const c = headers.indexOf('ID');
    for (let i = 1; i < data.length; i++) if (String(data[i][c]).trim() === String(p.ID).trim()) { linha = i + 1; break; }
  }
  if (linha !== -1) {
    headers.forEach((h, c) => { if (p[h] !== undefined && h !== 'ID') sheet.getRange(linha, c + 1).setValue(seguro(p[h])); });
    registrarLog(u.nome, 'EDITAR_MODELO', p.ID, 'Edição de ' + p.TipoDocumento + ': ' + p.Titulo);
    return { success: true, message: 'Modelo atualizado com sucesso.' };
  }
  const id = 'MOD-' + Utilities.getUuid().split('-')[0].toUpperCase();
  p.ID = id; p.Ativo = true; p.UsoFrequente = 0; p.Versao = '1.0';
  sheet.appendRow(headers.map(h => p[h] !== undefined ? seguro(p[h]) : ''));
  registrarLog(u.nome, 'CRIAR_MODELO', id, 'Criação de ' + p.TipoDocumento + ': ' + p.Titulo);
  return { success: true, message: 'Novo modelo cadastrado.', novoID: id };
}

// ----------------------------- senha própria ----------------------
function alterarSenha(ss, u, req) {
  const atual = String(req.senhaAtual || '').trim(), nova = String(req.novaSenha || '').trim();
  if (nova.length < 6) throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
  const U = carregarUsuarios(ss);
  const i = U.rows.findIndex(r => String(r[U.col.id]).trim() === u.id);
  if (i === -1) throw new Error('Servidor não encontrado.');
  if (!atual || !confereSenha(U.rows[i][U.col.senha], atual)) throw new Error('A senha atual informada está incorreta.');
  U.sheet.getRange(i + 2, U.col.senha + 1).setNumberFormat('@').setValue(hashSenha(nova));
  registrarLog(u.nome, 'ALTERAR_SENHA', u.matricula, 'Senha de acesso alterada pelo próprio usuário.');
  return { success: true, message: 'Senha alterada com sucesso!' };
}

// ----------------------------- gestão de usuários (ADMIN) ---------
function salvarUsuario(ss, admin, d) {
  const U = carregarUsuarios(ss), c = U.col;
  const nome = String(d.nome || '').trim(), mat = String(d.matricula || '').trim();
  const nivel = String(d.nivel || 'PADRAO').trim().toUpperCase();
  const senha = String(d.senha || '').trim();
  const ativo = d.ativo !== false;

  if (!nome) throw new Error('Informe o nome do servidor.');
  if (!/^[A-Za-z0-9._-]{1,20}$/.test(mat)) throw new Error('Matrícula inválida: use letras, números, ponto ou hífen (até 20 caracteres).');
  if (NIVEIS.indexOf(nivel) === -1) throw new Error('Nível de acesso inválido.');
  if (senha && senha.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');

  const idx = d.id ? U.rows.findIndex(r => String(r[c.id]).trim() === String(d.id).trim()) : -1;
  if (d.id && idx === -1) throw new Error('Servidor não encontrado.');
  if (idx === -1 && !senha) throw new Error('Informe uma senha inicial para o novo servidor.');
  if (U.rows.some((r, i) => i !== idx && normMat(r[c.matricula]) === normMat(mat))) throw new Error('Já existe um servidor com a matrícula ' + mat + '.');
  if (idx !== -1 && String(U.rows[idx][c.id]).trim() === admin.id && (!ativo || nivel !== 'ADMIN')) {
    throw new Error('Você não pode desativar nem rebaixar o seu próprio acesso.');
  }

  const v = {
    nome: nome, matricula: mat, nivelacesso: nivel, ativo: ativo,
    secretaria: String(d.secretaria || '').trim(), local: String(d.local || '').trim(), cargo: String(d.cargo || '').trim()
  };
  let linha;
  if (idx === -1) {
    let n = 0;
    U.rows.forEach(r => { const m = /(\d+)$/.exec(String(r[c.id])); if (m) n = Math.max(n, +m[1]); });
    v.id = 'USR-' + pad3(n + 1);
    v.senha = hashSenha(senha);
    linha = U.sheet.getLastRow() + 1;
  } else {
    linha = idx + 2;
    if (senha) v.senha = hashSenha(senha);
  }
  Object.keys(v).forEach(k => {
    const cel = U.sheet.getRange(linha, c[k] + 1);
    if (k === 'matricula' || k === 'senha' || k === 'id') cel.setNumberFormat('@');   // preserva zeros à esquerda
    cel.setValue(typeof v[k] === 'string' ? seguro(v[k]) : v[k]);
  });

  registrarLog(admin.nome, idx === -1 ? 'CRIAR_USUARIO' : 'EDITAR_USUARIO', mat,
    (idx === -1 ? 'Cadastrou ' : 'Alterou ') + nome + ' | nível ' + nivel + ' | ' + (ativo ? 'ativo' : 'inativo') + (senha ? ' | senha redefinida' : ''));
  return Object.assign({ success: true, message: idx === -1 ? 'Servidor cadastrado.' : 'Dados do servidor atualizados.' }, listarUsuarios(ss));
}

// ----------------------------- auditoria --------------------------
function registrarLog(usuario, acao, idDoc, detalhes) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName('Logs_Auditoria');
    if (!sh) { sh = ss.insertSheet('Logs_Auditoria'); sh.appendRow(['DataHora', 'Usuario', 'Acao', 'DocID_Numero', 'Detalhes']); }
    sh.getRange(sh.getLastRow() + 1, 1, 1, 5).setNumberFormat('@')
      .setValues([[new Date().toISOString(), seguro(String(usuario || 'Sistema')), acao, seguro(String(idDoc)), seguro(String(detalhes))]]);
  } catch (e) { console.error('Falha ao registrar log', e); }
}

// =================================================================
//  EXECUTAR UMA VEZ, MANUALMENTE (menu Executar), ANTES de implantar
// =================================================================

/** Converte todas as senhas em texto puro para hash e deixa matrícula/senha como texto. */
function migrarSenhasParaHash() {
  const U = carregarUsuarios(SpreadsheetApp.getActiveSpreadsheet());
  U.rows.forEach((r, i) => {
    if (!String(r[U.col.matricula]).trim()) return;
    const sen = String(r[U.col.senha]).trim();
    const cm = U.sheet.getRange(i + 2, U.col.matricula + 1);
    cm.setNumberFormat('@').setValue(String(r[U.col.matricula]).trim().replace(/\.0$/, ''));
    if (sen && sen.indexOf('sha256$') !== 0) {
      U.sheet.getRange(i + 2, U.col.senha + 1).setNumberFormat('@').setValue(hashSenha(sen.replace(/\.0$/, '')));
    }
  });
  SpreadsheetApp.getActiveSpreadsheet().toast('Senhas convertidas para hash.', 'Concluído', 5);
}

/** Corrige números virados em data, unifica OFÍCIO→OFICIO e remove linhas vazias da aba Numeração. */
function corrigirDadosLegados() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sn = ss.getSheetByName('Numeração') || ss.getSheetByName('Numeracao');
  if (sn && sn.getLastRow() > 1) {
    const n = sn.getLastRow() - 1;
    const tipos = sn.getRange(2, 2, n, 1).getValues().map(r => [normTipo(r[0]) || r[0]]);
    sn.getRange(2, 2, n, 1).setValues(tipos);
    const nums = sn.getRange(2, 3, n, 1).getValues().map(r => [textoNumero(r[0])]);
    sn.getRange(2, 3, n, 1).setNumberFormat('@').setValues(nums);
    const sobra = sn.getMaxRows() - sn.getLastRow();
    if (sobra > 50) sn.deleteRows(sn.getLastRow() + 51, sobra - 50);     // deixa 50 linhas de folga
  }
  const sl = ss.getSheetByName('Logs_Auditoria');
  if (sl && sl.getLastRow() > 1) {
    const n = sl.getLastRow() - 1;
    const ids = sl.getRange(2, 4, n, 1).getValues().map(r => [textoNumero(r[0])]);
    sl.getRange(2, 4, n, 1).setNumberFormat('@').setValues(ids);
  }
  ss.toast('Numeração e logs corrigidos.', 'Concluído', 5);
}
