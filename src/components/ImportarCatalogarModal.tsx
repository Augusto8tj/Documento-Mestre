import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  Copy,
  Database,
  Download,
  FileCheck2,
  FileSignature,
  FileText,
  FolderPlus,
  Layers,
  Link2,
  ListOrdered,
  Loader2,
  Lock,
  Palette,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import {
  DadosSistemaExtraidos,
  DepartamentoExtraidoOCR,
  DigitalSignatureInfo,
  SUPPORTED_DOCUMENT_ACCEPT,
  ServidorExtraidoOCR,
  parseUploadedDocumentFile,
} from '../utils/documentUpload';
import { HelpTooltip } from './HelpTooltip';
import { ALL_DOCUMENT_TYPE_CODES } from '../documentTypes';
import type { EstiloVisualExtraido, PerfilEstiloDocumental } from '../documentStyles';

export interface CatalogedImportItem {
  id: string;
  fileName: string;
  originalFile?: File;
  formatoOriginal: string;
  tamanhoBytes: number;
  status: 'processing' | 'ready' | 'cataloged_model' | 'cataloged_livro' | 'error';
  errorMessage?: string;
  avisoIA?: string;
  reconhecidoPorIA: boolean;
  ocrAplicado?: boolean;
  assinaturaDigital?: DigitalSignatureInfo;
  linkArquivoOriginal?: string;
  desbloquearEdicaoOriginal?: boolean;
  tipoDocumento: string;
  categoria: string;
  titulo: string;
  assunto: string;
  destinatario: string;
  secretariaOrigem: string;
  numeroOriginal: string;
  dataDocumento: string;
  referencia: string;
  baseLegal: string;
  palavrasChave: string;
  resumoCatalogacao: string;
  textoOriginal: string;
  textoModelo: string;
  modoTexto: 'modelo' | 'original';
  dadosSistema?: DadosSistemaExtraidos;
  estiloVisual?: EstiloVisualExtraido;
  estiloNomeCustom?: string;
  estiloClonadoId?: string;
}

interface ImportarCatalogarModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoriasExistentes: string[];
  secretariasDisponiveis: string[];
  destinatariosExistentes?: string[];
  secretariaPadrao: string;
  canCatalogModelo: boolean;
  isAdmin?: boolean;
  usuariosExistentes?: Array<{
    matricula: string;
    nome: string;
    cargo?: string;
    funcaoGratificada?: string;
    secretaria?: string;
    departamento?: string;
    ativo?: boolean;
  }>;
  cargosOficiaisExistentes?: string[];
  departamentosExistentes?: string[];
  getMaiorSequencialAtual?: (tipoDocumento: string, secretaria: string, ano: string) => number;
  onCatalogarComoModelo: (item: CatalogedImportItem) => Promise<boolean>;
  onRegistrarNoLivro: (item: CatalogedImportItem, usarNumeroOriginal: boolean) => Promise<boolean>;
  onAbrirNoRedator: (item: CatalogedImportItem) => void;
  onAbastecerServidorOCR?: (srv: ServidorExtraidoOCR, item: CatalogedImportItem) => Promise<boolean>;
  onAbastecerDepartamentoOCR?: (dep: DepartamentoExtraidoOCR, item: CatalogedImportItem) => Promise<boolean>;
  onAbastecerCargoOCR?: (cargoNome: string, item: CatalogedImportItem) => Promise<boolean>;
  onAbastecerCombosRedatorOCR?: (payload: { destinatarios: string[]; assunto?: string }, item: CatalogedImportItem) => void;
  onAtualizarMarcoZeroOCR?: (payload: {
    secretaria: string;
    tipoDocumento: string;
    ultimoNumero: number;
    ano: string;
    observacao: string;
  }) => Promise<boolean>;
  onClonarEstiloVisual?: (
    estilo: EstiloVisualExtraido,
    item: CatalogedImportItem,
    nomeCustom?: string
  ) => PerfilEstiloDocumental | null;
  showToast: (msg: string, title?: string, isError?: boolean) => void;
}

const TIPOS_CATALOGACAO = ALL_DOCUMENT_TYPE_CODES;

function getFormatBadgeClass(formato: string): string {
  const f = (formato || '').toUpperCase();
  if (f === 'PDF') return 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300';
  if (f === 'ODT') return 'bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300';
  if (f === 'CSV') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300';
  if (f === 'RTF') return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300';
  if (['JPG', 'JPEG', 'PNG', 'WEBP'].includes(f)) {
    return 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300';
  }
  return 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300';
}

export const ImportarCatalogarModal: React.FC<ImportarCatalogarModalProps> = ({
  isOpen,
  onClose,
  categoriasExistentes,
  secretariasDisponiveis,
  destinatariosExistentes = [],
  secretariaPadrao,
  canCatalogModelo,
  isAdmin = false,
  usuariosExistentes = [],
  cargosOficiaisExistentes = [],
  departamentosExistentes = [],
  getMaiorSequencialAtual,
  onCatalogarComoModelo,
  onRegistrarNoLivro,
  onAbrirNoRedator,
  onAbastecerServidorOCR,
  onAbastecerDepartamentoOCR,
  onAbastecerCargoOCR,
  onAbastecerCombosRedatorOCR,
  onAtualizarMarcoZeroOCR,
  onClonarEstiloVisual,
  showToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<CatalogedImportItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [mobileTab, setMobileTab] = useState<'fila' | 'revisao'>('fila');
  const [isNovaCategoriaManual, setIsNovaCategoriaManual] = useState(false);
  const [appliedOcrKeys, setAppliedOcrKeys] = useState<Record<string, boolean>>({});
  const [busyOcrKey, setBusyOcrKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const markOcrApplied = (key: string) => {
    setAppliedOcrKeys(prev => ({ ...prev, [key]: true }));
  };

  // Extrai número sequencial e ano de uma string como "Portaria nº 248/2026" ou "042/2026 - SMA"
  const parseNumeroAnoOriginal = (raw?: string): { numero: number; ano: string } | null => {
    const m = String(raw || '').match(/(\d{1,5})\s*\/\s*(20\d{2})/);
    if (!m) return null;
    const numero = parseInt(m[1], 10);
    if (Number.isNaN(numero) || numero < 1) return null;
    return { numero, ano: m[2] };
  };

  const selectedItem = items.find(i => i.id === selectedId) || items[0] || null;
  const readyItems = items.filter(i => i.status === 'ready');
  const processingCount = items.filter(i => i.status === 'processing').length;
  const signedCount = items.filter(i => i.assinaturaDigital?.detectada).length;

  const resolveSecretariaInicial = (detectada?: string): string => {
    if (detectada && detectada.trim()) {
      const norm = detectada.toLowerCase();
      const match = secretariasDisponiveis.find(
        s => s.toLowerCase().includes(norm) || norm.includes(s.toLowerCase())
      );
      if (match) return match;
    }
    if (secretariaPadrao && secretariaPadrao !== 'TODAS') return secretariaPadrao;
    return secretariasDisponiveis[0] || 'Secretaria Municipal de Administração (SMA)';
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const placeholders: CatalogedImportItem[] = files.map((file, idx) => {
      const ext = (file.name.split('.').pop() || 'DOC').toUpperCase();
      return {
        id: `IMP-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        fileName: file.name,
        originalFile: file,
        formatoOriginal: ext,
        tamanhoBytes: file.size,
        status: 'processing',
        reconhecidoPorIA: false,
        ocrAplicado: false,
        tipoDocumento: 'MEMORANDO',
        categoria: categoriasExistentes[0] || '1. Geral',
        titulo: file.name.replace(/\.[^.]+$/, ''),
        assunto: '',
        destinatario: '',
        secretariaOrigem: resolveSecretariaInicial(),
        numeroOriginal: '',
        dataDocumento: '',
        referencia: '',
        baseLegal: '',
        palavrasChave: '',
        resumoCatalogacao: '',
        textoOriginal: '',
        textoModelo: '',
        linkArquivoOriginal: '',
        desbloquearEdicaoOriginal: false,
        modoTexto: canCatalogModelo ? 'modelo' : 'original',
      };
    });

    setItems(prev => [...placeholders, ...prev]);
    setSelectedId(placeholders[0].id);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const placeholderId = placeholders[i].id;
      try {
        const parsed = await parseUploadedDocumentFile(file, {
          categoriasExistentes,
          secretariasExistentes: secretariasDisponiveis,
          usarIA: true,
        });

        const isAssinado = Boolean(parsed.assinaturaDigital?.detectada);

        setItems(prev =>
          prev.map(it =>
            it.id === placeholderId
              ? {
                  ...it,
                  status: 'ready',
                  formatoOriginal: parsed.formatoOriginal,
                  reconhecidoPorIA: !!parsed.reconhecidoPorIA,
                  ocrAplicado: !!parsed.ocrAplicado,
                  assinaturaDigital: parsed.assinaturaDigital,
                  avisoIA: parsed.avisoIA,
                  tipoDocumento: parsed.tipoSugerido || 'MEMORANDO',
                  categoria: parsed.categoria || categoriasExistentes[0] || '1. Geral',
                  titulo: parsed.titulo || it.titulo,
                  assunto: parsed.assunto || parsed.titulo || '',
                  destinatario: parsed.destinatario || '',
                  secretariaOrigem: resolveSecretariaInicial(parsed.secretariaOrigem),
                  numeroOriginal: parsed.numeroOriginal || '',
                  dataDocumento: parsed.dataDocumento || '',
                  referencia: parsed.referencia || '',
                  baseLegal: parsed.baseLegal || '',
                  palavrasChave: parsed.palavrasChave || '',
                  resumoCatalogacao: parsed.resumoCatalogacao || '',
                  textoOriginal: parsed.texto,
                  textoModelo: parsed.textoModelo || parsed.texto,
                  dadosSistema: parsed.dadosSistema,
                  estiloVisual: parsed.estiloVisual,
                  estiloNomeCustom: parsed.estiloVisual?.nomeSugerido || '',
                  // Se possui assinatura digital, inicia no texto original fiel e protegido
                  modoTexto: isAssinado ? 'original' : it.modoTexto,
                  desbloquearEdicaoOriginal: false,
                }
              : it
          )
        );
      } catch (err: any) {
        setItems(prev =>
          prev.map(it =>
            it.id === placeholderId
              ? {
                  ...it,
                  status: 'error',
                  errorMessage: err?.message || 'Falha ao processar o arquivo.',
                }
              : it
          )
        );
      }
    }
  };

  const updateSelectedItem = (patch: Partial<CatalogedImportItem>) => {
    if (!selectedItem) return;
    setItems(prev => prev.map(it => (it.id === selectedItem.id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id || null);
      }
      return next;
    });
  };

  const handleDownloadOriginalIntacto = (item: CatalogedImportItem) => {
    if (!item.originalFile) {
      showToast('Arquivo original não disponível em memória.', 'Download', true);
      return;
    }
    const url = URL.createObjectURL(item.originalFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Cópia bit a bit intacta de "${item.fileName}" baixada (assinatura digital preservada).`);
  };

  const handleCopySha256 = async (hash: string) => {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      showToast('Hash SHA-256 do arquivo original copiado para a área de transferência.');
    } catch {
      showToast('Não foi possível copiar automaticamente o hash SHA-256.', 'Cópia', true);
    }
  };

  const handleSingleCatalogModel = async (item: CatalogedImportItem) => {
    if (!canCatalogModelo) {
      showToast('Apenas perfis Administrador ou Editor podem gravar novos modelos no acervo.', 'Permissão', true);
      return;
    }
    setIsSavingItem(true);
    try {
      const ok = await onCatalogarComoModelo(item);
      if (ok) {
        setItems(prev => prev.map(i => (i.id === item.id ? { ...i, status: 'cataloged_model' } : i)));
      }
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleSingleRegisterLivro = async (item: CatalogedImportItem, usarNumeroOriginal: boolean) => {
    setIsSavingItem(true);
    try {
      const ok = await onRegistrarNoLivro(item, usarNumeroOriginal);
      if (ok) {
        setItems(prev => prev.map(i => (i.id === item.id ? { ...i, status: 'cataloged_livro' } : i)));
      }
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleBatchCatalogModels = async () => {
    if (!canCatalogModelo || readyItems.length === 0) return;
    setIsBatchRunning(true);
    let count = 0;
    try {
      for (const item of readyItems) {
        const ok = await onCatalogarComoModelo(item);
        if (ok) {
          count++;
          setItems(prev => prev.map(i => (i.id === item.id ? { ...i, status: 'cataloged_model' } : i)));
        }
      }
      if (count > 0) {
        showToast(`${count} documento(s) catalogado(s) no Banco de Modelos com sucesso!`);
      }
    } finally {
      setIsBatchRunning(false);
    }
  };

  const handleBatchRegisterLivro = async () => {
    if (readyItems.length === 0) return;
    setIsBatchRunning(true);
    let count = 0;
    try {
      for (const item of readyItems) {
        const ok = await onRegistrarNoLivro(item, Boolean(item.numeroOriginal.trim()));
        if (ok) {
          count++;
          setItems(prev => prev.map(i => (i.id === item.id ? { ...i, status: 'cataloged_livro' } : i)));
        }
      }
      if (count > 0) {
        showToast(`${count} documento(s) registrado(s) no Livro de Numeração!`);
      }
    } finally {
      setIsBatchRunning(false);
    }
  };

  const isSelectedSigned = Boolean(selectedItem?.assinaturaDigital?.detectada);
  const isOriginalLocked =
    Boolean(isSelectedSigned && selectedItem?.modoTexto === 'original' && !selectedItem?.desbloquearEdicaoOriginal);

  const textoEditavelAtual = selectedItem
    ? selectedItem.modoTexto === 'modelo'
      ? selectedItem.textoModelo
      : selectedItem.textoOriginal
    : '';

  return (
    <div
      id="modal-importar-catalogar"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 rounded-none sm:rounded-2xl w-full sm:w-[96vw] sm:max-w-[1400px] shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-[92dvh] max-h-[100dvh] sm:max-h-[94dvh]">
        {/* Cabeçalho */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                  Importar, OCR e Catalogar Documentos
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="w-3 h-3" />
                  PDF • ODT • DOC/DOCX • RTF • CSV • OCR
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3" />
                  Preserva Assinatura Digital
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Leitura somente-leitura (intacta), OCR automático e catalogação inteligente sem ocupar espaço extra no Drive.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            title="Fechar janela de importação"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alternador Mobile (< lg): Fila de Arquivos vs Formulário de Revisão */}
        {items.length > 0 && (
          <div className="lg:hidden px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setMobileTab('fila')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mobileTab === 'fila'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Arquivos ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('revisao')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mobileTab === 'revisao'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Revisar Dados
            </button>
          </div>
        )}

        {/* Corpo Principal */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Coluna Esquerda: Upload + Fila de Arquivos */}
          <div
            className={`${
              items.length > 0 && mobileTab === 'revisao' ? 'hidden lg:flex' : 'flex'
            } w-full lg:w-[340px] xl:w-[370px] flex-1 lg:flex-initial border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex-col bg-slate-50/70 dark:bg-slate-950/40 lg:flex-shrink-0 min-h-0`}
          >
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={SUPPORTED_DOCUMENT_ACCEPT}
                onChange={e => {
                  if (e.target.files) processFiles(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.length) {
                    processFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 scale-[0.99]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Arraste arquivos aqui ou toque para escolher
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  <strong>PDF / Fotos (JPG, PNG)</strong> até 10 MB •{' '}
                  <strong>ODT, DOCX, DOC, RTF, CSV, TXT</strong> até 5 MB
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>Leitura intacta: não altera assinaturas digitais</span>
                </p>
              </div>
            </div>

            {/* Lista de Arquivos Enviados */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Fila de Catalogação ({items.length})
                </span>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setItems([]);
                      setSelectedId(null);
                    }}
                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    Limpar fila
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 px-4 text-xs text-slate-400 dark:text-slate-500 space-y-2">
                  <Layers className="w-7 h-7 mx-auto opacity-40" />
                  <p>
                    Envie documentos do LibreOffice (<strong>.odt</strong>), Word (<strong>.doc/.docx</strong>),{' '}
                    <strong>.rtf</strong>, planilhas <strong>.csv</strong>, <strong>.pdf</strong> ou fotos de ofícios para OCR e catalogação automática.
                  </p>
                </div>
              ) : (
                items.map(item => {
                  const isActive = selectedItem?.id === item.id;
                  const kb = Math.max(1, Math.round(item.tamanhoBytes / 1024));
                  const hasSig = Boolean(item.assinaturaDigital?.detectada);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedId(item.id);
                        setMobileTab('revisao');
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white dark:bg-slate-800 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                          : 'bg-white/80 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${getFormatBadgeClass(
                                item.formatoOriginal
                              )}`}
                            >
                              {item.formatoOriginal}
                            </span>
                            <p
                              className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate"
                              title={item.fileName}
                            >
                              {item.fileName}
                            </p>
                          </div>

                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            {item.status === 'processing' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Lendo e verificando...
                              </span>
                            )}
                            {item.status === 'ready' && (
                              <>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                  {item.tipoDocumento}
                                </span>
                                {item.ocrAplicado && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[9px] font-extrabold">
                                    OCR
                                  </span>
                                )}
                                {hasSig && (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[9px] font-extrabold border border-amber-300/70 dark:border-amber-700"
                                    title="Assinatura digital detectada — leitura intacta"
                                  >
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    Assinado
                                  </span>
                                )}
                              </>
                            )}
                            {item.status === 'cataloged_model' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />
                                Catalogado em Modelos
                              </span>
                            )}
                            {item.status === 'cataloged_livro' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                <CheckCircle2 className="w-3 h-3" />
                                Registrado no Livro
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="w-3 h-3" />
                                Erro na leitura
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 ml-auto">{kb} KB</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            removeItem(item.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer shrink-0"
                          title="Remover da fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Coluna Direita: Painel de Revisão & Catalogação */}
          <div
            className={`${
              items.length > 0 && mobileTab === 'fila' ? 'hidden lg:block' : 'block'
            } flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 bg-white dark:bg-slate-900`}
          >
            {!selectedItem ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800">
                  <FileCheck2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Reconhecimento Multi-Formato, OCR &amp; Proteção de Assinatura Digital
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Suporte nativo a <strong>.pdf</strong> (pesquisável, escaneado ou apresentação),{' '}
                    <strong>.odt</strong> (LibreOffice), <strong>.doc / .docx</strong> (Word antigo e atual),{' '}
                    <strong>.rtf</strong>, <strong>.csv</strong> (Excel Brasil com <code>;</code> ou <code>,</code>) e{' '}
                    <strong>fotos (.jpg/.png)</strong> — incluindo OCR automático em imagens embutidas dentro de arquivos Word/Writer.
                  </p>
                </div>

                {/* Aviso institucional de integridade de assinatura digital */}
                <div className="w-full p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/70 text-left flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                    <p className="font-bold">Respeito Integral às Assinaturas Digitais (ICP-Brasil / Gov.br / XMLDSig)</p>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 mt-0.5">
                      Todos os arquivos são inspecionados em <strong>modo somente-leitura</strong> com cálculo do hash{' '}
                      <strong>SHA-256 original</strong>. Quando um documento assinado digitalmente é detectado, o sistema
                      ativa o modo de preservação para catalogar os metadados e o hash no Livro <strong>sem alterar ou invalidar o arquivo assinado original</strong>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full text-left pt-1">
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60">
                    <FolderPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">1. Banco de Modelos</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Gera minutas com <code>[CAMPOS]</code> reutilizáveis, removendo dados pessoais/assinaturas.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60">
                    <ListOrdered className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">2. Livro de Numeração</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Indexa o ato com número, SHA-256 e link para o arquivo assinado intacto.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/60">
                    <FileSignature className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">3. Redator Oficial</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Abre o texto (ou cria cópia derivada) no Timbrado A4 oficial para edição.
                    </p>
                  </div>
                </div>
              </div>
            ) : selectedItem.status === 'processing' ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
                <Loader2 className="w-10 h-10 text-sky-600 animate-spin" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Analisando &ldquo;{selectedItem.fileName}&rdquo;...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  Verificando integridade/assinatura digital (SHA-256), extraindo texto ou executando OCR e classificando metadados oficiais.
                </p>
              </div>
            ) : selectedItem.status === 'error' ? (
              <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Não foi possível processar &ldquo;{selectedItem.fileName}&rdquo;</span>
                </div>
                <p className="text-xs text-rose-600 dark:text-rose-300/90 leading-relaxed">
                  {selectedItem.errorMessage}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* CARTÃO DE PRESERVAÇÃO DE ASSINATURA DIGITAL */}
                {isSelectedSigned && selectedItem.assinaturaDigital && (
                  <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/80 space-y-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-extrabold text-amber-950 dark:text-amber-100">
                              Documento com Assinatura Digital Detectada — Modo Preservação Ativo
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200">
                              {selectedItem.assinaturaDigital.nivelConfianca === 'criptografica'
                                ? 'Criptográfica'
                                : 'Identificada no Teor'}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 mt-0.5">
                            {selectedItem.assinaturaDigital.padrao}
                          </p>
                          {selectedItem.assinaturaDigital.signatarios && (
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                              <strong>Signatário(s):</strong> {selectedItem.assinaturaDigital.signatarios}
                            </p>
                          )}
                          {selectedItem.assinaturaDigital.codigoVerificacao && (
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 break-all">
                              <strong>Verificação:</strong> {selectedItem.assinaturaDigital.codigoVerificacao}
                            </p>
                          )}
                        </div>
                      </div>

                      {selectedItem.originalFile && (
                        <button
                          type="button"
                          onClick={() => handleDownloadOriginalIntacto(selectedItem)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-[11px] font-bold cursor-pointer shrink-0"
                          title="Baixar o arquivo original sem qualquer modificação"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Baixar Original Intacto</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-amber-900/95 dark:text-amber-200/90 leading-relaxed bg-white/70 dark:bg-slate-900/50 p-2.5 rounded-lg border border-amber-200/80 dark:border-amber-800/60">
                      <strong>Regra de Validade Jurídica:</strong> O arquivo original foi lido apenas em{' '}
                      <strong>modo leitura</strong> (bytes intactos). <strong>Não reexporte nem substitua</strong> o
                      documento original pelo Redator/PDF gerado, pois qualquer alteração nos bytes invalida o
                      certificado ICP-Brasil / Gov.br / XMLDSig. Arquive o original intacto (Drive/SEI) e registre
                      abaixo apenas a catalogação com o hash SHA-256.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {selectedItem.assinaturaDigital.hashSha256 && (
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-1">
                            Hash SHA-256 do Arquivo Original (Prova de Integridade)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              readOnly
                              value={selectedItem.assinaturaDigital.hashSha256}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-[11px] font-mono text-slate-700 dark:text-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleCopySha256(selectedItem.assinaturaDigital!.hashSha256)}
                              className="p-2 rounded-lg bg-amber-200/80 dark:bg-amber-900/70 hover:bg-amber-300 text-amber-950 dark:text-amber-100 cursor-pointer shrink-0"
                              title="Copiar hash SHA-256"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-1">
                          Link / Pasta do Original Assinado (Opcional — para o Livro)
                        </label>
                        <div className="relative">
                          <Link2 className="w-3.5 h-3.5 text-amber-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={selectedItem.linkArquivoOriginal || ''}
                            onChange={e => updateSelectedItem({ linkArquivoOriginal: e.target.value })}
                            placeholder="Ex: https://drive.google.com/... ou SEI nº ..."
                            className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Banner de Status / Resumo */}
                {selectedItem.reconhecidoPorIA && selectedItem.resumoCatalogacao && (
                  <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-900 dark:text-indigo-200">
                      <span className="font-bold">
                        {selectedItem.ocrAplicado ? 'OCR e reconhecimento concluídos: ' : 'Reconhecimento concluído: '}
                      </span>
                      {selectedItem.resumoCatalogacao}
                    </div>
                  </div>
                )}

                {selectedItem.avisoIA && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Texto extraído localmente:</strong> {selectedItem.avisoIA} Você pode revisar os campos abaixo e catalogar normalmente.
                    </div>
                  </div>
                )}

                {(selectedItem.status === 'cataloged_model' || selectedItem.status === 'cataloged_livro') && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {selectedItem.status === 'cataloged_model'
                        ? 'Este documento já foi catalogado no Banco de Modelos!'
                        : 'Este documento já foi registrado no Livro de Numeração!'}
                    </span>
                  </div>
                )}

                {/* Grade de Metadados Reconhecidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Tipo de Documento
                    </label>
                    <select
                      value={selectedItem.tipoDocumento}
                      onChange={e => updateSelectedItem({ tipoDocumento: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                    >
                      {TIPOS_CATALOGACAO.map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        Categoria Temática
                      </label>
                      {isNovaCategoriaManual && (
                        <button
                          type="button"
                          onClick={() => setIsNovaCategoriaManual(false)}
                          className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                        >
                          Voltar para lista
                        </button>
                      )}
                    </div>
                    {!isNovaCategoriaManual ? (
                      <select
                        value={selectedItem.categoria}
                        onChange={e => {
                          if (e.target.value === '__NOVA__') {
                            setIsNovaCategoriaManual(true);
                            updateSelectedItem({ categoria: '' });
                          } else {
                            updateSelectedItem({ categoria: e.target.value });
                          }
                        }}
                        className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                      >
                        {selectedItem.categoria &&
                          !categoriasExistentes.some(
                            cat => cat.toLowerCase() === selectedItem.categoria.trim().toLowerCase()
                          ) && (
                            <option value={selectedItem.categoria}>
                              ✨ {selectedItem.categoria} (sugerida pelo OCR)
                            </option>
                          )}
                        {categoriasExistentes.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="__NOVA__">➕ Nova categoria (digitar manualmente)...</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={selectedItem.categoria}
                        onChange={e => updateSelectedItem({ categoria: e.target.value })}
                        placeholder="Ex: 7. Licitações e Contratos"
                        autoFocus
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-sky-400 dark:border-sky-600 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Secretaria de Origem
                    </label>
                    <select
                      value={selectedItem.secretariaOrigem}
                      onChange={e => updateSelectedItem({ secretariaOrigem: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                    >
                      {secretariasDisponiveis.map(sec => (
                        <option key={sec} value={sec}>
                          {sec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Título no Catálogo
                    </label>
                    <input
                      type="text"
                      value={selectedItem.titulo}
                      onChange={e => updateSelectedItem({ titulo: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Número Original (se constar)
                    </label>
                    <input
                      type="text"
                      value={selectedItem.numeroOriginal}
                      onChange={e => updateSelectedItem({ numeroOriginal: e.target.value })}
                      placeholder="Ex: 042/2026 - SMA"
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Assunto / Ementa
                    </label>
                    <input
                      type="text"
                      value={selectedItem.assunto}
                      onChange={e => updateSelectedItem({ assunto: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Destinatário
                    </label>
                    <input
                      type="text"
                      list="datalist-destinatarios-catalogacao"
                      value={selectedItem.destinatario}
                      onChange={e => updateSelectedItem({ destinatario: e.target.value })}
                      placeholder="Selecione ou digite o destinatário..."
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                    />
                    <datalist id="datalist-destinatarios-catalogacao">
                      {Array.from(new Set([...secretariasDisponiveis, ...destinatariosExistentes])).map(dest => (
                        <option key={dest} value={dest} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Referência / Processo
                    </label>
                    <input
                      type="text"
                      value={selectedItem.referencia}
                      onChange={e => updateSelectedItem({ referencia: e.target.value })}
                      placeholder="Ex: Processo nº 123/2026"
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Base Legal Detectada
                    </label>
                    <input
                      type="text"
                      value={selectedItem.baseLegal}
                      onChange={e => updateSelectedItem({ baseLegal: e.target.value })}
                      placeholder="Ex: Lei Municipal nº 1.234/2010"
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Palavras-Chave (busca)
                    </label>
                    <input
                      type="text"
                      value={selectedItem.palavrasChave}
                      onChange={e => updateSelectedItem({ palavrasChave: e.target.value })}
                      placeholder="férias, licença, servidor, portaria"
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* PAINEL INTELIGENTE: ABASTECER O SISTEMA COM DADOS EXTRAÍDOS PELO OCR */}
                {(() => {
                  const dados = selectedItem.dadosSistema;
                  const servidores = dados?.servidores || [];
                  const departamentos = dados?.departamentos || [];
                  const cargos = (dados?.cargos || []).filter(
                    c =>
                      !cargosOficiaisExistentes.some(
                        ex => ex.toLowerCase().replace(/\s*\(\*+\)\s*$/, '') === c.toLowerCase().replace(/\s*\(\*+\)\s*$/, '')
                      )
                  );
                  const destNovos = Array.from(
                    new Set([
                      ...(dados?.destinatarios || []),
                      ...(selectedItem.destinatario?.trim() ? [selectedItem.destinatario.trim()] : []),
                    ])
                  ).filter(d => d && d.toLowerCase() !== 'não informado');

                  const numParsed = parseNumeroAnoOriginal(selectedItem.numeroOriginal);
                  const maiorAtual =
                    numParsed && getMaiorSequencialAtual
                      ? getMaiorSequencialAtual(
                          selectedItem.tipoDocumento,
                          selectedItem.secretariaOrigem,
                          numParsed.ano
                        )
                      : null;
                  const podeAvancarMarcoZero = Boolean(
                    numParsed && maiorAtual !== null && numParsed.numero > maiorAtual
                  );

                  const totalAchados =
                    servidores.length +
                    departamentos.length +
                    cargos.length +
                    (destNovos.length > 0 ? 1 : 0) +
                    (podeAvancarMarcoZero ? 1 : 0);

                  if (totalAchados === 0) return null;

                  const combosKey = `${selectedItem.id}:combos`;
                  const marcoKey = `${selectedItem.id}:marco`;

                  return (
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-violet-50/90 via-indigo-50/70 to-sky-50/80 dark:from-violet-950/30 dark:via-indigo-950/25 dark:to-sky-950/25 border border-violet-200 dark:border-violet-800/70 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center shadow-xs shrink-0">
                            <Database className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-violet-950 dark:text-violet-100 inline-flex items-center gap-1.5">
                              <span>Abastecer o Sistema com Dados do OCR</span>
                              <HelpTooltip
                                tone="violet"
                                title="Alimentação Assistida por OCR"
                                content="O sistema extraiu servidores, departamentos, cargos, destinatários e numerações deste documento. Nada é alterado sozinho: você escolhe item por item o que deseja cadastrar ou atualizar na base municipal."
                              />
                            </h4>
                            <p className="text-[11px] text-violet-800/90 dark:text-violet-300/90">
                              Validação humana obrigatória — clique apenas nos dados que deseja incorporar aos combos e cadastros.
                            </p>
                          </div>
                        </div>

                        {destNovos.length > 0 && onAbastecerCombosRedatorOCR && (
                          <button
                            type="button"
                            disabled={!!appliedOcrKeys[combosKey]}
                            onClick={() => {
                              onAbastecerCombosRedatorOCR(
                                { destinatarios: destNovos, assunto: selectedItem.assunto },
                                selectedItem
                              );
                              markOcrApplied(combosKey);
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                              appliedOcrKeys[combosKey]
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-white dark:bg-slate-900 hover:bg-violet-600 hover:text-white text-violet-800 dark:text-violet-200 border border-violet-300 dark:border-violet-700'
                            }`}
                          >
                            {appliedOcrKeys[combosKey] ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Salvo nos Combos</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Salvar Destinatário/Assunto nos Combos</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Sugestão Automática de Marco Zero */}
                      {podeAvancarMarcoZero && numParsed && maiorAtual !== null && (
                        <div className="p-2.5 rounded-lg bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <span className="font-bold text-blue-900 dark:text-blue-200">
                              🔢 Sequência mais recente detectada ({selectedItem.tipoDocumento} {String(numParsed.numero).padStart(3, '0')}/{numParsed.ano}):
                            </span>{' '}
                            <span className="text-[11px] text-blue-800 dark:text-blue-300">
                              Maior nº atual no sistema é <strong>{String(maiorAtual).padStart(3, '0')}/{numParsed.ano}</strong>. Você pode sincronizar o Marco Zero para o próximo ato sair como{' '}
                              <strong>{String(numParsed.numero + 1).padStart(3, '0')}/{numParsed.ano}</strong>.
                            </span>
                          </div>
                          {isAdmin && onAtualizarMarcoZeroOCR ? (
                            <button
                              type="button"
                              disabled={!!appliedOcrKeys[marcoKey] || busyOcrKey === marcoKey}
                              onClick={async () => {
                                setBusyOcrKey(marcoKey);
                                try {
                                  const ok = await onAtualizarMarcoZeroOCR({
                                    secretaria: selectedItem.secretariaOrigem,
                                    tipoDocumento: selectedItem.tipoDocumento,
                                    ultimoNumero: numParsed.numero,
                                    ano: numParsed.ano,
                                    observacao: `Marco Zero atualizado via OCR (${selectedItem.fileName})`,
                                  });
                                  if (ok) markOcrApplied(marcoKey);
                                } finally {
                                  setBusyOcrKey(null);
                                }
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer ${
                                appliedOcrKeys[marcoKey]
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                              }`}
                            >
                              {busyOcrKey === marcoKey ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : appliedOcrKeys[marcoKey] ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <ListOrdered className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {appliedOcrKeys[marcoKey]
                                  ? 'Marco Zero Atualizado'
                                  : `Definir Marco Zero (${String(numParsed.numero).padStart(3, '0')}/${numParsed.ano})`}
                              </span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-white/70 dark:bg-slate-900/60 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                              Ação exclusiva ADMIN
                            </span>
                          )}
                        </div>
                      )}

                      {/* Servidores Identificados em Portarias / Atos */}
                      {servidores.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-violet-800 dark:text-violet-300 flex items-center gap-1">
                            <UserPlus className="w-3 h-3" />
                            <span>Servidores / Autoridades Identificados ({servidores.length})</span>
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {servidores.map((srv, idx) => {
                              const sKey = `${selectedItem.id}:srv:${idx}:${srv.nome}`;
                              const existing = usuariosExistentes.find(
                                u =>
                                  (srv.matricula && u.matricula && u.matricula.trim() === srv.matricula.trim()) ||
                                  u.nome.trim().toLowerCase() === srv.nome.trim().toLowerCase()
                              );
                              const isExon = srv.acaoAto === 'EXONERACAO';
                              return (
                                <div
                                  key={sKey}
                                  className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-violet-200/80 dark:border-violet-800/60 flex items-start justify-between gap-2"
                                >
                                  <div className="min-w-0 text-[11px] space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                        {srv.nome}
                                      </span>
                                      {srv.matricula && (
                                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                          Mat. {srv.matricula}
                                        </span>
                                      )}
                                      {srv.acaoAto && srv.acaoAto !== 'CITACAO' && (
                                        <span
                                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                            isExon
                                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                          }`}
                                        >
                                          {srv.acaoAto}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                      {[srv.cargoEfetivo, srv.funcaoGratificada, srv.departamento || srv.secretaria]
                                        .filter(Boolean)
                                        .join(' • ') || 'Sem cargo/lotação detalhada no teor'}
                                    </p>
                                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                      {existing
                                        ? `Já cadastrado (Mat. ${existing.matricula})`
                                        : 'Novo servidor — ainda não consta na base'}
                                    </p>
                                  </div>
                                  {isAdmin && onAbastecerServidorOCR && (
                                    <button
                                      type="button"
                                      disabled={!!appliedOcrKeys[sKey] || busyOcrKey === sKey}
                                      onClick={async () => {
                                        setBusyOcrKey(sKey);
                                        try {
                                          const ok = await onAbastecerServidorOCR(srv, selectedItem);
                                          if (ok) markOcrApplied(sKey);
                                        } finally {
                                          setBusyOcrKey(null);
                                        }
                                      }}
                                      className={`px-2 py-1 rounded-md text-[10px] font-bold shrink-0 inline-flex items-center gap-1 cursor-pointer transition-colors ${
                                        appliedOcrKeys[sKey]
                                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                          : isExon
                                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                          : 'bg-violet-600 hover:bg-violet-700 text-white'
                                      }`}
                                      title={
                                        existing
                                          ? 'Atualizar lotação/cargo/FG ou status deste servidor na base municipal'
                                          : 'Cadastrar este servidor na base municipal'
                                      }
                                    >
                                      {busyOcrKey === sKey ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : appliedOcrKeys[sKey] ? (
                                        <CheckCircle2 className="w-3 h-3" />
                                      ) : (
                                        <UserPlus className="w-3 h-3" />
                                      )}
                                      <span>
                                        {appliedOcrKeys[sKey]
                                          ? 'Aplicado'
                                          : isExon && existing
                                          ? 'Atualizar'
                                          : existing
                                          ? 'Atualizar'
                                          : 'Cadastrar'}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Departamentos & Cargos Novos */}
                      {(departamentos.length > 0 || cargos.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {departamentos.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-violet-800 dark:text-violet-300 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                <span>Setores / Departamentos Citados</span>
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {departamentos.map((dep, idx) => {
                                  const dKey = `${selectedItem.id}:dep:${idx}:${dep.departamento}`;
                                  const jaExiste = departamentosExistentes.some(
                                    d => d.toLowerCase() === dep.departamento.toLowerCase()
                                  );
                                  return (
                                    <div
                                      key={dKey}
                                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-[11px]"
                                    >
                                      <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {dep.departamento}
                                      </span>
                                      {jaExiste || appliedOcrKeys[dKey] ? (
                                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                          ✓ Na lista
                                        </span>
                                      ) : isAdmin && onAbastecerDepartamentoOCR ? (
                                        <button
                                          type="button"
                                          disabled={busyOcrKey === dKey}
                                          onClick={async () => {
                                            setBusyOcrKey(dKey);
                                            try {
                                              const ok = await onAbastecerDepartamentoOCR(dep, selectedItem);
                                              if (ok) markOcrApplied(dKey);
                                            } finally {
                                              setBusyOcrKey(null);
                                            }
                                          }}
                                          className="px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold cursor-pointer"
                                        >
                                          + Combo
                                        </button>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {cargos.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-violet-800 dark:text-violet-300 flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                <span>Cargos Citados Fora do Quadro</span>
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {cargos.map((cargo, idx) => {
                                  const cKey = `${selectedItem.id}:cargo:${idx}:${cargo}`;
                                  return (
                                    <div
                                      key={cKey}
                                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-[11px]"
                                    >
                                      <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {cargo}
                                      </span>
                                      {appliedOcrKeys[cKey] ? (
                                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                          ✓ Incluído
                                        </span>
                                      ) : isAdmin && onAbastecerCargoOCR ? (
                                        <button
                                          type="button"
                                          disabled={busyOcrKey === cKey}
                                          onClick={async () => {
                                            setBusyOcrKey(cKey);
                                            try {
                                              const ok = await onAbastecerCargoOCR(cargo, selectedItem);
                                              if (ok) markOcrApplied(cKey);
                                            } finally {
                                              setBusyOcrKey(null);
                                            }
                                          }}
                                          className="px-1.5 py-0.5 rounded bg-violet-600 hover:bg-violet-700 text-white text-[9px] font-bold cursor-pointer"
                                        >
                                          + Quadro
                                        </button>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* CLONADOR DE ESTILO VISUAL (PDF / DOCX / ODT -> PERFIL DO SETOR) */}
                {selectedItem.estiloVisual && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-white dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900 border border-amber-200 dark:border-amber-800/70 space-y-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: selectedItem.estiloVisual.corPrimaria || '#002b82' }}
                        >
                          <Palette className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5 flex-wrap">
                            <span>Estilo Visual Detectado no Arquivo (Clonador de Setor)</span>
                            <HelpTooltip
                              tone="amber"
                              title="Clonar Estilo de PDF / Word"
                              content="O sistema leu o padrão visual deste documento (fonte, tamanho, margens, cabeçalho, ementa, rodapé e tipo de assinatura). Salve como um Perfil de Estilo para aplicar em 1 clique no Gabinete, PGM, Controladoria, Finanças ou qualquer secretaria."
                            />
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                            {selectedItem.estiloVisual.resumoEstilo}
                          </p>
                        </div>
                      </div>

                      {onClonarEstiloVisual && (
                        <button
                          type="button"
                          onClick={() => {
                            const perfil = onClonarEstiloVisual(
                              selectedItem.estiloVisual!,
                              selectedItem,
                              selectedItem.estiloNomeCustom || selectedItem.estiloVisual!.nomeSugerido
                            );
                            if (perfil) {
                              updateSelectedItem({ estiloClonadoId: perfil.id });
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                            selectedItem.estiloClonadoId
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                          }`}
                        >
                          {selectedItem.estiloClonadoId ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Estilo Salvo no Sistema</span>
                            </>
                          ) : (
                            <>
                              <Palette className="w-3.5 h-3.5" />
                              <span>Salvar Estilo p/ o Setor</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">
                          Nome do Perfil Clonado
                        </label>
                        <input
                          type="text"
                          value={selectedItem.estiloNomeCustom ?? selectedItem.estiloVisual.nomeSugerido}
                          onChange={e => updateSelectedItem({ estiloNomeCustom: e.target.value, estiloClonadoId: undefined })}
                          placeholder="Ex: Estilo Oficial Gabinete"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">
                          Layout do Timbrado
                        </label>
                        <select
                          value={selectedItem.estiloVisual.cabecalhoLayout}
                          onChange={e =>
                            updateSelectedItem({
                              estiloClonadoId: undefined,
                              estiloVisual: {
                                ...selectedItem.estiloVisual!,
                                cabecalhoLayout: e.target.value as any,
                              },
                            })
                          }
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100"
                        >
                          <option value="LATERAL">Brasão à Esquerda (Lateral)</option>
                          <option value="CENTRALIZADO">Brasão Centralizado (Gabinete / PGM)</option>
                          <option value="SOLENE_DUPLO">Solene com Barra Dupla (CGM / Atos)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">
                          Assinatura Padrão
                        </label>
                        <select
                          value={selectedItem.estiloVisual.assinaturaPadrao}
                          onChange={e =>
                            updateSelectedItem({
                              estiloClonadoId: undefined,
                              estiloVisual: {
                                ...selectedItem.estiloVisual!,
                                assinaturaPadrao: e.target.value as any,
                              },
                            })
                          }
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100"
                        >
                          <option value="INDIVIDUAL">Individual (1 autoridade)</option>
                          <option value="DUPLA_REFERENDO">Dupla / Referendo (Prefeito + Secretário)</option>
                          <option value="COMISSAO_PAD">Comissão / Colegiada (3+)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300 pt-0.5">
                      <span>
                        <strong>Fonte:</strong> {selectedItem.estiloVisual.fonte} {selectedItem.estiloVisual.tamanhoFonte}
                      </span>
                      <span>
                        <strong>Margens (cm):</strong> Sup {selectedItem.estiloVisual.margens.superior} • Esq {selectedItem.estiloVisual.margens.esquerda} • Dir {selectedItem.estiloVisual.margens.direita} • Inf {selectedItem.estiloVisual.margens.inferior}
                      </span>
                      <span>
                        <strong>Recuo:</strong> {selectedItem.estiloVisual.recuoParagrafoCm} cm
                      </span>
                      {selectedItem.estiloVisual.rodapeTexto && (
                        <span className="truncate max-w-full">
                          <strong>Rodapé:</strong> {selectedItem.estiloVisual.rodapeTexto}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Alternador de Texto (Modelo com [CAMPOS] vs Texto Original) */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-sky-500" />
                      <span>
                        {isOriginalLocked
                          ? 'Teor Extraído em Modo Leitura (Assinatura Preservada)'
                          : 'Conteúdo Extraído e Revisável'}
                      </span>
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isSelectedSigned && selectedItem.modoTexto === 'original' && (
                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedItem({
                              desbloquearEdicaoOriginal: !selectedItem.desbloquearEdicaoOriginal,
                            })
                          }
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                            isOriginalLocked
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                          }`}
                          title="Protege o texto extraído contra edição acidental; desbloqueie apenas para rascunho derivado"
                        >
                          {isOriginalLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          <span>{isOriginalLocked ? 'Protegido (Desbloquear)' : 'Bloquear Leitura'}</span>
                        </button>
                      )}
                      <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => updateSelectedItem({ modoTexto: 'modelo' })}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            selectedItem.modoTexto === 'modelo'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                          }`}
                        >
                          Versão Modelo [CAMPOS]
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedItem({ modoTexto: 'original' })}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            selectedItem.modoTexto === 'original'
                              ? 'bg-sky-600 text-white shadow-2xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                          }`}
                        >
                          Texto Original Fiel
                        </button>
                      </div>
                    </div>
                  </div>
                  <textarea
                    rows={9}
                    readOnly={isOriginalLocked}
                    value={textoEditavelAtual}
                    onChange={e => {
                      if (isOriginalLocked) return;
                      updateSelectedItem(
                        selectedItem.modoTexto === 'modelo'
                          ? { textoModelo: e.target.value }
                          : { textoOriginal: e.target.value }
                      );
                    }}
                    className={`w-full px-3 py-2.5 border rounded-xl text-xs font-mono leading-relaxed focus:ring-2 focus:ring-sky-500 ${
                      isOriginalLocked
                        ? 'bg-amber-50/40 dark:bg-slate-800/40 border-amber-300 dark:border-amber-700/70 text-slate-700 dark:text-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                    }`}
                  />
                </div>

                {/* Barra de Ações Individuais do Documento Selecionado */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
                  {selectedItem.numeroOriginal.trim() ? (
                    <button
                      type="button"
                      disabled={isSavingItem || isBatchRunning}
                      onClick={() => handleSingleRegisterLivro(selectedItem, true)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      title={
                        isSelectedSigned
                          ? `Indexar no Livro com número original (${selectedItem.numeroOriginal}) e hash SHA-256 sem alterar o arquivo assinado`
                          : `Catalogar no Livro mantendo o número detectado (${selectedItem.numeroOriginal})`
                      }
                    >
                      {isSelectedSigned ? <ShieldCheck className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                      <span>
                        {isSelectedSigned
                          ? `Indexar no Livro com SHA-256 (${selectedItem.numeroOriginal})`
                          : `Registrar no Livro (${selectedItem.numeroOriginal})`}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSavingItem || isBatchRunning}
                      onClick={() => handleSingleRegisterLivro(selectedItem, false)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Reservar novo número sequencial e catalogar no Livro de Numeração"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                      <span>
                        {isSelectedSigned
                          ? 'Indexar no Livro com Hash SHA-256'
                          : 'Gerar Número e Registrar no Livro'}
                      </span>
                    </button>
                  )}

                  {canCatalogModelo && (
                    <button
                      type="button"
                      disabled={isSavingItem || isBatchRunning}
                      onClick={() => handleSingleCatalogModel(selectedItem)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      title={
                        isSelectedSigned
                          ? 'Gera minuta parametrizada com [CAMPOS] sem dados pessoais/assinaturas; o original assinado permanece intacto'
                          : 'Salvar no Banco de Modelos'
                      }
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>
                        {isSelectedSigned
                          ? 'Derivar Minuta [CAMPOS] em Modelos'
                          : 'Catalogar no Banco de Modelos'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isSavingItem || isBatchRunning}
                    onClick={() => {
                      onAbrirNoRedator(selectedItem);
                      onClose();
                    }}
                    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                      isSelectedSigned
                        ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                    title={
                      isSelectedSigned
                        ? 'Abre uma NOVA cópia editável derivada no Redator Oficial (não substitui nem invalida o arquivo original assinado)'
                        : 'Abrir o texto no Redator Oficial para edição e emissão'
                    }
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>
                      {isSelectedSigned ? 'Criar Cópia Derivada no Redator' : 'Abrir no Redator Oficial'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Ações em Lote */}
        <div className="px-4 sm:px-6 py-3 pb-safe border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {processingCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processando {processingCount} arquivo(s)...
              </span>
            ) : readyItems.length > 0 ? (
              <span>
                <strong>{readyItems.length}</strong> documento(s) pronto(s) para catalogação
                {signedCount > 0 ? (
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    {' '}
                    • {signedCount} assinado(s) digitalmente
                  </span>
                ) : null}
                .
              </span>
            ) : (
              <span>Aceita PDF, ODT, DOC, DOCX, RTF, CSV, TXT e fotos (JPG/PNG) com preservação de assinatura digital.</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {readyItems.length > 1 && canCatalogModelo && (
              <button
                type="button"
                disabled={isBatchRunning || processingCount > 0}
                onClick={handleBatchCatalogModels}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isBatchRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                <span>Catalogar Todos como Modelos ({readyItems.length})</span>
              </button>
            )}
            {readyItems.length > 1 && (
              <button
                type="button"
                disabled={isBatchRunning || processingCount > 0}
                onClick={handleBatchRegisterLivro}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isBatchRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListOrdered className="w-3.5 h-3.5" />}
                <span>Registrar Todos no Livro ({readyItems.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
