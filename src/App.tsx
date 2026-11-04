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
  getSecretariaSigla,
  isRecordFromSecretaria,
  isUserAuthorizedForSecretaria,
  canUserViewLegacyAdminRecords,
  getNextSequentialForSecretaria
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
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Quote,
  Minus,
  Eraser,
  Undo2,
  Redo2,
  Type
} from 'lucide-react';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { BRASAO_RIO_CLARO } from './brasaoBase64';

export default function App() {
  // Navigation tabs between the Live Interactive System and the Architecture & Source Code Hub
  const [activeTab, setActiveTab] = useState<'app' | 'codigo-html' | 'codigo-gas' | 'planilha' | 'guia'>('app');
  const [showDevHub, setShowDevHub] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // System States (Simulation / Hybrid)
  const [useRealApi, setUseRealApi] = useState(true);
  const [realApiUrl, setRealApiUrl] = useState(() => {
    const saved = localStorage.getItem('bm_api_url');
    if (
      saved &&
      !saved.includes('AKfycbws_QQlzKhVKwzwDC7wuBrs_XxN-xsrSv5jynG1jrFQHLsz1tTANmBCteUdAUf3-PnQCw') &&
      !saved.includes('AKfycbwehV822FkXxgNa_rVRVN7QDkheWxzX6kXvyCZhVyBof3-d2jfNC8kzPvviLmTbd7cN') &&
      !saved.includes('AKfycbxnUGkilPqDhV2VGKvJApRBufUEEmpLBggw8htG-bCLcH8qRcnGJgnjbm26giy1w7Y9') &&
      !saved.includes('AKfycbx-LzKlN_O7NpNf52bVTO1740Srrrd3bO8a3Xpa1vxsu2_ZL6LcppT4EJmsOeYK_c238A') &&
      !saved.includes('AKfycbxOJHeSV8LAWpaIrsP657v7G0mNrqSdF-8rWwHZ73mUHlsmtvsnLBIUxPprmrvXogEG2g') &&
      !saved.includes('AKfycbxzOzIlowNAzC2V4q1wSXaPuQ_CprYiEhOVm1pl629hc964mZO7gea12p1jn7woMAyXIw')
    ) {
      return saved;
    }
    return 'https://script.google.com/macros/s/AKfycbysxJ3UUAP57KcFiXfgEmCWqcXw90rghpF4txRH44mpfELv68c4_N1VRshcJ5MFm5fP0g/exec';
  });
  
  // Data states
  const [modelos, setModelos] = useState<ModeloDocumental[]>(() => {
    const saved = localStorage.getItem('bm_modelos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 80) return parsed;
      } catch (e) {}
    }
    return INITIAL_MODELOS;
  });
  
  const [numeracoes, setNumeracoes] = useState<RegistroNumeracao[]>(() => {
    const saved = localStorage.getItem('bm_numeracoes');
    return saved ? JSON.parse(saved) : INITIAL_NUMERACOES;
  });

  const [logs, setLogs] = useState<RegistroLog[]>(() => {
    const saved = localStorage.getItem('bm_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [sugestoes, setSugestoes] = useState<{ destinatarios: string[]; assuntos: string[] }>(() => {
    const saved = localStorage.getItem('bm_sugestoes');
    return saved ? JSON.parse(saved) : INITIAL_SUGESTOES;
  });

  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>(() => {
    const saved = localStorage.getItem('bm_usuarios');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [currentUser, setCurrentUser] = useState<UsuarioSistema | null>(() => {
    const saved = localStorage.getItem('sgep_user_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [favoritos, setFavoritos] = useState<string[]>(() => {
    const saved = localStorage.getItem('favs');
    return saved ? JSON.parse(saved) : ['MOD-001', 'MOD-002'];
  });

  // UI Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('TODOS');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modals
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [activeModelo, setActiveModelo] = useState<ModeloDocumental | null>(null);
  const [formVariables, setFormVariables] = useState<Record<string, string>>({});
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);

  // CRUD Modal
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<Partial<ModeloDocumental>>({});

  // Sheets Inspector Drawer Modal
  const [isSheetsDrawerOpen, setIsSheetsDrawerOpen] = useState(false);
  const [activeSheetTab, setActiveSheetTab] = useState<'numeracao' | 'logs' | 'modelos' | 'usuarios'>('numeracao');

  // Painel de Gestão do Administrador (Servidores, Senhas, Secretarias e Departamentos)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [secretarias, setSecretarias] = useState<SecretariaItem[]>(() => {
    const saved = localStorage.getItem('bm_secretarias');
    return saved ? JSON.parse(saved) : INITIAL_SECRETARIAS;
  });

  // Preferência do usuário para incluir a sigla da secretaria no número (ex: 001/2026 - SMA)
  const [incluirSiglaNoNumero, setIncluirSiglaNoNumero] = useState<boolean>(() => {
    return localStorage.getItem('bm_incluir_sigla') !== 'false';
  });

  // Secretaria Ativa de Atuação do Servidor (Suporte a Acúmulo de Pastas & Confidencialidade)
  const [activeSecretaria, setActiveSecretaria] = useState<string>(() => {
    const saved = localStorage.getItem('bm_active_secretaria');
    if (saved) return saved;
    const userSession = localStorage.getItem('sgep_user_session');
    if (userSession) {
      try {
        const u = JSON.parse(userSession);
        if (u.secretaria) return u.secretaria;
        if (u.secretarias && u.secretarias.length > 0) return u.secretarias[0];
      } catch (e) {}
    }
    return 'Secretaria Municipal de Administração (SMA)';
  });

  // Alteração de Senha Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Redator de Memorando / Ofício / E-mail / Portaria / Decreto Modal State
  const [isRedatorModalOpen, setIsRedatorModalOpen] = useState(false);
  const [redatorTipo, setRedatorTipo] = useState<'MEMORANDO' | 'OFICIO' | 'DESPACHO' | 'CIRCULAR' | 'PORTARIA' | 'DECRETO' | 'EMAIL'>('MEMORANDO');
  const [redatorNumero, setRedatorNumero] = useState('');
  const [redatorEmailCc, setRedatorEmailCc] = useState('');
  const [isLoadingFromGas, setIsLoadingFromGas] = useState(false);
  const [redatorData, setRedatorData] = useState(() => {
    const hoje = new Date();
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return `Rio Claro-RJ, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
  });
  const [redatorSetorOrigem, setRedatorSetorOrigem] = useState('Departamento de Recursos Humanos');
  const [redatorDestinatario, setRedatorDestinatario] = useState('Secretaria Municipal de Saúde');
  const [redatorTratamento, setRedatorTratamento] = useState('À / Ao');
  const [redatorAssunto, setRedatorAssunto] = useState('Quantitativo de Servidores e Informações de Folha');
  const [redatorReferenciaDoc, setRedatorReferenciaDoc] = useState('');
  const [redatorTexto, setRedatorTexto] = useState(
    'Cumprimentando-o cordialmente, sirvo-me do presente para encaminhar a Vossa Senhoria as informações e levantamentos administrativos pertinentes a este departamento, em atendimento às diretrizes institucionais vigentes.\n\nInformo que as medidas foram devidamente instruídas no âmbito da Divisão de Treinamento e Desenvolvimento, visando a assegurar a máxima celeridade e transparência aos atos da gestão de pessoal desta municipalidade.'
  );
  const [redatorFecho, setRedatorFecho] = useState('Permanecemos à disposição para eventuais esclarecimentos adicionais.');
  const [redatorSignatario, setRedatorSignatario] = useState('Augusto Lourenço da Silva Júnior');
  const [redatorCargo, setRedatorCargo] = useState('Chefe de Divisão de Treinamento e Desenvolvimento de Recursos Humanos');
  const [redatorSecretaria, setRedatorSecretaria] = useState('Secretaria Municipal de Administração (SMA)');
  const [redatorMatricula, setRedatorMatricula] = useState(currentUser?.matricula || '1001');
  const [isRedatorGeneratingNumber, setIsRedatorGeneratingNumber] = useState(false);
  const [isRedatorLetterheadOpen, setIsRedatorLetterheadOpen] = useState(false);
  
  // Estado do Assistente de Redação com IA (Gemini)
  const [isAiHelperOpen, setIsAiHelperOpen] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isGeneratingAiText, setIsGeneratingAiText] = useState(false);
  const [textoAnteriorRedator, setTextoAnteriorRedator] = useState<string | null>(null);

  // Estados e Referências da Barra de Ferramentas de Edição Oficial
  const [redatorFonte, setRedatorFonte] = useState<'Times New Roman' | 'Arial' | 'Calibri'>('Times New Roman');
  const [redatorTamanhoFonte, setRedatorTamanhoFonte] = useState<'12pt' | '11pt' | '10pt'>('12pt');
  const [redatorAlinhamento, setRedatorAlinhamento] = useState<'justify' | 'left' | 'center'>('justify');
  const redatorTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [redatorHistoricoUndo, setRedatorHistoricoUndo] = useState<string[]>([]);
  const [redatorHistoricoRedo, setRedatorHistoricoRedo] = useState<string[]>([]);

  // Helper para prefixo oficial de documento (ex: MEMO RH 710/2026, OFÍCIO RH 710/2026, PORTARIA Nº 015/2026 ou DECRETO Nº 089/2026)
  const getDocumentoPrefixo = (tipo: string, num: string) => {
    const anoAtual = new Date().getFullYear();
    const numLimpo = num ? num : `____/${anoAtual}`;
    if (tipo === 'DECRETO') return `DECRETO Nº ${numLimpo}`;
    if (tipo === 'PORTARIA') return `PORTARIA Nº ${numLimpo}`;
    if (tipo === 'MEMORANDO') return `MEMO RH ${numLimpo}`;
    if (tipo === 'OFICIO') return `OFÍCIO RH ${numLimpo}`;
    return `${tipo} RH ${numLimpo}`;
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

    // Da aba Numeração (histórico real)
    numeracoes.forEach(n => {
      if (n.destinatario && n.destinatario.trim() && n.destinatario !== 'Não informado') {
        set.add(n.destinatario.trim());
      }
    });

    // Das sugestões ativas
    sugestoes.destinatarios.forEach(d => {
      if (d && d.trim()) set.add(d.trim());
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [modelos, numeracoes, sugestoes.destinatarios]);

  // Lista consolidada de Assuntos / Ementas da base de 86 modelos e histórico
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

    // Aba Numeração
    numeracoes.forEach(n => {
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
  }, [modelos, numeracoes]);

  // Lista consolidada de Signatários / Autoridades / Servidores da base
  const listaSignatariosBase = useMemo(() => {
    const map = new Map<string, { nome: string; cargo: string; departamento: string; secretaria: string; matricula: string }>();

    usuarios.forEach(u => {
      map.set(u.matricula, {
        nome: u.nome,
        cargo: u.cargo || (u.nivel === 'ADMIN' ? 'Chefe de Divisão / Gestor' : 'Servidor Municipal'),
        departamento: u.departamento || 'Departamento de Recursos Humanos',
        secretaria: u.secretaria || 'Secretaria Municipal de Administração (SMA)',
        matricula: u.matricula
      });
    });

    return Array.from(map.values());
  }, [usuarios]);

  // Lista consolidada de Secretarias e Órgãos de Lotação Municipais para o Combo
  const listaSecretariasBase = useMemo(() => {
    const set = new Set<string>(SECRETARIAS_MUNICIPAIS_BASE);
    usuarios.forEach(u => {
      if (u.secretaria && u.secretaria.trim()) set.add(u.secretaria.trim());
      (u.secretarias || []).forEach(s => {
        if (s && s.trim()) set.add(s.trim());
      });
    });
    secretarias.forEach(s => {
      set.add(`${s.nome} (${s.sigla})`);
    });
    return Array.from(set);
  }, [usuarios, secretarias]);

  // Lista de Secretarias autorizadas para o usuário logado (Suporte a Acúmulo de Pastas)
  const listaSecretariasDoUsuario = useMemo(() => {
    if (!currentUser) return ['Secretaria Municipal de Administração (SMA)'];
    if (currentUser.nivel === 'ADMIN') {
      // O Administrador tem acesso irrestrito para transitar e emitir por qualquer pasta
      return secretarias.map(s => `${s.nome} (${s.sigla})`);
    }
    const secs = [
      currentUser.secretaria,
      ...(currentUser.secretarias || [])
    ].filter(Boolean) as string[];
    const unique = Array.from(new Set(secs));
    return unique.length > 0 ? unique : ['Secretaria Municipal de Administração (SMA)'];
  }, [currentUser, secretarias]);

  // Filtros adicionais do Livro de Numeração (Departamento, Meus Documentos e Termo de Busca)
  const [filtroLivroDepartamento, setFiltroLivroDepartamento] = useState<string>('TODOS');
  const [filtroLivroApenasMeus, setFiltroLivroApenasMeus] = useState<boolean>(false);
  const [filtroLivroTermo, setFiltroLivroTermo] = useState<string>('');

  // Lista dinâmica de departamentos disponíveis para a Secretaria Ativa
  const departamentosDaSecretariaAtiva = useMemo(() => {
    const secObj = secretarias.find(s => s.nome === activeSecretaria || s.sigla === activeSecretaria);
    const listaDeptos = secObj?.departamentos ? [...secObj.departamentos] : [];

    numeracoes.forEach(n => {
      if (n.departamento && n.departamento.trim() && !listaDeptos.includes(n.departamento.trim())) {
        if (activeSecretaria === 'TODAS' || isRecordFromSecretaria(n.secretaria, activeSecretaria)) {
          listaDeptos.push(n.departamento.trim());
        }
      }
    });
    return listaDeptos.sort();
  }, [secretarias, activeSecretaria, numeracoes]);

  // Regra de Negócio de Confidencialidade e Privacidade por Secretaria & Filtros Departamentais:
  // - Servidores vinculados à Secretaria de Administração e ADMIN têm acesso total ao acervo de 841 legados.
  // - Servidores de outras Secretarias (Saúde, Educação, Fazenda, etc.) visualizam estritamente os documentos da sua pasta ativa.
  const numeracoesFiltradas = useMemo(() => {
    return numeracoes.filter(n => {
      // 1. Confidencialidade e Isolamento de Pasta
      let passaSecretaria = false;
      if (currentUser?.nivel === 'ADMIN' && activeSecretaria === 'TODAS') {
        passaSecretaria = true;
      } else {
        const isSEAD = activeSecretaria.toLowerCase().includes('administra') || 
                       activeSecretaria.toLowerCase().includes('sma') || 
                       activeSecretaria.toLowerCase().includes('sead');

        if (isSEAD) {
          // Na Secretaria de Administração: vê os 841 legados (sem secretaria preenchida) + registros explícitos da SEAD
          passaSecretaria = isRecordFromSecretaria(n.secretaria, activeSecretaria);
        } else {
          // Em outras Secretarias: confidencialidade estrita!
          // Registros legados (onde n.secretaria é vazio) NUNCA aparecem para pastas não autorizadas.
          if (!n.secretaria || !n.secretaria.trim()) {
            passaSecretaria = false;
          } else {
            passaSecretaria = isRecordFromSecretaria(n.secretaria, activeSecretaria);
          }
        }
      }
      if (!passaSecretaria) return false;

      // 2. Filtro por Departamento
      if (filtroLivroDepartamento !== 'TODOS') {
        const deptoDoc = n.departamento || (n.secretaria?.toLowerCase().includes('administra') ? 'Administração Geral' : 'Geral');
        if (deptoDoc.toLowerCase() !== filtroLivroDepartamento.toLowerCase()) {
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

      // 4. Busca por Termo (Número, Assunto, Destinatário, Servidor, Departamento)
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
    });
  }, [numeracoes, activeSecretaria, currentUser, filtroLivroDepartamento, filtroLivroApenasMeus, filtroLivroTermo]);

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

  // Sincronização do Modo Escuro com <html> e <body>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

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

  const showToast = (text: string, title = 'Sucesso', isError = false) => {
    setToastMessage({ text, title, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Login handler com integração real ao GAS e detalhamento de erros
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
          const response = await fetch(realApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'LOGIN', matricula: mat, senha: sen })
          });
          const textResp = await response.text();
          result = JSON.parse(textResp);
        } catch (postErr) {
          console.warn('Tentativa POST de login falhou. Tentando fallback GET:', postErr);
          postFailed = true;
        }

        if (postFailed || (!result && postFailed)) {
          try {
            const getUrl = `${realApiUrl}?action=LOGIN&matricula=${encodeURIComponent(mat)}&senha=${encodeURIComponent(sen)}&t=${Date.now()}`;
            const getResp = await fetch(getUrl);
            const getText = await getResp.text();
            result = JSON.parse(getText);
          } catch (getErr) {
            console.error('Tentativa GET de login também falhou:', getErr);
          }
        }
      }

      if (result && result.success && result.usuario) {
        const authUser: UsuarioSistema = {
          id: result.usuario.id,
          nome: result.usuario.nome,
          matricula: result.usuario.matricula,
          nivel: (result.usuario.nivel as any) || 'PADRAO',
          secretaria: result.usuario.secretaria || 'SMA',
          cargo: result.usuario.cargo || '',
          departamento: result.usuario.local || result.usuario.departamento || '',
          ativo: true,
          senha: sen,
          token: result.usuario.token
        };
        setCurrentUser(authUser);
        localStorage.setItem('sgep_user_session', JSON.stringify(authUser));
        handleSyncData(result.usuario.token);
        showToast(`Bem-vindo(a), ${authUser.nome}!`);
        setIsLoggingIn(false);
        return;
      }

      if (result && result.error) {
        setLoginError(result.error);
        setIsLoggingIn(false);
        return;
      }

      // Fallback para usuários em cache/estado local caso o servidor esteja inacessível
      const matFound = usuarios.find(u => u.matricula.trim().toLowerCase() === mat.toLowerCase());
      if (matFound) {
        if (!matFound.ativo) {
          setLoginError(`A matrícula ${mat} está desativada no sistema municipal.`);
          setIsLoggingIn(false);
          return;
        }
        if (matFound.senha === sen) {
          setCurrentUser(matFound);
          localStorage.setItem('sgep_user_session', JSON.stringify(matFound));
          showToast(`Bem-vindo(a), ${matFound.nome}!`);
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
    setCurrentUser(null);
    setShowDevHub(false);
    setActiveTab('app');
    setLoginMatricula('');
    setLoginSenha('');
    showToast('Sessão encerrada com segurança.', 'Até logo');
  };

  // Sync data com suporte ao Backend API v4.0 (Token) e fallback retroativo
  const handleSyncData = async (tokenOverride?: string) => {
    setIsLoadingFromGas(true);
    if (useRealApi) {
      try {
        const token = tokenOverride || currentUser?.token || '';
        showToast('Consultando Web App do Google Apps Script...', 'Sincronizando');

        let json: any = null;
        // 1ª Tentativa: POST com action CARREGAR e token (Padrão Backend v4.0)
        try {
          const res = await fetch(realApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'CARREGAR', token })
          });
          const text = await res.text();
          json = JSON.parse(text);
        } catch (postErr) {
          console.warn('Tentativa POST de carga falhou, tentando fallback GET:', postErr);
        }

        // 2ª Tentativa: GET com token ou compatibilidade retroativa
        if (!json || (!json.data && !json.error)) {
          const res = await fetch(`${realApiUrl}?action=CARREGAR&token=${encodeURIComponent(token)}&t=${Date.now()}`);
          json = await res.json();
        }

        if (json && json.success) {
          if (json.data && Array.isArray(json.data)) setModelos(json.data);
          if (json.sugestoes) {
            setSugestoes({
              destinatarios: json.sugestoes.destinatarios || [],
              assuntos: json.sugestoes.assuntos || []
            });
          }
          if (json.registrosNumeracao && Array.isArray(json.registrosNumeracao)) {
            setNumeracoes(json.registrosNumeracao);
          }
          showToast('Modelos e histórico de numeração sincronizados com a planilha oficial!');
        } else if (json && json.authRequired) {
          showToast('Sua sessão expirou. Por favor, faça login novamente.', 'Sessão Expirada', true);
          handleLogout();
        } else if (json && json.error) {
          showToast(json.error, 'Erro', true);
        }
      } catch (err: any) {
        showToast(`Falha de conexão com GAS: ${err.message}`, 'Erro', true);
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
        showToast('Banco de dados e sugestões atualizados!');
      } finally {
        setIsLoadingFromGas(false);
      }
    }
  };

  // -----------------------------------------------------------------
  // MÓDULO: ALTERAÇÃO DE SENHA DO USUÁRIO
  // -----------------------------------------------------------------
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentUser) {
      setPasswordError('Nenhum usuário logado na sessão.');
      return;
    }
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setPasswordError('A nova senha deve possuir pelo menos 6 caracteres.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('A confirmação não coincide com a nova senha digitada.');
      return;
    }

    setIsChangingPassword(true);

    if (useRealApi) {
      try {
        const response = await fetch(realApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'ALTERAR_SENHA',
            token: currentUser.token || '',
            matricula: currentUser.matricula,
            senhaAtual: currentPasswordInput,
            novaSenha: newPasswordInput
          })
        });
        const textResp = await response.text();
        const json = JSON.parse(textResp);
        if (json.success) {
          showToast('Sua senha foi alterada com sucesso no Google Sheets!');
          setIsPasswordModalOpen(false);
          setCurrentPasswordInput('');
          setNewPasswordInput('');
          setConfirmPasswordInput('');
        } else {
          setPasswordError(json.error || 'Erro ao alterar senha no servidor.');
        }
      } catch (err: any) {
        setPasswordError(`Erro de comunicação com o servidor: ${err.message}`);
      } finally {
        setIsChangingPassword(false);
      }
      return;
    }

    // Simulação Local
    setTimeout(() => {
      // Confere senha atual se foi digitada
      if (currentPasswordInput && currentUser.senha && currentPasswordInput !== currentUser.senha) {
        setPasswordError('A senha atual informada está incorreta.');
        setIsChangingPassword(false);
        return;
      }

      // Atualiza na lista de usuários
      const updatedUsers = usuarios.map(u => {
        if (u.matricula === currentUser.matricula) {
          return { ...u, senha: newPasswordInput };
        }
        return u;
      });
      setUsuarios(updatedUsers);
      localStorage.setItem('bm_usuarios', JSON.stringify(updatedUsers));

      // Atualiza usuário atual
      const updatedCurrent = { ...currentUser, senha: newPasswordInput };
      setCurrentUser(updatedCurrent);
      localStorage.setItem('sgep_user_session', JSON.stringify(updatedCurrent));

      // Registra em logs de auditoria
      const newLog: RegistroLog = {
        dataHora: new Date().toISOString(),
        usuario: currentUser.nome,
        acao: 'ALTERAR_SENHA',
        docId: currentUser.matricula,
        detalhes: 'Senha de acesso alterada pelo próprio usuário'
      };
      setLogs(prev => [newLog, ...prev]);

      showToast('Senha alterada com sucesso! Utilize-a nos próximos acessos.');
      setIsPasswordModalOpen(false);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setIsChangingPassword(false);
    }, 400);
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
    const deptoAlvo = currentUser?.departamento || (activeSecretaria.toLowerCase().includes('administra') ? 'Departamento de Recursos Humanos' : 'Gabinete');
    const secAlvo = activeSecretaria && activeSecretaria !== 'TODAS' ? activeSecretaria : (redatorSecretaria || 'Secretaria Municipal de Administração (SMA)');
    const siglaAlvo = getSecretariaSigla(secAlvo, secretarias);

    if (useRealApi) {
      try {
        const response = await fetch(realApiUrl, {
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
        });
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
            secretaria: secAlvo,
            departamento: deptoAlvo,
            incluirSigla: incluirSiglaNoNumero
          };
          setNumeracoes(prev => [novoReg, ...prev]);
        } else {
          showToast(json.error || 'Erro ao gerar número', 'Erro', true);
        }
      } catch (err: any) {
        showToast(`Erro na API: ${err.message}`, 'Erro', true);
      } finally {
        setIsRedatorGeneratingNumber(false);
      }
      return;
    }

    // Simulação local com cálculo por secretaria independente
    setTimeout(() => {
      const proximoSeq = getNextSequentialForSecretaria(numeracoes, tipoDoc, secAlvo, anoAtual);
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

      showToast(`Número oficial ${nextNum} gerado com sucesso para ${secAlvo}!`);
      setIsRedatorGeneratingNumber(false);
    }, 450);
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
      const response = await fetch('/api/ai/gerar-redacao', {
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
      });

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

  const handleCarregarModeloNoRedator = (modeloId: string) => {
    const mod = modelos.find(m => m.ID === modeloId);
    if (!mod) return;
    setRedatorTexto(mod.Texto);
    if (mod.Assunto) setRedatorAssunto(mod.Assunto);
    if (mod.SetorDestino) setRedatorDestinatario(mod.SetorDestino);
    if (mod.TipoDocumento === 'OFICIO' || mod.TipoDocumento === 'MEMORANDO') {
      setRedatorTipo(mod.TipoDocumento as any);
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
      novoTexto = val.substring(0, start) + limpar(sel) + val.substring(end);
    } else {
      novoTexto = limpar(val);
    }
    salvarHistorico(novoTexto);
    showToast('Formatação removida.');
  };

  // Conversor Universal de Formatação Oficial para HTML (Prévia, Word e Impressão)
  const converterTextoOficialHTML = (
    texto: string,
    modo: 'preview' | 'word' | 'print' = 'preview',
    fonte: 'Times New Roman' | 'Arial' | 'Calibri' = redatorFonte,
    tamanho: '12pt' | '11pt' | '10pt' = redatorTamanhoFonte,
    alinhamento: 'justify' | 'left' | 'center' = redatorAlinhamento
  ) => {
    if (!texto) return '';

    let seguro = texto
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
        if (modo === 'word') {
          htmlFinal += `<p style="margin: 0 0 10pt 0; text-align: ${alinhamento}; text-indent: 1.25cm; line-height: 1.5; font-size: ${tamanho}; mso-line-height-rule: exactly;">${conteudo}</p>`;
        } else {
          htmlFinal += `<p class="mb-3 leading-relaxed" style="text-align: ${alinhamento}; text-indent: 1.25cm; font-size: ${tamanho};">${conteudo}</p>`;
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
      const l = linhas[i].trim();
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

      // Incisos romanos ou alíneas
      const incisoMatch = l.match(/^([IVXLCDM]+|[a-z]\))\s*[-–]?\s*(.*)/);
      if (incisoMatch && (l.includes('-') || l.includes(')') || l.startsWith('Art.') || l.startsWith('Parágrafo'))) {
        fecharP();
        fecharListas();
        htmlFinal += modo === 'word'
          ? `<p style="margin: 0 0 6pt 1.5cm; text-indent: -0.6cm; text-align: ${alinhamento}; line-height: 1.4; font-size: ${tamanho};">${l}</p>`
          : `<p class="my-1.5" style="padding-left: 1.5rem; text-indent: -0.8rem; text-align: ${alinhamento}; font-size: ${tamanho}; line-height: 1.5;">${l}</p>`;
        continue;
      }

      // Parágrafo comum
      fecharListas();
      paragrafoAtual.push(l);
    }

    fecharP();
    fecharListas();

    return htmlFinal;
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
  margin: 2.5cm 2cm 2cm 2.5cm;
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
  text-align: ${textAlignDocx};
  text-indent: 1.25cm;
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

<div class="sig-block" style="margin-top: 36pt; text-align: center; text-indent: 0; page-break-inside: avoid;">
  <div class="sig-line" style="width: 240pt; border-top: 1pt solid #000000; margin: 0 auto 6pt auto;"></div>
  <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 11pt; color: #000000;">${sig}</div>
  <div style="font-family: Arial, sans-serif; font-style: italic; font-size: 9.5pt; color: #333333;">${cargo}</div>
  <div style="font-family: Arial, sans-serif; font-size: 9pt; color: #002b82; font-weight: bold;">${sec}</div>
  <div style="font-family: Arial, sans-serif; font-size: 8.5pt; color: #666666;">Prefeitura Municipal de Rio Claro – RJ</div>
</div>

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
    const cleanDocName = `${redatorTipo}_${(redatorNumero || 'minuta').replace(/[^a-zA-Z0-9_-]/g, '_')}_RioClaro.doc`;
    a.download = cleanDocName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 250);
    showToast(`Documento ${cleanDocName} exportado para Word com Brasão oficial!`);
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

  // Exportação oficial para PDF (utiliza html2pdf.js com clone A4 de 794px, normalização oklch, quebra inteligente e PNG nítido)
  const handleBaixarPdfRedator = async () => {
    const cleanDocName = `${redatorTipo}_${(redatorNumero || 'minuta').replace(/[^a-zA-Z0-9_-]/g, '_')}_RioClaro.pdf`;
    setIsRedatorLetterheadOpen(true);

    // 1. Espera o carregamento de fontes do documento com timeout de segurança de 2s
    try {
      await Promise.race([
        document.fonts ? document.fonts.ready : Promise.resolve(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
    } catch {
      // prossegue mesmo se a API de fontes falhar
    }
    // Breve pausa para estabilização de layout
    await new Promise(resolve => setTimeout(resolve, 50));

    // 2. Localiza o elemento original no modal timbrado
    const elementoOrig = document.getElementById('print-area-content') || (document.querySelector('.print-area-container') as HTMLElement | null);
    if (!elementoOrig) {
      showToast('Erro: área de impressão não localizada.', 'Erro', true);
      return;
    }

    // 3. Garante o motor html2pdf disponível no escopo global
    let html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      try {
        await new Promise((resolve) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          s.onload = resolve;
          s.onerror = resolve;
          document.head.appendChild(s);
        });
        html2pdf = (window as any).html2pdf;
      } catch (e) {}
    }

    if (!html2pdf) {
      showToast("Abrindo prévia de impressão: selecione 'Salvar como PDF' na impressora.");
      setTimeout(() => window.print(), 300);
      return;
    }

    // 4. Cria container de captura fixo fora da tela na largura exata A4 (794px a 96 DPI)
    const captureContainer = document.createElement('div');
    captureContainer.id = 'pdf-capture-container';
    captureContainer.style.position = 'fixed';
    captureContainer.style.left = '-10000px';
    captureContainer.style.top = '0';
    captureContainer.style.width = '794px';
    captureContainer.style.minWidth = '794px';
    captureContainer.style.maxWidth = '794px';
    captureContainer.style.background = '#ffffff';
    captureContainer.style.margin = '0';
    captureContainer.style.padding = '0';
    captureContainer.style.boxSizing = 'border-box';
    captureContainer.style.zIndex = '-9999';

    // 5. Clona o conteúdo timbrado e zera o padding para que a margem de 15mm do html2pdf seja a única margem
    const clone = elementoOrig.cloneNode(true) as HTMLElement;
    clone.id = 'print-area-clone';
    clone.style.width = '794px';
    clone.style.minWidth = '794px';
    clone.style.maxWidth = '794px';
    clone.style.boxSizing = 'border-box';
    clone.style.padding = '0';
    clone.style.margin = '0';
    clone.style.background = '#ffffff';
    clone.style.color = '#000000';

    // Preserva rigorosamente as proporções oficiais do Brasão Municipal de Rio Claro RJ
    const brasaoImg = clone.querySelector('img[alt*="Brasão"]') as HTMLImageElement | null;
    if (brasaoImg) {
      brasaoImg.style.width = '83px';
      brasaoImg.style.height = '96px';
      brasaoImg.style.minWidth = '83px';
      brasaoImg.style.minHeight = '96px';
      brasaoImg.style.maxWidth = '83px';
      brasaoImg.style.maxHeight = '96px';
      brasaoImg.style.aspectRatio = '86 / 100';
      brasaoImg.style.objectFit = 'contain';
      brasaoImg.style.display = 'block';
      brasaoImg.style.flexShrink = '0';
      brasaoImg.setAttribute('width', '83');
      brasaoImg.setAttribute('height', '96');
      if (!brasaoImg.src || !brasaoImg.src.startsWith('data:')) {
        brasaoImg.src = BRASAO_RIO_CLARO;
      }
    }

    // Regras anti-quebra explícitas no clone para cabeçalho e assinatura
    const cabecalhoClone = clone.querySelector('#cabecalho-timbrado') || clone.querySelector('.cabecalho-timbrado') || clone.firstElementChild as HTMLElement | null;
    if (cabecalhoClone && cabecalhoClone instanceof HTMLElement) {
      cabecalhoClone.style.breakInside = 'avoid';
      (cabecalhoClone.style as any).pageBreakInside = 'avoid';
    }
    const assinaturaClone = clone.querySelector('#assinatura-timbrado') || clone.querySelector('.assinatura-timbrado') as HTMLElement | null;
    if (assinaturaClone && assinaturaClone instanceof HTMLElement) {
      assinaturaClone.style.breakInside = 'avoid';
      (assinaturaClone.style as any).pageBreakInside = 'avoid';
    }

    captureContainer.appendChild(clone);
    document.body.appendChild(captureContainer);

    // 6. Normaliza cores oklch -> RGB no DOM clonado antes da chamada do html2pdf
    normalizeOklchToRgb(clone);

    showToast('Gerando arquivo PDF com Brasão e Timbrado oficial...');

    // 7. Configuração completa solicitada: margens uniformes, PNG puro, anti-quebra de parágrafos/assinatura
    const opt = {
      margin: [15, 15, 18, 15], // (mm: topo 15mm, esquerda 15mm, base 18mm, direita 15mm)
      filename: cleanDocName,
      image: { type: 'png', quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        onclone: (clonedDoc: Document) => {
          const el = clonedDoc.getElementById('print-area-clone') || clonedDoc.getElementById('print-area-content') || clonedDoc.body;
          if (el && el instanceof HTMLElement) {
            normalizeOklchToRgb(el);
          }
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
        avoid: ['img', 'p', 'li', 'tr', 'blockquote', '#cabecalho-timbrado', '#assinatura-timbrado', '.avoid-break']
      }
    };

    try {
      await html2pdf()
        .set(opt)
        .from(clone)
        .save();
      showToast(`PDF "${cleanDocName}" salvo com sucesso!`);
    } catch (err: any) {
      console.warn('Falha na geração via html2pdf, acionando diálogo nativo para PDF:', err);
      showToast("Abrindo prévia: na janela de impressão, selecione 'Salvar como PDF'.");
      setTimeout(() => window.print(), 300);
    } finally {
      // 8. Garante a remoção limpa do container temporário do DOM em qualquer cenário
      if (captureContainer && captureContainer.parentNode) {
        captureContainer.parentNode.removeChild(captureContainer);
      }
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
    const deptoAlvo = currentUser?.departamento || (activeSecretaria.toLowerCase().includes('administra') ? 'Departamento de Recursos Humanos' : 'Gabinete');
    const secAlvo = activeSecretaria && activeSecretaria !== 'TODAS' ? activeSecretaria : (currentUser?.secretaria || 'Secretaria Municipal de Administração (SMA)');
    const siglaAlvo = getSecretariaSigla(secAlvo, secretarias);

    if (useRealApi) {
      try {
        const response = await fetch(realApiUrl, {
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
        });
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
        } else {
          showToast(json.error || 'Erro na API', 'Erro', true);
        }
      } catch (err: any) {
        showToast(`Erro ao chamar API: ${err.message}`, 'Erro', true);
      } finally {
        setIsGeneratingNumber(false);
      }
      return;
    }

    // Local Simulation with per-secretaria calculation
    setTimeout(() => {
      const proximoSeq = getNextSequentialForSecretaria(numeracoes, tipoDoc, secAlvo, anoAtual);
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
    }, 450);
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
      fetch(realApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'SALVAR_MODELO',
          documento: editingModelo,
          token: currentUser?.token || '',
          usuarioLogado: currentUser?.nome || 'Admin'
        })
      })
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
      secretaria: servidor.secretaria || 'SMA',
      departamento: servidor.departamento || '',
      nivel: (servidor.nivel || 'PADRAO') as any,
      ativo: servidor.ativo !== undefined ? servidor.ativo : true,
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

    // Registro nos Logs de Auditoria
    setLogs(prev => [{
      dataHora: new Date().toISOString(),
      usuario: currentUser?.nome || 'Admin',
      acao: exists ? 'EDITAR_SERVIDOR' : 'CRIAR_SERVIDOR',
      docId: mat,
      detalhes: `${exists ? 'Atualização' : 'Cadastro'} do servidor ${updatedUser.nome} (${updatedUser.secretaria})`
    }, ...prev]);

    // Sincronização com a nuvem (Google Apps Script Web App)
    if (useRealApi) {
      try {
        const resp = await fetch(realApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'SALVAR_USUARIO',
            matricula: mat,
            nome: updatedUser.nome,
            cargo: updatedUser.cargo,
            secretaria: updatedUser.secretaria,
            departamento: updatedUser.departamento,
            nivel: updatedUser.nivel,
            ativo: updatedUser.ativo,
            senha: novaSenha || undefined,
            usuarioAdmin: currentUser?.nome || 'Admin',
            token: currentUser?.token || ''
          })
        });
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
        await fetch(realApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'ALTERAR_STATUS_USUARIO',
            matricula: matricula,
            ativo: novoStatus,
            usuarioAdmin: currentUser?.nome || 'Admin',
            token: currentUser?.token || ''
          })
        });
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
    return (
      <div className={`min-h-screen w-full flex items-center justify-center p-4 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'}`}>
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
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Departamento de Recursos Humanos • Gestão Documental
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Matrícula Funcional</label>
              <input
                type="text"
                value={loginMatricula}
                onChange={e => setLoginMatricula(e.target.value)}
                placeholder="Ex: 1001"
                required
                autoComplete="username"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Senha</label>
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

            {loginError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 text-center font-medium">
                {loginError}
              </div>
            )}
          </form>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/60">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Fase Beta • Autenticação Real com Servidores
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
            <span className="text-[10px] text-slate-400">PMRC • SGEP-DOCS</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col font-sans ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* GLOBAL TOP NAV BAR: Visível exclusivamente se solicitado pelo Admin ou ao inspecionar códigos */}
      {(showDevHub || activeTab !== 'app') && (
        <nav className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex items-center justify-between text-xs flex-shrink-0 z-40">
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
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded">v3.6 (GAS v9)</span>
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
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Modo Noturno"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
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
        <div className="flex-1 flex flex-col overflow-hidden relative animate-in fade-in duration-200">
            
            {/* Top Header - Idêntico ao Standalone HTML de Produção (image_7f1c0232.png) */}
            <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md h-16 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-30">
              <div className="flex items-center space-x-3">
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
                    className="brasao-oficial-img object-contain drop-shadow-sm w-9 h-[42px] sm:w-10 sm:h-[48px] md:w-11 md:h-[52px] shrink-0 transition-all"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-bold text-sm sm:text-base tracking-tight text-slate-100">
                      Prefeitura Municipal de Rio Claro – RJ
                    </h1>
                    <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                      v3.6 Oficial (GAS v9)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span>Banco Mestre Administrativo</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                      <Cloud className="w-3 h-3 inline" />
                      <span>GAS Conectado</span>
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Botão Redigir Memorando / Ofício */}
                <button
                  onClick={() => {
                    setRedatorNumero('');
                    setIsRedatorModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="Redigir Memorando ou Ofício com numeração sequencial automática"
                >
                  <FilePen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Redigir Memorando/Ofício</span>
                </button>

                {/* Botão Livro de Numeração (Conforme Print Oficial image_f3b0d8af.png) */}
                <button
                  onClick={() => {
                    setActiveSheetTab('numeracao');
                    setIsSheetsDrawerOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer border border-blue-400/30"
                  title="Abrir o Livro de Numeração Oficial com os registros da secretaria ativa"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Livro de Numeração ({numeracoesFiltradas.length})</span>
                </button>

                {/* Seletor de Secretaria Ativa (Acúmulo de Pastas & Confidencialidade) */}
                <div className="flex items-center text-xs font-semibold bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-200 shadow-xs">
                  <Building2 className="w-3.5 h-3.5 text-blue-400 mr-1.5 shrink-0" />
                  <span className="text-[11px] text-slate-400 mr-1.5 hidden xl:inline">Pasta:</span>
                  {listaSecretariasDoUsuario.length > 1 || currentUser?.nivel === 'ADMIN' ? (
                    <select
                      value={activeSecretaria}
                      onChange={e => {
                        setActiveSecretaria(e.target.value);
                        setRedatorSecretaria(e.target.value);
                        localStorage.setItem('bm_active_secretaria', e.target.value);
                        showToast(`Secretaria de atuação alterada para: ${e.target.value}`);
                      }}
                      className="bg-transparent text-xs text-blue-300 font-bold focus:outline-none cursor-pointer pr-1 max-w-[190px] sm:max-w-[240px] truncate"
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
                    <span className="text-xs text-blue-300 font-bold truncate max-w-[180px] sm:max-w-[220px]" title={activeSecretaria}>
                      {activeSecretaria}
                    </span>
                  )}
                </div>

                {/* Botão Admin Gestão & Novo Modelo */}
                {currentUser?.nivel === 'ADMIN' && (
                  <>
                    <button
                      onClick={() => setIsAdminModalOpen(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 border border-indigo-400/30 cursor-pointer"
                      title="Painel de Administração: Gestão de Servidores, Senhas, Secretarias e Departamentos"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Gestão Admin</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingModelo({});
                        setIsCrudModalOpen(true);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all shadow-sm active:scale-95 border border-slate-700 cursor-pointer"
                      title="Cadastrar novo modelo documental"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo Modelo</span>
                    </button>

                    <button
                      onClick={() => setShowDevHub(!showDevHub)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        showDevHub || activeTab !== 'app'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="Alternar Central Técnica (Visualizar código GAS, HTML e Planilha)"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Central Técnica</span>
                    </button>
                  </>
                )}

                <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>

                {/* Identificação do Usuário */}
                <div className="flex items-center text-xs font-medium bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
                  <UserCheck className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
                  <div className="leading-tight text-left">
                    <span className="font-semibold block text-slate-200">
                      {currentUser.nome.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {currentUser.nivel}
                    </span>
                  </div>
                </div>

                {/* Botão Alterar Senha */}
                <button
                  onClick={() => {
                    setPasswordError('');
                    setCurrentPasswordInput('');
                    setNewPasswordInput('');
                    setConfirmPasswordInput('');
                    setIsPasswordModalOpen(true);
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
                  title="Alterar Minha Senha de Acesso"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                </button>

                {/* Botão Sincronizar */}
                <button
                  onClick={() => handleSyncData()}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
                  title="Sincronizar Modelos e Histórico de Numeração"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFromGas ? 'animate-spin' : ''}`} />
                </button>

                {/* Botão Tema */}
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
                  title="Alternar Modo Escuro"
                >
                  {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>

                {/* Botão Logout */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-colors border border-rose-800/60 cursor-pointer"
                  title="Sair da Sessão"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </header>

            {/* Dashboard Stats */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex-shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total</p>
                  <p className="text-base font-extrabold text-slate-800 dark:text-slate-100">{modelos.length}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Despachos</p>
                  <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                    {modelos.filter(i => (i.TipoDocumento || '').toUpperCase() === 'DESPACHO').length}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Pareceres</p>
                  <p className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                    {modelos.filter(i => (i.TipoDocumento || '').toUpperCase() === 'PARECER').length}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">E-mails</p>
                  <p className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                    {modelos.filter(i => (i.TipoDocumento || '').toUpperCase() === 'EMAIL').length}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Ofícios</p>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {modelos.filter(i => (i.TipoDocumento || '').toUpperCase() === 'OFICIO').length}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Checklists</p>
                  <p className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                    {modelos.filter(i => (i.TipoDocumento || '').toUpperCase() === 'CHECKLIST').length}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Favoritos</p>
                  <p className="text-base font-extrabold text-amber-500">{favoritos.length}</p>
                </div>
              </div>
            </div>

            {/* COMBO DE TODOS OS DOCUMENTOS E REGISTROS DA ABA NUMERAÇÃO */}
            <div className="bg-gradient-to-r from-slate-50 via-emerald-50/20 to-slate-50 dark:from-slate-900/90 dark:via-emerald-950/20 dark:to-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2.5 w-full md:w-auto flex-1">
                <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-bold whitespace-nowrap">
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <span>Livro de Numeração (Combo Oficial):</span>
                </div>
                
                <div className="relative flex-1 max-w-2xl">
                  <select
                    value={selectedComboDocNum}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedComboDocNum(val);
                      const doc = numeracoes.find(n => n.numero === val);
                      setInspectedDocFromCombo(doc || null);
                    }}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                  >
                    <option value="">Selecione para consultar um documento da aba 'Numeração' ({numeracoes.length} registros)...</option>
                    {numeracoes.map((item, idx) => (
                      <option key={idx} value={item.numero}>
                        [{item.numero}] {item.tipoDocumento} — {item.assunto} | Dest: {item.destinatario} ({new Date(item.dataHora).toLocaleDateString('pt-BR')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {inspectedDocFromCombo ? (
                <div className="flex items-center space-x-2 w-full md:w-auto justify-end bg-white dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-xs">
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">
                    <strong className="text-emerald-600 dark:text-emerald-400">{inspectedDocFromCombo.tipoDocumento} {inspectedDocFromCombo.numero}</strong> • Dest: {inspectedDocFromCombo.destinatario}
                  </span>
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
                    className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-[10px] flex items-center space-x-1 shadow-xs cursor-pointer"
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
                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded font-semibold text-[10px] flex items-center space-x-1 cursor-pointer"
                    title="Copiar número oficial"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tipoResp = inspectedDocFromCombo.tipoDocumento === 'OFICIO' ? 'OFICIO' : 'MEMORANDO';
                      setRedatorTipo(tipoResp);
                      setRedatorReferenciaDoc(`${inspectedDocFromCombo.tipoDocumento} nº ${inspectedDocFromCombo.numero}`);
                      setRedatorDestinatario(inspectedDocFromCombo.destinatario !== 'Não informado' ? inspectedDocFromCombo.destinatario : '');
                      setRedatorAssunto(`Em resposta ao ${inspectedDocFromCombo.tipoDocumento} nº ${inspectedDocFromCombo.numero} – ${inspectedDocFromCombo.assunto}`);
                      setRedatorTexto(`Cumprimentando-o cordialmente, sirvo-me do presente para apresentar as manifestações e informações pertinentes em resposta ao ${inspectedDocFromCombo.tipoDocumento} nº ${inspectedDocFromCombo.numero}, concernente a ${inspectedDocFromCombo.assunto}.\n\nInformo que as medidas foram devidamente instruídas, visando à regular continuidade dos serviços públicos desta municipalidade.`);
                      setRedatorNumero('');
                      setIsRedatorModalOpen(true);
                      showToast(`Referência e modelo de resposta ao ${inspectedDocFromCombo.numero} carregados no Redator!`);
                    }}
                    className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[10px] flex items-center space-x-1 shadow-xs cursor-pointer"
                    title="Iniciar resposta oficial com referência e texto automático no Redator"
                  >
                    <FilePen className="w-3 h-3" />
                    <span>Responder no Redator</span>
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center space-x-2 text-[11px] text-slate-500">
                  <span>💡 Escolha um documento acima para consultar dados de protocolo ou usá-lo como referência no redator.</span>
                </div>
              )}
            </div>

            {/* Workspace Area: Sidebar & Document Grid */}
            <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto p-4 sm:p-6 gap-6">
              
              {/* Sidebar */}
              <aside className="w-72 flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <h2 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tipos de Documento</h2>
                </div>
                
                {/* Type Filter Buttons */}
                <div className="p-2.5 space-y-1 overflow-y-auto border-b border-slate-100 dark:border-slate-800 max-h-48">
                  {['TODOS', 'FAVORITOS', 'DESPACHO', 'EMAIL', 'OFICIO', 'PARECER', 'MEMORANDO', 'CHECKLIST'].map(t => {
                    const isSelected = selectedType === t;
                    const count = t === 'TODOS' ? modelos.length :
                                 t === 'FAVORITOS' ? favoritos.length :
                                 modelos.filter(m => (m.TipoDocumento || '').toUpperCase() === t).length;
                    return (
                      <button
                        key={t}
                        onClick={() => { setSelectedType(t); setSelectedCategory(null); }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{t.charAt(0) + t.slice(1).toLowerCase()}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
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
                <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
                  {categories.map(cat => {
                    const isSelected = selectedCategory === cat;
                    const count = modelos.filter(m => m.Categoria === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(isSelected ? null : cat)}
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
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{sugestoes.destinatarios.length}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Assuntos únicos:
                    </span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{sugestoes.assuntos.length}</strong>
                  </div>
                </div>
              </aside>

              {/* Main Content Area */}
              <main className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                
                {/* Search & Active Filter Bar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-[480px]">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Pesquisar por título, corpo do texto, base legal, tags..."
                      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
                    />
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <span className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
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
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex flex-wrap items-center gap-1.5">
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
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Código.gs (Google Apps Script API v3.6 - Versão 9)</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    LockService • Gestão de Usuários • Gravação Dupla (Auditoria)
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Extração automática de listas únicas da aba Numeração (Col D: Assuntos, Col F: Destinatários) e registro irreversível de 6 colunas.
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Corpo do Modelo (Use colchetes para campos dinâmicos: [NOME]) *
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                      Ex: [DESTINATÁRIO], [ASSUNTO], [NUMERO_MEMORANDO]
                    </span>
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
      {/* MODAL 3: ALTERAÇÃO DE SENHA DO USUÁRIO                                   */}
      {/* ========================================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Alterar Senha de Acesso</h3>
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

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Servidor Autenticado:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{currentUser?.nome}</strong>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Matrícula {currentUser?.matricula}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={currentPasswordInput}
                    onChange={e => setCurrentPasswordInput(e.target.value)}
                    placeholder="Digite sua senha atual"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Para sua segurança, confirme a senha atual.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  placeholder="Mínimo de 3 caracteres"
                  required
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
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
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
                  <span>Salvar Nova Senha</span>
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-sm">
                  <FilePen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                      Redator Oficial de Memorando e Ofício
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Numeração Sequencial Automática
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Prefeitura Municipal de Rio Claro – RJ • Padrão Manual de Redação Oficial
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsRedatorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Body: Split View (Editor Form & Timbrado Preview) */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6">
              
              {/* Form Controls (Col 7) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Tipo de Documento & Numeração Automática Header Card */}
                <div className="p-4 bg-gradient-to-br from-slate-50 to-emerald-50/40 dark:from-slate-800/60 dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                        Tipo de Documento:
                      </label>
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        {(['MEMORANDO', 'OFICIO', 'DESPACHO', 'CIRCULAR', 'PORTARIA', 'DECRETO', 'EMAIL'] as const).map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setRedatorTipo(t);
                              setRedatorNumero('');
                              if (t === 'DECRETO') {
                                setRedatorSecretaria('Gabinete do Prefeito');
                                setRedatorSetorOrigem('Gabinete do Prefeito');
                                setRedatorSignatario('Prefeito Municipal de Rio Claro');
                                setRedatorCargo('Prefeito Municipal');
                                setRedatorDestinatario('Poder Executivo Municipal e Órgãos da Administração Direta e Indireta');
                                setRedatorFecho('Gabinete do Prefeito, Rio Claro – RJ, na data de sua publicação.');
                                if (!redatorTexto.trim() || redatorTexto.includes('Cumprimentando-o cordialmente') || redatorTexto.includes('Prezado(a)') || redatorTexto.includes('RESOLVE:')) {
                                  setRedatorAssunto('Declara ponto facultativo nas repartições públicas municipais e dá outras providências');
                                  setRedatorTexto(
                                    'O PREFEITO MUNICIPAL DE RIO CLARO, Estado do Rio de Janeiro, no uso das atribuições legais que lhe confere a Lei Orgânica do Município de Rio Claro, e\n\nCONSIDERANDO a conveniência administrativa e as festividades oficiais no Município;\n\nDECRETA:\n\nArt. 1º É declarado ponto facultativo no âmbito de todos os órgãos e repartições da Administração Pública Municipal Direta e Indireta no dia [DATA].\n\nArt. 2º Os serviços essenciais de urgência e emergência em saúde, defesa civil e coleta de resíduos funcionarão em regime de plantão.\n\nArt. 3º Este Decreto entra em vigor na data de sua publicação.'
                                  );
                                }
                              } else if (t === 'PORTARIA') {
                                setRedatorFecho('Dê-se ciência, registre-se, publique-se e cumpra-se.');
                                if (!redatorTexto.trim() || redatorTexto.includes('Cumprimentando-o cordialmente') || redatorTexto.includes('Prezado(a)') || redatorTexto.includes('DECRETA:')) {
                                  setRedatorAssunto('Designa servidores para comissão de fiscalização de contrato administrativo');
                                  setRedatorTexto(
                                    'O SECRETÁRIO MUNICIPAL DE ADMINISTRAÇÃO DE RIO CLARO, Estado do Rio de Janeiro, no uso de suas atribuições legais e em conformidade com o Art. 117 da Lei Federal nº 14.133/2021,\n\nRESOLVE:\n\nArt. 1º Designar os seguintes servidores para compor a comissão de fiscalização do Contrato Administrativo nº [NÚMERO/ANO]:\nI - Gestor do Contrato: [NOME], matrícula nº [MATRÍCULA];\nII - Fiscal Titular: [NOME], matrícula nº [MATRÍCULA];\nIII - Fiscal Substituto: [NOME], matrícula nº [MATRÍCULA].\n\nArt. 2º Compete à comissão atestar a regular execução dos serviços contratados.\n\nArt. 3º Esta Portaria entra em vigor na data de sua publicação, revogadas as disposições em contrário.'
                                  );
                                }
                              } else if (t === 'EMAIL') {
                                if (!redatorTexto.trim() || redatorTexto.includes('sirvo-me do presente para encaminhar a Vossa Senhoria') || redatorTexto.includes('DECRETA:') || redatorTexto.includes('RESOLVE:')) {
                                  setRedatorTexto(
                                    `Prezado(a) ${redatorDestinatario || 'Servidor(a)'},\n\nEscrevo em nome da ${redatorSecretaria} da Prefeitura Municipal de Rio Claro – RJ, referente ao assunto "${redatorAssunto || 'Processo Administrativo'}".\n\nSolicitamos a gentileza de analisar as informações apresentadas e acusar o recebimento desta mensagem, bem como adotar as providências administrativas cabíveis no âmbito de sua competência.\n\nPermanecemos à disposição para prestar quaisquer esclarecimentos complementares.\n\nAtenciosamente,\n\n${redatorSignatario}\n${redatorCargo}\n${redatorSecretaria}\nPrefeitura Municipal de Rio Claro – RJ`
                                  );
                                }
                              } else {
                                if (redatorTexto.includes('DECRETA:') || redatorTexto.includes('RESOLVE:') || redatorTexto.includes('Escrevo em nome da')) {
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
                                  : 'bg-emerald-600 text-white shadow-sm'
                                : t === 'EMAIL'
                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 hover:bg-purple-100'
                                : t === 'DECRETO'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                                : t === 'PORTARIA'
                                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 hover:bg-sky-100'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {t === 'EMAIL' && <Mail className="w-3.5 h-3.5 text-white" />}
                            {t === 'DECRETO' && <Landmark className="w-3.5 h-3.5" />}
                            {t === 'PORTARIA' && <FileText className="w-3.5 h-3.5" />}
                            <span>{t === 'EMAIL' ? 'E-MAIL' : t}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status da Numeração Oficial (Apenas para Documentos Físicos) */}
                    {redatorTipo !== 'EMAIL' && (
                      <div className="text-left sm:text-right space-y-1.5">
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Número Oficial ({activeSecretaria ? getSecretariaSigla(activeSecretaria, secretarias) : 'SMA'}):</span>
                        {redatorNumero ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white font-mono text-sm font-bold shadow-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{redatorTipo} Nº {redatorNumero}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:items-end gap-1.5 mt-1">
                            <button
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
                            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={incluirSiglaNoNumero}
                                onChange={e => {
                                  setIncluirSiglaNoNumero(e.target.checked);
                                  localStorage.setItem('bm_incluir_sigla', e.target.checked ? 'true' : 'false');
                                }}
                                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span>
                                Incluir sigla da pasta (ex: <strong>{getSecretariaSigla(activeSecretaria, secretarias)}</strong>)
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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

                {/* Referência a Documento Anterior do Livro de Numeração (Opcional) */}
                {redatorTipo !== 'EMAIL' && (
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
                          const doc = numeracoes.find(n => `${n.tipoDocumento} nº ${n.numero}` === val);
                          if (doc) {
                            if (doc.destinatario !== 'Não informado') setRedatorDestinatario(doc.destinatario);
                            setRedatorAssunto(`Em resposta ao ${doc.tipoDocumento} nº ${doc.numero} – ${doc.assunto}`);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    >
                      <option value="">Nenhum (Novo documento autônomo)...</option>
                      {numeracoes.map((item, idx) => (
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
                        <span>86 Modelos da Base</span>
                      </span>
                    </div>

                    {/* Dropdown Combo para Seleção de Assuntos dos 86 Modelos */}
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
                          if (mod.TipoDocumento === 'OFICIO' || mod.TipoDocumento === 'MEMORANDO') {
                            setRedatorTipo(mod.TipoDocumento as any);
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
                      {numeracoes.length > 0 && (
                        <optgroup label="📋 Assuntos Emitidos Recentemente">
                          {Array.from(new Set(numeracoes.map(n => n.assunto))).filter(Boolean).slice(0, 10).map((ass, idx) => (
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
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <FilePen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Texto do Documento (Redação Oficial):</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAiHelperOpen(prev => !prev)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs ${
                          isAiHelperOpen
                            ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                            : 'bg-linear-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 active:scale-95'
                        }`}
                        title="Abrir o Assistente de Inteligência Artificial para gerar ou ajustar a redação"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                        <span>✨ Redigir com IA</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Botões Rápidos de IA sobre o texto existente */}
                      {redatorTexto.trim().length > 0 && (
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

                  {/* Barra de Ferramentas Completa de Edição Oficial */}
                  <div className="bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-t-xl p-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 shadow-2xs border-b-0">
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
                    </div>

                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5"></div>

                    {/* Utilitários: Inserir Campo, Limpar Formatação, Desfazer, Refazer */}
                    <div className="flex items-center space-x-1 ml-auto">
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

                  {/* Campo Textarea com Indicador de Carregamento da IA */}
                  <div className="relative">
                    <textarea
                      ref={redatorTextareaRef}
                      rows={8}
                      value={redatorTexto}
                      onChange={e => {
                        salvarHistorico(e.target.value);
                      }}
                      className={`w-full px-3.5 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-b-xl rounded-t-none border-t-0 text-xs font-sans leading-relaxed text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 shadow-sm transition-opacity ${
                        isGeneratingAiText ? 'opacity-40 pointer-events-none' : ''
                      }`}
                      placeholder="Digite o teor do documento oficial ou utilize a barra de ferramentas de formatação acima..."
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

                {/* Fecho & COMBOS DE AUTORIDADE / SECRETARIA */}
                <div className="space-y-3 p-3.5 bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/50 rounded-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Fecho Oficial (col-4) */}
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Fecho Oficial:
                      </label>
                      <select
                        value={redatorFecho}
                        onChange={e => setRedatorFecho(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 shadow-xs"
                      >
                        <option value="Permanecemos à disposição para eventuais esclarecimentos adicionais.">
                          Permanecemos à disposição... (Padrão Rio Claro RJ)
                        </option>
                        <option value="Atenciosamente,">Atenciosamente, (Mesma hierarquia ou inferior)</option>
                        <option value="Respeitosamente,">Respeitosamente, (Autoridade superior)</option>
                        <option value="Cordialmente,">Cordialmente,</option>
                      </select>
                    </div>

                    {/* COMBO 3: Signatário / Cargo da Base Municipal (col-8) */}
                    <div className="sm:col-span-8 space-y-1">
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

                      {/* Combo Seletor de Autoridade / Servidor da Base */}
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
                            setRedatorSecretaria(found.secretaria);
                            setRedatorMatricula(found.matricula);
                            setRedatorSetorOrigem(found.departamento || found.secretaria);
                            showToast(`Signatário: ${found.nome} — ${found.cargo} (${found.secretaria})`);
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-purple-50/50 dark:bg-slate-800/80 border border-purple-300 dark:border-purple-800/80 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 shadow-xs"
                      >
                        <option value="">⚡ Escolher Signatário da Base de Servidores & Chefias...</option>
                        {listaSignatariosBase.map(sig => (
                          <option key={sig.matricula} value={sig.matricula}>
                            {sig.nome} — {sig.cargo} ({sig.secretaria})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* COMBO 4: SECRETARIA / ÓRGÃO DO SERVIDOR SIGNATÁRIO */}
                  <div className="space-y-1.5 pt-1 border-t border-purple-200/60 dark:border-purple-900/40">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Secretaria / Órgão do Servidor Signatário:</span>
                      </label>
                      <span className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full font-semibold border border-indigo-300 dark:border-indigo-800 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Combo Secretaria do Signatário</span>
                      </span>
                    </div>

                    {/* Dropdown Seletor de Secretaria do Signatário */}
                    <select
                      value={listaSecretariasBase.includes(redatorSecretaria) ? redatorSecretaria : ''}
                      onChange={e => {
                        if (e.target.value) {
                          setRedatorSecretaria(e.target.value);
                          setRedatorSetorOrigem(e.target.value);
                          showToast(`Secretaria de lotação: ${e.target.value}`);
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-300 dark:border-indigo-800/80 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 shadow-xs"
                    >
                      <option value="">⚡ Selecionar Secretaria Municipal do Signatário...</option>
                      {listaSecretariasBase.map((sec, idx) => (
                        <option key={idx} value={sec}>{sec}</option>
                      ))}
                    </select>

                    {/* Chips Rápidos de Secretarias Municipais */}
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
                        'Gabinete do Prefeito'
                      ].map(secChip => (
                        <button
                          key={secChip}
                          type="button"
                          onClick={() => {
                            setRedatorSecretaria(secChip);
                            setRedatorSetorOrigem(secChip);
                          }}
                          className={`px-1.5 py-0.5 text-[10px] rounded transition-all font-medium border ${
                            redatorSecretaria === secChip
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {secChip.replace('Secretaria Municipal de ', 'Sec. ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Campos Editáveis: Nome, Cargo e Secretaria do Signatário */}
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
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mb-0.5">
                        Secretaria / Órgão do Signatário:
                      </label>
                      <input
                        type="text"
                        list="react-datalist-secretarias"
                        value={redatorSecretaria}
                        onChange={e => setRedatorSecretaria(e.target.value)}
                        placeholder="Secretaria do servidor"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
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

              {/* Column 2: Prévia Timbrada em Tempo Real (Col 5) */}
              <div className="lg:col-span-5 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    <span>Visualização Timbrada (Padrão Rio Claro – RJ)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Papel Timbrado Oficial</span>
                </div>

                {/* Prévia em Tempo Real */}
                {redatorTipo === 'EMAIL' ? (
                  /* Visualização de Mensagem de E-mail Institucional */
                  <div className="flex-1 bg-white text-slate-900 p-5 sm:p-6 rounded-xl border border-slate-300 shadow-md flex flex-col justify-between font-sans text-xs leading-relaxed select-all overflow-y-auto max-h-[580px]">
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
                  /* Folha A4 Simulação (Memorando / Ofício / Despacho / Circular) */
                  <div className="flex-1 bg-white text-slate-900 p-6 sm:p-7 rounded-xl border border-slate-300 shadow-md flex flex-col justify-between font-serif text-[11px] leading-relaxed select-all overflow-y-auto max-h-[580px]">
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
                            className="sgep-rich-doc leading-relaxed mb-6 pl-1 sm:pl-2"
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
                            className="sgep-rich-doc leading-relaxed mb-5 pl-1 sm:pl-2"
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
                            className="sgep-rich-doc leading-relaxed mb-6 pl-1 sm:pl-2"
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

                    {/* Assinatura Oficial */}
                    <div className="text-center pt-4 mt-6 max-w-sm mx-auto font-sans">
                      <div className="w-52 h-[1px] bg-slate-400 mx-auto mb-2"></div>
                      <p className="font-bold text-xs text-slate-900">{redatorSignatario}</p>
                      <p className="text-[11px] text-slate-700 italic">{redatorCargo}</p>
                      <p className="text-[10px] text-[#002b82] font-semibold">{redatorSecretaria}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Prefeitura Municipal de Rio Claro – RJ</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <span className="text-xs text-slate-500 hidden md:inline">
                A numeração é controlada pelo LockService do Apps Script para evitar duplicidade entre secretarias.
              </span>

              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsRedatorModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
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
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
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
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm active:scale-95"
                    title="Abre o cliente padrão de e-mail (Outlook, Thunderbird, Gmail)"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Abrir no E-mail (mailto)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleBaixarDocxRedator}
                  className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm active:scale-95"
                  title="Exportar documento oficial para Microsoft Word (.doc) com Brasão Municipal"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Salvar no Word (.doc)</span>
                </button>

                <button
                  type="button"
                  onClick={handleBaixarPdfRedator}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm active:scale-95"
                  title="Gerar e baixar documento em PDF A4 timbrado oficial"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Salvar em PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRedatorLetterheadOpen(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{redatorTipo === 'EMAIL' ? 'Visualizar / Imprimir' : 'Visualizar Timbrado / Imprimir'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalizarDocumentoRedator}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Emitir e Registrar na Numeração</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DOCUMENTO OFICIAL TIMBRADO IMPRESSÃO (RIO CLARO – RJ)             */}
      {/* ========================================================================= */}
      {isRedatorLetterheadOpen && (
        <div id="modal-timbrado-container" className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto modal-timbrado-backdrop">
          <div id="modal-timbrado-card" className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto border border-slate-300 modal-timbrado-card">
            {/* Top Toolbar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Visualização de Impressão Oficial</span>
                <span className="text-xs text-slate-400">• Prefeitura Municipal de Rio Claro – RJ</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Documento</span>
                </button>
                <button
                  onClick={handleBaixarPdfRedator}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                  title="Baixar diretamente em arquivo PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Salvar em PDF</span>
                </button>
                <button
                  onClick={handleBaixarDocxRedator}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                  title="Baixar em Microsoft Word (.doc) com Brasão oficial"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Salvar no Word (.doc)</span>
                </button>
                <button
                  onClick={() => setIsRedatorLetterheadOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Folha A4 Oficial */}
            <div id="print-area-content" className="p-10 sm:p-14 font-serif leading-relaxed text-slate-900 bg-white print-area-container">
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
                Prezados,
              </div>

              {/* Corpo do Documento */}
              <div
                className="sgep-rich-doc leading-relaxed mb-10 pl-6"
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

              {/* Assinatura Oficial */}
              <div id="assinatura-timbrado" className="assinatura-timbrado avoid-break text-center pt-8 mt-12 max-w-md mx-auto font-sans" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <div className="w-64 h-[1px] bg-slate-400 mx-auto mb-2.5"></div>
                <p className="font-bold text-sm sm:text-base text-slate-900">{redatorSignatario}</p>
                <p className="text-xs sm:text-sm text-slate-700 italic">{redatorCargo}</p>
                <p className="text-xs text-[#002b82] font-semibold">{redatorSecretaria}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Prefeitura Municipal de Rio Claro – RJ</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* DRAWER: INSPEÇÃO DA PLANILHA GOOGLE SHEETS EM TEMPO REAL                  */}
      {/* ========================================================================= */}
      {isSheetsDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
          <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-4xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Planilha Google Sheets (Visualização ao Vivo)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Acompanhe em tempo real a gravação dupla na aba "Numeração" e "Logs_Auditoria".
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSheetsDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Sheets Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-4 pt-2 gap-2 text-xs">
              <button
                onClick={() => setActiveSheetTab('numeracao')}
                className={`px-3 py-1.5 rounded-t-lg font-bold border-t border-l border-r transition-all ${
                  activeSheetTab === 'numeracao'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 border-slate-200 dark:border-slate-800'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'
                }`}
              >
                Numeração ({numeracoesFiltradas.length} de {numeracoes.length} registros)
              </button>

              <button
                onClick={() => setActiveSheetTab('logs')}
                className={`px-3 py-1.5 rounded-t-lg font-bold border-t border-l border-r transition-all ${
                  activeSheetTab === 'logs'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 border-slate-200 dark:border-slate-800'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'
                }`}
              >
                Logs_Auditoria ({logs.length} eventos)
              </button>

              <button
                onClick={() => setActiveSheetTab('modelos')}
                className={`px-3 py-1.5 rounded-t-lg font-bold border-t border-l border-r transition-all ${
                  activeSheetTab === 'modelos'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 border-slate-200 dark:border-slate-800'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'
                }`}
              >
                Modelos ({modelos.length})
              </button>

              <button
                onClick={() => setActiveSheetTab('usuarios')}
                className={`px-3 py-1.5 rounded-t-lg font-bold border-t border-l border-r transition-all ${
                  activeSheetTab === 'usuarios'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 border-slate-200 dark:border-slate-800'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'
                }`}
              >
                Usuarios ({usuarios.length})
              </button>
            </div>

            {/* Sheets Table Content */}
            <div className="flex-1 overflow-auto p-4">
              {activeSheetTab === 'numeracao' && (
                <div className="space-y-3">
                  {/* Banner de Confidencialidade e Privacidade por Pasta */}
                  <div className="p-3 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-slate-800 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900/60 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 dark:text-slate-100 font-bold">
                            Filtro de Confidencialidade: {activeSecretaria === 'TODAS' ? 'Auditoria Geral Municipal' : activeSecretaria}
                          </strong>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {getSecretariaSigla(activeSecretaria, secretarias)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          {activeSecretaria.toLowerCase().includes('administra') || activeSecretaria === 'TODAS'
                            ? 'Acesso autorizado ao acervo histórico legado da SEAD (841 registros da Secretaria de Administração).'
                            : 'Documentos e missivas restritos à sua pasta. Registros de outras secretarias e acervo legado da SEAD não são exibidos.'}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-700 shrink-0">
                      {numeracoesFiltradas.length} visíveis
                    </span>
                  </div>

                  {/* Barra de Filtros Departamentais e Busca do Livro */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Campo de Busca por Palavra-chave */}
                      <div className="relative min-w-[200px]">
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Filtro por Departamento Interno (Coluna H) */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Departamento:</span>
                        <select
                          value={filtroLivroDepartamento}
                          onChange={e => setFiltroLivroDepartamento(e.target.value)}
                          className="bg-transparent font-medium text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1 max-w-[180px] truncate"
                        >
                          <option value="TODOS">Todos os Departamentos</option>
                          {departamentosDaSecretariaAtiva.map((depto, idx) => (
                            <option key={idx} value={depto}>{depto}</option>
                          ))}
                        </select>
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
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span>Exibindo <strong>{numeracoesFiltradas.length}</strong> de <strong>{numeracoes.length}</strong></span>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2.5 font-mono text-[11px]">A: DataHora</th>
                          <th className="p-2.5 font-mono text-[11px]">B: TipoDoc</th>
                          <th className="p-2.5 font-mono text-[11px]">C: Número Oficial</th>
                          <th className="p-2.5 font-mono text-[11px] bg-blue-100/40 dark:bg-blue-950/40">D: Assunto</th>
                          <th className="p-2.5 font-mono text-[11px] bg-amber-50/50 dark:bg-amber-950/20">E: Servidor</th>
                          <th className="p-2.5 font-mono text-[11px] bg-emerald-50/50 dark:bg-emerald-950/20">F: Destinatário</th>
                          <th className="p-2.5 font-mono text-[11px]">G: Secretaria</th>
                          <th className="p-2.5 font-mono text-[11px]">H: Departamento</th>
                          <th className="p-2.5 font-mono text-[11px] text-center">Ações</th>
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
                            const deptoDoc = n.departamento || (secDoc.toLowerCase().includes('administra') ? 'Departamento de Recursos Humanos' : 'Gabinete');
                            const servDoc = n.servidor || n.usuario || 'Servidor Municipal';
                            const siglaDoc = getSecretariaSigla(secDoc, secretarias);
                            return (
                              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                  {new Date(n.dataHora).toLocaleDateString('pt-BR')} {new Date(n.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                                <td className="p-2.5 text-center whitespace-nowrap">
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
                                      className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-[10px] font-semibold border border-blue-200 dark:border-blue-800 flex items-center gap-1 cursor-pointer"
                                      title="Visualizar em papel timbrado oficial da Prefeitura"
                                    >
                                      <Printer className="w-3 h-3" />
                                      <span>Timbrado</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const tipoResp = n.tipoDocumento === 'OFICIO' ? 'OFICIO' : 'MEMORANDO';
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
                                      className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 cursor-pointer"
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
                </div>
              )}

              {activeSheetTab === 'logs' && (
                <div className="space-y-3">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                    <strong>Gravação Dupla de Auditoria:</strong> Toda vez que um número é emitido, a ação é registrada irreversivelmente nesta aba para compliance administrativo.
                  </div>

                  <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-200 dark:border-slate-700 font-mono text-[11px]">DataHora</th>
                        <th className="p-2 border-r border-slate-200 dark:border-slate-700 font-mono text-[11px]">Usuario</th>
                        <th className="p-2 border-r border-slate-200 dark:border-slate-700 font-mono text-[11px]">Acao</th>
                        <th className="p-2 border-r border-slate-200 dark:border-slate-700 font-mono text-[11px]">DocID/Num</th>
                        <th className="p-2 font-mono text-[11px]">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {logs.map((l, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2 font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800">
                            {new Date(l.dataHora).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-2 font-medium border-r border-slate-100 dark:border-slate-800">{l.usuario}</td>
                          <td className="p-2 font-mono text-[11px] font-bold text-emerald-600 border-r border-slate-100 dark:border-slate-800">{l.acao}</td>
                          <td className="p-2 font-mono border-r border-slate-100 dark:border-slate-800">{l.docId}</td>
                          <td className="p-2 text-slate-600 dark:text-slate-300 text-[11px]">{l.detalhes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeSheetTab === 'modelos' && (
                <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="p-2">ID</th>
                      <th className="p-2">Tipo</th>
                      <th className="p-2">Categoria</th>
                      <th className="p-2">Titulo</th>
                      <th className="p-2">Ativo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {modelos.map(m => (
                      <tr key={m.ID} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 font-mono font-bold text-slate-700 dark:text-slate-300">{m.ID}</td>
                        <td className="p-2">{m.TipoDocumento}</td>
                        <td className="p-2">{m.Categoria}</td>
                        <td className="p-2 font-medium">{m.Titulo}</td>
                        <td className="p-2 text-emerald-600 font-bold">TRUE</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeSheetTab === 'usuarios' && (
                <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="p-2">Matricula</th>
                      <th className="p-2">Nome</th>
                      <th className="p-2">NivelAcesso</th>
                      <th className="p-2">Ativo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {usuarios.map(u => (
                      <tr key={u.matricula} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 font-mono font-bold">{u.matricula}</td>
                        <td className="p-2 font-medium">{u.nome}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.nivel === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {u.nivel}
                          </span>
                        </td>
                        <td className="p-2 text-emerald-600 font-bold">TRUE</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        />
      )}

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
