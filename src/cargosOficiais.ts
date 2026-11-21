/**
 * Quadro Oficial de Cargos e Funções da Prefeitura Municipal de Rio Claro – RJ
 * - Efetivos (Quadro Permanente, * Cargos em Extinção, ** Cargos Extintos)
 * - Anexo I: Cargos em Subsídio (SS) e Cargos em Comissão (CC-01 a CC-08)
 * - Anexo II: Funções Gratificadas (FG — 10% a 40%)
 */

export type StatusCargoEfetivo = 'ATIVO' | 'EM_EXTINCAO' | 'EXTINTO';

export interface InfoStatusCargoEfetivo {
  status: StatusCargoEfetivo;
  label: string;
  shortBadge: string;
  nomeLimpo: string;
}

/**
 * Identifica se um cargo efetivo possui marcação oficial:
 * - (**) -> Cargo Extinto
 * - (*) ou * -> Cargo em Extinção
 * - Sem marcação -> Quadro Permanente Ativo
 */
export function getStatusCargoEfetivo(nomeCargo?: string): InfoStatusCargoEfetivo {
  const raw = String(nomeCargo || '').trim();
  if (!raw) {
    return {
      status: 'ATIVO',
      label: 'Quadro Permanente',
      shortBadge: 'Ativo',
      nomeLimpo: ''
    };
  }

  if (/\(\*\*\)|\*\*\s*$/.test(raw)) {
    return {
      status: 'EXTINTO',
      label: 'Cargo Extinto (**)',
      shortBadge: 'Extinto (**)',
      nomeLimpo: raw.replace(/\s*\(\*\*\)\s*|\s*\*\*\s*$/g, '').trim()
    };
  }

  if (/\(\*\)|\*\s*$/.test(raw)) {
    return {
      status: 'EM_EXTINCAO',
      label: 'Cargo em Extinção (*)',
      shortBadge: 'Em Extinção (*)',
      nomeLimpo: raw.replace(/\s*\(\*\)\s*|\s*\*\s*$/g, '').trim()
    };
  }

  return {
    status: 'ATIVO',
    label: 'Quadro Permanente',
    shortBadge: 'Ativo',
    nomeLimpo: raw
  };
}

export type CategoriaFuncaoOficial = 'SUBSIDIO' | 'COMISSAO' | 'FG';

export type SimbologiaOficial =
  | 'SS'
  | 'CC-01'
  | 'CC-02'
  | 'CC-03'
  | 'CC-04'
  | 'CC-05'
  | 'CC-06'
  | 'CC-07'
  | 'CC-08'
  | 'FG';

export interface CargoComissionadoOuFG {
  id: string;
  nome: string;
  simbologia: SimbologiaOficial;
  categoria: CategoriaFuncaoOficial;
  vagas: number;
  secretariaSigla: string;
  secretariaNome: string;
  percentualFG?: string;
  observacao?: string;
}

/**
 * ANEXO I — Cargos em Subsídio (SS) e Cargos em Comissão (CC-01 a CC-08)
 */
export const ANEXO_I_SUBSIDIO_COMISSAO: CargoComissionadoOuFG[] = [
  // Alta Administração (Subsídio)
  { id: 'ss-sec-mun', nome: 'Secretário Municipal', simbologia: 'SS', categoria: 'SUBSIDIO', vagas: 11, secretariaSigla: 'ALTA_ADM', secretariaNome: 'Alta Administração (Subsídio)' },
  { id: 'ss-proc-geral', nome: 'Procurador-Geral', simbologia: 'SS', categoria: 'SUBSIDIO', vagas: 1, secretariaSigla: 'PGM', secretariaNome: 'Procuradoria-Geral do Município' },
  { id: 'ss-ctrl-geral', nome: 'Controlador-Geral', simbologia: 'SS', categoria: 'SUBSIDIO', vagas: 1, secretariaSigla: 'CGM', secretariaNome: 'Controladoria-Geral do Município' },

  // Procuradoria-Geral (PGM)
  { id: 'pgm-cc01-sub', nome: 'Subprocurador-Geral', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'PGM', secretariaNome: 'Procuradoria-Geral do Município' },
  { id: 'pgm-cc02-ass', nome: 'Assessor Jurídico', simbologia: 'CC-02', categoria: 'COMISSAO', vagas: 5, secretariaSigla: 'PGM', secretariaNome: 'Procuradoria-Geral do Município' },

  // Controladoria-Geral (CGM)
  { id: 'cgm-cc03-ci', nome: 'Diretor de Departamento de Controle Interno', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'CGM', secretariaNome: 'Controladoria-Geral do Município' },
  { id: 'cgm-cc03-aud', nome: 'Diretor de Departamento de Auditoria', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'CGM', secretariaNome: 'Controladoria-Geral do Município' },
  { id: 'cgm-cc03-lic', nome: 'Diretor de Departamento de Análise de Licitações e Contratos', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'CGM', secretariaNome: 'Controladoria-Geral do Município' },
  { id: 'cgm-cc03-desp', nome: 'Diretor de Departamento de Análise de Despesas e Prestação de Contas', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'CGM', secretariaNome: 'Controladoria-Geral do Município' },

  // Secretaria Municipal de Governo (SEGOV / Gabinete)
  { id: 'segov-cc01-sub', nome: 'Subsecretário Municipal de Governo', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SEGOV', secretariaNome: 'Secretaria Municipal de Governo' },
  { id: 'segov-cc03-gab', nome: 'Assessor de Gabinete', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SEGOV', secretariaNome: 'Secretaria Municipal de Governo' },
  { id: 'segov-cc03-com', nome: 'Assessor de Comunicação Social', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 2, secretariaSigla: 'SEGOV', secretariaNome: 'Secretaria Municipal de Governo' },
  { id: 'segov-cc03-dist1', nome: 'Assessor Distrital I', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 2, secretariaSigla: 'SEGOV', secretariaNome: 'Secretaria Municipal de Governo' },
  { id: 'segov-cc04-dist2', nome: 'Assessor Distrital II', simbologia: 'CC-04', categoria: 'COMISSAO', vagas: 3, secretariaSigla: 'SEGOV', secretariaNome: 'Secretaria Municipal de Governo' },

  // Secretaria Municipal de Administração (SMA)
  { id: 'sma-cc01-sub', nome: 'Subsecretário Municipal de Administração', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'sma-cc03-ti', nome: 'Diretor de Departamento de Tecnologia da Informação', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'sma-cc03-pes', nome: 'Diretor de Departamento de Pessoal', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'sma-cc03-lic', nome: 'Diretor de Departamento de Licitação', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'sma-cc03-comp', nome: 'Diretor de Departamento de Compras', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'sma-cc03-arq', nome: 'Diretor de Departamento de Arquivo', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'sma-cc03-pat', nome: 'Diretor de Departamento de Patrimônio', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'sma-cc03-rh', nome: 'Diretor de Departamento de Treinamento e Desenvolvimento de RH', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'sma-cc03-conv', nome: 'Diretor de Departamento de Convênios', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'sma-cc03-alm', nome: 'Diretor de Departamento de Almoxarifado', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'sma-cc03-cont', nome: 'Diretor de Departamento de Contratos', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'sma-cc03-preg', nome: 'Pregoeiro', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'sma-cc05-ass', nome: 'Assessor Administrativo', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 3, secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },

  // Secretaria Municipal de Finanças (SMF)
  { id: 'smf-cc01-sub', nome: 'Subsecretário Municipal de Finanças', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'smf-cc01-arr', nome: 'Subsecretário Municipal de Arrecadação', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'smf-cc01-contg', nome: 'Diretor-Geral de Contabilidade', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'smf-cc03-tes', nome: 'Diretor de Departamento de Tesouraria', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'smf-cc03-cad', nome: 'Diretor de Departamento de Cadastro e Arrecadação', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'smf-cc03-da', nome: 'Diretor de Departamento de Dívida Ativa', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'smf-cc03-fisc', nome: 'Diretor de Departamento de Fiscalização Tributária', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'smf-cc03-imob', nome: 'Diretor de Departamento de Cadastro Imobiliário, Lançamento e Controle', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'smf-cc03-plan', nome: 'Diretor de Departamento de Planejamento e Orçamento', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'smf-cc03-sigfis', nome: 'Diretor de Departamento de Contabilidade - SIGFIS', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'smf-cc05-plan', nome: 'Assessor de Planejamento e Orçamento', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 3, secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },

  // Secretaria Municipal de Previdência Social (IPRC / FUNPREV-RC)
  { id: 'iprc-cc03-fin', nome: 'Diretor de Departamento de Finanças do FUNPREV-RC', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'IPRC', secretariaNome: 'Secretaria Municipal de Previdência Social' },
  { id: 'iprc-cc03-ben', nome: 'Diretor de Departamento de Benefício Previdenciário', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'IPRC', secretariaNome: 'Secretaria Municipal de Previdência Social' },
  { id: 'iprc-cc03-sigfis', nome: 'Diretor de Departamento de Contabilidade/SIGFIS', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'IPRC', secretariaNome: 'Secretaria Municipal de Previdência Social' },
  { id: 'iprc-cc03-pat', nome: 'Diretor de Departamento de Patrimônio', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'IPRC', secretariaNome: 'Secretaria Municipal de Previdência Social' },
  { id: 'iprc-cc03-comprev', nome: 'Diretor de Departamento de COMPREV', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'IPRC', secretariaNome: 'Secretaria Municipal de Previdência Social' },
  { id: 'iprc-cc03-comp', nome: 'Diretor de Departamento de Compras', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'IPRC', secretariaNome: 'Secretaria Municipal de Previdência Social' },

  // Secretaria Municipal de Educação (SME)
  { id: 'sme-cc01-ped', nome: 'Subsecretário de Gestão Pedagógica', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc01-adm', nome: 'Subsecretário de Gestão Administrativa', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc03-tec', nome: 'Diretor de Departamento de Tecnologia Educacional', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc03-est', nome: 'Diretor de Departamento de Planejamento e Estatística', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc03-apoio', nome: 'Diretor de Departamento de Apoio Administrativo', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 2, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação', observacao: 'Consta 2x no Anexo I (1+1)' },
  { id: 'sme-cc03-man', nome: 'Diretor de Departamento de Manutenção Escolar e Transporte', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc03-pat', nome: 'Diretor de Departamento de Patrimônio e Arquivo', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc03-comp', nome: 'Diretor de Departamento de Compras', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc03-rh', nome: 'Diretor de Departamento de Recursos Humanos', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc03-alm', nome: 'Diretor de Departamento de Almoxarifado', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc03-mer', nome: 'Diretor de Departamento de Merenda Escolar', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc03-sigfis', nome: 'Diretor de Departamento de Contabilidade/SIGFIS', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc03-tes', nome: 'Diretor de Departamento de Tesouraria', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc03-ge1', nome: 'Assessor de Gestão Escolar I', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 2, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc05-ge2', nome: 'Assessor de Gestão Escolar II', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 4, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc05-ped', nome: 'Assessor Pedagógico', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 8, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc05-adm', nome: 'Assessor Administrativo', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 4, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'sme-cc08-turno', nome: 'Coordenador de Turno', simbologia: 'CC-08', categoria: 'COMISSAO', vagas: 12, secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },

  // Secretaria Municipal de Assistência Social e Direitos Humanos (SMAS)
  { id: 'smas-cc01-sub', nome: 'Subsecretário Municipal de Assistência Social e Direitos Humanos', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc03-cont', nome: 'Diretor de Departamento de Contabilidade', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc03-tes', nome: 'Diretor de Departamento de Tesouraria', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc03-pb', nome: 'Diretor de Departamento de Proteção Básica', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc03-pe', nome: 'Diretor de Departamento de Proteção Social Especial', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc03-cap', nome: 'Diretor de Departamento de Captação de Recursos e Projetos', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc05-cras', nome: 'Coordenador de CRAS', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 3, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc05-creas', nome: 'Coordenador de CREAS', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc05-acolh', nome: 'Coordenador de Entidade Acolhedora para Crianças e Adolescentes', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc05-ilpi', nome: 'Coordenador de Instituição de Longa Permanência para Idosos', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc05-fin', nome: 'Coordenador Financeiro', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 2, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc05-suas', nome: 'Coordenador de Vigilância Socioassistencial e Gestão do SUAS', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc08-scfv', nome: 'Subcoordenador de Serviço de Convivência e Fortalecimento de Vínculo', simbologia: 'CC-08', categoria: 'COMISSAO', vagas: 4, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc08-ben', nome: 'Subcoordenador de Benefício de Transferência de Renda e Benefícios Eventuais', simbologia: 'CC-08', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc08-cc', nome: 'Subcoordenador de Centro Comunitário', simbologia: 'CC-08', categoria: 'COMISSAO', vagas: 2, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'smas-cc08-at', nome: 'Subcoordenador de Apoio Técnico', simbologia: 'CC-08', categoria: 'COMISSAO', vagas: 5, secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },

  // Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos (SMOSP)
  { id: 'smosp-cc01-sub', nome: 'Subsecretário Municipal de Planejamento Urbano, Obras e Serviços Públicos', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },
  { id: 'smosp-cc03-at', nome: 'Assessor Técnico', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },
  { id: 'smosp-cc03-proj', nome: 'Diretor de Departamento de Projetos Urbanos', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },
  { id: 'smosp-cc03-plan', nome: 'Diretor de Departamento de Planejamento de Obras e Serviços Públicos', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },
  { id: 'smosp-cc03-adm', nome: 'Diretor de Departamento de Apoio Técnico Administrativo', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },
  { id: 'smosp-cc05-ass', nome: 'Assessor Administrativo', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 5, secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },

  // Secretaria Municipal de Meio Ambiente e Agricultura (SMMA)
  { id: 'smma-cc01-ma', nome: 'Subsecretário Municipal de Meio Ambiente', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'smma-cc01-agr', nome: 'Subsecretário Municipal de Agricultura', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'smma-cc03-lic', nome: 'Diretor de Departamento de Controle, Fiscalização e Licenciamento Ambiental', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'smma-cc03-insp', nome: 'Diretor de Departamento de Inspeção Sanitária, Agropecuária e Abastecimento', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'smma-cc03-tes', nome: 'Diretor de Departamento de Tesouraria', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'smma-cc03-pat', nome: 'Diretor de Departamento de Patrimônio e Almoxarifado', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'smma-cc03-cont', nome: 'Diretor de Departamento de Contabilidade', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'smma-cc05-ed', nome: 'Assessor de Estudos, Projetos e Educação Ambiental', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'smma-cc05-adm', nome: 'Assessor Administrativo', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 3, secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'smma-cc05-guarda', nome: 'Coordenador Municipal da Guarda Ambiental', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'smma-cc05-fin', nome: 'Coordenador Financeiro', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },

  // Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer (SMDEC)
  { id: 'smdec-cc01-de', nome: 'Subsecretário Municipal de Desenvolvimento Econômico', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'smdec-cc01-cult', nome: 'Subsecretário Municipal de Cultura, Turismo e Eventos', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'smdec-cc01-esp', nome: 'Subsecretário Municipal de Esporte e Lazer', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'smdec-cc03-ev', nome: 'Diretor de Departamento de Promoção de Eventos', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'smdec-cc03-tur', nome: 'Diretor de Departamento de Captação de Recursos para Projetos Turísticos', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'smdec-cc03-esp', nome: 'Diretor de Departamento de Esporte e Lazer', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'smdec-cc03-tes', nome: 'Diretor de Departamento de Tesouraria', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'smdec-cc03-cont', nome: 'Diretor de Departamento de Contabilidade', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'smdec-cc03-alm', nome: 'Diretor de Departamento de Almoxarifado', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'smdec-cc03-pat', nome: 'Diretor de Departamento de Patrimônio', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'smdec-cc05-pc', nome: 'Assessor de Patrimônio Cultural', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'smdec-cc05-ac', nome: 'Assessor de Atividade Cultural', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'smdec-cc05-adm', nome: 'Assessor Administrativo', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 4, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'smdec-cc05-ee', nome: 'Coordenador de Eventos Esportivos', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'smdec-cc08-ee', nome: 'Subcoordenador de Eventos Esportivos', simbologia: 'CC-08', categoria: 'COMISSAO', vagas: 6, secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },

  // Secretaria Municipal de Ordem Pública (SMOP)
  { id: 'smop-cc01-sub', nome: 'Subsecretário Municipal de Ordem Pública', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMOP', secretariaNome: 'Secretaria Municipal de Ordem Pública' },
  { id: 'smop-cc03-dc', nome: 'Diretor de Departamento de Defesa Civil', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMOP', secretariaNome: 'Secretaria Municipal de Ordem Pública' },
  { id: 'smop-cc03-tran', nome: 'Diretor de Departamento de Trânsito', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMOP', secretariaNome: 'Secretaria Municipal de Ordem Pública' },
  { id: 'smop-cc03-transp', nome: 'Diretor de Departamento de Transporte', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMOP', secretariaNome: 'Secretaria Municipal de Ordem Pública' },
  { id: 'smop-cc05-tran', nome: 'Assessor Especial de Trânsito', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMOP', secretariaNome: 'Secretaria Municipal de Ordem Pública' },
  { id: 'smop-cc05-transp', nome: 'Assessor Especial de Transporte', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMOP', secretariaNome: 'Secretaria Municipal de Ordem Pública' },
  { id: 'smop-cc05-comdec', nome: 'Coordenador da COMDEC', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMOP', secretariaNome: 'Secretaria Municipal de Ordem Pública' },
  { id: 'smop-cc08-comdec', nome: 'Subcoordenador da COMDEC', simbologia: 'CC-08', categoria: 'COMISSAO', vagas: 3, secretariaSigla: 'SMOP', secretariaNome: 'Secretaria Municipal de Ordem Pública' },

  // Secretaria Municipal de Saúde (SMS)
  { id: 'sms-cc01-sub', nome: 'Subsecretário Municipal de Saúde', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc01-hosp', nome: 'Diretor-Geral Hospitalar', simbologia: 'CC-01', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc02-adm', nome: 'Diretor Administrativo', simbologia: 'CC-02', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc02-tec', nome: 'Diretor Técnico', simbologia: 'CC-02', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc02-as', nome: 'Diretor de Atenção à Saúde', simbologia: 'CC-02', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc03-ci', nome: 'Assessor de Controle Interno', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc03-enf', nome: 'Diretor do Departamento de Enfermagem', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc03-adm', nome: 'Diretor de Departamento Administrativo', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc03-tes', nome: 'Diretor de Departamento de Tesouraria', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc03-ae', nome: 'Diretor de Departamento de Assistência Especializada', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc03-vs', nome: 'Diretor do Departamento de Vigilância em Saúde', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc03-reg', nome: 'Diretor do Departamento de Planejamento, Controle, Regulação, Avaliação e Auditoria', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc03-ab', nome: 'Diretor do Departamento de Atenção Básica', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc03-rh', nome: 'Diretor do Departamento de Recursos Humanos', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc03-nut', nome: 'Diretor do Departamento Nutrição', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc03-comp', nome: 'Diretor de Departamento de Compras', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc03-cont', nome: 'Diretor de Departamento de Contabilidade', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc03-alm', nome: 'Diretor de Departamento de Almoxarifado', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc03-pat', nome: 'Diretor de Departamento de Patrimônio', simbologia: 'CC-03', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc05-ass', nome: 'Assessor Administrativo', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 10, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc05-cadm', nome: 'Coordenador Administrativo', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 15, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc05-transp', nome: 'Coordenador de Transporte', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc05-nasf', nome: 'Coordenador de Núcleo de Apoio da Saúde da Família - NASF', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 1, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc05-atm', nome: 'Coordenador de Apoio Técnico e Manutenção', simbologia: 'CC-05', categoria: 'COMISSAO', vagas: 6, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'sms-cc08-atm', nome: 'Subcoordenador de Apoio Técnico e Manutenção', simbologia: 'CC-08', categoria: 'COMISSAO', vagas: 6, secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' }
];

/**
 * ANEXO II — Funções Gratificadas (FG — 10% a 40%)
 */
export const ANEXO_II_FUNCOES_GRATIFICADAS: CargoComissionadoOuFG[] = [
  // Controladoria-Geral (4 vagas)
  { id: 'fg-cgm-ci', nome: 'Chefe de Divisão de Controle Interno', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'CGM', secretariaNome: 'Controladoria-Geral do Município' },
  { id: 'fg-cgm-aud', nome: 'Chefe de Divisão de Auditoria', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'CGM', secretariaNome: 'Controladoria-Geral do Município' },
  { id: 'fg-cgm-lic', nome: 'Chefe de Divisão de Análise de Licitações e Contratos', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'CGM', secretariaNome: 'Controladoria-Geral do Município' },
  { id: 'fg-cgm-desp', nome: 'Chefe de Divisão de Análise de Despesas e Prestação de Contas', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'CGM', secretariaNome: 'Controladoria-Geral do Município' },

  // Secretaria Municipal de Administração (12 vagas)
  { id: 'fg-sma-sup', nome: 'Chefe de Divisão de Suporte e Infraestrutura', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'fg-sma-site', nome: 'Chefe de Divisão de Gerenciamento e Manutenção de site', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'fg-sma-ti', nome: 'Chefe de Divisão de Tecnologia da Informação', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'fg-sma-trh', nome: 'Chefe de Divisão de Treinamento e Desenvolvimento de Recursos Humanos', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'fg-sma-pes', nome: 'Chefe de Divisão de Pessoal', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'fg-sma-lic', nome: 'Chefe de Divisão de Licitação', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'fg-sma-comp', nome: 'Chefe de Divisão de Compras', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'fg-sma-alm', nome: 'Chefe de Divisão de Almoxarifado', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'fg-sma-arq', nome: 'Chefe de Divisão de Arquivo', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'fg-sma-pat', nome: 'Chefe de Divisão de Patrimônio', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'fg-sma-conv', nome: 'Chefe de Divisão de Convênios', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },
  { id: 'fg-sma-cont', nome: 'Chefe de Divisão de Contratos', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMA', secretariaNome: 'Secretaria Municipal de Administração' },

  // Secretaria Municipal de Finanças (8 vagas)
  { id: 'fg-smf-tes', nome: 'Chefe de Divisão de Tesouraria', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'fg-smf-cad', nome: 'Chefe de Divisão de Cadastro e Arrecadação', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'fg-smf-da', nome: 'Chefe de Divisão de Dívida Ativa', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'fg-smf-fext', nome: 'Chefe de Divisão de Fiscalização Tributária Externa', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'fg-smf-fint', nome: 'Chefe de Divisão de Fiscalização Tributária Interna', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'fg-smf-imob', nome: 'Chefe de Divisão de Cadastro Imobiliário, Lançamento e Controle', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'fg-smf-plan', nome: 'Chefe de Divisão de Planejamento e Orçamento', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },
  { id: 'fg-smf-cust', nome: 'Chefe de Divisão de Análise de Custos', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMF', secretariaNome: 'Secretaria Municipal de Finanças' },

  // Secretaria Municipal de Previdência Social (3 vagas)
  { id: 'fg-iprc-tes', nome: 'Chefe de Divisão de Tesouraria', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'IPRC', secretariaNome: 'Secretaria Municipal de Previdência Social' },
  { id: 'fg-iprc-cont', nome: 'Chefe de Divisão Contábil', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'IPRC', secretariaNome: 'Secretaria Municipal de Previdência Social' },
  { id: 'fg-iprc-rh', nome: 'Chefe de Divisão de Recursos Humanos', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'IPRC', secretariaNome: 'Secretaria Municipal de Previdência Social' },

  // Secretaria Municipal de Educação (24 vagas)
  { id: 'fg-sme-dir', nome: 'Docente Dirigente', simbologia: 'FG', categoria: 'FG', vagas: 8, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação', observacao: '7 vagas (pág. 22) + 1 vaga (pág. 23) = 8 vagas' },
  { id: 'fg-sme-f1', nome: 'Chefe de Divisão de Fundamental I', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-f2', nome: 'Chefe de Divisão de Fundamental II', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-fc', nome: 'Chefe de Divisão de Formação Continuada', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-ei', nome: 'Chefe de Divisão de Educação Infantil', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-eja', nome: 'Chefe de Divisão de Educação de Jovens e Adultos', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-ee', nome: 'Chefe de Divisão de Educação Especial', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-ea', nome: 'Chefe de Divisão de Estratégia e Avaliação', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-mt', nome: 'Chefe de Divisão de Manutenção e Transporte', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-rh', nome: 'Chefe de Divisão de Recursos Humanos', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-pat', nome: 'Chefe de Divisão de Patrimônio e Arquivo', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-mer', nome: 'Chefe de Divisão de Merenda Escolar', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-adm', nome: 'Chefe de Divisão Administrativa', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-conv', nome: 'Chefe de Divisão de Convênios e Programas', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-sigfis', nome: 'Chefe de Divisão de Contabilidade - SIGFIS', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-tes', nome: 'Chefe de Divisão Tesouraria', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },
  { id: 'fg-sme-comp', nome: 'Chefe de Divisão de Compras', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SME', secretariaNome: 'Secretaria Municipal de Educação' },

  // Secretaria Municipal de Assistência Social e Direitos Humanos (6 vagas)
  { id: 'fg-smas-comp', nome: 'Chefe de Divisão de Compras', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'fg-smas-ben', nome: 'Chefe de Divisão de Benefício e Assistência Social', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'fg-smas-trab', nome: 'Chefe de Divisão de Trabalho e Emprego', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'fg-smas-sigfis', nome: 'Chefe de Divisão de Contabilidade - SIGFIS', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'fg-smas-pat', nome: 'Chefe de Divisão de Patrimônio e Almoxarifado', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },
  { id: 'fg-smas-adm', nome: 'Chefe de Divisão Administração', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMAS', secretariaNome: 'Secretaria Municipal de Assistência Social e Direitos Humanos' },

  // Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos (10 vagas)
  { id: 'fg-smosp-cc', nome: 'Chefe de Divisão de Controle de Contratos e Convênios', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },
  { id: 'fg-smosp-cap', nome: 'Chefe de Divisão de Captação de Recursos', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },
  { id: 'fg-smosp-rf', nome: 'Chefe de Divisão de Regularização Fundiária', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },
  { id: 'fg-smosp-tp', nome: 'Chefe de Divisão Técnica de Planejamento', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },
  { id: 'fg-smosp-po', nome: 'Chefe de Divisão de Projetos e Orçamento', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },
  { id: 'fg-smosp-fisc', nome: 'Chefe de Divisão de Fiscalização de Obras e Posturas', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },
  { id: 'fg-smosp-limp', nome: 'Chefe de Divisão de Limpeza Pública e Coleta de Lixo', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },
  { id: 'fg-smosp-man', nome: 'Chefe de Divisão de Manutenção e Conservação', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },
  { id: 'fg-smosp-vig', nome: 'Chefe de Divisão de Vigilância de Patrimônio Público', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },
  { id: 'fg-smosp-sup', nome: 'Chefe de Divisão de Supervisão de Obras e Serviços Públicos', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMOSP', secretariaNome: 'Secretaria Municipal de Planejamento Urbano, Obras e Serviços Públicos' },

  // Secretaria Municipal de Meio Ambiente e Agricultura (9 vagas)
  { id: 'fg-smma-fa', nome: 'Chefe de Divisão de Fiscalização Ambiental', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'fg-smma-rhid', nome: 'Chefe de Divisão de Recursos Hídricos', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'fg-smma-epa', nome: 'Chefe de Divisão de Estudos e Projetos Ambientais', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'fg-smma-ap', nome: 'Chefe de Divisão de Áreas Protegidas', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'fg-smma-ea', nome: 'Chefe de Divisão de Educação Ambiental', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'fg-smma-ia', nome: 'Chefe de Divisão de Inspeção Agropecuária', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'fg-smma-pva', nome: 'Chefe de Divisão de Produção Vegetal e Animal', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'fg-smma-sigfis', nome: 'Chefe de Divisão de Contabilidade - SIGFIS', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },
  { id: 'fg-smma-pat', nome: 'Chefe de Divisão de Patrimônio e Almoxarifado', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMMA', secretariaNome: 'Secretaria Municipal de Meio Ambiente e Agricultura' },

  // Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer (7 vagas)
  { id: 'fg-smdec-ev', nome: 'Chefe de Divisão de Promoção de Eventos', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'fg-smdec-sigfis', nome: 'Chefe de Divisão de Contabilidade - SIGFIS', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'fg-smdec-esp', nome: 'Chefe de Divisão de Esporte e Lazer', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'fg-smdec-pc', nome: 'Chefe de Divisão de Patrimônio Cultural', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'fg-smdec-bib', nome: 'Chefe de Divisão de Gerenciamento de Bibliotecas Públicas', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'fg-smdec-pat', nome: 'Chefe de Divisão de Patrimônio', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },
  { id: 'fg-smdec-alm', nome: 'Chefe de Divisão de Almoxarifado', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMDEC', secretariaNome: 'Secretaria Municipal de Desenvolvimento Econômico, Cultura, Turismo, Eventos, Esporte e Lazer' },

  // Secretaria Municipal de Saúde (19 vagas)
  { id: 'fg-sms-lab', nome: 'Chefe da Divisão de Laboratório', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-rx', nome: 'Chefe da Divisão de Raio X', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-nut', nome: 'Chefe da Divisão de Nutrição', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-spa', nome: 'Chefe da Divisão Administrativa do SPA de Lídice', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-pat', nome: 'Chefe da Divisão de Patrimônio e Almoxarifado', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-ti', nome: 'Chefe da Divisão de Tecnologia da Informação', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-sm', nome: 'Chefe da Divisão de Saúde Mental', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-reab', nome: 'Chefe da Divisão de Reabilitação', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-farm', nome: 'Chefe da Divisão de Assistência Farmacêutica', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-ve', nome: 'Chefe da Divisão de Vigilância Epidemiológica', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-va', nome: 'Chefe da Divisão de Vigilância Ambiental', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-vst', nome: 'Chefe da Divisão de Vigilância em Saúde do Trabalhador', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-vs', nome: 'Chefe da Divisão de Vigilância Sanitária', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-esf', nome: 'Chefe da Divisão de Estratégia e Saúde da Família - ESF', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-sb', nome: 'Chefe da Divisão de Saúde Bucal', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-nasf', nome: 'Chefe da Divisão de Núcleo de Apoio à Saúde da Família', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-tfd', nome: 'Chefe da Divisão de Tratamento Fora do Domicílio - TFD', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-cont', nome: 'Chefe da Divisão de Contabilidade', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' },
  { id: 'fg-sms-ouv', nome: 'Ouvidor', simbologia: 'FG', categoria: 'FG', vagas: 1, percentualFG: '10% a 40%', secretariaSigla: 'SMS', secretariaNome: 'Secretaria Municipal de Saúde' }
];

export const TODAS_FUNCOES_ANEXOS_I_II: CargoComissionadoOuFG[] = [
  ...ANEXO_I_SUBSIDIO_COMISSAO,
  ...ANEXO_II_FUNCOES_GRATIFICADAS
];

export function formatCargoComSimbologia(item: CargoComissionadoOuFG): string {
  return `${item.nome} (${item.simbologia})`;
}

/**
 * Remove sufixo de simbologia entre parênteses (ex.: "(CC-03)", "(FG)", "(SS)") para uso limpo em assinaturas oficiais
 */
export function stripSimbologiaLabel(texto?: string): string {
  return String(texto || '')
    .replace(/\s*\((SS|CC-\d+|FG)\)\s*$/i, '')
    .trim();
}

export function extractSimbologiaLabel(texto?: string): string | null {
  const match = String(texto || '').match(/\((SS|CC-\d+|FG)\)\s*$/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Retorna o cargo/função ideal para a assinatura de atos no Redator Oficial:
 * prioriza Cargo em Comissão / Subsídio ou Função Gratificada quando o servidor possui,
 * mantendo o cargo efetivo limpo como fallback.
 */
export function getCargoAssinaturaPreferencial(user?: { cargo?: string; funcaoGratificada?: string } | null): string {
  if (!user) return 'Servidor Público Municipal';
  const fg = stripSimbologiaLabel(user.funcaoGratificada);
  if (fg) return fg;
  const efetivo = getStatusCargoEfetivo(user.cargo).nomeLimpo;
  return efetivo || user.cargo?.trim() || 'Servidor Público Municipal';
}

/**
 * Sugere o nome do Departamento/Divisão correspondente ao cargo de Diretor ou Chefe de Divisão selecionado
 */
export function inferirDepartamentoDaFuncao(nomeFuncao?: string): string {
  const clean = stripSimbologiaLabel(nomeFuncao);
  const matchDir = clean.match(/^Diretor\s+(?:de|do)\s+(Departamento\s+.+)$/i);
  if (matchDir) return matchDir[1].trim();
  const matchChefe = clean.match(/^Chefe\s+(?:de|da)\s+(Divis[ãa]o\s+.+)$/i);
  if (matchChefe) return matchChefe[1].trim();
  return '';
}

function normFuncaoTexto(v?: string): string {
  return String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s*\((ss|cc-\d+|fg)\)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Formata um cargo efetivo aplicando a marcação oficial da lei municipal:
 * - ATIVO: sem asterisco
 * - EM_EXTINCAO: " (*)"
 * - EXTINTO: " (**)"
 */
export function formatarCargoEfetivoComStatus(nomeLimpo: string, status: StatusCargoEfetivo): string {
  const base = String(nomeLimpo || '')
    .replace(/\s*\(\*\*\)\s*$/g, '')
    .replace(/\s*\(\*\)\s*$/g, '')
    .replace(/\s*\*\*\s*$/g, '')
    .replace(/\s*\*\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) return '';
  if (status === 'EM_EXTINCAO') return `${base} (*)`;
  if (status === 'EXTINTO') return `${base} (**)`;
  return base;
}

/**
 * Separa os cargos do Anexo I e II priorizando a secretaria selecionada
 */
export function agruparFuncoesPorSecretaria(
  siglaAlvo?: string,
  listaFuncoes: CargoComissionadoOuFG[] = TODAS_FUNCOES_ANEXOS_I_II
): {
  comissaoDaPasta: CargoComissionadoOuFG[];
  fgDaPasta: CargoComissionadoOuFG[];
  altaAdministracao: CargoComissionadoOuFG[];
  outrasComissao: CargoComissionadoOuFG[];
  outrasFG: CargoComissionadoOuFG[];
} {
  const sigla = (siglaAlvo || '').toUpperCase().trim();
  const comissaoDaPasta: CargoComissionadoOuFG[] = [];
  const fgDaPasta: CargoComissionadoOuFG[] = [];
  const altaAdministracao: CargoComissionadoOuFG[] = [];
  const outrasComissao: CargoComissionadoOuFG[] = [];
  const outrasFG: CargoComissionadoOuFG[] = [];

  for (const item of listaFuncoes) {
    if (item.categoria === 'SUBSIDIO') {
      if (sigla && item.secretariaSigla === sigla) {
        comissaoDaPasta.unshift(item);
      } else {
        altaAdministracao.push(item);
      }
      continue;
    }

    const pertence = Boolean(sigla && item.secretariaSigla === sigla);
    if (item.categoria === 'COMISSAO') {
      if (pertence) comissaoDaPasta.push(item);
      else outrasComissao.push(item);
    } else {
      if (pertence) fgDaPasta.push(item);
      else outrasFG.push(item);
    }
  }

  return { comissaoDaPasta, fgDaPasta, altaAdministracao, outrasComissao, outrasFG };
}

/**
 * Verifica se um servidor ativo ocupa determinada vaga do Anexo I ou Anexo II
 */
export function servidorOcupaFuncaoOficial(
  servidor: { ativo?: boolean; cargo?: string; funcaoGratificada?: string; secretaria?: string },
  item: CargoComissionadoOuFG,
  resolveSiglaFn: (sec?: string) => string
): boolean {
  if (servidor.ativo === false) return false;

  const alvoNorm = normFuncaoTexto(item.nome);
  const fgNorm = normFuncaoTexto(servidor.funcaoGratificada);
  const cargoNorm = normFuncaoTexto(servidor.cargo);

  const nomeBate = (fgNorm !== '' && fgNorm === alvoNorm) || (cargoNorm !== '' && cargoNorm === alvoNorm);
  if (!nomeBate) return false;

  // Para Secretário Municipal (Alta Administração - 11 vagas), aceita qualquer secretaria
  if (item.secretariaSigla === 'ALTA_ADM') {
    return true;
  }

  // Confere se a secretaria do servidor bate com a secretaria da vaga (evita somar "Assessor Administrativo" de SMS em SMA)
  const servSigla = resolveSiglaFn(servidor.secretaria);
  return servSigla.toUpperCase() === item.secretariaSigla.toUpperCase();
}
