import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  FileSignature,
  FileText,
  FolderPlus,
  Layers,
  ListOrdered,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { parseUploadedDocumentFile } from '../utils/documentUpload';

export interface CatalogedImportItem {
  id: string;
  fileName: string;
  formatoOriginal: string;
  tamanhoBytes: number;
  status: 'processing' | 'ready' | 'cataloged_model' | 'cataloged_livro' | 'error';
  errorMessage?: string;
  avisoIA?: string;
  reconhecidoPorIA: boolean;
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
}

interface ImportarCatalogarModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoriasExistentes: string[];
  secretariasDisponiveis: string[];
  secretariaPadrao: string;
  canCatalogModelo: boolean;
  onCatalogarComoModelo: (item: CatalogedImportItem) => Promise<boolean>;
  onRegistrarNoLivro: (item: CatalogedImportItem, usarNumeroOriginal: boolean) => Promise<boolean>;
  onAbrirNoRedator: (item: CatalogedImportItem) => void;
  showToast: (msg: string, title?: string, isError?: boolean) => void;
}

const TIPOS_CATALOGACAO = [
  'MEMORANDO',
  'OFICIO',
  'DESPACHO',
  'CIRCULAR',
  'PORTARIA',
  'DECRETO',
  'ATO',
  'TERMO',
  'PARECER',
  'EMAIL',
  'CHECKLIST',
];

export const ImportarCatalogarModal: React.FC<ImportarCatalogarModalProps> = ({
  isOpen,
  onClose,
  categoriasExistentes,
  secretariasDisponiveis,
  secretariaPadrao,
  canCatalogModelo,
  onCatalogarComoModelo,
  onRegistrarNoLivro,
  onAbrirNoRedator,
  showToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<CatalogedImportItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);

  if (!isOpen) return null;

  const selectedItem = items.find(i => i.id === selectedId) || items[0] || null;
  const readyItems = items.filter(i => i.status === 'ready');
  const processingCount = items.filter(i => i.status === 'processing').length;

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
        formatoOriginal: ext,
        tamanhoBytes: file.size,
        status: 'processing',
        reconhecidoPorIA: false,
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

        setItems(prev =>
          prev.map(it =>
            it.id === placeholderId
              ? {
                  ...it,
                  status: 'ready',
                  formatoOriginal: parsed.formatoOriginal,
                  reconhecidoPorIA: !!parsed.reconhecidoPorIA,
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

  const textoEditavelAtual =
    selectedItem
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
      <div className="bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 rounded-none sm:rounded-2xl max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-[90vh] max-h-[100dvh] sm:max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                  Importar e Catalogar Documentos (PDF / DOCX)
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="w-3 h-3" />
                  Reconhecimento &amp; OCR Automático
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Envie 1 ou vários PDFs (digitais ou escaneados) e arquivos Word (.docx) para classificar e salvar no acervo ou no Livro.
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

        {/* Corpo Principal */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Coluna Esquerda: Upload + Fila de Arquivos */}
          <div className="w-full lg:w-[340px] xl:w-[370px] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/70 dark:bg-slate-950/40 flex-shrink-0 max-h-[38vh] lg:max-h-none">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.html,.htm,.md"
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
                  Arraste arquivos aqui ou clique para escolher
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  <strong>PDF</strong> (até 10 MB, inclusive escaneado) • <strong>DOCX / DOC / TXT</strong> (até 5 MB)
                </p>
                <p className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold mt-1">
                  Suporta envio individual ou vários arquivos em lote
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
                    Nenhum documento na fila ainda. Envie um PDF ou DOCX para o sistema ler, extrair o texto e sugerir a catalogação completa.
                  </p>
                </div>
              ) : (
                items.map(item => {
                  const isActive = selectedItem?.id === item.id;
                  const kb = Math.max(1, Math.round(item.tamanhoBytes / 1024));
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
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
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                                item.formatoOriginal === 'PDF'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                              }`}
                            >
                              {item.formatoOriginal}
                            </span>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={item.fileName}>
                              {item.fileName}
                            </p>
                          </div>

                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            {item.status === 'processing' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Lendo e reconhecendo...
                              </span>
                            )}
                            {item.status === 'ready' && (
                              <>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                  {item.tipoDocumento}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                                  {item.categoria}
                                </span>
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
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 bg-white dark:bg-slate-900">
            {!selectedItem ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800">
                  <FileCheck2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Como funciona o reconhecimento e catalogação
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Ao enviar um <strong>PDF</strong> (mesmo digitalizado/escaneado) ou <strong>DOCX</strong>, o sistema lê o conteúdo, identifica automaticamente o <strong>Tipo</strong>, <strong>Categoria</strong>, <strong>Assunto</strong>, <strong>Destinatário</strong>, <strong>Base Legal</strong> e <strong>Palavras-Chave</strong>, além de gerar uma versão parametrizada com <code>[CAMPOS]</code> pronta para virar modelo.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full text-left pt-2">
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60">
                    <FolderPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">1. Banco de Modelos</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Transforma documentos reais em minutas reutilizáveis para a equipe.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60">
                    <ListOrdered className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">2. Livro de Numeração</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Cataloga o ato diretamente no Livro com número detectado ou novo.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/60">
                    <FileSignature className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">3. Redator Oficial</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Abre o texto higienizado no Timbrado A4 oficial para edição e emissão.
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
                  Extraindo texto (incluindo OCR se for PDF escaneado), classificando tipo documental, categoria, base legal e campos reutilizáveis.
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
                {/* Banner de Status / Resumo */}
                {selectedItem.reconhecidoPorIA && selectedItem.resumoCatalogacao && (
                  <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-900 dark:text-indigo-200">
                      <span className="font-bold">Reconhecimento concluído: </span>
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
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Categoria Temática
                    </label>
                    <input
                      type="text"
                      list="datalist-categorias-catalogacao"
                      value={selectedItem.categoria}
                      onChange={e => updateSelectedItem({ categoria: e.target.value })}
                      placeholder="Ex: 1. Férias e Licenças"
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                    />
                    <datalist id="datalist-categorias-catalogacao">
                      {categoriasExistentes.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
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
                      value={selectedItem.destinatario}
                      onChange={e => updateSelectedItem({ destinatario: e.target.value })}
                      placeholder="Ex: Secretaria Municipal de Saúde"
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                    />
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

                {/* Alternador de Texto (Modelo com [CAMPOS] vs Texto Original) */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-sky-500" />
                      <span>Conteúdo Extraído e Revisável</span>
                    </label>
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
                  <textarea
                    rows={9}
                    value={textoEditavelAtual}
                    onChange={e =>
                      updateSelectedItem(
                        selectedItem.modoTexto === 'modelo'
                          ? { textoModelo: e.target.value }
                          : { textoOriginal: e.target.value }
                      )
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Barra de Ações Individuais do Documento Selecionado */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                  {canCatalogModelo && (
                    <button
                      type="button"
                      disabled={isSavingItem || isBatchRunning}
                      onClick={() => handleSingleCatalogModel(selectedItem)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Catalogar no Banco de Modelos</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isSavingItem || isBatchRunning}
                    onClick={() => {
                      onAbrirNoRedator(selectedItem);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>Abrir no Redator Oficial</span>
                  </button>

                  {selectedItem.numeroOriginal.trim() ? (
                    <button
                      type="button"
                      disabled={isSavingItem || isBatchRunning}
                      onClick={() => handleSingleRegisterLivro(selectedItem, true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      title={`Catalogar no Livro mantendo o número detectado (${selectedItem.numeroOriginal})`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Registrar no Livro ({selectedItem.numeroOriginal})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSavingItem || isBatchRunning}
                      onClick={() => handleSingleRegisterLivro(selectedItem, false)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Reservar novo número sequencial e catalogar no Livro de Numeração"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                      <span>Gerar Número e Registrar no Livro</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Ações em Lote */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {processingCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processando {processingCount} arquivo(s)...
              </span>
            ) : readyItems.length > 0 ? (
              <span>
                <strong>{readyItems.length}</strong> documento(s) pronto(s) para catalogação.
              </span>
            ) : (
              <span>Envie arquivos PDF ou DOCX para iniciar o reconhecimento automático.</span>
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
