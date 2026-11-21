export type CabecalhoLayoutEstilo = 'LATERAL' | 'CENTRALIZADO' | 'SOLENE_DUPLO';

export type EmentaEstiloVisual =
  | 'DIREITA_BORDA'
  | 'DIREITA_SEM_BORDA'
  | 'CAIXA_SOMBREADA'
  | 'SIMPLES';

export type AssinaturaPadraoEstilo = 'INDIVIDUAL' | 'DUPLA_REFERENDO' | 'COMISSAO_PAD';

export type FonteOficialEstilo = 'Times New Roman' | 'Arial' | 'Calibri';
export type TamanhoFonteEstilo = '12pt' | '11pt' | '10pt';
export type AlinhamentoTextoEstilo = 'justify' | 'left' | 'center';

export interface PerfilEstiloDocumental {
  id: string;
  nome: string;
  setorReferencia: string; // Ex.: 'SEGOV', 'PGM', 'CGM', 'SMF', 'SMA', 'GERAL'
  descricao: string;
  origem: 'NATIVO' | 'CLONADO_PDF' | 'PERSONALIZADO';
  arquivoOrigem?: string;
  criadoEm?: string;
  fonte: FonteOficialEstilo;
  tamanhoFonte: TamanhoFonteEstilo;
  alinhamento: AlinhamentoTextoEstilo;
  espacamentoLinhas: number;
  recuoParagrafoCm: number;
  margens: {
    superior: number;
    inferior: number;
    esquerda: number;
    direita: number;
  };
  corPrimaria: string;
  corBordaCabecalho: string;
  cabecalhoLayout: CabecalhoLayoutEstilo;
  cabecalhoSubtituloCustom?: string;
  rodapeTexto?: string;
  epigrafeAlinhamento: 'center' | 'left';
  epigrafeCaixaAlta: boolean;
  ementaEstilo: EmentaEstiloVisual;
  assinaturaPadrao: AssinaturaPadraoEstilo;
}

export interface EstiloVisualExtraido {
  nomeSugerido: string;
  setorReferencia: string;
  fonte: FonteOficialEstilo;
  tamanhoFonte: TamanhoFonteEstilo;
  alinhamento: AlinhamentoTextoEstilo;
  espacamentoLinhas: number;
  recuoParagrafoCm: number;
  margens: {
    superior: number;
    inferior: number;
    esquerda: number;
    direita: number;
  };
  corPrimaria: string;
  corBordaCabecalho: string;
  cabecalhoLayout: CabecalhoLayoutEstilo;
  cabecalhoSubtitulo?: string;
  rodapeTexto?: string;
  epigrafeAlinhamento: 'center' | 'left';
  epigrafeCaixaAlta: boolean;
  ementaEstilo: EmentaEstiloVisual;
  assinaturaPadrao: AssinaturaPadraoEstilo;
  resumoEstilo: string;
  detectadoLocalmente?: boolean;
}

export const CUSTOM_STYLES_STORAGE_KEY = 'bm_estilos_visuais_custom_v1';
export const ACTIVE_STYLE_STORAGE_KEY = 'bm_estilo_ativo_id_v1';

export const ESTILOS_INSTITUCIONAIS_NATIVOS: PerfilEstiloDocumental[] = [
  {
    id: 'ESTILO_PADRAO_PMRC',
    nome: 'Padrão Administrativo PMRC (SMA / Geral)',
    setorReferencia: 'SMA',
    descricao: 'Timbrado clássico com brasão à esquerda, Times New Roman 12pt e margens oficiais ABNT/PMRC.',
    origem: 'NATIVO',
    fonte: 'Times New Roman',
    tamanhoFonte: '12pt',
    alinhamento: 'justify',
    espacamentoLinhas: 1.5,
    recuoParagrafoCm: 1.5,
    margens: { superior: 2.5, inferior: 2.0, esquerda: 3.0, direita: 2.0 },
    corPrimaria: '#002b82',
    corBordaCabecalho: '#002b82',
    cabecalhoLayout: 'LATERAL',
    rodapeTexto: 'Prefeitura Municipal de Rio Claro – RJ • Av. João Batista Portugal, nº 230 – Centro – CEP 27460-000',
    epigrafeAlinhamento: 'center',
    epigrafeCaixaAlta: true,
    ementaEstilo: 'DIREITA_BORDA',
    assinaturaPadrao: 'INDIVIDUAL',
  },
  {
    id: 'ESTILO_GABINETE_PREFEITO',
    nome: 'Gabinete do Prefeito (GP / SEGOV — Solene)',
    setorReferencia: 'SEGOV',
    descricao: 'Cabeçalho centralizado solene com brasão no topo, padrão LC 95/98 (Decretos, Portarias, Leis) e suporte a Referendo Duplo.',
    origem: 'NATIVO',
    fonte: 'Times New Roman',
    tamanhoFonte: '12pt',
    alinhamento: 'justify',
    espacamentoLinhas: 1.5,
    recuoParagrafoCm: 2.0,
    margens: { superior: 3.0, inferior: 2.0, esquerda: 3.0, direita: 2.0 },
    corPrimaria: '#0b2545',
    corBordaCabecalho: '#0b2545',
    cabecalhoLayout: 'CENTRALIZADO',
    cabecalhoSubtituloCustom: 'GABINETE DO PREFEITO',
    rodapeTexto: 'Gabinete do Prefeito • Av. João Batista Portugal, nº 230 – Centro – Rio Claro/RJ • gabinete@rioclaro.rj.gov.br',
    epigrafeAlinhamento: 'center',
    epigrafeCaixaAlta: true,
    ementaEstilo: 'DIREITA_SEM_BORDA',
    assinaturaPadrao: 'DUPLA_REFERENDO',
  },
  {
    id: 'ESTILO_PGM_JURIDICO',
    nome: 'Procuradoria-Geral (PGM — Jurídico / Forense)',
    setorReferencia: 'PGM',
    descricao: 'Visual forense e consultivo com brasão centralizado, Times 12pt, recuo de 2,0 cm e ementa destacada.',
    origem: 'NATIVO',
    fonte: 'Times New Roman',
    tamanhoFonte: '12pt',
    alinhamento: 'justify',
    espacamentoLinhas: 1.5,
    recuoParagrafoCm: 2.0,
    margens: { superior: 3.0, inferior: 2.0, esquerda: 3.0, direita: 2.0 },
    corPrimaria: '#1e293b',
    corBordaCabecalho: '#334155',
    cabecalhoLayout: 'CENTRALIZADO',
    cabecalhoSubtituloCustom: 'PROCURADORIA-GERAL DO MUNICÍPIO (PGM)',
    rodapeTexto: 'Procuradoria-Geral do Município de Rio Claro – RJ • procuradoria@rioclaro.rj.gov.br • (24) 3332-1800',
    epigrafeAlinhamento: 'center',
    epigrafeCaixaAlta: true,
    ementaEstilo: 'CAIXA_SOMBREADA',
    assinaturaPadrao: 'INDIVIDUAL',
  },
  {
    id: 'ESTILO_CGM_AUDITORIA',
    nome: 'Controladoria-Geral (CGM — Controle Interno)',
    setorReferencia: 'CGM',
    descricao: 'Estilo técnico de auditoria com barra dupla institucional, Arial 11pt, espaçamento enxuto e caixa de objeto.',
    origem: 'NATIVO',
    fonte: 'Arial',
    tamanhoFonte: '11pt',
    alinhamento: 'justify',
    espacamentoLinhas: 1.35,
    recuoParagrafoCm: 1.25,
    margens: { superior: 2.5, inferior: 2.0, esquerda: 2.5, direita: 2.0 },
    corPrimaria: '#0f4c5c',
    corBordaCabecalho: '#0f4c5c',
    cabecalhoLayout: 'SOLENE_DUPLO',
    cabecalhoSubtituloCustom: 'CONTROLADORIA-GERAL DO MUNICÍPIO (CGM)',
    rodapeTexto: 'Controladoria-Geral do Município • Sistema de Controle Interno – Rio Claro/RJ • controladoria@rioclaro.rj.gov.br',
    epigrafeAlinhamento: 'center',
    epigrafeCaixaAlta: true,
    ementaEstilo: 'CAIXA_SOMBREADA',
    assinaturaPadrao: 'INDIVIDUAL',
  },
  {
    id: 'ESTILO_SMF_FINANCAS',
    nome: 'Finanças e Fazenda (SMF — Orçamentário / Fiscal)',
    setorReferencia: 'SMF',
    descricao: 'Layout executivo limpo em Calibri 11pt para declarações LRF, dotações, certidões fiscais e despachos financeiros.',
    origem: 'NATIVO',
    fonte: 'Calibri',
    tamanhoFonte: '11pt',
    alinhamento: 'justify',
    espacamentoLinhas: 1.35,
    recuoParagrafoCm: 1.25,
    margens: { superior: 2.5, inferior: 2.0, esquerda: 2.5, direita: 2.0 },
    corPrimaria: '#1d4ed8',
    corBordaCabecalho: '#1d4ed8',
    cabecalhoLayout: 'LATERAL',
    cabecalhoSubtituloCustom: 'SECRETARIA MUNICIPAL DE FINANÇAS (SMF)',
    rodapeTexto: 'Secretaria Municipal de Finanças • Contabilidade, Tesouraria e Tributos – Rio Claro/RJ • fazenda@rioclaro.rj.gov.br',
    epigrafeAlinhamento: 'left',
    epigrafeCaixaAlta: true,
    ementaEstilo: 'DIREITA_BORDA',
    assinaturaPadrao: 'INDIVIDUAL',
  },
  {
    id: 'ESTILO_SETORIAL_TECNICO',
    nome: 'Secretarias Finalísticas (Saúde, Educação, Obras, Social)',
    setorReferencia: 'GERAL',
    descricao: 'Padrão moderno em Arial 11pt com leitura fluida para relatórios técnicos, ofícios de rede, vistorias e pareceres operacionais.',
    origem: 'NATIVO',
    fonte: 'Arial',
    tamanhoFonte: '11pt',
    alinhamento: 'justify',
    espacamentoLinhas: 1.4,
    recuoParagrafoCm: 1.25,
    margens: { superior: 2.5, inferior: 2.0, esquerda: 2.5, direita: 2.0 },
    corPrimaria: '#0369a1',
    corBordaCabecalho: '#0369a1',
    cabecalhoLayout: 'LATERAL',
    rodapeTexto: 'Prefeitura Municipal de Rio Claro – RJ • Av. João Batista Portugal, nº 230 – Centro – Rio Claro/RJ',
    epigrafeAlinhamento: 'left',
    epigrafeCaixaAlta: true,
    ementaEstilo: 'SIMPLES',
    assinaturaPadrao: 'INDIVIDUAL',
  },
];

export function loadCustomDocumentStyles(): PerfilEstiloDocumental[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STYLES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is PerfilEstiloDocumental =>
        Boolean(item && typeof item === 'object' && typeof item.id === 'string' && typeof item.nome === 'string')
    );
  } catch {
    return [];
  }
}

export function saveCustomDocumentStyles(styles: PerfilEstiloDocumental[]): void {
  try {
    localStorage.setItem(CUSTOM_STYLES_STORAGE_KEY, JSON.stringify(styles));
  } catch {
    // Ignora quota localStorage
  }
}

export function getAllDocumentStyles(customStyles: PerfilEstiloDocumental[] = []): PerfilEstiloDocumental[] {
  const map = new Map<string, PerfilEstiloDocumental>();
  for (const s of ESTILOS_INSTITUCIONAIS_NATIVOS) map.set(s.id, s);
  for (const c of customStyles) map.set(c.id, c);
  return Array.from(map.values());
}

export function getDocumentStyleById(
  id?: string | null,
  customStyles: PerfilEstiloDocumental[] = []
): PerfilEstiloDocumental {
  if (id) {
    const foundCustom = customStyles.find(s => s.id === id);
    if (foundCustom) return foundCustom;
    const foundNative = ESTILOS_INSTITUCIONAIS_NATIVOS.find(s => s.id === id);
    if (foundNative) return foundNative;
  }
  return ESTILOS_INSTITUCIONAIS_NATIVOS[0];
}

export function getRecommendedStyleIdForSecretaria(siglaOrName?: string): string {
  const s = String(siglaOrName || '').toUpperCase();
  if (s.includes('SEGOV') || s.includes('GABINETE') || s === 'GP') return 'ESTILO_GABINETE_PREFEITO';
  if (s.includes('PGM') || s.includes('PROCURADORIA')) return 'ESTILO_PGM_JURIDICO';
  if (s.includes('CGM') || s.includes('CONTROLADORIA')) return 'ESTILO_CGM_AUDITORIA';
  if (s.includes('SMF') || s.includes('FINAN') || s.includes('FAZENDA')) return 'ESTILO_SMF_FINANCAS';
  if (s.includes('SMS') || s.includes('SME') || s.includes('SMOSP') || s.includes('SMAS') || s.includes('SMMA') || s.includes('SMOP') || s.includes('IPRC')) {
    return 'ESTILO_SETORIAL_TECNICO';
  }
  return 'ESTILO_PADRAO_PMRC';
}

function clampNumber(val: unknown, min: number, max: number, fallback: number): number {
  const n = typeof val === 'number' ? val : parseFloat(String(val ?? ''));
  if (Number.isNaN(n)) return fallback;
  return Math.round(Math.min(max, Math.max(min, n)) * 100) / 100;
}

function sanitizeHexColor(raw: unknown, fallback: string): string {
  const s = String(raw || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  return fallback;
}

export function normalizeFonte(raw: unknown): FonteOficialEstilo {
  const s = String(raw || '').toLowerCase();
  if (s.includes('arial') || s.includes('helvetica') || s.includes('sans')) return 'Arial';
  if (s.includes('calibri') || s.includes('carlito') || s.includes('candara') || s.includes('cambria')) return 'Calibri';
  return 'Times New Roman';
}

export function normalizeTamanhoFonte(raw: unknown): TamanhoFonteEstilo {
  const n = parseFloat(String(raw || '').replace(',', '.'));
  if (!Number.isNaN(n)) {
    if (n <= 10.3) return '10pt';
    if (n <= 11.4) return '11pt';
    return '12pt';
  }
  const s = String(raw || '').trim();
  if (s === '10pt' || s === '11pt' || s === '12pt') return s;
  return '12pt';
}

export function normalizeAlinhamento(raw: unknown): AlinhamentoTextoEstilo {
  const s = String(raw || '').toLowerCase();
  if (s.includes('left') || s.includes('esquerd')) return 'left';
  if (s.includes('center') || s.includes('centr')) return 'center';
  return 'justify';
}

export function normalizeCabecalhoLayout(raw: unknown): CabecalhoLayoutEstilo {
  const s = String(raw || '').toUpperCase();
  if (s.includes('SOLENE') || s.includes('DUPLO')) return 'SOLENE_DUPLO';
  if (s.includes('CENTR')) return 'CENTRALIZADO';
  return 'LATERAL';
}

export function normalizeEmentaEstilo(raw: unknown): EmentaEstiloVisual {
  const s = String(raw || '').toUpperCase();
  if (s.includes('CAIXA') || s.includes('SOMB') || s.includes('BOX')) return 'CAIXA_SOMBREADA';
  if (s.includes('SEM_BORDA') || s.includes('CLEAN')) return 'DIREITA_SEM_BORDA';
  if (s.includes('SIMPLES')) return 'SIMPLES';
  return 'DIREITA_BORDA';
}

export function normalizeAssinaturaPadrao(raw: unknown): AssinaturaPadraoEstilo {
  const s = String(raw || '').toUpperCase();
  if (s.includes('DUPLA') || s.includes('REFEREND')) return 'DUPLA_REFERENDO';
  if (s.includes('COMISSAO') || s.includes('PAD') || s.includes('COLEGIAD')) return 'COMISSAO_PAD';
  return 'INDIVIDUAL';
}

export function normalizeEstiloVisualExtraido(
  raw: Record<string, any> | null | undefined,
  fallbackMeta?: {
    fileName?: string;
    secretariaOrigem?: string;
    tipoDocumento?: string;
    localHint?: Partial<EstiloVisualExtraido>;
  }
): EstiloVisualExtraido {
  const base = raw && typeof raw === 'object' ? raw : {};
  const local = fallbackMeta?.localHint || {};
  const sec = String(base.setorReferencia || fallbackMeta?.secretariaOrigem || local.setorReferencia || 'GERAL').trim();
  const fonte = normalizeFonte(base.fonte || local.fonte);
  const tamanhoFonte = normalizeTamanhoFonte(base.tamanhoFonte || local.tamanhoFonte);
  const alinhamento = normalizeAlinhamento(base.alinhamento || local.alinhamento);
  const espacamentoLinhas = clampNumber(base.espacamentoLinhas ?? local.espacamentoLinhas, 1.1, 2.0, 1.5);
  const recuoParagrafoCm = clampNumber(base.recuoParagrafoCm ?? local.recuoParagrafoCm, 0, 3.5, 1.5);

  const margensObj = (base.margens && typeof base.margens === 'object') ? base.margens : {};
  const margens = {
    superior: clampNumber(base.margemSuperiorCm ?? margensObj.superior ?? local.margens?.superior, 1.0, 4.5, 2.5),
    inferior: clampNumber(base.margemInferiorCm ?? margensObj.inferior ?? local.margens?.inferior, 1.0, 4.5, 2.0),
    esquerda: clampNumber(base.margemEsquerdaCm ?? margensObj.esquerda ?? local.margens?.esquerda, 1.5, 4.5, 3.0),
    direita: clampNumber(base.margemDireitaCm ?? margensObj.direita ?? local.margens?.direita, 1.0, 4.0, 2.0),
  };

  const corPrimaria = sanitizeHexColor(base.corPrimaria || local.corPrimaria, '#002b82');
  const corBordaCabecalho = sanitizeHexColor(base.corBordaCabecalho || base.corPrimaria || local.corBordaCabecalho, corPrimaria);
  const cabecalhoLayout = normalizeCabecalhoLayout(base.cabecalhoLayout || local.cabecalhoLayout);
  const cabecalhoSubtitulo = String(base.cabecalhoSubtitulo || local.cabecalhoSubtitulo || '').trim() || undefined;
  const rodapeTexto = String(base.rodapeTexto || local.rodapeTexto || '').trim() || undefined;
  const epigrafeAlinhamento: 'center' | 'left' = String(base.epigrafeAlinhamento || local.epigrafeAlinhamento || 'center').toLowerCase().includes('left') ? 'left' : 'center';
  const epigrafeCaixaAlta = base.epigrafeCaixaAlta !== false;
  const ementaEstilo = normalizeEmentaEstilo(base.ementaEstilo || local.ementaEstilo);
  const assinaturaPadrao = normalizeAssinaturaPadrao(base.assinaturaPadrao || local.assinaturaPadrao);

  const nomeClean = String(base.nomeSugerido || '').trim();
  const baseName = fallbackMeta?.fileName ? fallbackMeta.fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 34) : 'Documento';
  const nomeSugerido = nomeClean || `Estilo Clonado — ${cabecalhoSubtitulo || sec || baseName}`;

  const layoutLabel =
    cabecalhoLayout === 'CENTRALIZADO'
      ? 'cabeçalho centralizado'
      : cabecalhoLayout === 'SOLENE_DUPLO'
      ? 'cabeçalho solene duplo'
      : 'cabeçalho lateral';
  const assLabel =
    assinaturaPadrao === 'DUPLA_REFERENDO'
      ? 'assinatura dupla (referendo)'
      : assinaturaPadrao === 'COMISSAO_PAD'
      ? 'assinatura colegiada'
      : 'assinatura individual';

  const resumoEstilo =
    String(base.resumoEstilo || '').trim() ||
    `${fonte} ${tamanhoFonte}, ${layoutLabel}, margens ${margens.superior}/${margens.esquerda}/${margens.direita}/${margens.inferior} cm e ${assLabel}.`;

  return {
    nomeSugerido,
    setorReferencia: sec,
    fonte,
    tamanhoFonte,
    alinhamento,
    espacamentoLinhas,
    recuoParagrafoCm,
    margens,
    corPrimaria,
    corBordaCabecalho,
    cabecalhoLayout,
    cabecalhoSubtitulo,
    rodapeTexto,
    epigrafeAlinhamento,
    epigrafeCaixaAlta,
    ementaEstilo,
    assinaturaPadrao,
    resumoEstilo,
    detectadoLocalmente: !raw,
  };
}

export function estiloExtraidoParaPerfil(
  extraido: EstiloVisualExtraido,
  options?: { nomeCustom?: string; arquivoOrigem?: string; id?: string }
): PerfilEstiloDocumental {
  return {
    id: options?.id || `CLONE-${Date.now().toString(36).toUpperCase()}`,
    nome: (options?.nomeCustom || extraido.nomeSugerido || 'Estilo Clonado').trim(),
    setorReferencia: extraido.setorReferencia || 'GERAL',
    descricao: extraido.resumoEstilo,
    origem: 'CLONADO_PDF',
    arquivoOrigem: options?.arquivoOrigem,
    criadoEm: new Date().toISOString(),
    fonte: extraido.fonte,
    tamanhoFonte: extraido.tamanhoFonte,
    alinhamento: extraido.alinhamento,
    espacamentoLinhas: extraido.espacamentoLinhas,
    recuoParagrafoCm: extraido.recuoParagrafoCm,
    margens: { ...extraido.margens },
    corPrimaria: extraido.corPrimaria,
    corBordaCabecalho: extraido.corBordaCabecalho,
    cabecalhoLayout: extraido.cabecalhoLayout,
    cabecalhoSubtituloCustom: extraido.cabecalhoSubtitulo,
    rodapeTexto: extraido.rodapeTexto,
    epigrafeAlinhamento: extraido.epigrafeAlinhamento,
    epigrafeCaixaAlta: extraido.epigrafeCaixaAlta,
    ementaEstilo: extraido.ementaEstilo,
    assinaturaPadrao: extraido.assinaturaPadrao,
  };
}
