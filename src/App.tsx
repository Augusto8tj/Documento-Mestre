/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  INITIAL_MODELOS,
  INITIAL_NUMERACOES,
  INITIAL_LOGS,
  INITIAL_SUGESTOES,
  INITIAL_USERS,
  SECRETARIAS_MUNICIPAIS_BASE,
  INITIAL_SECRETARIAS,
  ModeloDocumental,
  RegistroNumeracao,
  RegistroLog,
  UsuarioSistema,
  SecretariaItem,
  PedidoRecuperacaoSenha,
  INITIAL_PEDIDOS_RECUPERACAO,
  MembroComissao,
  MargensDocumento,
  getSecretariaSigla,
  isSameSecretaria,
  resolveCanonicalSecretariaName,
  isRecordFromSecretaria,
  isRecordFromDepartamento,
  isUserRestrictedToDepartamento,
  isUserAuthorizedForSecretaria,
  canUserViewLegacyAdminRecords,
  canUserAccessRecord,
  getNextSequentialForSecretaria,
  parseFiltroAcessibilidade,
  getEffectiveAccessibilityFilter,
  formatAccessibilityFilterLabel
} from './mockData';
import { AdminManagementModal } from './components/AdminManagementModal';
import { APPS_SCRIPT_CODE, PLANILHA_ESTRUTURA } from './codeSnippets';
import {
  Landmark,
  FileText,
  FilePen,
  ListOrdered,
  History,
  Copy,
  Check,
  Download,
  Code2,
  Table,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  RefreshCw,
  LogOut,
  Sun,
  Moon,
  Star,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  UserCheck,
  Send,
  Eye,
  AlertTriangle,
  FileCheck2,
  Server,
  Layers,
  Key,
  Printer,
  BookOpen,
  Building2,
  Cloud,
  CheckCircle2,
  Reply,
  Wand2,
  RotateCcw,
  Bot,
  Mail,
  AtSign,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  List,
  Indent,
  Outdent,
  Ruler,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Quote,
  Minus,
  Eraser,
  Undo2,
  Redo2,
  Type,
  Maximize2,
  Minimize2,
  ChevronLeft,
  LayoutGrid,
  SlidersHorizontal,
  GripHorizontal,
  HelpCircle,
  UserPlus,
  AlertCircle,
  XCircle,
  Users,
  Sliders,
  Trash2,
  Save,
  BookMarked,
  Scale,
  Upload,
  ArrowUp,
  ArrowDown,
  Monitor,
  Clock,
  Files,
  Home
} from 'lucide-react';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { BRASAO_RIO_CLARO } from './brasaoBase64';
import { FloatingTips } from './components/FloatingTips';
import { GuiaAjudaModal } from './components/GuiaAjudaModal';
import { RecuperarSenhaModal } from './components/RecuperarSenhaModal';
import {
  ThemeSettingsModal,
  ThemeMode,
  ThemePalette,
  FormStyle,
  THEME_PALETTES,
  DEFAULT_THEME_PREFS,
  loadThemePreferences,
  saveThemePreferences
} from './components/ThemeSettingsModal';
import { parseUploadedDocumentFile } from './utils/documentUpload';
import { ImportarCatalogarModal, CatalogedImportItem } from './components/ImportarCatalogarModal';
import { CentralInicioView, SavedRedatorDraftSummary } from './components/CentralInicioView';

function parseDataHoraSegura(val?: string | Date | null): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    return Number.isNaN(val.getTime()) ? null : val;
  }
  const raw = String(val).trim();
  if (!raw) return null;

  // 1. Padrão brasileiro primeiro (DD/MM/YYYY [HH:mm[:ss]]) — evita Invalid Date e inversão MM/DD do JS
  const brMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\s,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (brMatch) {
    const [, dd, mm, yyyy, hh = '00', min = '00', ss = '00'] = brMatch;
    const dia = Number(dd);
    const mes = Number(mm);
    const ano = Number(yyyy);
    if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
      const dt = new Date(ano, mes - 1, dia, Number(hh), Number(min), Number(ss));
      if (!Number.isNaN(dt.getTime())) return dt;
    }
  }

  // 2. Padrão ISO / SQL (YYYY-MM-DD[T ]HH:mm[:ss])
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  return null;
}

function formatDataHoraExibicao(val?: string | Date | null, incluirHora = true): string {
  const dt = parseDataHoraSegura(val);
  if (!dt) return String(val || '').trim() || '—';
  const data = dt.toLocaleDateString('pt-BR');
  if (!incluirHora) return data;
  const hora = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} ${hora}`;
}

export default function App() {
  // Navigation tabs between the Live Interactive System and the Architecture & Source Code Hub
  const [activeTab, setActiveTab] = useState<'app' | 'codigo-html' | 'codigo-gas' | 'planilha' | 'guia'>('app');
  const [showDevHub, setShowDevHub] = useState(false);
  const initialThemePrefs = useMemo(() => loadThemePreferences(), []);
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialThemePrefs.mode);
  const [themePalette, setThemePalette] = useState<ThemePalette>(initialThemePrefs.palette);
  const [formStyle, setFormStyle] = useState<FormStyle>(initialThemePrefs.formStyle);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && systemPrefersDark);
  const activePaletteMeta = useMemo(
    () => THEME_PALETTES.find((p) => p.id === themePalette) || THEME_PALETTES[0],
    [themePalette]
  );

  // Limpeza automática de dados mock legados de testes para entrada em Produção Beta
  try {
    const betaKey = 'bm_beta_prod_clean_v1';
    if (!localStorage.getItem(betaKey)) {
      const uStr = localStorage.getItem('bm_usuarios');
      if (uStr && (uStr.includes('Mariana Santos Silva') || uStr.includes('Carlos Eduardo Mendes') || uStr.includes('Ana Paula Ferreira'))) {
        localStorage.removeItem('bm_usuarios');
      }
      const nStr = localStorage.getItem('bm_numeracoes');
      if (nStr && (nStr.includes('001/2026 - SMA') || nStr.includes('Carlos Eduardo Mendes') || nStr.includes('Mariana Souza Silva'))) {
        localStorage.removeItem('bm_numeracoes');
      }
      const lStr = localStorage.getItem('bm_logs');
      if (lStr && lStr.includes('Carlos Eduardo Mendes')) {
        localStorage.removeItem('bm_logs');
      }
      const pStr = localStorage.getItem('bm_pedidos_recuperacao');
      if (pStr && pStr.includes('PED-1004')) {
        localStorage.removeItem('bm_pedidos_recuperacao');
      }
      const cStr = localStorage.getItem('bm_comissoes_salvas');
      if (cStr && (cStr.includes('Mariana Vasconcellos') || cStr.includes('Helena Martins'))) {
        localStorage.removeItem('bm_comissoes_salvas');
      }
      localStorage.setItem(betaKey, 'true');
    }
  } catch {}

  // System States (Simulation / Hybrid)
  const [useRealApi, setUseRealApi] = useState(true);
  const [realApiUrl, setRealApiUrl] = useState(() => {
    const newDefaultUrl = 'https://script.google.com/macros/s/AKfycbxKi-BFIcA2dzkMijlVxtVzr-Dpi4QYnOoEu6JwvRjyChJT5ybw7z50pubYGH3J4R0L7Q/exec';
    const saved = localStorage.getItem('bm_api_url');
    if (
      saved &&
      !saved.includes('AKfycbws_QQlzKhVKwzwDC7wuBrs_XxN-xsrSv5jynG1jrFQHLsz1tTANmBCteUdAUf3-PnQCw') &&
      !saved.includes('AKfycbwehV822FkXxgNa_rVRVN7QDkheWxzX6kXvyCZhVyBof3-d2jfNC8kzPvviLmTbd7cN') &&
      !saved.includes('AKfycbxnUGkilPqDhV2VGKvJApRBufUEEmpLBggw8htG-bCLcH8qRcnGJgnjbm26giy1w7Y9') &&
      !saved.includes('AKfycbx-LzKlN_O7NpNf52bVTO1740Srrrd3bO8a3Xpa1vxsu2_ZL6LcppT4EJmsOeYK_c238A') &&
      !saved.includes('AKfycbxOJHeSV8LAWpaIrsP657v7G0mNrqSdF-8rWwHZ73mUHlsmtvsnLBIUxPprmrvXogEG2g') &&
      !saved.includes('AKfycbxzOzIlowNAzC2V4q1wSXaPuQ_CprYiEhOVm1pl629hc964mZO7gea12p1jn7woMAyXIw') &&
      !saved.includes('AKfycbysxJ3UUAP57KcFiXfgEmCWqcXw90rghpF4txRH44mpfELv68c4_N1VRshcJ5MFm5fP0g') &&
      !saved.includes('AKfycbxUgx3NVytNLxTkykAs7_8qM9VkTuA-oGWWqS1ktMfitL7OenQTEvAuLPIFwpv9KvgKdw')
    ) {
      return saved;
    }
    try { localStorage.setItem('bm_api_url', newDefaultUrl); } catch {}
    return newDefaultUrl;
  });
  
  // Data states
  const [modelos, setModelos] = useState<ModeloDocumental[]>(() => {
    const saved = localStorage.getItem('bm_modelos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: any) => p.ID));
          const missing = INITIAL_MODELOS.filter(m => !existingIds.has(m.ID));
          if (missing.length > 0) {
            const combined = [...parsed, ...missing];
            try { localStorage.setItem('bm_modelos', JSON.stringify(combined)); } catch {}
            return combined;
          }
          return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_MODELOS;
  });
  
  const [numeracoes, setNumeracoes] = useState<RegistroNumeracao[]>(() => {
    try {
      const saved = localStorage.getItem('bm_numeracoes');
      return saved ? JSON.parse(saved) : INITIAL_NUMERACOES;
    } catch {
      return INITIAL_NUMERACOES;
    }
  });

  const [logs, setLogs] = useState<RegistroLog[]>(() => {
    try {
      const saved = localStorage.getItem('bm_logs');
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  const [sugestoes, setSugestoes] = useState<{ destinatarios: string[]; assuntos: string[] }>(() => {
    try {
      const saved = localStorage.getItem('bm_sugestoes');
      return saved ? JSON.parse(saved) : INITIAL_SUGESTOES;
    } catch {
      return INITIAL_SUGESTOES;
    }
  });

  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>(() => {
    try {
      const saved = localStorage.getItem('bm_usuarios');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });
  const [currentUser, setCurrentUser] = useState<UsuarioSistema | null>(() => {
    try {
      const saved = localStorage.getItem('sgep_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('favs');
      return saved ? JSON.parse(saved) : ['MOD-001', 'MOD-002'];
    } catch {
      return ['MOD-001', 'MOD-002'];
    }
  });

  // UI Filtering & Tela Inicial Pós-Login (Central de Início vs Banco de Modelos)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('TODOS');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeAppView, setActiveAppView] = useState<'inicio' | 'modelos'>(() => {
    try {
      const savedSession = localStorage.getItem('sgep_user_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const mat = parsed?.matricula || 'anon';
        if (localStorage.getItem(`bm_skip_home_hub_${mat}`) === '1') {
          return 'modelos';
        }
      }
    } catch {}
    return 'inicio';
  });
  const [skipHomeHub, setSkipHomeHub] = useState<boolean>(() => {
    try {
      const savedSession = localStorage.getItem('sgep_user_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const mat = parsed?.matricula || 'anon';
        return localStorage.getItem(`bm_skip_home_hub_${mat}`) === '1';
      }
    } catch {}
    return false;
  });
  const [draftRefreshTick, setDraftRefreshTick] = useState(0);

  // Modals
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [activeModelo, setActiveModelo] = useState<ModeloDocumental | null>(null);
  const [formVariables, setFormVariables] = useState<Record<string, string>>({});
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);

  // CRUD Modal
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<Partial<ModeloDocumental>>({});

  // Sheets Inspector Floating Modal State & Controls
  const [isSheetsDrawerOpen, setIsSheetsDrawerOpen] = useState(false);
  const [activeSheetTab, setActiveSheetTab] = useState<'numeracao' | 'logs' | 'modelos' | 'usuarios'>('numeracao');
  const [isSheetsMaximized, setIsSheetsMaximized] = useState(false);
  const [sheetViewMode, setSheetViewMode] = useState<'cards' | 'table'>('table');
  const [sheetScrollProgress, setSheetScrollProgress] = useState(0);
  const sheetsTableContainerRef = useRef<HTMLDivElement>(null);

  const handleSheetHorizontalScroll = (percentage: number) => {
    if (sheetsTableContainerRef.current) {
      const el = sheetsTableContainerRef.current;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll > 0) {
        el.scrollTo({ left: (percentage / 100) * maxScroll, behavior: 'smooth' });
      }
      setSheetScrollProgress(percentage);
    }
  };

  const handleSheetScrollUpdate = () => {
    if (sheetsTableContainerRef.current) {
      const el = sheetsTableContainerRef.current;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll > 0) {
        setSheetScrollProgress(Math.round((el.scrollLeft / maxScroll) * 100));
      } else {
        setSheetScrollProgress(0);
      }
    }
  };

  // Painel de Gestão do Administrador (Servidores, Senhas, Secretarias e Departamentos)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [secretarias, setSecretarias] = useState<SecretariaItem[]>(() => {
    try {
      const saved = localStorage.getItem('bm_secretarias');
      return saved ? JSON.parse(saved) : INITIAL_SECRETARIAS;
    } catch {
      return INITIAL_SECRETARIAS;
    }
  });

  // Preferência do usuário para incluir a sigla da secretaria no número (ex: 001/2026 - SMA)
  const [incluirSiglaNoNumero, setIncluirSiglaNoNumero] = useState<boolean>(() => {
    return localStorage.getItem('bm_incluir_sigla') !== 'false';
  });

  // Secretaria Ativa de Atuação do Servidor (Suporte a Acúmulo de Pastas & Confidencialidade)
  const [activeSecretaria, setActiveSecretaria] = useState<string>(() => {
    const saved = localStorage.getItem('bm_active_secretaria');
    const userSession = localStorage.getItem('sgep_user_session');
    if (userSession) {
      try {
        const u: UsuarioSistema = JSON.parse(userSession);
        if (saved && (u.nivel === 'ADMIN' ? (saved === 'TODAS' || isUserAuthorizedForSecretaria(u, saved)) : (saved !== 'TODAS' && isUserAuthorizedForSecretaria(u, saved)))) {
          return saved === 'TODAS' ? 'TODAS' : resolveCanonicalSecretariaName(saved);
        }
        const primary = u.secretaria || (u.secretarias && u.secretarias[0]);
        if (primary) return resolveCanonicalSecretariaName(primary);
      } catch (e) {}
    }
    return 'Secretaria Municipal de Administração (SMA)';
  });

  // Alteração de Perfil (Nome) e Senha Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Guia de Uso & Ajuda e Recuperação de Senha
  const [isGuiaAjudaOpen, setIsGuiaAjudaOpen] = useState(false);
  const [isRecuperarSenhaOpen, setIsRecuperarSenhaOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const redatorFileInputRef = useRef<HTMLInputElement>(null);
  const crudFileInputRef = useRef<HTMLInputElement>(null);
  const [isImportCatalogModalOpen, setIsImportCatalogModalOpen] = useState(false);
  const [isUploadingSingleFile, setIsUploadingSingleFile] = useState(false);

  const handleUploadDocumentoParaRedator = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploadingSingleFile(true);
    try {
      const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
      if (isPdf) {
        showToast(`Lendo e reconhecendo "${file.name}"...`, 'Importando PDF');
      }
      const parsed = await parseUploadedDocumentFile(file, {
        categoriasExistentes: Array.from(new Set(modelos.map(m => m.Categoria).filter(Boolean))),
        secretariasExistentes: secretarias.map(s => `${s.nome} (${s.sigla})`),
        usarIA: true,
      });
      if (redatorTexto.trim()) {
        setTextoAnteriorRedator(redatorTexto);
      }
      setRedatorTexto(parsed.texto);
      if (parsed.tipoSugerido && ['MEMORANDO', 'OFICIO', 'DESPACHO', 'CIRCULAR', 'PORTARIA', 'DECRETO', 'ATO', 'TERMO', 'EMAIL'].includes(parsed.tipoSugerido)) {
        setRedatorTipo(parsed.tipoSugerido as any);
      }
      if (parsed.assunto && !redatorAssunto.trim()) {
        setRedatorAssunto(parsed.assunto);
      } else if (!redatorAssunto.trim() && parsed.titulo) {
        setRedatorAssunto(parsed.titulo);
      }
      if (parsed.destinatario && !redatorDestinatario.trim()) {
        setRedatorDestinatario(parsed.destinatario);
      }
      if (parsed.referencia && !redatorReferenciaDoc.trim()) {
        setRedatorReferenciaDoc(parsed.referencia);
      }
      const sizeKb = Math.max(1, Math.round(parsed.tamanhoBytes / 1024));
      showToast(
        `Arquivo "${file.name}" (${parsed.formatoOriginal}, ${sizeKb} KB) ${parsed.reconhecidoPorIA ? 'reconhecido e ' : ''}importado para o Redator!`
      );
    } catch (err: any) {
      showToast(err?.message || 'Não foi possível importar o documento.', 'Erro no Upload', true);
    } finally {
      setIsUploadingSingleFile(false);
    }
  };

  const handleUploadDocumentoParaModelo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploadingSingleFile(true);
    try {
      const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
      if (isPdf) {
        showToast(`Lendo e catalogando "${file.name}"...`, 'Importando PDF');
      }
      const parsed = await parseUploadedDocumentFile(file, {
        categoriasExistentes: Array.from(new Set(modelos.map(m => m.Categoria).filter(Boolean))),
        secretariasExistentes: secretarias.map(s => `${s.nome} (${s.sigla})`),
        usarIA: true,
      });
      setEditingModelo(prev => ({
        ...prev,
        TipoDocumento: prev.TipoDocumento || parsed.tipoSugerido || 'MEMORANDO',
        Categoria: prev.Categoria?.trim() ? prev.Categoria : (parsed.categoria || '1. Geral'),
        Titulo: prev.Titulo?.trim() ? prev.Titulo : (parsed.titulo || parsed.assunto || ''),
        Texto: parsed.textoModelo || parsed.texto,
        PalavrasChave: prev.PalavrasChave?.trim() ? prev.PalavrasChave : (parsed.palavrasChave || ''),
        BaseLegal: prev.BaseLegal?.trim() ? prev.BaseLegal : (parsed.baseLegal || ''),
      }));
      const sizeKb = Math.max(1, Math.round(parsed.tamanhoBytes / 1024));
      showToast(
        `Documento "${file.name}" (${parsed.formatoOriginal}, ${sizeKb} KB) ${parsed.reconhecidoPorIA ? 'reconhecido e catalogado' : 'carregado'} no formulário!`
      );
    } catch (err: any) {
      showToast(err?.message || 'Não foi possível importar o arquivo como modelo.', 'Erro no Upload', true);
    } finally {
      setIsUploadingSingleFile(false);
    }
  };

  const handleCatalogarModeloImportado = async (item: CatalogedImportItem): Promise<boolean> => {
    const textoFinal = (item.modoTexto === 'modelo' ? item.textoModelo : item.textoOriginal).trim();
    if (!item.titulo.trim() || !textoFinal) {
      showToast('Informe um título e conteúdo antes de catalogar como modelo.', 'Campos Obrigatórios', true);
      return false;
    }
    const newId = `MOD-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newDoc: ModeloDocumental = {
      ID: newId,
      TipoDocumento: (item.tipoDocumento || 'MEMORANDO').toUpperCase(),
      Categoria: item.categoria.trim() || '1. Geral',
      Titulo: item.titulo.trim(),
      Assunto: item.assunto.trim() || item.titulo.trim(),
      Texto: textoFinal,
      PalavrasChave: item.palavrasChave.trim(),
      BaseLegal: item.baseLegal.trim(),
      SetorOrigem: item.secretariaOrigem || activeSecretaria,
      SetorDestino: item.destinatario.trim(),
      Ativo: true,
      UsoFrequente: 0,
      Versao: '1.0',
    };

    setModelos(prev => [newDoc, ...prev]);
    setLogs(prev => [{
      dataHora: new Date().toISOString(),
      usuario: currentUser?.nome || 'Servidor',
      acao: 'CATALOGAR_MODELO_IMPORTADO',
      docId: newId,
      detalhes: `Catalogou ${item.formatoOriginal} "${item.fileName}" como ${newDoc.TipoDocumento}: ${newDoc.Titulo} (${newDoc.Categoria})`,
    }, ...prev]);

    if (useRealApi) {
      try {
        const res = await fetchWithTimeout(realApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'SALVAR_MODELO',
            documento: newDoc,
            token: currentUser?.token || '',
            usuarioLogado: currentUser?.nome || 'Admin',
          }),
        }, 8500);
        const json = await res.json();
        if (json?.success) {
          showToast(`Modelo ${newId} catalogado e sincronizado na planilha oficial!`);
          return true;
        }
      } catch (err) {
        console.warn('Sincronização GAS do modelo importado em segundo plano:', err);
      }
    }

    showToast(`Modelo ${newId} ("${newDoc.Titulo}") catalogado no Banco Mestre!`);
    return true;
  };

  const handleRegistrarLivroImportado = async (
    item: CatalogedImportItem,
    usarNumeroOriginal: boolean
  ): Promise<boolean> => {
    const tipoDoc = (item.tipoDocumento || 'MEMORANDO').toUpperCase();
    const secAlvo = item.secretariaOrigem && item.secretariaOrigem !== 'TODAS'
      ? item.secretariaOrigem
      : (activeSecretaria !== 'TODAS' ? activeSecretaria : (currentUser?.secretaria || 'Secretaria Municipal de Administração (SMA)'));
    const siglaAlvo = getSecretariaSigla(secAlvo, secretarias);
    const deptoAlvo = currentUser?.departamento || (siglaAlvo === 'SMA' ? 'Departamento de Recursos Humanos (DRH)' : 'Gabinete');
    const servidorIdentificado = currentUser?.nome
      ? `${currentUser.nome}${currentUser.matricula ? ` (Mat. ${currentUser.matricula})` : ''}`
      : 'Servidor Municipal';
    const assuntoFinal = (item.assunto || item.titulo || item.fileName).trim();
    const destinatarioFinal = (item.destinatario || 'Não informado').trim();
    const anoAtual = String(new Date().getFullYear());

    if (!usarNumeroOriginal && useRealApi) {
      try {
        const response = await fetchWithTimeout(realApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'GERAR_NUMERO',
            tipoDocumento: tipoDoc,
            assunto: assuntoFinal,
            destinatario: destinatarioFinal,
            secretaria: secAlvo,
            departamento: deptoAlvo,
            servidor: servidorIdentificado,
            sigla: siglaAlvo,
            incluirSigla: incluirSiglaNoNumero,
            usuarioLogado: servidorIdentificado,
            token: currentUser?.token || '',
          }),
        }, 8000);
        const json = JSON.parse(await response.text());
        if (json?.success && json?.numeroGerado) {
          const novoReg: RegistroNumeracao = {
            dataHora: json.dataHora || new Date().toISOString(),
            tipoDocumento: tipoDoc,
            numero: json.numeroGerado,
            assunto: assuntoFinal,
            usuario: servidorIdentificado,
            servidor: servidorIdentificado,
            destinatario: destinatarioFinal,
            secretaria: json.secretaria || secAlvo,
            departamento: json.departamento || deptoAlvo,
            incluirSigla: incluirSiglaNoNumero,
          };
          setNumeracoes(prev => [novoReg, ...prev]);
          showToast(`Documento catalogado no Livro com número oficial ${json.numeroGerado}!`);
          return true;
        }
      } catch (err) {
        console.warn('Fallback local para registro no Livro:', err);
      }
    }

    const numeroFinal = usarNumeroOriginal && item.numeroOriginal.trim()
      ? item.numeroOriginal.trim()
      : (() => {
          const proximoSeq = getNextSequentialForSecretaria(numeracoes, tipoDoc, secAlvo, anoAtual, secretarias);
          const seqStr = String(proximoSeq).padStart(3, '0');
          return incluirSiglaNoNumero ? `${seqStr}/${anoAtual} - ${siglaAlvo}` : `${seqStr}/${anoAtual}`;
        })();

    const nowIso = item.dataDocumento.trim() || new Date().toISOString();
    const novoReg: RegistroNumeracao = {
      dataHora: nowIso,
      tipoDocumento: tipoDoc,
      numero: numeroFinal,
      assunto: assuntoFinal,
      usuario: servidorIdentificado,
      servidor: servidorIdentificado,
      destinatario: destinatarioFinal,
      secretaria: secAlvo,
      departamento: deptoAlvo,
      incluirSigla: incluirSiglaNoNumero,
    };

    setNumeracoes(prev => [novoReg, ...prev]);
    setLogs(prev => [{
      dataHora: new Date().toISOString(),
      usuario: servidorIdentificado,
      acao: 'CATALOGAR_LIVRO_IMPORTADO',
      docId: numeroFinal,
      detalhes: `Registrou ${item.formatoOriginal} "${item.fileName}" no Livro como ${tipoDoc} ${numeroFinal} | Assunto: ${assuntoFinal}`,
    }, ...prev]);

    showToast(`Documento registrado no Livro de Numeração (${numeroFinal})!`);
    return true;
  };

  const handleAbrirImportadoNoRedator = (item: CatalogedImportItem) => {
    const tipoSuportado = ['MEMORANDO', 'OFICIO', 'DESPACHO', 'CIRCULAR', 'PORTARIA', 'DECRETO', 'ATO', 'TERMO', 'EMAIL'].includes(item.tipoDocumento)
      ? item.tipoDocumento
      : 'MEMORANDO';
    redatorDraftSkipNextPromptRef.current = true;
    setPendingRedatorDraft(null);
    setRedatorTipo(tipoSuportado as any);
    setRedatorNumero('');
    setRedatorAssunto(item.assunto || item.titulo || '');
    setRedatorDestinatario(item.destinatario || '');
    setRedatorReferenciaDoc(item.referencia || '');
    if (item.secretariaOrigem && item.secretariaOrigem !== 'TODAS') {
      setRedatorSecretaria(item.secretariaOrigem);
    }
    setRedatorTexto(item.modoTexto === 'modelo' ? item.textoModelo : item.textoOriginal);
    setIsRedatorModalOpen(true);
    showToast(`"${item.fileName}" carregado no Redator Oficial! Pronto para revisar e gerar numeração.`);
  };

  // Fila de Pedidos de Recuperação de Senha para Gestão Administrativa
  const [pedidosRecuperacao, setPedidosRecuperacao] = useState<PedidoRecuperacaoSenha[]>(() => {
    try {
      const saved = localStorage.getItem('bm_pedidos_recuperacao');
      return saved ? JSON.parse(saved) : INITIAL_PEDIDOS_RECUPERACAO;
    } catch {
      return INITIAL_PEDIDOS_RECUPERACAO;
    }
  });

  // Redefinição de Senha via Autosserviço / Recuperação
  const handleAtualizarSenhaUsuario = (matricula: string, novaSenha: string, motivo: string) => {
    setUsuarios(prev => {
      const updated = prev.map(u => String(u.matricula) === String(matricula) ? { ...u, senha: novaSenha } : u);
      try { localStorage.setItem('bm_usuarios', JSON.stringify(updated)); } catch {}
      return updated;
    });
    const newLog: RegistroLog = {
      dataHora: new Date().toISOString(),
      usuario: `Matrícula ${matricula}`,
      acao: 'REDEFINICAO_SENHA',
      docId: matricula,
      detalhes: motivo
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Redator de Memorando / Ofício / E-mail / Portaria / Decreto / Atos / TAC Modal State
  const [isRedatorModalOpen, setIsRedatorModalOpen] = useState(false);
  const [isRedatorFullscreen, setIsRedatorFullscreen] = useState(false);
  const [redatorModalSize, setRedatorModalSize] = useState<{ width: number; height: number } | null>(() => {
    try {
      const saved = localStorage.getItem('bm_redator_modal_size');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.width === 'number' && typeof parsed?.height === 'number') {
          return { width: parsed.width, height: parsed.height };
        }
      }
    } catch {
      // ignora armazenamento inválido
    }
    return null;
  });
  const [redatorModalPos, setRedatorModalPos] = useState<{ x: number; y: number } | null>(null);
  const [isResizingRedatorModal, setIsResizingRedatorModal] = useState(false);
  const [isDraggingRedatorModal, setIsDraggingRedatorModal] = useState(false);
  const redatorModalRef = useRef<HTMLDivElement | null>(null);
  const redatorDragStateRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);
  const redatorResizeStateRef = useRef<{
    pointerId: number;
    dir: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const REDATOR_MIN_WIDTH = 360;
  const REDATOR_MIN_HEIGHT = 320;

  useEffect(() => {
    try {
      if (redatorModalSize) {
        localStorage.setItem('bm_redator_modal_size', JSON.stringify(redatorModalSize));
      } else {
        localStorage.removeItem('bm_redator_modal_size');
      }
    } catch {
      // ignora restrições de armazenamento
    }
  }, [redatorModalSize]);

  useEffect(() => {
    if (!isRedatorModalOpen || isRedatorFullscreen || isResizingRedatorModal || isDraggingRedatorModal) return;
    const ensureRedatorInViewport = () => {
      const margin = 8;
      const minW = Math.min(REDATOR_MIN_WIDTH, Math.max(280, window.innerWidth - margin * 2));
      const minH = Math.min(REDATOR_MIN_HEIGHT, Math.max(260, window.innerHeight - margin * 2));
      const maxW = Math.max(minW, window.innerWidth - margin * 2);
      const maxH = Math.max(minH, window.innerHeight - margin * 2);

      setRedatorModalSize(prev => {
        if (!prev) return prev;
        const cw = Math.round(Math.min(Math.max(minW, prev.width), maxW));
        const ch = Math.round(Math.min(Math.max(minH, prev.height), maxH));
        if (cw === prev.width && ch === prev.height) return prev;
        return { width: cw, height: ch };
      });

      const el = redatorModalRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setRedatorModalPos(prev => {
          if (!prev) return prev;
          const maxX = Math.max(margin, window.innerWidth - Math.min(rect.width, maxW) - margin);
          const maxY = Math.max(margin, window.innerHeight - Math.min(rect.height, maxH) - margin);
          const cx = Math.round(Math.min(Math.max(margin, prev.x), maxX));
          const cy = Math.round(Math.min(Math.max(margin, prev.y), maxY));
          if (cx === prev.x && cy === prev.y) return prev;
          return { x: cx, y: cy };
        });
      }
    };
    const rafId = window.requestAnimationFrame(ensureRedatorInViewport);
    window.addEventListener('resize', ensureRedatorInViewport);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', ensureRedatorInViewport);
    };
  }, [isRedatorModalOpen, isRedatorFullscreen, isResizingRedatorModal, isDraggingRedatorModal]);

  const handleRedatorHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isRedatorFullscreen) return;
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = redatorModalRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    redatorDragStateRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
    setRedatorModalPos({ x: Math.round(rect.left), y: Math.round(rect.top) });
    if (!redatorModalSize) {
      setRedatorModalSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    }
    setIsDraggingRedatorModal(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // fallback seguro
    }
  };

  const handleRedatorHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = redatorDragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const margin = 8;
    const maxX = Math.max(margin, window.innerWidth - drag.width - margin);
    const maxY = Math.max(margin, window.innerHeight - drag.height - margin);
    setRedatorModalPos({
      x: Math.round(Math.min(Math.max(margin, e.clientX - drag.offsetX), maxX)),
      y: Math.round(Math.min(Math.max(margin, e.clientY - drag.offsetY), maxY)),
    });
  };

  const handleRedatorHeaderPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = redatorDragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    redatorDragStateRef.current = null;
    setIsDraggingRedatorModal(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // fallback seguro
    }
  };

  const handleRedatorResizePointerDown = (
    dir: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  ) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isRedatorFullscreen) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = redatorModalRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    redatorResizeStateRef.current = {
      pointerId: e.pointerId,
      dir,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      startWidth: rect.width,
      startHeight: rect.height,
    };
    setRedatorModalPos({ x: Math.round(rect.left), y: Math.round(rect.top) });
    setRedatorModalSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    setIsResizingRedatorModal(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // fallback seguro
    }
  };

  const handleRedatorResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const resize = redatorResizeStateRef.current;
    if (!resize || resize.pointerId !== e.pointerId) return;
    e.stopPropagation();

    const margin = 8;
    const minW = Math.min(REDATOR_MIN_WIDTH, Math.max(280, window.innerWidth - margin * 2));
    const minH = Math.min(REDATOR_MIN_HEIGHT, Math.max(260, window.innerHeight - margin * 2));
    const dx = e.clientX - resize.startX;
    const dy = e.clientY - resize.startY;

    let nextLeft = resize.startLeft;
    let nextTop = resize.startTop;
    let nextWidth = resize.startWidth;
    let nextHeight = resize.startHeight;

    if (resize.dir.includes('e')) {
      const maxW = Math.max(minW, window.innerWidth - resize.startLeft - margin);
      nextWidth = Math.min(Math.max(minW, resize.startWidth + dx), maxW);
    } else if (resize.dir.includes('w')) {
      const rightEdge = resize.startLeft + resize.startWidth;
      const maxW = Math.max(minW, rightEdge - margin);
      nextWidth = Math.min(Math.max(minW, resize.startWidth - dx), maxW);
      nextLeft = rightEdge - nextWidth;
    }

    if (resize.dir.includes('s')) {
      const maxH = Math.max(minH, window.innerHeight - resize.startTop - margin);
      nextHeight = Math.min(Math.max(minH, resize.startHeight + dy), maxH);
    } else if (resize.dir.includes('n')) {
      const bottomEdge = resize.startTop + resize.startHeight;
      const maxH = Math.max(minH, bottomEdge - margin);
      nextHeight = Math.min(Math.max(minH, resize.startHeight - dy), maxH);
      nextTop = bottomEdge - nextHeight;
    }

    setRedatorModalPos({ x: Math.round(nextLeft), y: Math.round(nextTop) });
    setRedatorModalSize({ width: Math.round(nextWidth), height: Math.round(nextHeight) });
  };

  const handleRedatorResizePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const resize = redatorResizeStateRef.current;
    if (!resize || resize.pointerId !== e.pointerId) return;
    e.stopPropagation();
    redatorResizeStateRef.current = null;
    setIsResizingRedatorModal(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // fallback seguro
    }
  };

  const handleRedatorHeaderDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (isRedatorFullscreen) {
      setIsRedatorFullscreen(false);
      return;
    }
    if (redatorModalSize || redatorModalPos) {
      setRedatorModalSize(null);
      setRedatorModalPos(null);
    } else {
      setIsRedatorFullscreen(true);
    }
  };
  const [redatorTipo, setRedatorTipo] = useState<'MEMORANDO' | 'OFICIO' | 'DESPACHO' | 'CIRCULAR' | 'PORTARIA' | 'DECRETO' | 'EMAIL' | 'ATO' | 'TERMO'>('MEMORANDO');
  const [redatorNumero, setRedatorNumero] = useState('');
  const [redatorEmailCc, setRedatorEmailCc] = useState('');
  const [isLoadingFromGas, setIsLoadingFromGas] = useState(false);
  const [redatorData, setRedatorData] = useState(() => {
    const hoje = new Date();
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return `Rio Claro-RJ, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
  });
  const [redatorSetorOrigem, setRedatorSetorOrigem] = useState(() => currentUser?.departamento?.trim() || 'Departamento de Recursos Humanos (DRH)');
  const [redatorDestinatario, setRedatorDestinatario] = useState('Secretaria Municipal de Saúde');
  const [redatorTratamento, setRedatorTratamento] = useState('À / Ao');
  const [redatorAssunto, setRedatorAssunto] = useState('Quantitativo de Servidores e Informações de Folha');
  const [redatorReferenciaDoc, setRedatorReferenciaDoc] = useState('');
  const [redatorTexto, setRedatorTexto] = useState(
    'Cumprimentando-o cordialmente, sirvo-me do presente para encaminhar a Vossa Senhoria as informações e levantamentos administrativos pertinentes a este departamento, em atendimento às diretrizes institucionais vigentes.\n\nInformo que as medidas foram devidamente instruídas no âmbito desta unidade administrativa, visando a assegurar a máxima celeridade e transparência aos atos da gestão de pessoal desta municipalidade.'
  );
  const [redatorFecho, setRedatorFecho] = useState('Permanecemos à disposição para eventuais esclarecimentos adicionais.');
  const [redatorSignatario, setRedatorSignatario] = useState(() => currentUser?.nome || 'Servidor Municipal');
  const [redatorCargo, setRedatorCargo] = useState(() => currentUser?.cargo || 'Servidor Público Municipal');
  const [redatorSecretaria, setRedatorSecretaria] = useState(() =>
    currentUser?.secretaria ? resolveCanonicalSecretariaName(currentUser.secretaria) : 'Secretaria Municipal de Administração (SMA)'
  );
  const [redatorMatricula, setRedatorMatricula] = useState(() => currentUser?.matricula || '');
  const [isRedatorGeneratingNumber, setIsRedatorGeneratingNumber] = useState(false);
  const [isRedatorLetterheadOpen, setIsRedatorLetterheadOpen] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  // Modo Simples vs. Avançado no Redator Oficial (padrão Simples para rotina rápida)
  const [redatorModoAvancado, setRedatorModoAvancado] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bm_redator_modo_avancado') === 'true';
    } catch {
      return false;
    }
  });
  const toggleRedatorModoAvancado = (nextValue?: boolean) => {
    setRedatorModoAvancado(prev => {
      const next = typeof nextValue === 'boolean' ? nextValue : !prev;
      try {
        localStorage.setItem('bm_redator_modo_avancado', next ? 'true' : 'false');
      } catch {}
      return next;
    });
  };

  // Rascunho Automático (Auto-save) no Redator Oficial por matrícula
  type RedatorDraftPayload = {
    tipo: 'MEMORANDO' | 'OFICIO' | 'DESPACHO' | 'CIRCULAR' | 'PORTARIA' | 'DECRETO' | 'EMAIL' | 'ATO' | 'TERMO';
    assunto: string;
    destinatario: string;
    tratamento: string;
    referenciaDoc: string;
    texto: string;
    fecho: string;
    emailCc: string;
    setorOrigem: string;
    secretaria: string;
    savedAt: string;
  };
  const [redatorDraftSavedAt, setRedatorDraftSavedAt] = useState<string>('');
  const [pendingRedatorDraft, setPendingRedatorDraft] = useState<RedatorDraftPayload | null>(null);
  const redatorDraftSkipNextPromptRef = useRef<boolean>(false);
  
  // Estado do Assistente de Redação com IA (Gemini)
  const [isAiHelperOpen, setIsAiHelperOpen] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isGeneratingAiText, setIsGeneratingAiText] = useState(false);
  const [textoAnteriorRedator, setTextoAnteriorRedator] = useState<string | null>(null);

  // Estados e Referências da Barra de Ferramentas de Edição Oficial e Régua de Parágrafo
  const [redatorFonte, setRedatorFonte] = useState<'Times New Roman' | 'Arial' | 'Calibri'>('Times New Roman');
  const [redatorTamanhoFonte, setRedatorTamanhoFonte] = useState<'12pt' | '11pt' | '10pt'>('12pt');
  const [redatorAlinhamento, setRedatorAlinhamento] = useState<'justify' | 'left' | 'center'>('justify');
  const [redatorRecuoParagrafo, setRedatorRecuoParagrafo] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bm_redator_recuo');
      return saved !== null ? parseFloat(saved) : 1.5; // Padrão Oficial PMRC: 1.50 cm
    } catch {
      return 1.5;
    }
  });
  const [isReguaVisivel, setIsReguaVisivel] = useState<boolean>(true);
  const [isArrastandoRegua, setIsArrastandoRegua] = useState<boolean>(false);
  const reguaBarraRef = useRef<HTMLDivElement>(null);
  const redatorTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [redatorHistoricoUndo, setRedatorHistoricoUndo] = useState<string[]>([]);
  const [redatorHistoricoRedo, setRedatorHistoricoRedo] = useState<string[]>([]);

  // Estados de Margens Oficiais da Página A4 (em cm)
  const [redatorMargemEsquerda, setRedatorMargemEsquerda] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bm_redator_margem_esq');
      return saved !== null ? parseFloat(saved) : 3.0; // Padrão Oficial PMRC (3,0 cm para encadernação/arquivo)
    } catch { return 3.0; }
  });
  const [redatorMargemDireita, setRedatorMargemDireita] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bm_redator_margem_dir');
      return saved !== null ? parseFloat(saved) : 2.0; // Padrão Oficial: 2,0 cm
    } catch { return 2.0; }
  });
  const [redatorMargemSuperior, setRedatorMargemSuperior] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bm_redator_margem_sup');
      return saved !== null ? parseFloat(saved) : 2.5; // Padrão Oficial: 2,5 cm
    } catch { return 2.5; }
  });
  const [redatorMargemInferior, setRedatorMargemInferior] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bm_redator_margem_inf');
      return saved !== null ? parseFloat(saved) : 2.0; // Padrão Oficial: 2,0 cm
    } catch { return 2.0; }
  });
  const [isPainelMargensAberto, setIsPainelMargensAberto] = useState<boolean>(false);

  // Estado do Recuo de Segunda Linha / Continuação (Hanging Indent) em cm
  const [redatorRecuoSegundaLinha, setRedatorRecuoSegundaLinha] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bm_redator_recuo_2a_linha');
      return saved !== null ? parseFloat(saved) : 0.0; // Padrão Oficial: 0,00 cm (segunda linha alinhada à margem esquerda)
    } catch { return 0.0; }
  });

  // Estados de Assinatura Colegiada / Comissões de Sindicância e PAD
  const [redatorModoAssinatura, setRedatorModoAssinatura] = useState<'INDIVIDUAL' | 'COMISSAO_PAD' | 'COMISSAO_DEFESA' | 'TAC_CAC' | 'PERSONALIZADA'>('INDIVIDUAL');
  const [redatorMembrosComissao, setRedatorMembrosComissao] = useState<MembroComissao[]>([
    {
      id: 'm1',
      nome: 'Augusto Lourenço da Silva Júnior',
      funcao: 'Presidente da Comissão Processante',
      matricula: '1001',
      cargoEfetivo: 'Chefe de Divisão de Treinamento e RH'
    },
    {
      id: 'm2',
      nome: '[Nome do(a) Secretário(a)]',
      funcao: 'Secretária da Comissão',
      matricula: '----',
      cargoEfetivo: 'Servidor Público Municipal'
    },
    {
      id: 'm3',
      nome: '[Nome do(a) Vogal]',
      funcao: 'Vogal / Membro da Comissão',
      matricula: '----',
      cargoEfetivo: 'Servidor Público Municipal'
    }
  ]);

  // Comissões Salvas no Município (Presets Institucionais e Customizadas pelo Usuário)
  const [comissoesSalvas, setComissoesSalvas] = useState<Array<{ nomeComissao: string; membros: MembroComissao[] }>>(() => {
    try {
      const saved = localStorage.getItem('bm_comissoes_salvas');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        nomeComissao: 'Comissão Permanente de PAD (Portaria nº 042/2026)',
        membros: [
          { id: 'cp1', nome: 'Augusto Lourenço da Silva Júnior', funcao: 'Presidente da Comissão Processante', matricula: '1001', cargoEfetivo: 'Chefe de Divisão de Treinamento e RH' },
          { id: 'cp2', nome: '[Nome do(a) Secretário(a)]', funcao: 'Secretária da Comissão', matricula: '----', cargoEfetivo: 'Servidor Público Municipal' },
          { id: 'cp3', nome: '[Nome do(a) Vogal]', funcao: 'Vogal / Membro da Comissão', matricula: '----', cargoEfetivo: 'Servidor Público Municipal' }
        ]
      },
      {
        nomeComissao: 'Comissão de Sindicância Investigativa (Portaria nº 015/2026)',
        membros: [
          { id: 'cs1', nome: 'Augusto Lourenço da Silva Júnior', funcao: 'Presidente da Comissão de Sindicância', matricula: '1001', cargoEfetivo: 'Chefe de Divisão de Treinamento e RH' },
          { id: 'cs2', nome: '[Nome do(a) Secretário(a)]', funcao: 'Secretário da Comissão', matricula: '----', cargoEfetivo: 'Servidor Público Municipal' },
          { id: 'cs3', nome: '[Nome do(a) Vogal]', funcao: 'Vogal / Membro', matricula: '----', cargoEfetivo: 'Servidor Público Municipal' }
        ]
      }
    ];
  });

  const handleSalvarComissaoAtual = (nome: string) => {
    if (!nome.trim()) return;
    const nova = { nomeComissao: nome.trim(), membros: redatorMembrosComissao };
    const atualizadas = [nova, ...comissoesSalvas.filter(c => c.nomeComissao !== nome.trim())];
    setComissoesSalvas(atualizadas);
    try {
      localStorage.setItem('bm_comissoes_salvas', JSON.stringify(atualizadas));
    } catch {}
    showToast(`Comissão "${nome.trim()}" salva com sucesso!`);
  };

  const handleCarregarComissao = (nome: string) => {
    const found = comissoesSalvas.find(c => c.nomeComissao === nome);
    if (found) {
      setRedatorMembrosComissao(JSON.parse(JSON.stringify(found.membros)));
      setRedatorModoAssinatura('COMISSAO_PAD');
      showToast(`Comissão carregada: ${found.nomeComissao}`);
    }
  };

  const [isModalSalvarComissaoAberto, setIsModalSalvarComissaoAberto] = useState<boolean>(false);
  const [nomeNovaComissaoSalvar, setNomeNovaComissaoSalvar] = useState<string>('');

  const mudarModoAssinatura = (novoModo: 'INDIVIDUAL' | 'COMISSAO_PAD' | 'COMISSAO_DEFESA' | 'TAC_CAC' | 'PERSONALIZADA') => {
    setRedatorModoAssinatura(novoModo);
    if (novoModo === 'COMISSAO_PAD' && redatorMembrosComissao.length < 3) {
      setRedatorMembrosComissao([
        { id: 'm1', nome: 'Augusto Lourenço da Silva Júnior', funcao: 'Presidente da Comissão Processante', matricula: '1001', cargoEfetivo: 'Chefe de Divisão de Treinamento e RH' },
        { id: 'm2', nome: '[Nome do(a) Secretário(a)]', funcao: 'Secretária da Comissão', matricula: '----', cargoEfetivo: 'Servidor Público Municipal' },
        { id: 'm3', nome: '[Nome do(a) Vogal]', funcao: 'Vogal / Membro da Comissão', matricula: '----', cargoEfetivo: 'Servidor Público Municipal' }
      ]);
    } else if (novoModo === 'COMISSAO_DEFESA' && redatorMembrosComissao.length < 4) {
      setRedatorMembrosComissao([
        { id: 'm1', nome: 'Augusto Lourenço da Silva Júnior', funcao: 'Presidente da Comissão Processante', matricula: '1001', cargoEfetivo: 'Chefe de Divisão de Treinamento e RH' },
        { id: 'm2', nome: '[Nome do(a) Secretário(a)]', funcao: 'Secretária da Comissão', matricula: '----', cargoEfetivo: 'Servidor Público Municipal' },
        { id: 'm3', nome: '[Nome do(a) Vogal]', funcao: 'Vogal / Membro da Comissão', matricula: '----', cargoEfetivo: 'Servidor Público Municipal' },
        { id: 'm4', nome: '[Servidor Notificado / Defensor]', funcao: 'Servidor Notificado / Advogado', matricula: '----', cargoEfetivo: 'Servidor Notificado' }
      ]);
    } else if (novoModo === 'TAC_CAC' && (redatorMembrosComissao.length < 4 || !redatorMembrosComissao.some(m => m.funcao.includes('Compromitente')))) {
      setRedatorMembrosComissao([
        { id: 't1', nome: redatorSignatario || 'Autoridade Celebrante', funcao: 'Pelo Município de Rio Claro (Compromitente)', matricula: redatorMatricula || '1001', cargoEfetivo: redatorCargo || 'Secretário Municipal' },
        { id: 't2', nome: '[Nome do Servidor Compromissado]', funcao: 'Servidor Compromissado', matricula: '----', cargoEfetivo: 'Servidor Efetivo' },
        { id: 't3', nome: '[Nome da Testemunha 01]', funcao: 'Testemunha 1', matricula: '----', cargoEfetivo: 'Testemunha' },
        { id: 't4', nome: '[Nome da Testemunha 02]', funcao: 'Testemunha 2', matricula: '----', cargoEfetivo: 'Testemunha' }
      ]);
    }
    showToast(`Estrutura de assinaturas alterada para: ${novoModo.replace('_', ' ')}`);
  };

  const handleAtualizarMembro = (id: string, campo: keyof MembroComissao, valor: string) => {
    setRedatorMembrosComissao(prev => prev.map(m => m.id === id ? { ...m, [campo]: valor } : m));
  };

  const handleAdicionarMembro = () => {
    const novoId = `m_${Date.now()}`;
    const novo: MembroComissao = {
      id: novoId,
      nome: '',
      funcao: `Membro ${redatorMembrosComissao.length + 1}`,
      matricula: '',
      cargoEfetivo: 'Servidor Público'
    };
    setRedatorMembrosComissao(prev => [...prev, novo]);
    showToast('Novo membro adicionado à comissão.');
  };

  const handleRemoverMembro = (id: string) => {
    if (redatorMembrosComissao.length <= 1) {
      showToast('A comissão deve ter ao menos 1 membro.');
      return;
    }
    setRedatorMembrosComissao(prev => prev.filter(m => m.id !== id));
    showToast('Membro removido da comissão.');
  };

  const handleSincronizarNomesComTexto = () => {
    let t = redatorTexto;
    const presidente = redatorMembrosComissao.find(m => m.funcao.toLowerCase().includes('presidente')) || redatorMembrosComissao[0];
    const secretario = redatorMembrosComissao.find(m => m.funcao.toLowerCase().includes('secretár')) || redatorMembrosComissao[1];
    const vogal = redatorMembrosComissao.find(m => m.funcao.toLowerCase().includes('vogal') || m.funcao.toLowerCase().includes('membro')) || redatorMembrosComissao[2];

    if (presidente) {
      t = t.replace(/\[NOME DO PRESIDENTE\]/gi, presidente.nome)
           .replace(/\[PRESIDENTE\]/gi, `${presidente.nome} (${presidente.cargoEfetivo}, Matrícula nº ${presidente.matricula})`);
    }
    if (secretario) {
      t = t.replace(/\[NOME DO SECRETÁRIO\]/gi, secretario.nome)
           .replace(/\[SECRETÁRIO\]/gi, `${secretario.nome} (${secretario.cargoEfetivo}, Matrícula nº ${secretario.matricula})`);
    }
    if (vogal) {
      t = t.replace(/\[NOME DO VOGAL\]/gi, vogal.nome)
           .replace(/\[VOGAL\]/gi, `${vogal.nome} (${vogal.cargoEfetivo}, Matrícula nº ${vogal.matricula})`);
    }

    // Sincronizar membros numerados [MEMBRO 1], [MEMBRO 2]...
    redatorMembrosComissao.forEach((m, idx) => {
      const regexNum = new RegExp(`\\[MEMBRO\\s*0?${idx + 1}\\]`, 'gi');
      t = t.replace(regexNum, `${m.nome} (${m.funcao} - ${m.cargoEfetivo}, Matrícula nº ${m.matricula})`);
    });

    // Sincronizar Compromitente e Testemunhas (TAC/CAC)
    const compromitente = redatorMembrosComissao.find(m => m.funcao.toLowerCase().includes('compromitente')) || redatorMembrosComissao[0];
    const compromissado = redatorMembrosComissao.find(m => m.funcao.toLowerCase().includes('compromissado') || m.funcao.toLowerCase().includes('servidor')) || redatorMembrosComissao[1];
    const test1 = redatorMembrosComissao.find(m => m.funcao.toLowerCase().includes('testemunha 1') || m.funcao.toLowerCase().includes('testemunha 01')) || redatorMembrosComissao[2];
    const test2 = redatorMembrosComissao.find(m => m.funcao.toLowerCase().includes('testemunha 2') || m.funcao.toLowerCase().includes('testemunha 02')) || redatorMembrosComissao[3];

    if (compromitente) {
      t = t.replace(/\[COMPROMITENTE\]/gi, `${compromitente.nome} (${compromitente.cargoEfetivo})`);
    }
    if (compromissado) {
      t = t.replace(/\[COMPROMISSADO\]/gi, `${compromissado.nome} (${compromissado.cargoEfetivo}, Matrícula nº ${compromissado.matricula})`);
    }
    if (test1) {
      t = t.replace(/\[TESTEMUNHA\s*0?1\]/gi, `${test1.nome} (${test1.cargoEfetivo})`);
    }
    if (test2) {
      t = t.replace(/\[TESTEMUNHA\s*0?2\]/gi, `${test2.nome} (${test2.cargoEfetivo})`);
    }

    setRedatorTexto(t);
    showToast('Nomes e cargos da comissão sincronizados no corpo do documento!');
  };

  const handleAlterarRecuoSegundaLinha = (novo: number) => {
    const arredondado = Math.max(0, Math.min(8, Math.round(novo * 100) / 100));
    setRedatorRecuoSegundaLinha(arredondado);
    try {
      localStorage.setItem('bm_redator_recuo_2a_linha', arredondado.toString());
    } catch {}
  };

  const handleAlterarMargem = (tipo: 'esq' | 'dir' | 'sup' | 'inf', val: number) => {
    const valLimitado = Math.max(1, Math.min(6, Math.round(val * 10) / 10));
    if (tipo === 'esq') {
      setRedatorMargemEsquerda(valLimitado);
      try { localStorage.setItem('bm_redator_margem_esq', valLimitado.toString()); } catch {}
    } else if (tipo === 'dir') {
      setRedatorMargemDireita(valLimitado);
      try { localStorage.setItem('bm_redator_margem_dir', valLimitado.toString()); } catch {}
    } else if (tipo === 'sup') {
      setRedatorMargemSuperior(valLimitado);
      try { localStorage.setItem('bm_redator_margem_sup', valLimitado.toString()); } catch {}
    } else if (tipo === 'inf') {
      setRedatorMargemInferior(valLimitado);
      try { localStorage.setItem('bm_redator_margem_inf', valLimitado.toString()); } catch {}
    }
  };

  const aplicarPresetMargens = (nome: 'oficial' | 'abnt' | 'estreita' | 'moderada') => {
    if (nome === 'oficial') {
      handleAlterarMargem('esq', 3.0);
      handleAlterarMargem('dir', 2.0);
      handleAlterarMargem('sup', 2.5);
      handleAlterarMargem('inf', 2.0);
      showToast('Margens ajustadas para Padrão Oficial PMRC (Esq: 3cm, Dir: 2cm, Sup: 2,5cm, Inf: 2cm)');
    } else if (nome === 'abnt') {
      handleAlterarMargem('esq', 3.0);
      handleAlterarMargem('dir', 2.0);
      handleAlterarMargem('sup', 3.0);
      handleAlterarMargem('inf', 2.0);
      showToast('Margens ajustadas para Padrão ABNT (Esq: 3cm, Dir: 2cm, Sup: 3cm, Inf: 2cm)');
    } else if (nome === 'estreita') {
      handleAlterarMargem('esq', 2.0);
      handleAlterarMargem('dir', 1.5);
      handleAlterarMargem('sup', 2.0);
      handleAlterarMargem('inf', 1.5);
      showToast('Margens ajustadas para Estreita (Esq: 2cm, Dir: 1,5cm, Sup: 2cm, Inf: 1,5cm)');
    } else if (nome === 'moderada') {
      handleAlterarMargem('esq', 2.5);
      handleAlterarMargem('dir', 2.0);
      handleAlterarMargem('sup', 2.5);
      handleAlterarMargem('inf', 2.0);
      showToast('Margens ajustadas para Moderada (Esq: 2,5cm, Dir: 2cm, Sup: 2,5cm, Inf: 2cm)');
    }
  };

  // Helper para prefixo oficial de documento (ex: MEMO RH 710/2026, OFÍCIO RH 710/2026, PORTARIA Nº 015/2026, ATO Nº 001/2026 ou CAC Nº 001/2026)
  const getDocumentoPrefixo = (tipo: string, num: string) => {
    const anoAtual = new Date().getFullYear();
    const numLimpo = num ? num : `____/${anoAtual}`;
    if (tipo === 'DECRETO') return `DECRETO Nº ${numLimpo}`;
    if (tipo === 'PORTARIA') return `PORTARIA Nº ${numLimpo}`;
    if (tipo === 'ATO') return `ATO DISCIPLINAR Nº ${numLimpo}`;
    if (tipo === 'TERMO') return `TERMO / CAC Nº ${numLimpo}`;
    if (tipo === 'MEMORANDO') return `MEMO RH ${numLimpo}`;
    if (tipo === 'OFICIO') return `OFÍCIO RH ${numLimpo}`;
    return `${tipo} RH ${numLimpo}`;
  };

  // Estado da Visualização Flutuante (Picture-in-Picture para acompanhamento em tempo real durante edição)
  const [isFloatingPreview, setIsFloatingPreview] = useState(() => {
    return localStorage.getItem('bm_redator_floating_preview') === 'true';
  });
  const [isFloatingPreviewMinimized, setIsFloatingPreviewMinimized] = useState(false);
  const [floatingZoom, setFloatingZoom] = useState<'normal' | 'compact' | 'mini'>('normal');
  const [floatingPreviewPos, setFloatingPreviewPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('bm_redator_floating_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return { x: parsed.x, y: parsed.y };
        }
      }
    } catch {
      // ignora armazenamento inválido
    }
    return null;
  });
  const [isDraggingFloatingPreview, setIsDraggingFloatingPreview] = useState(false);
  const [floatingPreviewSize, setFloatingPreviewSize] = useState<{ width: number; height: number } | null>(() => {
    try {
      const saved = localStorage.getItem('bm_redator_floating_size');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.width === 'number' && typeof parsed?.height === 'number') {
          return { width: parsed.width, height: parsed.height };
        }
      }
    } catch {
      // ignora armazenamento inválido
    }
    return null;
  });
  const [isResizingFloatingPreview, setIsResizingFloatingPreview] = useState(false);
  const floatingPreviewRef = useRef<HTMLDivElement | null>(null);
  const floatingDragStateRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);
  const floatingResizeStateRef = useRef<{
    pointerId: number;
    dir: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const FLOATING_MIN_WIDTH = 300;
  const FLOATING_MIN_HEIGHT = 220;

  const clampFloatingPosition = (x: number, y: number, width: number, height: number) => {
    const margin = 8;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const effectiveHeight = Math.min(height, window.innerHeight - margin * 2);
    const maxY = Math.max(margin, window.innerHeight - effectiveHeight - margin);
    return {
      x: Math.round(Math.min(Math.max(margin, x), maxX)),
      y: Math.round(Math.min(Math.max(margin, y), maxY)),
    };
  };

  useEffect(() => {
    if (!isFloatingPreview || isDraggingFloatingPreview || isResizingFloatingPreview) return;
    const ensureInsideViewport = () => {
      const el = floatingPreviewRef.current;
      if (!el) return;
      const margin = 8;
      const maxW = Math.max(FLOATING_MIN_WIDTH, window.innerWidth - margin * 2);
      const maxH = Math.max(FLOATING_MIN_HEIGHT, window.innerHeight - margin * 2);

      if (!isFloatingPreviewMinimized) {
        setFloatingPreviewSize(prev => {
          if (!prev) return prev;
          const clampedW = Math.round(Math.min(Math.max(FLOATING_MIN_WIDTH, prev.width), maxW));
          const clampedH = Math.round(Math.min(Math.max(FLOATING_MIN_HEIGHT, prev.height), maxH));
          if (clampedW === prev.width && clampedH === prev.height) return prev;
          return { width: clampedW, height: clampedH };
        });
      }

      const rect = el.getBoundingClientRect();
      setFloatingPreviewPos(prev => {
        if (!prev) return prev;
        const clamped = clampFloatingPosition(prev.x, prev.y, Math.min(rect.width, maxW), Math.min(rect.height, maxH));
        if (clamped.x === prev.x && clamped.y === prev.y) return prev;
        return clamped;
      });
    };
    const rafId = window.requestAnimationFrame(ensureInsideViewport);
    window.addEventListener('resize', ensureInsideViewport);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', ensureInsideViewport);
    };
  }, [isFloatingPreview, isFloatingPreviewMinimized, isRedatorModalOpen, isDraggingFloatingPreview, isResizingFloatingPreview]);

  useEffect(() => {
    try {
      if (floatingPreviewPos) {
        localStorage.setItem('bm_redator_floating_pos', JSON.stringify(floatingPreviewPos));
      } else {
        localStorage.removeItem('bm_redator_floating_pos');
      }
    } catch {
      // ignora restrições de armazenamento
    }
  }, [floatingPreviewPos]);

  useEffect(() => {
    try {
      if (floatingPreviewSize) {
        localStorage.setItem('bm_redator_floating_size', JSON.stringify(floatingPreviewSize));
      } else {
        localStorage.removeItem('bm_redator_floating_size');
      }
    } catch {
      // ignora restrições de armazenamento
    }
  }, [floatingPreviewSize]);

  const handleFloatingHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = floatingPreviewRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    floatingDragStateRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
    setFloatingPreviewPos(clampFloatingPosition(rect.left, rect.top, rect.width, rect.height));
    setIsDraggingFloatingPreview(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // fallback seguro
    }
  };

  const handleFloatingHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = floatingDragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const next = clampFloatingPosition(
      e.clientX - drag.offsetX,
      e.clientY - drag.offsetY,
      drag.width,
      drag.height
    );
    setFloatingPreviewPos(next);
  };

  const handleFloatingHeaderPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = floatingDragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    floatingDragStateRef.current = null;
    setIsDraggingFloatingPreview(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // fallback seguro
    }
  };

  const handleFloatingResizePointerDown = (
    dir: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  ) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = floatingPreviewRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    floatingResizeStateRef.current = {
      pointerId: e.pointerId,
      dir,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      startWidth: rect.width,
      startHeight: rect.height,
    };
    setFloatingPreviewPos({ x: Math.round(rect.left), y: Math.round(rect.top) });
    setFloatingPreviewSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    setIsResizingFloatingPreview(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // fallback seguro
    }
  };

  const handleFloatingResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const resize = floatingResizeStateRef.current;
    if (!resize || resize.pointerId !== e.pointerId) return;
    e.stopPropagation();

    const margin = 8;
    const dx = e.clientX - resize.startX;
    const dy = e.clientY - resize.startY;

    let nextLeft = resize.startLeft;
    let nextTop = resize.startTop;
    let nextWidth = resize.startWidth;
    let nextHeight = resize.startHeight;

    if (resize.dir.includes('e')) {
      const maxW = Math.max(FLOATING_MIN_WIDTH, window.innerWidth - resize.startLeft - margin);
      nextWidth = Math.min(Math.max(FLOATING_MIN_WIDTH, resize.startWidth + dx), maxW);
    } else if (resize.dir.includes('w')) {
      const rightEdge = resize.startLeft + resize.startWidth;
      const maxW = Math.max(FLOATING_MIN_WIDTH, rightEdge - margin);
      nextWidth = Math.min(Math.max(FLOATING_MIN_WIDTH, resize.startWidth - dx), maxW);
      nextLeft = rightEdge - nextWidth;
    }

    if (resize.dir.includes('s')) {
      const maxH = Math.max(FLOATING_MIN_HEIGHT, window.innerHeight - resize.startTop - margin);
      nextHeight = Math.min(Math.max(FLOATING_MIN_HEIGHT, resize.startHeight + dy), maxH);
    } else if (resize.dir.includes('n')) {
      const bottomEdge = resize.startTop + resize.startHeight;
      const maxH = Math.max(FLOATING_MIN_HEIGHT, bottomEdge - margin);
      nextHeight = Math.min(Math.max(FLOATING_MIN_HEIGHT, resize.startHeight - dy), maxH);
      nextTop = bottomEdge - nextHeight;
    }

    setFloatingPreviewPos({ x: Math.round(nextLeft), y: Math.round(nextTop) });
    setFloatingPreviewSize({ width: Math.round(nextWidth), height: Math.round(nextHeight) });
  };

  const handleFloatingResizePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const resize = floatingResizeStateRef.current;
    if (!resize || resize.pointerId !== e.pointerId) return;
    e.stopPropagation();
    floatingResizeStateRef.current = null;
    setIsResizingFloatingPreview(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // fallback seguro
    }
  };

  const handleFloatingHeaderDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setFloatingPreviewPos(null);
    setFloatingPreviewSize(null);
  };

  const toggleFloatingPreview = () => {
    setIsFloatingPreview(prev => {
      const next = !prev;
      localStorage.setItem('bm_redator_floating_preview', next ? 'true' : 'false');
      if (next) setIsFloatingPreviewMinimized(false);
      return next;
    });
  };

  // Estado de Modelo Vinculado ao Redator
  const [redatorModeloVinculado, setRedatorModeloVinculado] = useState<ModeloDocumental | null>(null);

  // Lista consolidada de Destinatários vindos da base (modelos, histórico de numeração e secretarias municipais)
  const listaDestinatariosBase = useMemo(() => {
    const set = new Set<string>();

    // Secretarias e Órgãos Oficiais da Prefeitura de Rio Claro RJ
    const orgaosOficiais = [
      'Secretaria Municipal de Saúde (SMS)',
      'Secretaria Municipal de Educação (SME)',
      'Secretaria Municipal de Administração (SMA)',
      'Secretaria Municipal de Fazenda e Finanças (SMF)',
      'Secretaria Municipal de Obras e Serviços Públicos (SMOSP)',
      'Secretaria Municipal de Ação Social e Cidadania',
      'Secretaria Municipal de Meio Ambiente',
      'Procuradoria-Geral do Município (PGM)',
      'Gabinete do Prefeito',
      'Controladoria Geral do Município (CGM)',
      'Departamento de Recursos Humanos (DRH)',
      'Divisão de Treinamento e Desenvolvimento de RH',
      'Divisão de Folha de Pagamento e Benefícios',
      'Departamento de Compras e Licitações',
      'Departamento de Contratos e Convênios',
      'Departamento de Pessoal (DP)',
      'Arquivo Geral do Município',
      'Instituto de Previdência Municipal (IPRC)',
      'Câmara Municipal de Rio Claro – RJ'
    ];
    orgaosOficiais.forEach(o => set.add(o));

    // Dos modelos cadastrados na planilha
    modelos.forEach(m => {
      if (m.SetorDestino && m.SetorDestino.trim()) set.add(m.SetorDestino.trim());
      if (m.SetorOrigem && m.SetorOrigem.trim()) set.add(m.SetorOrigem.trim());
    });

    // Da aba Numeração (apenas histórico autorizado no escopo do servidor)
    numeracoes.forEach(n => {
      if (canUserAccessRecord(currentUser, n, activeSecretaria, secretarias)) {
        if (n.destinatario && n.destinatario.trim() && n.destinatario !== 'Não informado') {
          set.add(n.destinatario.trim());
        }
      }
    });

    // Das sugestões ativas (apenas para ADMIN quando backend legado não filtra)
    if (currentUser?.nivel === 'ADMIN') {
      sugestoes.destinatarios.forEach(d => {
        if (d && d.trim()) set.add(d.trim());
      });
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [modelos, numeracoes, sugestoes.destinatarios, currentUser, activeSecretaria, secretarias]);

  // Lista consolidada de Assuntos / Ementas da base de 86 modelos e histórico autorizado
  const listaAssuntosBase = useMemo(() => {
    const list: { assunto: string; modeloId?: string; categoria?: string; tipoDoc?: string }[] = [];
    const setAssuntos = new Set<string>();

    // 86 Modelos da base
    modelos.forEach(m => {
      const nomeAssunto = m.Assunto || m.Titulo;
      if (nomeAssunto && !setAssuntos.has(nomeAssunto.toLowerCase())) {
        setAssuntos.add(nomeAssunto.toLowerCase());
        list.push({
          assunto: nomeAssunto,
          modeloId: m.ID,
          categoria: m.Categoria,
          tipoDoc: m.TipoDocumento
        });
      }
    });

    // Aba Numeração (estritamente dentro do escopo do servidor logado)
    numeracoes.forEach(n => {
      if (!canUserAccessRecord(currentUser, n, activeSecretaria, secretarias)) return;
      if (n.assunto && !setAssuntos.has(n.assunto.toLowerCase())) {
        setAssuntos.add(n.assunto.toLowerCase());
        list.push({
          assunto: n.assunto,
          categoria: 'Histórico da Numeração',
          tipoDoc: n.tipoDocumento
        });
      }
    });

    return list.sort((a, b) => a.assunto.localeCompare(b.assunto, 'pt-BR'));
  }, [modelos, numeracoes, currentUser, activeSecretaria, secretarias]);

  // Lista consolidada de Signatários / Autoridades / Servidores da base (filtrada por escopo para não-ADMIN)
  const listaSignatariosBase = useMemo(() => {
    const map = new Map<string, { nome: string; cargo: string; departamento: string; secretaria: string; matricula: string }>();

    const adicionarSignatario = (u: UsuarioSistema) => {
      if (u.ativo === false) return;
      const secPrincipalU = resolveCanonicalSecretariaName(u.secretaria || 'Secretaria Municipal de Administração (SMA)', secretarias);

      if (currentUser && currentUser.nivel !== 'ADMIN') {
        const hasAuthorizedSec =
          isUserAuthorizedForSecretaria(currentUser, secPrincipalU, secretarias) ||
          (u.secretarias || []).some(s => isUserAuthorizedForSecretaria(currentUser, s, secretarias));
        if (!hasAuthorizedSec) return;

        if (isUserRestrictedToDepartamento(currentUser)) {
          if (!isRecordFromDepartamento(u.departamento, currentUser.departamento, secPrincipalU, secretarias)) {
            return;
          }
        }
      }

      map.set(u.matricula, {
        nome: u.nome,
        cargo: u.cargo || (u.nivel === 'ADMIN' ? 'Chefe de Divisão / Gestor' : 'Servidor Municipal'),
        departamento: u.departamento || 'Departamento de Recursos Humanos (DRH)',
        secretaria: secPrincipalU,
        matricula: u.matricula
      });
    };

    usuarios.forEach(adicionarSignatario);
    if (currentUser && !map.has(currentUser.matricula)) {
      adicionarSignatario(currentUser);
    }

    return Array.from(map.values());
  }, [usuarios, currentUser, secretarias]);

  // Lista consolidada de Secretarias e Órgãos de Lotação Municipais para o Combo (canonizada)
  const listaSecretariasBase = useMemo(() => {
    const dedup = new Map<string, string>();
    const addSec = (raw?: string) => {
      if (!raw || !raw.trim()) return;
      const canonical = resolveCanonicalSecretariaName(raw.trim(), secretarias);
      const sigla = getSecretariaSigla(canonical, secretarias);
      if (!dedup.has(sigla)) dedup.set(sigla, canonical);
    };

    SECRETARIAS_MUNICIPAIS_BASE.forEach(addSec);
    secretarias.forEach(s => addSec(`${s.nome} (${s.sigla})`));
    usuarios.forEach(u => {
      addSec(u.secretaria);
      (u.secretarias || []).forEach(addSec);
    });
    return Array.from(dedup.values());
  }, [usuarios, secretarias]);

  // Lista de Secretarias autorizadas para o usuário logado (Suporte a Acúmulo de Pastas, canonizada)
  const listaSecretariasDoUsuario = useMemo(() => {
    if (!currentUser) return ['Secretaria Municipal de Administração (SMA)'];
    if (currentUser.nivel === 'ADMIN') {
      // O Administrador tem acesso irrestrito para transitar e emitir por qualquer pasta
      return secretarias.map(s => `${s.nome} (${s.sigla})`);
    }
    const rawSecs = [
      currentUser.secretaria,
      ...(currentUser.secretarias || [])
    ].filter(Boolean) as string[];

    const dedupMap = new Map<string, string>();
    rawSecs.forEach(raw => {
      raw.split(/[,;]/).forEach(part => {
        const clean = part.trim();
        if (!clean) return;
        const canonical = resolveCanonicalSecretariaName(clean, secretarias);
        const key = getSecretariaSigla(canonical, secretarias);
        if (!dedupMap.has(key)) {
          dedupMap.set(key, canonical);
        }
      });
    });

    const unique = Array.from(dedupMap.values());
    return unique.length > 0 ? unique : ['Secretaria Municipal de Administração (SMA)'];
  }, [currentUser, secretarias]);

  // Filtros adicionais do Livro de Numeração (Departamento travado para PADRAO com lotação definida)
  const [filtroLivroDepartamento, setFiltroLivroDepartamento] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem('sgep_user_session');
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as UsuarioSistema;
        if (isUserRestrictedToDepartamento(parsed) && parsed.departamento) {
          return parsed.departamento.trim();
        }
      }
    } catch {}
    return 'TODOS';
  });
  const [filtroLivroApenasMeus, setFiltroLivroApenasMeus] = useState<boolean>(false);
  const [filtroLivroTermo, setFiltroLivroTermo] = useState<string>('');
  const [filtroLivroOrdemData, setFiltroLivroOrdemData] = useState<'desc' | 'asc'>('desc');
  const [filtroLivroRapido, setFiltroLivroRapido] = useState<'TODOS' | 'HOJE' | 'MES' | 'OFICIO' | 'MEMORANDO'>('TODOS');

  // Lista dinâmica de departamentos disponíveis para a Secretaria Ativa (respeitando escopo do servidor)
  const departamentosDaSecretariaAtiva = useMemo(() => {
    if (isUserRestrictedToDepartamento(currentUser) && currentUser?.departamento) {
      return [currentUser.departamento.trim()];
    }

    const secObj = activeSecretaria === 'TODAS'
      ? undefined
      : secretarias.find(s => isSameSecretaria(`${s.nome} (${s.sigla})`, activeSecretaria, secretarias));
    const listaDeptos = secObj?.departamentos ? [...secObj.departamentos] : [];

    numeracoes.forEach(n => {
      if (!canUserAccessRecord(currentUser, n, activeSecretaria, secretarias)) return;
      if (n.departamento && n.departamento.trim() && !listaDeptos.includes(n.departamento.trim())) {
        if (activeSecretaria === 'TODAS' || isRecordFromSecretaria(n.secretaria, activeSecretaria, secretarias)) {
          listaDeptos.push(n.departamento.trim());
        }
      }
    });
    return listaDeptos.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [secretarias, activeSecretaria, numeracoes, currentUser]);

  // Regra de Negócio de Confidencialidade e Privacidade por Secretaria & Filtros Departamentais:
  // - Servidores vinculados à Secretaria de Administração e ADMIN têm acesso total ao acervo de 841 legados.
  // - Servidores de outras Secretarias (Saúde, Educação, Fazenda, etc.) visualizam estritamente os documentos da sua pasta ativa.
  const numeracoesFiltradas = useMemo(() => {
    const parseDocTimestamp = (val?: string): number => {
      const dt = parseDataHoraSegura(val);
      return dt ? dt.getTime() : 0;
    };

    return numeracoes
      .filter(n => {
        // 1. Portão único de confidencialidade (Secretaria + Departamento + Legados SEAD)
        if (!canUserAccessRecord(currentUser, n, activeSecretaria, secretarias)) return false;

        // 2. Filtro adicional selecionado no Livro por Departamento
        if (filtroLivroDepartamento !== 'TODOS') {
          if (!isRecordFromDepartamento(n.departamento, filtroLivroDepartamento, n.secretaria, secretarias)) {
            return false;
          }
        }

        // 3. Filtro "Meus Documentos"
        if (filtroLivroApenasMeus && currentUser) {
          const docUser = ((n.servidor || '') + ' ' + (n.usuario || '')).toLowerCase();
          const userName = (currentUser.nome || '').toLowerCase();
          const userMat = (currentUser.matricula || '').toLowerCase();
          const matchUser = (userName && docUser.includes(userName)) || (userMat && docUser.includes(userMat));
          if (!matchUser) return false;
        }

        // 4. Filtros Rápidos (Hoje, Este mês, Ofícios, Memorandos)
        if (filtroLivroRapido !== 'TODOS') {
          if (filtroLivroRapido === 'HOJE') {
            const dt = parseDataHoraSegura(n.dataHora);
            if (!dt) return false;
            const agora = new Date();
            if (
              dt.getFullYear() !== agora.getFullYear() ||
              dt.getMonth() !== agora.getMonth() ||
              dt.getDate() !== agora.getDate()
            ) {
              return false;
            }
          } else if (filtroLivroRapido === 'MES') {
            const dt = parseDataHoraSegura(n.dataHora);
            if (!dt) return false;
            const agora = new Date();
            if (dt.getFullYear() !== agora.getFullYear() || dt.getMonth() !== agora.getMonth()) {
              return false;
            }
          } else if (filtroLivroRapido === 'OFICIO') {
            const tipoUp = (n.tipoDocumento || '').toUpperCase();
            if (!tipoUp.includes('OFICIO') && !tipoUp.includes('OFÍCIO')) return false;
          } else if (filtroLivroRapido === 'MEMORANDO') {
            const tipoUp = (n.tipoDocumento || '').toUpperCase();
            if (!tipoUp.includes('MEMORANDO')) return false;
          }
        }

        // 5. Busca por Termo (Número, Assunto, Destinatário, Servidor, Departamento)
        if (filtroLivroTermo.trim()) {
          const t = filtroLivroTermo.trim().toLowerCase();
          const matchTermo =
            (n.numero && n.numero.toLowerCase().includes(t)) ||
            (n.assunto && n.assunto.toLowerCase().includes(t)) ||
            (n.destinatario && n.destinatario.toLowerCase().includes(t)) ||
            (n.servidor && n.servidor.toLowerCase().includes(t)) ||
            (n.usuario && n.usuario.toLowerCase().includes(t)) ||
            (n.departamento && n.departamento.toLowerCase().includes(t)) ||
            (n.secretaria && n.secretaria.toLowerCase().includes(t));
          if (!matchTermo) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = parseDocTimestamp(a.dataHora);
        const timeB = parseDocTimestamp(b.dataHora);
        return filtroLivroOrdemData === 'asc' ? timeA - timeB : timeB - timeA;
      });
  }, [numeracoes, activeSecretaria, currentUser, secretarias, filtroLivroDepartamento, filtroLivroApenasMeus, filtroLivroRapido, filtroLivroTermo, filtroLivroOrdemData]);

  // Combo de Documentos da aba Numeração
  const [selectedComboDocNum, setSelectedComboDocNum] = useState<string>('');
  const [inspectedDocFromCombo, setInspectedDocFromCombo] = useState<RegistroNumeracao | null>(null);

  // Login inputs
  const [loginMatricula, setLoginMatricula] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ title: string; text: string; isError?: boolean } | null>(null);
  const [copiedCodeTab, setCopiedCodeTab] = useState<string | null>(null);

  // Standalone HTML raw string state
  const [rawHtmlContent, setRawHtmlContent] = useState<string>('');

  // Acompanha alterações automáticas do tema do celular / sistema operacional
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    setSystemPrefersDark(mediaQuery.matches);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // Sincronização de Modo Claro/Escuro, Paleta de Cores, Estilo de Formulários e barra do navegador mobile
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isDarkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
    root.setAttribute('data-theme-palette', themePalette);
    root.setAttribute('data-form-style', formStyle);
    body.setAttribute('data-theme-palette', themePalette);
    body.setAttribute('data-form-style', formStyle);

    saveThemePreferences({ mode: themeMode, palette: themePalette, formStyle });

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        isDarkMode ? activePaletteMeta.metaDark : activePaletteMeta.metaLight
      );
    }
  }, [isDarkMode, themeMode, themePalette, formStyle, activePaletteMeta]);

  // Fetch standalone HTML content from repo on mount so the user can copy or download it
  useEffect(() => {
    fetch('/standalone/index.html?v=' + Date.now())
      .then(res => res.text())
      .then(text => setRawHtmlContent(text))
      .catch(err => console.error("Falha ao carregar standalone/index.html", err));
  }, []);

  // Save changes to localStorage for simulation persistence
  useEffect(() => {
    localStorage.setItem('bm_modelos', JSON.stringify(modelos));
  }, [modelos]);

  useEffect(() => {
    localStorage.setItem('bm_numeracoes', JSON.stringify(numeracoes));
  }, [numeracoes]);

  useEffect(() => {
    localStorage.setItem('bm_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('bm_sugestoes', JSON.stringify(sugestoes));
  }, [sugestoes]);

  useEffect(() => {
    localStorage.setItem('favs', JSON.stringify(favoritos));
  }, [favoritos]);

  // Chave de rascunho automático por matrícula do servidor
  const redatorDraftStorageKey = useMemo(
    () => `bm_redator_draft_${(currentUser?.matricula || 'anon').trim().toLowerCase()}`,
    [currentUser?.matricula]
  );

  const limparRascunhoRedator = () => {
    try {
      localStorage.removeItem(redatorDraftStorageKey);
    } catch {}
    setRedatorDraftSavedAt('');
    setPendingRedatorDraft(null);
  };

  const restaurarRascunhoRedator = (draft: RedatorDraftPayload) => {
    setRedatorTipo(draft.tipo || 'MEMORANDO');
    setRedatorAssunto(draft.assunto || '');
    setRedatorDestinatario(draft.destinatario || '');
    setRedatorTratamento(draft.tratamento || 'À / Ao');
    setRedatorReferenciaDoc(draft.referenciaDoc || '');
    setRedatorTexto(draft.texto || '');
    setRedatorFecho(draft.fecho || 'Permanecemos à disposição para eventuais esclarecimentos adicionais.');
    setRedatorEmailCc(draft.emailCc || '');
    if (draft.secretaria && (currentUser?.nivel === 'ADMIN' || isUserAuthorizedForSecretaria(currentUser, draft.secretaria, secretarias))) {
      setRedatorSecretaria(resolveCanonicalSecretariaName(draft.secretaria, secretarias));
    }
    if (draft.setorOrigem && !isUserRestrictedToDepartamento(currentUser)) {
      setRedatorSetorOrigem(draft.setorOrigem);
    }
    setRedatorNumero('');
    setRedatorDraftSavedAt(draft.savedAt || '');
    setPendingRedatorDraft(null);
    showToast(`Rascunho salvo às ${draft.savedAt || 'pouco'} restaurado no Redator!`);
  };

  // Detecta rascunho não finalizado ao abrir o Redator Oficial
  useEffect(() => {
    if (!isRedatorModalOpen || !currentUser) return;
    if (redatorDraftSkipNextPromptRef.current) {
      redatorDraftSkipNextPromptRef.current = false;
      setPendingRedatorDraft(null);
      return;
    }
    if (redatorNumero) {
      setPendingRedatorDraft(null);
      return;
    }
    try {
      const raw = localStorage.getItem(redatorDraftStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as RedatorDraftPayload;
      if (parsed && (parsed.texto?.trim() || parsed.assunto?.trim())) {
        const jaIgual =
          (parsed.texto || '').trim() === (redatorTexto || '').trim() &&
          (parsed.assunto || '').trim() === (redatorAssunto || '').trim() &&
          (parsed.destinatario || '').trim() === (redatorDestinatario || '').trim();
        if (!jaIgual) {
          setPendingRedatorDraft(parsed);
        } else if (parsed.savedAt) {
          setRedatorDraftSavedAt(parsed.savedAt);
        }
      }
    } catch {}
  }, [isRedatorModalOpen, currentUser?.matricula]);

  // Auto-save silencioso com debounce enquanto o servidor redige no Redator Oficial
  useEffect(() => {
    if (!isRedatorModalOpen || !currentUser || redatorNumero || pendingRedatorDraft) return;
    if (!redatorTexto.trim() && !redatorAssunto.trim()) return;

    const timer = window.setTimeout(() => {
      try {
        const agora = new Date();
        const hh = String(agora.getHours()).padStart(2, '0');
        const mm = String(agora.getMinutes()).padStart(2, '0');
        const savedAt = `${hh}:${mm}`;
        const payload: RedatorDraftPayload = {
          tipo: redatorTipo,
          assunto: redatorAssunto,
          destinatario: redatorDestinatario,
          tratamento: redatorTratamento,
          referenciaDoc: redatorReferenciaDoc,
          texto: redatorTexto,
          fecho: redatorFecho,
          emailCc: redatorEmailCc,
          setorOrigem: redatorSetorOrigem,
          secretaria: redatorSecretaria,
          savedAt
        };
        localStorage.setItem(redatorDraftStorageKey, JSON.stringify(payload));
        setRedatorDraftSavedAt(savedAt);
      } catch {}
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [
    isRedatorModalOpen,
    currentUser,
    redatorNumero,
    pendingRedatorDraft,
    redatorDraftStorageKey,
    redatorTipo,
    redatorAssunto,
    redatorDestinatario,
    redatorTratamento,
    redatorReferenciaDoc,
    redatorTexto,
    redatorFecho,
    redatorEmailCc,
    redatorSetorOrigem,
    redatorSecretaria
  ]);

  // Reaproveitar / Duplicar documento emitido no Livro como base para um novo (sem número)
  const handleUsarDocumentoComoBase = (doc: RegistroNumeracao) => {
    const allowedTypes = ['MEMORANDO', 'OFICIO', 'DESPACHO', 'CIRCULAR', 'PORTARIA', 'DECRETO', 'EMAIL', 'ATO', 'TERMO'] as const;
    const rawType = (doc.tipoDocumento || 'MEMORANDO').toUpperCase();
    const tipoFinal = (allowedTypes.includes(rawType as any) ? rawType : 'MEMORANDO') as typeof redatorTipo;

    redatorDraftSkipNextPromptRef.current = true;
    setPendingRedatorDraft(null);
    setRedatorTipo(tipoFinal);
    setRedatorNumero('');
    setRedatorReferenciaDoc('');
    setRedatorDestinatario(doc.destinatario && doc.destinatario !== 'Não informado' ? doc.destinatario : '');
    setRedatorAssunto(doc.assunto || '');

    if (doc.secretaria && (currentUser?.nivel === 'ADMIN' || isUserAuthorizedForSecretaria(currentUser, doc.secretaria, secretarias))) {
      setRedatorSecretaria(resolveCanonicalSecretariaName(doc.secretaria, secretarias));
    }
    if (doc.departamento && !isUserRestrictedToDepartamento(currentUser)) {
      setRedatorSetorOrigem(doc.departamento);
    }

    setRedatorTexto(
      `Cumprimentando-o cordialmente, sirvo-me do presente para tratar de assunto relativo a ${doc.assunto || 'demanda administrativa desta unidade'}, em continuidade às rotinas institucionais da Prefeitura Municipal de Rio Claro – RJ.\n\nSolicitamos a gentileza de analisar as informações apresentadas e adotar as providências cabíveis no âmbito de sua competência.\n\nPermanecemos à disposição para prestar quaisquer esclarecimentos complementares.`
    );
    setIsSheetsDrawerOpen(false);
    setIsRedatorModalOpen(true);
    showToast(`Documento ${doc.numero} carregado como base (novo número será gerado ao emitir).`);
  };

  // Responder documento do Livro ou da Central de Início com referência automática
  const handleResponderDocumento = (doc: RegistroNumeracao) => {
    const tipoResp = doc.tipoDocumento === 'OFICIO' ? 'OFICIO' : 'MEMORANDO';
    redatorDraftSkipNextPromptRef.current = true;
    setPendingRedatorDraft(null);
    setRedatorTipo(tipoResp);
    setRedatorReferenciaDoc(`${doc.tipoDocumento} nº ${doc.numero}`);
    setRedatorDestinatario(doc.destinatario && doc.destinatario !== 'Não informado' ? doc.destinatario : '');
    setRedatorAssunto(`Em resposta ao ${doc.tipoDocumento} nº ${doc.numero} – ${doc.assunto}`);
    setRedatorTexto(
      `Cumprimentando-o cordialmente, sirvo-me do presente para apresentar as manifestações e informações pertinentes em resposta ao ${doc.tipoDocumento} nº ${doc.numero}, concernente a ${doc.assunto}.\n\nInformo que as medidas foram devidamente instruídas, visando à regular continuidade dos serviços públicos desta municipalidade.`
    );
    setRedatorNumero('');
    setIsSheetsDrawerOpen(false);
    setIsRedatorModalOpen(true);
    showToast(`Referência e modelo de resposta ao ${doc.numero} carregados no Redator!`);
  };

  // Trocar Secretaria Ativa (usado tanto no cabeçalho quanto na Central de Início)
  const handleChangeActiveSecretaria = (novaPasta: string) => {
    if (currentUser?.nivel !== 'ADMIN' && (novaPasta === 'TODAS' || !isUserAuthorizedForSecretaria(currentUser, novaPasta, secretarias))) {
      showToast('Você só possui permissão para atuar nas secretarias vinculadas ao seu cadastro.', 'Acesso Restrito', true);
      return;
    }
    setActiveSecretaria(novaPasta);
    if (novaPasta !== 'TODAS') {
      setRedatorSecretaria(novaPasta);
      if (!isUserRestrictedToDepartamento(currentUser)) {
        const secObj = secretarias.find(s => isSameSecretaria(`${s.nome} (${s.sigla})`, novaPasta, secretarias));
        setRedatorSetorOrigem(secObj?.departamentos?.[0] || (getSecretariaSigla(novaPasta, secretarias) === 'SMA' ? 'Departamento de Recursos Humanos (DRH)' : 'Gabinete'));
      }
    }
    if (!isUserRestrictedToDepartamento(currentUser)) {
      setFiltroLivroDepartamento('TODOS');
    }
    setSelectedComboDocNum('');
    setInspectedDocFromCombo(null);
    localStorage.setItem('bm_active_secretaria', novaPasta);
    showToast(`Secretaria de atuação alterada para: ${novaPasta}`);
  };

  // Abrir Redator Oficial a partir da Central de Início ou cabeçalho (opcionalmente pré-selecionando o tipo)
  const handleAbrirRedatorComTipo = (tipoInicial?: 'MEMORANDO' | 'OFICIO' | 'DESPACHO') => {
    if (currentUser) {
      syncUserScopeState(currentUser, false);
      if (currentUser.nivel !== 'ADMIN') {
        const secScope = activeSecretaria !== 'TODAS' ? activeSecretaria : listaSecretariasDoUsuario[0];
        setRedatorSecretaria(resolveCanonicalSecretariaName(secScope, secretarias));
        if (isUserRestrictedToDepartamento(currentUser)) {
          setRedatorSetorOrigem(currentUser.departamento!.trim());
        }
      }
    }
    if (tipoInicial) {
      setRedatorTipo(tipoInicial);
    }
    setRedatorNumero('');
    setIsRedatorModalOpen(true);
  };

  // Ir para o Banco de Modelos aplicando filtros opcionais (Despachos, Comissões PAD/CAC, Favoritos, etc.)
  const handleIrParaModelos = (opts?: { tipo?: string; categoria?: string | null }) => {
    if (opts?.tipo !== undefined) {
      setSelectedType(opts.tipo);
    }
    if (opts?.categoria !== undefined) {
      setSelectedCategory(opts.categoria);
    }
    setActiveTab('app');
    setActiveAppView('modelos');
  };

  // Preferência do servidor: pular ou manter a Central de Início nos próximos logins
  const handleToggleSkipHomeHub = (skip: boolean) => {
    setSkipHomeHub(skip);
    if (currentUser?.matricula) {
      try {
        localStorage.setItem(`bm_skip_home_hub_${currentUser.matricula}`, skip ? '1' : '0');
      } catch {}
    }
    showToast(
      skip
        ? 'Preferência salva: próximos acessos abrirão direto no Banco de Modelos.'
        : 'Preferência salva: próximos acessos abrirão na Central de Início.'
    );
  };

  // Ler rascunho salvo do Redator para exibir na Central de Início
  const savedRedatorDraftSummary = useMemo<SavedRedatorDraftSummary | null>(() => {
    if (!currentUser) return null;
    try {
      const raw = localStorage.getItem(redatorDraftStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as RedatorDraftPayload;
      if (parsed && (parsed.texto?.trim() || parsed.assunto?.trim())) {
        return {
          tipo: parsed.tipo || 'MEMORANDO',
          assunto: parsed.assunto || '',
          destinatario: parsed.destinatario || '',
          savedAt: parsed.savedAt || '',
        };
      }
    } catch {}
    return null;
  }, [currentUser?.matricula, redatorDraftStorageKey, isRedatorModalOpen, redatorDraftSavedAt, draftRefreshTick]);

  const handleContinuarRascunhoDaCentral = () => {
    try {
      const raw = localStorage.getItem(redatorDraftStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as RedatorDraftPayload;
        redatorDraftSkipNextPromptRef.current = true;
        restaurarRascunhoRedator(parsed);
        setIsRedatorModalOpen(true);
        return;
      }
    } catch {}
    handleAbrirRedatorComTipo();
  };

  const handleDescartarRascunhoDaCentral = () => {
    limparRascunhoRedator();
    setDraftRefreshTick(t => t + 1);
    showToast('Rascunho do Redator descartado.');
  };

  const totalAdminPendencias = useMemo(() => {
    const pendingMatSet = new Set(
      pedidosRecuperacao
        .filter(p => p.status === 'PENDENTE')
        .map(p => String(p.matricula).trim().toLowerCase())
    );
    return (
      pedidosRecuperacao.filter(p => p.status === 'PENDENTE').length +
      usuarios.filter(u => !u.ativo && !pendingMatSet.has(String(u.matricula).trim().toLowerCase())).length
    );
  }, [pedidosRecuperacao, usuarios]);

  const categoriaComissoes = useMemo(() => {
    const found = modelos.find(m => /comiss|pad|sindic|cac|tac/i.test(m.Categoria || ''));
    return found?.Categoria || null;
  }, [modelos]);

  const totalComissoesModelos = useMemo(() => {
    if (!categoriaComissoes) return 0;
    return modelos.filter(m => m.Categoria === categoriaComissoes).length;
  }, [modelos, categoriaComissoes]);

  // Sincronização e Bloqueio Reativo de Escopo (Secretaria + Departamento) sempre que currentUser ou lista de secretarias mudarem
  const syncUserScopeState = (user: UsuarioSistema, forceResetFields = false) => {
    const primaryRaw = user.secretaria || (user.secretarias && user.secretarias[0]) || 'Secretaria Municipal de Administração (SMA)';
    const primaryCanon = resolveCanonicalSecretariaName(primaryRaw, secretarias);
    const defaultDepto = user.departamento?.trim() || (getSecretariaSigla(primaryCanon, secretarias) === 'SMA' ? 'Departamento de Recursos Humanos (DRH)' : 'Gabinete');

    let nextActiveSec = primaryCanon;
    if (forceResetFields) {
      setActiveSecretaria(nextActiveSec);
      localStorage.setItem('bm_active_secretaria', nextActiveSec);
    } else {
      const currentValid = user.nivel === 'ADMIN'
        ? (activeSecretaria === 'TODAS' || isUserAuthorizedForSecretaria(user, activeSecretaria, secretarias))
        : (activeSecretaria !== 'TODAS' && isUserAuthorizedForSecretaria(user, activeSecretaria, secretarias));
      if (currentValid) {
        nextActiveSec = activeSecretaria === 'TODAS' ? 'TODAS' : resolveCanonicalSecretariaName(activeSecretaria, secretarias);
      } else {
        setActiveSecretaria(primaryCanon);
        localStorage.setItem('bm_active_secretaria', primaryCanon);
        nextActiveSec = primaryCanon;
      }
    }

    const effectiveRedatorSec = nextActiveSec === 'TODAS' ? primaryCanon : nextActiveSec;
    if (forceResetFields || (user.nivel !== 'ADMIN' && !isUserAuthorizedForSecretaria(user, redatorSecretaria, secretarias))) {
      setRedatorSecretaria(effectiveRedatorSec);
    }
    if (forceResetFields || isUserRestrictedToDepartamento(user)) {
      setRedatorSetorOrigem(defaultDepto);
    }
    if (forceResetFields) {
      setRedatorSignatario(user.nome || 'Servidor Municipal');
      setRedatorCargo(user.cargo || 'Servidor Público Municipal');
      setRedatorMatricula(user.matricula || '');
      setSelectedComboDocNum('');
      setInspectedDocFromCombo(null);
      setRedatorNumero('');
      setFiltroLivroDepartamento(isUserRestrictedToDepartamento(user) ? user.departamento!.trim() : 'TODOS');
    } else if (isUserRestrictedToDepartamento(user) && filtroLivroDepartamento !== user.departamento!.trim()) {
      setFiltroLivroDepartamento(user.departamento!.trim());
    }

    if (user.nivel !== 'ADMIN' && (activeSheetTab === 'logs' || activeSheetTab === 'usuarios')) {
      setActiveSheetTab('numeracao');
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    syncUserScopeState(currentUser, false);
  }, [currentUser, secretarias]);

  const showToast = (text: string, title = 'Sucesso', isError = false) => {
    setToastMessage({ text, title, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Utilitário de requisição HTTP com timeout para evitar travamentos em cold-starts do GAS ou falhas de rede
  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 8500): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  // Fechamento de Modais com a tecla ESC para navegação fluida e evitar sensação de travamento
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAiHelperOpen) {
          setIsAiHelperOpen(false);
        } else if (isGuiaAjudaOpen) {
          setIsGuiaAjudaOpen(false);
        } else if (isRecuperarSenhaOpen) {
          setIsRecuperarSenhaOpen(false);
        } else if (isRedatorLetterheadOpen) {
          setIsRedatorLetterheadOpen(false);
        } else if (isPasswordModalOpen) {
          setIsPasswordModalOpen(false);
        } else if (isCrudModalOpen) {
          setIsCrudModalOpen(false);
        } else if (isVariableModalOpen) {
          setIsVariableModalOpen(false);
        } else if (isAdminModalOpen) {
          setIsAdminModalOpen(false);
        } else if (isSheetsDrawerOpen) {
          setIsSheetsDrawerOpen(false);
        } else if (isRedatorModalOpen) {
          setIsRedatorModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAiHelperOpen,
    isGuiaAjudaOpen,
    isRecuperarSenhaOpen,
    isRedatorLetterheadOpen,
    isPasswordModalOpen,
    isCrudModalOpen,
    isVariableModalOpen,
    isAdminModalOpen,
    isSheetsDrawerOpen,
    isRedatorModalOpen
  ]);

  // Login handler com integração real ao GAS, timeout e detalhamento de erros
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    const mat = loginMatricula.trim();
    const sen = loginSenha.trim();

    if (!mat) {
      setLoginError('Por favor, informe sua matrícula funcional.');
      setIsLoggingIn(false);
      return;
    }
    if (!sen) {
      setLoginError('Por favor, informe sua senha de acesso.');
      setIsLoggingIn(false);
      return;
    }

    try {
      let result: any = null;
      let postFailed = false;

      if (useRealApi) {
        try {
          const response = await fetchWithTimeout(realApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'LOGIN', matricula: mat, senha: sen })
          }, 8000);
          const textResp = await response.text();
          result = JSON.parse(textResp);
        } catch (postErr) {
          console.warn('Tentativa POST de login falhou ou atingiu timeout. Tentando fallback GET:', postErr);
          postFailed = true;
        }

        if (postFailed || (!result && postFailed)) {
          try {
            const getUrl = `${realApiUrl}?action=LOGIN&matricula=${encodeURIComponent(mat)}&senha=${encodeURIComponent(sen)}&t=${Date.now()}`;
            const getResp = await fetchWithTimeout(getUrl, {}, 7000);
            const getText = await getResp.text();
            result = JSON.parse(getText);
          } catch (getErr) {
            console.error('Tentativa GET de login também falhou:', getErr);
          }
        }
      }

      if (result && result.success && result.usuario) {
        const rawSec = result.usuario.secretaria || 'Secretaria Municipal de Administração (SMA)';
        const rawSecsList: string[] = Array.isArray(result.usuario.secretarias) && result.usuario.secretarias.length > 0
          ? result.usuario.secretarias
          : String(rawSec).split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
        const canonicalSecs = Array.from(new Set(rawSecsList.map((s: string) => resolveCanonicalSecretariaName(s, secretarias))));
        const primarySec = canonicalSecs[0] || resolveCanonicalSecretariaName(rawSec, secretarias);

        const authUser: UsuarioSistema = {
          id: result.usuario.id,
          nome: result.usuario.nome,
          matricula: result.usuario.matricula,
          nivel: (String(result.usuario.nivel || 'PADRAO').toUpperCase() as any),
          secretaria: primarySec,
          secretarias: canonicalSecs.length > 0 ? canonicalSecs : [primarySec],
          cargo: result.usuario.cargo || '',
          departamento: (result.usuario.departamento || result.usuario.local || '').trim(),
          ativo: true,
          senha: sen,
          token: result.usuario.token,
          filtroAcessibilidade: parseFiltroAcessibilidade(
            result.usuario.filtroAcessibilidade || result.usuario.acessibilidadeDocs
          )
        };
        setCurrentUser(authUser);
        localStorage.setItem('sgep_user_session', JSON.stringify(authUser));
        const shouldSkipHub = localStorage.getItem(`bm_skip_home_hub_${authUser.matricula}`) === '1';
        setSkipHomeHub(shouldSkipHub);
        setActiveAppView(shouldSkipHub ? 'modelos' : 'inicio');
        syncUserScopeState(authUser, true);
        handleSyncData(result.usuario.token);
        showToast(`Bem-vindo(a), ${authUser.nome}! Pasta ativa: ${primarySec}`);
        setIsLoggingIn(false);
        return;
      }

      if (result && result.error) {
        const errMsg = String(result.error);
        if (/inativ|desativ|pendente|autoriza/i.test(errMsg)) {
          setLoginError(`Cadastro da matrícula ${mat} aguardando autorização do Administrador (DRH/SMA • Ramal 407).`);
        } else {
          setLoginError(errMsg);
        }
        setIsLoggingIn(false);
        return;
      }

      // Fallback para usuários em cache/estado local caso o servidor esteja inacessível
      const matFound = usuarios.find(u => u.matricula.trim().toLowerCase() === mat.toLowerCase());
      if (matFound) {
        if (!matFound.ativo) {
          setLoginError(`Cadastro da matrícula ${mat} aguardando autorização do Administrador (DRH/SMA • Ramal 407).`);
          setIsLoggingIn(false);
          return;
        }
        if (matFound.senha === sen) {
          const primarySec = resolveCanonicalSecretariaName(matFound.secretaria || matFound.secretarias?.[0], secretarias);
          const normalizedUser: UsuarioSistema = {
            ...matFound,
            secretaria: primarySec,
            secretarias: matFound.secretarias && matFound.secretarias.length > 0
              ? matFound.secretarias.map(s => resolveCanonicalSecretariaName(s, secretarias))
              : [primarySec]
          };
          setCurrentUser(normalizedUser);
          localStorage.setItem('sgep_user_session', JSON.stringify(normalizedUser));
          const shouldSkipHub = localStorage.getItem(`bm_skip_home_hub_${normalizedUser.matricula}`) === '1';
          setSkipHomeHub(shouldSkipHub);
          setActiveAppView(shouldSkipHub ? 'modelos' : 'inicio');
          syncUserScopeState(normalizedUser, true);
          showToast(`Bem-vindo(a), ${normalizedUser.nome}! Pasta ativa: ${primarySec}`);
          setIsLoggingIn(false);
          return;
        } else {
          setLoginError(`Senha incorreta para a matrícula ${mat}.`);
          setIsLoggingIn(false);
          return;
        }
      }

      setLoginError(`Matrícula ${mat} não cadastrada na base de servidores da Prefeitura.`);
    } catch (err: any) {
      setLoginError(err.message || 'Erro de conexão com o servidor da Prefeitura.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if (currentUser?.token && useRealApi) {
      fetch(realApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'LOGOUT', token: currentUser.token })
      }).catch(() => {});
    }
    localStorage.removeItem('sgep_user_session');
    localStorage.removeItem('bm_active_secretaria');
    setCurrentUser(null);
    setActiveSecretaria('Secretaria Municipal de Administração (SMA)');
    setFiltroLivroDepartamento('TODOS');
    setFiltroLivroApenasMeus(false);
    setFiltroLivroTermo('');
    setSelectedComboDocNum('');
    setInspectedDocFromCombo(null);
    setRedatorNumero('');
    setActiveSheetTab('numeracao');
    setShowDevHub(false);
    setActiveTab('app');
    setActiveAppView('inicio');
    setLoginMatricula('');
    setLoginSenha('');
    showToast('Sessão encerrada com segurança.', 'Até logo');
  };

  // Sync data com suporte ao Backend API v4.0 (Token) e fallback retroativo
  const handleSyncData = async (tokenOverride?: string, silent = false) => {
    setIsLoadingFromGas(true);
    if (useRealApi) {
      try {
        const token = tokenOverride || currentUser?.token || '';
        if (!silent) {
          showToast('Consultando Web App do Google Apps Script...', 'Sincronizando');
        }

        let json: any = null;
        // 1ª Tentativa: POST com action CARREGAR e token (Padrão Backend v4.0)
        try {
          const res = await fetchWithTimeout(realApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'CARREGAR', token })
          }, 8500);
          const text = await res.text();
          json = JSON.parse(text);
        } catch (postErr) {
          console.warn('Tentativa POST de carga falhou ou expirou, tentando fallback GET:', postErr);
        }

        // 2ª Tentativa: GET com token ou compatibilidade retroativa
        if (!json || (!json.data && !json.error)) {
          const res = await fetchWithTimeout(`${realApiUrl}?action=CARREGAR&token=${encodeURIComponent(token)}&t=${Date.now()}`, {}, 7500);
          json = await res.json();
        }

        if (json && json.success) {
          if (json.data && Array.isArray(json.data)) {
            const sheetIds = new Set(json.data.map((m: any) => m.ID));
            const builtinDisciplinar = INITIAL_MODELOS.filter(m => !sheetIds.has(m.ID));
            setModelos([...json.data, ...builtinDisciplinar]);
          }
          if (json.sugestoes) {
            setSugestoes({
              destinatarios: json.sugestoes.destinatarios || [],
              assuntos: json.sugestoes.assuntos || []
            });

            // Sincronização dinâmica de Secretarias e Departamentos vindos da Planilha (Usuarios + Numeração + Sugestões)
            const rawSecRecords: Array<{ sec: string; dep?: string }> = [];
            if (Array.isArray(json.sugestoes.secretarias)) {
              json.sugestoes.secretarias.forEach((secName: any) => {
                if (secName && String(secName).trim()) {
                  rawSecRecords.push({ sec: String(secName).trim() });
                }
              });
            }
            if (Array.isArray(json.sugestoes.servidores)) {
              json.sugestoes.servidores.forEach((srv: any) => {
                const depVal = String(srv.departamento || '').trim();
                String(srv.secretaria || '')
                  .split(/[,;]/)
                  .map((p: string) => p.trim())
                  .filter(Boolean)
                  .forEach((secPart: string) => {
                    rawSecRecords.push({ sec: secPart, dep: depVal });
                  });
              });
            }
            if (Array.isArray(json.registrosNumeracao)) {
              json.registrosNumeracao.forEach((reg: any) => {
                if (reg.secretaria && String(reg.secretaria).trim()) {
                  rawSecRecords.push({
                    sec: String(reg.secretaria).trim(),
                    dep: String(reg.departamento || '').trim()
                  });
                }
              });
            }

            if (rawSecRecords.length > 0) {
              setSecretarias(prev => {
                const updatedList = prev.map(item => ({
                  ...item,
                  departamentos: item.departamentos ? [...item.departamentos] : []
                }));

                rawSecRecords.forEach(({ sec, dep }) => {
                  const secClean = sec.trim();
                  if (!secClean || secClean.toUpperCase() === 'TODAS') return;
                  const sigla = getSecretariaSigla(secClean, updatedList);
                  const existing = updatedList.find(
                    item =>
                      item.sigla.toUpperCase() === sigla.toUpperCase() ||
                      isSameSecretaria(`${item.nome} (${item.sigla})`, secClean, updatedList)
                  );

                  if (existing) {
                    if (dep && dep !== 'Geral' && dep !== 'Todos') {
                      const alreadyHasDep = (existing.departamentos || []).some(
                        d => d.trim().toLowerCase() === dep.toLowerCase()
                      );
                      if (!alreadyHasDep) {
                        existing.departamentos = [...(existing.departamentos || []), dep];
                      }
                    }
                  } else {
                    const cleanNome = secClean.replace(/\s*\([^)]+\)\s*$/, '').trim() || secClean;
                    updatedList.push({
                      sigla,
                      nome: cleanNome,
                      departamentos: dep ? [dep] : ['Gabinete']
                    });
                  }
                });

                try {
                  localStorage.setItem('bm_secretarias', JSON.stringify(updatedList));
                } catch {}
                return updatedList;
              });
            }

            // Sincronização oficial de Servidores da planilha Google Drive (aba 'Usuarios')
            if (Array.isArray(json.sugestoes.servidores) && json.sugestoes.servidores.length > 0) {
              const sheetUsers: UsuarioSistema[] = json.sugestoes.servidores.map((s: any) => {
                const secsList = String(s.secretaria || 'Secretaria Municipal de Administração (SMA)')
                  .split(/[,;]/)
                  .map((p: string) => resolveCanonicalSecretariaName(p.trim(), secretarias))
                  .filter(Boolean);
                const primarySec = secsList[0] || 'Secretaria Municipal de Administração (SMA)';
                return {
                  matricula: String(s.matricula || '').trim(),
                  nome: s.nome || '',
                  secretaria: primarySec,
                  departamento: String(s.departamento || '').trim(),
                  cargo: s.cargo || 'Servidor Municipal',
                  nivel: (String(s.matricula).trim() === '1001' ? 'ADMIN' : ((s.nivel || 'PADRAO').toUpperCase() as any)),
                  ativo: s.ativo === undefined
                    ? true
                    : (s.ativo === true || String(s.ativo).trim().toUpperCase() === 'TRUE' || String(s.ativo).trim() === '1'),
                  secretarias: secsList.length > 0 ? Array.from(new Set(secsList)) : [primarySec],
                  filtroAcessibilidade: parseFiltroAcessibilidade(s.filtroAcessibilidade || s.acessibilidadeDocs)
                };
              });

              setUsuarios(prev => {
                const map = new Map<string, UsuarioSistema>();
                // Usuários vindos diretamente da planilha oficial Google Drive
                sheetUsers.forEach(u => map.set(u.matricula.toLowerCase(), u));
                // Preservar usuário master 1001 e dados de sessão/senha/filtro configurados
                prev.forEach(u => {
                  const key = u.matricula.toLowerCase();
                  if (map.has(key)) {
                    const fromSheet = map.get(key)!;
                    map.set(key, {
                      ...fromSheet,
                      senha: u.senha || fromSheet.senha,
                      token: u.token || fromSheet.token,
                      nivel: (fromSheet.nivel && fromSheet.nivel !== 'PADRAO') ? fromSheet.nivel : (u.nivel || fromSheet.nivel),
                      filtroAcessibilidade: fromSheet.filtroAcessibilidade || u.filtroAcessibilidade
                    });
                  } else if (u.matricula === '1001') {
                    map.set('1001', u);
                  }
                });
                const merged = Array.from(map.values());
                try { localStorage.setItem('bm_usuarios', JSON.stringify(merged)); } catch {}
                return merged;
              });
            }
          }
          if (Array.isArray(json.pedidosAcesso)) {
            setPedidosRecuperacao(prev => {
              const map = new Map<string, PedidoRecuperacaoSenha>();
              json.pedidosAcesso.forEach((p: any) => {
                if (!p || !p.matricula) return;
                const pid = String(p.id || `ped-${p.matricula}-${p.dataHora || ''}`);
                map.set(pid, {
                  id: pid,
                  matricula: String(p.matricula).trim(),
                  nome: String(p.nome || `Servidor Matrícula ${p.matricula}`).trim(),
                  cargo: String(p.cargo || 'Servidor Municipal').trim(),
                  secretaria: String(p.secretaria || 'SMA').trim(),
                  departamento: String(p.departamento || '').trim(),
                  contato: String(p.contato || '').trim(),
                  dataHora: String(p.dataHora || '').trim(),
                  status: (String(p.status || 'PENDENTE').toUpperCase() as 'PENDENTE' | 'ATENDIDO' | 'CANCELADO'),
                  tipo: (String(p.tipo || 'REDEFINICAO').toUpperCase() === 'NOVO_CADASTRO' ? 'NOVO_CADASTRO' : 'REDEFINICAO'),
                  resolvidoEm: p.resolvidoEm ? String(p.resolvidoEm) : undefined,
                  resolvidoPor: p.resolvidoPor ? String(p.resolvidoPor) : undefined,
                  senhaProvisoria: p.senhaProvisoria ? String(p.senhaProvisoria) : undefined
                });
              });
              prev.forEach(localPed => {
                if (!map.has(localPed.id)) {
                  const alreadyMatchedByMat = Array.from(map.values()).some(
                    sp => sp.matricula.toLowerCase() === localPed.matricula.toLowerCase() && sp.status === localPed.status && sp.tipo === localPed.tipo
                  );
                  if (!alreadyMatchedByMat) {
                    map.set(localPed.id, localPed);
                  }
                }
              });
              const mergedPedidos = Array.from(map.values());
              try { localStorage.setItem('bm_pedidos_recuperacao', JSON.stringify(mergedPedidos)); } catch {}
              return mergedPedidos;
            });
          }
          if (json.sessaoExpirada && currentUser && currentUser.token) {
            showToast('Sua sessão expirou no servidor. Por favor, faça login novamente.', 'Sessão Expirada', true);
            handleLogout();
            return;
          }
          if (json.registrosNumeracao && Array.isArray(json.registrosNumeracao)) {
            setNumeracoes(json.registrosNumeracao);
          }
          if (!silent) {
            showToast('Modelos e histórico de numeração sincronizados com a planilha oficial!');
          }
        } else if (json && json.authRequired) {
          if (!silent && currentUser) {
            showToast('Sua sessão expirou. Por favor, faça login novamente.', 'Sessão Expirada', true);
            handleLogout();
          }
        } else if (json && json.error) {
          if (!silent) {
            showToast(json.error, 'Erro', true);
          }
        }
      } catch (err: any) {
        if (!silent) {
          showToast(`Falha de conexão com GAS: ${err.message}`, 'Erro', true);
        }
      } finally {
        setIsLoadingFromGas(false);
      }
    } else {
      try {
        // Re-extract unique suggestions from local numbers in simulation mode
        const destSet = new Set<string>(sugestoes.destinatarios);
        const assSet = new Set<string>(sugestoes.assuntos);
        numeracoes.forEach(n => {
          if (n.destinatario && n.destinatario !== 'Não informado') destSet.add(n.destinatario);
          if (n.assunto && n.assunto !== 'Sem Assunto') assSet.add(n.assunto);
        });
        setSugestoes({
          destinatarios: Array.from(destSet).sort((a, b) => a.localeCompare(b, 'pt-BR')),
          assuntos: Array.from(assSet).sort((a, b) => a.localeCompare(b, 'pt-BR'))
        });
        if (!silent) {
          showToast('Banco de dados e sugestões atualizados!');
        }
      } finally {
        setIsLoadingFromGas(false);
      }
    }
  };

  // Carga inicial automática e silenciosa da planilha Google Drive (fonte de verdade)
  useEffect(() => {
    handleSyncData(undefined, true);
  }, []);

  // -----------------------------------------------------------------
  // MÓDULO: ALTERAÇÃO DE NOME E SENHA DO SERVIDOR LOGADO
  // -----------------------------------------------------------------
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentUser) {
      setPasswordError('Nenhum usuário logado na sessão.');
      return;
    }

    const oldNome = (currentUser.nome || '').trim();
    const novoNome = (profileNameInput || '').trim();
    const nomeAlterado = novoNome.length > 0 && novoNome !== oldNome;
    const senhaDigitada = newPasswordInput.trim();
    const senhaAlterada = senhaDigitada.length > 0;

    if (novoNome.length < 3) {
      setPasswordError('O nome completo do servidor deve possuir pelo menos 3 caracteres.');
      return;
    }
    if (!nomeAlterado && !senhaAlterada) {
      setPasswordError('Altere o seu nome ou preencha os campos de nova senha para salvar.');
      return;
    }
    if (senhaAlterada) {
      if (senhaDigitada.length < 3) {
        setPasswordError('A nova senha deve possuir pelo menos 3 caracteres.');
        return;
      }
      if (newPasswordInput !== confirmPasswordInput) {
        setPasswordError('A confirmação não coincide com a nova senha digitada.');
        return;
      }
      if (currentPasswordInput && currentUser.senha && currentPasswordInput !== currentUser.senha) {
        setPasswordError('A senha atual informada está incorreta.');
        return;
      }
    }

    setIsChangingPassword(true);

    try {
      if (useRealApi) {
        if (senhaAlterada) {
          const response = await fetchWithTimeout(realApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'ALTERAR_SENHA',
              token: currentUser.token || '',
              matricula: currentUser.matricula,
              senhaAtual: currentPasswordInput,
              novaSenha: newPasswordInput,
              novoNome: nomeAlterado ? novoNome : undefined
            })
          }, 8000);
          const textResp = await response.text();
          const json = JSON.parse(textResp);
          if (!json.success) {
            setPasswordError(json.error || 'Erro ao alterar senha no servidor.');
            setIsChangingPassword(false);
            return;
          }
        }

        if (nomeAlterado) {
          const respNome = await fetchWithTimeout(realApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'SALVAR_USUARIO',
              matricula: currentUser.matricula,
              nome: novoNome,
              cargo: currentUser.cargo,
              secretaria: currentUser.secretaria,
              secretarias: currentUser.secretarias,
              departamento: currentUser.departamento,
              nivel: currentUser.nivel,
              ativo: currentUser.ativo,
              acessibilidadeDocs: currentUser.filtroAcessibilidade ? JSON.stringify(currentUser.filtroAcessibilidade) : undefined,
              usuarioAdmin: novoNome,
              token: currentUser.token || ''
            })
          }, 8500);
          const jsonNome = await respNome.json();
          if (jsonNome && !jsonNome.success && jsonNome.error) {
            setPasswordError(jsonNome.error);
            setIsChangingPassword(false);
            return;
          }
        }
      }

      // Atualiza estado local (lista de servidores, sessão ativa e signatário do Redator)
      const updatedUsers = usuarios.map(u => {
        if (u.matricula === currentUser.matricula) {
          return {
            ...u,
            ...(nomeAlterado ? { nome: novoNome } : {}),
            ...(senhaAlterada ? { senha: newPasswordInput } : {})
          };
        }
        return u;
      });
      setUsuarios(updatedUsers);
      localStorage.setItem('bm_usuarios', JSON.stringify(updatedUsers));

      const updatedCurrent: UsuarioSistema = {
        ...currentUser,
        ...(nomeAlterado ? { nome: novoNome } : {}),
        ...(senhaAlterada ? { senha: newPasswordInput } : {})
      };
      setCurrentUser(updatedCurrent);
      localStorage.setItem('sgep_user_session', JSON.stringify(updatedCurrent));

      if (nomeAlterado && (!redatorSignatario || redatorSignatario === oldNome)) {
        setRedatorSignatario(novoNome);
      }

      const acoesDesc: string[] = [];
      if (nomeAlterado) acoesDesc.push(`nome alterado de "${oldNome}" para "${novoNome}"`);
      if (senhaAlterada) acoesDesc.push('senha de acesso atualizada');

      const newLog: RegistroLog = {
        dataHora: new Date().toISOString(),
        usuario: updatedCurrent.nome,
        acao: senhaAlterada ? 'ALTERAR_SENHA' : 'ALTERAR_PERFIL',
        docId: currentUser.matricula,
        detalhes: `Atualização cadastral pelo próprio servidor (${acoesDesc.join(' e ')})`
      };
      setLogs(prev => [newLog, ...prev]);

      if (nomeAlterado && senhaAlterada) {
        showToast('Nome de exibição e senha atualizados com sucesso!');
      } else if (nomeAlterado) {
        showToast(`Seu nome foi atualizado para "${novoNome}"!`);
      } else {
        showToast('Senha alterada com sucesso! Utilize-a nos próximos acessos.');
      }

      setIsPasswordModalOpen(false);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } catch (err: any) {
      setPasswordError(`Erro de comunicação com o servidor: ${err.message}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // -----------------------------------------------------------------
  // MÓDULO: REDATOR OFICIAL DE MEMORANDO / OFÍCIO
  // -----------------------------------------------------------------
  const handleGerarNumeroNoRedator = async () => {
    setIsRedatorGeneratingNumber(true);
    const tipoDoc = redatorTipo.toUpperCase();
    const anoAtual = new Date().getFullYear().toString();
    const assuntoFinal = redatorAssunto.trim() || 'Sem Assunto Definido';
    const destinatarioFinal = redatorDestinatario.trim() || 'Não informado';
    const usuarioLogado = currentUser?.nome || 'Servidor Municipal';
    const servidorIdentificado = currentUser ? (currentUser.matricula ? `${currentUser.nome} (${currentUser.matricula})` : currentUser.nome) : 'Servidor Municipal';

    // Portão de Segurança na Emissão: garante que Secretaria e Departamento pertençam ao escopo do servidor
    const userPrimarySec = resolveCanonicalSecretariaName(currentUser?.secretaria || listaSecretariasDoUsuario[0] || 'Secretaria Municipal de Administração (SMA)', secretarias);
    let secAlvo = (redatorSecretaria && redatorSecretaria !== 'TODAS')
      ? resolveCanonicalSecretariaName(redatorSecretaria, secretarias)
      : (activeSecretaria && activeSecretaria !== 'TODAS' ? resolveCanonicalSecretariaName(activeSecretaria, secretarias) : userPrimarySec);

    if (currentUser?.nivel !== 'ADMIN' && !isUserAuthorizedForSecretaria(currentUser, secAlvo, secretarias)) {
      if (isUserAuthorizedForSecretaria(currentUser, activeSecretaria, secretarias)) {
        secAlvo = resolveCanonicalSecretariaName(activeSecretaria, secretarias);
      } else {
        secAlvo = userPrimarySec;
      }
      setRedatorSecretaria(secAlvo);
      showToast(`Emissão restrita ao seu escopo autorizado: ${secAlvo}`, 'Escopo Protegido', true);
    }

    const siglaAlvo = getSecretariaSigla(secAlvo, secretarias);
    const deptoPadraoPasta = siglaAlvo === 'SMA' ? 'Departamento de Recursos Humanos (DRH)' : 'Gabinete';
    const deptoAlvo = isUserRestrictedToDepartamento(currentUser)
      ? currentUser!.departamento!.trim()
      : (redatorSetorOrigem.trim() || currentUser?.departamento?.trim() || deptoPadraoPasta);

    if (useRealApi) {
      try {
        const response = await fetchWithTimeout(realApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'GERAR_NUMERO',
            tipoDocumento: tipoDoc,
            assunto: assuntoFinal,
            destinatario: destinatarioFinal,
            secretaria: secAlvo,
            departamento: deptoAlvo,
            servidor: servidorIdentificado,
            sigla: siglaAlvo,
            incluirSigla: incluirSiglaNoNumero,
            usuarioLogado: servidorIdentificado,
            token: currentUser?.token || ''
          })
        }, 8000);
        const textResp = await response.text();
        const json = JSON.parse(textResp);
        if (json.success && json.numeroGerado) {
          setRedatorNumero(json.numeroGerado);
          showToast(`Número ${json.numeroGerado} gerado e gravado no Google Sheets!`);
          const novoReg: RegistroNumeracao = {
            dataHora: json.dataHora || new Date().toISOString(),
            tipoDocumento: tipoDoc,
            numero: json.numeroGerado,
            assunto: assuntoFinal,
            usuario: servidorIdentificado,
            servidor: servidorIdentificado,
            destinatario: destinatarioFinal,
            secretaria: json.secretaria || secAlvo,
            departamento: json.departamento || deptoAlvo,
            incluirSigla: incluirSiglaNoNumero
          };
          setNumeracoes(prev => [novoReg, ...prev]);
          limparRascunhoRedator();
          setIsRedatorGeneratingNumber(false);
          return;
        } else {
          console.warn('Google Sheets retornou aviso. Acionando contingência local:', json.error);
          showToast('Google Sheets indisponível no momento. Gerando número no modo de contingência local...', 'Contingência');
        }
      } catch (err: any) {
        console.warn('Falha de conexão com Google Sheets. Acionando contingência local:', err);
        showToast('Google Sheets indisponível no momento. Gerando número no modo de contingência local...', 'Contingência');
      }
    }

    // Geração no modo de contingência / simulação local garantida
    await new Promise(resolve => setTimeout(resolve, 150));
    const proximoSeq = getNextSequentialForSecretaria(numeracoes, tipoDoc, secAlvo, anoAtual, secretarias);
    const seqStr = String(proximoSeq).padStart(3, '0');
    const nextNum = incluirSiglaNoNumero ? `${seqStr}/${anoAtual} - ${siglaAlvo}` : `${seqStr}/${anoAtual}`;
    const nowIso = new Date().toISOString();

    const novoReg: RegistroNumeracao = {
      dataHora: nowIso,
      tipoDocumento: tipoDoc,
      numero: nextNum,
      assunto: assuntoFinal,
      usuario: servidorIdentificado,
      servidor: servidorIdentificado,
      destinatario: destinatarioFinal,
      secretaria: secAlvo,
      departamento: deptoAlvo,
      incluirSigla: incluirSiglaNoNumero
    };

    const novoLog: RegistroLog = {
      dataHora: nowIso,
      usuario: servidorIdentificado,
      acao: 'GERAR_NUMERO',
      docId: nextNum,
      detalhes: `Emitiu ${tipoDoc} ${nextNum} (${secAlvo} - ${deptoAlvo}) | Dest: ${destinatarioFinal} | Assunto: ${assuntoFinal}`
    };

    setNumeracoes(prev => [novoReg, ...prev]);
    setLogs(prev => [novoLog, ...prev]);
    setRedatorNumero(nextNum);

    // Adiciona aos datalists de sugestões
    setSugestoes(prev => {
      const destSet = new Set(prev.destinatarios);
      const assSet = new Set(prev.assuntos);
      if (destinatarioFinal && destinatarioFinal !== 'Não informado') destSet.add(destinatarioFinal);
      if (assuntoFinal && assuntoFinal !== 'Sem Assunto Definido') assSet.add(assuntoFinal);
      return {
        destinatarios: Array.from(destSet).sort((a, b) => a.localeCompare(b, 'pt-BR')),
        assuntos: Array.from(assSet).sort((a, b) => a.localeCompare(b, 'pt-BR'))
      };
    });

    limparRascunhoRedator();
    showToast(`Número oficial ${nextNum} gerado com sucesso para ${secAlvo}!`);
    setIsRedatorGeneratingNumber(false);
  };

  const handleFinalizarDocumentoRedator = async () => {
    if (!redatorNumero) {
      await handleGerarNumeroNoRedator();
    }
    showToast('Documento oficial registrado no Livro de Numeração!');
    setIsRedatorLetterheadOpen(true);
  };

  // Geração e Aprimoramento de Texto com IA (Gemini)
  const handleGerarTextoComIA = async (acaoTipo: 'NOVO_TEXTO' | 'APRIMORAR' | 'FORMALIZAR' | 'RESUMIR' = 'NOVO_TEXTO', instrucoesCustom?: string) => {
    setIsGeneratingAiText(true);
    const instrucaoFinal = instrucoesCustom !== undefined ? instrucoesCustom : aiPromptInput;

    // Salva cópia do texto atual para permitir desfazer
    if (redatorTexto) {
      setTextoAnteriorRedator(redatorTexto);
    }

    try {
      const response = await fetchWithTimeout('/api/ai/gerar-redacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoDocumento: redatorTipo,
          assunto: redatorAssunto,
          destinatario: redatorDestinatario,
          secretaria: redatorSecretaria,
          signatario: redatorSignatario,
          cargo: redatorCargo,
          instrucoes: instrucaoFinal,
          textoAtual: redatorTexto,
          acao: acaoTipo
        })
      }, 18000);

      const data = await response.json();
      if (data.success && data.texto) {
        setRedatorTexto(data.texto);
        if (acaoTipo === 'APRIMORAR') {
          showToast('Texto aprimorado segundo o Manual de Redação Oficial!');
        } else if (acaoTipo === 'FORMALIZAR') {
          showToast('Vocabulário formalizado no padrão institucional da PMRC!');
        } else if (acaoTipo === 'RESUMIR') {
          showToast('Documento sintetizado com sucesso pela IA!');
        } else {
          showToast('Redação oficial gerada com IA (Gemini) com sucesso!');
        }
        setIsAiHelperOpen(false);
        setAiPromptInput('');
      } else {
        throw new Error(data.error || 'Falha ao processar texto pela IA');
      }
    } catch (err: any) {
      console.warn('Utilizando motor de redação municipal local:', err);
      // Fallback local robusto para não deixar o usuário desassistido
      let fallbackText = '';
      const dest = redatorDestinatario || 'este setor';
      const ass = redatorAssunto || 'assunto de interesse público municipal';

      if (redatorTipo === 'DECRETO') {
        fallbackText = `O PREFEITO MUNICIPAL DE RIO CLARO, Estado do Rio de Janeiro, no uso de suas atribuições legais que lhe confere a Lei Orgânica do Município de Rio Claro, e\n\nCONSIDERANDO a conveniência administrativa e o interesse público na disciplina das matérias relativas a ${ass};\n${instrucaoFinal ? `CONSIDERANDO que ${instrucaoFinal.trim()};\n` : ''}\nDECRETA:\n\nArt. 1º Fica disciplinado, no âmbito da Administração Pública Municipal Direta e Indireta, o procedimento concernente a ${ass}.\n\nArt. 2º Caberá aos órgãos e secretarias municipais competentes a adoção de todas as providências operacionais necessárias à plena execução deste Decreto.\n\nArt. 3º Este Decreto entra em vigor na data de sua publicação, revogadas as disposições em contrário.`;
      } else if (redatorTipo === 'PORTARIA') {
        fallbackText = `O SECRETÁRIO MUNICIPAL DE ADMINISTRAÇÃO DE RIO CLARO, Estado do Rio de Janeiro, no uso de suas atribuições legais e em conformidade com a legislação municipal em vigor,\n\nRESOLVE:\n\nArt. 1º ${instrucaoFinal ? instrucaoFinal.trim() : `Disciplinar as medidas administrativas e operacionais no âmbito desta pasta relativas a ${ass}.`}\n\nArt. 2º Caberá aos setores competentes o cumprimento das diretrizes estabelecidas no presente ato normativo.\n\nArt. 3º Esta Portaria entra em vigor na data de sua publicação, revogadas as disposições em contrário.`;
      } else if (redatorTipo === 'EMAIL') {
        if (acaoTipo === 'APRIMORAR') {
          fallbackText = `Prezado(a) ${dest},\n\nEm atenção ao expediente relativo ao assunto "${ass}", sirvo-me do presente para formalizar as ponderações necessárias no âmbito da ${redatorSecretaria}.\n\n${redatorTexto}\n\nSolicitamos a gentileza de analisar as informações e acusar o recebimento desta mensagem, adotando as medidas cabíveis no prazo regulamentar.\n\nPermanecemos à disposição para eventuais esclarecimentos complementares.\n\nAtenciosamente,\n\n${redatorSignatario}\n${redatorCargo}\n${redatorSecretaria}\nPrefeitura Municipal de Rio Claro – RJ`;
        } else if (acaoTipo === 'RESUMIR') {
          fallbackText = `Prezado(a) ${dest},\n\nEm síntese, comunicamos que, quanto ao assunto "${ass}", solicitam-se as providências administrativas cabíveis no âmbito de vossa competência.\n\nAtenciosamente,\n\n${redatorSignatario}\n${redatorCargo}\n${redatorSecretaria}\nPrefeitura Municipal de Rio Claro – RJ`;
        } else {
          fallbackText = `Prezado(a) ${dest},\n\nEscrevo em nome da ${redatorSecretaria} da Prefeitura Municipal de Rio Claro – RJ, referente ao assunto "${ass}".\n\n${instrucaoFinal ? `Informamos especificamente que: ${instrucaoFinal.trim()}.\n\n` : ''}Solicitamos a gentileza de analisar as informações e acusar o recebimento desta mensagem, bem como adotar as providências administrativas cabíveis no prazo regulamentar.\n\nPermanecemos à disposição para prestar quaisquer esclarecimentos complementares.\n\nAtenciosamente,\n\n${redatorSignatario}\n${redatorCargo}\n${redatorSecretaria}\nPrefeitura Municipal de Rio Claro – RJ`;
        }
      } else if (acaoTipo === 'APRIMORAR') {
        fallbackText = `Cumprimentando-o cordialmente, sirvo-me do presente para formalizar as ponderações relativas a ${ass}.\n\n${redatorTexto}\n\nReiteramos que a presente comunicação visa a assegurar a máxima celeridade, eficiência e transparência no âmbito da Prefeitura Municipal de Rio Claro – RJ.`;
      } else if (acaoTipo === 'FORMALIZAR') {
        fallbackText = `Cumprimentando-o cordialmente, sirvo-me do presente para formalizar a Vossa Senhoria as manifestações institucionais concernentes a ${ass}.\n\nSolicitamos a adoção das medidas administrativas cabíveis no âmbito de vossa competência, visando ao regular andamento dos serviços desta municipalidade.`;
      } else if (acaoTipo === 'RESUMIR') {
        fallbackText = `Em síntese, sirvo-me do presente para comunicar que, referente a ${ass}, solicitam-se as providências administrativas pertinentes à luz das diretrizes municipais vigentes.`;
      } else {
        fallbackText = `Cumprimentando-o cordialmente, sirvo-me do presente para solicitar a Vossa Senhoria as informações e levantamentos administrativos pertinentes a ${ass}, em atendimento às diretrizes institucionais vigentes.${instrucaoFinal ? `\n\nInformo especificamente que: ${instrucaoFinal.trim()}.` : ''}\n\nAs providências visam a assegurar a máxima conformidade legal, celeridade e transparência aos atos da administração de Rio Claro – RJ.`;
      }
      setRedatorTexto(fallbackText);
      showToast(
        redatorTipo === 'DECRETO'
          ? 'Decreto Municipal redigido no padrão da LC 95/98!'
          : redatorTipo === 'PORTARIA'
          ? 'Portaria Municipal redigida com rigor formal!'
          : redatorTipo === 'EMAIL'
          ? 'E-mail institucional elaborado no padrão administrativo!'
          : 'Redação oficial elaborada no padrão administrativo!'
      );
      setIsAiHelperOpen(false);
    } finally {
      setIsGeneratingAiText(false);
    }
  };

  // Remove tabulações, espaços não-quebráveis e recuos residuais de início de linha
  // para que apenas as margens e recuos configurados no editor governem o documento.
  const sanitizarTextoSemTabulacaoResidual = (texto: string): string => {
    if (!texto) return '';
    return texto
      .replace(/^\uFEFF/, '')
      .replace(/\r\n?/g, '\n')
      .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000\t]+/g, ' ')
      .split('\n')
      .map(linha => linha.replace(/^[ ]+|[ ]+$/g, '').replace(/[ ]{2,}/g, ' '))
      .join('\n');
  };

  const handleCarregarModeloNoRedator = (modeloId: string) => {
    const mod = modelos.find(m => m.ID === modeloId);
    if (!mod) return;
    setRedatorModeloVinculado(mod);
    setRedatorTexto(sanitizarTextoSemTabulacaoResidual(mod.Texto));
    if (mod.Assunto || mod.Titulo) setRedatorAssunto(mod.Assunto || mod.Titulo);
    if (mod.SetorDestino) setRedatorDestinatario(mod.SetorDestino);
    const tipoMod = (mod.TipoDocumento || '').toUpperCase();
    const tiposSuportados = ['MEMORANDO', 'OFICIO', 'DESPACHO', 'CIRCULAR', 'PORTARIA', 'DECRETO', 'ATO', 'TERMO', 'EMAIL'];
    if (tiposSuportados.includes(tipoMod)) {
      setRedatorTipo(tipoMod as any);
    } else if (tipoMod === 'DECISAO') {
      setRedatorTipo('ATO');
    }
    if (tipoMod === 'TERMO') {
      setRedatorModoAssinatura('TAC_CAC');
      setRedatorFecho('E, por estarem plenamente acordados, firmam o presente termo em 3 (três) vias de igual teor.');
    } else if (tipoMod === 'ATO' && (mod.Area || '').toLowerCase().includes('disciplin')) {
      setRedatorFecho('Comissão de Processo Administrativo Disciplinar / Sindicância');
      if (redatorModoAssinatura === 'INDIVIDUAL' && (mod.Texto || '').toLowerCase().includes('vogal')) {
        mudarModoAssinatura('COMISSAO_PAD');
      }
    }
    showToast(`Texto do modelo "${mod.Titulo}" carregado no redator!`);
  };

  // Ações da Barra de Ferramentas de Formatação Oficial
  const salvarHistorico = (novoTexto: string) => {
    setRedatorHistoricoUndo(prev => [redatorTexto, ...prev.slice(0, 25)]);
    setRedatorHistoricoRedo([]);
    setRedatorTexto(novoTexto);
  };

  const handleDesfazerFormatacao = () => {
    if (redatorHistoricoUndo.length === 0) {
      showToast('Nenhuma alteração para desfazer.');
      return;
    }
    const anterior = redatorHistoricoUndo[0];
    setRedatorHistoricoRedo(prev => [redatorTexto, ...prev.slice(0, 25)]);
    setRedatorHistoricoUndo(prev => prev.slice(1));
    setRedatorTexto(anterior);
    showToast('Alteração desfeita.');
  };

  const handleRefazerFormatacao = () => {
    if (redatorHistoricoRedo.length === 0) {
      showToast('Nenhuma alteração para refazer.');
      return;
    }
    const proximo = redatorHistoricoRedo[0];
    setRedatorHistoricoUndo(prev => [redatorTexto, ...prev.slice(0, 25)]);
    setRedatorHistoricoRedo(prev => prev.slice(1));
    setRedatorTexto(proximo);
    showToast('Alteração refeita.');
  };

  const aplicarFormatacaoSelecao = (antes: string, depois: string, placeholder = 'texto') => {
    const ta = redatorTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    const hasSelection = start !== end;
    const sel = val.substring(start, end) || placeholder;
    const novoTexto = val.substring(0, start) + antes + sel + depois + val.substring(end);
    salvarHistorico(novoTexto);
    setTimeout(() => {
      ta.focus();
      if (hasSelection) {
        ta.setSelectionRange(start + antes.length, start + antes.length + sel.length);
      } else {
        ta.setSelectionRange(start + antes.length, start + antes.length + placeholder.length);
      }
    }, 10);
  };

  const aplicarPrefixoLinha = (prefixo: string, placeholder = 'Item') => {
    const ta = redatorTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    const sel = val.substring(start, end);
    let novo = '';
    if (sel) {
      novo = sel.split('\n').map(l => (l.trim() ? `${prefixo}${l}` : l)).join('\n');
    } else {
      if (prefixo === '---') {
        novo = `\n---\n`;
      } else {
        novo = `\n${prefixo}${placeholder}\n`;
      }
    }
    const novoTexto = val.substring(0, start) + novo + val.substring(end);
    salvarHistorico(novoTexto);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + novo.length, start + novo.length);
    }, 10);
  };

  const handleLimparFormatacaoRedator = () => {
    const ta = redatorTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    const sel = val.substring(start, end);
    const limpar = (str: string) => str
      .replace(/\*\*/g, '')
      .replace(/(?<!\*)\*(?!\*)/g, '')
      .replace(/<u>|<\/u>/gi, '')
      .replace(/<mark>|<\/mark>/gi, '')
      .replace(/~~/g, '')
      .replace(/<del>|<\/del>/gi, '')
      .replace(/<s>|<\/s>/gi, '')
      .replace(/^[-•*]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/^[IVXLCDM]+\s*[-–]\s*/gm, '')
      .replace(/^[a-z]\)\s*/gm, '')
      .replace(/^>\s+/gm, '')
      .replace(/^---\s*$/gm, '');
    
    let novoTexto = '';
    if (sel) {
      novoTexto = val.substring(0, start) + sanitizarTextoSemTabulacaoResidual(limpar(sel)) + val.substring(end);
    } else {
      novoTexto = sanitizarTextoSemTabulacaoResidual(limpar(val));
    }
    salvarHistorico(novoTexto);
    showToast('Formatação e tabulações residuais removidas.');
  };

  // Funções e Handlers da Régua A4 (0–21 cm): Margens (Esq/Dir) + Recuos (1ª e 2ª Linha)
  const handleAlterarRecuo = (novoRecuo: number) => {
    const clamped = Math.round(Math.max(0, Math.min(8, novoRecuo)) * 100) / 100;
    setRedatorRecuoParagrafo(clamped);
    try {
      localStorage.setItem('bm_redator_recuo', String(clamped));
    } catch {}
  };

  const getDescricaoRecuo = (cm: number) => {
    if (cm === 0) return 'Sem recuo (Margem reta)';
    if (Math.abs(cm - 1.25) < 0.01) return 'Padrão ABNT (1,25 cm)';
    if (Math.abs(cm - 1.5) < 0.01) return 'Padrão Oficial PMRC (1,50 cm - Recomendado)';
    if (Math.abs(cm - 2.0) < 0.01) return 'Recuo Amplo (2,00 cm)';
    if (Math.abs(cm - 2.5) < 0.01) return 'Padrão Ofício / Memo (2,50 cm)';
    if (Math.abs(cm - 4.0) < 0.01) return 'Citação / Parecer Normativo (4,00 cm)';
    return `${cm.toFixed(2).replace('.', ',')} cm`;
  };

  const getDescricaoRecuoSegundaLinha = (cm: number) => {
    if (cm === 0) return 'Sem recuo (Alinhada à margem - Padrão Oficial)';
    if (Math.abs(cm - 0.75) < 0.01) return 'Recuo suave (0,75 cm)';
    if (Math.abs(cm - 1.0) < 0.01) return 'Recuo intermediário (1,00 cm)';
    if (Math.abs(cm - 1.25) < 0.01) return 'ABNT deslocado (1,25 cm)';
    if (Math.abs(cm - 1.5) < 0.01) return 'Recuo alinhado (1,50 cm)';
    if (Math.abs(cm - 2.0) < 0.01) return 'Recuo acentuado / Citação (2,00 cm)';
    return `${cm.toFixed(2).replace('.', ',')} cm`;
  };

  const [reguaArrastandoAlvo, setReguaArrastandoAlvo] = useState<'primeira' | 'segunda' | 'margemEsq' | 'margemDir'>('primeira');

  const aplicarPosicaoReguaA4 = (
    clientX: number,
    alvo: 'primeira' | 'segunda' | 'margemEsq' | 'margemDir'
  ) => {
    if (!reguaBarraRef.current) return;
    const rect = reguaBarraRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const cmA4 = (x / rect.width) * 21; // Escala real A4 (21 cm)

    if (alvo === 'margemEsq') {
      const novaEsq = Math.round(Math.max(1.0, Math.min(6.0, cmA4)) * 10) / 10;
      handleAlterarMargem('esq', novaEsq);
    } else if (alvo === 'margemDir') {
      const novaDir = Math.round(Math.max(1.0, Math.min(6.0, 21 - cmA4)) * 10) / 10;
      handleAlterarMargem('dir', novaDir);
    } else if (alvo === 'primeira') {
      const maxRecuo = Math.min(8, Math.max(0, 21 - redatorMargemEsquerda - redatorMargemDireita - 1));
      const recuo = Math.max(0, Math.min(maxRecuo, cmA4 - redatorMargemEsquerda));
      handleAlterarRecuo(Math.round(recuo * 4) / 4);
    } else {
      const maxRecuo = Math.min(8, Math.max(0, 21 - redatorMargemEsquerda - redatorMargemDireita - 1));
      const recuo = Math.max(0, Math.min(maxRecuo, cmA4 - redatorMargemEsquerda));
      handleAlterarRecuoSegundaLinha(Math.round(recuo * 4) / 4);
    }
  };

  const handleReguaMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    alvo: 'primeira' | 'segunda' | 'margemEsq' | 'margemDir' = 'primeira'
  ) => {
    if (!reguaBarraRef.current) return;
    setReguaArrastandoAlvo(alvo);
    aplicarPosicaoReguaA4(e.clientX, alvo);
    setIsArrastandoRegua(true);
  };

  // Listener global para arrastar margens ou recuos pela régua A4
  useEffect(() => {
    if (!isArrastandoRegua) return;
    const handleMouseMove = (e: MouseEvent) => {
      aplicarPosicaoReguaA4(e.clientX, reguaArrastandoAlvo);
    };
    const handleMouseUp = () => {
      setIsArrastandoRegua(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isArrastandoRegua, reguaArrastandoAlvo, redatorMargemEsquerda, redatorMargemDireita]);

  // Ferramenta de Tabulação e Recuo (Tab / Shift+Tab): controlada exclusivamente pela régua do editor,
  // sem inserir espaços/tabs residuais no texto bruto.
  const handleTabularTexto = (direcao: 'aumentar' | 'diminuir' = 'aumentar') => {
    const delta = direcao === 'aumentar' ? 0.5 : -0.5;
    const maxRecuo = Math.min(8, Math.max(0, 21 - redatorMargemEsquerda - redatorMargemDireita - 1));
    const novoRecuo = Math.max(0, Math.min(maxRecuo, Math.round((redatorRecuoParagrafo + delta) * 100) / 100));
    handleAlterarRecuo(novoRecuo);

    // Limpa eventuais tabulações/espaços residuais já presentes no início das linhas
    const textoLimpo = sanitizarTextoSemTabulacaoResidual(redatorTexto);
    if (textoLimpo !== redatorTexto) {
      salvarHistorico(textoLimpo);
    }
  };

  // Conversor Universal de Formatação Oficial para HTML (Prévia, Word e Impressão)
  const converterTextoOficialHTML = (
    texto: string,
    modo: 'preview' | 'word' | 'print' = 'preview',
    fonte: 'Times New Roman' | 'Arial' | 'Calibri' = redatorFonte,
    tamanho: '12pt' | '11pt' | '10pt' = redatorTamanhoFonte,
    alinhamento: 'justify' | 'left' | 'center' = redatorAlinhamento,
    recuoPrimeiraLinha: number = redatorRecuoParagrafo,
    recuoSegundaLinha: number = redatorRecuoSegundaLinha
  ) => {
    if (!texto) return '';

    const textoLimpo = sanitizarTextoSemTabulacaoResidual(texto)
      .replace(/&nbsp;|&#160;|&#xA0;|&#9;|&#x9;/gi, ' ');

    let seguro = textoLimpo
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Restaura tags seguras de formatação
    seguro = seguro
      .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<u>$1</u>')
      .replace(/&lt;mark&gt;([\s\S]*?)&lt;\/mark&gt;/gi, '<mark>$1</mark>')
      .replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/gi, '<strong>$1</strong>')
      .replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/gi, '<em>$1</em>')
      .replace(/&lt;s&gt;([\s\S]*?)&lt;\/s&gt;/gi, '<del>$1</del>')
      .replace(/&lt;del&gt;([\s\S]*?)&lt;\/del&gt;/gi, '<del>$1</del>');

    // Negrito: **texto**
    seguro = seguro.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Itálico: *texto*
    seguro = seguro.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    // Sublinhado: __texto__
    seguro = seguro.replace(/__(.*?)__/g, '<u>$1</u>');
    // Tachado: ~~texto~~
    seguro = seguro.replace(/~~(.*?)~~/g, '<del>$1</del>');
    // Marca-texto: ==texto==
    seguro = seguro.replace(/==(.*?)==/g, '<mark>$1</mark>');

    // Formatação de U com inline style explícito para garantir renderização imediata na prévia
    seguro = seguro.replace(/<u>([\s\S]*?)<\/u>/gi, modo === 'word'
      ? '<span style="text-decoration: underline;">$1</span>'
      : '<u style="text-decoration: underline !important;">$1</u>'
    );

    // Formatação de DEL / S com inline style explícito
    seguro = seguro.replace(/<del>([\s\S]*?)<\/del>/gi, modo === 'word'
      ? '<span style="text-decoration: line-through;">$1</span>'
      : '<del style="text-decoration: line-through !important; opacity: 0.85;">$1</del>'
    );

    // Destacar pendências de [CAMPOS]
    seguro = seguro.replace(/\[([A-Z0-9_\-/\s]{3,})\]/g, modo === 'word'
      ? '<span style="background-color: #fef3c7; color: #92400e; border: 1pt solid #f59e0b; padding: 1px 4px; font-weight: bold; font-family: monospace;">[$1]</span>'
      : '<span style="background-color: #fef3c7; color: #92400e; border: 1px solid #f59e0b; padding: 1px 5px; border-radius: 3px; font-family: monospace; font-size: 11px; font-weight: bold;">[$1]</span>'
    );

    // Marca-texto estilizado
    seguro = seguro.replace(/<mark>([\s\S]*?)<\/mark>/gi, modo === 'word'
      ? '<span style="background-color: #fef08a; color: #713f12; padding: 0 2px;">$1</span>'
      : '<mark style="background-color: #fef08a !important; color: #713f12 !important; padding: 1px 4px !important; border-radius: 2px !important;">$1</mark>'
    );

    const linhas = seguro.split('\n');
    let htmlFinal = '';
    let emListaUL = false;
    let emListaOL = false;
    let paragrafoAtual: string[] = [];

    const fecharP = () => {
      if (paragrafoAtual.length > 0) {
        const conteudo = paragrafoAtual.join('<br>');
        // Cálculo exato de recuo da 1ª e 2ª linha controlado exclusivamente pela régua do editor:
        // Se 1ª linha = A cm e 2ª linha = B cm:
        // No CSS: padding-left: B cm; text-indent: (A - B) cm;
        // No Word: margin-left: B cm; text-indent: (A - B) cm;
        const recuo1 = Number.isFinite(recuoPrimeiraLinha) ? Math.max(0, recuoPrimeiraLinha) : 0;
        const recuo2 = Number.isFinite(recuoSegundaLinha) ? Math.max(0, recuoSegundaLinha) : 0;
        const diffIndent = (recuo1 - recuo2).toFixed(2);
        const padLeft = recuo2.toFixed(2);

        const indentCss = recuo2 > 0
          ? `margin-left: 0; margin-right: 0; padding-left: ${padLeft}cm; text-indent: ${diffIndent}cm;`
          : `margin-left: 0; margin-right: 0; padding-left: 0; text-indent: ${recuo1 > 0 ? `${recuo1.toFixed(2)}cm` : '0'};`;

        if (modo === 'word') {
          const wordMarginLeft = recuo2 > 0 ? `${padLeft}cm` : '0';
          const wordIndent = recuo2 > 0 ? `${diffIndent}cm` : (recuo1 > 0 ? `${recuo1.toFixed(2)}cm` : '0');
          htmlFinal += `<p style="margin: 0 0 10pt ${wordMarginLeft}; padding: 0; text-indent: ${wordIndent}; mso-char-indent-count: 0; text-align: ${alinhamento}; line-height: 1.5; font-size: ${tamanho}; mso-line-height-rule: exactly;">${conteudo}</p>`;
        } else {
          htmlFinal += `<p class="mb-3 leading-relaxed" style="text-align: ${alinhamento}; ${indentCss} font-size: ${tamanho};">${conteudo}</p>`;
        }
        paragrafoAtual = [];
      }
    };

    const fecharListas = () => {
      if (emListaUL) {
        htmlFinal += '</ul>';
        emListaUL = false;
      }
      if (emListaOL) {
        htmlFinal += '</ol>';
        emListaOL = false;
      }
    };

    for (let i = 0; i < linhas.length; i++) {
      const l = linhas[i].replace(/^[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\t]+|[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\t]+$/g, '');
      if (!l) {
        fecharP();
        fecharListas();
        continue;
      }

      // Linha horizontal divisória
      if (l === '---' || l === '***' || l === '___') {
        fecharP();
        fecharListas();
        htmlFinal += modo === 'word'
          ? '<div style="border-top: 1pt solid #cbd5e1; margin: 12pt 0; height: 1pt;"></div>'
          : '<hr class="my-3 border-slate-300 dark:border-slate-700" />';
        continue;
      }

      // Citação / Recuo de Bloco
      if (l.startsWith('&gt; ') || l.startsWith('> ')) {
        fecharP();
        fecharListas();
        const textoCitacao = l.replace(/^(&gt;|>)\s*/, '');
        htmlFinal += modo === 'word'
          ? `<blockquote style="margin: 8pt 0 8pt 2cm; padding-left: 10pt; border-left: 2.5pt solid #002b82; font-style: italic; font-size: 10pt; line-height: 1.35; color: #334155;">${textoCitacao}</blockquote>`
          : `<blockquote style="border-left: 3px solid #002b82 !important; padding-left: 0.75rem !important; margin: 0.5rem 0 0.5rem 1.5rem !important; font-style: italic !important; color: #334155 !important;" class="text-[11px]">${textoCitacao}</blockquote>`;
        continue;
      }

      // Lista com marcadores
      if (l.startsWith('- ') || l.startsWith('• ') || l.startsWith('* ')) {
        fecharP();
        if (emListaOL) {
          htmlFinal += '</ol>';
          emListaOL = false;
        }
        if (!emListaUL) {
          htmlFinal += modo === 'word'
            ? '<ul style="margin: 0 0 10pt 1.5cm; padding-left: 0;">'
            : '<ul class="my-2 space-y-1" style="list-style-type: disc !important; padding-left: 2rem !important; margin: 0.5rem 0 !important;">';
          emListaUL = true;
        }
        const itemTexto = l.replace(/^([-•*])\s+/, '');
        htmlFinal += modo === 'word'
          ? `<li style="margin-bottom: 4pt; text-align: justify; line-height: 1.4;">${itemTexto}</li>`
          : `<li style="list-style-type: disc !important; margin-bottom: 0.25rem;">${itemTexto}</li>`;
        continue;
      }

      // Lista numerada
      const numMatch = l.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        fecharP();
        if (emListaUL) {
          htmlFinal += '</ul>';
          emListaUL = false;
        }
        if (!emListaOL) {
          htmlFinal += modo === 'word'
            ? '<ol style="margin: 0 0 10pt 1.5cm; padding-left: 0;">'
            : '<ol class="my-2 space-y-1" style="list-style-type: decimal !important; padding-left: 2rem !important; margin: 0.5rem 0 !important;">';
          emListaOL = true;
        }
        htmlFinal += modo === 'word'
          ? `<li style="margin-bottom: 4pt; text-align: justify; line-height: 1.4;">${numMatch[2]}</li>`
          : `<li style="list-style-type: decimal !important; margin-bottom: 0.25rem;">${numMatch[2]}</li>`;
        continue;
      }

      // Parágrafo comum (inclui incisos/alíneas sob controle exclusivo das margens e recuos do editor)
      fecharListas();
      paragrafoAtual.push(l);
    }

    fecharP();
    fecharListas();

    return htmlFinal;
  };

  // Helper oficial unificado de nomenclatura de arquivo de documentos da Prefeitura de Rio Claro
  // Exemplo: 'Memo 757-2026 - SMA - Quantitativo de Servidores e Informações de Folha.pdf'
  const getOfficialDocFileName = (extension: 'pdf' | 'doc' | 'txt') => {
    const tipoNome = redatorTipo === 'MEMORANDO' ? 'Memo'
      : redatorTipo === 'OFICIO' ? 'Oficio'
      : redatorTipo === 'DESPACHO' ? 'Despacho'
      : redatorTipo === 'PORTARIA' ? 'Portaria'
      : redatorTipo === 'DECRETO' ? 'Decreto'
      : redatorTipo === 'CIRCULAR' ? 'Circular'
      : redatorTipo === 'EMAIL' ? 'Email'
      : redatorTipo === 'ATO' ? 'Ato_Disciplinar'
      : redatorTipo === 'TERMO' ? 'Termo_CAC'
      : redatorTipo;

    let numPart = (redatorNumero || 'minuta').trim();
    if (numPart.includes('-')) {
      numPart = numPart.split('-')[0].trim();
    }
    const numLimpo = numPart.replace(/\//g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
    const sigla = getSecretariaSigla(redatorSecretaria, secretarias) || 'SMA';
    const assuntoLimpo = (redatorAssunto || 'Documento Oficial')
      .replace(/[/\\?%*:|"<>]/g, '')
      .trim()
      .replace(/\s+/g, ' ');

    return redatorTipo === 'EMAIL'
      ? `Email - ${sigla} - ${assuntoLimpo}.${extension}`
      : `${tipoNome} ${numLimpo} - ${sigla} - ${assuntoLimpo}.${extension}`;
  };

  // Helper para renderizar assinaturas individuais ou de Comissão Processante no Word (.doc / MHTML)
  const renderAssinaturasHtmlWord = () => {
    const sec = redatorSecretaria.trim() || 'Secretaria Municipal de Administração (SMA)';
    if (redatorModoAssinatura === 'INDIVIDUAL') {
      const sig = redatorSignatario.trim() || (redatorTipo === 'DECRETO' ? 'Prefeito Municipal' : 'Augusto Lourenço da Silva Júnior');
      const cargo = redatorCargo.trim() || (redatorTipo === 'DECRETO' ? 'Prefeito Municipal de Rio Claro' : 'Chefe de Divisão de Treinamento e RH');
      return `
        <div class="sig-block" style="margin-top: 36pt; text-align: center; text-indent: 0; page-break-inside: avoid;">
          <div class="sig-line" style="width: 240pt; border-top: 1pt solid #000000; margin: 0 auto 6pt auto;"></div>
          <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 11pt; color: #000000;">${sig}</div>
          <div style="font-family: Arial, sans-serif; font-style: italic; font-size: 9.5pt; color: #333333;">${cargo}</div>
          <div style="font-family: Arial, sans-serif; font-size: 9pt; color: #002b82; font-weight: bold;">${sec}</div>
          <div style="font-family: Arial, sans-serif; font-size: 8.5pt; color: #666666;">Prefeitura Municipal de Rio Claro – RJ</div>
        </div>
      `;
    }

    if (redatorModoAssinatura === 'COMISSAO_PAD' || redatorMembrosComissao.length === 3) {
      return `
        <div style="margin-top: 36pt; page-break-inside: avoid; mso-page-break-inside: avoid;">
          <p style="text-align: center; font-family: Arial, sans-serif; font-weight: bold; font-size: 10pt; color: #002b82; text-transform: uppercase; margin-bottom: 20pt; text-indent: 0;">
            COMISSÃO PROCESSANTE DE SINDICÂNCIA E PAD
          </p>
          <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; text-align: center;">
            <tr>
              ${redatorMembrosComissao.map(m => `
                <td width="33%" valign="top" style="width: 33%; text-align: center; padding: 0 6pt;">
                  <div style="border-top: 1pt solid #000000; width: 130pt; margin: 0 auto 6pt auto;"></div>
                  <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 10pt; color: #000000;">${m.nome}</div>
                  <div style="font-family: Arial, sans-serif; font-size: 9pt; font-weight: bold; color: #002b82;">${m.funcao}</div>
                  <div style="font-family: Arial, sans-serif; font-size: 8.5pt; font-style: italic; color: #475569;">${m.cargoEfetivo}</div>
                  <div style="font-family: Arial, sans-serif; font-size: 8pt; color: #64748b;">Matrícula nº ${m.matricula}</div>
                </td>
              `).join('')}
            </tr>
          </table>
          <p style="text-align: center; font-family: Arial, sans-serif; font-size: 8pt; color: #64748b; margin-top: 14pt; text-indent: 0;">
            Prefeitura Municipal de Rio Claro – RJ
          </p>
        </div>
      `;
    }

    return `
      <div style="margin-top: 36pt; page-break-inside: avoid; mso-page-break-inside: avoid;">
        <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; text-align: center;">
          ${Array.from({ length: Math.ceil(redatorMembrosComissao.length / 2) }).map((_, rowIdx) => {
            const m1 = redatorMembrosComissao[rowIdx * 2];
            const m2 = redatorMembrosComissao[rowIdx * 2 + 1];
            return `
              <tr>
                <td width="50%" valign="top" style="width: 50%; text-align: center; padding: 10pt 12pt;">
                  ${m1 ? `
                    <div style="border-top: 1pt solid #000000; width: 150pt; margin: 0 auto 6pt auto;"></div>
                    <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 10pt; color: #000000;">${m1.nome}</div>
                    <div style="font-family: Arial, sans-serif; font-size: 9pt; font-weight: bold; color: #002b82;">${m1.funcao}</div>
                    <div style="font-family: Arial, sans-serif; font-size: 8.5pt; font-style: italic; color: #475569;">${m1.cargoEfetivo}</div>
                    <div style="font-family: Arial, sans-serif; font-size: 8pt; color: #64748b;">Matrícula nº ${m1.matricula}</div>
                  ` : ''}
                </td>
                <td width="50%" valign="top" style="width: 50%; text-align: center; padding: 10pt 12pt;">
                  ${m2 ? `
                    <div style="border-top: 1pt solid #000000; width: 150pt; margin: 0 auto 6pt auto;"></div>
                    <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 10pt; color: #000000;">${m2.nome}</div>
                    <div style="font-family: Arial, sans-serif; font-size: 9pt; font-weight: bold; color: #002b82;">${m2.funcao}</div>
                    <div style="font-family: Arial, sans-serif; font-size: 8.5pt; font-style: italic; color: #475569;">${m2.cargoEfetivo}</div>
                    <div style="font-family: Arial, sans-serif; font-size: 8pt; color: #64748b;">Matrícula nº ${m2.matricula}</div>
                  ` : ''}
                </td>
              </tr>
            `;
          }).join('')}
        </table>
        <p style="text-align: center; font-family: Arial, sans-serif; font-size: 8pt; color: #64748b; margin-top: 10pt; text-indent: 0;">
          Prefeitura Municipal de Rio Claro – RJ
        </p>
      </div>
    `;
  };

  // Helper para renderizar assinaturas individuais ou da Comissão em JSX (Prévia e Impressão Nativa)
  const renderAssinaturasJSX = (isPrint: boolean = false) => {
    if (redatorModoAssinatura === 'INDIVIDUAL') {
      return (
        <div id="assinatura-timbrado" className={`assinatura-timbrado avoid-break text-center pt-6 max-w-sm mx-auto font-sans ${isPrint ? 'mt-10' : 'mt-6'}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <div className="w-52 h-[1px] bg-slate-400 mx-auto mb-2"></div>
          <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{redatorSignatario}</p>
          <p className="text-[11px] text-slate-700 dark:text-slate-300 italic">{redatorCargo}</p>
          <p className="text-[10px] text-[#002b82] dark:text-sky-400 font-semibold">{redatorSecretaria}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Prefeitura Municipal de Rio Claro – RJ</p>
        </div>
      );
    }

    if (redatorModoAssinatura === 'COMISSAO_PAD' || redatorMembrosComissao.length === 3) {
      return (
        <div id="assinatura-timbrado" className={`assinatura-timbrado avoid-break pt-6 border-t border-slate-200 dark:border-slate-700 font-sans ${isPrint ? 'mt-10' : 'mt-6'}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <div className="text-center mb-4">
            <span className="text-[11px] font-black text-[#002b82] dark:text-sky-400 tracking-wider uppercase">
              COMISSÃO PROCESSANTE DE SINDICÂNCIA E PAD
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {redatorMembrosComissao.map((m, idx) => (
              <div key={m.id || idx} className="p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex flex-col items-center">
                <div className="w-36 h-[1px] bg-slate-400 mb-2"></div>
                <p className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-tight">{m.nome}</p>
                <p className="text-[11px] font-semibold text-[#002b82] dark:text-sky-400 mt-0.5 leading-tight">{m.funcao}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 italic mt-0.5 leading-tight">{m.cargoEfetivo}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Matrícula nº {m.matricula}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-slate-500 mt-3">Prefeitura Municipal de Rio Claro – RJ</p>
        </div>
      );
    }

    return (
      <div id="assinatura-timbrado" className={`assinatura-timbrado avoid-break pt-6 border-t border-slate-200 dark:border-slate-700 font-sans ${isPrint ? 'mt-10' : 'mt-6'}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <div className="text-center mb-3">
          <span className="text-[11px] font-black text-[#002b82] dark:text-sky-400 tracking-wider uppercase">
            {redatorModoAssinatura === 'TAC_CAC' ? 'TERMO DE AJUSTAMENTO DE CONDUTA (CAC / TAC)' : 'ASSINATURAS DO EXPEDIENTE DISCIPLINAR'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
          {redatorMembrosComissao.map((m, idx) => (
            <div key={m.id || idx} className="p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex flex-col items-center">
              <div className="w-44 h-[1px] bg-slate-400 mb-2"></div>
              <p className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-tight">{m.nome}</p>
              <p className="text-[11px] font-semibold text-[#002b82] dark:text-sky-400 mt-0.5 leading-tight">{m.funcao}</p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 italic mt-0.5 leading-tight">{m.cargoEfetivo}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Matrícula nº {m.matricula}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-3">Prefeitura Municipal de Rio Claro – RJ</p>
      </div>
    );
  };

  // Exportação para Word (.doc) no formato MHTML padrão Office com Brasão Oficial embutido
  const handleBaixarDocxRedator = () => {
    const numTexto = redatorTipo === 'EMAIL' ? 'COMUNICAÇÃO ELETRÔNICA INSTITUCIONAL (E-MAIL)' : getDocumentoPrefixo(redatorTipo, redatorNumero);
    const dataFormatada = redatorData || new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const dest = redatorDestinatario.trim() || 'Secretaria Municipal de Saúde';
    const ass = redatorAssunto.trim() || 'Quantitativo de Servidores e Informações de Folha';
    const texto = redatorTexto || '';
    const fecho = redatorFecho || (redatorTipo === 'PORTARIA' ? 'Dê-se ciência, registre-se, publique-se e cumpra-se.' : 'Atenciosamente,');
    const sig = redatorSignatario.trim() || (redatorTipo === 'DECRETO' ? 'Prefeito Municipal' : 'Augusto Lourenço da Silva Júnior');
    const cargo = redatorCargo.trim() || (redatorTipo === 'DECRETO' ? 'Prefeito Municipal de Rio Claro' : 'Chefe de Divisão de Treinamento e RH');
    const sec = redatorSecretaria.trim() || (redatorTipo === 'DECRETO' ? 'Gabinete do Prefeito (GP)' : 'Secretaria Municipal de Administração (SMA)');

    const fontFamilyDocx = redatorFonte === 'Arial'
      ? 'Arial, Helvetica, sans-serif'
      : redatorFonte === 'Calibri'
      ? 'Calibri, Candara, sans-serif'
      : "'Times New Roman', Times, serif";
    const fontSizeDocx = redatorTamanhoFonte || '12pt';
    const textAlignDocx = redatorAlinhamento || 'justify';

    const corpoHTML = converterTextoOficialHTML(texto, 'word', redatorFonte, redatorTamanhoFonte, redatorAlinhamento);

    const boundary = "----=_NextPart_SGEP_DOC_" + Date.now();

    let headerAndBodyHtml = "";
    if (redatorTipo === 'DECRETO') {
      headerAndBodyHtml = `
        <p style="text-align: center; font-family: Arial, sans-serif; font-size: 13pt; font-weight: bold; color: #002b82; margin: 0 0 16pt 0;">${numTexto}</p>
        <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-bottom: 20pt; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
          <tr>
            <td width="42%" style="width: 42%;"></td>
            <td width="58%" style="width: 58%; text-align: justify; font-family: 'Times New Roman', serif; font-style: italic; font-size: 10pt; color: #1e293b; border-left: 2pt solid #002b82; padding-left: 10pt; line-height: 1.35; mso-line-height-rule: exactly;">
              ${ass}
            </td>
          </tr>
        </table>
        <div class="doc-body">${corpoHTML}</div>
        <p style="text-indent: 0; margin-top: 24pt; margin-bottom: 12pt; font-style: italic;">Gabinete do Prefeito, ${dataFormatada}.</p>
      `;
    } else if (redatorTipo === 'PORTARIA') {
      headerAndBodyHtml = `
        <p style="text-align: center; font-family: Arial, sans-serif; font-size: 13pt; font-weight: bold; color: #002b82; margin: 0 0 16pt 0;">${numTexto}</p>
        <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-bottom: 20pt; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
          <tr>
            <td width="42%" style="width: 42%;"></td>
            <td width="58%" style="width: 58%; text-align: justify; font-family: 'Times New Roman', serif; font-style: italic; font-size: 10pt; color: #1e293b; border-left: 2pt solid #475569; padding-left: 10pt; line-height: 1.35; mso-line-height-rule: exactly;">
              ${ass}
            </td>
          </tr>
        </table>
        <div class="doc-body">${corpoHTML}</div>
        <p style="text-indent: 0; margin-top: 20pt; margin-bottom: 10pt; font-weight: bold;">${fecho}</p>
        <p style="text-indent: 0; margin-bottom: 24pt; font-style: italic;">Rio Claro-RJ, ${dataFormatada}.</p>
      `;
    } else if (redatorTipo === 'ATO' || redatorTipo === 'TERMO') {
      headerAndBodyHtml = `
        <p style="text-align: center; font-family: Arial, sans-serif; font-size: 13pt; font-weight: bold; color: #002b82; margin: 0 0 14pt 0;">${numTexto}</p>
        ${ass ? `
        <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-bottom: 18pt; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
          <tr>
            <td width="35%" style="width: 35%;"></td>
            <td width="65%" style="width: 65%; text-align: justify; font-family: 'Times New Roman', serif; font-style: italic; font-size: 10pt; color: #1e293b; border-left: 2pt solid #002b82; padding-left: 10pt; line-height: 1.35; mso-line-height-rule: exactly;">
              ${ass}
            </td>
          </tr>
        </table>` : ''}
        <div class="doc-body">${corpoHTML}</div>
        <p style="text-indent: 0; margin-top: 20pt; margin-bottom: 24pt; font-style: italic;">Rio Claro-RJ, ${dataFormatada}.</p>
      `;
    } else {
      headerAndBodyHtml = `
        <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-bottom: 18pt; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
          <tr>
            <td align="left" style="font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; color: #002b82; padding: 0;">${numTexto}</td>
            <td align="right" style="font-family: Arial, sans-serif; font-size: 10pt; color: #475569; text-align: right; padding: 0;">Rio Claro-RJ, ${dataFormatada}</td>
          </tr>
        </table>
        <div style="margin-top: 14pt; margin-bottom: 14pt; font-family: Arial, sans-serif; font-size: 10.5pt; text-indent: 0;">
          <strong>${dest.startsWith('À') || dest.startsWith('Ao') ? dest : 'À ' + dest}</strong><br>
          <span style="font-size: 9pt; color: #64748b;">Prefeitura Municipal de Rio Claro – RJ</span>
        </div>
        <div style="margin-bottom: 18pt; font-family: Arial, sans-serif; font-size: 10.5pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 6pt; text-indent: 0;">
          <strong>Assunto: </strong> ${ass}
        </div>
        <p style="text-indent: 0; font-family: Arial, sans-serif; font-weight: bold; margin-bottom: 14pt;">${redatorTipo === 'OFICIO' ? 'Senhor(a) Secretário(a),' : 'Prezados,'}</p>
        <div class="doc-body">${corpoHTML}</div>
        <p style="text-indent: 0; margin-top: 20pt; margin-bottom: 28pt;">${fecho}</p>
      `;
    }

    const htmlDocument = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${numTexto}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page {
  size: 21cm 29.7cm;
  margin: ${redatorMargemSuperior}cm ${redatorMargemDireita}cm ${redatorMargemInferior}cm ${redatorMargemEsquerda}cm;
  mso-page-orientation: portrait;
}
body {
  font-family: ${fontFamilyDocx};
  font-size: ${fontSizeDocx};
  line-height: 1.5;
  color: #000000;
}
p {
  margin: 0 0 10pt 0;
  padding: 0;
  text-align: ${textAlignDocx};
  text-indent: 0;
  mso-char-indent-count: 0;
  line-height: 1.5;
  mso-line-height-rule: exactly;
}
.header-table {
  width: 100%;
  border-collapse: collapse;
  border: none;
  mso-table-lspace: 0pt;
  mso-table-rspace: 0pt;
  border-bottom: 2pt solid #002b82;
  margin-top: 0pt;
  margin-bottom: 12pt;
  padding-bottom: 0pt;
  mso-margin-bottom-alt: 12pt;
}
.header-table td {
  padding: 0;
  vertical-align: top;
}
.header-table p {
  text-indent: 0 !important;
  mso-char-indent-count: 0 !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  text-align: left !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  mso-margin-top-alt: 0pt !important;
  mso-margin-bottom-alt: 0pt !important;
}
.header-table p.header-last-line {
  margin-bottom: 6pt !important;
  mso-margin-bottom-alt: 6pt !important;
}
.header-table + table,
.header-table + p,
.header-table + div {
  margin-top: 0 !important;
  mso-margin-top-alt: 0pt !important;
}
.sig-block {
  margin-top: 36pt;
  text-align: center;
  text-indent: 0;
  page-break-inside: avoid;
}
.sig-line {
  width: 240pt;
  border-top: 1pt solid #000000;
  margin: 0 auto 6pt auto;
}
</style>
</head>
<body>

<table class="header-table" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; border-bottom: 2pt solid #002b82; margin-top: 0pt; margin-bottom: 12pt; padding-bottom: 0pt; mso-margin-bottom-alt: 12pt;">
  <tr>
    <td width="80" valign="top" align="left" style="width: 60pt; text-align: left; vertical-align: top; padding: 0;">
      <p style="margin: 0; padding: 0; text-indent: 0 !important; mso-char-indent-count: 0 !important; margin-left: 0 !important; text-align: left !important; line-height: 1;">
        <img src="cid:brasao_rioclaro" width="60" height="72" alt="Brasão de Rio Claro" style="width: 45pt; height: 54pt; display: block; border: 0; position: absolute; left: 0.18cm; top: -0.21cm; margin-left: 0.18cm; margin-top: -0.21cm; mso-position-horizontal: absolute; mso-position-horizontal-relative: column; mso-position-vertical: absolute; mso-position-vertical-relative: paragraph;" />
      </p>
    </td>
    <td valign="top" align="left" style="vertical-align: top; padding: 0; text-align: left;">
      <p style="margin: 0; padding: 0; text-indent: 0 !important; mso-char-indent-count: 0 !important; margin-left: 0 !important; text-align: left !important; line-height: 1.15; mso-line-height-rule: exactly; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 0pt; font-family: Arial, sans-serif; font-size: 8.5pt; font-weight: bold; color: #002b82; text-transform: uppercase;">ESTADO DO RIO DE JANEIRO</p>
      <p style="margin: 0; padding: 0; text-indent: 0 !important; mso-char-indent-count: 0 !important; margin-left: 0 !important; text-align: left !important; line-height: 1.15; mso-line-height-rule: exactly; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 0pt; font-family: Arial, sans-serif; font-size: 11pt; font-weight: 900; color: #002b82; text-transform: uppercase;">PREFEITURA MUNICIPAL DE RIO CLARO</p>
      <p style="margin: 0; padding: 0; text-indent: 0 !important; mso-char-indent-count: 0 !important; margin-left: 0 !important; text-align: left !important; line-height: 1.15; mso-line-height-rule: exactly; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 0pt; font-family: Arial, sans-serif; font-size: 7.5pt; color: #475569;">Av. João Batista Portugal, nº 230 • CNPJ: 29.051.216/0001-68</p>
      <p style="margin: 0; padding: 0; text-indent: 0 !important; mso-char-indent-count: 0 !important; margin-left: 0 !important; text-align: left !important; line-height: 1.15; mso-line-height-rule: exactly; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 0pt; font-family: Arial, sans-serif; font-size: 9pt; font-weight: bold; color: #002b82; text-transform: uppercase;">${sec}</p>
      <p class="header-last-line" style="margin: 0 0 6pt 0; padding: 0; text-indent: 0 !important; mso-char-indent-count: 0 !important; margin-left: 0 !important; text-align: left !important; line-height: 1.15; mso-line-height-rule: exactly; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 6pt; font-family: Arial, sans-serif; font-size: 8pt; color: #475569;">${redatorSetorOrigem || 'Departamento de Recursos Humanos'}</p>
    </td>
  </tr>
</table>

${headerAndBodyHtml}

${renderAssinaturasHtmlWord()}

</body>
</html>`;

    const rawB64 = String(BRASAO_RIO_CLARO).replace(/^data:image\/[a-z]+;base64,/, '').replace(/\s+/g, '');
    const b64Lines: string[] = [];
    for (let i = 0; i < rawB64.length; i += 76) {
      b64Lines.push(rawB64.substring(i, i + 76));
    }
    const wrappedB64 = b64Lines.join('\r\n');

    const crlf = "\r\n";
    const mhtmlParts = [
      'MIME-Version: 1.0',
      `Content-Type: multipart/related; type="text/html"; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="utf-8"',
      'Content-Transfer-Encoding: 8bit',
      'Content-Location: document.html',
      '',
      htmlDocument,
      '',
      `--${boundary}`,
      'Content-Type: image/png',
      'Content-Transfer-Encoding: base64',
      'Content-ID: <brasao_rioclaro>',
      'Content-Location: brasao_rioclaro.png',
      '',
      wrappedB64,
      '',
      `--${boundary}--`,
      ''
    ];

    const mhtml = mhtmlParts.join(crlf);
    const blob = new Blob([mhtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanDocName = getOfficialDocFileName('doc');
    a.download = cleanDocName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 250);
    showToast(`Documento Word "${cleanDocName}" baixado com sucesso!`);
  };

  // Exportação leve em Texto Simples (.txt) para arquivamento enxuto e remontagem rápida
  const handleBaixarTxtRedator = () => {
    const sec = (redatorSecretaria || 'Secretaria Municipal de Administração (SMA)').trim();
    const setor = (redatorSetorOrigem || '').trim();
    const numTexto = redatorNumero ? `Nº ${redatorNumero}` : 'MINUTA (SEM NUMERAÇÃO)';

    const blocoAssinatura = redatorModoAssinatura === 'INDIVIDUAL'
      ? `${redatorSignatario || 'Servidor Responsável'}\n${redatorCargo || 'Cargo / Função Pública'}\n${sec}${redatorMatricula ? `\nMatrícula: ${redatorMatricula}` : ''}`
      : redatorMembrosComissao
          .filter(m => m.nome.trim() || m.funcao.trim())
          .map(m => `${m.nome || '___________________________'}\n${m.funcao}${m.cargoEfetivo ? ` • ${m.cargoEfetivo}` : ''}${m.matricula ? ` (Mat. ${m.matricula})` : ''}`)
          .join('\n\n');

    const cabecalhoInst = [
      'ESTADO DO RIO DE JANEIRO',
      'PREFEITURA MUNICIPAL DE RIO CLARO',
      sec.toUpperCase(),
      setor && setor !== sec ? setor : ''
    ].filter(Boolean).join('\n');

    const linhas: string[] = [
      cabecalhoInst,
      '='.repeat(60),
      `${redatorTipo} ${numTexto}`,
      `Data: ${redatorData || ''}`,
      redatorReferenciaDoc ? `Referência: ${redatorReferenciaDoc}` : '',
      redatorDestinatario ? `Destinatário: ${redatorDestinatario}` : '',
      redatorEmailCc ? `Cc: ${redatorEmailCc}` : '',
      redatorAssunto ? `Assunto / Ementa: ${redatorAssunto}` : '',
      '-'.repeat(60),
      '',
      redatorTexto || '',
      '',
      redatorFecho || '',
      '',
      blocoAssinatura
    ].filter((item, idx, arr) => !(item === '' && arr[idx - 1] === ''));

    const conteudoTxt = linhas.join('\n');
    const blob = new Blob([conteudoTxt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanDocName = getOfficialDocFileName('txt');
    a.download = cleanDocName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 250);
    showToast(`Arquivo de texto "${cleanDocName}" baixado com sucesso!`);
  };

  // Normalizador de cores oklch -> RGB usando Canvas 2D para compatibilidade com html2canvas
  const normalizeOklchToRgb = (rootElement: HTMLElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const propsToCheck = [
      'color',
      'background-color',
      'border-top-color',
      'border-bottom-color',
      'border-left-color',
      'border-right-color',
      'fill',
      'stroke',
      'outline-color',
      'text-decoration-color'
    ];

    const elements = [rootElement, ...Array.from(rootElement.querySelectorAll('*'))] as HTMLElement[];

    for (const el of elements) {
      if (!el || !el.style) continue;
      const computed = window.getComputedStyle(el);
      for (const prop of propsToCheck) {
        const val = computed.getPropertyValue(prop);
        if (val && val.includes('oklch')) {
          try {
            ctx.fillStyle = '#000000';
            ctx.fillStyle = val;
            const rgb = ctx.fillStyle;
            el.style.setProperty(prop, rgb, 'important');
          } catch {
            // fallback silencioso
          }
        }
      }
    }
  };

  // Constrói o elemento timbrado oficial em padrão A4 (794px) pronto para captura PDF
  const construirElementoTimbradoParaCaptura = (): HTMLElement => {
    const container = document.createElement('div');
    container.id = 'print-area-clone';
    container.style.width = '794px';
    container.style.minWidth = '794px';
    container.style.maxWidth = '794px';
    container.style.padding = `${Math.round(redatorMargemSuperior * 37.8)}px ${Math.round(redatorMargemDireita * 37.8)}px ${Math.round(redatorMargemInferior * 37.8)}px ${Math.round(redatorMargemEsquerda * 37.8)}px`;
    container.style.boxSizing = 'border-box';
    container.style.background = '#ffffff';
    container.style.color = '#000000';
    container.style.lineHeight = '1.5';

    const numTexto = redatorTipo === 'EMAIL'
      ? 'COMUNICAÇÃO ELETRÔNICA INSTITUCIONAL (E-MAIL)'
      : getDocumentoPrefixo(redatorTipo, redatorNumero);

    const corpoHTML = converterTextoOficialHTML(redatorTexto, 'print', redatorFonte, redatorTamanhoFonte, redatorAlinhamento);

    let conteudoMeio = '';
    if (redatorTipo === 'DECRETO' || redatorTipo === 'PORTARIA' || redatorTipo === 'ATO' || redatorTipo === 'TERMO') {
      conteudoMeio = `
        <div style="margin-bottom: 24px; font-family: Arial, sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px;">
            <strong style="color: #002b82; font-size: 15px; font-weight: 900; text-transform: uppercase;">
              ${numTexto}
            </strong>
            <span style="font-size: 12px; color: #334155; font-weight: 600;">${redatorData}</span>
          </div>
          ${redatorAssunto ? `
            <div style="margin-left: auto; width: 60%; text-align: justify; font-style: italic; font-size: 11px; color: #1e293b; line-height: 1.4; margin-bottom: 20px; padding-left: 12px; border-left: 2px solid #cbd5e1;">
              ${redatorAssunto}
            </div>
          ` : ''}
        </div>
      `;
    } else {
      conteudoMeio = `
        <div style="margin-bottom: 24px; font-family: Arial, sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 18px;">
            <div>
              <strong style="color: #002b82; font-size: 15px; font-weight: 900;">
                ${numTexto}
              </strong>
              ${redatorReferenciaDoc && redatorTipo !== 'EMAIL' ? `
                <p style="font-size: 11px; color: #475569; font-style: italic; margin-top: 2px;">
                  Referência: ${redatorReferenciaDoc}
                </p>
              ` : ''}
            </div>
            <span style="font-size: 12px; color: #334155; font-weight: 600;">${redatorData}</span>
          </div>

          <div style="margin-bottom: 18px;">
            <p style="font-size: 14px; font-weight: bold; color: #0f172a; margin: 0; line-height: 1.25;">
              ${redatorDestinatario ? (redatorDestinatario.startsWith('À') || redatorDestinatario.startsWith('Ao') ? redatorDestinatario : `À ${redatorDestinatario}`) : 'À Secretaria Municipal de Saúde'}
            </p>
            <p style="font-size: 11px; color: #475569; font-weight: 500; margin: 2px 0 0 0;">
              Prefeitura Municipal de Rio Claro – RJ
            </p>
          </div>

          <div style="margin-bottom: 18px; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1;">
            <span style="font-weight: bold; color: #0f172a; text-transform: uppercase; font-size: 12px;">Assunto: </span>
            <span style="font-weight: 600; color: #0f172a; font-size: 12px;">${redatorAssunto || 'Quantitativo de Servidores e Informações de Folha'}</span>
          </div>

          <div style="margin-bottom: 14px; font-weight: 600; font-size: 12px; color: #1e293b;">
            ${redatorTipo === 'OFICIO' ? 'Senhor(a) Secretário(a),' : 'Prezados,'}
          </div>
        </div>
      `;
    }

    let assinaturasCapturaHtml = '';
    if (redatorModoAssinatura === 'INDIVIDUAL') {
      assinaturasCapturaHtml = `
        <div id="assinatura-timbrado" style="text-align: center; margin-top: 36px; padding-top: 20px; max-width: 420px; margin-left: auto; margin-right: auto; font-family: Arial, sans-serif; break-inside: avoid; page-break-inside: avoid;">
          <div style="width: 240px; height: 1px; background-color: #94a3b8; margin: 0 auto 10px auto;"></div>
          <p style="font-size: 13px; font-weight: bold; color: #0f172a; margin: 0;">${redatorSignatario}</p>
          <p style="font-size: 11px; color: #334155; font-style: italic; margin: 2px 0 0 0;">${redatorCargo}</p>
          <p style="font-size: 11px; color: #002b82; font-weight: 600; margin: 2px 0 0 0;">${redatorSecretaria}</p>
          <p style="font-size: 9.5px; color: #64748b; margin: 2px 0 0 0;">Prefeitura Municipal de Rio Claro – RJ</p>
        </div>
      `;
    } else if (redatorModoAssinatura === 'COMISSAO_PAD' || redatorMembrosComissao.length === 3) {
      assinaturasCapturaHtml = `
        <div id="assinatura-timbrado" style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #cbd5e1; font-family: Arial, sans-serif; break-inside: avoid; page-break-inside: avoid;">
          <p style="text-align: center; font-size: 11px; font-weight: 900; color: #002b82; text-transform: uppercase; margin-bottom: 24px; letter-spacing: 0.5px;">COMISSÃO PROCESSANTE DE SINDICÂNCIA E PAD</p>
          <div style="display: flex; justify-content: space-around; text-align: center; gap: 16px;">
            ${redatorMembrosComissao.map(m => `
              <div style="flex: 1; padding: 0 8px;">
                <div style="width: 140px; height: 1px; background-color: #94a3b8; margin: 0 auto 8px auto;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #0f172a; margin: 0;">${m.nome}</p>
                <p style="font-size: 10.5px; color: #002b82; font-weight: bold; margin: 2px 0 0 0;">${m.funcao}</p>
                <p style="font-size: 9.5px; color: #475569; font-style: italic; margin: 2px 0 0 0;">${m.cargoEfetivo}</p>
                <p style="font-size: 8.5px; color: #64748b; margin: 2px 0 0 0;">Matrícula nº ${m.matricula}</p>
              </div>
            `).join('')}
          </div>
          <p style="text-align: center; font-size: 9px; color: #64748b; margin-top: 16px;">Prefeitura Municipal de Rio Claro – RJ</p>
        </div>
      `;
    } else {
      assinaturasCapturaHtml = `
        <div id="assinatura-timbrado" style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #cbd5e1; font-family: Arial, sans-serif; break-inside: avoid; page-break-inside: avoid;">
          <p style="text-align: center; font-size: 11px; font-weight: 900; color: #002b82; text-transform: uppercase; margin-bottom: 24px;">${redatorModoAssinatura === 'TAC_CAC' ? 'TERMO DE AJUSTAMENTO DE CONDUTA (CAC / TAC)' : 'ASSINATURAS DO EXPEDIENTE'}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px 24px; text-align: center;">
            ${redatorMembrosComissao.map(m => `
              <div style="padding: 0 10px;">
                <div style="width: 160px; height: 1px; background-color: #94a3b8; margin: 0 auto 8px auto;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #0f172a; margin: 0;">${m.nome}</p>
                <p style="font-size: 10.5px; color: #002b82; font-weight: bold; margin: 2px 0 0 0;">${m.funcao}</p>
                <p style="font-size: 9.5px; color: #475569; font-style: italic; margin: 2px 0 0 0;">${m.cargoEfetivo}</p>
                <p style="font-size: 8.5px; color: #64748b; margin: 2px 0 0 0;">Matrícula nº ${m.matricula}</p>
              </div>
            `).join('')}
          </div>
          <p style="text-align: center; font-size: 9px; color: #64748b; margin-top: 16px;">Prefeitura Municipal de Rio Claro – RJ</p>
        </div>
      `;
    }

    container.innerHTML = `
      <div id="cabecalho-timbrado" style="display: flex; align-items: center; gap: 18px; padding-bottom: 16px; border-bottom: 2px solid #002b82; margin-bottom: 24px; break-inside: avoid; page-break-inside: avoid;">
        <img
          src="${BRASAO_RIO_CLARO}"
          alt="Brasão Oficial da Prefeitura Municipal de Rio Claro RJ"
          width="83"
          height="96"
          style="width: 83px; height: 96px; min-width: 83px; min-height: 96px; max-width: 83px; max-height: 96px; aspect-ratio: 86 / 100; object-fit: contain; flex-shrink: 0; display: block;"
        />
        <div style="font-family: Arial, sans-serif; color: #002b82;">
          <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">
            ESTADO DO RIO DE JANEIRO
          </div>
          <div style="font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.2px; line-height: 1.2; margin-top: 2px;">
            PREFEITURA MUNICIPAL DE RIO CLARO
          </div>
          <div style="font-size: 10px; color: #475569; font-weight: 500; line-height: 1.2; margin-top: 3px;">
            Av. João Batista Portugal, nº 230 • CNPJ: 29.051.216/0001-68
          </div>
          <div style="font-size: 11px; font-weight: bold; color: #002b82; text-transform: uppercase; line-height: 1.2; margin-top: 3px;">
            ${redatorSecretaria}
          </div>
          ${redatorSetorOrigem && redatorSetorOrigem !== redatorSecretaria ? `
            <div style="font-size: 10px; color: #475569; font-weight: 500; line-height: 1.2; margin-top: 2px;">
              ${redatorSetorOrigem}
            </div>
          ` : ''}
        </div>
      </div>

      ${conteudoMeio}

      <div class="sgep-rich-doc" style="font-family: ${redatorFonte === 'Arial' ? 'Arial, sans-serif' : redatorFonte === 'Calibri' ? 'Calibri, sans-serif' : '"Times New Roman", Times, serif'}; font-size: ${redatorTamanhoFonte === '10pt' ? '12px' : redatorTamanhoFonte === '11pt' ? '13px' : '14px'}; line-height: 1.6; text-align: ${redatorAlinhamento}; margin-bottom: 28px; padding-left: 0;">
        ${corpoHTML}
      </div>

      <div style="margin-bottom: 36px; font-family: Arial, sans-serif; font-size: 12px; color: #1e293b;">
        <p style="font-weight: 500;">${redatorFecho}</p>
      </div>

      ${assinaturasCapturaHtml}
    `;

    return container;
  };

  // Visualização e Impressão Nativa Oficial
  const handleImprimirDocumentoTimbrado = () => {
    setIsSheetsDrawerOpen(false);
    const docName = getOfficialDocFileName('pdf');
    const originalTitle = document.title;
    document.title = docName.replace(/\.pdf$/i, '');

    const elemento = document.getElementById('print-area-content');
    if (elemento) {
      normalizeOklchToRgb(elemento);
    }

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  // Limpeza profunda de qualquer overlay residual invisível deixado pelo html2pdf ou container de captura
  const cleanupPdfOverlays = () => {
    try {
      const residualElements = document.querySelectorAll(
        '.html2pdf__overlay, .html2pdf__container, #pdf-capture-container, iframe[name*="html2canvas"]'
      );
      residualElements.forEach(el => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    } catch (err) {
      console.warn('Erro ao limpar overlays residuais de PDF:', err);
    }
  };

  // Fechamento seguro da visualização timbrada e liberação de travas
  const handleFecharTimbrado = () => {
    cleanupPdfOverlays();
    setIsSavingPdf(false);
    setIsRedatorLetterheadOpen(false);
  };

  // Exportação oficial para PDF (utiliza html2pdf.js com resolução nítida, isolamento A4 de 794px, normalização oklch e download direto do arquivo .pdf)
  const handleBaixarPdfRedator = async () => {
    if (isSavingPdf) return;
    setIsSavingPdf(true);
    cleanupPdfOverlays();

    const cleanDocName = getOfficialDocFileName('pdf');
    const originalTitle = document.title;
    document.title = cleanDocName.replace(/\.pdf$/i, '');

    let captureContainer: HTMLDivElement | null = null;

    try {
      // 1. Espera estabilização de fontes com timeout curto de segurança
      try {
        await Promise.race([
          document.fonts ? document.fonts.ready : Promise.resolve(),
          new Promise(resolve => setTimeout(resolve, 600))
        ]);
      } catch {}

      await new Promise(resolve => setTimeout(resolve, 40));

      // 2. Garante o motor html2pdf disponível no escopo global
      let html2pdf = (window as any).html2pdf;
      if (!html2pdf) {
        try {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = '/html2pdf.bundle.min.js';
            s.onload = () => resolve((window as any).html2pdf);
            s.onerror = reject;
            document.head.appendChild(s);
          });
          html2pdf = (window as any).html2pdf;
        } catch (e) {
          console.warn('Carregamento local de html2pdf falhou, tentando CDN:', e);
          try {
            await new Promise((resolve, reject) => {
              const s = document.createElement('script');
              s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
              s.onload = () => resolve((window as any).html2pdf);
              s.onerror = reject;
              document.head.appendChild(s);
            });
            html2pdf = (window as any).html2pdf;
          } catch {}
        }
      }

      if (!html2pdf) {
        throw new Error('Motor de exportação PDF (html2pdf) não está disponível no navegador.');
      }

      // 3. Monta o elemento timbrado isolado com 100% estilos inline compatíveis e coordenadas fixas visíveis ao canvas mas ocultas ao usuário
      captureContainer = document.createElement('div');
      captureContainer.id = 'pdf-capture-container';
      captureContainer.style.position = 'fixed';
      captureContainer.style.left = '0px';
      captureContainer.style.top = '0px';
      captureContainer.style.width = '794px';
      captureContainer.style.minWidth = '794px';
      captureContainer.style.maxWidth = '794px';
      captureContainer.style.padding = '0';
      captureContainer.style.margin = '0';
      captureContainer.style.background = '#ffffff';
      captureContainer.style.zIndex = '-99999';
      captureContainer.style.pointerEvents = 'none';
      captureContainer.style.opacity = '1';

      const targetElement = construirElementoTimbradoParaCaptura();
      targetElement.id = 'print-area-clone';
      captureContainer.appendChild(targetElement);
      document.body.appendChild(captureContainer);
      normalizeOklchToRgb(targetElement);

      showToast(`Baixando PDF oficial: "${cleanDocName}"...`);

      // 4. Configuração oficial do html2pdf com sanitização oklch do Tailwind no documento clonado
      const opt = {
        margin: [0, 0, 0, 0], // O próprio container possui espaçamento A4 calibrado (44px 50px)
        filename: cleanDocName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794,
          onclone: (clonedDoc: Document) => {
            // Remove folhas de estilo que contenham regras oklch para evitar falha no analisador de cores interno do html2canvas
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach(st => {
              if (st.textContent && st.textContent.includes('oklch')) {
                st.parentNode?.removeChild(st);
              }
            });
            const linkTags = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
            linkTags.forEach(lt => {
              const href = lt.getAttribute('href') || '';
              if (href.includes('index.css') || href.includes('src/')) {
                lt.parentNode?.removeChild(lt);
              }
            });
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          cleanupPdfOverlays();
          reject(new Error('Tempo limite excedido na geração do arquivo PDF.'));
        }, 15000);

        html2pdf()
          .set(opt)
          .from(targetElement)
          .save()
          .then(() => {
            clearTimeout(timeout);
            cleanupPdfOverlays();
            resolve();
          })
          .catch((err: any) => {
            clearTimeout(timeout);
            cleanupPdfOverlays();
            reject(err);
          });
      });

      cleanupPdfOverlays();
      setTimeout(() => cleanupPdfOverlays(), 350);
      showToast(`Documento PDF "${cleanDocName}" baixado com sucesso!`);
    } catch (err: any) {
      console.error('Erro na geração direta do PDF via html2pdf:', err);
      cleanupPdfOverlays();
      showToast(`Falha ao gerar arquivo PDF direto: ${err?.message || 'Erro no motor PDF'}.`, 'Erro', true);
    } finally {
      cleanupPdfOverlays();
      if (captureContainer && captureContainer.parentNode) {
        captureContainer.parentNode.removeChild(captureContainer);
      }
      document.title = originalTitle;
      setIsSavingPdf(false);
      setTimeout(() => cleanupPdfOverlays(), 250);
    }
  };



  // Open Variable Modal
  const handleOpenVariableModal = (modelo: ModeloDocumental) => {
    setActiveModelo(modelo);
    const matches = Array.from(new Set(modelo.Texto.match(/\[([^\]]+)\]/g) || []));
    const initialMap: Record<string, string> = {};
    matches.forEach(m => {
      initialMap[m] = '';
    });
    setFormVariables(initialMap);
    setIsVariableModalOpen(true);
  };

  // Calculate live preview text
  const previewText = useMemo(() => {
    if (!activeModelo) return '';
    let text = activeModelo.Texto;
    Object.entries(formVariables).forEach(([variable, val]) => {
      const replacement = val.trim() !== '' ? val : variable;
      text = text.split(variable).join(replacement);
    });
    return text;
  }, [activeModelo, formVariables]);

  // Intelligent Sequential Number Generation
  const handleGerarNumeroOficial = async (variableTag: string) => {
    if (!activeModelo) return;
    setIsGeneratingNumber(true);

    const tipoDoc = activeModelo.TipoDocumento.toUpperCase();
    const anoAtual = new Date().getFullYear().toString();

    // Scan formVariables for ASSUNTO and DESTINATÁRIO
    let assuntoDigitado = activeModelo.Titulo;
    let destinatarioDigitado = 'Não informado';

    Object.entries(formVariables).forEach(([tag, val]) => {
      const clean = tag.replace(/[\[\]]/g, '').trim();
      const norm = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      if (norm.includes('ASSUNTO') && val.trim()) {
        assuntoDigitado = val.trim();
      }
      if (norm.includes('DESTINATARIO') && val.trim()) {
        destinatarioDigitado = val.trim();
      }
    });

    const usuarioLogado = currentUser?.nome || 'Servidor Municipal';
    const servidorIdentificado = currentUser ? (currentUser.matricula ? `${currentUser.nome} (${currentUser.matricula})` : currentUser.nome) : 'Servidor Municipal';
    const userPrimarySec = resolveCanonicalSecretariaName(currentUser?.secretaria || listaSecretariasDoUsuario[0] || 'Secretaria Municipal de Administração (SMA)', secretarias);
    let secAlvo = activeSecretaria && activeSecretaria !== 'TODAS' ? resolveCanonicalSecretariaName(activeSecretaria, secretarias) : userPrimarySec;
    if (currentUser?.nivel !== 'ADMIN' && !isUserAuthorizedForSecretaria(currentUser, secAlvo, secretarias)) {
      secAlvo = userPrimarySec;
    }
    const siglaAlvo = getSecretariaSigla(secAlvo, secretarias);
    const deptoAlvo = isUserRestrictedToDepartamento(currentUser)
      ? currentUser!.departamento!.trim()
      : (currentUser?.departamento?.trim() || (siglaAlvo === 'SMA' ? 'Departamento de Recursos Humanos (DRH)' : 'Gabinete'));

    if (useRealApi) {
      try {
        const response = await fetchWithTimeout(realApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'GERAR_NUMERO',
            tipoDocumento: tipoDoc,
            assunto: assuntoDigitado,
            destinatario: destinatarioDigitado,
            secretaria: secAlvo,
            departamento: deptoAlvo,
            servidor: servidorIdentificado,
            sigla: siglaAlvo,
            incluirSigla: incluirSiglaNoNumero,
            usuarioLogado: servidorIdentificado,
            token: currentUser?.token || ''
          })
        }, 8000);
        const text = await response.text();
        const json = JSON.parse(text);
        if (json.success && json.numeroGerado) {
          setFormVariables(prev => ({ ...prev, [variableTag]: json.numeroGerado }));
          showToast(`Número ${json.numeroGerado} gerado com sucesso no Google Sheets!`);
          
          // Add to local state as well
          const novoReg: RegistroNumeracao = {
            dataHora: json.dataHora || new Date().toISOString(),
            tipoDocumento: tipoDoc,
            numero: json.numeroGerado,
            assunto: assuntoDigitado,
            usuario: servidorIdentificado,
            servidor: servidorIdentificado,
            destinatario: destinatarioDigitado,
            secretaria: secAlvo,
            departamento: deptoAlvo,
            incluirSigla: incluirSiglaNoNumero
          };
          setNumeracoes(prev => [novoReg, ...prev]);
          setIsGeneratingNumber(false);
          return;
        } else {
          console.warn('Google Sheets retornou aviso. Acionando contingência local:', json.error);
          showToast('Google Sheets indisponível no momento. Gerando número no modo de contingência local...', 'Contingência');
        }
      } catch (err: any) {
        console.warn('Falha ao comunicar com Google Sheets. Acionando contingência local:', err);
        showToast('Google Sheets indisponível no momento. Gerando número no modo de contingência local...', 'Contingência');
      }
    }

    // Geração no modo de contingência / simulação local garantida
    await new Promise(resolve => setTimeout(resolve, 150));
    const proximoSeq = getNextSequentialForSecretaria(numeracoes, tipoDoc, secAlvo, anoAtual, secretarias);
    const seqStr = String(proximoSeq).padStart(3, '0');
    const nextNum = incluirSiglaNoNumero ? `${seqStr}/${anoAtual} - ${siglaAlvo}` : `${seqStr}/${anoAtual}`;
    const nowIso = new Date().toISOString();

    // 1. Gravação Principal na aba "Numeração"
    const novoRegistroNumeracao: RegistroNumeracao = {
      dataHora: nowIso,
      tipoDocumento: tipoDoc,
      numero: nextNum,
      assunto: assuntoDigitado,
      usuario: servidorIdentificado,
      servidor: servidorIdentificado,
      destinatario: destinatarioDigitado,
      secretaria: secAlvo,
      departamento: deptoAlvo,
      incluirSigla: incluirSiglaNoNumero
    };

    // 2. Gravação de Segurança e Rastreabilidade na aba "Logs_Auditoria"
    const novoRegistroLog: RegistroLog = {
      dataHora: nowIso,
      usuario: usuarioLogado,
      acao: 'GERAR_NUMERO',
      docId: nextNum,
      detalhes: `Emitiu ${tipoDoc} ${nextNum} (${secAlvo}) | Dest: ${destinatarioFinal(destinatarioDigitado)} | Assunto: ${assuntoDigitado}`
    };

    setNumeracoes(prev => [novoRegistroNumeracao, ...prev]);
    setLogs(prev => [novoRegistroLog, ...prev]);

    // 3. Incorporação Automática nos Datalists locais
    const updatedDest = [...sugestoes.destinatarios];
    let changed = false;
    if (destinatarioDigitado && destinatarioDigitado !== 'Não informado' && !updatedDest.includes(destinatarioDigitado)) {
      updatedDest.push(destinatarioDigitado);
      updatedDest.sort((a, b) => a.localeCompare(b, 'pt-BR'));
      changed = true;
    }

    const updatedAss = [...sugestoes.assuntos];
    if (assuntoDigitado && assuntoDigitado !== 'Sem Assunto' && !updatedAss.includes(assuntoDigitado)) {
      updatedAss.push(assuntoDigitado);
      updatedAss.sort((a, b) => a.localeCompare(b, 'pt-BR'));
      changed = true;
    }

    if (changed) {
      setSugestoes({ destinatarios: updatedDest, assuntos: updatedAss });
    }

    // Update the input field in the modal
    setFormVariables(prev => ({
      ...prev,
      [variableTag]: nextNum
    }));

    setIsGeneratingNumber(false);
    showToast(`Número oficial ${nextNum} gerado e gravado com sucesso!`);
  };

  const destinatarioFinal = (dest: string) => dest.trim() || 'Não informado';

  // Copy processed text
  const handleCopyProcessedText = () => {
    navigator.clipboard.writeText(previewText).then(() => {
      showToast('Documento oficial copiado para a área de transferência!');
      setIsVariableModalOpen(false);
    });
  };

  // Save model in CRUD
  const handleSaveCrud = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModelo.Titulo || !editingModelo.Texto || !editingModelo.TipoDocumento) {
      showToast('Preencha os campos obrigatórios (*)', 'Atenção', true);
      return;
    }

    if (editingModelo.ID) {
      // Edit
      setModelos(prev => prev.map(m => m.ID === editingModelo.ID ? { ...m, ...editingModelo } as ModeloDocumental : m));
      // Log
      setLogs(prev => [{
        dataHora: new Date().toISOString(),
        usuario: currentUser?.nome || 'Admin',
        acao: 'EDITAR_MODELO',
        docId: editingModelo.ID || '',
        detalhes: `Edição de ${editingModelo.TipoDocumento}: ${editingModelo.Titulo}`
      }, ...prev]);
      showToast('Modelo atualizado com sucesso na aba Modelos!');
    } else {
      // Create
      const newId = `MOD-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const newDoc: ModeloDocumental = {
        ID: newId,
        TipoDocumento: (editingModelo.TipoDocumento || 'DESPACHO').toUpperCase(),
        Categoria: editingModelo.Categoria || '1. Geral',
        Titulo: editingModelo.Titulo || 'Novo Modelo',
        Texto: editingModelo.Texto || '',
        PalavrasChave: editingModelo.PalavrasChave || '',
        BaseLegal: editingModelo.BaseLegal || '',
        Ativo: true,
        UsoFrequente: 0,
        Versao: '1.0'
      };
      setModelos(prev => [newDoc, ...prev]);
      setLogs(prev => [{
        dataHora: new Date().toISOString(),
        usuario: currentUser?.nome || 'Admin',
        acao: 'CRIAR_MODELO',
        docId: newId,
        detalhes: `Criação de ${newDoc.TipoDocumento}: ${newDoc.Titulo}`
      }, ...prev]);
      showToast(`Novo modelo ${newId} cadastrado com sucesso!`);
    }

    if (useRealApi) {
      fetchWithTimeout(realApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'SALVAR_MODELO',
          documento: editingModelo,
          token: currentUser?.token || '',
          usuarioLogado: currentUser?.nome || 'Admin'
        })
      }, 8500)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            handleSyncData();
            showToast(res.message || 'Modelo salvo na planilha oficial!');
          } else if (res.authRequired) {
            showToast('Sessão expirada. Faça login novamente.', 'Atenção', true);
            handleLogout();
          } else {
            showToast(res.error || 'Erro ao salvar modelo', 'Erro', true);
          }
        })
        .catch(err => console.error('Erro ao salvar modelo no Sheets:', err));
    }

    setIsCrudModalOpen(false);
    setEditingModelo({});
  };

  // Funções de Gestão Administrativa de Servidores e Secretarias
  const handleSaveUsuario = async (servidor: Partial<UsuarioSistema>, novaSenha?: string): Promise<boolean> => {
    const mat = String(servidor.matricula || '').trim();
    if (!mat) return false;
    const exists = usuarios.some(u => u.matricula === mat);

    const updatedUser: UsuarioSistema = {
      id: servidor.id || `USR-${mat}`,
      matricula: mat,
      nome: servidor.nome || '',
      cargo: servidor.cargo || '',
      secretaria: resolveCanonicalSecretariaName(servidor.secretaria || 'Secretaria Municipal de Administração (SMA)', secretarias),
      secretarias: servidor.secretarias && servidor.secretarias.length > 0
        ? servidor.secretarias.map(s => resolveCanonicalSecretariaName(s, secretarias))
        : [resolveCanonicalSecretariaName(servidor.secretaria || 'Secretaria Municipal de Administração (SMA)', secretarias)],
      departamento: (servidor.departamento || '').trim(),
      nivel: (servidor.nivel || 'PADRAO') as any,
      ativo: servidor.ativo !== undefined ? servidor.ativo : true,
      filtroAcessibilidade: servidor.filtroAcessibilidade
        ? {
            acessarSecretaria: Boolean(servidor.filtroAcessibilidade.acessarSecretaria),
            acessarDepartamento: Boolean(servidor.filtroAcessibilidade.acessarDepartamento),
            acessarProprios: Boolean(servidor.filtroAcessibilidade.acessarProprios)
          }
        : undefined,
      ...(novaSenha ? { senha: novaSenha } : {})
    };

    let newUsuariosList: UsuarioSistema[];
    if (exists) {
      newUsuariosList = usuarios.map(u => u.matricula === mat ? { ...u, ...updatedUser } : u);
    } else {
      newUsuariosList = [updatedUser, ...usuarios];
    }
    setUsuarios(newUsuariosList);
    localStorage.setItem('bm_usuarios', JSON.stringify(newUsuariosList));

    // Se o servidor editado for o próprio usuário da sessão ativa, atualiza sua sessão em tempo real
    if (currentUser && currentUser.matricula === mat) {
      const mergedSession: UsuarioSistema = { ...currentUser, ...updatedUser };
      setCurrentUser(mergedSession);
      localStorage.setItem('sgep_user_session', JSON.stringify(mergedSession));
    }

    // Registro nos Logs de Auditoria
    setLogs(prev => [{
      dataHora: new Date().toISOString(),
      usuario: currentUser?.nome || 'Admin',
      acao: exists ? 'EDITAR_SERVIDOR' : 'CRIAR_SERVIDOR',
      docId: mat,
      detalhes: `${exists ? 'Atualização' : 'Cadastro'} do servidor ${updatedUser.nome} (${updatedUser.secretaria}) — Filtro Docs: ${formatAccessibilityFilterLabel(updatedUser)}`
    }, ...prev]);

    // Sincronização com a nuvem (Google Apps Script Web App)
    if (useRealApi) {
      try {
        const resp = await fetchWithTimeout(realApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'SALVAR_USUARIO',
            matricula: mat,
            nome: updatedUser.nome,
            cargo: updatedUser.cargo,
            secretaria: updatedUser.secretaria,
            secretarias: updatedUser.secretarias,
            departamento: updatedUser.departamento,
            nivel: updatedUser.nivel,
            ativo: updatedUser.ativo,
            filtroAcessibilidade: updatedUser.filtroAcessibilidade,
            acessibilidadeDocs: updatedUser.filtroAcessibilidade
              ? JSON.stringify(updatedUser.filtroAcessibilidade)
              : '',
            senha: novaSenha || undefined,
            usuarioAdmin: currentUser?.nome || 'Admin',
            token: currentUser?.token || ''
          })
        }, 8500);
        const res = await resp.json();
        if (res && res.success) {
          showToast(res.message || 'Servidor sincronizado com o Google Sheets!');
        } else if (res && res.error) {
          showToast(res.error, 'Aviso do Servidor', true);
        }
      } catch (err) {
        console.warn('Erro ao conectar com API para salvar usuário:', err);
        showToast('Salvo localmente no dispositivo. Verifique a conexão com o GAS.', 'Aviso', true);
      }
    } else {
      showToast(`Servidor ${updatedUser.nome} salvo com sucesso!`);
    }

    return true;
  };

  const handleToggleStatusUsuario = async (matricula: string, novoStatus: boolean): Promise<boolean> => {
    const newUsuariosList = usuarios.map(u => u.matricula === matricula ? { ...u, ativo: novoStatus } : u);
    setUsuarios(newUsuariosList);
    localStorage.setItem('bm_usuarios', JSON.stringify(newUsuariosList));

    setLogs(prev => [{
      dataHora: new Date().toISOString(),
      usuario: currentUser?.nome || 'Admin',
      acao: 'ALTERAR_STATUS',
      docId: matricula,
      detalhes: `Status do servidor matrícula ${matricula} alterado para ${novoStatus ? 'ATIVO' : 'INATIVO'}`
    }, ...prev]);

    if (useRealApi) {
      try {
        await fetchWithTimeout(realApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'ALTERAR_STATUS_USUARIO',
            matricula: matricula,
            ativo: novoStatus,
            usuarioAdmin: currentUser?.nome || 'Admin',
            token: currentUser?.token || ''
          })
        }, 8000);
      } catch (err) {
        console.warn('Erro ao sincronizar status do servidor com o Google Sheets:', err);
      }
    }

    showToast(`Acesso do servidor matrícula ${matricula} alterado para ${novoStatus ? 'ATIVO' : 'INATIVO'}.`);
    return true;
  };

  const handleSaveSecretaria = (sec: SecretariaItem) => {
    const exists = secretarias.some(s => s.sigla.toUpperCase() === sec.sigla.toUpperCase());
    let updatedSecs: SecretariaItem[];
    if (exists) {
      updatedSecs = secretarias.map(s => s.sigla.toUpperCase() === sec.sigla.toUpperCase() ? sec : s);
    } else {
      updatedSecs = [...secretarias, sec];
    }
    setSecretarias(updatedSecs);
    localStorage.setItem('bm_secretarias', JSON.stringify(updatedSecs));
    showToast(`Secretaria ${sec.sigla} salva com sucesso!`);
  };

  // Funções de Gestão de Pedidos de Recuperação de Senha e Autorização de Novos Servidores
  const handleCriarPedidoRecuperacao = (
    matricula: string,
    contato: string,
    tipo: 'REDEFINICAO' | 'NOVO_CADASTRO' = 'REDEFINICAO',
    dadosServidor?: Partial<UsuarioSistema>
  ) => {
    const cleanMat = matricula.trim();
    const user = usuarios.find(u => String(u.matricula).trim().toLowerCase() === cleanMat.toLowerCase());

    const now = new Date();
    const dataHoraFormatada = now.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const nomeFinal = (dadosServidor?.nome || user?.nome || `Servidor Matrícula ${cleanMat}`).trim();
    const cargoFinal = (dadosServidor?.cargo || user?.cargo || 'Servidor Municipal').trim();
    const secretariaFinal = (
      dadosServidor?.secretaria ||
      user?.secretaria ||
      (user?.secretarias && user.secretarias[0]) ||
      'Secretaria Municipal de Administração (SMA)'
    ).trim();
    const departamentoFinal = (dadosServidor?.departamento || user?.departamento || 'Geral').trim();

    const novoPedido: PedidoRecuperacaoSenha = {
      id: 'ped-' + Date.now(),
      matricula: cleanMat,
      nome: nomeFinal,
      cargo: cargoFinal,
      secretaria: secretariaFinal,
      departamento: departamentoFinal,
      contato: contato || '',
      dataHora: dataHoraFormatada,
      status: 'PENDENTE',
      tipo: tipo
    };

    setPedidosRecuperacao(prev => {
      const filtered = prev.filter(p => !(p.matricula === cleanMat && p.status === 'PENDENTE'));
      const updated = [novoPedido, ...filtered];
      try { localStorage.setItem('bm_pedidos_recuperacao', JSON.stringify(updated)); } catch {}
      return updated;
    });

    // Persiste a solicitação na aba PedidosAcesso do Google Sheets (para o Administrador visualizar em qualquer dispositivo)
    if (useRealApi) {
      fetchWithTimeout(realApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'CRIAR_PEDIDO_ACESSO',
          pedido: novoPedido
        })
      }, 8500).catch(err => console.warn('Aviso ao enviar pedido de acesso ao GAS:', err));
    }

    if (tipo === 'NOVO_CADASTRO') {
      showToast(`Solicitação da matrícula ${cleanMat} enviada para autorização do Administrador!`);
    } else {
      showToast(`Solicitação enviada ao Administrador! Aguarde liberação da senha provisória.`);
    }
  };

  const handleAprovarPedidoRecuperacao = async (pedidoId: string, novaSenha?: string) => {
    const pedido = pedidosRecuperacao.find(p => p.id === pedidoId);
    if (!pedido) return;

    const isNovoCadastro = pedido.tipo === 'NOVO_CADASTRO';
    const senhaAplicada = novaSenha !== undefined ? novaSenha : (isNovoCadastro ? undefined : '123456');

    // Ativa o servidor (ativo: true) e atualiza a senha quando solicitada, sincronizando com a planilha
    const targetUser = usuarios.find(u => String(u.matricula).trim().toLowerCase() === String(pedido.matricula).trim().toLowerCase());
    if (targetUser) {
      await handleSaveUsuario({ ...targetUser, matricula: pedido.matricula, ativo: true }, senhaAplicada);
    } else {
      await handleSaveUsuario({
        matricula: pedido.matricula,
        nome: pedido.nome,
        cargo: pedido.cargo || 'Servidor Municipal',
        secretaria: pedido.secretaria || 'Secretaria Municipal de Administração (SMA)',
        departamento: pedido.departamento || 'Geral',
        nivel: 'PADRAO',
        ativo: true
      }, senhaAplicada || '123456');
    }

    const now = new Date();
    const dataHoraFormatada = now.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const resolvidoPor = currentUser?.nome || 'Administrador';

    setPedidosRecuperacao(prev => {
      const updated = prev.map(p => {
        if (p.id === pedidoId) {
          return {
            ...p,
            status: 'ATENDIDO' as const,
            resolvidoEm: dataHoraFormatada,
            resolvidoPor,
            senhaProvisoria: senhaAplicada
          };
        }
        return p;
      });
      try { localStorage.setItem('bm_pedidos_recuperacao', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (useRealApi) {
      fetchWithTimeout(realApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'ATUALIZAR_PEDIDO_ACESSO',
          id: pedido.id,
          matricula: pedido.matricula,
          status: 'ATENDIDO',
          resolvidoEm: dataHoraFormatada,
          resolvidoPor,
          senhaProvisoria: senhaAplicada || '',
          token: currentUser?.token || ''
        })
      }, 8500).catch(err => console.warn('Aviso ao atualizar status do pedido no GAS:', err));
    }

    const newLog: RegistroLog = {
      dataHora: new Date().toISOString(),
      usuario: resolvidoPor,
      acao: isNovoCadastro ? 'CRIAR_SERVIDOR' : 'REDEFINICAO_SENHA',
      docId: pedido.matricula,
      detalhes: isNovoCadastro
        ? `Autorização e ativação do novo servidor ${pedido.nome} (Matrícula: ${pedido.matricula}).${senhaAplicada ? ` Senha provisória: ${senhaAplicada}.` : ' Senha do cadastro preservada.'}`
        : `Aprovação de senha do servidor ${pedido.nome} (Matrícula: ${pedido.matricula}). Senha provisória: ${senhaAplicada}.`
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleCancelarPedidoRecuperacao = (pedidoId: string) => {
    const pedido = pedidosRecuperacao.find(p => p.id === pedidoId);
    setPedidosRecuperacao(prev => {
      const updated = prev.map(p => {
        if (p.id === pedidoId) {
          return { ...p, status: 'CANCELADO' as const };
        }
        return p;
      });
      try { localStorage.setItem('bm_pedidos_recuperacao', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (pedido && pedido.tipo === 'NOVO_CADASTRO') {
      const target = usuarios.find(u => String(u.matricula).trim().toLowerCase() === String(pedido.matricula).trim().toLowerCase());
      if (target && target.ativo) {
        handleToggleStatusUsuario(target.matricula, false);
      }
    }

    if (useRealApi && pedido) {
      fetchWithTimeout(realApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'ATUALIZAR_PEDIDO_ACESSO',
          id: pedido.id,
          matricula: pedido.matricula,
          status: 'CANCELADO',
          resolvidoPor: currentUser?.nome || 'Administrador',
          token: currentUser?.token || ''
        })
      }, 8500).catch(err => console.warn('Aviso ao cancelar pedido no GAS:', err));
    }
  };

  // Copy code tab
  const handleCopyCode = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCodeTab(tabName);
      showToast(`Código copiado para a área de transferência!`);
      setTimeout(() => setCopiedCodeTab(null), 2500);
    });
  };

  // Download file helper
  const handleDownloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Download de "${filename}" iniciado.`);
  };

  // Filtered models
  const filteredModelos = useMemo(() => {
    return modelos.filter(item => {
      const tipo = (item.TipoDocumento || '').toUpperCase();
      if (selectedType === 'FAVORITOS' && !favoritos.includes(item.ID)) return false;
      if (selectedType !== 'TODOS' && selectedType !== 'FAVORITOS' && tipo !== selectedType) return false;
      if (selectedCategory && item.Categoria !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const combined = `${item.Titulo} ${item.Texto} ${item.PalavrasChave} ${item.BaseLegal || ''} ${item.Categoria}`.toLowerCase();
        if (!combined.includes(q)) return false;
      }
      return true;
    });
  }, [modelos, selectedType, selectedCategory, searchQuery, favoritos]);

  // Unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(modelos.map(m => m.Categoria).filter(Boolean))).sort();
  }, [modelos]);

  // Helper for bracket highlighting in display cards
  const renderCardTextWithBrackets = (text: string) => {
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span
            key={index}
            className="inline-block bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 font-semibold px-1 py-0.5 rounded border border-dashed border-amber-400 text-[11px] mx-0.5"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // SE O SERVIDOR NÃO ESTIVER AUTENTICADO: Exibe EXCLUSIVAMENTE a tela limpa de Login (SEM BARRA DE PRODUÇÃO)
  if (!currentUser) {
    const cleanLoginMat = loginMatricula.trim();
    const servidorIdentificadoLogin = cleanLoginMat
      ? usuarios.find(u => String(u.matricula).trim().toLowerCase() === cleanLoginMat.toLowerCase()) || null
      : null;

    return (
      <div
        className={`min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-200 ${isDarkMode ? 'dark text-slate-100' : 'text-slate-100'}`}
        style={{
          background: isDarkMode
            ? `radial-gradient(circle at top, ${activePaletteMeta.headerBg} 0%, #020617 75%)`
            : `radial-gradient(circle at top, ${activePaletteMeta.headerBg} 0%, #0f172a 85%)`
        }}
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
          <div className="text-center mb-6">
            <img
              src={BRASAO_RIO_CLARO}
              onError={e => { (e.target as HTMLImageElement).src = BRASAO_RIO_CLARO; }}
              alt="Brasão Municipal de Rio Claro - RJ"
              width={69}
              height={80}
              style={{
                width: '69px',
                height: '80px',
                minWidth: '69px',
                minHeight: '80px',
                maxWidth: '69px',
                maxHeight: '80px',
                aspectRatio: '86 / 100',
                objectFit: 'contain',
                display: 'block'
              }}
              className="brasao-oficial-img mx-auto object-contain drop-shadow mb-2.5"
            />
            <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-[#002b82] dark:text-blue-300">
              ESTADO DO RIO DE JANEIRO
            </h3>
            <h2 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">
              PREFEITURA MUNICIPAL DE RIO CLARO
            </h2>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center justify-center gap-1.5">
              <span>Departamento de Recursos Humanos • Gestão Documental</span>
              <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded">v1.5</span>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Matrícula Funcional
                </label>
                {cleanLoginMat && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1 ${
                    servidorIdentificadoLogin
                      ? servidorIdentificadoLogin.ativo
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : cleanLoginMat.length >= 2
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'text-slate-400'
                  }`}>
                    {servidorIdentificadoLogin ? (
                      servidorIdentificadoLogin.ativo ? (
                        <>
                          <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Cadastrado</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Aguardando autorização</span>
                        </>
                      )
                    ) : cleanLoginMat.length >= 2 ? (
                      <>
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>Não cadastrado</span>
                      </>
                    ) : null}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={loginMatricula}
                onChange={e => {
                  setLoginMatricula(e.target.value);
                  setLoginError('');
                }}
                placeholder="Ex: 1001"
                required
                autoComplete="username"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 font-mono ${
                  cleanLoginMat && servidorIdentificadoLogin
                    ? servidorIdentificadoLogin.ativo
                      ? 'border-emerald-500 focus:ring-emerald-500'
                      : 'border-amber-400 focus:ring-amber-500'
                    : cleanLoginMat && cleanLoginMat.length >= 2 && !servidorIdentificadoLogin
                    ? 'border-amber-400 focus:ring-amber-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                }`}
              />

              {/* Feedback Contextual Imediato ao Digitar a Matrícula */}
              {cleanLoginMat && (
                <div className="mt-1.5 animate-in fade-in duration-150">
                  {servidorIdentificadoLogin ? (
                    servidorIdentificadoLogin.ativo ? (
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">
                            <strong>{servidorIdentificadoLogin.nome}</strong> • {servidorIdentificadoLogin.secretaria}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 shrink-0 font-medium">
                          {servidorIdentificadoLogin.cargo || 'Servidor Oficial'}
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="leading-snug">
                          <strong>Cadastro aguardando autorização do Administrador (DRH/SMA).</strong>
                          <span className="block text-[10px] text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                            Assim que liberado, você poderá entrar com sua senha. Urgência: <strong>Ramal 407 • DRH/SMA</strong>.
                          </span>
                        </div>
                      </div>
                    )
                  ) : cleanLoginMat.length >= 2 ? (
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="truncate">Matrícula não cadastrada no sistema</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsRecuperarSenhaOpen(true)}
                        className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold shrink-0 cursor-pointer transition-colors shadow-xs"
                      >
                        Cadastrar Agora
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Senha de Acesso
              </label>
              <input
                type="password"
                value={loginSenha}
                onChange={e => setLoginSenha(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Ações Diretas e Claras: 1. Entrar | 2. Primeiro acesso / Esqueci minha senha */}
            <div className="space-y-2.5 pt-0.5">
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Autenticando no GAS...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Entrar no Sistema</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsRecuperarSenhaOpen(true)}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-sky-950/50 text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-300 border border-slate-300 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Solicitar cadastro inicial de novo servidor ou redefinição de senha esquecida"
              >
                <Key className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Primeiro acesso / Esqueci minha senha</span>
              </button>
            </div>

            {loginError && (
              <div className={`p-2.5 rounded-lg border text-xs text-center font-medium space-y-1.5 ${
                loginError.includes('aguardando autorização')
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400'
              }`}>
                <div>{loginError}</div>
                {loginError.includes('não cadastrada') && (
                  <button
                    type="button"
                    onClick={() => setIsRecuperarSenhaOpen(true)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Cadastrar Matrícula {cleanLoginMat} Agora</span>
                  </button>
                )}
              </div>
            )}
          </form>

          {/* Botão Guia Passo a Passo para Novos Usuários */}
          <div className="mt-3.5 text-center">
            <button
              type="button"
              onClick={() => setIsGuiaAjudaOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Primeira vez no sistema? Veja o guia passo a passo</span>
            </button>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Sistema v1.5 Oficial • Autenticação PMRC
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer transition-colors border border-slate-200 dark:border-slate-700"
            >
              {themeMode === 'system' ? (
                <Monitor className="w-3.5 h-3.5 text-sky-500" />
              ) : isDarkMode ? (
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: activePaletteMeta.swatch }}
              />
              <span>Tema e Cores</span>
            </button>
            <span className="text-[10px] text-slate-400 font-medium">PMRC • SGEP-DOCS <span className="text-emerald-500 font-bold ml-1">v1.5</span></span>
          </div>
        </div>

        {/* Modal: Seletor Responsivo de Tema, Cores e Formulários */}
        <ThemeSettingsModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          themeMode={themeMode}
          themePalette={themePalette}
          formStyle={formStyle}
          isDarkMode={isDarkMode}
          systemPrefersDark={systemPrefersDark}
          onChangeMode={setThemeMode}
          onChangePalette={setThemePalette}
          onChangeFormStyle={setFormStyle}
          onResetDefaults={() => {
            setThemeMode(DEFAULT_THEME_PREFS.mode);
            setThemePalette(DEFAULT_THEME_PREFS.palette);
            setFormStyle(DEFAULT_THEME_PREFS.formStyle);
          }}
        />

        {/* Modal: Guia de Orientações & Ajuda ao Servidor */}
        <GuiaAjudaModal
          isOpen={isGuiaAjudaOpen}
          onClose={() => setIsGuiaAjudaOpen(false)}
          onReiniciarDicas={() => (window as any).reiniciarDicas?.()}
          isLoggedIn={false}
        />

        {/* Modal: Recuperação de Senha Esquecida & Cadastro Inicial de Servidor */}
        <RecuperarSenhaModal
          isOpen={isRecuperarSenhaOpen}
          onClose={() => setIsRecuperarSenhaOpen(false)}
          initialMatricula={loginMatricula}
          usuarios={usuarios}
          secretarias={secretarias}
          pedidosRecuperacao={pedidosRecuperacao}
          onCriarPedidoRecuperacao={handleCriarPedidoRecuperacao}
          onCadastrarServidor={async (novoServidor, senhaInicial) => {
            return await handleSaveUsuario(novoServidor, senhaInicial);
          }}
          onShowToast={showToast}
          onSuccessCadastro={(matricula) => {
            setLoginMatricula(matricula);
            showToast(`Matrícula ${matricula} pronta para login!`);
          }}
        />

        {/* Global Toast para a Tela de Login */}
        {toastMessage && (
          <div id="toast-login" role="status" className={`no-print fixed bottom-6 right-6 z-[120] max-w-sm bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border flex items-center space-x-3 pointer-events-none transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            toastMessage.isError ? 'border-rose-500' : 'border-emerald-500'
          }`}>
            <div className={toastMessage.isError ? 'text-rose-400 text-lg' : 'text-emerald-400 text-lg'}>
              {toastMessage.isError ? <AlertTriangle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-bold">{toastMessage.title}</p>
              <p className="text-xs text-slate-300">{toastMessage.text}</p>
            </div>
          </div>
        )}

      </div>
    );
  }

  // Renderizador unificado da prévia documental (utilizado tanto no modo fixo quanto no modo flutuante)
  const renderPreviaDocumento = (isFloating: boolean = false) => {
    return (
      <>
        {redatorTipo === 'EMAIL' ? (
          /* Visualização de Mensagem de E-mail Institucional */
          <div className={`bg-white text-slate-900 p-5 sm:p-6 border border-slate-300 shadow-md flex flex-col justify-between font-sans text-xs leading-relaxed select-all ${isFloating ? 'w-full flex-1 min-h-full rounded-lg' : 'rounded-xl flex-1 max-h-[580px] overflow-y-auto'}`}>
            <div>
              {/* Header do E-mail com Brasão */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200 mb-3 bg-slate-50 -m-5 sm:-m-6 p-4 rounded-t-xl">
                <img
                  src={BRASAO_RIO_CLARO}
                  onError={e => { (e.target as HTMLImageElement).src = BRASAO_RIO_CLARO; }}
                  alt="Brasão Oficial de Rio Claro RJ"
                  width={35}
                  height={40}
                  style={{
                    width: '35px',
                    height: '40px',
                    minWidth: '35px',
                    minHeight: '40px',
                    maxWidth: '35px',
                    maxHeight: '40px',
                    aspectRatio: '86 / 100',
                    objectFit: 'contain',
                    display: 'block',
                    flexShrink: 0
                  }}
                  className="brasao-oficial-img object-contain shrink-0"
                />
                <div className="text-[#002b82]">
                  <div className="font-extrabold text-[11px] tracking-wide uppercase leading-tight">
                    PREFEITURA MUNICIPAL DE RIO CLARO – RJ
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Correio Eletrônico Institucional • {redatorSecretaria}
                  </div>
                </div>
              </div>

              {/* Metadados do E-mail */}
              <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200/80 mb-4 space-y-1.5 text-[11px]">
                <div className="flex items-baseline">
                  <span className="font-bold text-slate-500 w-16">De:</span>
                  <span className="font-medium text-slate-800">
                    {redatorSignatario} &lt;{redatorSignatario.toLowerCase().replace(/[^a-z0-9]/g, '.')}@rioclaro.rj.gov.br&gt;
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-bold text-slate-500 w-16">Para:</span>
                  <span className="font-medium text-blue-700">
                    {redatorDestinatario || 'destinatario@rioclaro.rj.gov.br'}
                  </span>
                </div>
                {redatorEmailCc && (
                  <div className="flex items-baseline">
                    <span className="font-bold text-slate-500 w-16">Cc:</span>
                    <span className="text-slate-600 font-medium">{redatorEmailCc}</span>
                  </div>
                )}
                <div className="flex items-baseline">
                  <span className="font-bold text-slate-500 w-16">Data:</span>
                  <span className="text-slate-600">{redatorData}</span>
                </div>
                <div className="flex items-baseline pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-700 w-16">Assunto:</span>
                  <span className="font-bold text-slate-900">[PMRC] {redatorAssunto || '(Sem Assunto)'}</span>
                </div>
              </div>

              {/* Saudação */}
              <div className="mb-3 text-xs font-semibold text-slate-800">
                Prezados(as),
              </div>

              {/* Corpo do E-mail com Formatação Rica */}
              <div
                className="sgep-rich-doc leading-relaxed mb-6 font-sans text-slate-800 text-xs"
                style={{
                  fontFamily: redatorFonte === 'Arial' ? 'Arial, sans-serif' : redatorFonte === 'Calibri' ? 'Calibri, sans-serif' : 'Georgia, "Times New Roman", serif',
                  fontSize: redatorTamanhoFonte === '10pt' ? '11px' : redatorTamanhoFonte === '11pt' ? '12px' : '13px',
                  textAlign: redatorAlinhamento
                }}
                dangerouslySetInnerHTML={{
                  __html: converterTextoOficialHTML(redatorTexto, 'preview', redatorFonte, redatorTamanhoFonte, redatorAlinhamento)
                }}
              />

              {/* Fecho */}
              <div className="mb-4 text-xs text-slate-800 font-medium">
                {redatorFecho}
              </div>
            </div>

            {/* Assinatura de E-mail */}
            <div className="pt-3 border-t border-slate-200 mt-4 text-[11px] text-slate-700 font-sans space-y-0.5">
              <div className="font-bold text-slate-900 text-xs">{redatorSignatario}</div>
              <div className="text-slate-600 italic">{redatorCargo}</div>
              <div className="text-[#002b82] font-semibold">{redatorSecretaria}</div>
              <div className="text-slate-500 text-[10px]">Prefeitura Municipal de Rio Claro – RJ</div>
              <div className="text-slate-400 text-[10px]">Praça Raul de Oliveira Rodrigues, s/nº • (24) 3332-1234 • rioclaro.rj.gov.br</div>
            </div>
          </div>
        ) : (
          /* Folha A4 Simulação (Memorando / Ofício / Despacho / Circular / Portaria / Decreto / Atos / Termos) */
          <div 
            className={`bg-white text-slate-900 border border-slate-300 shadow-md flex flex-col justify-between font-serif text-[11px] leading-relaxed select-all ${isFloating ? 'w-full flex-1 min-h-full rounded-lg' : 'rounded-xl flex-1 max-h-[580px] overflow-y-auto'}`}
            style={{
              paddingTop: `${Math.max(1.0, redatorMargemSuperior * 0.7)}rem`,
              paddingRight: `${Math.max(0.8, redatorMargemDireita * 0.7)}rem`,
              paddingBottom: `${Math.max(1.0, redatorMargemInferior * 0.7)}rem`,
              paddingLeft: `${Math.max(0.8, redatorMargemEsquerda * 0.7)}rem`
            }}
          >
            <div>
              {/* Timbre Municipal Oficial de Rio Claro RJ */}
              <div className="flex items-center gap-3.5 pb-4 border-b-2 border-[#002b82]/30 mb-4">
                <img
                  src={BRASAO_RIO_CLARO}
                  onError={e => { (e.target as HTMLImageElement).src = BRASAO_RIO_CLARO; }}
                  alt="Brasão Oficial de Rio Claro RJ"
                  width={60}
                  height={70}
                  style={{
                    width: '60px',
                    height: '70px',
                    minWidth: '60px',
                    minHeight: '70px',
                    maxWidth: '60px',
                    maxHeight: '70px',
                    aspectRatio: '86 / 100',
                    objectFit: 'contain',
                    flexShrink: 0,
                    display: 'block'
                  }}
                  className="brasao-oficial-img object-contain shrink-0"
                />
                <div className="text-[#002b82] font-sans">
                  <div className="font-extrabold text-[12px] tracking-wide uppercase leading-tight">
                    ESTADO DO RIO DE JANEIRO
                  </div>
                  <div className="font-black text-[14px] tracking-tight uppercase leading-tight mt-0.5">
                    PREFEITURA MUNICIPAL DE RIO CLARO
                  </div>
                  <div className="text-[10px] text-slate-600 font-medium leading-tight mt-0.5">
                    Av. João Batista Portugal, nº 230 • CNPJ: 29.051.216/0001-68
                  </div>
                  <div className="font-bold text-[11px] text-[#002b82] uppercase leading-tight mt-0.5">
                    {redatorSecretaria}
                  </div>
                  {redatorSetorOrigem && redatorSetorOrigem !== redatorSecretaria && (
                    <div className="text-[10px] text-slate-600 font-medium leading-tight">
                      {redatorSetorOrigem}
                    </div>
                  )}
                </div>
              </div>

              {/* Layout Exclusivo para DECRETO */}
              {redatorTipo === 'DECRETO' ? (
                <div>
                  {/* Epígrafe Centralizada */}
                  <div className="text-center mb-4 pb-2 border-b border-slate-200">
                    <h3 className="text-sm font-black text-[#002b82] tracking-wider uppercase">
                      {getDocumentoPrefixo('DECRETO', redatorNumero)}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">Prefeitura Municipal de Rio Claro – RJ</span>
                  </div>

                  {/* Ementa Recuada à Direita */}
                  {redatorAssunto && (
                    <div className="ml-auto w-7/12 text-justify italic text-[10px] text-slate-800 leading-snug mb-5 pl-3 border-l-2 border-[#002b82]/40">
                      {redatorAssunto}
                    </div>
                  )}

                  {/* Dispositivo Articulado */}
                  <div
                    className="sgep-rich-doc leading-relaxed mb-6 pl-0"
                    style={{
                      fontFamily: redatorFonte === 'Arial' ? 'Arial, sans-serif' : redatorFonte === 'Calibri' ? 'Calibri, sans-serif' : 'Georgia, "Times New Roman", serif',
                      fontSize: redatorTamanhoFonte === '10pt' ? '11px' : redatorTamanhoFonte === '11pt' ? '12px' : '13px',
                      textAlign: redatorAlinhamento
                    }}
                    dangerouslySetInnerHTML={{
                      __html: converterTextoOficialHTML(redatorTexto, 'preview', redatorFonte, redatorTamanhoFonte, redatorAlinhamento)
                    }}
                  />

                  {/* Local e Data Solene */}
                  <div className="mb-6 font-sans text-xs text-slate-800">
                    <p className="font-medium">{redatorFecho || `Gabinete do Prefeito, Rio Claro – RJ, ${redatorData}.`}</p>
                  </div>
                </div>
              ) : redatorTipo === 'PORTARIA' ? (
                <div>
                  {/* Epígrafe Centralizada */}
                  <div className="text-center mb-4 pb-2 border-b border-slate-200">
                    <h3 className="text-sm font-black text-[#002b82] tracking-wider uppercase">
                      {getDocumentoPrefixo('PORTARIA', redatorNumero)}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">{redatorSecretaria}</span>
                  </div>

                  {/* Ementa Recuada à Direita */}
                  {redatorAssunto && (
                    <div className="ml-auto w-7/12 text-justify italic text-[10px] text-slate-800 leading-snug mb-4 pl-3 border-l-2 border-slate-300">
                      {redatorAssunto}
                    </div>
                  )}

                  {/* Dispositivo Articulado */}
                  <div
                    className="sgep-rich-doc leading-relaxed mb-5 pl-0"
                    style={{
                      fontFamily: redatorFonte === 'Arial' ? 'Arial, sans-serif' : redatorFonte === 'Calibri' ? 'Calibri, sans-serif' : 'Georgia, "Times New Roman", serif',
                      fontSize: redatorTamanhoFonte === '10pt' ? '11px' : redatorTamanhoFonte === '11pt' ? '12px' : '13px',
                      textAlign: redatorAlinhamento
                    }}
                    dangerouslySetInnerHTML={{
                      __html: converterTextoOficialHTML(redatorTexto, 'preview', redatorFonte, redatorTamanhoFonte, redatorAlinhamento)
                    }}
                  />

                  {/* Fecho Solene */}
                  <div className="mb-6 font-sans text-xs text-slate-800">
                    <p className="font-semibold">{redatorFecho || 'Dê-se ciência, registre-se, publique-se e cumpra-se.'}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{redatorData}</p>
                  </div>
                </div>
              ) : (redatorTipo === 'ATO' || redatorTipo === 'TERMO') ? (
                <div>
                  {/* Epígrafe Centralizada */}
                  <div className="text-center mb-4 pb-2 border-b border-slate-200">
                    <h3 className="text-sm font-black text-[#002b82] tracking-wider uppercase">
                      {getDocumentoPrefixo(redatorTipo, redatorNumero)}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {redatorTipo === 'TERMO' ? 'Compromisso de Ajustamento de Conduta (CAC / TAC)' : (redatorSecretaria || 'Comissão Processante')}
                    </span>
                  </div>

                  {/* Ementa / Objeto Recuada à Direita */}
                  {redatorAssunto && (
                    <div className="ml-auto w-8/12 text-justify italic text-[10px] text-slate-800 leading-snug mb-4 pl-3 border-l-2 border-[#002b82]/40">
                      {redatorAssunto}
                    </div>
                  )}

                  {/* Dispositivo Articulado / Termo */}
                  <div
                    className="sgep-rich-doc leading-relaxed mb-5 pl-0"
                    style={{
                      fontFamily: redatorFonte === 'Arial' ? 'Arial, sans-serif' : redatorFonte === 'Calibri' ? 'Calibri, sans-serif' : 'Georgia, "Times New Roman", serif',
                      fontSize: redatorTamanhoFonte === '10pt' ? '11px' : redatorTamanhoFonte === '11pt' ? '12px' : '13px',
                      textAlign: redatorAlinhamento
                    }}
                    dangerouslySetInnerHTML={{
                      __html: converterTextoOficialHTML(redatorTexto, 'preview', redatorFonte, redatorTamanhoFonte, redatorAlinhamento)
                    }}
                  />

                  {/* Local e Data */}
                  <div className="mb-4 font-sans text-xs text-slate-800">
                    <p className="font-semibold text-slate-700">Rio Claro – RJ, {redatorData}.</p>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Número e Data */}
                  <div className="flex justify-between items-baseline mb-4 font-sans text-xs">
                    <strong className="text-[#002b82] font-black text-xs sm:text-sm">
                      {getDocumentoPrefixo(redatorTipo, redatorNumero)}
                    </strong>
                    <span className="text-slate-700 font-medium text-[10px]">{redatorData}</span>
                  </div>

                  {/* Destinatário */}
                  <div className="mb-4 font-sans text-xs">
                    <p className="font-bold text-slate-900 leading-tight">
                      {redatorDestinatario ? (redatorDestinatario.startsWith('À') || redatorDestinatario.startsWith('Ao') ? redatorDestinatario : `À ${redatorDestinatario}`) : 'À Secretaria Municipal de Saúde'}
                    </p>
                    <p className="text-slate-600 text-[10px] font-medium leading-tight mt-0.5">
                      Prefeitura Municipal de Rio Claro – RJ
                    </p>
                  </div>

                  {/* Assunto */}
                  <div className="mb-4 font-sans text-xs pb-1.5 border-b border-slate-200">
                    <span className="font-bold text-slate-900">Assunto: </span>
                    <span className="font-semibold text-slate-800">{redatorAssunto || 'Quantitativo de Servidores e Informações de Folha'}</span>
                    {redatorReferenciaDoc && (
                      <p className="text-[10px] text-slate-500 italic mt-0.5">Ref.: {redatorReferenciaDoc}</p>
                    )}
                  </div>

                  {/* Saudação */}
                  <div className="mb-2 font-sans text-xs font-semibold text-slate-800">
                    {redatorTipo === 'OFICIO' ? 'Senhor(a) Secretário(a),' : 'Prezados,'}
                  </div>

                  {/* Texto com recuo e formatação oficial */}
                  <div
                    className="sgep-rich-doc leading-relaxed mb-6 pl-0"
                    style={{
                      fontFamily: redatorFonte === 'Arial' ? 'Arial, sans-serif' : redatorFonte === 'Calibri' ? 'Calibri, sans-serif' : 'Georgia, "Times New Roman", serif',
                      fontSize: redatorTamanhoFonte === '10pt' ? '11px' : redatorTamanhoFonte === '11pt' ? '12px' : '13px',
                      textAlign: redatorAlinhamento
                    }}
                    dangerouslySetInnerHTML={{
                      __html: converterTextoOficialHTML(redatorTexto, 'preview', redatorFonte, redatorTamanhoFonte, redatorAlinhamento)
                    }}
                  />

                  {/* Fecho Oficial */}
                  <div className="mb-6 font-sans text-xs text-slate-800">
                    <p>{redatorFecho}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Assinatura Oficial Individual ou da Comissão */}
            {renderAssinaturasJSX(false)}
          </div>
        )}
      </>
    );
  };

  return (
    <div className={`sgep-themed-page min-h-screen lg:h-screen flex flex-col font-sans ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* GLOBAL TOP NAV BAR: Visível exclusivamente se solicitado pelo Admin ou ao inspecionar códigos */}
      {(showDevHub || activeTab !== 'app') && (
        <nav className="sgep-themed-header bg-slate-900 border-b border-slate-800 text-white px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-xs">
            <img
              src={BRASAO_RIO_CLARO}
              onError={e => { (e.target as HTMLImageElement).src = BRASAO_RIO_CLARO; }}
              alt="Brasão Municipal de Rio Claro - RJ"
              width={24}
              height={28}
              style={{
                width: '24px',
                height: '28px',
                minWidth: '24px',
                minHeight: '28px',
                maxWidth: '24px',
                maxHeight: '28px',
                aspectRatio: '86 / 100',
                objectFit: 'contain',
                display: 'block',
                flexShrink: 0
              }}
              className="brasao-oficial-img object-contain drop-shadow-xs"
            />
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold tracking-tight text-slate-100 text-xs">Banco Mestre Administrativo</span>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded">v1.5 (GAS v14)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium leading-none block mt-0.5">Prefeitura Municipal de Rio Claro – RJ</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher: App vs Code & Docs */}
        <div className="flex items-center space-x-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('app')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'app'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sistema em Execução</span>
          </button>

          <button
            onClick={() => setActiveTab('codigo-html')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'codigo-html'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Front-end HTML (Vanilla)</span>
          </button>

          <button
            onClick={() => setActiveTab('codigo-gas')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'codigo-gas'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Back-end GAS (Código.gs)</span>
          </button>

          <button
            onClick={() => setActiveTab('planilha')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'planilha'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Estrutura Planilha (4 Abas)</span>
          </button>

          <button
            onClick={() => setActiveTab('guia')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'guia'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Guia & XSS</span>
          </button>
        </div>

        {/* Global Tools: PWA Install, Theme & Sheets Inspector */}
        <div className="flex items-center space-x-2">
          <PWAInstallButton />

          <button
            onClick={() => setIsSheetsDrawerOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white transition-colors text-xs font-semibold shadow-sm"
            title="Ver tabelas de Numeração, Logs, Modelos e Usuários em tempo real"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inspecionar Planilha</span>
          </button>

          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 cursor-pointer"
            title="Personalizar Tema, Cores e Formulários"
          >
            {themeMode === 'system' ? (
              <Monitor className="w-4 h-4 text-sky-300" />
            ) : isDarkMode ? (
              <Moon className="w-4 h-4 text-indigo-300" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: activePaletteMeta.swatch }}
            />
          </button>

          <button
            onClick={() => {
              setShowDevHub(false);
              setActiveTab('app');
            }}
            className="flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer"
            title="Ocultar Barra Técnica"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Ocultar Barra</span>
          </button>
        </div>
      </nav>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SISTEMA EM EXECUÇÃO (INTERACTIVE MUNICIPAL CMS)                    */}
      {/* ========================================================================= */}
      {activeTab === 'app' && (
        <div className="no-print flex-1 flex flex-col lg:overflow-hidden relative animate-in fade-in duration-200">
            
            {/* Top Header - Reorganizado em 2 faixas responsivas para evitar sobreposição em telas pequenas */}
            <header className="sgep-themed-header bg-slate-900 border-b border-slate-800 text-white shadow-md px-3 sm:px-6 py-2.5 flex flex-col gap-2.5 flex-shrink-0 z-30">
              {/* Faixa 1: Identidade Institucional + Usuário e Ações Rápidas */}
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="bg-slate-800/90 border border-slate-700/80 p-1 sm:p-1.5 rounded-xl text-white shadow-xs flex items-center justify-center shrink-0">
                    <img
                      src={BRASAO_RIO_CLARO}
                      onError={e => { (e.target as HTMLImageElement).src = BRASAO_RIO_CLARO; }}
                      alt="Brasão de Rio Claro RJ"
                      width={44}
                      height={52}
                      style={{
                        aspectRatio: '86 / 100',
                        objectFit: 'contain',
                        display: 'block',
                        flexShrink: 0
                      }}
                      className="brasao-oficial-img object-contain drop-shadow-sm w-8 h-[38px] sm:w-10 sm:h-[48px] shrink-0 transition-all"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-bold text-xs sm:text-base tracking-tight text-slate-100 truncate">
                        Prefeitura Municipal de Rio Claro – RJ
                      </h1>
                      <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded shrink-0">
                        v1.5 Oficial (GAS v14)
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">Banco Mestre Administrativo</span>
                      <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">v1.5</span>
                      <span className="text-slate-600 hidden xs:inline">•</span>
                      <span className="text-emerald-400 font-mono text-[10px] sm:text-[11px] flex items-center gap-1">
                        <Cloud className="w-3 h-3 inline shrink-0" />
                        <span>GAS Conectado</span>
                      </span>
                    </p>
                  </div>
                </div>

                {/* Bloco Direito: Identificação do Usuário + Utilitários */}
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 ml-auto shrink-0">
                  <div className="flex items-center text-xs font-medium bg-slate-800/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-700/60">
                    <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 mr-1.5 sm:mr-2 shrink-0" />
                    <div className="leading-tight text-left">
                      <span className="font-semibold block text-slate-200 text-[11px] sm:text-xs">
                        {currentUser.nome.split(' ')[0]}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 block font-mono">
                        {currentUser.nivel}
                      </span>
                    </div>
                  </div>

                  <button
                    id="btn-guia-ajuda"
                    data-tip="ajuda"
                    onClick={() => setIsGuiaAjudaOpen(true)}
                    className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
                    title="Ajuda: Guia passo a passo de como usar o sistema"
                    aria-label="Abrir o guia de uso"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                  </button>

                  <button
                    id="btn-alterar-senha"
                    data-tip="senha"
                    onClick={() => {
                      setPasswordError('');
                      setProfileNameInput(currentUser.nome || '');
                      setCurrentPasswordInput('');
                      setNewPasswordInput('');
                      setConfirmPasswordInput('');
                      setIsPasswordModalOpen(true);
                    }}
                    className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
                    title="Meu Perfil (Alterar Nome) e Senha de Acesso"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                  </button>

                  <button
                    id="btn-sync-header"
                    data-tip="sync"
                    onClick={() => handleSyncData()}
                    className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
                    title="Sincronizar Modelos e Histórico de Numeração"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFromGas ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    id="theme-toggle"
                    data-tip="modotema"
                    onClick={() => setIsThemeModalOpen(true)}
                    className="relative flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-100 transition-all border border-white/15 cursor-pointer active:scale-95"
                    title={`Tema: ${activePaletteMeta.label} (${themeMode === 'system' ? 'Automático' : isDarkMode ? 'Escuro' : 'Claro'}) — Clique para personalizar`}
                    aria-label="Personalizar tema, cores e estilo dos formulários"
                    aria-expanded={isThemeModalOpen}
                  >
                    <span className="relative flex items-center justify-center">
                      {themeMode === 'system' ? (
                        <Monitor className="w-3.5 h-3.5 text-sky-300" />
                      ) : isDarkMode ? (
                        <Moon className="w-3.5 h-3.5 text-indigo-300" />
                      ) : (
                        <Sun className="w-3.5 h-3.5 text-amber-300" />
                      )}
                      <span
                        className="absolute -bottom-0.5 -right-1 w-2 h-2 rounded-full ring-1 ring-slate-950"
                        style={{ backgroundColor: activePaletteMeta.swatch }}
                      />
                    </span>
                    <span className="hidden md:inline text-[11px] font-semibold tracking-tight text-slate-100">
                      Tema
                    </span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="p-1.5 sm:p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-colors border border-rose-800/60 cursor-pointer"
                    title="Sair da Sessão"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Faixa 2: Ações Operacionais, Pasta/Secretaria Ativa e Comandos Admin */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 pt-2 border-t border-slate-800/80">
                {/* Alternador Início / Banco de Modelos */}
                <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-800/90 border border-slate-700/80 shrink-0">
                  <button
                    type="button"
                    id="btn-nav-central-inicio"
                    onClick={() => {
                      setActiveTab('app');
                      setActiveAppView('inicio');
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      activeAppView === 'inicio'
                        ? 'bg-slate-100 text-slate-900 shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    title="Voltar à Central de Início com acesso rápido a todos os módulos"
                  >
                    <Home className="w-3.5 h-3.5 shrink-0" />
                    <span>Início</span>
                  </button>
                  <button
                    type="button"
                    id="btn-nav-banco-modelos"
                    onClick={() => {
                      setActiveTab('app');
                      setActiveAppView('modelos');
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      activeAppView === 'modelos'
                        ? 'bg-slate-100 text-slate-900 shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    title="Abrir o Banco de Modelos completo e Índice Temático"
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span>Modelos</span>
                  </button>
                </div>

                <button
                  id="btn-abrir-redator"
                  data-tip="redator"
                  onClick={() => handleAbrirRedatorComTipo()}
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                  title="Redigir Memorando ou Ofício com numeração sequencial automática"
                >
                  <FilePen className="w-3.5 h-3.5 shrink-0" />
                  <span className="sm:hidden">Redigir</span>
                  <span className="hidden sm:inline">Redigir Memorando/Ofício</span>
                </button>

                <button
                  id="btn-abrir-livro"
                  data-tip="livro"
                  onClick={() => {
                    setActiveSheetTab('numeracao');
                    setIsSheetsDrawerOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer border border-blue-400/30 shrink-0"
                  title="Abrir o Livro de Numeração Oficial com os registros da secretaria ativa"
                >
                  <ListOrdered className="w-3.5 h-3.5 shrink-0" />
                  <span className="sm:hidden">Livro ({numeracoesFiltradas.length})</span>
                  <span className="hidden sm:inline">Livro de Numeração ({numeracoesFiltradas.length})</span>
                </button>

                <button
                  type="button"
                  id="btn-importar-catalogar-docs"
                  onClick={() => setIsImportCatalogModalOpen(true)}
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer border border-sky-400/30 shrink-0"
                  title="Enviar arquivos PDF ou DOCX (individual ou em lote) para reconhecimento automático e catalogação"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span className="sm:hidden">Importar</span>
                  <span className="hidden sm:inline">Importar PDF / DOCX</span>
                </button>

                <div
                  id="wrapper-seletor-secretaria-ativa"
                  data-tip="pasta"
                  className="flex items-center text-xs font-semibold bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 shadow-xs min-w-0 flex-1 sm:flex-initial max-w-full sm:max-w-[270px]"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-400 mr-1.5 shrink-0" />
                  <span className="text-[11px] text-slate-400 mr-1.5 hidden xl:inline shrink-0">Pasta:</span>
                  {listaSecretariasDoUsuario.length > 1 || currentUser?.nivel === 'ADMIN' ? (
                    <select
                      value={activeSecretaria}
                      onChange={e => handleChangeActiveSecretaria(e.target.value)}
                      className="bg-transparent text-xs text-blue-300 font-bold focus:outline-none cursor-pointer pr-1 w-full min-w-0 truncate"
                      title="Alternar Secretaria de Atuação (Seus documentos e numerações serão emitidos por esta pasta)"
                    >
                      {currentUser?.nivel === 'ADMIN' && (
                        <option value="TODAS" className="bg-slate-900 text-purple-300">
                          🏛️ Todas as Secretarias (Auditoria Geral)
                        </option>
                      )}
                      {listaSecretariasDoUsuario.map(s => (
                        <option key={s} value={s} className="bg-slate-900 text-slate-100">
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-blue-300 font-bold truncate w-full min-w-0" title={activeSecretaria}>
                      {activeSecretaria}
                    </span>
                  )}
                </div>

                {currentUser?.nivel === 'ADMIN' && (
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 lg:ml-auto">
                    <button
                      id="btn-gestao-admin"
                      data-tip="admin"
                      onClick={() => setIsAdminModalOpen(true)}
                      className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 border border-indigo-400/30 cursor-pointer"
                      title="Painel de Administração: Autorizações, Servidores, Senhas, Secretarias e Departamentos"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Gestão Admin</span>
                      {(() => {
                        const pendingMatSet = new Set(
                          pedidosRecuperacao
                            .filter(p => p.status === 'PENDENTE')
                            .map(p => String(p.matricula).trim().toLowerCase())
                        );
                        const totalPendencias =
                          pedidosRecuperacao.filter(p => p.status === 'PENDENTE').length +
                          usuarios.filter(u => !u.ativo && !pendingMatSet.has(String(u.matricula).trim().toLowerCase())).length;
                        return totalPendencias > 0 ? (
                          <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full animate-pulse">
                            {totalPendencias}
                          </span>
                        ) : null;
                      })()}
                    </button>

                    <button
                      onClick={() => {
                        setEditingModelo({});
                        setIsCrudModalOpen(true);
                      }}
                      className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all shadow-sm active:scale-95 border border-slate-700 cursor-pointer"
                      title="Cadastrar novo modelo documental"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>Novo Modelo</span>
                    </button>

                    <button
                      onClick={() => setShowDevHub(!showDevHub)}
                      className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        showDevHub || activeTab !== 'app'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="Alternar Central Técnica (Visualizar código GAS, HTML e Planilha)"
                    >
                      <Code2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden sm:inline">Central Técnica</span>
                    </button>
                  </div>
                )}
              </div>
            </header>

            {activeAppView === 'inicio' ? (
              <CentralInicioView
                currentUser={currentUser}
                activeSecretaria={activeSecretaria}
                activeSecretariaSigla={getSecretariaSigla(activeSecretaria, secretarias)}
                canSwitchSecretaria={listaSecretariasDoUsuario.length > 1 || currentUser?.nivel === 'ADMIN'}
                listaSecretariasDoUsuario={listaSecretariasDoUsuario}
                onChangeSecretaria={handleChangeActiveSecretaria}
                totalModelos={modelos.length}
                totalDespachosModelos={modelos.filter(i => (i.TipoDocumento || '').toUpperCase() === 'DESPACHO').length}
                totalFavoritos={favoritos.length}
                categoriaComissoes={categoriaComissoes}
                totalComissoesModelos={totalComissoesModelos}
                numeracoesFiltradas={numeracoesFiltradas}
                totalAdminPendencias={totalAdminPendencias}
                totalUsuarios={usuarios.length}
                savedDraft={savedRedatorDraftSummary}
                skipHomeHub={skipHomeHub}
                onToggleSkipHomeHub={handleToggleSkipHomeHub}
                onContinuarRascunho={handleContinuarRascunhoDaCentral}
                onDescartarRascunho={handleDescartarRascunhoDaCentral}
                onAbrirRedator={handleAbrirRedatorComTipo}
                onAbrirLivro={() => {
                  setActiveSheetTab('numeracao');
                  setIsSheetsDrawerOpen(true);
                }}
                onIrParaModelos={handleIrParaModelos}
                onAbrirImportacao={() => setIsImportCatalogModalOpen(true)}
                onAbrirAdmin={() => setIsAdminModalOpen(true)}
                onAbrirGuia={() => setIsGuiaAjudaOpen(true)}
                onAbrirPerfilSenha={() => {
                  setPasswordError('');
                  setProfileNameInput(currentUser.nome || '');
                  setCurrentPasswordInput('');
                  setNewPasswordInput('');
                  setConfirmPasswordInput('');
                  setIsPasswordModalOpen(true);
                }}
                onResponderDocumento={handleResponderDocumento}
                onUsarDocumentoComoBase={handleUsarDocumentoComoBase}
                formatDataHoraExibicao={formatDataHoraExibicao}
              />
            ) : (
              <>
                {/* Dashboard Stats */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2 flex-shrink-0">
              <div className="grid grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2.5 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold truncate">Total</p>
                  <p className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100">{modelos.length}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold truncate">Despachos</p>
                  <p className="text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400">
                    {modelos.filter(i => (i.TipoDocumento || '').toUpperCase() === 'DESPACHO').length}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold truncate">Pareceres</p>
                  <p className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400">
                    {modelos.filter(i => (i.TipoDocumento || '').toUpperCase() === 'PARECER').length}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold truncate">E-mails</p>
                  <p className="text-sm sm:text-base font-extrabold text-purple-600 dark:text-purple-400">
                    {modelos.filter(i => (i.TipoDocumento || '').toUpperCase() === 'EMAIL').length}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold truncate">Ofícios</p>
                  <p className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {modelos.filter(i => (i.TipoDocumento || '').toUpperCase() === 'OFICIO').length}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold truncate">Checklists</p>
                  <p className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400">
                    {modelos.filter(i => (i.TipoDocumento || '').toUpperCase() === 'CHECKLIST').length}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800 col-span-2 lg:col-span-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold truncate">Favoritos</p>
                  <p className="text-sm sm:text-base font-extrabold text-amber-500">{favoritos.length}</p>
                </div>
              </div>
            </div>

            {/* COMBO DE TODOS OS DOCUMENTOS E REGISTROS DA ABA NUMERAÇÃO */}
            <div className="bg-gradient-to-r from-slate-50 via-emerald-50/20 to-slate-50 dark:from-slate-900/90 dark:via-emerald-950/20 dark:to-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 text-xs flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 w-full lg:w-auto flex-1 min-w-0">
                <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-bold whitespace-nowrap shrink-0">
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <span>Livro de Numeração (Combo Oficial):</span>
                </div>
                
                <div className="relative flex-1 w-full lg:max-w-2xl min-w-0">
                  <select
                    id="combo-livro-numeracao"
                    data-tip="combotopo"
                    value={selectedComboDocNum}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedComboDocNum(val);
                      const doc = numeracoesFiltradas.find(n => n.numero === val);
                      setInspectedDocFromCombo(doc || null);
                    }}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm truncate"
                  >
                    <option value="">
                      Selecione para consultar um documento do seu escopo ({numeracoesFiltradas.length} registros em {activeSecretaria === 'TODAS' ? 'Auditoria Geral' : getSecretariaSigla(activeSecretaria, secretarias)})...
                    </option>
                    {numeracoesFiltradas.map((item, idx) => (
                      <option key={idx} value={item.numero}>
                        [{item.numero}] {item.tipoDocumento} — {item.assunto} | Dest: {item.destinatario} ({formatDataHoraExibicao(item.dataHora, false)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {inspectedDocFromCombo ? (
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between sm:justify-end bg-white dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-xs">
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-full sm:max-w-xs">
                    <strong className="text-emerald-600 dark:text-emerald-400">{inspectedDocFromCombo.tipoDocumento} {inspectedDocFromCombo.numero}</strong> • Dest: {inspectedDocFromCombo.destinatario}
                  </span>
                  <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setRedatorTipo((inspectedDocFromCombo.tipoDocumento as any) || 'MEMORANDO');
                        setRedatorNumero(inspectedDocFromCombo.numero);
                        setRedatorDestinatario(inspectedDocFromCombo.destinatario || 'Prefeitura Municipal');
                        setRedatorAssunto(inspectedDocFromCombo.assunto || 'Sem Assunto');
                        setIsRedatorLetterheadOpen(true);
                        showToast(`Documento ${inspectedDocFromCombo.numero} aberto para visualização timbrada e impressão!`);
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-[10px] flex items-center space-x-1 shadow-xs cursor-pointer"
                      title="Visualizar documento em papel timbrado oficial para reimpressão"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Ver Timbrado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(inspectedDocFromCombo.numero);
                        showToast(`Número ${inspectedDocFromCombo.numero} copiado!`);
                      }}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded font-semibold text-[10px] flex items-center space-x-1 cursor-pointer"
                      title="Copiar número oficial"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUsarDocumentoComoBase(inspectedDocFromCombo)}
                      className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded font-semibold text-[10px] flex items-center space-x-1 cursor-pointer"
                      title="Duplicar dados deste documento no Redator para gerar um novo ato semelhante (com nova numeração)"
                    >
                      <Files className="w-3 h-3" />
                      <span>Usar como base</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const tipoResp = inspectedDocFromCombo.tipoDocumento === 'OFICIO' ? 'OFICIO' : 'MEMORANDO';
                        redatorDraftSkipNextPromptRef.current = true;
                        setPendingRedatorDraft(null);
                        setRedatorTipo(tipoResp);
                        setRedatorReferenciaDoc(`${inspectedDocFromCombo.tipoDocumento} nº ${inspectedDocFromCombo.numero}`);
                        setRedatorDestinatario(inspectedDocFromCombo.destinatario !== 'Não informado' ? inspectedDocFromCombo.destinatario : '');
                        setRedatorAssunto(`Em resposta ao ${inspectedDocFromCombo.tipoDocumento} nº ${inspectedDocFromCombo.numero} – ${inspectedDocFromCombo.assunto}`);
                        setRedatorTexto(`Cumprimentando-o cordialmente, sirvo-me do presente para apresentar as manifestações e informações pertinentes em resposta ao ${inspectedDocFromCombo.tipoDocumento} nº ${inspectedDocFromCombo.numero}, concernente a ${inspectedDocFromCombo.assunto}.\n\nInformo que as medidas foram devidamente instruídas, visando à regular continuidade dos serviços públicos desta municipalidade.`);
                        setRedatorNumero('');
                        setIsRedatorModalOpen(true);
                        showToast(`Referência e modelo de resposta ao ${inspectedDocFromCombo.numero} carregados no Redator!`);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[10px] flex items-center space-x-1 shadow-xs cursor-pointer"
                      title="Iniciar resposta oficial com referência e texto automático no Redator"
                    >
                      <FilePen className="w-3 h-3" />
                      <span>Responder no Redator</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden xl:flex items-center space-x-2 text-[11px] text-slate-500 shrink-0">
                  <span>💡 Escolha um documento acima para consultar dados de protocolo ou usá-lo como referência no redator.</span>
                </div>
              )}
            </div>

            {/* Workspace Area: Sidebar & Document Grid */}
            <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden max-w-[1600px] w-full mx-auto p-3 sm:p-6 gap-4 lg:gap-6">
              
              {/* Sidebar (Empilhada e retrátil em telas pequenas/celulares) */}
              <aside className="w-full lg:w-72 flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(prev => !prev)}
                  className="lg:hidden w-full p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Filtros e Índice Temático</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="max-w-[140px] truncate">{selectedCategory || selectedType}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isMobileSidebarOpen ? 'rotate-90' : ''}`} />
                  </span>
                </button>

                <div className={`${isMobileSidebarOpen ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'} flex-1 overflow-hidden`}>
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hidden lg:flex items-center justify-between">
                    <h2 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tipos de Documento</h2>
                  </div>
                  
                  {/* Type Filter Buttons */}
                  <div 
                    id="type-filters"
                    data-tip="tipos"
                    className="p-2.5 space-y-1 overflow-y-auto border-b border-slate-100 dark:border-slate-800 max-h-48"
                  >
                    {['TODOS', 'FAVORITOS', 'ATO', 'TERMO', 'PORTARIA', 'DECISAO', 'DESPACHO', 'EMAIL', 'OFICIO', 'PARECER', 'MEMORANDO', 'CHECKLIST'].map(t => {
                      const isSelected = selectedType === t;
                      const count = t === 'TODOS' ? modelos.length :
                                   t === 'FAVORITOS' ? favoritos.length :
                                   modelos.filter(m => (m.TipoDocumento || '').toUpperCase() === t).length;
                      const label = t === 'TODOS' ? 'Todos os Modelos' :
                                    t === 'FAVORITOS' ? 'Favoritos' :
                                    t === 'ATO' ? 'Atos / PAD' :
                                    t === 'TERMO' ? 'Termos / TAC' :
                                    t === 'PORTARIA' ? 'Portarias' :
                                    t === 'DECISAO' ? 'Decisões' :
                                    t === 'DESPACHO' ? 'Despachos' :
                                    t === 'EMAIL' ? 'E-mails' :
                                    t === 'OFICIO' ? 'Ofícios' :
                                    t === 'PARECER' ? 'Pareceres' :
                                    t === 'MEMORANDO' ? 'Memorandos' :
                                    t === 'CHECKLIST' ? 'Checklists' :
                                    t.charAt(0) + t.slice(1).toLowerCase();
                      return (
                        <button
                          key={t}
                          onClick={() => { setSelectedType(t); setSelectedCategory(null); setIsMobileSidebarOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <h2 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">Índice Temático</h2>
                  </div>

                  {/* Categories */}
                  <nav 
                    id="category-list"
                    data-tip="indice"
                    className="flex-1 overflow-y-auto p-2.5 space-y-1 max-h-56 lg:max-h-none"
                  >
                    {categories.map(cat => {
                      const isSelected = selectedCategory === cat;
                      const count = modelos.filter(m => m.Categoria === cat).length;
                      return (
                        <button
                          key={cat}
                          onClick={() => { setSelectedCategory(isSelected ? null : cat); setIsMobileSidebarOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors truncate ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate text-left mr-2" title={cat}>{cat}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded flex-shrink-0 ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </nav>

                  {/* Datalists Live Summary Badge */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Destinatários únicos:
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">{listaDestinatariosBase.length}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Assuntos únicos:
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">{listaAssuntosBase.length}</strong>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content Area */}
              <main className="flex-1 min-w-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm lg:overflow-hidden">
                
                {/* Search & Active Filter Bar */}
                <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
                  <div className="relative w-full sm:flex-1 sm:max-w-lg min-w-0">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      id="search-input"
                      data-tip="busca"
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Pesquisar por título, corpo do texto, base legal, tags..."
                      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
                    />
                  </div>

                  <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                    <span className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 max-w-full truncate">
                      {selectedCategory ? `Cat: ${selectedCategory}` : `Tipo: ${selectedType}`}
                    </span>
                    {(selectedType !== 'TODOS' || selectedCategory || searchQuery) && (
                      <button
                        onClick={() => { setSelectedType('TODOS'); setSelectedCategory(null); setSearchQuery(''); }}
                        className="text-xs text-slate-500 hover:text-emerald-600 underline px-2 py-1"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                {/* Model Cards Scroll Area */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
                  {filteredModelos.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">Nenhum modelo documental encontrado.</p>
                      <p className="text-xs text-slate-400 mt-1">Experimente alterar os filtros ou o termo de busca.</p>
                    </div>
                  ) : (
                    filteredModelos.map(modelo => {
                      const isFav = favoritos.includes(modelo.ID);
                      const tags = (modelo.PalavrasChave || '').split(',').map(t => t.trim()).filter(Boolean);

                      return (
                        <div
                          key={modelo.ID}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {modelo.TipoDocumento}
                                </span>
                                {modelo.TipoDecisao && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    modelo.TipoDecisao === 'DEFERIMENTO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                                    modelo.TipoDecisao === 'ENCAMINHAMENTO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800' :
                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                  }`}>
                                    {modelo.TipoDecisao}
                                  </span>
                                )}
                                <span className="text-xs text-slate-500">{modelo.Categoria}</span>
                                <span className="text-[10px] text-slate-400 font-mono">#{modelo.ID}</span>
                              </div>

                              <div className="flex items-center space-x-1.5 flex-shrink-0">
                                {currentUser?.nivel === 'ADMIN' && (
                                  <button
                                    onClick={() => {
                                      setEditingModelo(modelo);
                                      setIsCrudModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-blue-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Editar Modelo na Planilha"
                                  >
                                    <FilePen className="w-4 h-4" />
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setFavoritos(prev =>
                                      prev.includes(modelo.ID) ? prev.filter(f => f !== modelo.ID) : [...prev, modelo.ID]
                                    );
                                  }}
                                  className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                                    isFav ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'
                                  }`}
                                  title="Favoritar"
                                >
                                  <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                                </button>

                                <button
                                  onClick={() => handleOpenVariableModal(modelo)}
                                  className="ml-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Personalizar</span>
                                </button>
                              </div>
                            </div>

                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2">{modelo.Titulo}</h4>

                            {modelo.Observacao && (
                              <div className="mb-3 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 flex items-start gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <span><strong>Orientações Administrativas:</strong> {modelo.Observacao}</span>
                              </div>
                            )}

                            <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans mb-3 select-all">
                              {renderCardTextWithBrackets(modelo.Texto)}
                            </div>

                            {modelo.BaseLegal && (
                              <div className="mb-3 text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/30 p-2.5 rounded-lg border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span><strong>Base Legal:</strong> {modelo.BaseLegal}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                            {tags.map(t => (
                              <span key={t} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[10px] font-medium">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </main>
            </div>
              </>
            )}
          </div>
        )}

      {/* ========================================================================= */}
      {/* TAB 2: CÓDIGO-FONTE COMPLETO FRONT-END (HTML VANILLA + TAILWIND)           */}
      {/* ========================================================================= */}
      {activeTab === 'codigo-html' && (
        <div className="flex-1 flex flex-col overflow-hidden p-6 max-w-[1600px] w-full mx-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <div className="flex items-center space-x-2">
                  <Code2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">index.html (Front-end Vanilla JS + Tailwind)</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Arquivo Único • Zero Build
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Inclui elementos datalist dinâmicos para [DESTINATÁRIO] e [ASSUNTO], envio inteligente e proteção contra XSS via sanitização.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyCode(rawHtmlContent, 'html')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
                >
                  {copiedCodeTab === 'html' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCodeTab === 'html' ? 'Copiado!' : 'Copiar HTML Completo'}</span>
                </button>

                <button
                  onClick={() => handleDownloadFile(rawHtmlContent, 'index.html', 'text/html')}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar index.html</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs text-slate-300 leading-relaxed">
              <pre className="select-all">
                <code>{rawHtmlContent}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CÓDIGO-FONTE COMPLETO BACK-END (APPS SCRIPT v3.2 Código.gs)         */}
      {/* ========================================================================= */}
      {activeTab === 'codigo-gas' && (
        <div className="flex-1 flex flex-col overflow-hidden p-6 max-w-[1600px] w-full mx-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <div className="flex items-center space-x-2">
                  <Server className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Código.gs (Google Apps Script API v3.9 - Implantação v13)</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    LockService • Isolamento por Pasta/Depto • Gravação 8 Colunas
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Autenticação por token, isolamento estrito por Secretaria e Departamento no servidor e registro oficial de 8 colunas na aba Numeração.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyCode(APPS_SCRIPT_CODE, 'gas')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
                >
                  {copiedCodeTab === 'gas' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCodeTab === 'gas' ? 'Copiado!' : 'Copiar Código.gs'}</span>
                </button>

                <button
                  onClick={() => handleDownloadFile(APPS_SCRIPT_CODE, 'Codigo.gs', 'text/javascript')}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Codigo.gs</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs text-slate-300 leading-relaxed">
              <pre className="select-all">
                <code>{APPS_SCRIPT_CODE}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ESTRUTURA DA PLANILHA GOOGLE SHEETS (AS 4 ABAS)                   */}
      {/* ========================================================================= */}
      {activeTab === 'planilha' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-[1600px] w-full mx-auto space-y-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-xl">
            <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <Table className="w-4 h-4" />
              <span>Arquitetura de Dados em Planilha Única (Zero Cost)</span>
            </h3>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-400 mt-1">
              O sistema opera em uma única planilha Google Sheets, dividida em 4 abas estruturadas. A ordem e nomes das colunas são essenciais para que o Web App funcione sem falhas.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {PLANILHA_ESTRUTURA.map((tab, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <span>Aba: <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-mono">"{tab.aba}"</code></span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tab.descricao}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3 font-bold">Coluna</th>
                        <th className="p-3 font-bold">Campo</th>
                        <th className="p-3 font-bold">Tipo</th>
                        <th className="p-3 font-bold">Exemplo Real</th>
                        <th className="p-3 font-bold">Finalidade Técnica</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-400 font-sans">
                      {tab.colunas.map((col: any, cIdx: number) => (
                        <tr key={cIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">{col.nome}</td>
                          <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{col.campo || col.nome}</td>
                          <td className="p-3 font-mono text-[11px]">{col.tipo}</td>
                          <td className="p-3 font-mono text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/40">{col.exemplo}</td>
                          <td className="p-3 text-[11px]">{col.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GUIA DE DEPLOY & SEGURANÇA CONTRA XSS                              */}
      {/* ========================================================================= */}
      {activeTab === 'guia' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-[1200px] w-full mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Instruções Passo a Passo de Atualização e Implantação</span>
            </h3>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
                  <span>Ajuste da Planilha Google Sheets (Aba Numeração com 6 Colunas)</span>
                </h4>
                <p>Abra sua planilha do Google Sheets e certifique-se de que a aba <strong>"Numeração"</strong> possui o cabeçalho exato na Linha 1:</p>
                <div className="bg-slate-900 text-emerald-400 p-2.5 rounded font-mono text-[11px] overflow-x-auto">
                  A1: DataHora | B1: TipoDocumento | C1: Numero | D1: Assunto | E1: Usuario | F1: Destinatario
                </div>
                <p className="text-[11px] text-slate-500">
                  Isso garante que a coluna D seja lida para <strong>Assuntos</strong> e a coluna F seja lida para <strong>Destinatários</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
                  <span>Atualizar o Código no Google Apps Script</span>
                </h4>
                <p>Na planilha, vá em <strong>Extensões → Apps Script</strong>:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Substitua todo o conteúdo do arquivo <code>Código.gs</code> pelo código fornecido na aba <strong>Back-end GAS</strong>.</li>
                  <li>Clique em <strong>Salvar</strong> (ícone de disquete).</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                  <span>Publicar Nova Versão do Web App (Crítico!)</span>
                </h4>
                <p>No editor do Apps Script, você <strong>DEVE</strong> publicar uma nova versão para que as alterações tenham efeito:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Clique no botão azul <strong>Implantar (Deploy) → Gerenciar implantações</strong>.</li>
                  <li>Clique no ícone de lápis (Editar) na implantação ativa.</li>
                  <li>Em <strong>Versão</strong>, selecione <strong>Nova versão</strong>.</li>
                  <li>Verifique se <em>Executar como</em> está configurado como <strong>"Eu"</strong> e <em>Quem tem acesso</em> como <strong>"Qualquer pessoa"</strong>.</li>
                  <li>Clique em <strong>Implantar</strong>. Copie o URL da aplicação Web gerado (se for o mesmo, o front continuará apontando automaticamente).</li>
                </ol>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">4</span>
                  <span>Auditoria e Proteção Contra XSS Implementada</span>
                </h4>
                <p>Nesta versão 3.2, todas as renderizações de dados vindos da planilha ou digitados pelos usuários passam por sanitização rígida:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><code>sanitizeHTML(str)</code>: Garante que tags como <code>&lt;script&gt;</code>, <code>&lt;img onerror&gt;</code> ou eventos inline sejam convertidos em entidades seguras.</li>
                  <li><code>sanitizeAttribute(str)</code>: Evita quebra de aspas dentro de atributos HTML (como <code>value="..."</code> e <code>list="..."</code>).</li>
                  <li>O realce de colchetes <code>highlightBrackets(text)</code> é executado estritamente <strong>após</strong> o escaping, garantindo que variáveis não executem código malicioso.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: VARIÁVEIS COM DATALISTS & GERADOR OFICIAL INTELIGENTE           */}
      {/* ========================================================================= */}
      {isVariableModalOpen && activeModelo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsVariableModalOpen(false); }}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Personalizar: {activeModelo.Titulo}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Preencha os campos abaixo. O sistema sugere histórico municipal para destinatários e assuntos.
                </p>
              </div>

              <button
                onClick={() => setIsVariableModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Datalists for Autocomplete */}
            <datalist id="react-datalist-destinatarios">
              {sugestoes.destinatarios.map((d, i) => (
                <option key={i} value={d} />
              ))}
            </datalist>

            <datalist id="react-datalist-assuntos">
              {sugestoes.assuntos.map((a, i) => (
                <option key={i} value={a} />
              ))}
            </datalist>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              
              {/* Column 1: Form Fields */}
              <div className="space-y-4">
                {activeModelo.Observacao && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Orientações Administrativas:</strong>
                      <p className="mt-0.5 leading-snug">{activeModelo.Observacao}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Campos Identificados ({Object.keys(formVariables).length})</span>
                  </h4>
                </div>

                <div className="space-y-3.5">
                  {Object.keys(formVariables).length === 0 ? (
                    <p className="text-xs text-slate-500 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                      Este modelo não possui variáveis entre colchetes. O texto já está pronto para cópia ao lado.
                    </p>
                  ) : (
                    Object.keys(formVariables).map(m => {
                      const cleanName = m.replace(/[\[\]]/g, '').trim();
                      const normName = cleanName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
                      const isNumero = normName.includes('NUMERO');
                      const isDestinatario = normName.includes('DESTINATARIO') || normName.includes('SETOR');
                      const isAssunto = normName.includes('ASSUNTO');

                      if (isNumero) {
                        return (
                          <div key={m} className="p-3 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-blue-900 dark:text-blue-300">
                                #{cleanName}:
                              </label>
                              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                                Sequencial Oficial (LockService)
                              </span>
                            </div>

                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={formVariables[m]}
                                onChange={e => setFormVariables({ ...formVariables, [m]: e.target.value })}
                                placeholder="Ex: 3/2026 ou clique em Gerar Oficial"
                                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                disabled={isGeneratingNumber}
                                onClick={() => handleGerarNumeroOficial(m)}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 active:scale-95 whitespace-nowrap"
                              >
                                {isGeneratingNumber ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Travando concorrência...</span>
                                  </>
                                ) : (
                                  <>
                                    <ListOrdered className="w-3.5 h-3.5" />
                                    <span>Gerar Oficial</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              Captura os campos Assunto e Destinatário preenchidos e grava na planilha e na auditoria.
                            </p>
                          </div>
                        );
                      }

                      if (isDestinatario) {
                        return (
                          <div key={m} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                {cleanName}:
                              </label>
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-medium border border-emerald-200 dark:border-emerald-800">
                                ⚡ Datalist Inteligente
                              </span>
                            </div>
                            <input
                              type="text"
                              list="react-datalist-destinatarios"
                              value={formVariables[m]}
                              onChange={e => setFormVariables({ ...formVariables, [m]: e.target.value })}
                              placeholder="Selecione um órgão ou digite..."
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 shadow-sm"
                            />
                          </div>
                        );
                      }

                      if (isAssunto) {
                        return (
                          <div key={m} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                {cleanName}:
                              </label>
                              <span className="text-[10px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded font-medium border border-blue-200 dark:border-blue-800">
                                ⚡ Datalist Histórico
                              </span>
                            </div>
                            <input
                              type="text"
                              list="react-datalist-assuntos"
                              value={formVariables[m]}
                              onChange={e => setFormVariables({ ...formVariables, [m]: e.target.value })}
                              placeholder="Selecione um assunto cadastrado ou digite..."
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 shadow-sm"
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={m} className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{cleanName}:</label>
                          <input
                            type="text"
                            value={formVariables[m]}
                            onChange={e => setFormVariables({ ...formVariables, [m]: e.target.value })}
                            placeholder={`Preencher ${cleanName}...`}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Column 2: Live Preview */}
              <div className="space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    <span>Pré-Visualização em Tempo Real</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">{previewText.length} caracteres</span>
                </div>

                <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[380px] shadow-inner select-all">
                  {previewText}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-xs text-slate-500 hidden sm:inline-block">
                O texto copiado mantém a formatação oficial para colar no SEI, Processo Digital ou Word.
              </span>

              <div className="flex items-center space-x-2.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsVariableModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleCopyProcessedText}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Documento Formatado</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADMIN CRUD (Criar ou Editar Modelo)                             */}
      {/* ========================================================================= */}
      {isCrudModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsCrudModalOpen(false); }}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm">
                  <FilePen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-300">
                    {editingModelo.ID ? `Editar Modelo (${editingModelo.ID})` : 'Criar Novo Modelo Oficial'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Salva diretamente na aba "Modelos" da planilha da prefeitura.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCrudModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCrud} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Documento *</label>
                    <select
                      value={editingModelo.TipoDocumento || 'DESPACHO'}
                      onChange={e => setEditingModelo({ ...editingModelo, TipoDocumento: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="DESPACHO">DESPACHO</option>
                      <option value="PARECER">PARECER</option>
                      <option value="EMAIL">EMAIL</option>
                      <option value="OFICIO">OFICIO</option>
                      <option value="MEMORANDO">MEMORANDO</option>
                      <option value="CHECKLIST">CHECKLIST</option>
                      <option value="CERTIDAO">CERTIDAO</option>
                      <option value="NOTIFICACAO">NOTIFICACAO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoria (Índice) *</label>
                    <input
                      type="text"
                      value={editingModelo.Categoria || ''}
                      onChange={e => setEditingModelo({ ...editingModelo, Categoria: e.target.value })}
                      placeholder="Ex: 1. Recursos Humanos"
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Título do Modelo *</label>
                  <input
                    type="text"
                    value={editingModelo.Titulo || ''}
                    onChange={e => setEditingModelo({ ...editingModelo, Titulo: e.target.value })}
                    placeholder="Ex: Despacho de Concessão de Férias Regulamentares"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Corpo do Modelo (Use colchetes para campos dinâmicos: [NOME]) *
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        ref={crudFileInputRef}
                        type="file"
                        accept=".pdf,.txt,.docx,.doc,.html,.htm,.md"
                        onChange={handleUploadDocumentoParaModelo}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingSingleFile}
                        onClick={() => crudFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold cursor-pointer transition-colors disabled:opacity-50"
                        title="Carregar PDF (até 10 MB) ou Word/TXT (.docx, .doc, .txt até 5 MB) com reconhecimento automático de categoria e campos"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{isUploadingSingleFile ? 'Reconhecendo...' : 'Upload PDF / DOCX / TXT'}</span>
                      </button>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                        Ex: [DESTINATÁRIO], [ASSUNTO], [NUMERO_MEMORANDO]
                      </span>
                    </div>
                  </div>
                  <textarea
                    rows={8}
                    value={editingModelo.Texto || ''}
                    onChange={e => setEditingModelo({ ...editingModelo, Texto: e.target.value })}
                    placeholder="Digite o texto padrão aqui..."
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Palavras-Chave (Separadas por vírgula)</label>
                    <input
                      type="text"
                      value={editingModelo.PalavrasChave || ''}
                      onChange={e => setEditingModelo({ ...editingModelo, PalavrasChave: e.target.value })}
                      placeholder="férias, rh, servidor, concessão"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Base Legal (Opcional)</label>
                    <input
                      type="text"
                      value={editingModelo.BaseLegal || ''}
                      onChange={e => setEditingModelo({ ...editingModelo, BaseLegal: e.target.value })}
                      placeholder="Ex: Art. 78 da Lei Municipal nº 1.234/2010"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCrudModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Salvar na Planilha Oficial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: MEU PERFIL (NOME) E ALTERAÇÃO DE SENHA DO USUÁRIO               */}
      {/* ========================================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsPasswordModalOpen(false); }}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Meu Perfil e Senha de Acesso</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Prefeitura Municipal de Rio Claro – RJ</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4 overflow-y-auto">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Lotação & Escopo Ativo:</span>
                  <strong className="text-slate-800 dark:text-slate-200 truncate block">{currentUser?.secretaria}</strong>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1" title="A matrícula é imutável para preservar a auditoria dos documentos emitidos">
                  <Lock className="w-3 h-3" />
                  Mat. {currentUser?.matricula}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo de Exibição (Assinaturas e Documentos) *
                </label>
                <input
                  type="text"
                  value={profileNameInput}
                  onChange={e => setProfileNameInput(e.target.value)}
                  placeholder="Digite seu nome completo oficial"
                  required
                  minLength={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  A matrícula funcional permanece fixa para preservar a trilha de auditoria dos documentos já emitidos.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Alterar Senha de Acesso (Opcional)</span>
                  <span className="text-[10px] text-slate-400">Deixe em branco para manter a senha atual</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    value={currentPasswordInput}
                    onChange={e => setCurrentPasswordInput(e.target.value)}
                    placeholder="Confirme a senha atual (se for alterar a senha)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      value={newPasswordInput}
                      onChange={e => setNewPasswordInput(e.target.value)}
                      placeholder="Mínimo de 3 caracteres"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      value={confirmPasswordInput}
                      onChange={e => setConfirmPasswordInput(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {passwordError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 font-medium text-center">
                  {passwordError}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  {isChangingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REDATOR OFICIAL DE MEMORANDO / OFÍCIO (COM NUMERAÇÃO AUTOMÁTICA) */}
      {/* ========================================================================= */}
      {isRedatorModalOpen && (
        <div
          id="modal-redator-oficial"
          className={`fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center no-print transition-all duration-200 ${
            isRedatorFullscreen ? 'p-0' : 'p-3 sm:p-5'
          }`}
          onClick={(e) => {
            if (isResizingRedatorModal || isDraggingRedatorModal) return;
            if (e.target === e.currentTarget) setIsRedatorModalOpen(false);
          }}
        >
          <div
            ref={redatorModalRef}
            style={
              !isRedatorFullscreen
                ? {
                    ...(redatorModalPos
                      ? { position: 'fixed', left: `${redatorModalPos.x}px`, top: `${redatorModalPos.y}px` }
                      : {}),
                    ...(redatorModalSize
                      ? { width: `${redatorModalSize.width}px`, height: `${redatorModalSize.height}px` }
                      : {}),
                  }
                : undefined
            }
            className={`relative bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col ${
              isResizingRedatorModal || isDraggingRedatorModal
                ? 'transition-none ring-4 ring-emerald-500/30 select-none'
                : 'animate-in fade-in zoom-in-95 duration-200'
            } ${
              isRedatorFullscreen
                ? 'w-screen h-screen max-w-none max-h-none rounded-none border-0'
                : redatorModalSize
                ? 'border rounded-2xl max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)]'
                : 'border rounded-2xl max-w-6xl w-full max-h-[95vh]'
            }`}
          >
            {/* Header (Arrastável quando não estiver em tela toda; duplo clique restaura/expande) */}
            <div
              onPointerDown={handleRedatorHeaderPointerDown}
              onPointerMove={handleRedatorHeaderPointerMove}
              onPointerUp={handleRedatorHeaderPointerEnd}
              onPointerCancel={handleRedatorHeaderPointerEnd}
              onDoubleClick={handleRedatorHeaderDoubleClick}
              title={
                isRedatorFullscreen
                  ? 'Duplo clique para restaurar o tamanho da janela'
                  : 'Arraste para mover a janela ou arraste qualquer borda/canto para redimensionar (duplo clique para restaurar/expandir)'
              }
              className={`p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0 select-none ${
                isRedatorFullscreen
                  ? ''
                  : isDraggingRedatorModal
                  ? 'cursor-grabbing touch-none'
                  : 'cursor-grab touch-none'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-sm shrink-0">
                  <FilePen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate">
                      Redator Oficial de Memorando e Ofício
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Numeração Sequencial Automática
                    </span>
                    {redatorDraftSavedAt && !redatorNumero && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                        title="Seu texto é salvo automaticamente no navegador para evitar perdas acidentais"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Rascunho salvo às {redatorDraftSavedAt}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Prefeitura Municipal de Rio Claro – RJ • Padrão Manual de Redação Oficial
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 ml-auto flex-wrap gap-y-1.5">
                {/* Alternador Modo Simples vs. Modo Avançado */}
                <div
                  id="btn-redator-modo"
                  className="inline-flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300/70 dark:border-slate-700 text-[11px] font-semibold"
                  title="Alterne entre Modo Simples (campos essenciais) e Modo Avançado (régua, margens, IA, importação e comissões)"
                >
                  <button
                    type="button"
                    onClick={() => toggleRedatorModoAvancado(false)}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      !redatorModoAvancado
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Simples
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleRedatorModoAvancado(true)}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                      redatorModoAvancado
                        ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Avançado</span>
                  </button>
                </div>

                <button
                  id="btn-toggle-floating-preview"
                  data-tip="previaflutuante"
                  type="button"
                  onClick={toggleFloatingPreview}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                    isFloatingPreview
                      ? 'bg-blue-100 dark:bg-blue-950/80 border-blue-400 text-blue-800 dark:text-blue-200 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title={isFloatingPreview ? 'Acoplar prévia de volta ao lado do editor' : 'Destacar visualização flutuante para acompanhar a digitação'}
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isFloatingPreview ? '📌 Prévia Flutuante (Ativa)' : 'Prévia Flutuante'}</span>
                </button>

                <button
                  id="btn-redator-fullscreen"
                  type="button"
                  onClick={() => setIsRedatorFullscreen(prev => !prev)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                    isRedatorFullscreen
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-400 text-emerald-800 dark:text-emerald-200 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title={isRedatorFullscreen ? 'Restaurar tamanho normal da janela' : 'Expandir Redator Oficial para tela toda'}
                  aria-label={isRedatorFullscreen ? 'Restaurar tamanho normal do Redator' : 'Expandir Redator para tela toda'}
                >
                  {isRedatorFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  )}
                  <span className="hidden sm:inline">{isRedatorFullscreen ? 'Restaurar' : 'Tela Toda'}</span>
                </button>

                <button
                  onClick={() => setIsRedatorModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Fechar Redator Oficial"
                  aria-label="Fechar Redator Oficial"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body: Split View (Editor Form & Timbrado Preview) */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6">
              
              {/* Form Controls (Col 7 ou Col 12 quando flutuante) */}
              <div className={`${isFloatingPreview ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-4`}>

                {/* Banner de Recuperação de Rascunho Automático */}
                {pendingRedatorDraft && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-in fade-in">
                    <div className="flex items-start gap-2 text-amber-950 dark:text-amber-200 min-w-0">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <strong className="block">
                          Rascunho automático encontrado (salvo às {pendingRedatorDraft.savedAt || 'pouco'})
                        </strong>
                        <span className="text-[11px] text-amber-800 dark:text-amber-300 block truncate">
                          {pendingRedatorDraft.tipo} — {pendingRedatorDraft.assunto || 'Sem assunto definido'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => restaurarRascunhoRedator(pendingRedatorDraft)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-colors"
                      >
                        Restaurar rascunho
                      </button>
                      <button
                        type="button"
                        onClick={limparRascunhoRedator}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-amber-300 dark:border-amber-800 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                )}

                {isFloatingPreview && (
                  <div className="p-2.5 px-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 min-w-0">
                      <span className="flex h-2.5 w-2.5 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                      </span>
                      <span className="truncate text-xs">
                        <strong>Modo de Visualização Flutuante Ativo:</strong> A prévia do documento acompanha sua digitação em tempo real no canto inferior da tela.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleFloatingPreview}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs whitespace-nowrap active:scale-95 transition-all shrink-0 ml-3 cursor-pointer"
                    >
                      Acoplar na Tela (Lado a Lado)
                    </button>
                  </div>
                )}
                
                {/* Tipo de Documento & Numeração Automática Header Card */}
                <div className="p-4 bg-gradient-to-br from-slate-50 to-emerald-50/40 dark:from-slate-800/60 dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                        Tipo de Documento:
                      </label>
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        {(['MEMORANDO', 'OFICIO', 'DESPACHO', 'CIRCULAR', 'PORTARIA', 'DECRETO', 'ATO', 'TERMO', 'EMAIL'] as const)
                          .filter(t => redatorModoAvancado || ['MEMORANDO', 'OFICIO', 'DESPACHO', 'CIRCULAR', 'PORTARIA', 'EMAIL'].includes(t) || redatorTipo === t)
                          .map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setRedatorTipo(t);
                              setRedatorNumero('');
                              if (t === 'DECRETO') {
                                if (currentUser?.nivel === 'ADMIN' || isUserAuthorizedForSecretaria(currentUser, 'Gabinete do Prefeito', secretarias)) {
                                  setRedatorSecretaria('Secretaria de Governo e Gabinete do Prefeito (SEGOV)');
                                  setRedatorSetorOrigem('Gabinete do Prefeito');
                                  setRedatorSignatario('Prefeito Municipal de Rio Claro');
                                  setRedatorCargo('Prefeito Municipal');
                                } else {
                                  showToast('Minuta de Decreto carregada mantendo a emissão vinculada à sua Secretaria autorizada.', 'Escopo Mantido');
                                }
                                setRedatorDestinatario('Poder Executivo Municipal e Órgãos da Administração Direta e Indireta');
                                setRedatorFecho('Gabinete do Prefeito, Rio Claro – RJ, na data de sua publicação.');
                                if (!redatorTexto.trim() || redatorTexto.includes('Cumprimentando-o cordialmente') || redatorTexto.includes('Prezado(a)') || redatorTexto.includes('RESOLVE:') || redatorTexto.includes('COMPROMISSO')) {
                                  setRedatorAssunto('Declara ponto facultativo nas repartições públicas municipais e dá outras providências');
                                  setRedatorTexto(
                                    'O PREFEITO MUNICIPAL DE RIO CLARO, Estado do Rio de Janeiro, no uso das atribuições legais que lhe confere a Lei Orgânica do Município de Rio Claro, e\n\nCONSIDERANDO a conveniência administrativa e as festividades oficiais no Município;\n\nDECRETA:\n\nArt. 1º É declarado ponto facultativo no âmbito de todos os órgãos e repartições da Administração Pública Municipal Direta e Indireta no dia [DATA].\n\nArt. 2º Os serviços essenciais de urgência e emergência em saúde, defesa civil e coleta de resíduos funcionarão em regime de plantão.\n\nArt. 3º Este Decreto entra em vigor na data de sua publicação.'
                                  );
                                }
                              } else if (t === 'PORTARIA') {
                                setRedatorFecho('Dê-se ciência, registre-se, publique-se e cumpra-se.');
                                if (!redatorTexto.trim() || redatorTexto.includes('Cumprimentando-o cordialmente') || redatorTexto.includes('Prezado(a)') || redatorTexto.includes('DECRETA:') || redatorTexto.includes('COMPROMISSO')) {
                                  setRedatorAssunto('Designa servidores para comissão de processo administrativo disciplinar (PAD)');
                                  setRedatorTexto(
                                    'O PREFEITO MUNICIPAL DE RIO CLARO, Estado do Rio de Janeiro, no uso de suas atribuições legais e em conformidade com o Estatuto dos Servidores Públicos Municipais,\n\nRESOLVE:\n\nArt. 1º Designar os seguintes servidores estáveis para, sob a presidência do primeiro, comporem a Comissão de Processo Administrativo Disciplinar referente aos autos nº [NÚMERO DO PROCESSO]/[ANO]:\nI - Presidente: [NOME], cargo [CARGO], matrícula nº [MATRÍCULA];\nII - Vogal: [NOME], cargo [CARGO], matrícula nº [MATRÍCULA];\nIII - Secretário: [NOME], cargo [CARGO], matrícula nº [MATRÍCULA].\n\nArt. 2º A Comissão terá o prazo de 60 (sessenta) dias para a conclusão da instrução probatória.\n\nArt. 3º Esta Portaria entra em vigor na data de sua publicação.'
                                  );
                                }
                              } else if (t === 'ATO') {
                                setRedatorFecho('Comissão de Processo Administrativo Disciplinar / Sindicância');
                                if (!redatorTexto.trim() || redatorTexto.includes('Cumprimentando-o cordialmente') || redatorTexto.includes('Prezado(a)') || redatorTexto.includes('DECRETA:') || redatorTexto.includes('RESOLVE:') || redatorTexto.includes('COMPROMISSO')) {
                                  setRedatorAssunto('Ata e Deliberações da Comissão de Processo Administrativo Disciplinar');
                                  setRedatorTexto(
                                    'PROCESSO ADMINISTRATIVO DISCIPLINAR Nº [NÚMERO DO PAD]/[ANO]\n\nA COMISSÃO PROCESSANTE DA PREFEITURA MUNICIPAL DE RIO CLARO – RJ, reunida formalmente nesta data, no exercício de suas prerrogativas legais, delibera:\n\n1. Proceder à juntada dos documentos e certidões recebidas do Departamento de Recursos Humanos;\n2. Determinar a expedição de Mandado de Citação e Intimação ao(à) servidor(a) investigado(a) para audiência de instrução;\n3. Cientificar as testemunhas arroladas para comparecimento perante esta comissão, asseguradas as garantias constitucionais do contraditório e da ampla defesa.'
                                  );
                                }
                              } else if (t === 'TERMO') {
                                setRedatorFecho('E, por estarem plenamente acordados, firmam o presente termo em 3 (três) vias de igual teor.');
                                if (!redatorTexto.trim() || redatorTexto.includes('Cumprimentando-o cordialmente') || redatorTexto.includes('Prezado(a)') || redatorTexto.includes('DECRETA:') || redatorTexto.includes('RESOLVE:')) {
                                  setRedatorAssunto('Compromisso de Ajustamento de Conduta Funcional (CAC / TAC)');
                                  setRedatorTexto(
                                    'COMPROMISSO DE AJUSTAMENTO DE CONDUTA FUNCIONAL (CAC) Nº [NÚMERO]/[ANO]\nPROCESSO ADMINISTRATIVO DISCIPLINAR Nº [NÚMERO DO PAD]/[ANO]\n\nCOMPROMITENTE: MUNICÍPIO DE RIO CLARO – RJ, representado pela autoridade competente.\nCOMPROMISSÁRIO(A): Servidor(a) [NOME DO SERVIDOR], matrícula nº [MATRÍCULA], cargo [CARGO].\n\nAs partes celebram o presente Compromisso de Ajustamento de Conduta (CAC), com fundamento nos arts. 20 e 21 do Decreto-Lei nº 4.657/1942 (LINDB) e normas do Estatuto Municipal, mediante as seguintes cláusulas:\n\nCLÁUSULA 1ª - O presente compromisso fundamenta-se nas apurações procedidas no PAD nº [NÚMERO], visando à solução consensual e saneadora.\nCLÁUSULA 2ª - O servidor compromissário assume a obrigação de jamais repetir a conduta e apresentar, em 60 dias, Plano Operacional de Aperfeiçoamento de Gestão.\nCLÁUSULA 3ª - O Município de Rio Claro – RJ compromete-se a suspender a tramitação punitiva, com arquivamento definitivo após a conclusão satisfatória das metas assumidas.'
                                  );
                                }
                              } else if (t === 'EMAIL') {
                                if (!redatorTexto.trim() || redatorTexto.includes('sirvo-me do presente para encaminhar a Vossa Senhoria') || redatorTexto.includes('DECRETA:') || redatorTexto.includes('RESOLVE:') || redatorTexto.includes('COMPROMISSO')) {
                                  setRedatorTexto(
                                    `Prezado(a) ${redatorDestinatario || 'Servidor(a)'},\n\nEscrevo em nome da ${redatorSecretaria} da Prefeitura Municipal de Rio Claro – RJ, referente ao assunto "${redatorAssunto || 'Processo Administrativo'}".\n\nSolicitamos a gentileza de analisar as informações apresentadas e acusar o recebimento desta mensagem, bem como adotar as providências administrativas cabíveis no âmbito de sua competência.\n\nPermanecemos à disposição para prestar quaisquer esclarecimentos complementares.\n\nAtenciosamente,\n\n${redatorSignatario}\n${redatorCargo}\n${redatorSecretaria}\nPrefeitura Municipal de Rio Claro – RJ`
                                  );
                                }
                              } else {
                                if (redatorTexto.includes('DECRETA:') || redatorTexto.includes('RESOLVE:') || redatorTexto.includes('Escrevo em nome da') || redatorTexto.includes('COMPROMISSO')) {
                                  setRedatorTexto('Cumprimentando-o cordialmente, sirvo-me do presente para solicitar a Vossa Senhoria as informações e levantamentos administrativos pertinentes a ' + (redatorAssunto || 'este processo') + ', em atendimento às diretrizes institucionais vigentes.\n\nAs providências visam a assegurar a máxima celeridade, conformidade legal e transparência aos atos da administração de Rio Claro – RJ.\n\nPermanecemos à disposição para prestar quaisquer esclarecimentos complementares.');
                                  setRedatorFecho('Permanecemos à disposição para eventuais esclarecimentos adicionais.');
                                }
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                              redatorTipo === t
                                ? t === 'EMAIL'
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : t === 'DECRETO'
                                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300 dark:ring-amber-800'
                                  : t === 'PORTARIA'
                                  ? 'bg-sky-600 text-white shadow-sm'
                                  : t === 'ATO'
                                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300 dark:ring-indigo-800'
                                  : t === 'TERMO'
                                  ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-300 dark:ring-teal-800'
                                  : 'bg-emerald-600 text-white shadow-sm'
                                : t === 'EMAIL'
                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 hover:bg-purple-100'
                                : t === 'DECRETO'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                                : t === 'PORTARIA'
                                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 hover:bg-sky-100'
                                : t === 'ATO'
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 hover:bg-indigo-100'
                                : t === 'TERMO'
                                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800 hover:bg-teal-100'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {t === 'EMAIL' && <Mail className="w-3.5 h-3.5 text-white" />}
                            {t === 'DECRETO' && <Landmark className="w-3.5 h-3.5" />}
                            {t === 'PORTARIA' && <FileText className="w-3.5 h-3.5" />}
                            {t === 'ATO' && <FileCheck2 className="w-3.5 h-3.5" />}
                            {t === 'TERMO' && <ShieldCheck className="w-3.5 h-3.5" />}
                            <span>{t === 'EMAIL' ? 'E-MAIL' : t === 'ATO' ? 'ATO / PAD' : t === 'TERMO' ? 'TERMO / TAC' : t}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status da Numeração Oficial (Apenas para Documentos Físicos) */}
                    {redatorTipo !== 'EMAIL' && (
                      <div className="text-left sm:text-right space-y-1.5">
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">
                          Número Oficial ({getSecretariaSigla(redatorSecretaria || activeSecretaria, secretarias)}):
                        </span>
                        {redatorNumero ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white font-mono text-sm font-bold shadow-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{redatorTipo} Nº {redatorNumero}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:items-end gap-1.5 mt-1">
                            <button
                              id="btn-redator-gerar-num"
                              data-tip="gerarnum"
                              type="button"
                              disabled={isRedatorGeneratingNumber}
                              onClick={handleGerarNumeroNoRedator}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
                            >
                              {isRedatorGeneratingNumber ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Gerando no Sheets...</span>
                                </>
                              ) : (
                                <>
                                  <ListOrdered className="w-3.5 h-3.5" />
                                  <span>Gerar e Reservar Número Agora</span>
                                </>
                              )}
                            </button>

                            {/* Opção para Incluir Sigla da Secretaria no Número (Regra Solicitada pelo Usuário) */}
                            <label 
                              data-tip="siglanumero"
                              className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer select-none"
                            >
                              <input
                                id="chk-incluir-sigla"
                                type="checkbox"
                                checked={incluirSiglaNoNumero}
                                onChange={e => {
                                  setIncluirSiglaNoNumero(e.target.checked);
                                  localStorage.setItem('bm_incluir_sigla', e.target.checked ? 'true' : 'false');
                                }}
                                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span>
                                Incluir sigla da pasta (ex: <strong>{getSecretariaSigla(redatorSecretaria || activeSecretaria, secretarias)}</strong>)
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Barra de Modelos Prontos para Comissões de PAD, Sindicância e CAC/TAC */}
                  {(redatorTipo === 'ATO' || redatorTipo === 'TERMO' || redatorTipo === 'PORTARIA') && (
                    <div className="pt-2.5 border-t border-emerald-200/70 dark:border-emerald-900/50 space-y-1.5 animate-in fade-in">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Modelos Prontos — Comissões de Sindicância, PAD e Ajuste de Conduta (CAC/TAC):</span>
                        </span>
                        <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                          {modelos.filter(m => (m.Area || '').toLowerCase().includes('disciplin') || (m.Categoria || '').includes('PAD/CAC')).length} peças oficiais disponíveis
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {modelos
                          .filter(m => (m.Area || '').toLowerCase().includes('disciplin') || (m.Categoria || '').includes('PAD/CAC'))
                          .map(m => {
                            const isAtivo = redatorModeloVinculado?.ID === m.ID;
                            return (
                              <button
                                key={m.ID}
                                type="button"
                                onClick={() => handleCarregarModeloNoRedator(m.ID)}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition-all cursor-pointer text-left ${
                                  isAtivo
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs font-bold'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60'
                                }`}
                                title={`${m.Titulo} — ${m.Assunto}`}
                              >
                                <span className="font-mono opacity-75 mr-1">[{m.ID}]</span>
                                <span>{m.Titulo.replace(' de Servidor Público', '').replace(' (Investigativa / Sumária)', ' (Sindicância)')}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Campo de Com Cópia (Cc) para E-MAIL */}
                {redatorTipo === 'EMAIL' && (
                  <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-xl space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <AtSign className="w-3.5 h-3.5 text-purple-600" />
                        <span>Com Cópia (Cc - Opcional):</span>
                      </label>
                      <span className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">
                        Separe múltiplos e-mails por vírgula
                      </span>
                    </div>
                    <input
                      type="text"
                      value={redatorEmailCc}
                      onChange={e => setRedatorEmailCc(e.target.value)}
                      placeholder="Ex: gabinete@rioclaro.rj.gov.br, administracao@rioclaro.rj.gov.br"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-800 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 shadow-2xs"
                    />
                  </div>
                )}

                {/* Referência a Documento Anterior do Livro de Numeração (Visível no Modo Avançado ou quando já preenchido) */}
                {redatorTipo !== 'EMAIL' && (redatorModoAvancado || !!redatorReferenciaDoc) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        <span>Referência a Documento Anterior (Opcional - Selecionar do Livro de Numeração):</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Puxa da aba 'Numeração'</span>
                    </label>
                    <select
                      value={redatorReferenciaDoc}
                      onChange={e => {
                        const val = e.target.value;
                        setRedatorReferenciaDoc(val);
                        if (val) {
                          const doc = numeracoesFiltradas.find(n => `${n.tipoDocumento} nº ${n.numero}` === val);
                          if (doc) {
                            if (doc.destinatario !== 'Não informado') setRedatorDestinatario(doc.destinatario);
                            setRedatorAssunto(`Em resposta ao ${doc.tipoDocumento} nº ${doc.numero} – ${doc.assunto}`);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    >
                      <option value="">Nenhum (Novo documento autônomo)...</option>
                      {numeracoesFiltradas.map((item, idx) => (
                        <option key={idx} value={`${item.tipoDocumento} nº ${item.numero}`}>
                          Em resposta ao {item.tipoDocumento} nº {item.numero} — {item.assunto} (Dest: {item.destinatario})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Combos Inteligentes: Destinatário & Assunto da Base */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* COMBO 1: DESTINATÁRIO */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Destinatário (Órgão / Setor):</span>
                      </label>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-semibold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Combo Base Municipal</span>
                      </span>
                    </div>

                    {/* Dropdown Combo para Seleção Rápida */}
                    <select
                      value={listaDestinatariosBase.includes(redatorDestinatario) ? redatorDestinatario : ''}
                      onChange={e => {
                        if (e.target.value) {
                          setRedatorDestinatario(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-emerald-50/50 dark:bg-slate-800/80 border border-emerald-300 dark:border-emerald-800/80 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 shadow-xs"
                    >
                      <option value="">⚡ Escolher Destinatário da Base Municipal...</option>
                      <optgroup label="🏛️ Secretarias Municipais & Gabinete">
                        {listaDestinatariosBase
                          .filter(d => d.toLowerCase().includes('secretaria') || d.toLowerCase().includes('gabinete') || d.toLowerCase().includes('procuradoria') || d.toLowerCase().includes('câmara'))
                          .map((dest, idx) => (
                            <option key={idx} value={dest}>{dest}</option>
                          ))}
                      </optgroup>
                      <optgroup label="🏢 Departamentos, Divisões & Setores">
                        {listaDestinatariosBase
                          .filter(d => !d.toLowerCase().includes('secretaria') && !d.toLowerCase().includes('gabinete') && !d.toLowerCase().includes('procuradoria') && !d.toLowerCase().includes('câmara'))
                          .map((dest, idx) => (
                            <option key={idx} value={dest}>{dest}</option>
                          ))}
                      </optgroup>
                    </select>

                    {/* Input Editável com Datalist Integrado */}
                    <input
                      type="text"
                      list="react-datalist-destinatarios"
                      value={redatorDestinatario}
                      onChange={e => setRedatorDestinatario(e.target.value)}
                      placeholder="Ou digite o nome do órgão/setor..."
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    />

                    {/* Chips de Atalho para Setores Mais Utilizados */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium mr-0.5">Atalhos:</span>
                      {[
                        'Secretaria Municipal de Saúde (SMS)',
                        'Secretaria Municipal de Educação (SME)',
                        'Secretaria Municipal de Administração (SMA)',
                        'Procuradoria-Geral do Município (PGM)',
                        'Gabinete do Prefeito',
                        'Departamento de Recursos Humanos (DRH)'
                      ].map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setRedatorDestinatario(chip)}
                          className={`px-1.5 py-0.5 text-[10px] rounded transition-all font-medium border ${
                            redatorDestinatario === chip
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {chip.replace('Secretaria Municipal de ', 'Sec. ').replace('Departamento de ', 'Dep. ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* COMBO 2: ASSUNTO / EMENTA */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Assunto / Ementa do Documento:</span>
                      </label>
                      <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-950/60 px-2 py-0.5 rounded-full font-semibold border border-blue-300 dark:border-blue-800 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{modelos.length} Modelos da Base</span>
                      </span>
                    </div>

                    {/* Dropdown Combo para Seleção de Assuntos dos Modelos */}
                    <select
                      value={redatorModeloVinculado ? redatorModeloVinculado.ID : ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (!val) return;
                        const mod = modelos.find(m => m.ID === val);
                        if (mod) {
                          setRedatorModeloVinculado(mod);
                          setRedatorAssunto(mod.Assunto || mod.Titulo);
                          if (mod.SetorDestino && (!redatorDestinatario || redatorDestinatario === 'Secretaria Municipal de Saúde')) {
                            setRedatorDestinatario(mod.SetorDestino);
                          }
                          const tipoMod = (mod.TipoDocumento || '').toUpperCase();
                          if (['MEMORANDO', 'OFICIO', 'DESPACHO', 'CIRCULAR', 'PORTARIA', 'DECRETO', 'ATO', 'TERMO', 'EMAIL'].includes(tipoMod)) {
                            setRedatorTipo(tipoMod as any);
                          } else if (tipoMod === 'DECISAO') {
                            setRedatorTipo('ATO');
                          }
                          if ((mod.Area || '').toLowerCase().includes('disciplin') || tipoMod === 'ATO' || tipoMod === 'TERMO') {
                            handleCarregarModeloNoRedator(mod.ID);
                          }
                        } else {
                          setRedatorAssunto(val);
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-blue-50/50 dark:bg-slate-800/80 border border-blue-300 dark:border-blue-800/80 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 shadow-xs"
                    >
                      <option value="">⚡ Escolher Assunto / Minuta da Base de Modelos...</option>
                      {Array.from(new Set(modelos.map(m => m.Categoria))).sort().map(cat => (
                        <optgroup key={cat} label={`📂 ${cat}`}>
                          {modelos.filter(m => m.Categoria === cat).map(m => (
                            <option key={m.ID} value={m.ID}>
                              [{m.ID}] {m.Titulo} ({m.TipoDocumento})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      {numeracoesFiltradas.length > 0 && (
                        <optgroup label="📋 Assuntos Emitidos Recentemente (Seu Escopo)">
                          {Array.from(new Set(numeracoesFiltradas.map(n => n.assunto))).filter(Boolean).slice(0, 10).map((ass, idx) => (
                            <option key={`num-${idx}`} value={ass}>
                              {ass}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>

                    {/* Input Editável com Datalist Integrado */}
                    <input
                      type="text"
                      list="react-datalist-assuntos"
                      value={redatorAssunto}
                      onChange={e => setRedatorAssunto(e.target.value)}
                      placeholder="Ou digite o assunto/ementa do documento..."
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />

                    {/* Banner Interativo se Modelo estiver Vinculado ao Assunto */}
                    {redatorModeloVinculado && (
                      <div className="flex items-center justify-between p-2 bg-blue-50/90 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900 text-xs">
                        <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-200 min-w-0 pr-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate text-[11px]">
                            Minuta: <strong>[{redatorModeloVinculado.ID}] {redatorModeloVinculado.Titulo}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRedatorTexto(redatorModeloVinculado.Texto);
                            showToast(`Minuta padrão do modelo [${redatorModeloVinculado.ID}] inserida no editor!`);
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold shadow-xs whitespace-nowrap active:scale-95 transition-all shrink-0"
                        >
                          Aplicar Minuta no Texto
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Editor do Texto / Corpo com Assistente de IA Gemini */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <FilePen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Texto do Documento (Redação Oficial):</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAiHelperOpen(prev => !prev)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs cursor-pointer ${
                          isAiHelperOpen
                            ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                            : 'bg-linear-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 active:scale-95'
                        }`}
                        title="Abrir o Assistente de Inteligência Artificial para gerar ou ajustar a redação"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                        <span>✨ Redigir com IA</span>
                      </button>
                      <input
                        ref={redatorFileInputRef}
                        type="file"
                        accept=".pdf,.txt,.docx,.doc,.html,.htm,.md"
                        onChange={handleUploadDocumentoParaRedator}
                        className="hidden"
                      />
                      {redatorModoAvancado ? (
                        <button
                          type="button"
                          disabled={isUploadingSingleFile}
                          onClick={() => redatorFileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                          title="Importar documento PDF (digital ou escaneado), DOCX ou TXT para padronizar no Timbrado Oficial"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{isUploadingSingleFile ? 'Reconhecendo...' : 'Importar PDF / DOCX / TXT'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleRedatorModoAvancado(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                          title="Mostrar régua, margens, importação de arquivo, referência anterior e comissões"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>+ Opções Avançadas</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Botões Rápidos de IA sobre o texto existente (Modo Avançado) */}
                      {redatorModoAvancado && redatorTexto.trim().length > 0 && (
                        <>
                          <button
                            type="button"
                            disabled={isGeneratingAiText}
                            onClick={() => handleGerarTextoComIA('APRIMORAR')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-md hover:bg-purple-100 transition-all active:scale-95 disabled:opacity-50"
                            title="Aprimorar gramática, fluidez e estilo formal"
                          >
                            <Wand2 className="w-2.5 h-2.5" />
                            <span>Aprimorar</span>
                          </button>
                          <button
                            type="button"
                            disabled={isGeneratingAiText}
                            onClick={() => handleGerarTextoComIA('FORMALIZAR')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md hover:bg-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                            title="Adequar ao padrão formal da Prefeitura de Rio Claro - RJ"
                          >
                            <Landmark className="w-2.5 h-2.5" />
                            <span>Formalizar</span>
                          </button>
                          <button
                            type="button"
                            disabled={isGeneratingAiText}
                            onClick={() => handleGerarTextoComIA('RESUMIR')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                            title="Resumir mantendo a essência administrativa"
                          >
                            <FileCheck2 className="w-2.5 h-2.5" />
                            <span>Resumir</span>
                          </button>
                        </>
                      )}

                      {/* Desfazer IA */}
                      {textoAnteriorRedator && (
                        <button
                          type="button"
                          onClick={() => {
                            setRedatorTexto(textoAnteriorRedator);
                            setTextoAnteriorRedator('');
                            showToast('Texto revertido para a versão anterior!');
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md hover:bg-amber-100 transition-all"
                          title="Restaurar o texto antes da última intervenção da IA"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Desfazer IA</span>
                        </button>
                      )}

                      <span className="text-[10px] text-slate-400 font-mono ml-1">{redatorTexto.length} caracteres</span>
                    </div>
                  </div>

                  {/* Painel Expansível de Assistência por IA (Gemini) */}
                  {isAiHelperOpen && (
                    <div className="p-3.5 bg-linear-to-br from-purple-50 via-indigo-50/50 to-white dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-900 border-2 border-purple-300 dark:border-purple-800 rounded-xl space-y-2.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5 leading-tight">
                              <span>Assistente de Redação Oficial (Gemini IA)</span>
                              <span className="text-[9px] px-1.5 py-0.2 bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded font-bold">
                                PMRC Rio Claro - RJ
                              </span>
                            </h5>
                            <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 leading-tight">
                              A IA redigirá os parágrafos do documento alinhando o assunto, destinatário e normas administrativas.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAiHelperOpen(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1.5 py-0.5 rounded"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Chips Rápidos de Intenção do Documento */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-purple-900 dark:text-purple-300">Modelos Rápidos:</span>
                        {(redatorTipo === 'DECRETO' ? [
                          { label: '🏛️ Ponto Facultativo em Feriado', prompt: 'Redigir Decreto Municipal declarando ponto facultativo nas repartições públicas municipais, ressalvando serviços essenciais de saúde, defesa civil e limpeza pública.' },
                          { label: '💰 Abertura de Crédito Suplementar', prompt: 'Redigir Decreto Municipal autorizando a abertura de crédito adicional suplementar no orçamento vigente, indicando a anulação parcial de dotações e a fundamentação legal.' },
                          { label: '📜 Regulamentação de Lei Municipal', prompt: 'Redigir Decreto regulamentando dispositivos de Lei Municipal, estabelecendo prazos, procedimentos e competências das secretarias.' },
                          { label: '🚨 Situação de Emergência / Defesa Civil', prompt: 'Redigir Decreto declarando situação de emergência em áreas do município afetadas por desastres climáticos, autorizando medidas administrativas de resposta rápida.' },
                          { label: '👤 Nomeação de Cargo em Comissão (1º Escalão)', prompt: 'Redigir Decreto nomeando autoridade para exercer cargo de provimento em comissão de Secretário Municipal.' }
                        ] : redatorTipo === 'PORTARIA' ? [
                          { label: '📋 Fiscal de Contrato (Lei 14.133/21)', prompt: 'Redigir Portaria designando gestor, fiscal titular e substituto para acompanhamento do Contrato Administrativo nº [NÚMERO/ANO], conforme Art. 117 da Lei 14.133/21.' },
                          { label: '⚖️ Comissão de Sindicância / PAD', prompt: 'Redigir Portaria constituindo comissão de sindicância investigativa ou processo administrativo disciplinar (PAD) com 3 servidores estáveis e prazo de 30 dias.' },
                          { label: '🏖️ Concessão de Licença / Afastamento', prompt: 'Redigir Portaria concedendo licença-prêmio por assiduidade ou licença para capacitação a servidor público efetivo com base no estatuto dos servidores.' },
                          { label: '🔄 Substituição de Chefia em Férias', prompt: 'Redigir Portaria designando servidor para responder interinamente pelas atribuições do cargo de chefia durante as férias regulamentares do titular.' },
                          { label: '📑 Instrução Normativa da Pasta', prompt: 'Redigir Portaria estabelecendo diretrizes procedimentais internas para padronização de rotinas e atendimento ao público.' }
                        ] : redatorTipo === 'ATO' ? [
                          { label: '⚖️ Ata de Instalação (PAD / Sindicância)', prompt: 'Redigir Ata de Instalação e Início dos Trabalhos de Comissão Processante de PAD ou Sindicância com designação de secretário e diligências iniciais.' },
                          { label: '📄 Mandado de Citação e Intimação', prompt: 'Redigir Mandado de Citação Inicial de servidor investigado assegurando ampla defesa, contraditório, prazo de defesa prévia e rol de testemunhas.' },
                          { label: '🏛️ Termo de Indiciação Formal', prompt: 'Redigir Termo de Indiciação detalhando fatos apurados, provas colhidas, tipificação estatutária e abertura de prazo de 10 dias para defesa escrita.' },
                          { label: '🎙️ Termo de Oitiva / Interrogatório', prompt: 'Redigir Termo de Oitiva de testemunha ou Interrogatório de servidor investigado com perguntas, respostas e encerramento formal.' },
                          { label: '📊 Relatório Final Conclusivo (PAD / Sind.)', prompt: 'Redigir Relatório Final Conclusivo de PAD ou Sindicância analisando provas, teses defensivas, motivação LINDB e proposição conclusiva.' }
                        ] : redatorTipo === 'TERMO' ? [
                          { label: '🤝 Compromisso de Ajustamento (CAC / TAC)', prompt: 'Redigir Termo de Compromisso de Ajustamento de Conduta Funcional (CAC/TAC) com base nos arts. 20 e 21 da LINDB, obrigações, prazos e suspensão punitiva.' },
                          { label: '✅ Certidão de Cumprimento de TAC', prompt: 'Redigir Termo de Encerramento e Certidão de Cumprimento Integral das obrigações assumidas em CAC/TAC com proposição de arquivamento.' },
                          { label: '🔎 Termo de Revelia e Defensor Dativo', prompt: 'Redigir Termo de Declaração de Revelia do servidor indiciado com pedido de nomeação de defensor dativo para garantir a ampla defesa.' }
                        ] : redatorTipo === 'EMAIL' ? [
                          { label: 'E-mail Formal Completo', prompt: 'Redigir e-mail institucional convocando formalmente para reunião de alinhamento com pauta, prazo e solicitação de confirmação.' },
                          { label: 'Cobrança Urgente de Prazo', prompt: 'Cobrar formalmente e em caráter urgente a resposta e envio de informações de ofício anterior com prazo esgotado.' },
                          { label: 'Encaminhamento com Anexos', prompt: 'Encaminhar documentação técnica em anexo solicitando providências, ciência e retorno tempestivo.' },
                          { label: 'Resposta a Solicitação', prompt: 'Prestar esclarecimentos formais em resposta à demanda recebida, detalhando as providências adotadas pela pasta.' }
                        ] : [
                          { label: 'Solicitar Informações / Relatório', prompt: 'Solicitar envio urgente de relatório e informações detalhadas sobre a execução das atividades no prazo de 5 dias úteis.' },
                          { label: 'Encaminhamento p/ Parecer Jurídico', prompt: 'Encaminhar os autos à Procuradoria-Geral do Município (PGM) para análise jurídica de legalidade e emissão de parecer.' },
                          { label: 'Comunicação de Prazos e Providências', prompt: 'Comunicar formalmente a abertura de prazo impreterível para cumprimento de diligências e providências administrativas.' },
                          { label: 'Resposta a Memorando Anterior', prompt: 'Em resposta à solicitação anterior, prestar os devidos esclarecimentos operacionais e certificar o andamento das medidas.' },
                          { label: 'Solicitação de Material / Contratação', prompt: 'Solicitar a abertura de processo administrativo de aquisição de insumos essenciais à continuidade dos serviços públicos.' }
                        ]).map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAiPromptInput(chip.prompt);
                              handleGerarTextoComIA('NOVO_TEXTO', chip.prompt);
                            }}
                            className="px-2 py-0.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-950/70 border border-purple-200 dark:border-purple-800/70 rounded-md text-[10px] font-medium transition-colors shadow-2xs active:scale-95"
                          >
                            ⚡ {chip.label}
                          </button>
                        ))}
                      </div>

                      {/* Campo de Instruções Customizadas */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Instruções específicas para a IA (opcional):
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={aiPromptInput}
                            onChange={e => setAiPromptInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleGerarTextoComIA('NOVO_TEXTO');
                              }
                            }}
                            placeholder="Ex.: Solicitar justificativa de ausência no plantão da UPA ou detalhar prorrogação de contrato..."
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-800 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 shadow-xs"
                          />
                          <button
                            type="button"
                            disabled={isGeneratingAiText}
                            onClick={() => handleGerarTextoComIA('NOVO_TEXTO')}
                            className="px-3.5 py-1.5 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5 disabled:opacity-60 whitespace-nowrap"
                          >
                            {isGeneratingAiText ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Gerando...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Gerar Texto Completo</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Barra de Ferramentas de Edição Oficial (Enxuta no Modo Simples, Completa no Avançado) */}
                  <div className="bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-t-xl p-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 shadow-2xs border-b-0">
                    {redatorModoAvancado && (
                      <>
                        {/* Seletor de Fonte */}
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                          <Type className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <select
                            value={redatorFonte}
                            onChange={e => setRedatorFonte(e.target.value as any)}
                            className="bg-transparent text-[11px] font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                            title="Família da fonte oficial do documento"
                          >
                            <option value="Times New Roman">Times New Roman (Oficial PMRC)</option>
                            <option value="Arial">Arial (Moderno)</option>
                            <option value="Calibri">Calibri (Administrativo)</option>
                          </select>
                        </div>

                        {/* Seletor de Tamanho da Fonte */}
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-slate-400">Tam:</span>
                          <select
                            value={redatorTamanhoFonte}
                            onChange={e => setRedatorTamanhoFonte(e.target.value as any)}
                            className="bg-transparent text-[11px] font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                            title="Tamanho base da fonte"
                          >
                            <option value="12pt">12 pt (Padrão)</option>
                            <option value="11pt">11 pt (Intermediário)</option>
                            <option value="10pt">10 pt (Citações / Ementas)</option>
                          </select>
                        </div>

                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5"></div>
                      </>
                    )}

                    {/* Estilos Básicos: Negrito, Itálico, Sublinhado, Tachado, Marca-texto */}
                    <div className="flex items-center bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 p-0.5 space-x-0.5">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => aplicarFormatacaoSelecao('**', '**', 'texto em negrito')}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-bold text-xs w-7 h-7 flex items-center justify-center transition-colors cursor-pointer"
                        title="Negrito (**texto**)"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => aplicarFormatacaoSelecao('*', '*', 'texto em itálico')}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded italic text-xs w-7 h-7 flex items-center justify-center transition-colors cursor-pointer"
                        title="Itálico (*texto*)"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => aplicarFormatacaoSelecao('<u>', '</u>', 'texto sublinhado')}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded underline text-xs w-7 h-7 flex items-center justify-center transition-colors cursor-pointer"
                        title="Sublinhado (<u>texto</u>)"
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => aplicarFormatacaoSelecao('~~', '~~', 'texto tachado')}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded line-through text-xs w-7 h-7 flex items-center justify-center transition-colors cursor-pointer"
                        title="Tachado (~~texto~~)"
                      >
                        <Strikethrough className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => aplicarFormatacaoSelecao('<mark>', '</mark>', 'texto destacado')}
                        className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded text-xs w-7 h-7 flex items-center justify-center transition-colors cursor-pointer"
                        title="Marca-texto / Destaque Amarelo (<mark>texto</mark>)"
                      >
                        <Highlighter className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5"></div>

                    {/* Alinhamento */}
                    <div className="flex items-center bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 p-0.5 space-x-0.5">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setRedatorAlinhamento('justify')}
                        className={`p-1.5 rounded text-xs w-7 h-7 flex items-center justify-center transition-colors cursor-pointer ${redatorAlinhamento === 'justify' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Alinhamento Justificado (Padrão de Redação Oficial)"
                      >
                        <AlignJustify className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setRedatorAlinhamento('left')}
                        className={`p-1.5 rounded text-xs w-7 h-7 flex items-center justify-center transition-colors cursor-pointer ${redatorAlinhamento === 'left' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Alinhar à Esquerda"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setRedatorAlinhamento('center')}
                        className={`p-1.5 rounded text-xs w-7 h-7 flex items-center justify-center transition-colors cursor-pointer ${redatorAlinhamento === 'center' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Centralizar Texto"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5"></div>

                    {redatorModoAvancado && (
                      <>
                        {/* Ferramentas de Tabulação & Régua de Parágrafo */}
                        <div className="flex items-center bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 p-0.5 space-x-0.5">
                          <button
                            type="button"
                            id="btn-redator-outdent"
                            data-tip="tabulacao"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleTabularTexto('diminuir')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs w-7 h-7 flex items-center justify-center transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
                            title="Diminuir Recuo / Desfazer Tabulação (Shift+Tab)"
                          >
                            <Outdent className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            id="btn-redator-tab"
                            data-tip="tabulacao"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleTabularTexto('aumentar')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs w-7 h-7 flex items-center justify-center transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
                            title="Aumentar Recuo / Tabular Texto (Tab)"
                          >
                            <Indent className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            id="btn-redator-toggle-regua"
                            data-tip="reguaparagrafo"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setIsReguaVisivel(prev => !prev)}
                            className={`p-1.5 rounded text-xs w-7 h-7 flex items-center justify-center transition-colors cursor-pointer ${
                              isReguaVisivel
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-[#002b82] dark:text-blue-300 font-bold ring-1 ring-blue-300 dark:ring-blue-700'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                            title={isReguaVisivel ? 'Ocultar Régua de Parágrafo' : 'Exibir Régua de Parágrafos (1ª e 2ª Linhas)'}
                          >
                            <Ruler className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            id="btn-redator-toggle-margens"
                            data-tip="margensdoc"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setIsPainelMargensAberto(prev => !prev)}
                            className={`p-1.5 rounded text-xs w-7 h-7 flex items-center justify-center transition-colors cursor-pointer ${
                              isPainelMargensAberto
                                ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold ring-1 ring-purple-300 dark:ring-purple-700'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                            title={isPainelMargensAberto ? 'Ocultar Painel de Margens' : 'Exibir Controle de Margens da Página (Esq, Dir, Sup, Inf)'}
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5"></div>
                      </>
                    )}

                    {/* Listas & Estruturas Oficiais */}
                    <div className="flex items-center bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 p-0.5 space-x-0.5">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => aplicarPrefixoLinha('- ', 'Item da lista')}
                        className="px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Lista com Marcadores (- item)"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Marcadores</span>
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => aplicarPrefixoLinha('1. ', 'Item numerado')}
                        className="px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Lista Numerada Sequencial (1. item)"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">1. 2. 3.</span>
                      </button>
                      {redatorModoAvancado && (
                        <>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => aplicarPrefixoLinha('I - ', 'Disposição normativa')}
                            className="px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Inciso Normativo (I - texto)"
                          >
                            I -
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => aplicarPrefixoLinha('a) ', 'Alínea correspondente')}
                            className="px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Alínea Normativa (a) texto)"
                          >
                            a)
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => aplicarPrefixoLinha('> ', 'Transcrição de artigo de lei ou parecer')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs w-7 h-7 flex items-center justify-center transition-colors cursor-pointer"
                            title="Recuo de Citação / Ementa (> texto)"
                          >
                            <Quote className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => aplicarPrefixoLinha('---')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs w-7 h-7 flex items-center justify-center transition-colors cursor-pointer"
                            title="Linha Divisória Horizontal (---)"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5"></div>

                    {/* Utilitários: Inserir Campo, Limpar Formatação, Desfazer, Refazer */}
                    <div className="flex items-center space-x-1 ml-auto">
                      {redatorModoAvancado && (
                        <>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => aplicarFormatacaoSelecao('[', ']', 'PREENCHER')}
                            className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                            title="Inserir campo de preenchimento obrigatório [CAMPO]"
                          >
                            [+] Campo
                          </button>

                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleLimparFormatacaoRedator}
                            className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                            title="Remover formatações de negrito, itálico, listas e recuos"
                          >
                            <Eraser className="w-3 h-3 text-slate-500" />
                            <span className="hidden md:inline">Tx Limpo</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleDesfazerFormatacao}
                        disabled={redatorHistoricoUndo.length === 0}
                        className="p-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded text-xs w-7 h-7 flex items-center justify-center transition-all cursor-pointer"
                        title="Desfazer alteração de texto"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleRefazerFormatacao}
                        disabled={redatorHistoricoRedo.length === 0}
                        className="p-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded text-xs w-7 h-7 flex items-center justify-center transition-all cursor-pointer"
                        title="Refazer alteração de texto"
                      >
                        <Redo2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* PAINEL DE CONTROLE DE MARGENS DO DOCUMENTO */}
                  {redatorModoAvancado && isPainelMargensAberto && (
                    <div className="bg-purple-50/70 dark:bg-purple-950/40 border-x border-b border-purple-200 dark:border-purple-900/60 p-3 space-y-2.5 transition-all text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Controle de Margens da Página (A4):
                          </span>
                          <span className="text-[11px] text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded font-mono font-bold">
                            Esq {redatorMargemEsquerda.toFixed(1).replace('.', ',')}cm | Dir {redatorMargemDireita.toFixed(1).replace('.', ',')}cm | Sup {redatorMargemSuperior.toFixed(1).replace('.', ',')}cm | Inf {redatorMargemInferior.toFixed(1).replace('.', ',')}cm
                          </span>
                        </div>

                        {/* Presets Rápidos de Margem */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-slate-500">Presets:</span>
                          <button
                            type="button"
                            onClick={() => aplicarPresetMargens('oficial')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                              redatorMargemEsquerda === 3.0 && redatorMargemDireita === 2.0 && redatorMargemSuperior === 2.5 && redatorMargemInferior === 2.0
                                ? 'bg-purple-600 text-white font-bold shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                            title="Padrão Oficial PMRC: 3,0 cm esquerda (para furação e encadernação de processos), 2,0 cm direita, 2,5 cm superior, 2,0 cm inferior"
                          >
                            Oficial PMRC ★
                          </button>
                          <button
                            type="button"
                            onClick={() => aplicarPresetMargens('abnt')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                              redatorMargemEsquerda === 3.0 && redatorMargemDireita === 2.0 && redatorMargemSuperior === 3.0 && redatorMargemInferior === 2.0
                                ? 'bg-purple-600 text-white font-bold shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                            title="Padrão ABNT Clássico: Esq 3cm, Dir 2cm, Sup 3cm, Inf 2cm"
                          >
                            ABNT Clássica
                          </button>
                          <button
                            type="button"
                            onClick={() => aplicarPresetMargens('estreita')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                              redatorMargemEsquerda === 2.0 && redatorMargemDireita === 1.5 && redatorMargemSuperior === 2.0 && redatorMargemInferior === 1.5
                                ? 'bg-purple-600 text-white font-bold shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                            title="Margem Estreita: Esq 2cm, Dir 1,5cm, Sup 2cm, Inf 1,5cm (Aproveita mais texto na página)"
                          >
                            Estreita
                          </button>
                          <button
                            type="button"
                            onClick={() => aplicarPresetMargens('moderada')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                              redatorMargemEsquerda === 2.5 && redatorMargemDireita === 2.0 && redatorMargemSuperior === 2.5 && redatorMargemInferior === 2.0
                                ? 'bg-purple-600 text-white font-bold shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                            title="Margem Moderada: Esq 2,5cm, Dir 2cm, Sup 2,5cm, Inf 2cm"
                          >
                            Moderada
                          </button>
                        </div>
                      </div>

                      {/* Steppers Individuais das 4 Margens */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {/* Esquerda */}
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-purple-200 dark:border-purple-900/60 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Esquerda (Encadernação)</span>
                            <span className="font-mono font-bold text-xs text-purple-700 dark:text-purple-300">
                              {redatorMargemEsquerda.toFixed(1).replace('.', ',')} cm
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleAlterarMargem('esq', redatorMargemEsquerda - 0.5)}
                              disabled={redatorMargemEsquerda <= 1.0}
                              className="w-5 h-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-30 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer"
                              title="Diminuir margem esquerda (-0,5 cm)"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAlterarMargem('esq', redatorMargemEsquerda + 0.5)}
                              disabled={redatorMargemEsquerda >= 6.0}
                              className="w-5 h-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-30 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer"
                              title="Aumentar margem esquerda (+0,5 cm)"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Direita */}
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-purple-200 dark:border-purple-900/60 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Direita</span>
                            <span className="font-mono font-bold text-xs text-purple-700 dark:text-purple-300">
                              {redatorMargemDireita.toFixed(1).replace('.', ',')} cm
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleAlterarMargem('dir', redatorMargemDireita - 0.5)}
                              disabled={redatorMargemDireita <= 1.0}
                              className="w-5 h-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-30 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer"
                              title="Diminuir margem direita (-0,5 cm)"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAlterarMargem('dir', redatorMargemDireita + 0.5)}
                              disabled={redatorMargemDireita >= 6.0}
                              className="w-5 h-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-30 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer"
                              title="Aumentar margem direita (+0,5 cm)"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Superior */}
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-purple-200 dark:border-purple-900/60 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Superior (Timbre/Brasão)</span>
                            <span className="font-mono font-bold text-xs text-purple-700 dark:text-purple-300">
                              {redatorMargemSuperior.toFixed(1).replace('.', ',')} cm
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleAlterarMargem('sup', redatorMargemSuperior - 0.5)}
                              disabled={redatorMargemSuperior <= 1.0}
                              className="w-5 h-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-30 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer"
                              title="Diminuir margem superior (-0,5 cm)"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAlterarMargem('sup', redatorMargemSuperior + 0.5)}
                              disabled={redatorMargemSuperior >= 5.0}
                              className="w-5 h-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-30 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer"
                              title="Aumentar margem superior (+0,5 cm)"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Inferior */}
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-purple-200 dark:border-purple-900/60 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Inferior (Rodapé/Assinatura)</span>
                            <span className="font-mono font-bold text-xs text-purple-700 dark:text-purple-300">
                              {redatorMargemInferior.toFixed(1).replace('.', ',')} cm
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleAlterarMargem('inf', redatorMargemInferior - 0.5)}
                              disabled={redatorMargemInferior <= 1.0}
                              className="w-5 h-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-30 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer"
                              title="Diminuir margem inferior (-0,5 cm)"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAlterarMargem('inf', redatorMargemInferior + 0.5)}
                              disabled={redatorMargemInferior >= 5.0}
                              className="w-5 h-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-30 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer"
                              title="Aumentar margem inferior (+0,5 cm)"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Régua Interativa A4 (0–21 cm) para Ajustar Margens (Esq/Dir) e Parágrafos (1ª e 2ª Linhas) */}
                  {redatorModoAvancado && isReguaVisivel && (
                    <div id="redator-regua-paragrafo" data-tip="reguaparagrafo" className="bg-slate-50 dark:bg-slate-900 border-x border-slate-300 dark:border-slate-700 p-2.5 space-y-2.5 select-none border-b border-b-slate-200 dark:border-b-slate-800 transition-all">
                      {/* LINHA 1: Recuo da 1ª Linha (Entrada do Parágrafo) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-blue-600 dark:border-t-blue-400" />
                            <span>1ª Linha (Início do Parágrafo):</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#002b82] dark:text-blue-300 font-mono font-bold text-xs">
                            <span>{redatorRecuoParagrafo.toFixed(2).replace('.', ',')} cm</span>
                            <span className="text-[10px] font-sans font-normal text-slate-600 dark:text-slate-400">
                              • {getDescricaoRecuo(redatorRecuoParagrafo)}
                            </span>
                          </div>
                        </div>

                        {/* Presets Rápidos 1ª Linha */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] font-semibold text-slate-500 mr-0.5">Presets 1ª:</span>
                          {[
                            { label: '0 cm', val: 0, desc: 'Sem recuo (Alinhado à margem)' },
                            { label: '1,25 cm', val: 1.25, desc: 'Padrão ABNT (1,25 cm)' },
                            { label: '1,50 cm ★', val: 1.5, desc: 'Padrão Oficial PMRC (1,50 cm - Recomendado)', destaque: true },
                            { label: '2,00 cm', val: 2.0, desc: 'Recuo amplo (2,00 cm)' },
                            { label: '2,50 cm', val: 2.5, desc: 'Ofício / Memo tradicional (2,50 cm)' },
                            { label: '4,00 cm', val: 4.0, desc: 'Citação / Parecer Normativo (4,00 cm)' }
                          ].map(p => (
                            <button
                              key={`p1-${p.val}`}
                              type="button"
                              onClick={() => handleAlterarRecuo(p.val)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                Math.abs(redatorRecuoParagrafo - p.val) < 0.05
                                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                                  : p.destaque
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-200'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                              title={p.desc}
                            >
                              {p.label}
                            </button>
                          ))}

                          <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5"></div>

                          {/* Micro-ajustes de 0,25 cm 1ª Linha */}
                          <div className="flex items-center bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-0.5">
                            <button
                              type="button"
                              onClick={() => handleAlterarRecuo(redatorRecuoParagrafo - 0.25)}
                              disabled={redatorRecuoParagrafo <= 0}
                              className="px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                              title="Diminuir recuo de 1ª linha em 0,25 cm"
                            >
                              - 0,25
                            </button>
                            <span className="text-[10px] text-slate-400 px-0.5">|</span>
                            <button
                              type="button"
                              onClick={() => handleAlterarRecuo(redatorRecuoParagrafo + 0.25)}
                              disabled={redatorRecuoParagrafo >= 8}
                              className="px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                              title="Aumentar recuo de 1ª linha em 0,25 cm"
                            >
                              + 0,25
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* LINHA 2: Recuo da 2ª Linha (Continuação / Hanging Indent) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[7px] border-b-purple-600 dark:border-b-purple-400" />
                            <span>2ª Linha (Continuação / Recuo Deslocado):</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                            <span>{redatorRecuoSegundaLinha.toFixed(2).replace('.', ',')} cm</span>
                            <span className="text-[10px] font-sans font-normal text-slate-600 dark:text-slate-400">
                              • {getDescricaoRecuoSegundaLinha(redatorRecuoSegundaLinha)}
                            </span>
                          </div>
                        </div>

                        {/* Presets Rápidos 2ª Linha */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] font-semibold text-slate-500 mr-0.5">Presets 2ª:</span>
                          {[
                            { label: '0 cm ★', val: 0, desc: 'Padrão Oficial PMRC: 0 cm (2ª linha alinhada à margem esquerda)', destaque: true },
                            { label: '0,75 cm', val: 0.75, desc: 'Recuo suave de continuação (0,75 cm)' },
                            { label: '1,00 cm', val: 1.0, desc: 'Recuo clássico de continuação (1,00 cm)' },
                            { label: '1,25 cm', val: 1.25, desc: 'Recuo ABNT para continuação (1,25 cm)' },
                            { label: '1,50 cm', val: 1.5, desc: 'Bloco alinhado com 1ª linha (1,50 cm)' },
                            { label: '2,00 cm', val: 2.0, desc: 'Recuo acentuado de continuação (2,00 cm)' }
                          ].map(p => (
                            <button
                              key={`p2-${p.val}`}
                              type="button"
                              onClick={() => handleAlterarRecuoSegundaLinha(p.val)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                Math.abs(redatorRecuoSegundaLinha - p.val) < 0.05
                                  ? 'bg-purple-600 text-white shadow-xs font-bold'
                                  : p.destaque
                                  ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-200'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                              title={p.desc}
                            >
                              {p.label}
                            </button>
                          ))}

                          <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5"></div>

                          {/* Micro-ajustes de 0,25 cm 2ª Linha */}
                          <div className="flex items-center bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-0.5">
                            <button
                              type="button"
                              onClick={() => handleAlterarRecuoSegundaLinha(redatorRecuoSegundaLinha - 0.25)}
                              disabled={redatorRecuoSegundaLinha <= 0}
                              className="px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                              title="Diminuir recuo de 2ª linha em 0,25 cm"
                            >
                              - 0,25
                            </button>
                            <span className="text-[10px] text-slate-400 px-0.5">|</span>
                            <button
                              type="button"
                              onClick={() => handleAlterarRecuoSegundaLinha(redatorRecuoSegundaLinha + 0.25)}
                              disabled={redatorRecuoSegundaLinha >= 8}
                              className="px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                              title="Aumentar recuo de 2ª linha em 0,25 cm"
                            >
                              + 0,25
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Barra da Régua Visual A4 Completa (0 a 21 cm: Margens Esquerda/Direita + Recuos 1ª e 2ª Linha) */}
                      <div className="relative pt-1 pb-1">
                        <div
                          ref={reguaBarraRef}
                          onMouseDown={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const xRelative = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                            const yRelative = e.clientY - rect.top;
                            const cmA4 = (xRelative / rect.width) * 21;
                            if (cmA4 < redatorMargemEsquerda) {
                              handleReguaMouseDown(e, 'margemEsq');
                            } else if (cmA4 > 21 - redatorMargemDireita) {
                              handleReguaMouseDown(e, 'margemDir');
                            } else {
                              const alvo = yRelative < rect.height / 2 ? 'primeira' : 'segunda';
                              handleReguaMouseDown(e, alvo);
                            }
                          }}
                          className="h-12 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md shadow-inner relative overflow-visible cursor-ew-resize select-none"
                          title="Régua A4 (0–21 cm): arraste as alças roxas nas extremidades para ajustar as Margens Esquerda/Direita, ou clique na área útil branca para ajustar 1ª Linha (▼ azul) e 2ª Linha (▲ roxo)."
                        >
                          {/* Zona da Margem Esquerda (0 até redatorMargemEsquerda) */}
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-purple-100/80 dark:bg-purple-950/60 rounded-l-md pointer-events-none transition-all duration-75"
                            style={{ width: `${(redatorMargemEsquerda / 21) * 100}%` }}
                          />

                          {/* Zona da Margem Direita (21 - redatorMargemDireita até 21) */}
                          <div
                            className="absolute top-0 bottom-0 right-0 bg-purple-100/80 dark:bg-purple-950/60 rounded-r-md pointer-events-none transition-all duration-75"
                            style={{ width: `${(redatorMargemDireita / 21) * 100}%` }}
                          />

                          {/* Faixa de Recuo 1ª Linha (Azul claro translúcido a partir da margem esquerda) */}
                          <div
                            className="absolute top-0 h-1/2 bg-blue-100/75 dark:bg-blue-900/40 border-r-2 border-blue-500/80 pointer-events-none transition-all duration-75"
                            style={{
                              left: `${(redatorMargemEsquerda / 21) * 100}%`,
                              width: `${(Math.min(Math.max(0, 21 - redatorMargemEsquerda - redatorMargemDireita), redatorRecuoParagrafo) / 21) * 100}%`
                            }}
                          />

                          {/* Faixa de Recuo 2ª Linha (Índigo/Roxo claro translúcido a partir da margem esquerda) */}
                          <div
                            className="absolute bottom-0 h-1/2 bg-indigo-100/75 dark:bg-indigo-900/40 border-r-2 border-purple-500/80 pointer-events-none transition-all duration-75"
                            style={{
                              left: `${(redatorMargemEsquerda / 21) * 100}%`,
                              width: `${(Math.min(Math.max(0, 21 - redatorMargemEsquerda - redatorMargemDireita), redatorRecuoSegundaLinha) / 21) * 100}%`
                            }}
                          />

                          {/* Ticks e Números em Centímetros exatos de 0 a 21 (Largura A4) */}
                          <div className="absolute inset-0 pointer-events-none">
                            {Array.from({ length: 22 }).map((_, i) => (
                              <div
                                key={i}
                                className="absolute top-0 bottom-0 flex flex-col items-center justify-between -translate-x-1/2"
                                style={{ left: `${(i / 21) * 100}%` }}
                              >
                                <div className="w-[1px] h-2 bg-slate-400 dark:bg-slate-500" />
                                <span className="text-[8px] font-mono font-semibold text-slate-500 dark:text-slate-400 leading-none">
                                  {i}
                                </span>
                                <div className="w-[1px] h-2 bg-slate-400 dark:bg-slate-500" />
                              </div>
                            ))}

                            {/* Meios centímetros (0.5, 1.5, ..., 20.5) */}
                            {Array.from({ length: 21 }).map((_, i) => (
                              <div
                                key={`half-${i}`}
                                className="absolute top-0 bottom-0 flex flex-col justify-between -translate-x-1/2"
                                style={{ left: `${((i + 0.5) / 21) * 100}%` }}
                              >
                                <div className="w-[1px] h-1.5 bg-slate-300 dark:bg-slate-600" />
                                <div className="w-[1px] h-1.5 bg-slate-300 dark:bg-slate-600" />
                              </div>
                            ))}
                          </div>

                          {/* Alça Arrastável da Margem Esquerda */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleReguaMouseDown(e, 'margemEsq');
                            }}
                            className="absolute top-0 bottom-0 w-3.5 -translate-x-1/2 z-20 flex flex-col items-center justify-center cursor-col-resize group"
                            style={{ left: `${(redatorMargemEsquerda / 21) * 100}%` }}
                            title={`Margem Esquerda: ${redatorMargemEsquerda.toFixed(1).replace('.', ',')} cm — Arraste na régua para ajustar (1,0 a 6,0 cm)`}
                          >
                            <div className="w-[2px] h-full bg-purple-600 dark:bg-purple-400 group-hover:bg-purple-700 relative flex items-center justify-center">
                              <div className="w-2.5 h-5 rounded-xs bg-purple-600 dark:bg-purple-500 border border-white dark:border-slate-900 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="w-[1px] h-2.5 bg-white/90 block" />
                              </div>
                            </div>
                            {isArrastandoRegua && reguaArrastandoAlvo === 'margemEsq' && (
                              <span className="absolute -top-5 px-1.5 py-0.5 rounded bg-purple-700 text-white text-[9px] font-mono font-bold whitespace-nowrap shadow-md">
                                Esq {redatorMargemEsquerda.toFixed(1).replace('.', ',')}cm
                              </span>
                            )}
                          </div>

                          {/* Alça Arrastável da Margem Direita */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleReguaMouseDown(e, 'margemDir');
                            }}
                            className="absolute top-0 bottom-0 w-3.5 -translate-x-1/2 z-20 flex flex-col items-center justify-center cursor-col-resize group"
                            style={{ left: `${((21 - redatorMargemDireita) / 21) * 100}%` }}
                            title={`Margem Direita: ${redatorMargemDireita.toFixed(1).replace('.', ',')} cm — Arraste na régua para ajustar (1,0 a 6,0 cm)`}
                          >
                            <div className="w-[2px] h-full bg-purple-600 dark:bg-purple-400 group-hover:bg-purple-700 relative flex items-center justify-center">
                              <div className="w-2.5 h-5 rounded-xs bg-purple-600 dark:bg-purple-500 border border-white dark:border-slate-900 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="w-[1px] h-2.5 bg-white/90 block" />
                              </div>
                            </div>
                            {isArrastandoRegua && reguaArrastandoAlvo === 'margemDir' && (
                              <span className="absolute -top-5 px-1.5 py-0.5 rounded bg-purple-700 text-white text-[9px] font-mono font-bold whitespace-nowrap shadow-md">
                                Dir {redatorMargemDireita.toFixed(1).replace('.', ',')}cm
                              </span>
                            )}
                          </div>

                          {/* Marcador Superior Arrastável de Recuo de 1ª Linha (Cursor Triângulo Azul ▼) */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleReguaMouseDown(e, 'primeira');
                            }}
                            className="absolute top-0 h-1/2 w-4 -translate-x-1/2 z-30 flex flex-col items-center cursor-ew-resize group"
                            style={{
                              left: `${(Math.min(21 - redatorMargemDireita, redatorMargemEsquerda + redatorRecuoParagrafo) / 21) * 100}%`
                            }}
                            title={`Recuo 1ª Linha: ${redatorRecuoParagrafo.toFixed(2).replace('.', ',')} cm — Arraste na parte superior da régua`}
                          >
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[9px] border-t-blue-600 dark:border-t-blue-400 drop-shadow-xs group-hover:scale-110 transition-transform" />
                            <div className="w-[1.5px] flex-1 bg-blue-600 dark:bg-blue-400 opacity-85" />
                            {isArrastandoRegua && reguaArrastandoAlvo === 'primeira' && (
                              <span className="absolute -top-5 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-mono font-bold whitespace-nowrap shadow-md">
                                1ª {redatorRecuoParagrafo.toFixed(2).replace('.', ',')}cm
                              </span>
                            )}
                          </div>

                          {/* Marcador Inferior Arrastável de Recuo de 2ª Linha (Cursor Triângulo Roxo ▲) */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleReguaMouseDown(e, 'segunda');
                            }}
                            className="absolute bottom-0 h-1/2 w-4 -translate-x-1/2 z-30 flex flex-col items-center justify-end cursor-ew-resize group"
                            style={{
                              left: `${(Math.min(21 - redatorMargemDireita, redatorMargemEsquerda + redatorRecuoSegundaLinha) / 21) * 100}%`
                            }}
                            title={`Recuo 2ª Linha: ${redatorRecuoSegundaLinha.toFixed(2).replace('.', ',')} cm — Arraste na parte inferior da régua`}
                          >
                            <div className="w-[1.5px] flex-1 bg-purple-600 dark:bg-purple-400 opacity-85" />
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[9px] border-b-purple-600 dark:border-b-purple-400 drop-shadow-xs group-hover:scale-110 transition-transform" />
                            {isArrastandoRegua && reguaArrastandoAlvo === 'segunda' && (
                              <span className="absolute -bottom-5 px-1.5 py-0.5 rounded bg-purple-600 text-white text-[9px] font-mono font-bold whitespace-nowrap shadow-md">
                                2ª {redatorRecuoSegundaLinha.toFixed(2).replace('.', ',')}cm
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Legenda e Ajuste Rápido de Margens & Recuos no Rodapé da Régua */}
                        <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-600 dark:text-slate-400 px-0.5 flex-wrap gap-2">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {/* Ajuste Rápido Margem Esquerda */}
                            <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 px-1.5 py-0.5 rounded">
                              <span className="w-2 h-2 rounded-xs bg-purple-600 inline-block"></span>
                              <span><b>Margem Esq:</b></span>
                              <button
                                type="button"
                                onClick={() => handleAlterarMargem('esq', redatorMargemEsquerda - 0.5)}
                                disabled={redatorMargemEsquerda <= 1.0}
                                className="w-4 h-4 rounded bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 hover:bg-purple-100 disabled:opacity-30 font-bold leading-none cursor-pointer"
                                title="Diminuir margem esquerda (-0,5 cm)"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-purple-800 dark:text-purple-200">
                                {redatorMargemEsquerda.toFixed(1).replace('.', ',')} cm
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAlterarMargem('esq', redatorMargemEsquerda + 0.5)}
                                disabled={redatorMargemEsquerda >= 6.0}
                                className="w-4 h-4 rounded bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 hover:bg-purple-100 disabled:opacity-30 font-bold leading-none cursor-pointer"
                                title="Aumentar margem esquerda (+0,5 cm)"
                              >
                                +
                              </button>
                            </span>

                            {/* Ajuste Rápido Margem Direita */}
                            <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 px-1.5 py-0.5 rounded">
                              <span className="w-2 h-2 rounded-xs bg-purple-600 inline-block"></span>
                              <span><b>Margem Dir:</b></span>
                              <button
                                type="button"
                                onClick={() => handleAlterarMargem('dir', redatorMargemDireita - 0.5)}
                                disabled={redatorMargemDireita <= 1.0}
                                className="w-4 h-4 rounded bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 hover:bg-purple-100 disabled:opacity-30 font-bold leading-none cursor-pointer"
                                title="Diminuir margem direita (-0,5 cm)"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-purple-800 dark:text-purple-200">
                                {redatorMargemDireita.toFixed(1).replace('.', ',')} cm
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAlterarMargem('dir', redatorMargemDireita + 0.5)}
                                disabled={redatorMargemDireita >= 6.0}
                                className="w-4 h-4 rounded bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 hover:bg-purple-100 disabled:opacity-30 font-bold leading-none cursor-pointer"
                                title="Aumentar margem direita (+0,5 cm)"
                              >
                                +
                              </button>
                            </span>

                            {/* Botão rápido para Sup/Inf */}
                            <button
                              type="button"
                              onClick={() => setIsPainelMargensAberto(prev => !prev)}
                              className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                              title="Abrir/fechar painel completo das 4 margens (incluindo Superior e Inferior)"
                            >
                              Sup {redatorMargemSuperior.toFixed(1).replace('.', ',')} / Inf {redatorMargemInferior.toFixed(1).replace('.', ',')} cm ▾
                            </button>

                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-xs bg-blue-500 inline-block"></span>
                              <span><b>1ª Linha (▼):</b> {redatorRecuoParagrafo.toFixed(2).replace('.', ',')} cm</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-xs bg-purple-500 inline-block"></span>
                              <span><b>2ª Linha (▲):</b> {redatorRecuoSegundaLinha.toFixed(2).replace('.', ',')} cm</span>
                            </span>
                          </div>
                          <span className="hidden xl:inline italic">
                            Área útil: <b>{(21 - redatorMargemEsquerda - redatorMargemDireita).toFixed(1).replace('.', ',')} cm</b> • <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[9px] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">Tab</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[9px] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">Shift+Tab</kbd>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campo Textarea com Indicador de Carregamento da IA */}
                  <div className="relative">
                    <textarea
                      ref={redatorTextareaRef}
                      rows={8}
                      value={redatorTexto}
                      onChange={e => {
                        salvarHistorico(e.target.value);
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData?.getData('text/plain');
                        if (pasted !== undefined) {
                          e.preventDefault();
                          const ta = e.currentTarget;
                          const start = ta.selectionStart;
                          const end = ta.selectionEnd;
                          const limpo = sanitizarTextoSemTabulacaoResidual(pasted);
                          const novoTexto = ta.value.substring(0, start) + limpo + ta.value.substring(end);
                          salvarHistorico(novoTexto);
                          setTimeout(() => {
                            ta.focus();
                            const pos = start + limpo.length;
                            ta.setSelectionRange(pos, pos);
                          }, 10);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          handleTabularTexto(e.shiftKey ? 'diminuir' : 'aumentar');
                        }
                      }}
                      style={{
                        tabSize: 4,
                        MozTabSize: 4
                      }}
                      className={`w-full px-3.5 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-b-xl rounded-t-none border-t-0 text-xs font-sans leading-relaxed text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 shadow-sm transition-opacity ${
                        isGeneratingAiText ? 'opacity-40 pointer-events-none' : ''
                      }`}
                      placeholder="Digite o teor do documento oficial ou utilize a barra de ferramentas de formatação e régua de parágrafos acima..."
                    />
                    {isGeneratingAiText && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xs rounded-xl z-10 space-y-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                          <Bot className="w-4 h-4 animate-spin" />
                          <span>Redigindo documento oficial com IA Gemini...</span>
                        </div>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                          Aplicando Manual de Redação e Padrão Rio Claro – RJ
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* FECHO & ESTRUTURA DE ASSINATURAS (INDIVIDUAL OU COMISSÕES DE PAD / SINDICÂNCIA / TAC) */}
                <div className="space-y-3.5 p-3.5 bg-purple-50/40 dark:bg-purple-950/25 border border-purple-200/80 dark:border-purple-900/60 rounded-xl">
                  {/* Seletor de Modo de Assinatura: Individual vs Colegiada */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/60 dark:border-purple-900/40 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {redatorModoAvancado ? 'Estrutura de Assinaturas:' : 'Assinatura & Órgão Emissor:'}
                      </span>
                    </div>

                    {!redatorModoAvancado && redatorModoAssinatura === 'INDIVIDUAL' ? (
                      <button
                        type="button"
                        onClick={() => toggleRedatorModoAvancado(true)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-all cursor-pointer flex items-center gap-1 self-start sm:self-auto"
                        title="Ativar Modo Avançado para configurar Comissões de PAD, Sindicância ou TAC/CAC"
                      >
                        <Scale className="w-3 h-3" />
                        <span>Usar Comissão / PAD (Modo Avançado)</span>
                      </button>
                    ) : (
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => mudarModoAssinatura('INDIVIDUAL')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          redatorModoAssinatura === 'INDIVIDUAL'
                            ? 'bg-purple-600 text-white shadow-xs font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                        title="Assinatura por um único servidor ou autoridade municipal"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Individual</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => mudarModoAssinatura('COMISSAO_PAD')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          redatorModoAssinatura === 'COMISSAO_PAD'
                            ? 'bg-purple-600 text-white shadow-xs font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                        title="Comissão Processante (Presidente, Secretário(a) e Vogal)"
                      >
                        <Scale className="w-3 h-3" />
                        <span>Comissão PAD / Sindicância (Trio)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => mudarModoAssinatura('COMISSAO_DEFESA')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          redatorModoAssinatura === 'COMISSAO_DEFESA'
                            ? 'bg-purple-600 text-white shadow-xs font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                        title="Comissão com Servidor Notificado / Investigado e Defensor"
                      >
                        <Users className="w-3 h-3" />
                        <span>Comissão + Notificado</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => mudarModoAssinatura('TAC_CAC')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          redatorModoAssinatura === 'TAC_CAC'
                            ? 'bg-purple-600 text-white shadow-xs font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                        title="Termo de Ajustamento de Conduta (Compromitente, Compromissado e Testemunhas)"
                      >
                        <BookMarked className="w-3 h-3" />
                        <span>TAC / CAC (Ajuste Conduta)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => mudarModoAssinatura('PERSONALIZADA')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          redatorModoAssinatura === 'PERSONALIZADA'
                            ? 'bg-purple-600 text-white shadow-xs font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                        title="Definir livremente a quantidade e papéis dos membros assinantes"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Personalizada</span>
                      </button>
                    </div>
                    )}
                  </div>

                  {/* Fecho Oficial (Comum a todos os modos) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-12">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Fecho Oficial do Documento:
                      </label>
                      <select
                        value={redatorFecho}
                        onChange={e => setRedatorFecho(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 shadow-xs"
                      >
                        <option value="Permanecemos à disposição para eventuais esclarecimentos adicionais.">
                          Permanecemos à disposição... (Padrão Rio Claro RJ)
                        </option>
                        <option value="Dê-se ciência, registre-se, notifique-se e cumpra-se.">
                          Dê-se ciência, registre-se, notifique-se e cumpra-se. (Padrão Processual Disciplinar)
                        </option>
                        <option value="Atenciosamente,">Atenciosamente, (Mesma hierarquia ou inferior)</option>
                        <option value="Respeitosamente,">Respeitosamente, (Autoridade superior)</option>
                        <option value="E por estarem justos e acordados, firmam o presente termo.">
                          E por estarem justos e acordados, firmam o presente termo. (Padrão TAC / CAC)
                        </option>
                        <option value="Cordialmente,">Cordialmente,</option>
                      </select>
                    </div>
                  </div>

                  {/* CASO 1: ASSINATURA INDIVIDUAL */}
                  {redatorModoAssinatura === 'INDIVIDUAL' && (
                    <div className="space-y-3 pt-1">
                      {/* COMBO 3: Signatário / Cargo da Base Municipal */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span>Signatário (Servidor / Autoridade):</span>
                          </label>
                          <span className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/60 px-2 py-0.5 rounded-full font-semibold border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>Combo de Autoridades da Base</span>
                          </span>
                        </div>

                        {/* Combo Seletor de Autoridade / Servidor da Base (Escopo Autorizado) */}
                        <select
                          value={
                            listaSignatariosBase.find(s => s.nome === redatorSignatario)?.matricula || ''
                          }
                          onChange={e => {
                            const mat = e.target.value;
                            const found = listaSignatariosBase.find(s => s.matricula === mat);
                            if (found) {
                              setRedatorSignatario(found.nome);
                              setRedatorCargo(found.cargo);
                              setRedatorMatricula(found.matricula);
                              if (currentUser?.nivel === 'ADMIN' || isUserAuthorizedForSecretaria(currentUser, found.secretaria, secretarias)) {
                                setRedatorSecretaria(found.secretaria);
                              }
                              if (!isUserRestrictedToDepartamento(currentUser)) {
                                setRedatorSetorOrigem(found.departamento || found.secretaria);
                              }
                              showToast(`Signatário: ${found.nome} — ${found.cargo}`);
                            }
                          }}
                          className="w-full px-3 py-1.5 bg-purple-50/50 dark:bg-slate-800/80 border border-purple-300 dark:border-purple-800/80 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 shadow-xs"
                        >
                          <option value="">⚡ Escolher Signatário autorizado do seu escopo...</option>
                          {listaSignatariosBase.map(sig => (
                            <option key={sig.matricula} value={sig.matricula}>
                              {sig.nome} — {sig.cargo} ({sig.departamento || sig.secretaria})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* COMBO 4: SECRETARIA E DEPARTAMENTO DE ORIGEM DO DOCUMENTO (ISOLAMENTO ESTRITO DE ESCOPO) */}
                      <div className="space-y-1.5 pt-1 border-t border-purple-200/60 dark:border-purple-900/40">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Landmark className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Secretaria & Departamento Emissor:</span>
                          </label>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                            currentUser?.nivel === 'ADMIN'
                              ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800'
                              : 'text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800'
                          }`}>
                            <Lock className="w-2.5 h-2.5" />
                            <span>
                              {currentUser?.nivel === 'ADMIN'
                                ? 'Modo Admin (Todas as Pastas)'
                                : isUserRestrictedToDepartamento(currentUser)
                                ? 'Escopo Travado (Secretaria + Depto)'
                                : 'Escopo Travado na sua Secretaria'}
                            </span>
                          </span>
                        </div>

                        {currentUser?.nivel === 'ADMIN' ? (
                          <>
                            <select
                              value={listaSecretariasBase.includes(redatorSecretaria) ? redatorSecretaria : ''}
                              onChange={e => {
                                if (e.target.value) {
                                  const novaSec = e.target.value;
                                  setRedatorSecretaria(novaSec);
                                  const secObj = secretarias.find(s => isSameSecretaria(`${s.nome} (${s.sigla})`, novaSec, secretarias));
                                  setRedatorSetorOrigem(secObj?.departamentos?.[0] || (getSecretariaSigla(novaSec, secretarias) === 'SMA' ? 'Departamento de Recursos Humanos (DRH)' : 'Gabinete'));
                                  showToast(`Secretaria de emissão: ${novaSec}`);
                                }
                              }}
                              className="w-full px-3 py-1.5 bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-300 dark:border-indigo-800/80 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 shadow-xs"
                            >
                              <option value="">⚡ Selecionar Secretaria Municipal Emissora...</option>
                              {listaSecretariasBase.map((sec, idx) => (
                                <option key={idx} value={sec}>{sec}</option>
                              ))}
                            </select>

                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              <span className="text-[10px] text-slate-400 font-medium mr-0.5">Secretarias:</span>
                              {[
                                'Secretaria Municipal de Administração (SMA)',
                                'Secretaria Municipal de Saúde (SMS)',
                                'Secretaria Municipal de Educação (SME)',
                                'Secretaria Municipal de Fazenda e Finanças (SMF)',
                                'Secretaria Municipal de Obras e Serviços Públicos (SMOSP)',
                                'Procuradoria-Geral do Município (PGM)',
                                'Controladoria Geral do Município (CGM)',
                                'Secretaria de Governo e Gabinete do Prefeito (SEGOV)'
                              ].map(secChip => (
                                <button
                                  key={secChip}
                                  type="button"
                                  onClick={() => {
                                    setRedatorSecretaria(secChip);
                                    const secObj = secretarias.find(s => isSameSecretaria(`${s.nome} (${s.sigla})`, secChip, secretarias));
                                    setRedatorSetorOrigem(secObj?.departamentos?.[0] || (getSecretariaSigla(secChip, secretarias) === 'SMA' ? 'Departamento de Recursos Humanos (DRH)' : 'Gabinete'));
                                  }}
                                  className={`px-1.5 py-0.5 text-[10px] rounded transition-all font-medium border ${
                                    isSameSecretaria(redatorSecretaria, secChip, secretarias)
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  {secChip.replace('Secretaria Municipal de ', 'Sec. ')}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : listaSecretariasDoUsuario.length > 1 ? (
                          <select
                            value={redatorSecretaria}
                            onChange={e => {
                              const novaSec = e.target.value;
                              if (isUserAuthorizedForSecretaria(currentUser, novaSec, secretarias)) {
                                setRedatorSecretaria(novaSec);
                                setActiveSecretaria(novaSec);
                                localStorage.setItem('bm_active_secretaria', novaSec);
                                if (!isUserRestrictedToDepartamento(currentUser)) {
                                  const secObj = secretarias.find(s => isSameSecretaria(`${s.nome} (${s.sigla})`, novaSec, secretarias));
                                  setRedatorSetorOrigem(secObj?.departamentos?.[0] || 'Gabinete');
                                }
                                showToast(`Pasta emissora selecionada: ${novaSec}`);
                              }
                            }}
                            className="w-full px-3 py-1.5 bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-300 dark:border-indigo-800/80 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 shadow-xs"
                          >
                            {listaSecretariasDoUsuario.map((sec, idx) => (
                              <option key={idx} value={sec}>{sec}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2">
                            <span className="truncate">{redatorSecretaria}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0">
                              {getSecretariaSigla(redatorSecretaria, secretarias)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Campos: Nome, Cargo e Departamento Emissor */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-purple-200/40 dark:border-purple-900/30">
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mb-0.5">
                            Nome do Signatário:
                          </label>
                          <input
                            type="text"
                            list="react-datalist-signatarios"
                            value={redatorSignatario}
                            onChange={e => setRedatorSignatario(e.target.value)}
                            placeholder="Nome do servidor"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mb-0.5">
                            Cargo / Função Oficial:
                          </label>
                          <input
                            type="text"
                            list="react-datalist-cargos"
                            value={redatorCargo}
                            onChange={e => setRedatorCargo(e.target.value)}
                            placeholder="Cargo ou função pública"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mb-0.5 flex items-center gap-1">
                            <span>Departamento Emissor:</span>
                            {isUserRestrictedToDepartamento(currentUser) && (
                              <span title="Travado no seu departamento de lotação" className="inline-flex">
                                <Lock className="w-2.5 h-2.5 text-amber-600" />
                              </span>
                            )}
                          </label>
                          {isUserRestrictedToDepartamento(currentUser) ? (
                            <div
                              className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 truncate"
                              title={`Departamento bloqueado para seu perfil: ${currentUser?.departamento}`}
                            >
                              {currentUser?.departamento}
                            </div>
                          ) : (
                            <select
                              value={departamentosDaSecretariaAtiva.includes(redatorSetorOrigem) ? redatorSetorOrigem : ''}
                              onChange={e => {
                                if (e.target.value) setRedatorSetorOrigem(e.target.value);
                              }}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                            >
                              {!departamentosDaSecretariaAtiva.includes(redatorSetorOrigem) && redatorSetorOrigem && (
                                <option value="">{redatorSetorOrigem}</option>
                              )}
                              {departamentosDaSecretariaAtiva.map((dep, idx) => (
                                <option key={idx} value={dep}>{dep}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CASO 2: ASSINATURA COLEGIADA / COMISSÃO DE SINDICÂNCIA, PAD OU TAC/CAC */}
                  {redatorModoAssinatura !== 'INDIVIDUAL' && (
                    <div className="space-y-3 pt-1">
                      {/* Barra de Ações da Comissão */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-purple-200/70 dark:border-purple-900/50">
                        {/* Carregar Comissão Pré-configurada */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
                          <select
                            onChange={e => {
                              if (e.target.value) handleCarregarComissao(e.target.value);
                            }}
                            defaultValue=""
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 font-medium"
                          >
                            <option value="" disabled>⚡ Carregar Comissão Salva no Município...</option>
                            {comissoesSalvas.map((c, i) => (
                              <option key={i} value={c.nomeComissao}>
                                {c.nomeComissao} ({c.membros.length} membros)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Botões Utilitários da Comissão */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setIsModalSalvarComissaoAberto(true)}
                            className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/50 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                            title="Salvar a composição atual desta comissão para reutilizar facilmente em futuros despachos e termos"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Salvar Comissão</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleSincronizarNomesComTexto}
                            className="px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                            title="Substitui automaticamente [PRESIDENTE], [SECRETÁRIO], [VOGAL], [COMPROMITENTE] no texto do documento pelos dados dos membros abaixo"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Sincronizar no Texto</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleAdicionarMembro}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                            title="Adicionar mais um membro ou participante assinante"
                          >
                            <span>+ Membro</span>
                          </button>
                        </div>
                      </div>

                      {/* Modal / Diálogo Rápido para Salvar Comissão */}
                      {isModalSalvarComissaoAberto && (
                        <div className="p-3 bg-purple-100/90 dark:bg-purple-900/80 border border-purple-300 dark:border-purple-700 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-900 dark:text-purple-100">
                              Salvar Configuração desta Comissão:
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsModalSalvarComissaoAberto(false)}
                              className="text-xs font-bold text-slate-500 hover:text-slate-800"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={nomeNovaComissaoSalvar}
                              onChange={e => setNomeNovaComissaoSalvar(e.target.value)}
                              placeholder="Ex: Comissão de PAD - Portaria SMA nº 042/2026"
                              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-purple-300 rounded text-xs focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (nomeNovaComissaoSalvar.trim()) {
                                  handleSalvarComissaoAtual(nomeNovaComissaoSalvar);
                                  setNomeNovaComissaoSalvar('');
                                  setIsModalSalvarComissaoAberto(false);
                                }
                              }}
                              className="px-3 py-1.5 bg-purple-700 text-white rounded text-xs font-bold hover:bg-purple-800 cursor-pointer"
                            >
                              Confirmar e Salvar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Lista de Membros da Comissão em Cards Responsivos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {redatorMembrosComissao.map((m, idx) => (
                          <div
                            key={m.id}
                            className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/70 rounded-xl p-3 shadow-2xs space-y-2 relative"
                          >
                            {/* Cabeçalho do Card do Membro */}
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                                <span>#{idx + 1}</span>
                                <span>•</span>
                                <span>{m.funcao.split(' ')[0] || 'Membro'}</span>
                              </span>

                              {redatorMembrosComissao.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoverMembro(m.id)}
                                  className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                  title="Remover membro da comissão"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Seletor Rápido de Servidor da Base */}
                            <div>
                              <select
                                onChange={e => {
                                  const s = listaSignatariosBase.find(sb => sb.matricula === e.target.value);
                                  if (s) {
                                    handleAtualizarMembro(m.id, 'nome', s.nome);
                                    handleAtualizarMembro(m.id, 'matricula', s.matricula);
                                    handleAtualizarMembro(m.id, 'cargoEfetivo', s.cargo);
                                  }
                                }}
                                defaultValue=""
                                className="w-full px-2 py-1 bg-purple-50/50 dark:bg-slate-800/80 border border-purple-200 dark:border-purple-800 rounded text-[11px] text-slate-700 dark:text-slate-300"
                              >
                                <option value="" disabled>⚡ Escolher servidor da base...</option>
                                {listaSignatariosBase.map(sb => (
                                  <option key={sb.matricula} value={sb.matricula}>
                                    {sb.nome} ({sb.cargo})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Papel / Função na Comissão */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                                Papel / Função no Processo:
                              </label>
                              <input
                                type="text"
                                value={m.funcao}
                                onChange={e => handleAtualizarMembro(m.id, 'funcao', e.target.value)}
                                placeholder="Ex: Presidente da Comissão, Secretária, Vogal"
                                className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold focus:ring-1 focus:ring-purple-500"
                              />
                            </div>

                            {/* Nome Completo do Membro */}
                            <div>
                              <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                                Nome Completo:
                              </label>
                              <input
                                type="text"
                                list="react-datalist-signatarios"
                                value={m.nome}
                                onChange={e => handleAtualizarMembro(m.id, 'nome', e.target.value)}
                                placeholder="Nome do integrante"
                                className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs focus:ring-1 focus:ring-purple-500"
                              />
                            </div>

                            {/* Matrícula & Cargo Efetivo */}
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                                  Matrícula:
                                </label>
                                <input
                                  type="text"
                                  value={m.matricula}
                                  onChange={e => handleAtualizarMembro(m.id, 'matricula', e.target.value)}
                                  placeholder="Ex: 1001"
                                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs focus:ring-1 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                                  Cargo Efetivo:
                                </label>
                                <input
                                  type="text"
                                  list="react-datalist-cargos"
                                  value={m.cargoEfetivo}
                                  onChange={e => handleAtualizarMembro(m.id, 'cargoEfetivo', e.target.value)}
                                  placeholder="Cargo do servidor"
                                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs focus:ring-1 focus:ring-purple-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        <span>
                          ★ Dica: Na visualização e impressão, os membros serão dispostos em colunas alinhadas com linhas de assinatura individuais.
                        </span>
                        <span className="font-semibold text-purple-700 dark:text-purple-300">
                          {redatorMembrosComissao.length} membro(s) cadastrado(s)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Datalists nativos para auto-completar ultra-rápido */}
                <datalist id="react-datalist-destinatarios">
                  {listaDestinatariosBase.map((d, i) => (
                    <option key={i} value={d} />
                  ))}
                </datalist>

                <datalist id="react-datalist-assuntos">
                  {listaAssuntosBase.map((a, i) => (
                    <option key={i} value={a.assunto} />
                  ))}
                </datalist>

                <datalist id="react-datalist-signatarios">
                  {listaSignatariosBase.map((s, i) => (
                    <option key={i} value={s.nome} />
                  ))}
                </datalist>

                <datalist id="react-datalist-cargos">
                  {Array.from(new Set(listaSignatariosBase.map(s => s.cargo))).map((c, i) => (
                    <option key={i} value={c} />
                  ))}
                </datalist>

                <datalist id="react-datalist-secretarias">
                  {listaSecretariasBase.map((sec, i) => (
                    <option key={i} value={sec} />
                  ))}
                </datalist>
              </div>

              {/* Column 2: Prévia Timbrada em Tempo Real (Col 5) - Fixa ao Rolar */}
              {!isFloatingPreview && (
                <div className="lg:col-span-5 flex flex-col space-y-3 lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(95vh-130px)]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                      <span>Visualização Timbrada (Padrão Rio Claro – RJ)</span>
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={toggleFloatingPreview}
                        className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-md text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Tornar a visualização flutuante para acompanhar a tela durante a digitação"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Tornar Flutuante</span>
                      </button>
                    </div>
                  </div>

                  {renderPreviaDocumento(false)}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <span className="text-xs text-slate-500 hidden md:inline">
                A numeração é controlada pelo LockService do Apps Script para evitar duplicidade entre secretarias.
              </span>

              <div className="flex flex-wrap items-center justify-end gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsRedatorModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (redatorTipo === 'EMAIL') {
                      const emailCompleto = `De: ${redatorSignatario} (${redatorSecretaria})\nPara: ${redatorDestinatario}\n${redatorEmailCc ? `Cc: ${redatorEmailCc}\n` : ''}Assunto: [PMRC] ${redatorAssunto}\nData: ${redatorData}\n\nPrezados(as),\n\n${redatorTexto}\n\n${redatorFecho}\n\n--\n${redatorSignatario}\n${redatorCargo}\n${redatorSecretaria}\nPrefeitura Municipal de Rio Claro – RJ`;
                      navigator.clipboard.writeText(emailCompleto);
                      showToast('E-mail institucional completo copiado para a área de transferência!');
                    } else {
                      let textoFormatado = '';
                      if (redatorTipo === 'DECRETO') {
                        textoFormatado = `DECRETO Nº ${redatorNumero || '____/2026'}\n\n${redatorAssunto ? `EMENTA: ${redatorAssunto}\n\n` : ''}${redatorTexto}\n\n${redatorFecho || `Gabinete do Prefeito, Rio Claro – RJ, ${redatorData}.`}\n\n${redatorSignatario}\nPrefeito Municipal de Rio Claro – RJ`;
                      } else if (redatorTipo === 'PORTARIA') {
                        textoFormatado = `PORTARIA Nº ${redatorNumero || '____/2026'}\n\n${redatorAssunto ? `EMENTA: ${redatorAssunto}\n\n` : ''}${redatorTexto}\n\n${redatorFecho || 'Dê-se ciência, registre-se, publique-se e cumpra-se.'}\n\n${redatorData}\n\n${redatorSignatario}\n${redatorCargo}\n${redatorSecretaria}`;
                      } else {
                        textoFormatado = `${redatorTipo} Nº ${redatorNumero || '____/2026'}\n${redatorData}\n\nÓrgão Expedidor: ${redatorSecretaria}\nDestinatário: ${redatorDestinatario}\nAssunto: ${redatorAssunto}\n\n${redatorTexto}\n\n${redatorFecho}\n\n${redatorSignatario}\n${redatorCargo}\n${redatorSecretaria}\nPrefeitura Municipal de Rio Claro – RJ`;
                      }
                      navigator.clipboard.writeText(textoFormatado);
                      showToast(`Texto do ${redatorTipo} copiado para a área de transferência!`);
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{redatorTipo === 'EMAIL' ? 'Copiar E-mail' : 'Copiar Texto'}</span>
                </button>

                {redatorTipo === 'EMAIL' && (
                  <button
                    type="button"
                    onClick={() => {
                      const subject = encodeURIComponent(`[PMRC] ${redatorAssunto || 'Comunicação Oficial'}`);
                      const body = encodeURIComponent(`${redatorTexto}\n\n${redatorFecho}\n\n--\n${redatorSignatario}\n${redatorCargo}\n${redatorSecretaria}\nPrefeitura Municipal de Rio Claro – RJ`);
                      const ccParam = redatorEmailCc ? `&cc=${encodeURIComponent(redatorEmailCc)}` : '';
                      window.location.href = `mailto:${encodeURIComponent(redatorDestinatario)}?subject=${subject}&body=${body}${ccParam}`;
                    }}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
                    title="Abre o cliente padrão de e-mail (Outlook, Thunderbird, Gmail)"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Abrir no E-mail (mailto)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleBaixarTxtRedator}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
                  title="Baixar arquivo leve em Texto Simples (.txt)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Salvar Texto (.txt)</span>
                </button>

                <button
                  id="btn-redator-word"
                  data-tip="word"
                  type="button"
                  onClick={handleBaixarDocxRedator}
                  className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
                  title="Exportar documento oficial para Microsoft Word (.doc) com Brasão Municipal"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Salvar no Word (.doc)</span>
                </button>

                <button
                  id="btn-salvar-pdf-redator"
                  data-tip="salvarpdf"
                  type="button"
                  disabled={isSavingPdf}
                  onClick={handleBaixarPdfRedator}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer"
                  title="Gerar e baixar documento em PDF A4 timbrado oficial"
                >
                  {isSavingPdf ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Gerando PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Salvar em PDF</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsRedatorLetterheadOpen(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{redatorTipo === 'EMAIL' ? 'Visualizar / Imprimir' : 'Visualizar Timbrado / Imprimir'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalizarDocumentoRedator}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Emitir e Registrar na Numeração</span>
                </button>
              </div>
            </div>

            {/* JANELA DE PRÉVIA FLUTUANTE (PICTURE-IN-PICTURE ARRASTÁVEL E REDIMENSIONÁVEL) */}
            {isFloatingPreview && (
              <div
                ref={floatingPreviewRef}
                style={{
                  ...(floatingPreviewPos
                    ? { left: `${floatingPreviewPos.x}px`, top: `${floatingPreviewPos.y}px` }
                    : {}),
                  ...(!isFloatingPreviewMinimized && floatingPreviewSize
                    ? { width: `${floatingPreviewSize.width}px`, height: `${floatingPreviewSize.height}px` }
                    : {}),
                }}
                className={`fixed ${floatingPreviewPos ? '' : 'bottom-5 right-5'} z-[80] bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 shadow-2xl rounded-2xl overflow-hidden flex flex-col ${
                  isDraggingFloatingPreview || isResizingFloatingPreview
                    ? 'transition-none ring-4 ring-blue-500/30 select-none'
                    : 'transition-shadow duration-200'
                } ${
                  isFloatingPreviewMinimized
                    ? 'w-auto max-w-sm'
                    : floatingPreviewSize
                    ? 'max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)]'
                    : 'w-[410px] sm:w-[470px] max-w-[92vw] max-h-[76vh]'
                }`}
              >
                {/* Alças de Redimensionamento pelas 4 Bordas e 4 Cantos */}
                {!isFloatingPreviewMinimized && (
                  <>
                    <div
                      onPointerDown={handleFloatingResizePointerDown('n')}
                      onPointerMove={handleFloatingResizePointerMove}
                      onPointerUp={handleFloatingResizePointerEnd}
                      onPointerCancel={handleFloatingResizePointerEnd}
                      title="Arraste a borda superior para redimensionar"
                      className="absolute top-0 left-3 right-3 h-2 cursor-ns-resize touch-none z-20"
                    />
                    <div
                      onPointerDown={handleFloatingResizePointerDown('s')}
                      onPointerMove={handleFloatingResizePointerMove}
                      onPointerUp={handleFloatingResizePointerEnd}
                      onPointerCancel={handleFloatingResizePointerEnd}
                      title="Arraste a borda inferior para redimensionar"
                      className="absolute bottom-0 left-3 right-3 h-2 cursor-ns-resize touch-none z-20"
                    />
                    <div
                      onPointerDown={handleFloatingResizePointerDown('w')}
                      onPointerMove={handleFloatingResizePointerMove}
                      onPointerUp={handleFloatingResizePointerEnd}
                      onPointerCancel={handleFloatingResizePointerEnd}
                      title="Arraste a borda esquerda para redimensionar"
                      className="absolute left-0 top-3 bottom-3 w-2 cursor-ew-resize touch-none z-20"
                    />
                    <div
                      onPointerDown={handleFloatingResizePointerDown('e')}
                      onPointerMove={handleFloatingResizePointerMove}
                      onPointerUp={handleFloatingResizePointerEnd}
                      onPointerCancel={handleFloatingResizePointerEnd}
                      title="Arraste a borda direita para redimensionar"
                      className="absolute right-0 top-3 bottom-3 w-2 cursor-ew-resize touch-none z-20"
                    />
                    <div
                      onPointerDown={handleFloatingResizePointerDown('nw')}
                      onPointerMove={handleFloatingResizePointerMove}
                      onPointerUp={handleFloatingResizePointerEnd}
                      onPointerCancel={handleFloatingResizePointerEnd}
                      title="Arraste o canto superior esquerdo para redimensionar"
                      className="absolute top-0 left-0 w-3.5 h-3.5 cursor-nwse-resize touch-none z-30"
                    />
                    <div
                      onPointerDown={handleFloatingResizePointerDown('ne')}
                      onPointerMove={handleFloatingResizePointerMove}
                      onPointerUp={handleFloatingResizePointerEnd}
                      onPointerCancel={handleFloatingResizePointerEnd}
                      title="Arraste o canto superior direito para redimensionar"
                      className="absolute top-0 right-0 w-3.5 h-3.5 cursor-nesw-resize touch-none z-30"
                    />
                    <div
                      onPointerDown={handleFloatingResizePointerDown('sw')}
                      onPointerMove={handleFloatingResizePointerMove}
                      onPointerUp={handleFloatingResizePointerEnd}
                      onPointerCancel={handleFloatingResizePointerEnd}
                      title="Arraste o canto inferior esquerdo para redimensionar"
                      className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-nesw-resize touch-none z-30"
                    />
                    <div
                      onPointerDown={handleFloatingResizePointerDown('se')}
                      onPointerMove={handleFloatingResizePointerMove}
                      onPointerUp={handleFloatingResizePointerEnd}
                      onPointerCancel={handleFloatingResizePointerEnd}
                      title="Arraste o canto inferior direito para redimensionar"
                      className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize touch-none z-30 flex items-end justify-end p-1 group"
                    >
                      <span className="w-2.5 h-2.5 border-r-2 border-b-2 border-blue-500/70 group-hover:border-blue-600 dark:border-blue-400/70 dark:group-hover:border-blue-300 rounded-br-[2px] transition-colors" />
                    </div>
                  </>
                )}

                {/* Header da Janela Flutuante (Arrastável por mouse e toque) */}
                <div
                  onPointerDown={handleFloatingHeaderPointerDown}
                  onPointerMove={handleFloatingHeaderPointerMove}
                  onPointerUp={handleFloatingHeaderPointerEnd}
                  onPointerCancel={handleFloatingHeaderPointerEnd}
                  onDoubleClick={handleFloatingHeaderDoubleClick}
                  title="Arraste para mover o bloco pela tela (duplo clique para restaurar posição e tamanho padrão)"
                  className={`p-3 bg-linear-to-r from-slate-900 to-[#002b82] text-white flex items-center justify-between gap-2 select-none touch-none shadow-sm shrink-0 ${
                    isDraggingFloatingPreview ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GripHorizontal
                      className="w-4 h-4 text-slate-300/80 shrink-0"
                      aria-hidden="true"
                    />
                    <img
                      src={BRASAO_RIO_CLARO}
                      alt="Brasão Rio Claro"
                      className="w-5 h-6 object-contain shrink-0 pointer-events-none"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs truncate">Visualização Flutuante</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Ao Vivo
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 truncate">
                        {redatorTipo} {redatorNumero ? `nº ${redatorNumero}` : '(Minuta)'} • {getSecretariaSigla(redatorSecretaria, secretarias)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Controles de Escala quando aberta */}
                    {!isFloatingPreviewMinimized && (
                      <div className="flex items-center bg-slate-800/80 rounded border border-slate-700 p-0.5 mr-1">
                        <button
                          type="button"
                          onClick={() => setFloatingZoom('mini')}
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-colors cursor-pointer ${floatingZoom === 'mini' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
                          title="Escala 75%"
                        >
                          75%
                        </button>
                        <button
                          type="button"
                          onClick={() => setFloatingZoom('compact')}
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-colors cursor-pointer ${floatingZoom === 'compact' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
                          title="Escala 85%"
                        >
                          85%
                        </button>
                        <button
                          type="button"
                          onClick={() => setFloatingZoom('normal')}
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-colors cursor-pointer ${floatingZoom === 'normal' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
                          title="Escala 100%"
                        >
                          100%
                        </button>
                      </div>
                    )}

                    {/* Minimizar / Restaurar */}
                    <button
                      type="button"
                      onClick={() => setIsFloatingPreviewMinimized(prev => !prev)}
                      className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title={isFloatingPreviewMinimized ? 'Expandir prévia flutuante' : 'Minimizar para barra'}
                    >
                      {isFloatingPreviewMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Acoplar na Tela (volta ao modo fixo lateral) */}
                    <button
                      type="button"
                      onClick={toggleFloatingPreview}
                      className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="Acoplar de volta ao lado do editor"
                    >
                      <span>Acoplar</span>
                    </button>
                  </div>
                </div>

                {/* Corpo da Janela Flutuante */}
                {!isFloatingPreviewMinimized ? (
                  <div className={`flex-1 min-h-0 overflow-y-auto p-1.5 bg-slate-100 dark:bg-slate-950 flex flex-col ${floatingPreviewSize ? '' : 'max-h-[65vh]'}`}>
                    <div
                      className="w-full flex-1 min-h-full flex flex-col"
                      style={{
                        zoom: floatingZoom === 'mini' ? 0.75 : floatingZoom === 'compact' ? 0.85 : 1,
                      }}
                    >
                      {renderPreviaDocumento(true)}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsFloatingPreviewMinimized(false)}
                    className="p-2.5 px-4 bg-slate-900 text-slate-200 text-xs flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Prévia Flutuante minimizada • Clique para expandir
                    </span>
                    <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                )}
              </div>
            )}

            {/* Alças de Redimensionamento pelas 4 Bordas e 4 Cantos do Redator Oficial */}
            {!isRedatorFullscreen && (
              <>
                <div
                  onPointerDown={handleRedatorResizePointerDown('n')}
                  onPointerMove={handleRedatorResizePointerMove}
                  onPointerUp={handleRedatorResizePointerEnd}
                  onPointerCancel={handleRedatorResizePointerEnd}
                  title="Arraste a borda superior para redimensionar"
                  className="absolute top-0 left-3.5 right-3.5 h-2 cursor-ns-resize touch-none z-40"
                />
                <div
                  onPointerDown={handleRedatorResizePointerDown('s')}
                  onPointerMove={handleRedatorResizePointerMove}
                  onPointerUp={handleRedatorResizePointerEnd}
                  onPointerCancel={handleRedatorResizePointerEnd}
                  title="Arraste a borda inferior para redimensionar"
                  className="absolute bottom-0 left-3.5 right-3.5 h-2 cursor-ns-resize touch-none z-40"
                />
                <div
                  onPointerDown={handleRedatorResizePointerDown('w')}
                  onPointerMove={handleRedatorResizePointerMove}
                  onPointerUp={handleRedatorResizePointerEnd}
                  onPointerCancel={handleRedatorResizePointerEnd}
                  title="Arraste a borda esquerda para redimensionar"
                  className="absolute left-0 top-3.5 bottom-3.5 w-2 cursor-ew-resize touch-none z-40"
                />
                <div
                  onPointerDown={handleRedatorResizePointerDown('e')}
                  onPointerMove={handleRedatorResizePointerMove}
                  onPointerUp={handleRedatorResizePointerEnd}
                  onPointerCancel={handleRedatorResizePointerEnd}
                  title="Arraste a borda direita para redimensionar"
                  className="absolute right-0 top-3.5 bottom-3.5 w-2 cursor-ew-resize touch-none z-40"
                />
                <div
                  onPointerDown={handleRedatorResizePointerDown('nw')}
                  onPointerMove={handleRedatorResizePointerMove}
                  onPointerUp={handleRedatorResizePointerEnd}
                  onPointerCancel={handleRedatorResizePointerEnd}
                  title="Arraste o canto superior esquerdo para redimensionar"
                  className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize touch-none z-50"
                />
                <div
                  onPointerDown={handleRedatorResizePointerDown('ne')}
                  onPointerMove={handleRedatorResizePointerMove}
                  onPointerUp={handleRedatorResizePointerEnd}
                  onPointerCancel={handleRedatorResizePointerEnd}
                  title="Arraste o canto superior direito para redimensionar"
                  className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize touch-none z-50"
                />
                <div
                  onPointerDown={handleRedatorResizePointerDown('sw')}
                  onPointerMove={handleRedatorResizePointerMove}
                  onPointerUp={handleRedatorResizePointerEnd}
                  onPointerCancel={handleRedatorResizePointerEnd}
                  title="Arraste o canto inferior esquerdo para redimensionar"
                  className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize touch-none z-50"
                />
                <div
                  onPointerDown={handleRedatorResizePointerDown('se')}
                  onPointerMove={handleRedatorResizePointerMove}
                  onPointerUp={handleRedatorResizePointerEnd}
                  onPointerCancel={handleRedatorResizePointerEnd}
                  title="Arraste o canto inferior direito para redimensionar"
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize touch-none z-50 flex items-end justify-end p-1 group"
                >
                  <span className="w-2.5 h-2.5 border-r-2 border-b-2 border-emerald-500/70 group-hover:border-emerald-600 dark:border-emerald-400/70 dark:group-hover:border-emerald-300 rounded-br-[2px] transition-colors" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DOCUMENTO OFICIAL TIMBRADO IMPRESSÃO (RIO CLARO – RJ)             */}
      {/* ========================================================================= */}
      {isRedatorLetterheadOpen && (
        <div id="modal-timbrado-container" className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto modal-timbrado-backdrop" onClick={(e) => { if (e.target === e.currentTarget) handleFecharTimbrado(); }}>
          <div id="modal-timbrado-card" className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto border border-slate-300 modal-timbrado-card">
            {/* Top Toolbar */}
            <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2.5 no-print">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-xs sm:text-sm">Visualização de Impressão Oficial</span>
                <span className="text-xs text-slate-400 hidden sm:inline">• Prefeitura Municipal de Rio Claro – RJ</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleImprimirDocumentoTimbrado}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                  title="Imprimir documento em papel timbrado oficial ou Salvar como PDF pelo navegador"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Documento</span>
                </button>
                <button
                  type="button"
                  disabled={isSavingPdf}
                  onClick={handleBaixarPdfRedator}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer"
                  title="Gerar e baixar documento em PDF A4 timbrado oficial"
                >
                  {isSavingPdf ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Gerando PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Salvar em PDF</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleBaixarDocxRedator}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                  title="Baixar em Microsoft Word (.doc) com Brasão oficial"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Salvar no Word (.doc)</span>
                </button>
                <button
                  type="button"
                  onClick={handleBaixarTxtRedator}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                  title="Baixar em Texto Simples (.txt)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Salvar Texto (.txt)</span>
                </button>
                <button
                  type="button"
                  onClick={handleFecharTimbrado}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
                  title="Fechar visualização de impressão oficial"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Folha A4 Oficial */}
            <div 
              id="print-area-content" 
              className="font-serif leading-relaxed text-slate-900 bg-white print-area-container"
              style={{
                paddingTop: `${redatorMargemSuperior}cm`,
                paddingRight: `${redatorMargemDireita}cm`,
                paddingBottom: `${redatorMargemInferior}cm`,
                paddingLeft: `${redatorMargemEsquerda}cm`,
                boxSizing: 'border-box'
              }}
            >
              {/* Brasão Oficial e Cabeçalho DRH Rio Claro */}
              <div id="cabecalho-timbrado" className="cabecalho-timbrado avoid-break flex items-center gap-5 pb-5 border-b-2 border-[#002b82] mb-8" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <img
                  src={BRASAO_RIO_CLARO}
                  onError={e => { (e.target as HTMLImageElement).src = BRASAO_RIO_CLARO; }}
                  alt="Brasão Oficial da Prefeitura Municipal de Rio Claro RJ"
                  width={83}
                  height={96}
                  style={{
                    width: '83px',
                    height: '96px',
                    minWidth: '83px',
                    minHeight: '96px',
                    maxWidth: '83px',
                    maxHeight: '96px',
                    aspectRatio: '86 / 100',
                    objectFit: 'contain',
                    flexShrink: 0,
                    display: 'block'
                  }}
                  className="brasao-oficial-img object-contain shrink-0"
                />
                <div className="text-[#002b82] font-sans">
                  <div className="font-extrabold text-sm sm:text-base tracking-wide uppercase leading-tight">
                    ESTADO DO RIO DE JANEIRO
                  </div>
                  <div className="font-black text-base sm:text-lg tracking-tight uppercase leading-tight mt-0.5">
                    PREFEITURA MUNICIPAL DE RIO CLARO
                  </div>
                  <div className="text-xs text-slate-600 font-medium leading-tight mt-1">
                    Av. João Batista Portugal, nº 230 • CNPJ: 29.051.216/0001-68
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-[#002b82] uppercase leading-tight mt-1">
                    {redatorSecretaria}
                  </div>
                  {redatorSetorOrigem && redatorSetorOrigem !== redatorSecretaria && (
                    <div className="text-[11px] text-slate-700 font-medium leading-tight mt-0.5">
                      {redatorSetorOrigem}
                    </div>
                  )}
                </div>
              </div>

              {/* Conteúdo: Distinção entre Atos Solenes (DECRETO, PORTARIA, ATO, TERMO) e Correspondências (MEMORANDO, OFÍCIO, ETC.) */}
              {(redatorTipo === 'DECRETO' || redatorTipo === 'PORTARIA' || redatorTipo === 'ATO' || redatorTipo === 'TERMO') ? (
                <div>
                  {/* Epígrafe Centralizada */}
                  <div className="text-center mb-6 pb-2 border-b-2 border-[#002b82]/30">
                    <h3 className="text-base sm:text-lg font-black text-[#002b82] tracking-wider uppercase">
                      {getDocumentoPrefixo(redatorTipo, redatorNumero)}
                    </h3>
                    <span className="text-xs text-slate-600 font-medium">
                      {redatorTipo === 'TERMO' 
                        ? 'Compromisso de Ajustamento de Conduta (CAC / TAC) • LINDB art. 26' 
                        : (redatorTipo === 'DECRETO' ? 'Prefeitura Municipal de Rio Claro – RJ' : redatorSecretaria)}
                    </span>
                  </div>

                  {/* Ementa / Objeto Recuada à Direita */}
                  {redatorAssunto && (
                    <div className="ml-auto w-7/12 text-justify italic text-xs text-slate-800 leading-snug mb-6 pl-4 border-l-2 border-[#002b82]">
                      {redatorAssunto}
                    </div>
                  )}

                  {/* Corpo do Documento */}
                  <div
                    className="sgep-rich-doc leading-relaxed mb-10 pl-0"
                    style={{
                      fontFamily: redatorFonte === 'Arial' ? 'Arial, sans-serif' : redatorFonte === 'Calibri' ? 'Calibri, sans-serif' : '"Times New Roman", Times, serif',
                      fontSize: redatorTamanhoFonte === '10pt' ? '12px' : redatorTamanhoFonte === '11pt' ? '13px' : '14px',
                      textAlign: redatorAlinhamento
                    }}
                    dangerouslySetInnerHTML={{
                      __html: converterTextoOficialHTML(redatorTexto, 'print', redatorFonte, redatorTamanhoFonte, redatorAlinhamento)
                    }}
                  />

                  {/* Fecho e Data Solene */}
                  <div className="mb-14 font-sans text-xs sm:text-sm text-slate-800">
                    <p className="font-semibold text-slate-800">
                      {redatorFecho || (redatorTipo === 'PORTARIA' ? 'Dê-se ciência, registre-se, publique-se e cumpra-se.' : `Rio Claro – RJ, ${redatorData}.`)}
                    </p>
                    {redatorTipo === 'PORTARIA' && (
                      <p className="text-xs text-slate-600 mt-1">Rio Claro – RJ, {redatorData}.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Número e Data */}
                  <div className="flex justify-between items-baseline mb-6 font-sans text-xs sm:text-sm">
                    <div>
                      <strong className="text-base font-black text-[#002b82]">
                        {redatorTipo === 'EMAIL' ? 'COMUNICAÇÃO ELETRÔNICA INSTITUCIONAL (E-MAIL)' : getDocumentoPrefixo(redatorTipo, redatorNumero)}
                      </strong>
                      {redatorReferenciaDoc && redatorTipo !== 'EMAIL' && (
                        <p className="text-xs text-slate-600 italic mt-0.5">
                          Referência: {redatorReferenciaDoc}
                        </p>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm text-slate-800 font-semibold">{redatorData}</span>
                  </div>

                  {/* Destinatário */}
                  <div className="mb-6 font-sans text-xs sm:text-sm">
                    <p className="text-base font-bold text-slate-900 leading-tight">
                      {redatorTipo === 'EMAIL' ? (
                        <span>Para: <span className="text-blue-700 font-semibold">{redatorDestinatario || 'destinatario@rioclaro.rj.gov.br'}</span></span>
                      ) : (
                        redatorDestinatario ? (redatorDestinatario.startsWith('À') || redatorDestinatario.startsWith('Ao') ? redatorDestinatario : `À ${redatorDestinatario}`) : 'À Secretaria Municipal de Saúde'
                      )}
                    </p>
                    {redatorTipo === 'EMAIL' && redatorEmailCc && (
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        <span className="font-bold">Cc:</span> {redatorEmailCc}
                      </p>
                    )}
                    {redatorTipo !== 'EMAIL' && (
                      <p className="text-xs text-slate-700 font-medium leading-tight mt-0.5">
                        Prefeitura Municipal de Rio Claro – RJ
                      </p>
                    )}
                  </div>

                  {/* Assunto / Ementa */}
                  <div className="mb-6 pb-2 border-b border-slate-300 font-sans text-xs sm:text-sm">
                    <span className="font-bold text-slate-900 uppercase">Assunto: </span>
                    <span className="font-semibold text-slate-900">{redatorAssunto || 'Quantitativo de Servidores e Informações de Folha'}</span>
                  </div>

                  {/* Saudação */}
                  <div className="mb-4 font-sans text-xs sm:text-sm font-semibold text-slate-800">
                    {redatorTipo === 'OFICIO' ? 'Senhor(a) Secretário(a),' : 'Prezados,'}
                  </div>

                  {/* Corpo do Documento */}
                  <div
                    className="sgep-rich-doc leading-relaxed mb-10 pl-0"
                    style={{
                      fontFamily: redatorFonte === 'Arial' ? 'Arial, sans-serif' : redatorFonte === 'Calibri' ? 'Calibri, sans-serif' : '"Times New Roman", Times, serif',
                      fontSize: redatorTamanhoFonte === '10pt' ? '12px' : redatorTamanhoFonte === '11pt' ? '13px' : '14px',
                      textAlign: redatorAlinhamento
                    }}
                    dangerouslySetInnerHTML={{
                      __html: converterTextoOficialHTML(redatorTexto, 'print', redatorFonte, redatorTamanhoFonte, redatorAlinhamento)
                    }}
                  />

                  {/* Fecho */}
                  <div className="mb-14 font-sans text-xs sm:text-sm text-slate-800">
                    <p className="font-medium">{redatorFecho}</p>
                  </div>
                </div>
              )}

              {/* Assinatura Oficial Individual ou de Comissão */}
              {renderAssinaturasJSX(true)}
            </div>
          </div>
        </div>
      )}
      {/* MODAL / BOTTOM-SHEET FLUTUANTE: INSPEÇÃO DA PLANILHA GOOGLE SHEETS */}
      {/* ========================================================================= */}
      {isSheetsDrawerOpen && (
        <div 
          id="sheets-inspector-drawer"
          className="no-print fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 transition-all duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSheetsDrawerOpen(false);
          }}
        >
          <div 
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-bottom sm:zoom-in-95 ${
              isSheetsMaximized
                ? 'w-full h-full rounded-none sm:rounded-2xl'
                : 'w-full sm:max-w-5xl md:max-w-6xl h-[92vh] sm:h-[86vh] max-h-[96vh] rounded-t-2xl sm:rounded-2xl'
            }`}
          >
            {/* Barra de Toque e Deslize para Mobile */}
            <div 
              className="sm:hidden pt-2.5 pb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 shrink-0"
              onClick={() => setIsSheetsMaximized(prev => !prev)}
              title="Toque para alternar tamanho"
            >
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mb-1"></div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                <SlidersHorizontal className="w-2.5 h-2.5 text-blue-600" /> Toque ou arraste para {isSheetsMaximized ? 'reduzir' : 'expandir'}
              </span>
            </div>

            {/* Header Flutuante Responsivo */}
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 shrink-0 gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      Planilha Google Sheets
                    </h3>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      ● Ao Vivo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Sincronização em tempo real das abas "Numeração", "Logs", "Modelos" e "Usuários".
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Alternador de Visualização (Cartões vs Tabela) */}
                {activeSheetTab === 'numeracao' && (
                  <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300/60 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setSheetViewMode('cards')}
                      className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        sheetViewMode === 'cards'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Visualização em Cartões (Ideal para celular)"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden md:inline text-[11px]">Cartões</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSheetViewMode('table')}
                      className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        sheetViewMode === 'table'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Visualização em Tabela Completa"
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span className="hidden md:inline text-[11px]">Tabela</span>
                    </button>
                  </div>
                )}

                {/* Botão Maximizar / Restaurar */}
                <button
                  type="button"
                  onClick={() => setIsSheetsMaximized(!isSheetsMaximized)}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex items-center cursor-pointer"
                  title={isSheetsMaximized ? "Restaurar tamanho flutuante" : "Maximizar tela cheia"}
                >
                  {isSheetsMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* Botão Fechar */}
                <button
                  type="button"
                  onClick={() => setIsSheetsDrawerOpen(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Fechar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sheets Tabs - Barra Deslizante Horizontal */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950 px-3 sm:px-4 pt-2 gap-1.5 text-xs overflow-x-auto no-scrollbar scroll-smooth flex-nowrap shrink-0">
              <button
                onClick={() => setActiveSheetTab('numeracao')}
                className={`px-3 py-1.5 rounded-t-lg font-bold border-t border-l border-r whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSheetTab === 'numeracao'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'
                }`}
              >
                <span>Numeração</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                  {numeracoesFiltradas.length}
                </span>
              </button>

              {currentUser?.nivel === 'ADMIN' && (
                <button
                  onClick={() => setActiveSheetTab('logs')}
                  className={`px-3 py-1.5 rounded-t-lg font-bold border-t border-l border-r whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSheetTab === 'logs'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'
                  }`}
                >
                  <span>Logs_Auditoria</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                    {logs.length}
                  </span>
                </button>
              )}

              <button
                onClick={() => setActiveSheetTab('modelos')}
                className={`px-3 py-1.5 rounded-t-lg font-bold border-t border-l border-r whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSheetTab === 'modelos'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 border-slate-200 dark:border-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'
                }`}
              >
                <span>Modelos</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
                  {modelos.length}
                </span>
              </button>

              {currentUser?.nivel === 'ADMIN' && (
                <button
                  onClick={() => setActiveSheetTab('usuarios')}
                  className={`px-3 py-1.5 rounded-t-lg font-bold border-t border-l border-r whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSheetTab === 'usuarios'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'
                  }`}
                >
                  <span>Usuários</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono">
                    {usuarios.length}
                  </span>
                </button>
              )}
            </div>

            {/* Sheets Table Content */}
            <div className="flex-1 overflow-auto p-3 sm:p-4">
              {activeSheetTab === 'numeracao' && (
                <div className="space-y-3">
                  {/* Banner de Confidencialidade e Privacidade por Pasta */}
                  <div className="p-3 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-slate-800 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900/60 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-slate-900 dark:text-slate-100 font-bold">
                            Filtro de Confidencialidade: {activeSecretaria === 'TODAS' ? 'Auditoria Geral Municipal' : activeSecretaria}
                          </strong>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {activeSecretaria === 'TODAS' ? 'ADMIN' : getSecretariaSigla(activeSecretaria, secretarias)}
                          </span>
                          {currentUser && currentUser.nivel !== 'ADMIN' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                              Acesso Docs: {formatAccessibilityFilterLabel(currentUser)}
                            </span>
                          )}
                          {isUserRestrictedToDepartamento(currentUser) && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Depto: {currentUser?.departamento}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          {(() => {
                            if (activeSecretaria === 'TODAS') {
                              return 'Acesso administrativo irrestrito a todas as secretarias e ao acervo histórico da SEAD.';
                            }
                            const eff = getEffectiveAccessibilityFilter(currentUser);
                            if (eff.acessarSecretaria) {
                              return getSecretariaSigla(activeSecretaria, secretarias) === 'SMA'
                                ? 'Acesso autorizado à pasta SMA/SEAD e seu respectivo acervo histórico legado.'
                                : 'Documentos e missivas visíveis em toda a sua Secretaria vinculada. Registros de outras secretarias não são exibidos.';
                            }
                            if (eff.acessarDepartamento && eff.acessarProprios) {
                              return `Isolamento estrito ativo: exibindo documentos da sua Secretaria (${getSecretariaSigla(activeSecretaria, secretarias)}) do seu Departamento (${currentUser?.departamento || 'Lotação'}) ou emitidos por você.`;
                            }
                            if (eff.acessarDepartamento) {
                              return `Filtro departamental ativo: exibindo apenas documentos do Departamento (${currentUser?.departamento || 'Lotação'}) dentro da sua Secretaria.`;
                            }
                            if (eff.acessarProprios) {
                              return 'Filtro individual ativo: exibindo exclusivamente os documentos emitidos pelo próprio servidor na sua Secretaria.';
                            }
                            return 'Consulta ao acervo restrita pelo Administrador (perfil configurado apenas para emissão de documentos).';
                          })()}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-700 shrink-0">
                      {numeracoesFiltradas.length} visíveis
                    </span>
                  </div>

                  {/* Barra de Filtros Departamentais e Busca do Livro */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {/* Campo de Busca por Palavra-chave */}
                      <div className="relative flex-1 sm:min-w-[200px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={filtroLivroTermo}
                          onChange={e => setFiltroLivroTermo(e.target.value)}
                          placeholder="Buscar por número, assunto, servidor..."
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {filtroLivroTermo && (
                          <button
                            onClick={() => setFiltroLivroTermo('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Filtro por Departamento Interno (Coluna H) */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Depto:</span>
                        {isUserRestrictedToDepartamento(currentUser) ? (
                          <span className="font-bold text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1 max-w-[180px] truncate" title={`Escopo bloqueado no departamento: ${currentUser?.departamento}`}>
                            <Lock className="w-3 h-3 shrink-0" />
                            <span className="truncate">{currentUser?.departamento}</span>
                          </span>
                        ) : (
                          <select
                            value={filtroLivroDepartamento}
                            onChange={e => setFiltroLivroDepartamento(e.target.value)}
                            className="bg-transparent font-medium text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1 max-w-[140px] sm:max-w-[180px] truncate"
                          >
                            <option value="TODOS">Todos os Deptos</option>
                            {departamentosDaSecretariaAtiva.map((depto, idx) => (
                              <option key={idx} value={depto}>{depto}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Botão de Alternância 'Meus Documentos' */}
                      {currentUser && (
                        <button
                          type="button"
                          onClick={() => setFiltroLivroApenasMeus(!filtroLivroApenasMeus)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                            filtroLivroApenasMeus
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title="Filtrar apenas os documentos e números oficiais emitidos pela sua matrícula"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Meus Documentos</span>
                        </button>
                      )}

                      {/* Classificação por Data (Crescente / Decrescente) */}
                      <button
                        type="button"
                        onClick={() => setFiltroLivroOrdemData(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-800"
                        title="Alternar classificação por data do documento (Decrescente = mais recentes primeiro | Crescente = mais antigos primeiro)"
                      >
                        {filtroLivroOrdemData === 'desc' ? (
                          <>
                            <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Data: Mais recentes (Decrescente)</span>
                          </>
                        ) : (
                          <>
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Data: Mais antigos (Crescente)</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      {currentUser?.nivel === 'ADMIN' ? (
                        <span>Exibindo <strong>{numeracoesFiltradas.length}</strong> de <strong>{numeracoes.length}</strong></span>
                      ) : (
                        <span>Exibindo <strong>{numeracoesFiltradas.length}</strong> registro(s) no seu escopo</span>
                      )}
                    </div>
                  </div>

                  {/* Barra de Filtros Rápidos em 1 Clique */}
                  <div className="flex flex-wrap items-center gap-1.5 px-1 text-xs">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">Filtros rápidos:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroLivroRapido('TODOS');
                        setFiltroLivroApenasMeus(false);
                        setFiltroLivroTermo('');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        filtroLivroRapido === 'TODOS' && !filtroLivroApenasMeus && !filtroLivroTermo
                          ? 'bg-slate-800 dark:bg-blue-600 text-white border-slate-800 dark:border-blue-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Todos
                    </button>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => setFiltroLivroApenasMeus(prev => !prev)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          filtroLivroApenasMeus
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                        }`}
                      >
                        Meus documentos
                      </button>
                    )}
                    {(
                      [
                        { id: 'HOJE', label: 'Hoje' },
                        { id: 'MES', label: 'Este mês' },
                        { id: 'OFICIO', label: 'Ofícios' },
                        { id: 'MEMORANDO', label: 'Memorandos' }
                      ] as const
                    ).map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFiltroLivroRapido(prev => (prev === item.id ? 'TODOS' : item.id))}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          filtroLivroRapido === item.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Controles Deslizantes de Navegação na Planilha */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Deslizar Colunas:</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSheetHorizontalScroll(0)}
                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          title="Voltar ao início da tabela"
                        >
                          Início
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (sheetsTableContainerRef.current) {
                              sheetsTableContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                            }
                          }}
                          className="p-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Deslizar para a esquerda"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sheetScrollProgress}
                          onChange={(e) => handleSheetHorizontalScroll(Number(e.target.value))}
                          className="w-20 sm:w-28 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          title="Arraste para deslizar horizontalmente"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            if (sheetsTableContainerRef.current) {
                              sheetsTableContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                            }
                          }}
                          className="p-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Deslizar para a direita"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSheetHorizontalScroll(100)}
                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          title="Ir direto para os botões de ação e colunas finais"
                        >
                          Ações
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSheetViewMode(sheetViewMode === 'cards' ? 'table' : 'cards')}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      >
                        {sheetViewMode === 'cards' ? (
                          <>
                            <Table className="w-3.5 h-3.5 text-blue-600" />
                            <span>Mudar para Tabela</span>
                          </>
                        ) : (
                          <>
                            <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                            <span>Mudar para Cartões</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* VISUALIZAÇÃO EM CARTÕES (Ideal para telas pequenas e smartphones) */}
                  {sheetViewMode === 'cards' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                      {numeracoesFiltradas.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-slate-400">
                          <ListOrdered className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="font-medium text-xs">Nenhum documento encontrado para os filtros selecionados.</p>
                        </div>
                      ) : (
                        numeracoesFiltradas.map((n, i) => {
                          const secDoc = n.secretaria || 'Secretaria Municipal de Administração (SMA)';
                          const siglaDoc = getSecretariaSigla(secDoc, secretarias);
                          const deptoDoc = n.departamento || (siglaDoc === 'SMA' ? 'Departamento de Recursos Humanos' : 'Gabinete');
                          const servDoc = n.servidor || n.usuario || 'Servidor Municipal';

                          return (
                            <div key={i} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-xs flex flex-col justify-between gap-3">
                              <div>
                                {/* Header do Card */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    n.tipoDocumento === 'MEMORANDO' ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' :
                                    n.tipoDocumento === 'OFICIO' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                                    n.tipoDocumento === 'DESPACHO' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                                    'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                  }`}>
                                    {n.tipoDocumento}
                                  </span>

                                  <span className="font-mono text-[11px] text-slate-400">
                                    {formatDataHoraExibicao(n.dataHora, true)}
                                  </span>
                                </div>

                                {/* Número Oficial e Assunto */}
                                <div className="mb-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                                      {n.numero}
                                    </h4>
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                      {siglaDoc}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-1 line-clamp-2" title={n.assunto}>
                                    {n.assunto}
                                  </p>
                                </div>

                                {/* Informações de Servidor, Destinatário e Departamento */}
                                <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                                    <span className="text-slate-400">Para:</span>
                                    <span className="font-medium text-emerald-700 dark:text-emerald-400 truncate max-w-[200px]">{n.destinatario}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                                    <span className="text-slate-400">Servidor:</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{servDoc}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 text-slate-500">
                                    <span className="text-slate-400">Depto:</span>
                                    <span className="truncate max-w-[200px] text-slate-500 dark:text-slate-400">{deptoDoc}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Ações do Card */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRedatorTipo((n.tipoDocumento as any) || 'MEMORANDO');
                                    setRedatorNumero(n.numero);
                                    setRedatorDestinatario(n.destinatario || 'Prefeitura Municipal');
                                    setRedatorAssunto(n.assunto || 'Sem Assunto');
                                    setIsRedatorLetterheadOpen(true);
                                    showToast(`Documento ${n.numero} aberto para visualização timbrada e impressão!`);
                                  }}
                                  className="flex-1 py-1.5 px-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  title="Visualizar em papel timbrado oficial da Prefeitura"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Timbrado</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUsarDocumentoComoBase(n)}
                                  className="flex-1 py-1.5 px-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  title="Duplicar dados deste documento no Redator para emitir um novo com numeração sequencial limpa"
                                >
                                  <Files className="w-3.5 h-3.5" />
                                  <span>Usar como base</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const tipoResp = n.tipoDocumento === 'OFICIO' ? 'OFICIO' : 'MEMORANDO';
                                    redatorDraftSkipNextPromptRef.current = true;
                                    setPendingRedatorDraft(null);
                                    setRedatorTipo(tipoResp);
                                    setRedatorReferenciaDoc(`${n.tipoDocumento} nº ${n.numero}`);
                                    setRedatorDestinatario(n.destinatario !== 'Não informado' ? n.destinatario : '');
                                    setRedatorAssunto(`Em resposta ao ${n.tipoDocumento} nº ${n.numero} – ${n.assunto}`);
                                    setRedatorTexto(`Cumprimentando-o cordialmente, sirvo-me do presente para apresentar as manifestações e informações pertinentes em resposta ao ${n.tipoDocumento} nº ${n.numero}, concernente a ${n.assunto}.\n\nInformo que as medidas foram devidamente instruídas, visando à regular continuidade dos serviços públicos desta municipalidade.`);
                                    setRedatorNumero('');
                                    setIsSheetsDrawerOpen(false);
                                    setIsRedatorModalOpen(true);
                                    showToast(`Referência e modelo de resposta ao ${n.numero} carregados no Redator!`);
                                  }}
                                  className="flex-1 py-1.5 px-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  title="Gerar resposta oficial a este documento"
                                >
                                  <Reply className="w-3.5 h-3.5" />
                                  <span>Responder</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    /* VISUALIZAÇÃO EM TABELA COM CONTROLE DE DESLIZE */
                    <div 
                      ref={sheetsTableContainerRef} 
                      onScroll={handleSheetScrollUpdate}
                      className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs scroll-smooth"
                    >
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                          <tr>
                            <th
                              onClick={() => setFiltroLivroOrdemData(prev => prev === 'desc' ? 'asc' : 'desc')}
                              aria-sort={filtroLivroOrdemData === 'asc' ? 'ascending' : 'descending'}
                              title={`Classificar por data do documento (${filtroLivroOrdemData === 'desc' ? 'Decrescente — clique para Crescente' : 'Crescente — clique para Decrescente'})`}
                              className="p-2.5 font-mono text-[11px] whitespace-nowrap cursor-pointer select-none hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <span>A: DataHora</span>
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold border ${
                                  filtroLivroOrdemData === 'desc'
                                    ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                    : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                }`}>
                                  {filtroLivroOrdemData === 'desc' ? (
                                    <>
                                      <ArrowDown className="w-3 h-3" />
                                      <span>Decrescente</span>
                                    </>
                                  ) : (
                                    <>
                                      <ArrowUp className="w-3 h-3" />
                                      <span>Crescente</span>
                                    </>
                                  )}
                                </span>
                              </span>
                            </th>
                            <th className="p-2.5 font-mono text-[11px] whitespace-nowrap">B: TipoDoc</th>
                            <th className="p-2.5 font-mono text-[11px] whitespace-nowrap">C: Número Oficial</th>
                            <th className="p-2.5 font-mono text-[11px] bg-blue-100/40 dark:bg-blue-950/40 min-w-[180px]">D: Assunto</th>
                            <th className="p-2.5 font-mono text-[11px] bg-amber-50/50 dark:bg-amber-950/20 whitespace-nowrap">E: Servidor</th>
                            <th className="p-2.5 font-mono text-[11px] bg-emerald-50/50 dark:bg-emerald-950/20 whitespace-nowrap">F: Destinatário</th>
                            <th className="p-2.5 font-mono text-[11px] whitespace-nowrap">G: Secretaria</th>
                            <th className="p-2.5 font-mono text-[11px] whitespace-nowrap">H: Departamento</th>
                            <th className="p-2.5 font-mono text-[11px] text-center whitespace-nowrap sticky right-0 bg-slate-100 dark:bg-slate-800 shadow-l">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {numeracoesFiltradas.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-slate-400">
                                <ListOrdered className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="font-medium text-xs">Nenhum documento encontrado para os filtros selecionados.</p>
                              </td>
                            </tr>
                          ) : (
                            numeracoesFiltradas.map((n, i) => {
                              const secDoc = n.secretaria || 'Secretaria Municipal de Administração (SMA)';
                              const siglaDoc = getSecretariaSigla(secDoc, secretarias);
                              const deptoDoc = n.departamento || (siglaDoc === 'SMA' ? 'Departamento de Recursos Humanos' : 'Gabinete');
                              const servDoc = n.servidor || n.usuario || 'Servidor Municipal';
                              return (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                  <td className="p-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                    {formatDataHoraExibicao(n.dataHora, true)}
                                  </td>
                                  <td className="p-2.5 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                      n.tipoDocumento === 'MEMORANDO' ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' :
                                      n.tipoDocumento === 'OFICIO' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                                      n.tipoDocumento === 'DESPACHO' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                                      'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                    }`}>
                                      {n.tipoDocumento}
                                    </span>
                                  </td>
                                  <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                    {n.numero}
                                  </td>
                                  <td className="p-2.5 bg-blue-50/20 dark:bg-blue-950/10 max-w-xs truncate" title={n.assunto}>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{n.assunto}</span>
                                  </td>
                                  <td className="p-2.5 bg-amber-50/20 dark:bg-amber-950/10 whitespace-nowrap">
                                    <span className="font-medium text-slate-700 dark:text-slate-300 text-[11.5px]">{servDoc}</span>
                                  </td>
                                  <td className="p-2.5 font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10 max-w-[170px] truncate" title={n.destinatario}>
                                    {n.destinatario}
                                  </td>
                                  <td className="p-2.5 whitespace-nowrap">
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                      {siglaDoc}
                                    </span>
                                  </td>
                                  <td className="p-2.5 whitespace-nowrap">
                                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                                      {deptoDoc}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-center whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 shadow-l">
                                    <div className="flex items-center justify-center space-x-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRedatorTipo((n.tipoDocumento as any) || 'MEMORANDO');
                                          setRedatorNumero(n.numero);
                                          setRedatorDestinatario(n.destinatario || 'Prefeitura Municipal');
                                          setRedatorAssunto(n.assunto || 'Sem Assunto');
                                          setIsRedatorLetterheadOpen(true);
                                          showToast(`Documento ${n.numero} aberto para visualização timbrada e impressão!`);
                                        }}
                                        className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-[10px] font-semibold border border-blue-200 dark:border-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                                        title="Visualizar em papel timbrado oficial da Prefeitura"
                                      >
                                        <Printer className="w-3 h-3" />
                                        <span>Timbrado</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUsarDocumentoComoBase(n)}
                                        className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-semibold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                                        title="Duplicar dados deste documento no Redator para gerar um novo ato com nova numeração"
                                      >
                                        <Files className="w-3 h-3" />
                                        <span>Usar base</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const tipoResp = n.tipoDocumento === 'OFICIO' ? 'OFICIO' : 'MEMORANDO';
                                          redatorDraftSkipNextPromptRef.current = true;
                                          setPendingRedatorDraft(null);
                                          setRedatorTipo(tipoResp);
                                          setRedatorReferenciaDoc(`${n.tipoDocumento} nº ${n.numero}`);
                                          setRedatorDestinatario(n.destinatario !== 'Não informado' ? n.destinatario : '');
                                          setRedatorAssunto(`Em resposta ao ${n.tipoDocumento} nº ${n.numero} – ${n.assunto}`);
                                          setRedatorTexto(`Cumprimentando-o cordialmente, sirvo-me do presente para apresentar as manifestações e informações pertinentes em resposta ao ${n.tipoDocumento} nº ${n.numero}, concernente a ${n.assunto}.\n\nInformo que as medidas foram devidamente instruídas, visando à regular continuidade dos serviços públicos desta municipalidade.`);
                                          setRedatorNumero('');
                                          setIsSheetsDrawerOpen(false);
                                          setIsRedatorModalOpen(true);
                                          showToast(`Referência e modelo de resposta ao ${n.numero} carregados no Redator!`);
                                        }}
                                        className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                                        title="Gerar resposta oficial a este documento"
                                      >
                                        <Reply className="w-3 h-3" />
                                        <span>Responder</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeSheetTab === 'logs' && (
                <div className="space-y-3">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                    <strong>Gravação Dupla de Auditoria:</strong> Toda vez que um número é emitido, a ação é registrada irreversivelmente nesta aba para compliance administrativo.
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700 font-mono text-[11px] whitespace-nowrap">DataHora</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700 font-mono text-[11px] whitespace-nowrap">Usuario</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700 font-mono text-[11px] whitespace-nowrap">Acao</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700 font-mono text-[11px] whitespace-nowrap">DocID/Num</th>
                          <th className="p-2 font-mono text-[11px] min-w-[200px]">Detalhes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {logs.map((l, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2 font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                              {formatDataHoraExibicao(l.dataHora, true)}
                            </td>
                            <td className="p-2 font-medium border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">{l.usuario}</td>
                            <td className="p-2 font-mono text-[11px] font-bold text-emerald-600 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">{l.acao}</td>
                            <td className="p-2 font-mono border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">{l.docId}</td>
                            <td className="p-2 text-slate-600 dark:text-slate-300 text-[11px]">{l.detalhes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSheetTab === 'modelos' && (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="p-2 font-mono text-[11px]">ID</th>
                        <th className="p-2 whitespace-nowrap">Tipo</th>
                        <th className="p-2 whitespace-nowrap">Categoria</th>
                        <th className="p-2 min-w-[180px]">Titulo</th>
                        <th className="p-2 whitespace-nowrap">Ativo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {modelos.map(m => (
                        <tr key={m.ID} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{m.ID}</td>
                          <td className="p-2 whitespace-nowrap">{m.TipoDocumento}</td>
                          <td className="p-2 whitespace-nowrap">{m.Categoria}</td>
                          <td className="p-2 font-medium">{m.Titulo}</td>
                          <td className="p-2 text-emerald-600 font-bold whitespace-nowrap">TRUE</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeSheetTab === 'usuarios' && (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="p-2 font-mono text-[11px] whitespace-nowrap">Matricula</th>
                        <th className="p-2 whitespace-nowrap">Nome</th>
                        <th className="p-2 whitespace-nowrap">NivelAcesso</th>
                        <th className="p-2 whitespace-nowrap">Ativo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {usuarios.map(u => (
                        <tr key={u.matricula} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2 font-mono font-bold whitespace-nowrap">{u.matricula}</td>
                          <td className="p-2 font-medium whitespace-nowrap">{u.nome}</td>
                          <td className="p-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.nivel === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {u.nivel}
                            </span>
                          </td>
                          <td className="p-2 text-emerald-600 font-bold whitespace-nowrap">TRUE</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Painel Administrativo de Servidores, Senhas, Secretarias e Departamentos */}
      {currentUser && currentUser.nivel === 'ADMIN' && (
        <AdminManagementModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          currentUser={currentUser}
          usuarios={usuarios}
          onSaveUsuario={handleSaveUsuario}
          onToggleStatusUsuario={handleToggleStatusUsuario}
          secretarias={secretarias}
          onSaveSecretaria={handleSaveSecretaria}
          realApiUrl={realApiUrl}
          useRealApi={useRealApi}
          showToast={showToast}
          pedidosRecuperacao={pedidosRecuperacao}
          onAprovarPedidoRecuperacao={handleAprovarPedidoRecuperacao}
          onCancelarPedidoRecuperacao={handleCancelarPedidoRecuperacao}
        />
      )}

      {/* Modal 4: Guia de Orientações & Ajuda ao Servidor */}
      <GuiaAjudaModal
        isOpen={isGuiaAjudaOpen}
        onClose={() => setIsGuiaAjudaOpen(false)}
        onReiniciarDicas={() => (window as any).reiniciarDicas?.()}
        isLoggedIn={!!currentUser}
      />

      {/* Modal 5: Recuperação de Senha Esquecida & Cadastro Inicial de Servidor */}
      <RecuperarSenhaModal
        isOpen={isRecuperarSenhaOpen}
        onClose={() => setIsRecuperarSenhaOpen(false)}
        initialMatricula={loginMatricula}
        usuarios={usuarios}
        secretarias={secretarias}
        pedidosRecuperacao={pedidosRecuperacao}
        onCriarPedidoRecuperacao={handleCriarPedidoRecuperacao}
        onCadastrarServidor={async (novoServidor, senhaInicial) => {
          return await handleSaveUsuario(novoServidor, senhaInicial);
        }}
        onShowToast={showToast}
        onSuccessCadastro={(matricula) => {
          setLoginMatricula(matricula);
          showToast(`Matrícula ${matricula} pronta para login!`);
        }}
      />

      {/* Modal 6: Seletor Responsivo de Tema, Paleta de Cores e Formulários */}
      <ThemeSettingsModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        themeMode={themeMode}
        themePalette={themePalette}
        formStyle={formStyle}
        isDarkMode={isDarkMode}
        systemPrefersDark={systemPrefersDark}
        onChangeMode={setThemeMode}
        onChangePalette={setThemePalette}
        onChangeFormStyle={setFormStyle}
        onResetDefaults={() => {
          setThemeMode(DEFAULT_THEME_PREFS.mode);
          setThemePalette(DEFAULT_THEME_PREFS.palette);
          setFormStyle(DEFAULT_THEME_PREFS.formStyle);
        }}
      />

      {/* Modal 7: Central de Importação e Catalogação Inteligente (PDF / DOCX) */}
      <ImportarCatalogarModal
        isOpen={isImportCatalogModalOpen}
        onClose={() => setIsImportCatalogModalOpen(false)}
        categoriasExistentes={categories}
        secretariasDisponiveis={listaSecretariasDoUsuario.length > 0 ? listaSecretariasDoUsuario : secretarias.map(s => `${s.nome} (${s.sigla})`)}
        secretariaPadrao={activeSecretaria}
        canCatalogModelo={currentUser?.nivel === 'ADMIN' || currentUser?.nivel === 'EDITOR'}
        onCatalogarComoModelo={handleCatalogarModeloImportado}
        onRegistrarNoLivro={handleRegistrarLivroImportado}
        onAbrirNoRedator={handleAbrirImportadoNoRedator}
        showToast={showToast}
      />

      {/* Sistema de Dicas Flutuantes Contextuais SGEP */}
      <FloatingTips
        currentUserMatricula={currentUser?.matricula}
        onShowToast={showToast}
      />

      {/* Global Toast */}
      {toastMessage && (
        <div id="toast" role="status" className={`no-print fixed bottom-6 right-6 z-[120] max-w-sm bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border flex items-center space-x-3 pointer-events-none transition-all duration-300 animate-in slide-in-from-bottom-5 ${
          toastMessage.isError ? 'border-rose-500' : 'border-emerald-500'
        }`}>
          <div className={toastMessage.isError ? 'text-rose-400 text-lg' : 'text-emerald-400 text-lg'}>
            {toastMessage.isError ? <AlertTriangle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">{toastMessage.title}</p>
            <p className="text-xs font-medium text-slate-100 mt-0.5">{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* Indicador de Conexão Offline */}
      <OfflineIndicator />
    </div>
  );
}
