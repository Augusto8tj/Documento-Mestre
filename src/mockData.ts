import realModelsRaw from './importedRealModels.json';

export interface ModeloDocumental {
  ID: string;
  TipoDocumento: string;
  Area?: string;
  SubArea?: string;
  Categoria: string;
  Titulo: string;
  Assunto?: string;
  Texto: string;
  Observacao?: string;
  PalavrasChave: string;
  SetorOrigem?: string;
  SetorDestino?: string;
  TipoDecisao?: string;
  BaseLegal?: string;
  Prioridade?: string;
  Favorito?: boolean;
  UsoFrequente?: number;
  Versao?: string;
  Ativo?: boolean;
}

export interface RegistroNumeracao {
  dataHora: string;
  tipoDocumento: string;
  numero: string;
  assunto: string;
  usuario: string; // Compatibilidade com colunas legadas
  servidor?: string; // Nome oficial e matrícula do servidor emissor (Coluna E)
  destinatario: string;
  secretaria?: string; // Secretaria proprietária / emissora (Coluna G)
  departamento?: string; // Departamento interno emissor (Coluna H)
  incluirSigla?: boolean; // Se incluiu a sigla no número emitido
}

export interface RegistroLog {
  dataHora: string;
  usuario: string;
  acao: string;
  docId: string;
  detalhes: string;
}

export interface FiltroAcessibilidadeDocs {
  acessarSecretaria: boolean;
  acessarDepartamento: boolean;
  acessarProprios: boolean;
}

export interface UsuarioSistema {
  id?: string;
  matricula: string;
  senha?: string;
  nome: string;
  cargo?: string;
  departamento?: string;
  secretaria?: string; // Secretaria principal ou ativa
  secretarias?: string[]; // Múltiplas secretarias acumuladas
  local?: string;
  nivel: 'ADMIN' | 'EDITOR' | 'PADRAO';
  ativo: boolean;
  token?: string;
  filtroAcessibilidade?: FiltroAcessibilidadeDocs;
}

export interface MembroComissao {
  id: string;
  nome: string;
  funcao: string;
  matricula: string;
  cargoEfetivo: string;
}

export interface MargensDocumento {
  superior: number; // cm
  inferior: number; // cm
  esquerda: number; // cm
  direita: number; // cm
}

export interface PedidoRecuperacaoSenha {
  id: string;
  matricula: string;
  nome: string;
  cargo?: string;
  secretaria: string;
  departamento?: string;
  contato?: string;
  dataHora: string;
  status: 'PENDENTE' | 'ATENDIDO' | 'CANCELADO';
  tipo?: 'REDEFINICAO' | 'NOVO_CADASTRO';
  resolvidoEm?: string;
  resolvidoPor?: string;
  senhaProvisoria?: string;
}

export const INITIAL_PEDIDOS_RECUPERACAO: PedidoRecuperacaoSenha[] = [];

export interface SecretariaItem {
  sigla: string;
  nome: string;
  titular?: string;
  departamentos?: string[];
  email?: string;
  telefone?: string;
}

export const SECRETARIAS_MUNICIPAIS_BASE = [
  'Secretaria Municipal de Administração (SMA)',
  'Secretaria Municipal de Saúde (SMS)',
  'Secretaria Municipal de Educação (SME)',
  'Secretaria Municipal de Fazenda e Finanças (SMF)',
  'Secretaria Municipal de Obras e Serviços Públicos (SMOSP)',
  'Secretaria Municipal de Ação Social e Cidadania (SMASC)',
  'Secretaria Municipal de Meio Ambiente e Defesa Civil',
  'Gabinete do Prefeito',
  'Procuradoria-Geral do Município (PGM)',
  'Controladoria Geral do Município (CGM)',
  'Instituto de Previdência Municipal (IPRC)'
];

export const INITIAL_SECRETARIAS: SecretariaItem[] = [
  {
    sigla: 'SMA',
    nome: 'Secretaria Municipal de Administração',
    titular: 'Secretário Municipal de Administração',
    departamentos: ['Departamento de Recursos Humanos (DRH)', 'Divisão de Treinamento e Desenvolvimento', 'Coordenação de Folha de Pagamento', 'Departamento de Patrimônio e Logística'],
    email: 'administracao@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1200'
  },
  {
    sigla: 'SMS',
    nome: 'Secretaria Municipal de Saúde',
    titular: 'Secretário(a) Municipal de Saúde',
    departamentos: ['Vigilância Sanitária', 'Departamento de Atenção Básica', 'Divisão de Farmácia Municipal', 'Regulação e Transporte Sanitário'],
    email: 'saude@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1300'
  },
  {
    sigla: 'SME',
    nome: 'Secretaria Municipal de Educação',
    titular: 'Secretário(a) Municipal de Educação',
    departamentos: ['Coordenação Pedagógica', 'Divisão de Nutrição e Merenda Escolar', 'Departamento de Transporte Escolar', 'Gestão de Unidades Escolares'],
    email: 'educacao@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1400'
  },
  {
    sigla: 'SMF',
    nome: 'Secretaria Municipal de Fazenda e Finanças',
    titular: 'Secretário(a) Municipal de Fazenda',
    departamentos: ['Departamento de Tributação e Fiscalização', 'Divisão de Tesouraria e Contabilidade', 'Dívida Ativa', 'Arrecadação Municipal'],
    email: 'fazenda@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1500'
  },
  {
    sigla: 'SMOSP',
    nome: 'Secretaria Municipal de Obras e Serviços Públicos',
    titular: 'Secretário(a) Municipal de Obras e Serviços Públicos',
    departamentos: ['Departamento de Vias Urbanas e Rurais', 'Divisão de Limpeza e Conservação', 'Setor de Projetos e Fiscalização de Obras'],
    email: 'obras@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1600'
  },
  {
    sigla: 'SMAS',
    nome: 'Secretaria Municipal de Ação Social e Cidadania',
    titular: 'Secretário(a) Municipal de Ação Social',
    departamentos: ['CRAS - Centro de Referência', 'CREAS', 'Gestão do Cadastro Único e Bolsa Família', 'Conselho Tutelar'],
    email: 'social@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1700'
  },
  {
    sigla: 'PGM',
    nome: 'Procuradoria-Geral do Município',
    titular: 'Procurador(a)-Geral do Município',
    departamentos: ['Consultoria Jurídica', 'Contencioso Administrativo e Judicial', 'Execuções Fiscais'],
    email: 'procuradoria@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1800'
  },
  {
    sigla: 'SEGOV',
    nome: 'Secretaria de Governo e Gabinete do Prefeito',
    titular: 'Chefia de Gabinete do Prefeito',
    departamentos: ['Chefia de Gabinete', 'Assessoria de Comunicação e Imprensa', 'Defesa Civil Municipal'],
    email: 'gabinete@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1100'
  }
];

export const INITIAL_USERS: UsuarioSistema[] = [
  {
    matricula: '1001',
    senha: '123',
    nome: 'Augusto Lourenço da Silva Júnior',
    cargo: 'Chefe de Divisão de Treinamento e Desenvolvimento de RH',
    departamento: 'Divisão de Treinamento e Desenvolvimento de RH',
    secretaria: 'Secretaria Municipal de Administração (SMA)',
    secretarias: [
      'Secretaria Municipal de Administração (SMA)',
      'Secretaria de Governo e Gabinete do Prefeito (SEGOV)'
    ],
    nivel: 'ADMIN',
    ativo: true
  }
];

/**
 * Normaliza strings removendo acentos, pontuação lateral e espaços extras para comparação segura de escopo
 */
export function normalizeScopeText(value?: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function stripParenthesizedSigla(value?: string): string {
  return normalizeScopeText(value).replace(/\s*\([a-z0-9_\-]+\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Normaliza e obtém a sigla oficial canônica de uma Secretaria / Pasta Municipal
 * Evita colisões de substring (ex: SMA vs SMAS)
 */
export function getSecretariaSigla(secretariaNomeOrSigla?: string, secretariasList: SecretariaItem[] = INITIAL_SECRETARIAS): string {
  if (!secretariaNomeOrSigla) return 'SMA';
  const clean = String(secretariaNomeOrSigla).trim();
  if (!clean) return 'SMA';

  // 1. Se contiver sigla entre parênteses: "Secretaria Municipal de Administração (SMA)" -> "SMA"
  const matchParen = clean.match(/\(([A-Z0-9_\-]+)\)/i);
  if (matchParen) {
    const parenSigla = matchParen[1].toUpperCase();
    if (parenSigla === 'SEAD') return 'SMA';
    if (parenSigla === 'SMASC') return 'SMAS';
    if (parenSigla === 'GP') return 'SEGOV';
    return parenSigla;
  }

  const normClean = normalizeScopeText(clean);
  const normBase = stripParenthesizedSigla(clean);

  // 2. Correspondência exata na lista estruturada (sigla ou nome completo)
  const exactFound = secretariasList.find(s =>
    normalizeScopeText(s.sigla) === normClean ||
    normalizeScopeText(s.nome) === normClean ||
    normalizeScopeText(s.nome) === normBase
  );
  if (exactFound) return exactFound.sigla.toUpperCase();

  // 3. Aliases canônicos inequívocos
  if (/\bsma\b|\bsead\b/.test(normClean) || normBase.includes('administracao') || normBase === 'departamento de recursos humanos') return 'SMA';
  if (/\bsmas\b|\bsmasc\b/.test(normClean) || normBase.includes('acao social') || normBase.includes('assistencia social')) return 'SMAS';
  if (/\bsms\b/.test(normClean) || normBase.includes('saude')) return 'SMS';
  if (/\bsme\b/.test(normClean) || normBase.includes('educacao')) return 'SME';
  if (/\bsmf\b/.test(normClean) || normBase.includes('fazenda') || normBase.includes('financas')) return 'SMF';
  if (/\bsmosp\b/.test(normClean) || normBase.includes('obras')) return 'SMOSP';
  if (/\bsmma\b/.test(normClean) || normBase.includes('meio ambiente')) return 'SMMA';
  if (/\bpgm\b/.test(normClean) || normBase.includes('procuradoria')) return 'PGM';
  if (/\bcgm\b/.test(normClean) || normBase.includes('controladoria')) return 'CGM';
  if (/\biprc\b/.test(normClean) || normBase.includes('previdencia')) return 'IPRC';
  if (/\bsegov\b|\bgp\b/.test(normClean) || normBase.includes('gabinete do prefeito') || normBase.includes('secretaria de governo')) return 'SEGOV';

  // 4. Busca por palavra-chave exata na lista dinâmica de secretarias cadastradas no Admin
  const dynamicFound = secretariasList.find(s => {
    const sSigla = normalizeScopeText(s.sigla);
    const sNome = normalizeScopeText(s.nome);
    const regexSigla = new RegExp(`\\b${sSigla.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    return regexSigla.test(normClean) || normBase === sNome;
  });
  if (dynamicFound) return dynamicFound.sigla.toUpperCase();

  // 5. Se já for sigla curta em maiúsculas
  if (clean.length <= 8 && clean === clean.toUpperCase() && /^[A-Z0-9_\-]+$/.test(clean)) return clean;

  // 6. Deriva sigla por iniciais
  const words = clean
    .replace(/^(secretaria|departamento|divisão|divisao|coordenação|coordenacao)\s+(municipal\s+)?(de\s+|do\s+|da\s+)?/i, '')
    .split(/[\s\-]+/)
    .filter(w => w.length >= 2 && !['para', 'com', 'dos', 'das', 'de', 'do', 'da'].includes(w.toLowerCase()));

  if (words.length > 0) {
    return ('S' + words.map(w => w[0].toUpperCase()).join('')).slice(0, 6);
  }
  return 'SMA';
}

/**
 * Compara duas Secretarias de forma canônica sem falsos positivos (ex: SMA != SMAS)
 */
export function isSameSecretaria(secA?: string, secB?: string, secretariasList: SecretariaItem[] = INITIAL_SECRETARIAS): boolean {
  if (!secA || !secB) return false;
  const normA = normalizeScopeText(secA);
  const normB = normalizeScopeText(secB);
  if (normA === normB) return true;

  const baseA = stripParenthesizedSigla(secA);
  const baseB = stripParenthesizedSigla(secB);
  if (baseA && baseB && baseA === baseB) return true;

  const siglaA = getSecretariaSigla(secA, secretariasList);
  const siglaB = getSecretariaSigla(secB, secretariasList);
  return siglaA === siglaB;
}

/**
 * Resolve o nome padronizado de exibição de uma Secretaria a partir de sigla ou texto parcial
 */
export function resolveCanonicalSecretariaName(secInput?: string, secretariasList: SecretariaItem[] = INITIAL_SECRETARIAS): string {
  const raw = String(secInput || '').trim();
  if (!raw) return 'Secretaria Municipal de Administração (SMA)';
  const sigla = getSecretariaSigla(raw, secretariasList);
  const found = secretariasList.find(s => s.sigla.toUpperCase() === sigla);
  if (found) return `${found.nome} (${found.sigla})`;
  const foundBase = SECRETARIAS_MUNICIPAIS_BASE.find(b => getSecretariaSigla(b, secretariasList) === sigla);
  if (foundBase) return foundBase;
  return raw;
}

/**
 * Regra de Negócio: Verifica se um registro documental pertence à Secretaria especificada.
 * NOTA: Registros sem secretaria explícita (como os 841 legados) pertencem exclusivamente à Secretaria de Administração (SEAD/SMA).
 */
export function isRecordFromSecretaria(
  recordSec: string | undefined,
  targetSec: string,
  secretariasList: SecretariaItem[] = INITIAL_SECRETARIAS
): boolean {
  if (!targetSec || targetSec === 'TODAS') return true;
  const targetSigla = getSecretariaSigla(targetSec, secretariasList);
  const isTargetSEAD = targetSigla === 'SMA';

  // Registros sem secretaria ou legados pertencem exclusivamente à SEAD/SMA
  if (!recordSec || !recordSec.trim()) {
    return isTargetSEAD;
  }

  return isSameSecretaria(recordSec, targetSec, secretariasList);
}

/**
 * Compara dois Departamentos internos normalizados (com suporte a siglas como DRH)
 */
export function isRecordFromDepartamento(
  recordDepto: string | undefined,
  targetDepto: string | undefined,
  recordSec?: string,
  secretariasList: SecretariaItem[] = INITIAL_SECRETARIAS
): boolean {
  if (!targetDepto || targetDepto === 'TODOS' || targetDepto === 'TODAS') return true;

  const recSecSigla = getSecretariaSigla(recordSec, secretariasList);
  const rawRec = (recordDepto && recordDepto.trim())
    ? recordDepto.trim()
    : (recSecSigla === 'SMA' ? 'Departamento de Recursos Humanos (DRH)' : 'Gabinete');

  const normRec = normalizeScopeText(rawRec);
  const normTarget = normalizeScopeText(targetDepto);
  if (normRec === normTarget) return true;

  const baseRec = stripParenthesizedSigla(rawRec);
  const baseTarget = stripParenthesizedSigla(targetDepto);
  if (baseRec && baseTarget && baseRec === baseTarget) return true;

  const parenRec = rawRec.match(/\(([A-Z0-9_\-]+)\)/i)?.[1]?.toUpperCase();
  const parenTarget = targetDepto.match(/\(([A-Z0-9_\-]+)\)/i)?.[1]?.toUpperCase();
  if (parenRec && parenTarget && parenRec === parenTarget) return true;

  return false;
}

/**
 * Faz parsing seguro do filtro de acessibilidade documental vindo da API, localStorage ou string serializada.
 */
export function parseFiltroAcessibilidade(raw: unknown): FiltroAcessibilidadeDocs | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if (
      'acessarSecretaria' in obj ||
      'acessarDepartamento' in obj ||
      'acessarProprios' in obj
    ) {
      return {
        acessarSecretaria: Boolean(obj.acessarSecretaria),
        acessarDepartamento: Boolean(obj.acessarDepartamento),
        acessarProprios: Boolean(obj.acessarProprios)
      };
    }
    return undefined;
  }
  if (typeof raw === 'string') {
    const clean = raw.trim();
    if (!clean) return undefined;
    try {
      const parsed = JSON.parse(clean);
      return parseFiltroAcessibilidade(parsed);
    } catch {
      const upper = clean.toUpperCase();
      if (upper.includes('SEC:') || upper.includes('DEP:') || upper.includes('PROP:')) {
        return {
          acessarSecretaria: upper.includes('SEC:1') || upper.includes('SEC:TRUE'),
          acessarDepartamento: upper.includes('DEP:1') || upper.includes('DEP:TRUE'),
          acessarProprios: upper.includes('PROP:1') || upper.includes('PROP:TRUE')
        };
      }
    }
  }
  return undefined;
}

/**
 * Verifica se o servidor possui um departamento específico configurado (não genérico).
 */
export function hasSpecificDepartamento(user: UsuarioSistema | null): boolean {
  if (!user) return false;
  const dep = normalizeScopeText(user.departamento);
  if (!dep) return false;
  return !['todos', 'todas', 'geral', 'nao informado'].includes(dep);
}

/**
 * Retorna a política efetiva de acessibilidade documental de um servidor.
 * Quando não customizada pelo Administrador, preserva o padrão por nível (ADMIN/EDITOR/PADRAO).
 */
export function getEffectiveAccessibilityFilter(user: UsuarioSistema | null): FiltroAcessibilidadeDocs {
  if (!user) {
    return { acessarSecretaria: false, acessarDepartamento: false, acessarProprios: false };
  }
  if (user.nivel === 'ADMIN') {
    return { acessarSecretaria: true, acessarDepartamento: true, acessarProprios: true };
  }
  if (user.filtroAcessibilidade) {
    return {
      acessarSecretaria: Boolean(user.filtroAcessibilidade.acessarSecretaria),
      acessarDepartamento: Boolean(user.filtroAcessibilidade.acessarDepartamento),
      acessarProprios: Boolean(user.filtroAcessibilidade.acessarProprios)
    };
  }
  if (user.nivel === 'EDITOR') {
    return { acessarSecretaria: true, acessarDepartamento: true, acessarProprios: true };
  }
  // Padrão retrocompatível para PADRAO: se tiver departamento definido, restringe ao departamento + próprios
  if (hasSpecificDepartamento(user)) {
    return { acessarSecretaria: false, acessarDepartamento: true, acessarProprios: true };
  }
  return { acessarSecretaria: true, acessarDepartamento: true, acessarProprios: true };
}

/**
 * Gera rótulo resumido da política de acesso documental para exibição no painel admin e drawer.
 */
export function formatAccessibilityFilterLabel(user: UsuarioSistema | null): string {
  if (!user) return 'Sem acesso';
  if (user.nivel === 'ADMIN') return 'Total (Admin)';
  const eff = getEffectiveAccessibilityFilter(user);
  if (eff.acessarSecretaria) return 'Toda a Secretaria';
  const parts: string[] = [];
  if (eff.acessarDepartamento) parts.push('Departamento');
  if (eff.acessarProprios) parts.push('Próprios');
  if (parts.length === 0) return 'Somente Emissão (Consulta bloqueada)';
  return parts.join(' + ');
}

/**
 * Verifica se o documento foi emitido pelo próprio servidor (por matrícula imutável ou nome).
 */
export function isOwnDocumentRecord(user: UsuarioSistema | null, record: RegistroNumeracao): boolean {
  if (!user) return false;
  const docUser = normalizeScopeText(`${record.servidor || ''} ${record.usuario || ''}`);
  if (!docUser) return false;
  const userMat = normalizeScopeText(user.matricula);
  const userName = normalizeScopeText(user.nome);
  if (userMat && docUser.includes(userMat)) return true;
  if (userName && userName.length >= 3 && docUser.includes(userName)) return true;
  return false;
}

/**
 * Verifica se o servidor atual tem o escopo de departamento travado (não possui acesso irrestrito à Secretaria)
 */
export function isUserRestrictedToDepartamento(user: UsuarioSistema | null): boolean {
  if (!user || user.nivel === 'ADMIN') return false;
  if (!hasSpecificDepartamento(user)) return false;
  const eff = getEffectiveAccessibilityFilter(user);
  return !eff.acessarSecretaria;
}

/**
 * Regra de Negócio: Verifica se o servidor atual possui autorização de visualização/emissão para a secretaria.
 * ADMIN possui visão irrestrita.
 */
export function isUserAuthorizedForSecretaria(
  user: UsuarioSistema | null,
  targetSec?: string,
  secretariasList: SecretariaItem[] = INITIAL_SECRETARIAS
): boolean {
  if (!user) return false;
  if (user.nivel === 'ADMIN') return true;
  if (!targetSec) return true;
  if (targetSec === 'TODAS') return false;

  const userSecs = [
    user.secretaria,
    ...(user.secretarias || [])
  ].filter(Boolean) as string[];

  return userSecs.some(s => isSameSecretaria(s, targetSec, secretariasList));
}

/**
 * Verifica se o usuário tem permissão para acessar os 841 registros históricos legados da SEAD
 */
export function canUserViewLegacyAdminRecords(
  user: UsuarioSistema | null,
  secretariasList: SecretariaItem[] = INITIAL_SECRETARIAS
): boolean {
  if (!user) return false;
  if (user.nivel === 'ADMIN') return true;
  const userSecs = [
    user.secretaria,
    ...(user.secretarias || [])
  ].filter(Boolean) as string[];
  return userSecs.some(s => getSecretariaSigla(s, secretariasList) === 'SMA');
}

/**
 * Portão único de confidencialidade: valida se o usuário logado pode visualizar um registro documental
 * considerando Secretaria ativa, Departamento de lotação e Filtro de Acessibilidade configurado pelo Admin.
 */
export function canUserAccessRecord(
  user: UsuarioSistema | null,
  record: RegistroNumeracao,
  activeSecretaria: string,
  secretariasList: SecretariaItem[] = INITIAL_SECRETARIAS
): boolean {
  if (!user) return false;

  // 1. Isolamento de Secretaria (sempre obrigatório para não-ADMIN)
  if (user.nivel === 'ADMIN') {
    if (activeSecretaria !== 'TODAS' && !isRecordFromSecretaria(record.secretaria, activeSecretaria, secretariasList)) {
      return false;
    }
    return true;
  }

  // Nunca permite visão global "TODAS" para não-ADMIN
  if (!activeSecretaria || activeSecretaria === 'TODAS') return false;
  if (!isUserAuthorizedForSecretaria(user, activeSecretaria, secretariasList)) return false;

  const isLegacyBlank = !record.secretaria || !record.secretaria.trim();
  if (isLegacyBlank) {
    // Legados sem secretaria só pertencem à SMA/SEAD e só podem ser vistos se o usuário tiver vínculo com a SMA e estiver nela
    if (!canUserViewLegacyAdminRecords(user, secretariasList)) return false;
    if (getSecretariaSigla(activeSecretaria, secretariasList) !== 'SMA') return false;
  } else {
    if (!isRecordFromSecretaria(record.secretaria, activeSecretaria, secretariasList)) return false;
  }

  // 2. Filtro de Acessibilidade Documental (Secretaria / Departamento / Próprio Servidor)
  const eff = getEffectiveAccessibilityFilter(user);

  // Caso 2a: Acesso liberado a toda a Secretaria autorizada
  if (eff.acessarSecretaria) {
    return true;
  }

  // Caso 2b: Acesso ao Departamento do servidor (somente se o servidor possuir departamento específico)
  const sameDepto = eff.acessarDepartamento &&
    hasSpecificDepartamento(user) &&
    isRecordFromDepartamento(record.departamento, user.departamento, record.secretaria, secretariasList);

  // Caso 2c: Acesso a documentos emitidos pelo próprio servidor
  const isOwnDoc = eff.acessarProprios && isOwnDocumentRecord(user, record);

  return sameDepto || isOwnDoc;
}

/**
 * Calcula o próximo número sequencial independente para a Secretaria + Tipo de Documento + Ano
 */
export function getNextSequentialForSecretaria(
  records: RegistroNumeracao[],
  tipoDoc: string,
  secretaria: string,
  anoAtual: string = new Date().getFullYear().toString(),
  secretariasList: SecretariaItem[] = INITIAL_SECRETARIAS
): number {
  const normTipo = tipoDoc.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const targetSigla = getSecretariaSigla(secretaria, secretariasList);
  const isTargetSEAD = targetSigla === 'SMA';

  let maxSeq = 0;
  for (const r of records) {
    const rTipo = (r.tipoDocumento || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    if (rTipo !== normTipo) continue;

    const rSec = r.secretaria || '';
    const matches = !rSec.trim()
      ? isTargetSEAD
      : isSameSecretaria(rSec, secretaria, secretariasList);
    if (!matches) continue;

    const numStr = String(r.numero || '').trim();
    // Reconhece formatos: "001/2026", "001/2026 - SMA", "1/2026", "01/01/2026"
    const match = numStr.match(/^(\d+)[\/\-](\d{4})/);
    if (match) {
      const ano = match[2];
      if (ano === anoAtual) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }

  return maxSeq + 1;
}

export const INITIAL_NUMERACOES: RegistroNumeracao[] = [];

export const INITIAL_SUGESTOES = {
  destinatarios: [
    'Secretaria Municipal de Educação (SME)',
    'Secretaria Municipal de Finanças e Fazenda',
    'Secretaria Municipal de Saúde (SMS)',
    'Controladoria Geral do Município (CGM)',
    'Procuradoria Geral do Município (PGM)',
    'Gabinete do Prefeito',
    'Divisão de Recursos Humanos e Folha',
    'Câmara Municipal de Rio Claro – RJ',
    'Instituto de Previdência Municipal (IPRC)',
    'Departamento de Compras e Licitações',
    'Arquivo Geral do Município'
  ],
  assuntos: [
    'Entrada de Ofício e Providências Funcionais',
    'Verificação de candidato aprovado em concurso público',
    'Verificação de candidato aprovado em processo seletivo simplificado',
    'Solicitação de manifestação jurídica sobre convocação',
    'Concessão de licença por assiduidade',
    'Encaminhamento de Impacto Orçamentário da Folha de Pagamento',
    'Comunicação Interna sobre Recadastramento Previdenciário',
    'Escala de Plantão e Férias Coletivas do Setor de Arrecadação',
    'Averbação de Certidão de Tempo de Contribuição (CTC)',
    'Elaboração de minuta de termo aditivo',
    'Contratação temporária excepcional de docente'
  ]
};

export const INITIAL_MODELOS: ModeloDocumental[] = (realModelsRaw as any[]).map(item => ({
  ID: item.ID || '',
  TipoDocumento: (item.TipoDocumento || 'DESPACHO').toUpperCase(),
  Area: item.Area || 'Recursos Humanos',
  SubArea: item.SubArea || 'Geral',
  Categoria: item.Categoria || '1. Recursos Humanos',
  Titulo: item.Titulo || 'Sem Título',
  Assunto: item.Assunto || item.Titulo || '',
  Texto: item.Texto || '',
  Observacao: item.Observacao || '',
  PalavrasChave: item.PalavrasChave || '',
  SetorOrigem: item.SetorOrigem || 'Departamento de Recursos Humanos',
  SetorDestino: item.SetorDestino || '',
  TipoDecisao: item.TipoDecisao || 'INFORMATIVO',
  BaseLegal: item.BaseLegal || '',
  Prioridade: item.Prioridade || 'NORMAL',
  Favorito: item.Favorito === true,
  UsoFrequente: Number(item.UsoFrequente) || 0,
  Versao: item.Versao || '1.0',
  Ativo: item.Ativo !== false
}));

export const INITIAL_LOGS: RegistroLog[] = [];
