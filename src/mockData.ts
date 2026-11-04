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
}

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
    titular: 'Carlos Eduardo Mendes',
    departamentos: ['Departamento de Recursos Humanos (DRH)', 'Divisão de Treinamento e Desenvolvimento', 'Coordenação de Folha de Pagamento', 'Departamento de Patrimônio e Logística'],
    email: 'administracao@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1200'
  },
  {
    sigla: 'SMS',
    nome: 'Secretaria Municipal de Saúde',
    titular: 'Dr. Fernando Vasconcelos',
    departamentos: ['Vigilância Sanitária', 'Departamento de Atenção Básica', 'Divisão de Farmácia Municipal', 'Regulação e Transporte Sanitário'],
    email: 'saude@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1300'
  },
  {
    sigla: 'SME',
    nome: 'Secretaria Municipal de Educação',
    titular: 'Profª Cláudia Guimarães',
    departamentos: ['Coordenação Pedagógica', 'Divisão de Nutrição e Merenda Escolar', 'Departamento de Transporte Escolar', 'Gestão de Unidades Escolares'],
    email: 'educacao@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1400'
  },
  {
    sigla: 'SMF',
    nome: 'Secretaria Municipal de Fazenda e Finanças',
    titular: 'Rodrigo Antunes',
    departamentos: ['Departamento de Tributação e Fiscalização', 'Divisão de Tesouraria e Contabilidade', 'Dívida Ativa', 'Arrecadação Municipal'],
    email: 'fazenda@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1500'
  },
  {
    sigla: 'SMOSP',
    nome: 'Secretaria Municipal de Obras e Serviços Públicos',
    titular: 'Eng. Marcelo Peixoto',
    departamentos: ['Departamento de Vias Urbanas e Rurais', 'Divisão de Limpeza e Conservação', 'Setor de Projetos e Fiscalização de Obras'],
    email: 'obras@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1600'
  },
  {
    sigla: 'SMAS',
    nome: 'Secretaria Municipal de Ação Social e Cidadania',
    titular: 'Beatriz Rezende',
    departamentos: ['CRAS - Centro de Referência', 'CREAS', 'Gestão do Cadastro Único e Bolsa Família', 'Conselho Tutelar'],
    email: 'social@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1700'
  },
  {
    sigla: 'PGM',
    nome: 'Procuradoria-Geral do Município',
    titular: 'Dr. Roberto Mendes de Oliveira',
    departamentos: ['Consultoria Jurídica', 'Contencioso Administrativo e Judicial', 'Execuções Fiscais'],
    email: 'procuradoria@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1800'
  },
  {
    sigla: 'SEGOV',
    nome: 'Secretaria de Governo e Gabinete do Prefeito',
    titular: 'Gabinete do Executivo',
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
      'Secretaria de Governo e Gabinete do Prefeito (SEGOV)',
      'Secretaria Municipal de Saúde (SMS)'
    ],
    nivel: 'ADMIN',
    ativo: true
  },
  {
    matricula: '1002',
    senha: '123',
    nome: 'Mariana Santos Silva',
    cargo: 'Diretora do Departamento de Recursos Humanos',
    departamento: 'Departamento de Recursos Humanos (DRH)',
    secretaria: 'Secretaria Municipal de Administração (SMA)',
    secretarias: ['Secretaria Municipal de Administração (SMA)'],
    nivel: 'ADMIN',
    ativo: true
  },
  {
    matricula: '1003',
    senha: '123',
    nome: 'Carlos Eduardo Mendes',
    cargo: 'Secretário Municipal de Administração',
    departamento: 'Gabinete da Secretaria de Administração',
    secretaria: 'Secretaria Municipal de Administração (SMA)',
    secretarias: ['Secretaria Municipal de Administração (SMA)'],
    nivel: 'ADMIN',
    ativo: true
  },
  {
    matricula: '1004',
    senha: '123',
    nome: 'Ana Paula Ferreira',
    cargo: 'Coordenadora de Gestão de Pessoal e Folha',
    departamento: 'Divisão de Recursos Humanos e Folha',
    secretaria: 'Secretaria Municipal de Administração (SMA)',
    secretarias: ['Secretaria Municipal de Administração (SMA)'],
    nivel: 'PADRAO',
    ativo: true
  },
  {
    matricula: '1005',
    senha: '123',
    nome: 'Dr. Roberto Mendes de Oliveira',
    cargo: 'Procurador-Geral do Município',
    departamento: 'Gabinete da Procuradoria',
    secretaria: 'Procuradoria-Geral do Município (PGM)',
    secretarias: ['Procuradoria-Geral do Município (PGM)'],
    nivel: 'PADRAO',
    ativo: true
  },
  {
    matricula: '1006',
    senha: '123',
    nome: 'Juliana Almeida Prado',
    cargo: 'Controladora-Geral do Município',
    departamento: 'Gabinete da Controladoria',
    secretaria: 'Controladoria Geral do Município (CGM)',
    secretarias: ['Controladoria Geral do Município (CGM)'],
    nivel: 'PADRAO',
    ativo: true
  },
  {
    matricula: '1007',
    senha: '123',
    nome: 'Dra. Camila Nogueira Ramos',
    cargo: 'Secretária Municipal de Saúde',
    departamento: 'Gabinete da Saúde',
    secretaria: 'Secretaria Municipal de Saúde (SMS)',
    secretarias: ['Secretaria Municipal de Saúde (SMS)'],
    nivel: 'PADRAO',
    ativo: true
  },
  {
    matricula: '1008',
    senha: '123',
    nome: 'Profª Tereza Cristina Viana',
    cargo: 'Secretária Municipal de Educação',
    departamento: 'Gabinete da Educação',
    secretaria: 'Secretaria Municipal de Educação (SME)',
    secretarias: ['Secretaria Municipal de Educação (SME)'],
    nivel: 'PADRAO',
    ativo: true
  },
  {
    matricula: '1009',
    senha: '123',
    nome: 'Eng. Marcos Vinícius Rocha',
    cargo: 'Secretário Municipal de Obras e Serviços Públicos',
    departamento: 'Gabinete de Obras',
    secretaria: 'Secretaria Municipal de Obras e Serviços Públicos (SMOSP)',
    secretarias: ['Secretaria Municipal de Obras e Serviços Públicos (SMOSP)'],
    nivel: 'PADRAO',
    ativo: true
  },
  {
    matricula: '2002',
    senha: '123',
    nome: 'Mariana Souza Silva',
    cargo: 'Técnica de Gestão Pública',
    departamento: 'Divisão de Treinamento e Desenvolvimento',
    secretaria: 'Secretaria Municipal de Administração (SMA)',
    secretarias: ['Secretaria Municipal de Administração (SMA)'],
    nivel: 'PADRAO',
    ativo: true
  },
  {
    matricula: '3003',
    senha: '123',
    nome: 'Roberto Albuquerque',
    cargo: 'Oficial Administrativo',
    departamento: 'Setor de Protocolo e Arquivo Geral',
    secretaria: 'Secretaria Municipal de Administração (SMA)',
    secretarias: ['Secretaria Municipal de Administração (SMA)'],
    nivel: 'PADRAO',
    ativo: true
  }
];

/**
 * Normaliza e obtém a sigla oficial de uma Secretaria / Pasta Municipal
 */
export function getSecretariaSigla(secretariaNomeOrSigla?: string, secretariasList: SecretariaItem[] = INITIAL_SECRETARIAS): string {
  if (!secretariaNomeOrSigla) return 'SMA';
  const clean = String(secretariaNomeOrSigla).trim();
  
  // Se contiver sigla entre parênteses: "Secretaria Municipal de Administração (SMA)" -> "SMA"
  const matchParen = clean.match(/\(([A-Z0-9_\-]+)\)/i);
  if (matchParen) return matchParen[1].toUpperCase();

  // Busca na lista estruturada
  const found = secretariasList.find(s => 
    s.sigla.toUpperCase() === clean.toUpperCase() ||
    s.nome.toLowerCase() === clean.toLowerCase() ||
    clean.toLowerCase().includes(s.sigla.toLowerCase()) ||
    clean.toLowerCase().includes(s.nome.toLowerCase())
  );
  if (found) return found.sigla;

  // Se já for sigla curta
  if (clean.length <= 8 && clean === clean.toUpperCase()) return clean;

  // Deriva sigla por iniciais
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
 * Regra de Negócio: Verifica se um registro documental pertence à Secretaria especificada.
 * NOTA: Registros sem secretaria explícita (como os 841 legados) pertencem à Secretaria de Administração (SEAD/SMA).
 */
export function isRecordFromSecretaria(recordSec: string | undefined, targetSec: string): boolean {
  if (!targetSec) return true;
  const targetNorm = targetSec.toLowerCase();
  const isTargetSEAD = targetNorm.includes('administra') || targetNorm.includes('sma') || targetNorm.includes('sead');

  // Registros sem secretaria ou legados pertencem à SEAD
  if (!recordSec || !recordSec.trim()) {
    return isTargetSEAD;
  }

  const recNorm = recordSec.toLowerCase();
  if (isTargetSEAD && (recNorm.includes('administra') || recNorm.includes('sma') || recNorm.includes('sead'))) {
    return true;
  }

  return recNorm.includes(targetNorm) || targetNorm.includes(recNorm);
}

/**
 * Regra de Negócio: Verifica se o servidor atual possui autorização de visualização para a secretaria.
 * ADMIN possui visão irrestrita. Servidores com vínculo à Secretaria de Administração têm acesso aos legados.
 */
export function isUserAuthorizedForSecretaria(user: UsuarioSistema | null, targetSec?: string): boolean {
  if (!user) return false;
  if (user.nivel === 'ADMIN') return true;
  if (!targetSec) return true;

  const targetNorm = targetSec.toLowerCase();
  const isTargetSEAD = targetNorm.includes('administra') || targetNorm.includes('sma') || targetNorm.includes('sead');

  const userSecs = [
    user.secretaria,
    ...(user.secretarias || [])
  ].filter(Boolean).map(s => String(s).toLowerCase());

  return userSecs.some(s => {
    if (isTargetSEAD && (s.includes('administra') || s.includes('sma') || s.includes('sead'))) return true;
    return s.includes(targetNorm) || targetNorm.includes(s);
  });
}

/**
 * Verifica se o usuário tem permissão para acessar os 841 registros históricos legados da SEAD
 */
export function canUserViewLegacyAdminRecords(user: UsuarioSistema | null): boolean {
  if (!user) return false;
  if (user.nivel === 'ADMIN') return true;
  const userSecs = [
    user.secretaria,
    ...(user.secretarias || [])
  ].filter(Boolean).map(s => String(s).toLowerCase());
  return userSecs.some(s => s.includes('administra') || s.includes('sma') || s.includes('sead'));
}

/**
 * Calcula o próximo número sequencial independente para a Secretaria + Tipo de Documento + Ano
 */
export function getNextSequentialForSecretaria(
  records: RegistroNumeracao[],
  tipoDoc: string,
  secretaria: string,
  anoAtual: string = new Date().getFullYear().toString()
): number {
  const normTipo = tipoDoc.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const isTargetSEAD = secretaria.toLowerCase().includes('administra') || secretaria.toLowerCase().includes('sma') || secretaria.toLowerCase().includes('sead');

  let maxSeq = 0;
  for (const r of records) {
    const rTipo = (r.tipoDocumento || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    if (rTipo !== normTipo) continue;

    const rSec = r.secretaria || '';
    const isRecordSEAD = !rSec || rSec.toLowerCase().includes('administra') || rSec.toLowerCase().includes('sma') || rSec.toLowerCase().includes('sead');

    const matches = isTargetSEAD ? isRecordSEAD : isRecordFromSecretaria(rSec, secretaria);
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

export const INITIAL_NUMERACOES: RegistroNumeracao[] = [
  {
    dataHora: '2026-02-10T14:22:10.000Z',
    tipoDocumento: 'MEMORANDO',
    numero: '001/2026 - SMA',
    assunto: 'Entrada de Ofício e Providências Funcionais',
    usuario: 'Carlos Eduardo Mendes',
    servidor: 'Carlos Eduardo Mendes (20851)',
    destinatario: 'Secretaria Municipal de Educação (SME)',
    secretaria: 'Secretaria Municipal de Administração (SMA)',
    departamento: 'Departamento de Recursos Humanos'
  },
  {
    dataHora: '2026-02-15T09:12:45.000Z',
    tipoDocumento: 'OFICIO',
    numero: '001/2026 - SMA',
    assunto: 'Encaminhamento de Impacto Orçamentário da Folha de Pagamento',
    usuario: 'Mariana Souza Silva',
    servidor: 'Mariana Souza Silva (10442)',
    destinatario: 'Secretaria Municipal de Finanças e Fazenda',
    secretaria: 'Secretaria Municipal de Administração (SMA)',
    departamento: 'Divisão de Folha de Pagamento'
  },
  {
    dataHora: '2026-02-28T16:40:00.000Z',
    tipoDocumento: 'DESPACHO',
    numero: '001/2026 - SMA',
    assunto: 'Concessão de Licença por Assiduidade',
    usuario: 'Carlos Eduardo Mendes',
    servidor: 'Carlos Eduardo Mendes (20851)',
    destinatario: 'Divisão de Recursos Humanos e Folha',
    secretaria: 'Secretaria Municipal de Administração (SMA)',
    departamento: 'Departamento de Recursos Humanos'
  },
  {
    dataHora: '2026-03-05T11:05:30.000Z',
    tipoDocumento: 'MEMORANDO',
    numero: '002/2026 - SMA',
    assunto: 'Comunicação Interna sobre Recadastramento Previdenciário',
    usuario: 'Mariana Souza Silva',
    servidor: 'Mariana Souza Silva (10442)',
    destinatario: 'Controladoria Geral do Município (CGM)',
    secretaria: 'Secretaria Municipal de Administração (SMA)',
    departamento: 'Gabinete'
  },
  {
    dataHora: '2026-03-12T15:30:12.000Z',
    tipoDocumento: 'OFICIO',
    numero: '002/2026 - SMA',
    assunto: 'Solicitação de Informações de Servidores Cedidos',
    usuario: 'Carlos Eduardo Mendes',
    servidor: 'Carlos Eduardo Mendes (20851)',
    destinatario: 'Câmara Municipal de Rio Claro – RJ',
    secretaria: 'Secretaria Municipal de Administração (SMA)',
    departamento: 'Departamento de Recursos Humanos'
  }
];

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

export const INITIAL_LOGS: RegistroLog[] = [
  {
    dataHora: '2026-02-10T14:22:15.000Z',
    usuario: 'Carlos Eduardo Mendes',
    acao: 'GERAR_NUMERO',
    docId: '1/2026',
    detalhes: 'Emitiu MEMORANDO 1/2026 | Dest: Secretaria Municipal de Educação (SME) | Assunto: Entrada de Ofício e Providências Funcionais'
  },
  {
    dataHora: '2026-02-15T09:12:50.000Z',
    usuario: 'Mariana Souza Silva',
    acao: 'GERAR_NUMERO',
    docId: '1/2026',
    detalhes: 'Emitiu OFICIO 1/2026 | Dest: Secretaria Municipal de Finanças e Fazenda | Assunto: Encaminhamento de Impacto Orçamentário da Folha de Pagamento'
  },
  {
    dataHora: '2026-02-28T16:40:05.000Z',
    usuario: 'Carlos Eduardo Mendes',
    acao: 'GERAR_NUMERO',
    docId: '1/2026',
    detalhes: 'Emitiu DESPACHO 1/2026 | Dest: Divisão de Recursos Humanos e Folha | Assunto: Concessão de licença por assiduidade'
  },
  {
    dataHora: '2026-03-05T11:05:35.000Z',
    usuario: 'Mariana Souza Silva',
    acao: 'GERAR_NUMERO',
    docId: '2/2026',
    detalhes: 'Emitiu MEMORANDO 2/2026 | Dest: Controladoria Geral do Município (CGM) | Assunto: Comunicação Interna sobre Recadastramento Previdenciário'
  },
  {
    dataHora: '2026-03-12T15:30:18.000Z',
    usuario: 'Carlos Eduardo Mendes',
    acao: 'GERAR_NUMERO',
    docId: '2/2026',
    detalhes: 'Emitiu OFICIO 2/2026 | Dest: Câmara Municipal de Rio Claro – RJ | Assunto: Solicitação de Informações de Servidores Cedidos'
  }
];
