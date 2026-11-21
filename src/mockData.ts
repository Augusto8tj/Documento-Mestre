import realModelsRaw from './importedRealModels.json';
import {
  TIPOS_DOCUMENTO_NUMERADOS_OFICIAIS,
  MODELOS_PGM_E_ADMINISTRATIVOS_OFICIAIS
} from './documentTypes';
import { MODELOS_SETORES_MUNICIPAIS_OFICIAIS } from './sectorModels';

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
  EstiloId?: string;
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
  cargo?: string; // Cargo Efetivo (Quadro Permanente, * Em Extinção, ** Extinto)
  funcaoGratificada?: string; // Cargo em Subsídio (SS), Cargo em Comissão (CC) ou Função Gratificada (FG) — Anexos I e II
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
  funcaoGratificada?: string;
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
];

export const CARGOS_PREFEITURA_BASE: string[] = [
  'ACS - RIO CLARO/RJ – MÓDULO 1',
  'ADMINISTRADOR',
  'AGENTE AUX. DE SERVIÇOS. MUN. GERAIS *',
  'AGENTE DE APOIO EDUCACIONAL',
  'AGENTE DE CONTROLE DE ENDEMIAS',
  'AGENTE DE CONTROLE DE ZOONOSES (*)',
  'AGENTE DE DEFESA CIVIL (*)',
  'AJUDANTE DE MECÂNICO (*)',
  'ALMOXARIFE',
  'ANIMADOR CULTURAL (*)',
  'ARQUITETO',
  'ARQUIVISTA (*)',
  'ARTESÃO',
  'ASSESSOR TÉCNICO',
  'ASSISTENTE DE CADASTRO (**)',
  'ASSISTENTE DE CONTABILIDADE',
  'ASSISTENTE DE CPD',
  'ASSISTENTE DE PESSOAL',
  'ASSISTENTE DE TESOURARIA',
  'ASSISTENTE SOCIAL',
  'AUDITOR FISCAL TRIBUTÁRIO',
  'AUDITOR GERAL',
  'AUXILIAR ADMINISTRATIVO',
  'AUXILIAR ADMINISTRATIVO EM BIBLIOTECONOMIA (*)',
  'AUXILIAR DE AUDITORIA (**)',
  'AUXILIAR DE CADASTRO',
  'AUXILIAR DE CPD (*)',
  'AUXILIAR DE CRECHE (*)',
  'AUXILIAR DE DIVIDA ATIVA (**)',
  'AUXILIAR DE ELETRICISTA CIVIL (**)',
  'AUXILIAR DE ENFERMAGEM (*)',
  'AUXILIAR DE FISCALIZAÇÃO (**)',
  'AUXILIAR DE SAUDE BUCAL',
  'AUXILIAR DE SERVIÇOS EXTERNOS (*)',
  'AUXILIAR DE SERVIÇOS GERAIS (*)',
  'AUXILIAR DE TESOURARIA (*)',
  'BIÓLOGO (SAÚDE)',
  'BIÓLOGO AMBIENTAL',
  'BOMBEIRO HIDRÁULICO (*)',
  'BORRACHEIRO ESPECIALIZADO (**)',
  'CANTONEIRO (*)',
  'CARPINTEIRO (*)',
  'CHEFE DE DIVISÃO',
  'CHEFE DE GABINETE',
  'CIRURGIÃO-DENTISTA',
  'CONTADOR',
  'CONTROLADOR GERAL DO MUNICÍPIO',
  'COORDENADOR',
  'COVEIRO (*)',
  'COZINHEIRA (*)',
  'CUIDADOR/EDUCADOR (*)',
  'DIRETOR DE DEPARTAMENTO',
  'DOCENTE I',
  'DOCENTE I - AEE',
  'DOCENTE I – LIBRAS',
  'DOCENTE II',
  'DOCENTE II - ARTE (*)',
  'DOCENTE II – ARTE (ARTES VISUAIS)',
  'DOCENTE II – ARTE (MÚSICA)',
  'DOCENTE II – CIÊNCIAS',
  'DOCENTE II – EDUCAÇÃO FÍSICA',
  'DOCENTE II – EMPREENDEDORISMO',
  'DOCENTE II – GEOGRAFIA',
  'DOCENTE II – HISTÓRIA',
  'DOCENTE II – INGLÊS',
  'DOCENTE II – MATEMÁTICA',
  'DOCENTE II – PORTUGUÊS',
  'DOCENTE II - TÉCNICAS AGRÍCOLAS',
  'EDUCADOR FISICO (**)',
  'ELETRICISTA CIVIL',
  'ELETRICISTA DE AUTOS (*)',
  'ENCARREGADO DE TURMA (**)',
  'ENFERMEIRO',
  'ENFERMEIRO - ESF',
  'ENGENHEIRO AGRONOMO',
  'ENGENHEIRO AMBIENTAL',
  'ENGENHEIRO CIVIL',
  'ENGENHEIRO FLORESTAL',
  'FARMACÊUTICO',
  'FEITOR (*)',
  'FISCAL AMBIENTAL',
  'FISCAL DE INSPEÇÃO SANITÁRIA',
  'FISCAL DE OBRAS',
  'FISCAL DE POSTURAS',
  'FISCAL DE TRIBUTOS',
  'FISCAL DE TRIBUTOS E POSTURA (*)',
  'FISIOTERAPEUTA',
  'FISIOTERAPEUTA ACUPUNTURISTA',
  'FONOAUDIÓLOGO',
  'FONOAUDIOLOGO (*)',
  'GARI (*)',
  'GUARDA CIVIL MUNICIPAL',
  'GUARDA MUNICIPAL (**)',
  'GUARDA MUNICIPAL AMBIENTAL',
  'INSTRUTOR DE BRAILLE',
  'INSTRUTOR DE LIBRAS',
  'INTERPRETE DE LIBRAS',
  'JARDINEIRO (**)',
  'JORNALISTA',
  'LAVADEIRA (*)',
  'LUBRIFICADOR (**)',
  'MAESTRO (**)',
  'MECÂNICO',
  'MÉDICO - ESF',
  'MÉDICO (*)',
  'MÉDICO ANESTESIOLOGISTA PLANTONISTA (**)',
  'MÉDICO ANGIOLOGISTA (**)',
  'MÉDICO CARDIOLOGISTA (**)',
  'MÉDICO CIRURGIÃO GERAL',
  'MÉDICO CLINICO GERAL',
  'MÉDICO DERMATOLOGISTA',
  'MÉDICO DO TRABALHO (**)',
  'MÉDICO GASTROENTEROLOGISTA (**)',
  'MÉDICO GERIATRA (**)',
  'MÉDICO GINECOLOGISTA/OBSTETRA',
  'MÉDICO INFECTOLOGISTA (**)',
  'MÉDICO NEUROLOGISTA',
  'MÉDICO NEUROPEDIATRIA',
  'MÉDICO OFTALMOLOGISTA',
  'MÉDICO ORTOPEDISTA (**)',
  'MÉDICO OTORRINOLARINGOLOGISTA',
  'MÉDICO PEDIATRA',
  'MÉDICO PLANT–GINECOLOGISTA/OBSTETRA',
  'MÉDICO PLANTONISTA',
  'MÉDICO PLANTONISTA PEDIATRA',
  'MÉDICO PNEUMOLOGISTA (**)',
  'MÉDICO PSIQUIATRA',
  'MÉDICO RADIOLOGISTA',
  'MÉDICO SANITARISTA',
  'MÉDICO ULTRASSONOGRAFISTA (**)',
  'MÉDICO UROLOGISTA',
  'MÉDICO VETERINÁRIO',
  'MÉDICO VISITADOR',
  'MONITOR DE EDUCAÇÃO ESPECIAL (*)',
  'MONITOR DE INFORMÁTICA',
  'MONITOR ESCOLAR (*)',
  'MOTORISTA (*)',
  'MOTORISTA DE CARGA (*)',
  'MOTORISTA ESPECIAL (*)',
  'MÚSICO (*)',
  'NUTRICIONISTA',
  'OPERADOR DE MÁQUINAS PESADAS (*)',
  'PEDAGOGO',
  'PEDREIRO (*)',
  'PEDREIRO ESPECIALIZADO (*)',
  'PINTOR (*)',
  'PREFEITO MUNICIPAL',
  'PROCURADOR DO MUNICÍPIO',
  'PROCURADOR-GERAL DO MUNICÍPIO',
  'PROFESSOR LEIGO (*)',
  'PROGRAMADOR DE CPD',
  'PSICÓLOGO',
  'PSICÓLOGO - CAPS',
  'PSICÓLOGO - PPB',
  'PSICOLOGO (*)',
  'PSICOPEDAGOGO',
  'RECEPCIONISTA',
  'SECRETÁRIA EXECUTIVA (**)',
  'SECRETÁRIA JUNIOR',
  'SECRETÁRIA(O) ESCOLAR',
  'SECRETÁRIO(A) MUNICIPAL',
  'SERVENTE (*)',
  'SERVENTE ESCOLAR (*)',
  'SOLDADOR (*)',
  'SUBSECRETÁRIO(A) MUNICIPAL',
  'TÉCNICO AGRICOLA',
  'TÉCNICO DE CONTABILIDADE',
  'TÉCNICO DE ENFERMAGEM',
  'TÉCNICO DE ENFERMAGEM - ESF',
  'TECNICO DE IMOBILIZAÇÃO ORTOPEDICA',
  'TÉCNICO DE LABORATÓRIO',
  'TECNICO DE MEIO AMBIENTE',
  'TÉCNICO DE RADIOLOGIA',
  'TELEFONISTA',
  'TERAPEUTA OCUPACIONAL',
  'TERAPEUTA OCUPACIONAL (**)',
  'TURISMOLOGO',
  'VICE-PREFEITO',
  'VIGIA (*)'
];

export function getCargosSugeridosUnificados(
  usuarios?: UsuarioSistema[],
  baseCargos: string[] = CARGOS_PREFEITURA_BASE
): string[] {
  const map = new Map<string, string>();
  const addCargo = (raw?: string) => {
    const clean = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!clean || clean.toLowerCase() === 'servidor municipal' || clean.toLowerCase() === 'servidor público municipal') {
      return;
    }
    const key = clean.toUpperCase();
    if (!map.has(key)) {
      map.set(key, clean);
    }
  };

  baseCargos.forEach(addCargo);
  (usuarios || []).forEach(u => addCargo(u.cargo));

  return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export const INITIAL_SECRETARIAS: SecretariaItem[] = [
  {
    sigla: 'SEGOV',
    nome: 'Secretaria Municipal de Governo',
    titular: 'Secretário Municipal de Governo / Gabinete do Prefeito',
    departamentos: [
      'Gabinete do Prefeito',
      'Assessoria de Gabinete',
      'Assessoria de Comunicação Social',
      'Assessoria Distrital',
      'Divisão de Junta de Serviço Militar',
      'Divisão de Identificação Civil',
      'Divisão de Protocolo Geral'
    ],
    email: 'gabinete@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1100'
  },
  {
    sigla: 'SMA',
    nome: 'Secretaria Municipal de Administração',
    titular: 'Secretário Municipal de Administração',
    departamentos: [
      'Departamento de Pessoal',
      'Departamento de Recursos Humanos (DRH)',
      'Departamento de Treinamento e Desenvolvimento de RH',
      'Divisão de Treinamento e Desenvolvimento de RH',
      'Departamento de Tecnologia da Informação',
      'Departamento de Licitação',
      'Departamento de Compras',
      'Departamento de Contratos',
      'Departamento de Convênios',
      'Departamento de Arquivo',
      'Departamento de Patrimônio',
      'Departamento de Almoxarifado',
      'Divisão de Benefícios',
      'Divisão de Folha de Pagamento',
      'Divisão de Segurança do Trabalho',
      'Divisão de Apoio aos Órgãos Estaduais e Federais'
    ],
    email: 'administracao@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1200'
  },
  {
    sigla: 'SMF',
    nome: 'Secretaria Municipal de Finanças',
    titular: 'Secretário(a) Municipal de Finanças',
    departamentos: [
      'Diretoria-Geral de Contabilidade',
      'Departamento de Tesouraria',
      'Departamento de Cadastro e Arrecadação',
      'Departamento de Dívida Ativa',
      'Departamento de Fiscalização Tributária',
      'Departamento de Cadastro Imobiliário, Lançamento e Controle',
      'Departamento de Planejamento e Orçamento',
      'Departamento de Contabilidade - SIGFIS',
      'Divisão de Dívida Ativa',
      'Divisão de ITBI e Certidões',
      'Divisão de IPTU e Emissão de Guias',
      'Divisão de Pagamentos',
      'Divisão de Contabilidade - SIGFIS',
      'Divisão de Tomada de Contas'
    ],
    email: 'fazenda@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1500'
  },
  {
    sigla: 'IPRC',
    nome: 'Secretaria Municipal de Previdência Social',
    titular: 'Secretário(a) Municipal de Previdência Social / FUNPREV-RC',
    departamentos: [
      'Departamento de Finanças do FUNPREV-RC',
      'Departamento de Benefício Previdenciário',
      'Departamento de Contabilidade/SIGFIS',
      'Departamento de Patrimônio',
      'Departamento de COMPREV',
      'Departamento de Compras',
      'Divisão de Controle de Receitas',
      'Divisão de Tesouraria',
      'Divisão de Folha de Pagamento',
      'Divisão de Processo Administrativo',
      'Divisão de Apoio aos Conselhos',
      'Divisão de Protocolo e Arquivo'
    ],
    email: 'previdencia@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1900'
  },
  {
    sigla: 'SME',
    nome: 'Secretaria Municipal de Educação',
    titular: 'Secretário(a) Municipal de Educação',
    departamentos: [
      'Subsecretaria de Gestão Pedagógica',
      'Subsecretaria de Gestão Administrativa',
      'Departamento de Tecnologia Educacional',
      'Departamento de Planejamento e Estatística',
      'Departamento de Apoio Administrativo',
      'Departamento de Manutenção Escolar e Transporte',
      'Departamento de Patrimônio e Arquivo',
      'Departamento de Compras',
      'Departamento de Recursos Humanos',
      'Departamento de Almoxarifado',
      'Departamento de Merenda Escolar',
      'Departamento de Contabilidade/SIGFIS',
      'Departamento de Tesouraria',
      'Divisão de Educação Infantil',
      'Divisão de Ensino Fundamental Anos Iniciais',
      'Divisão de Ensino Fundamental Anos Finais',
      'Divisão de Educação Especial e Inclusiva',
      'Divisão de Projetos Educacionais e Esportivos',
      'Divisão de Atendimento Psicológico e Psicopedagógico',
      'Divisão de Censo Escolar',
      'Divisão de Legislação Educacional',
      'Divisão de Orientação e Inspeção Escolar',
      'Divisão de Assistência Social Escolar',
      'Divisão de Documentação e Protocolo',
      'Divisão de Pagamentos e Prestação de Contas',
      'Divisão de Gestão de Contratos e Convênios',
      'Gestão de Unidades Escolares'
    ],
    email: 'educacao@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1400'
  },
  {
    sigla: 'SMAS',
    nome: 'Secretaria Municipal de Assistência Social e Direitos Humanos',
    titular: 'Secretário(a) Municipal de Assistência Social e Direitos Humanos',
    departamentos: [
      'Departamento de Contabilidade',
      'Departamento de Tesouraria',
      'Departamento de Proteção Básica',
      'Departamento de Proteção Social Especial',
      'Departamento de Cadastro Único e Gestão de Benefícios',
      'Departamento de Planejamento, Gestão do SUAS e Direitos Humanos',
      'Departamento de Vigilância Socioassistencial e Gestão da Informação',
      'Departamento de Apoio Administrativo',
      'Divisão de Recursos Humanos',
      'Divisão de Compras',
      'Divisão de Apoio aos Conselhos Municipais',
      'Divisão de Ações Socioassistenciais',
      'Divisão de Cuidados com o Idoso',
      'Divisão de Gestão de Trabalho e Educação Permanente',
      'Divisão de Patrimônio e Almoxarifado',
      'CRAS - Centro de Referência',
      'CREAS'
    ],
    email: 'social@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1700'
  },
  {
    sigla: 'SMOSP',
    nome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos',
    titular: 'Secretário(a) Municipal de Planejamento Urbano, Obras e Serviços Públicos',
    departamentos: [
      'Departamento de Urbanismo e Licenciamento',
      'Departamento de Serviços Públicos',
      'Departamento de Obras Públicas',
      'Departamento de Transporte',
      'Departamento de Projetos e Engenharia',
      'Departamento de Fiscalização de Obras e Posturas',
      'Departamento de Acompanhamento e Fiscalização',
      'Divisão de Parques e Jardins',
      'Divisão de Limpeza Pública',
      'Divisão de Iluminação Pública',
      'Divisão de Topografia e Agrimensura',
      'Divisão de Manutenção de Cemitérios',
      'Divisão de Controle de Abastecimento',
      'Divisão de Oficina e Manutenção de Frota',
      'Divisão de Controle de Estoque e Almoxarifado',
      'Divisão de Controle de Patrimônio',
      'Divisão de Compras',
      'Divisão de Aprovação de Projetos'
    ],
    email: 'obras@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1600'
  },
  {
    sigla: 'SMMA',
    nome: 'Secretaria Municipal de Meio Ambiente e Agricultura',
    titular: 'Secretário(a) Municipal de Meio Ambiente e Agricultura',
    departamentos: [
      'Departamento de Licenciamento Ambiental',
      'Departamento de Fiscalização Ambiental',
      'Departamento de Saneamento e Resíduos Sólidos',
      'Departamento de Educação Ambiental e Recursos Hídricos',
      'Departamento de Defesa Agropecuária e Inspeção Sanitária',
      'Departamento de Estradas Vicinais',
      'Departamento de Assistência Técnica e Extensão Rural',
      'Departamento de Apoio ao Produtor Rural',
      'Divisão de Bem-Estar Animal',
      'Divisão de Licenciamento e Controle Ambiental',
      'Divisão de Educação Ambiental e Projetos',
      'Divisão de Reflorestamento e Áreas Verdes',
      'Divisão de Manutenção de Estradas Vicinais',
      'Divisão de Apoio à Agricultura Familiar e Pecuária',
      'Divisão de Controle de Frota e Maquinário Agrícola',
      'Divisão de Apoio Administrativo',
      'Divisão de Patrimônio e Almoxarifado'
    ],
    email: 'meioambiente@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1950'
  },
  {
    sigla: 'SMDEC',
    nome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer',
    titular: 'Secretário(a) Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer',
    departamentos: [
      'Departamento de Desenvolvimento Econômico e Trabalho',
      'Departamento de Cultura',
      'Departamento de Turismo',
      'Departamento de Eventos',
      'Departamento de Esporte e Lazer',
      'Departamento de Apoio Administrativo e Prestação de Contas',
      'Divisão de Fomento ao Empreendedorismo',
      'Divisão de Turismo',
      'Divisão de Promoção de Eventos',
      'Divisão de Contabilidade - SIGFIS',
      'Divisão de Esporte e Lazer',
      'Divisão de Patrimônio Cultural',
      'Divisão de Gerenciamento de Bibliotecas Públicas',
      'Divisão de Patrimônio',
      'Divisão de Almoxarifado'
    ],
    email: 'desenvolvimento@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1960'
  },
  {
    sigla: 'SMOP',
    nome: 'Secretaria Municipal de Ordem Pública',
    titular: 'Secretário(a) Municipal de Ordem Pública',
    departamentos: [
      'Comando da Guarda Civil Municipal',
      'Departamento de Trânsito e Mobilidade Urbana',
      'Departamento de Defesa Civil',
      'Departamento de Posturas e Fiscalização',
      'Departamento de Controle de Operações',
      'Corregedoria da Guarda Municipal',
      'Ouvidoria da Ordem Pública'
    ],
    email: 'ordempublica@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1970'
  },
  {
    sigla: 'SMS',
    nome: 'Secretaria Municipal de Saúde',
    titular: 'Secretário(a) Municipal de Saúde',
    departamentos: [
      'Subsecretaria de Saúde',
      'Diretoria Técnica Médica',
      'Diretoria Administrativa do Hospital Nossa Senhora da Piedade',
      'Diretoria de Enfermagem',
      'Departamento de Atenção Básica',
      'Departamento de Média e Alta Complexidade',
      'Departamento de Vigilância em Saúde',
      'Departamento de Assistência Farmacêutica',
      'Departamento de Regulação, Controle e Avaliação',
      'Departamento de Saúde Bucal',
      'Departamento de Compras',
      'Departamento de Planejamento',
      'Departamento de Contabilidade - SIGFIS',
      'Departamento de Tesouraria',
      'Departamento de Transporte Sanitário',
      'Departamento de Recursos Humanos',
      'Divisão de Laboratório',
      'Divisão de Raio X',
      'Divisão de Nutrição',
      'Divisão Administrativa do SPA de Lídice',
      'Divisão de Patrimônio e Almoxarifado',
      'Divisão de Tecnologia da Informação',
      'Divisão de Saúde Mental',
      'Divisão de Reabilitação',
      'Divisão de Assistência Farmacêutica',
      'Divisão de Vigilância Epidemiológica',
      'Divisão de Vigilância Ambiental',
      'Divisão de Vigilância em Saúde do Trabalhador',
      'Divisão de Vigilância Sanitária',
      'Divisão de Estratégia e Saúde da Família - ESF',
      'Divisão de Saúde Bucal',
      'Divisão de Núcleo de Apoio à Saúde da Família',
      'Divisão de Tratamento Fora do Domicílio - TFD',
      'Divisão de Contabilidade',
      'Ouvidoria da Saúde'
    ],
    email: 'saude@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1300'
  },
  {
    sigla: 'PGM',
    nome: 'Procuradoria-Geral do Município',
    titular: 'Procurador-Geral do Município',
    departamentos: [
      'Gabinete do Procurador-Geral',
      'Subprocuradoria-Geral',
      'Assessoria Jurídica',
      'Consultoria Jurídica',
      'Contencioso Administrativo e Judicial',
      'Execuções Fiscais'
    ],
    email: 'procuradoria@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1800'
  },
  {
    sigla: 'CGM',
    nome: 'Controladoria-Geral do Município',
    titular: 'Controlador-Geral do Município',
    departamentos: [
      'Gabinete do Controlador-Geral',
      'Departamento de Controle Interno',
      'Departamento de Auditoria',
      'Departamento de Análise de Licitações e Contratos',
      'Departamento de Análise de Despesas e Prestação de Contas'
    ],
    email: 'controladoria@rioclaro.rj.gov.br',
    telefone: '(24) 3332-1850'
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
    if (parenSigla === 'SMASC' || parenSigla === 'SMASDH') return 'SMAS';
    if (parenSigla === 'GP') return 'SEGOV';
    if (parenSigla === 'SMPS' || parenSigla === 'FUNPREV') return 'IPRC';
    if (parenSigla === 'SMMAA') return 'SMMA';
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
  if (/\bsmas\b|\bsmasc\b|\bsmasdh\b/.test(normClean) || normBase.includes('acao social') || normBase.includes('assistencia social') || normBase.includes('direitos humanos')) return 'SMAS';
  if (/\bsms\b/.test(normClean) || normBase.includes('saude')) return 'SMS';
  if (/\bsme\b/.test(normClean) || normBase.includes('educacao')) return 'SME';
  if (/\bsmf\b/.test(normClean) || normBase.includes('fazenda') || normBase.includes('financas')) return 'SMF';
  if (/\bsmosp\b/.test(normClean) || normBase.includes('obras') || normBase.includes('planejamento urbano')) return 'SMOSP';
  if (/\bsmma\b|\bsmmaa\b/.test(normClean) || normBase.includes('meio ambiente') || normBase.includes('agricultura')) return 'SMMA';
  if (/\bsmdec\b/.test(normClean) || normBase.includes('desenvolvimento economico') || normBase.includes('cultura') || normBase.includes('turismo')) return 'SMDEC';
  if (/\bsmop\b/.test(normClean) || normBase.includes('ordem publica') || normBase.includes('guarda civil')) return 'SMOP';
  if (/\bpgm\b/.test(normClean) || normBase.includes('procuradoria')) return 'PGM';
  if (/\bcgm\b/.test(normClean) || normBase.includes('controladoria')) return 'CGM';
  if (/\biprc\b|\bsmps\b|\bfunprev\b/.test(normClean) || normBase.includes('previdencia')) return 'IPRC';
  if (/\bsegov\b|\bgp\b/.test(normClean) || normBase.includes('gabinete do prefeito') || normBase.includes('secretaria de governo') || normBase.includes('secretaria municipal de governo')) return 'SEGOV';

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

export interface ConfigNumeracaoMunicipal {
  tiposSequenciaGlobal: string[];
  atualizadoEm?: string;
  atualizadoPor?: string;
}

export const DEFAULT_CONFIG_NUMERACAO: ConfigNumeracaoMunicipal = {
  tiposSequenciaGlobal: ['DECRETO', 'PORTARIA']
};

export const TIPOS_DOCUMENTO_NUMERADOS = TIPOS_DOCUMENTO_NUMERADOS_OFICIAIS;

export function normalizeTipoDocumento(tipoDoc: string): string {
  return String(tipoDoc || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

export function isTipoSequenciaGlobal(
  tipoDoc: string,
  config?: ConfigNumeracaoMunicipal | null
): boolean {
  const norm = normalizeTipoDocumento(tipoDoc);
  const lista = config?.tiposSequenciaGlobal ?? DEFAULT_CONFIG_NUMERACAO.tiposSequenciaGlobal;
  return lista.some(t => normalizeTipoDocumento(t) === norm);
}

/**
 * Retorna o maior número sequencial já registrado para o escopo (Global Municipal ou por Secretaria + Tipo + Ano)
 */
export function getMaxSequentialForSecretaria(
  records: RegistroNumeracao[],
  tipoDoc: string,
  secretaria: string,
  anoAtual: string = new Date().getFullYear().toString(),
  secretariasList: SecretariaItem[] = INITIAL_SECRETARIAS,
  configNumeracao?: ConfigNumeracaoMunicipal | null
): number {
  const normTipo = normalizeTipoDocumento(tipoDoc);
  const isGlobal = isTipoSequenciaGlobal(tipoDoc, configNumeracao);
  const targetSigla = getSecretariaSigla(secretaria, secretariasList);
  const isTargetSEAD = targetSigla === 'SMA';

  let maxSeq = 0;
  for (const r of records) {
    const rTipo = normalizeTipoDocumento(r.tipoDocumento || '');
    if (rTipo !== normTipo) continue;

    if (!isGlobal) {
      const rSec = r.secretaria || '';
      const matches = !rSec.trim()
        ? isTargetSEAD
        : isSameSecretaria(rSec, secretaria, secretariasList);
      if (!matches) continue;
    }

    const numStr = String(r.numero || '').trim();
    // Reconhece formatos: "001/2026", "001/2026 - SMA", "1/2026", "248/2026 - PGM"
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

  return maxSeq;
}

/**
 * Calcula o próximo número sequencial para a Secretaria (ou Global Municipal, se configurado) + Tipo de Documento + Ano
 */
export function getNextSequentialForSecretaria(
  records: RegistroNumeracao[],
  tipoDoc: string,
  secretaria: string,
  anoAtual: string = new Date().getFullYear().toString(),
  secretariasList: SecretariaItem[] = INITIAL_SECRETARIAS,
  configNumeracao?: ConfigNumeracaoMunicipal | null
): number {
  return getMaxSequentialForSecretaria(records, tipoDoc, secretaria, anoAtual, secretariasList, configNumeracao) + 1;
}

/**
 * Formata o número oficial seguindo o padrão 000/AAAA (ou 000/AAAA - SIGLA quando aplicável)
 */
export function formatNumeroOficialSequencial(
  sequencial: number,
  anoAtual: string,
  incluirSigla: boolean,
  siglaSecretaria: string,
  isGlobal: boolean = false
): string {
  const seqStr = String(Math.max(1, sequencial)).padStart(3, '0');
  if (incluirSigla && !isGlobal && siglaSecretaria) {
    return `${seqStr}/${anoAtual} - ${siglaSecretaria}`;
  }
  return `${seqStr}/${anoAtual}`;
}

export const INITIAL_NUMERACOES: RegistroNumeracao[] = [];

export const INITIAL_SUGESTOES = {
  destinatarios: [
    'Procuradoria-Geral do Município (PGM)',
    'Controladoria-Geral do Município (CGM)',
    'Secretaria Municipal de Administração (SMA)',
    'Secretaria Municipal de Finanças (SMF)',
    'Secretaria Municipal de Educação (SME)',
    'Secretaria Municipal de Saúde (SMS)',
    'Secretaria Municipal de Governo (SEGOV)',
    'Gabinete do Prefeito',
    'Divisão de Recursos Humanos e Folha',
    'Departamento de Licitação e Contratos',
    'Câmara Municipal de Rio Claro – RJ',
    'Instituto de Previdência Municipal (FUNPREV-RC / IPRC)',
    'Juízo da Vara Única da Comarca de Rio Claro – RJ',
    'Ministério Público do Estado do Rio de Janeiro (MPRJ)',
    'Tribunal de Contas do Estado do Rio de Janeiro (TCE-RJ)',
    'Arquivo Geral do Município'
  ],
  assuntos: [
    'Análise jurídica de legalidade de contratação (Lei nº 14.133/2021)',
    'Análise jurídica de Termo Aditivo contratual (prazo / valor)',
    'Cota jurídica de saneamento processual e diligências prévias',
    'Prestação de Informações em Mandado de Segurança / Defesa Judicial',
    'Notificação extrajudicial por descumprimento contratual (defesa prévia)',
    'Inscrição e Certidão de Dívida Ativa Municipal (CDA)',
    'Recomendação jurídica preventiva de conformidade legal',
    'Entrada de Ofício e Providências Funcionais',
    'Verificação de candidato aprovado em concurso público',
    'Solicitação de manifestação jurídica sobre convocação',
    'Concessão de licença por assiduidade',
    'Encaminhamento de Impacto Orçamentário da Folha de Pagamento',
    'Comunicação Interna sobre Recadastramento Previdenciário',
    'Averbação de Certidão de Tempo de Contribuição (CTC)',
    'Elaboração de minuta de contrato / termo aditivo'
  ]
};

const BASE_IMPORTED_MODELOS: ModeloDocumental[] = (realModelsRaw as any[]).map(item => ({
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

const EXISTING_MODEL_IDS = new Set(BASE_IMPORTED_MODELOS.map(m => m.ID));
const PGM_WITH_STYLE = MODELOS_PGM_E_ADMINISTRATIVOS_OFICIAIS
  .filter(m => !EXISTING_MODEL_IDS.has(m.ID))
  .map(m => ({
    ...m,
    EstiloId: m.EstiloId || (m.ID.startsWith('PGM-') ? 'ESTILO_PGM_JURIDICO' : m.ID === 'ADM-001' ? 'ESTILO_GABINETE_PREFEITO' : 'ESTILO_PADRAO_PMRC'),
  }));
const ADDED_IDS = new Set([...EXISTING_MODEL_IDS, ...PGM_WITH_STYLE.map(m => m.ID)]);

export const INITIAL_MODELOS: ModeloDocumental[] = [
  ...BASE_IMPORTED_MODELOS,
  ...PGM_WITH_STYLE,
  ...MODELOS_SETORES_MUNICIPAIS_OFICIAIS.filter(m => !ADDED_IDS.has(m.ID))
];

export const INITIAL_LOGS: RegistroLog[] = [];
