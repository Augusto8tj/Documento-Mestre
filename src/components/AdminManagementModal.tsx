import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  Key,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  RotateCcw,
  Download,
  AlertTriangle,
  X,
  Lock,
  Mail,
  Phone,
  Briefcase,
  Layers,
  Save,
  Trash2,
  Clock,
  Copy,
  Send,
  UserPlus,
  ListOrdered,
  Globe,
  Hash,
  ArrowRight,
  RefreshCw,
  Check,
  Award,
  BadgeCheck
} from 'lucide-react';
import {
  UsuarioSistema,
  SecretariaItem,
  PedidoRecuperacaoSenha,
  FiltroAcessibilidadeDocs,
  RegistroNumeracao,
  ConfigNumeracaoMunicipal,
  DEFAULT_CONFIG_NUMERACAO,
  TIPOS_DOCUMENTO_NUMERADOS,
  CARGOS_PREFEITURA_BASE,
  getEffectiveAccessibilityFilter,
  formatAccessibilityFilterLabel,
  getSecretariaSigla,
  resolveCanonicalSecretariaName,
  isTipoSequenciaGlobal,
  getMaxSequentialForSecretaria,
  formatNumeroOficialSequencial,
  getCargosSugeridosUnificados
} from '../mockData';
import {
  ANEXO_I_SUBSIDIO_COMISSAO,
  ANEXO_II_FUNCOES_GRATIFICADAS,
  TODAS_FUNCOES_ANEXOS_I_II,
  CargoComissionadoOuFG,
  CategoriaFuncaoOficial,
  SimbologiaOficial,
  StatusCargoEfetivo,
  getStatusCargoEfetivo,
  formatarCargoEfetivoComStatus,
  formatCargoComSimbologia,
  extractSimbologiaLabel,
  stripSimbologiaLabel,
  inferirDepartamentoDaFuncao,
  agruparFuncoesPorSecretaria,
  servidorOcupaFuncaoOficial
} from '../cargosOficiais';
import { HelpTooltip } from './HelpTooltip';

export interface MarcoZeroPayload {
  secretaria: string;
  departamento: string;
  tipoDocumento: string;
  ultimoNumero: number;
  ano: string;
  observacao: string;
  incluirSigla: boolean;
}

interface AdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UsuarioSistema;
  usuarios: UsuarioSistema[];
  onSaveUsuario: (usuario: Partial<UsuarioSistema>, novaSenha?: string) => Promise<boolean>;
  onToggleStatusUsuario: (matricula: string, novoStatus: boolean) => Promise<boolean>;
  onRecusarServidorInativo?: (matricula: string, motivo?: string) => Promise<boolean>;
  secretarias: SecretariaItem[];
  onSaveSecretaria: (sec: SecretariaItem) => void;
  realApiUrl: string;
  useRealApi: boolean;
  showToast: (msg: string, title?: string, isError?: boolean) => void;
  pedidosRecuperacao?: PedidoRecuperacaoSenha[];
  onAprovarPedidoRecuperacao?: (pedidoId: string, novaSenha?: string) => Promise<void> | void;
  onCancelarPedidoRecuperacao?: (pedidoId: string) => void;
  numeracoes?: RegistroNumeracao[];
  configNumeracao?: ConfigNumeracaoMunicipal;
  onDefinirMarcoZero?: (payload: MarcoZeroPayload) => Promise<boolean>;
  onSalvarConfigNumeracao?: (novaConfig: ConfigNumeracaoMunicipal) => Promise<boolean>;
  initialTab?: 'servidores' | 'secretarias' | 'pedidos' | 'numeracao' | 'quadro_vagas' | 'auditoria';
  onTabChange?: (tab: 'servidores' | 'secretarias' | 'pedidos' | 'numeracao' | 'quadro_vagas' | 'auditoria') => void;
  initialMarcoZeroContext?: { secretaria?: string; tipoDocumento?: string } | null;
  funcoesOficiais?: CargoComissionadoOuFG[];
  onSaveFuncoesOficiais?: (lista: CargoComissionadoOuFG[]) => void;
  cargosEfetivos?: string[];
  onSaveCargosEfetivos?: (lista: string[]) => void;
}

interface AdminConfirmDialogState {
  title: string;
  message: string;
  detail?: string;
  confirmLabel: string;
  tone: 'danger' | 'warning' | 'emerald' | 'indigo';
  inputConfig?: {
    label: string;
    placeholder?: string;
    initialValue?: string;
    required?: boolean;
    minLength?: number;
    presets?: string[];
  };
  onConfirm: (inputValue?: string) => Promise<void> | void;
}

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  usuarios,
  onSaveUsuario,
  onToggleStatusUsuario,
  onRecusarServidorInativo,
  secretarias,
  onSaveSecretaria,
  realApiUrl,
  useRealApi,
  showToast,
  pedidosRecuperacao = [],
  onAprovarPedidoRecuperacao,
  onCancelarPedidoRecuperacao,
  numeracoes = [],
  configNumeracao = DEFAULT_CONFIG_NUMERACAO,
  onDefinirMarcoZero,
  onSalvarConfigNumeracao,
  initialTab,
  onTabChange,
  initialMarcoZeroContext,
  funcoesOficiais,
  onSaveFuncoesOficiais,
  cargosEfetivos,
  onSaveCargosEfetivos
}) => {
  const [activeTab, setActiveTab] = useState<'servidores' | 'secretarias' | 'pedidos' | 'numeracao' | 'quadro_vagas' | 'auditoria'>(initialTab || 'servidores');
  const marcoZeroFormRef = useRef<HTMLDivElement | null>(null);

  // Estado da aba Numeração & Implantação (Marco Zero + Sequência Global Municipal)
  const anoCorrentePadrao = String(new Date().getFullYear());
  const defaultSecOption = useMemo(() => {
    const gp = secretarias.find(s => s.sigla === 'GP' || s.sigla === 'SEGOV' || s.nome.toLowerCase().includes('gabinete'));
    if (gp) return `${gp.nome} (${gp.sigla})`;
    return secretarias[0] ? `${secretarias[0].nome} (${secretarias[0].sigla})` : 'Gabinete do Prefeito';
  }, [secretarias]);

  const [mzSecretaria, setMzSecretaria] = useState<string>(defaultSecOption);
  const [mzDepartamento, setMzDepartamento] = useState<string>('Gabinete');
  const [mzTipoDocumento, setMzTipoDocumento] = useState<string>('OFICIO');
  const [mzAno, setMzAno] = useState<string>(anoCorrentePadrao);
  const [mzUltimoNumero, setMzUltimoNumero] = useState<string>('');
  const [mzObservacao, setMzObservacao] = useState<string>('Último número emitido no livro anterior (implantação)');
  const [mzIncluirSigla, setMzIncluirSigla] = useState<boolean>(false);
  const [isSavingMarcoZero, setIsSavingMarcoZero] = useState<boolean>(false);

  const [mapaSecFiltro, setMapaSecFiltro] = useState<string>(defaultSecOption);
  const [tiposGlobaisDraft, setTiposGlobaisDraft] = useState<string[]>(
    configNumeracao?.tiposSequenciaGlobal || DEFAULT_CONFIG_NUMERACAO.tiposSequenciaGlobal
  );
  const [isSavingConfigNum, setIsSavingConfigNum] = useState<boolean>(false);

  useEffect(() => {
    setTiposGlobaisDraft(configNumeracao?.tiposSequenciaGlobal || DEFAULT_CONFIG_NUMERACAO.tiposSequenciaGlobal);
  }, [configNumeracao]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (initialMarcoZeroContext?.secretaria) {
      setMzSecretaria(initialMarcoZeroContext.secretaria);
      setMapaSecFiltro(initialMarcoZeroContext.secretaria);
    }
    if (initialMarcoZeroContext?.tipoDocumento) {
      setMzTipoDocumento(initialMarcoZeroContext.tipoDocumento);
    }
  }, [isOpen, initialTab, initialMarcoZeroContext]);

  useEffect(() => {
    if (!isOpen) return;
    onTabChange?.(activeTab);
  }, [isOpen, activeTab]);

  const mzIsGlobal = useMemo(
    () => isTipoSequenciaGlobal(mzTipoDocumento, { tiposSequenciaGlobal: tiposGlobaisDraft }),
    [mzTipoDocumento, tiposGlobaisDraft]
  );

  const mzMaiorAtual = useMemo(
    () => getMaxSequentialForSecretaria(
      numeracoes,
      mzTipoDocumento,
      mzSecretaria,
      mzAno,
      secretarias,
      { tiposSequenciaGlobal: tiposGlobaisDraft }
    ),
    [numeracoes, mzTipoDocumento, mzSecretaria, mzAno, secretarias, tiposGlobaisDraft]
  );

  const mzNumeroParsed = parseInt(mzUltimoNumero, 10);
  const mzNumeroValido = !isNaN(mzNumeroParsed) && mzNumeroParsed >= 1 && mzNumeroParsed > mzMaiorAtual;
  const mzSigla = getSecretariaSigla(mzSecretaria, secretarias);
  const mzPreviewMarco = mzNumeroValido
    ? formatNumeroOficialSequencial(mzNumeroParsed, mzAno, mzIncluirSigla, mzSigla, mzIsGlobal)
    : '---';
  const mzPreviewProximo = mzNumeroValido
    ? formatNumeroOficialSequencial(mzNumeroParsed + 1, mzAno, mzIncluirSigla, mzSigla, mzIsGlobal)
    : formatNumeroOficialSequencial(mzMaiorAtual + 1, mzAno, mzIncluirSigla, mzSigla, mzIsGlobal);

  const handleToggleTipoGlobal = (tipo: string) => {
    setTiposGlobaisDraft(prev => {
      const exists = prev.includes(tipo);
      return exists ? prev.filter(t => t !== tipo) : [...prev, tipo];
    });
  };

  const handleSalvarRegrasNumeracao = async () => {
    if (!onSalvarConfigNumeracao) return;
    setIsSavingConfigNum(true);
    try {
      await onSalvarConfigNumeracao({
        tiposSequenciaGlobal: tiposGlobaisDraft,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: currentUser.nome
      });
    } finally {
      setIsSavingConfigNum(false);
    }
  };

  const handleSubmitMarcoZero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onDefinirMarcoZero) return;
    if (isNaN(mzNumeroParsed) || mzNumeroParsed < 1) {
      showToast('Informe um número inteiro válido (maior ou igual a 1).', 'Atenção', true);
      return;
    }
    if (mzNumeroParsed <= mzMaiorAtual) {
      showToast(
        `O número informado (${String(mzNumeroParsed).padStart(3, '0')}/${mzAno}) precisa ser maior que o maior número já registrado (${String(mzMaiorAtual).padStart(3, '0')}/${mzAno}).`,
        'Número Já Ultrapassado',
        true
      );
      return;
    }
    setIsSavingMarcoZero(true);
    try {
      const ok = await onDefinirMarcoZero({
        secretaria: mzSecretaria,
        departamento: mzDepartamento.trim() || 'Gabinete',
        tipoDocumento: mzTipoDocumento,
        ultimoNumero: mzNumeroParsed,
        ano: mzAno,
        observacao: mzObservacao.trim() || 'Último número emitido no livro anterior (implantação)',
        incluirSigla: mzIncluirSigla && !mzIsGlobal
      });
      if (ok) {
        setMzUltimoNumero('');
      }
    } finally {
      setIsSavingMarcoZero(false);
    }
  };
  
  // Filtros de servidores
  const [buscaServidor, setBuscaServidor] = useState('');
  const [filtroSec, setFiltroSec] = useState('TODAS');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ATIVOS' | 'INATIVOS'>('TODOS');

  // Filtros da aba Quadro de Vagas (Anexo I, Anexo II e Efetivos)
  const [qvCategoria, setQvCategoria] = useState<'TODOS' | 'SUBSIDIO' | 'COMISSAO' | 'FG' | 'EFETIVOS'>('TODOS');
  const [qvSecretaria, setQvSecretaria] = useState<string>('TODAS');
  const [qvBusca, setQvBusca] = useState<string>('');
  const [qvStatusEfetivo, setQvStatusEfetivo] = useState<'TODOS' | 'ATIVO' | 'EM_EXTINCAO' | 'EXTINTO'>('TODOS');

  // Modal interno de Edição/Criação de Servidor
  const [isFormServidorOpen, setIsFormServidorOpen] = useState(false);
  const [editingServidor, setEditingServidor] = useState<Partial<UsuarioSistema>>({});
  const [senhaInput, setSenhaInput] = useState('');
  const [isSavingServidor, setIsSavingServidor] = useState(false);
  const [isOutroDeptoAdmin, setIsOutroDeptoAdmin] = useState(false);
  const [isOutroCargoAdmin, setIsOutroCargoAdmin] = useState(false);
  const [isOutroMzDepto, setIsOutroMzDepto] = useState(false);

  // Listas oficiais dinâmicas (com fallback para as constantes da Lei)
  const listaFuncoesOficiais = useMemo(
    () => (funcoesOficiais && funcoesOficiais.length > 0 ? funcoesOficiais : TODAS_FUNCOES_ANEXOS_I_II),
    [funcoesOficiais]
  );
  const listaCargosEfetivos = useMemo(
    () => (cargosEfetivos && cargosEfetivos.length > 0 ? cargosEfetivos : CARGOS_PREFEITURA_BASE),
    [cargosEfetivos]
  );

  // Modal interno de Edição/Criação de Cargo/Função Oficial (Anexos I e II)
  const [isFormFuncaoOpen, setIsFormFuncaoOpen] = useState(false);
  const [editingFuncaoId, setEditingFuncaoId] = useState<string | null>(null);
  const [editingFuncao, setEditingFuncao] = useState<{
    nome: string;
    categoria: CategoriaFuncaoOficial;
    simbologia: SimbologiaOficial;
    vagas: number;
    secretariaSigla: string;
    secretariaNome: string;
    percentualFG: string;
    observacao: string;
  }>({
    nome: '',
    categoria: 'COMISSAO',
    simbologia: 'CC-03',
    vagas: 1,
    secretariaSigla: 'SMA',
    secretariaNome: 'Secretaria Municipal de Administração',
    percentualFG: '',
    observacao: ''
  });

  // Modal interno de Edição/Criação de Cargo Efetivo (* / **)
  const [isFormEfetivoOpen, setIsFormEfetivoOpen] = useState(false);
  const [editingEfetivoOriginal, setEditingEfetivoOriginal] = useState<string | null>(null);
  const [editingEfetivoNome, setEditingEfetivoNome] = useState('');
  const [editingEfetivoStatus, setEditingEfetivoStatus] = useState<StatusCargoEfetivo>('ATIVO');

  // Modal interno de Redefinição de Senha
  const [isResetSenhaOpen, setIsResetSenhaOpen] = useState(false);
  const [resetMatricula, setResetMatricula] = useState('');
  const [resetNome, setResetNome] = useState('');
  const [novaSenhaReset, setNovaSenhaReset] = useState('');

  // Modal interno de Secretaria/Departamento
  const [isFormSecOpen, setIsFormSecOpen] = useState(false);
  const [editingSec, setEditingSec] = useState<Partial<SecretariaItem>>({});
  const [novoDeptInput, setNovoDeptInput] = useState('');

  // Modal interno de Confirmação / Entrada (substitui window.confirm / window.prompt bloqueados em iframe)
  const [confirmDialog, setConfirmDialog] = useState<AdminConfirmDialogState | null>(null);
  const [confirmInputValue, setConfirmInputValue] = useState('');
  const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);

  const openConfirmDialog = (cfg: AdminConfirmDialogState) => {
    setConfirmInputValue(cfg.inputConfig?.initialValue || '');
    setIsConfirmSubmitting(false);
    setConfirmDialog(cfg);
  };

  const handleConfirmDialogSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!confirmDialog || isConfirmSubmitting) return;

    const trimmedVal = confirmInputValue.trim();
    if (confirmDialog.inputConfig) {
      if (confirmDialog.inputConfig.required && !trimmedVal) {
        showToast(`Preencha o campo "${confirmDialog.inputConfig.label}".`, 'Atenção', true);
        return;
      }
      if (confirmDialog.inputConfig.minLength && trimmedVal.length < confirmDialog.inputConfig.minLength) {
        showToast(`O campo deve ter pelo menos ${confirmDialog.inputConfig.minLength} caracteres.`, 'Atenção', true);
        return;
      }
    }

    setIsConfirmSubmitting(true);
    try {
      await confirmDialog.onConfirm(confirmDialog.inputConfig ? trimmedVal : undefined);
      setConfirmDialog(null);
      setConfirmInputValue('');
    } finally {
      setIsConfirmSubmitting(false);
    }
  };

  // Métricas
  const totalServidores = usuarios.length;
  const ativosCount = usuarios.filter(u => u.ativo).length;
  const inativosCount = totalServidores - ativosCount;
  const adminCount = usuarios.filter(u => u.nivel === 'ADMIN').length;
  const pendingMatriculasSet = new Set(
    (pedidosRecuperacao || [])
      .filter(p => p.status === 'PENDENTE')
      .map(p => String(p.matricula).trim().toLowerCase())
  );
  const servidoresPendentesSemPedido = usuarios.filter(
    u => !u.ativo && !pendingMatriculasSet.has(String(u.matricula).trim().toLowerCase())
  );
  const pendentesCount =
    (pedidosRecuperacao || []).filter(p => p.status === 'PENDENTE').length +
    servidoresPendentesSemPedido.length;

  // Filtragem
  const servidoresFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      if (filtroStatus === 'ATIVOS' && !u.ativo) return false;
      if (filtroStatus === 'INATIVOS' && u.ativo) return false;
      if (filtroSec !== 'TODAS') {
        const secNorm = (u.secretaria || '').toUpperCase();
        if (!secNorm.includes(filtroSec.toUpperCase())) return false;
      }
      if (buscaServidor.trim()) {
        const q = buscaServidor.toLowerCase().trim();
        const nomeMatch = (u.nome || '').toLowerCase().includes(q);
        const matMatch = String(u.matricula || '').toLowerCase().includes(q);
        const secMatch = (u.secretaria || '').toLowerCase().includes(q);
        const cargoMatch = (u.cargo || '').toLowerCase().includes(q);
        const fgMatch = (u.funcaoGratificada || '').toLowerCase().includes(q);
        return nomeMatch || matMatch || secMatch || cargoMatch || fgMatch;
      }
      return true;
    });
  }, [usuarios, buscaServidor, filtroSec, filtroStatus]);

  // Estatísticas consolidadas do Quadro de Vagas (Anexo I, Anexo II e Efetivos)
  const quadroVagasStats = useMemo(() => {
    const resolveSigla = (sec?: string) => getSecretariaSigla(sec, secretarias);
    let totalSS = 0;
    let ocupSS = 0;
    let totalCC = 0;
    let ocupCC = 0;
    let totalFG = 0;
    let ocupFG = 0;

    const ocupacaoPorId = new Map<string, UsuarioSistema[]>();
    listaFuncoesOficiais.forEach(item => {
      const ocupantes = usuarios.filter(u => servidorOcupaFuncaoOficial(u, item, resolveSigla));
      ocupacaoPorId.set(item.id, ocupantes);
      if (item.categoria === 'SUBSIDIO') {
        totalSS += item.vagas;
        ocupSS += ocupantes.length;
      } else if (item.categoria === 'COMISSAO') {
        totalCC += item.vagas;
        ocupCC += ocupantes.length;
      } else {
        totalFG += item.vagas;
        ocupFG += ocupantes.length;
      }
    });

    let efetivosAtivos = 0;
    let efetivosEmExtincao = 0;
    let efetivosExtintos = 0;
    listaCargosEfetivos.forEach(c => {
      const st = getStatusCargoEfetivo(c).status;
      if (st === 'EM_EXTINCAO') efetivosEmExtincao++;
      else if (st === 'EXTINTO') efetivosExtintos++;
      else efetivosAtivos++;
    });

    return {
      totalSS,
      ocupSS,
      totalCC,
      ocupCC,
      totalFG,
      ocupFG,
      totalAnexos: totalSS + totalCC + totalFG,
      ocupAnexos: ocupSS + ocupCC + ocupFG,
      efetivosTotal: listaCargosEfetivos.length,
      efetivosAtivos,
      efetivosEmExtincao,
      efetivosExtintos,
      ocupacaoPorId
    };
  }, [usuarios, secretarias, listaFuncoesOficiais, listaCargosEfetivos]);

  // Funções do Anexo I e II agrupadas para o formulário de edição de servidor
  const funcoesAgrupadasForm = useMemo(() => {
    const secBase = editingServidor.secretaria || (editingServidor.secretarias && editingServidor.secretarias[0]) || 'SMA';
    const sigla = getSecretariaSigla(secBase, secretarias);
    return {
      sigla,
      ...agruparFuncoesPorSecretaria(sigla, listaFuncoesOficiais)
    };
  }, [editingServidor.secretaria, editingServidor.secretarias, secretarias, listaFuncoesOficiais]);

  // Sugestões em combo para Cargo Efetivo e Departamento baseadas no quadro oficial da Prefeitura + planilha
  const cargosSugeridosAdmin = useMemo(() => {
    return getCargosSugeridosUnificados(usuarios, listaCargosEfetivos);
  }, [usuarios, listaCargosEfetivos]);

  const cargosAgrupadosAdmin = useMemo(() => {
    const ativos: string[] = [];
    const emExtincao: string[] = [];
    const extintos: string[] = [];
    cargosSugeridosAdmin.forEach(c => {
      const st = getStatusCargoEfetivo(c).status;
      if (st === 'EM_EXTINCAO') emExtincao.push(c);
      else if (st === 'EXTINTO') extintos.push(c);
      else ativos.push(c);
    });
    return { ativos, emExtincao, extintos };
  }, [cargosSugeridosAdmin]);

  const departamentosMzCombo = useMemo(() => {
    const set = new Set<string>(['Gabinete']);
    const siglaAlvo = getSecretariaSigla(mzSecretaria, secretarias);
    secretarias.forEach(s => {
      if (s.sigla === siglaAlvo || mzSecretaria.includes(s.nome) || mzSecretaria.includes(s.sigla)) {
        (s.departamentos || []).forEach(d => set.add(d));
      }
    });
    usuarios.forEach(u => {
      if (!u.departamento?.trim()) return;
      const uSec = `${u.secretaria || ''} ${(u.secretarias || []).join(' ')}`;
      if (uSec.includes(siglaAlvo) || uSec.includes(mzSecretaria)) {
        set.add(u.departamento.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [mzSecretaria, secretarias, usuarios]);

  const departamentosSugeridosAdmin = useMemo(() => {
    const set = new Set<string>(['Gabinete']);
    const secSelecionadas = (editingServidor.secretarias && editingServidor.secretarias.length > 0)
      ? editingServidor.secretarias
      : (editingServidor.secretaria ? [editingServidor.secretaria] : []);

    secretarias.forEach(s => {
      const match = secSelecionadas.length === 0 || secSelecionadas.some(
        sel => sel.includes(s.sigla) || sel.includes(s.nome)
      );
      if (match && s.departamentos) {
        s.departamentos.forEach(d => set.add(d));
      }
    });

    usuarios.forEach(u => {
      if (!u.departamento || !u.departamento.trim()) return;
      if (secSelecionadas.length === 0) {
        set.add(u.departamento.trim());
      } else {
        const uSecText = ((u.secretaria || '') + ' ' + (u.secretarias || []).join(' ')).toLowerCase();
        const match = secSelecionadas.some(sel => uSecText.includes(sel.toLowerCase().replace(/\s*\([^)]+\)\s*$/, '').trim()) || uSecText.includes((sel.match(/\(([^)]+)\)/)?.[1] || '').toLowerCase()));
        if (match) set.add(u.departamento.trim());
      }
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [secretarias, usuarios, editingServidor.secretaria, editingServidor.secretarias]);

  if (!isOpen) return null;

  // Handlers para Servidor
  const handleOpenNovoServidor = () => {
    setEditingServidor({
      matricula: '',
      nome: '',
      cargo: '',
      funcaoGratificada: '',
      secretaria: 'Secretaria Municipal de Administração (SMA)',
      secretarias: ['Secretaria Municipal de Administração (SMA)'],
      departamento: '',
      nivel: 'PADRAO',
      ativo: true,
      filtroAcessibilidade: {
        acessarSecretaria: false,
        acessarDepartamento: true,
        acessarProprios: true
      }
    });
    setSenhaInput('');
    setIsOutroDeptoAdmin(false);
    setIsOutroCargoAdmin(false);
    setIsFormServidorOpen(true);
  };

  const handleVincularVagaOficial = (item: CargoComissionadoOuFG) => {
    const siglaAlvo = item.secretariaSigla === 'ALTA_ADM' ? 'SMA' : item.secretariaSigla;
    const secCanonical = resolveCanonicalSecretariaName(siglaAlvo, secretarias);
    const deptoInferido = inferirDepartamentoDaFuncao(item.nome) || (item.categoria === 'SUBSIDIO' ? 'Gabinete' : '');
    const isAltoEscalao = item.categoria === 'SUBSIDIO' || item.simbologia === 'CC-01';

    setEditingServidor({
      matricula: '',
      nome: '',
      cargo: '',
      funcaoGratificada: formatCargoComSimbologia(item),
      secretaria: secCanonical,
      secretarias: [secCanonical],
      departamento: deptoInferido,
      nivel: isAltoEscalao ? 'EDITOR' : 'PADRAO',
      ativo: true,
      filtroAcessibilidade: {
        acessarSecretaria: isAltoEscalao,
        acessarDepartamento: true,
        acessarProprios: true
      }
    });
    setSenhaInput('');
    setIsOutroDeptoAdmin(false);
    setIsOutroCargoAdmin(false);
    setIsFormServidorOpen(true);
  };

  const handleOpenEditarServidor = (u: UsuarioSistema) => {
    setEditingServidor({
      ...u,
      filtroAcessibilidade: getEffectiveAccessibilityFilter(u)
    });
    setSenhaInput('');
    setIsOutroDeptoAdmin(false);
    setIsOutroCargoAdmin(false);
    setIsFormServidorOpen(true);
  };

  // Handlers de Edição do Quadro Oficial de Cargos e Funções (Anexos I, II e Efetivos)
  const handleOpenNovaFuncao = () => {
    const secPadrao = qvSecretaria !== 'TODAS' && qvSecretaria !== 'ALTA_ADM'
      ? secretarias.find(s => s.sigla === qvSecretaria)
      : secretarias.find(s => s.sigla === 'SMA') || secretarias[0];
    const catPadrao: CategoriaFuncaoOficial =
      qvCategoria === 'SUBSIDIO' || qvCategoria === 'FG' ? qvCategoria : 'COMISSAO';
    setEditingFuncaoId(null);
    setEditingFuncao({
      nome: '',
      categoria: catPadrao,
      simbologia: catPadrao === 'SUBSIDIO' ? 'SS' : catPadrao === 'FG' ? 'FG' : 'CC-03',
      vagas: 1,
      secretariaSigla: catPadrao === 'SUBSIDIO' ? 'ALTA_ADM' : (secPadrao?.sigla || 'SMA'),
      secretariaNome: catPadrao === 'SUBSIDIO' ? 'Alta Administração (Subsídio)' : (secPadrao?.nome || 'Secretaria Municipal de Administração'),
      percentualFG: catPadrao === 'FG' ? '10% a 40%' : '',
      observacao: ''
    });
    setIsFormFuncaoOpen(true);
  };

  const handleOpenEditarFuncao = (item: CargoComissionadoOuFG) => {
    setEditingFuncaoId(item.id);
    setEditingFuncao({
      nome: item.nome,
      categoria: item.categoria,
      simbologia: item.simbologia,
      vagas: item.vagas,
      secretariaSigla: item.secretariaSigla,
      secretariaNome: item.secretariaNome,
      percentualFG: item.percentualFG || '',
      observacao: item.observacao || ''
    });
    setIsFormFuncaoOpen(true);
  };

  const handleSalvarFuncaoOficial = (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = editingFuncao.nome.trim();
    if (!nomeLimpo) {
      showToast('Informe a denominação oficial do cargo ou função.', 'Atenção', true);
      return;
    }
    const vagasValidas = Math.max(1, Number(editingFuncao.vagas) || 1);
    const secMatch = secretarias.find(s => s.sigla === editingFuncao.secretariaSigla);
    const secNomeFinal =
      editingFuncao.secretariaSigla === 'ALTA_ADM'
        ? 'Alta Administração (Subsídio)'
        : (secMatch?.nome || editingFuncao.secretariaNome || editingFuncao.secretariaSigla);

    const novoItem: CargoComissionadoOuFG = {
      id: editingFuncaoId || `CUSTOM-${Date.now().toString(36).toUpperCase()}`,
      nome: nomeLimpo,
      categoria: editingFuncao.categoria,
      simbologia: (editingFuncao.simbologia.trim().toUpperCase() || (editingFuncao.categoria === 'FG' ? 'FG' : editingFuncao.categoria === 'SUBSIDIO' ? 'SS' : 'CC-03')) as SimbologiaOficial,
      vagas: vagasValidas,
      secretariaSigla: editingFuncao.secretariaSigla,
      secretariaNome: secNomeFinal,
      ...(editingFuncao.categoria === 'FG' && editingFuncao.percentualFG.trim() ? { percentualFG: editingFuncao.percentualFG.trim() } : {}),
      ...(editingFuncao.observacao.trim() ? { observacao: editingFuncao.observacao.trim() } : {})
    };

    const atualizada = editingFuncaoId
      ? listaFuncoesOficiais.map(f => (f.id === editingFuncaoId ? novoItem : f))
      : [novoItem, ...listaFuncoesOficiais];

    onSaveFuncoesOficiais?.(atualizada);
    setIsFormFuncaoOpen(false);
    setEditingFuncaoId(null);
    showToast(
      editingFuncaoId
        ? `Cargo/função "${nomeLimpo}" atualizado no Quadro Oficial!`
        : `Novo cargo/função "${nomeLimpo}" adicionado ao Quadro Oficial!`
    );
  };

  const handleExcluirFuncaoOficial = () => {
    if (!editingFuncaoId) return;
    const alvo = listaFuncoesOficiais.find(f => f.id === editingFuncaoId);
    if (!alvo) return;
    openConfirmDialog({
      title: 'Remover Cargo / Função do Quadro Oficial',
      message: `Deseja remover "${alvo.nome} (${alvo.simbologia})" do Quadro Oficial de Cargos e Funções?`,
      detail: 'Você poderá restaurar o quadro padrão a qualquer momento usando o botão Restaurar Padrão.',
      confirmLabel: 'Remover Cargo/Função',
      tone: 'danger',
      onConfirm: () => {
        const atualizada = listaFuncoesOficiais.filter(f => f.id !== editingFuncaoId);
        onSaveFuncoesOficiais?.(atualizada);
        setIsFormFuncaoOpen(false);
        setEditingFuncaoId(null);
        showToast(`Cargo/função "${alvo.nome}" removido do Quadro Oficial.`);
      }
    });
  };

  const handleOpenNovoEfetivo = () => {
    setEditingEfetivoOriginal(null);
    setEditingEfetivoNome('');
    setEditingEfetivoStatus('ATIVO');
    setIsFormEfetivoOpen(true);
  };

  const handleOpenEditarEfetivo = (nomeOriginal: string) => {
    const info = getStatusCargoEfetivo(nomeOriginal);
    setEditingEfetivoOriginal(nomeOriginal);
    setEditingEfetivoNome(info.nomeLimpo);
    setEditingEfetivoStatus(info.status);
    setIsFormEfetivoOpen(true);
  };

  const handleSalvarEfetivo = (e: React.FormEvent) => {
    e.preventDefault();
    const formatado = formatarCargoEfetivoComStatus(editingEfetivoNome, editingEfetivoStatus);
    if (!formatado) {
      showToast('Informe a denominação oficial do cargo efetivo.', 'Atenção', true);
      return;
    }

    const existeDuplicado = listaCargosEfetivos.some(
      c => c.toUpperCase() === formatado.toUpperCase() && c !== editingEfetivoOriginal
    );
    if (existeDuplicado) {
      showToast(`O cargo efetivo "${formatado}" já existe na relação oficial.`, 'Registro Duplicado', true);
      return;
    }

    const atualizada = editingEfetivoOriginal
      ? listaCargosEfetivos.map(c => (c === editingEfetivoOriginal ? formatado : c))
      : [...listaCargosEfetivos, formatado];

    atualizada.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    onSaveCargosEfetivos?.(atualizada);
    setIsFormEfetivoOpen(false);
    setEditingEfetivoOriginal(null);
    showToast(
      editingEfetivoOriginal
        ? `Cargo efetivo atualizado para "${formatado}"!`
        : `Cargo efetivo "${formatado}" adicionado ao Quadro Oficial!`
    );
  };

  const handleExcluirEfetivo = () => {
    if (!editingEfetivoOriginal) return;
    const nomeRemover = editingEfetivoOriginal;
    openConfirmDialog({
      title: 'Remover Cargo Efetivo',
      message: `Deseja remover o cargo efetivo "${nomeRemover}" da lista oficial?`,
      detail: 'Servidores já cadastrados com este cargo mantêm seu registro histórico intacto.',
      confirmLabel: 'Remover Cargo Efetivo',
      tone: 'danger',
      onConfirm: () => {
        const atualizada = listaCargosEfetivos.filter(c => c !== nomeRemover);
        onSaveCargosEfetivos?.(atualizada);
        setIsFormEfetivoOpen(false);
        setEditingEfetivoOriginal(null);
        showToast(`Cargo efetivo "${nomeRemover}" removido.`);
      }
    });
  };

  const handleRestaurarQuadroPadrao = () => {
    if (qvCategoria === 'EFETIVOS') {
      openConfirmDialog({
        title: 'Restaurar Cargos Efetivos Padrão',
        message: 'Restaurar a relação padrão de Cargos Efetivos da Prefeitura Municipal de Rio Claro – RJ?',
        detail: 'Eventuais edições locais nesta lista serão substituídas pela relação oficial padrão.',
        confirmLabel: 'Restaurar Padrão',
        tone: 'warning',
        onConfirm: () => {
          onSaveCargosEfetivos?.(CARGOS_PREFEITURA_BASE);
          showToast('Relação padrão de Cargos Efetivos restaurada!');
        }
      });
    } else {
      openConfirmDialog({
        title: 'Restaurar Quadro Oficial (Anexos I e II)',
        message: 'Restaurar a relação padrão de Cargos em Subsídio, Comissão (Anexo I) e Funções Gratificadas (Anexo II)?',
        detail: 'Eventuais alterações manuais nos Anexos I e II serão revertidas ao padrão oficial.',
        confirmLabel: 'Restaurar Padrão',
        tone: 'warning',
        onConfirm: () => {
          onSaveFuncoesOficiais?.(TODAS_FUNCOES_ANEXOS_I_II);
          showToast('Quadro oficial padrão dos Anexos I e II restaurado!');
        }
      });
    }
  };

  const handleExportarQuadroVagasCSV = () => {
    if (qvCategoria === 'EFETIVOS') {
      const header = ['CargoEfetivo', 'SituacaoLegal', 'RegistroOficial', 'ServidoresNoSistema'];
      const rows = listaCargosEfetivos.map(nome => {
        const info = getStatusCargoEfetivo(nome);
        const qtd = usuarios.filter(
          u => u.ativo !== false && u.cargo && u.cargo.trim().toUpperCase() === nome.trim().toUpperCase()
        ).length;
        return [
          `"${info.nomeLimpo.replace(/"/g, '""')}"`,
          `"${info.shortBadge}"`,
          `"${nome.replace(/"/g, '""')}"`,
          qtd
        ];
      });
      const csvContent = '\uFEFF' + [header.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quadro_Cargos_Efetivos_PMRC_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Relatório CSV do Quadro Efetivo exportado com sucesso!');
      return;
    }

    const header = ['CargoOuFuncao', 'Categoria', 'Simbologia', 'SiglaOrgao', 'SecretariaOrgao', 'VagasLei', 'Ocupadas', 'Disponiveis', 'PercentualFG', 'Ocupantes', 'Observacao'];
    const rows = listaFuncoesOficiais.map(item => {
      const ocupantes = quadroVagasStats.ocupacaoPorId.get(item.id) || [];
      const livres = item.vagas - ocupantes.length;
      return [
        `"${item.nome.replace(/"/g, '""')}"`,
        item.categoria,
        item.simbologia,
        item.secretariaSigla,
        `"${item.secretariaNome.replace(/"/g, '""')}"`,
        item.vagas,
        ocupantes.length,
        livres,
        `"${(item.percentualFG || '').replace(/"/g, '""')}"`,
        `"${ocupantes.map(o => `${o.nome} (${o.matricula})`).join(' | ').replace(/"/g, '""')}"`,
        `"${(item.observacao || '').replace(/"/g, '""')}"`
      ];
    });
    const csvContent = '\uFEFF' + [header.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quadro_Vagas_Anexos_I_II_PMRC_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Relatório CSV de Vagas (Anexos I e II) exportado com sucesso!');
  };

  const handleSalvarServidorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServidor.matricula || !editingServidor.nome) {
      showToast('Preencha a matrícula e o nome completo do servidor.', 'Atenção', true);
      return;
    }

    setIsSavingServidor(true);
    try {
      const ok = await onSaveUsuario(editingServidor, senhaInput);
      if (ok) {
        setIsFormServidorOpen(false);
        setEditingServidor({});
        setSenhaInput('');
      }
    } finally {
      setIsSavingServidor(false);
    }
  };

  const handleOpenResetSenha = (u: UsuarioSistema) => {
    setResetMatricula(u.matricula);
    setResetNome(u.nome);
    setNovaSenhaReset('');
    setIsResetSenhaOpen(true);
  };

  const handleConfirmarResetSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaSenhaReset.trim()) {
      showToast('Digite a nova senha de acesso.', 'Atenção', true);
      return;
    }
    const serv = usuarios.find(u => u.matricula === resetMatricula);
    if (!serv) return;

    const ok = await onSaveUsuario(serv, novaSenhaReset.trim());
    if (ok) {
      setIsResetSenhaOpen(false);
      setNovaSenhaReset('');
      showToast(`Senha do servidor(a) ${resetNome} atualizada com sucesso!`);
    }
  };

  const handleToggleStatus = (u: UsuarioSistema) => {
    const isDesativando = Boolean(u.ativo);
    if (String(u.matricula).trim() === String(currentUser.matricula).trim() && isDesativando) {
      showToast('Você não pode desativar seu próprio usuário de administrador logado.', 'Ação Bloqueada', true);
      return;
    }
    if (String(u.matricula).trim() === '1001' && isDesativando) {
      showToast('O administrador mestre (matrícula 1001) é protegido e não pode ser desativado.', 'Ação Bloqueada', true);
      return;
    }

    openConfirmDialog({
      title: isDesativando ? 'Desativar Acesso do Servidor' : 'Reativar Acesso do Servidor',
      message: `Deseja realmente ${isDesativando ? 'desativar' : 'reativar'} o acesso de ${u.nome} (Matrícula: ${u.matricula})?`,
      detail: isDesativando
        ? `Lotação: ${u.secretaria || 'Não informada'}. Enquanto inativo, o servidor não conseguirá autenticar-se no sistema.`
        : `Lotação: ${u.secretaria || 'Não informada'}. O servidor voltará a acessar o sistema imediatamente.`,
      confirmLabel: isDesativando ? 'Confirmar Desativação' : 'Confirmar Reativação',
      tone: isDesativando ? 'danger' : 'emerald',
      onConfirm: async () => {
        await onToggleStatusUsuario(u.matricula, !u.ativo);
      }
    });
  };

  const handleOpenRecusarServidorInativo = (srv: UsuarioSistema) => {
    if (!onRecusarServidorInativo) return;
    openConfirmDialog({
      title: 'Recusar Cadastro Pendente',
      message: `Deseja recusar e remover o cadastro de ${srv.nome} (Matrícula: ${srv.matricula})?`,
      detail: `Lotação informada: ${srv.secretaria || 'Não informada'}${srv.departamento ? ` — ${srv.departamento}` : ''}. O registro será removido da fila de liberação e registrado na auditoria.`,
      confirmLabel: 'Confirmar Recusa',
      tone: 'danger',
      inputConfig: {
        label: 'Motivo da recusa (opcional — registrado na auditoria)',
        placeholder: 'Ex: Matrícula incorreta, cadastro duplicado ou servidor não localizado no DRH',
        initialValue: '',
        required: false,
        presets: [
          'Matrícula incorreta',
          'Cadastro duplicado',
          'Servidor não localizado no DRH',
          'Lotação divergente'
        ]
      },
      onConfirm: async (motivo) => {
        await onRecusarServidorInativo(srv.matricula, motivo);
      }
    });
  };

  // Exportar Servidores em CSV
  const handleExportarCSV = () => {
    const header = ['ID', 'Matricula', 'Nome', 'Cargo', 'Secretaria', 'Departamento', 'NivelAcesso', 'Status'];
    const rows = usuarios.map(u => [
      u.id || `USR-${u.matricula}`,
      `"${u.matricula}"`,
      `"${u.nome.replace(/"/g, '""')}"`,
      `"${(u.cargo || '').replace(/"/g, '""')}"`,
      `"${(u.secretaria || '').replace(/"/g, '""')}"`,
      `"${(u.departamento || '').replace(/"/g, '""')}"`,
      u.nivel,
      u.ativo ? 'ATIVO' : 'INATIVO'
    ]);
    const csvContent = '\uFEFF' + [header.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Servidores_PMRC_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Relatório de servidores exportado com sucesso!');
  };

  // Handlers para Secretaria/Departamento
  const handleSalvarSecSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSec.sigla || !editingSec.nome) {
      showToast('Sigla e nome da secretaria são obrigatórios.', 'Atenção', true);
      return;
    }
    onSaveSecretaria({
      sigla: editingSec.sigla.toUpperCase().trim(),
      nome: editingSec.nome.trim(),
      titular: editingSec.titular?.trim() || '',
      email: editingSec.email?.trim() || '',
      telefone: editingSec.telefone?.trim() || '',
      departamentos: editingSec.departamentos || []
    });
    setIsFormSecOpen(false);
    setEditingSec({});
    showToast(`Secretaria ${editingSec.sigla} salva com sucesso!`);
  };

  const handleAddDept = () => {
    if (!novoDeptInput.trim()) return;
    const current = editingSec.departamentos || [];
    if (!current.includes(novoDeptInput.trim())) {
      setEditingSec({ ...editingSec, departamentos: [...current, novoDeptInput.trim()] });
    }
    setNovoDeptInput('');
  };

  const handleRemoveDept = (dept: string) => {
    const current = editingSec.departamentos || [];
    setEditingSec({ ...editingSec, departamentos: current.filter(d => d !== dept) });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-5 animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:w-[96vw] sm:max-w-[1360px] shadow-2xl flex flex-col h-[96dvh] sm:h-[92dvh] max-h-[96dvh] overflow-hidden">
        
        {/* Cabeçalho do Painel Admin */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold">Painel de Administração Municipal</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500 text-white uppercase tracking-wider">
                  Admin Master
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestão central de Servidores, Senhas, Secretarias e Departamentos • PMRC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Métricas Rápidas no Topo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center space-x-3 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Servidores Ativos</span>
              <strong className="text-base font-extrabold text-slate-800 dark:text-slate-100">{ativosCount} <span className="text-xs font-normal text-slate-400">/ {totalServidores}</span></strong>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center space-x-3 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Secretarias Cadastradas</span>
              <strong className="text-base font-extrabold text-slate-800 dark:text-slate-100">{secretarias.length}</strong>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center space-x-3 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Perfil Administrador</span>
              <strong className="text-base font-extrabold text-slate-800 dark:text-slate-100">{adminCount}</strong>
            </div>
          </div>

          {/* Card Especial de Pedidos de Recuperação de Senha */}
          <div 
            onClick={() => setActiveTab('pedidos')}
            className={`p-3 bg-white dark:bg-slate-800 rounded-xl border flex items-center space-x-3 shadow-xs cursor-pointer transition-all ${
              pendentesCount > 0
                ? 'border-amber-400 bg-amber-50/30 dark:border-amber-500/70 hover:bg-amber-50 dark:hover:bg-amber-950/30 ring-1 ring-amber-400/30'
                : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-400'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              pendentesCount > 0 
                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pedidos de Senha</span>
                {pendentesCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <strong className={`text-base font-extrabold ${pendentesCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>
                  {pendentesCount}
                </strong>
                <span className="text-[10px] text-slate-400 font-medium">
                  {pendentesCount === 1 ? 'pendente' : 'pendentes'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-white dark:bg-slate-900 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('servidores')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'servidores'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Servidores & Senhas ({usuarios.length})</span>
          </button>

          {/* NOVA ABA: PEDIDOS DE RECUPERAÇÃO DE SENHA */}
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap cursor-pointer relative ${
              activeTab === 'pedidos'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4 text-amber-500" />
            <span>Autorizações & Senhas</span>
            {pendentesCount > 0 ? (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full animate-pulse ml-1">
                {pendentesCount}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 ml-1">({pedidosRecuperacao.length})</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('secretarias')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'secretarias'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Secretarias & Departamentos ({secretarias.length})</span>
          </button>

          <button
            data-tip="marcozero"
            onClick={() => setActiveTab('numeracao')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'numeracao'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Numeração & Marco Zero</span>
            {tiposGlobaisDraft.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {tiposGlobaisDraft.length} global
              </span>
            )}
          </button>

          <button
            data-tip="quadrovagas"
            onClick={() => setActiveTab('quadro_vagas')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'quadro_vagas'
                ? 'border-violet-600 text-violet-700 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>Quadro de Vagas (Anexos I e II)</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              {quadroVagasStats.totalAnexos}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'auditoria'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Exportação & Auditoria</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* ABA 1: SERVIDORES & SENHAS */}
          {activeTab === 'servidores' && (
            <div className="space-y-4">
              {/* Barra de Filtros e Ações */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={buscaServidor}
                      onChange={e => setBuscaServidor(e.target.value)}
                      placeholder="Buscar por nome, matrícula, cargo ou secretaria..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <select
                    value={filtroSec}
                    onChange={e => setFiltroSec(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="TODAS">🏛️ Todas as Secretarias</option>
                    {secretarias.map(s => (
                      <option key={s.sigla} value={s.sigla}>{s.sigla} — {s.nome}</option>
                    ))}
                  </select>

                  <select
                    value={filtroStatus}
                    onChange={e => setFiltroStatus(e.target.value as any)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="TODOS">Todos os Status</option>
                    <option value="ATIVOS">Apenas Ativos</option>
                    <option value="INATIVOS">Apenas Inativos</option>
                  </select>
                </div>

                <button
                  onClick={handleOpenNovoServidor}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Servidor</span>
                </button>
              </div>

              {/* Tabela de Servidores */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Servidor / Nome</th>
                      <th className="p-3">Matrícula</th>
                      <th className="p-3">Secretaria / Lotação</th>
                      <th className="p-3">Nível</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {servidoresFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          Nenhum servidor encontrado com os filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      servidoresFiltrados.map(u => {
                        const initials = u.nome.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
                        const statusEfetivo = getStatusCargoEfetivo(u.cargo);
                        const fgSimbologia = extractSimbologiaLabel(u.funcaoGratificada);
                        const fgNomeLimpo = stripSimbologiaLabel(u.funcaoGratificada);
                        return (
                          <tr key={u.matricula} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-3">
                              <div className="flex items-start space-x-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                  {initials}
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                  <strong className="text-slate-900 dark:text-slate-100 block">{u.nome}</strong>
                                  <div className="flex flex-wrap items-center gap-1">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {u.cargo || (u.funcaoGratificada ? 'Livre Nomeação (Sem vínculo efetivo)' : 'Servidor Municipal')}
                                    </span>
                                    {u.cargo && statusEfetivo.status === 'EM_EXTINCAO' && (
                                      <span
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                        title="Cargo em Extinção (*)"
                                      >
                                        * Em Extinção
                                      </span>
                                    )}
                                    {u.cargo && statusEfetivo.status === 'EXTINTO' && (
                                      <span
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                        title="Cargo Extinto (**)"
                                      >
                                        ** Extinto
                                      </span>
                                    )}
                                  </div>
                                  {fgNomeLimpo && (
                                    <div className="flex items-center gap-1 pt-0.5">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                        fgSimbologia === 'SS'
                                          ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700'
                                          : fgSimbologia === 'FG'
                                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700'
                                          : 'bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-700'
                                      }`}>
                                        {fgSimbologia || 'CC/FG'}
                                      </span>
                                      <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                                        {fgNomeLimpo}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {u.matricula}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="text-slate-800 dark:text-slate-200 font-medium">{u.secretaria || 'PMRC'}</div>
                              {u.departamento && (
                                <span className="text-[11px] text-slate-400 block">{u.departamento}</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.nivel === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                  : u.nivel === 'EDITOR'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {u.nivel}
                              </span>
                              <span
                                className="block mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium"
                                title="Filtro de acessibilidade de documentos configurado"
                              >
                                Docs: {formatAccessibilityFilterLabel(u)}
                              </span>
                            </td>
                            <td className="p-3">
                              {u.ativo ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Ativo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  Inativo
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditarServidor(u)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Editar dados cadastrais"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenResetSenha(u)}
                                  className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                                  title="Redefinir senha de acesso"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(u)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    u.ativo
                                      ? 'text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                                      : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                                  }`}
                                  title={u.ativo ? 'Desativar acesso do servidor' : 'Reativar acesso do servidor'}
                                >
                                  {u.ativo ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
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

          {/* ABA 2: SECRETARIAS & DEPARTAMENTOS */}
          {activeTab === 'secretarias' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl">
                <div>
                  <h4 className="font-bold text-xs text-blue-950 dark:text-blue-200">Estrutura Organizacional de Rio Claro – RJ</h4>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5">
                    As secretarias e departamentos abaixo alimentam os timbrados oficiais, lotações e o autoaprendizado de órgãos destinatários.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingSec({ sigla: '', nome: '', titular: '', email: '', telefone: '', departamentos: [] });
                    setIsFormSecOpen(true);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Secretaria</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {secretarias.map(sec => {
                  const servsNestaSec = usuarios.filter(u => (u.secretaria || '').toUpperCase().includes(sec.sigla.toUpperCase()));
                  return (
                    <div key={sec.sigla} className="p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {sec.sigla}
                            </span>
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1.5">{sec.nome}</h3>
                          </div>
                          <button
                            onClick={() => {
                              setEditingSec({ ...sec });
                              setIsFormSecOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Editar secretaria e departamentos"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {sec.titular && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Titular: <strong>{sec.titular}</strong></span>
                          </p>
                        )}

                        {(sec.email || sec.telefone) && (
                          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            {sec.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {sec.email}
                              </span>
                            )}
                            {sec.telefone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {sec.telefone}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Departamentos / Divisões:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {sec.departamentos && sec.departamentos.length > 0 ? (
                              sec.departamentos.map(d => (
                                <span key={d} className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                  {d}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Nenhum departamento cadastrado.</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Servidores vinculados:</span>
                        <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{servsNestaSec.length}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA NOVA: NUMERAÇÃO & IMPLANTAÇÃO (MARCO ZERO + SEQUÊNCIA GLOBAL MUNICIPAL) */}
          {activeTab === 'numeracao' && (
            <div className="space-y-6">
              {/* Banner Orientativo de Implantação em Outras Secretarias */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-slate-800/80 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Implantação em Secretarias, Gabinete do Prefeito e PGM (Marco Zero)</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Para órgãos que já possuem documentos numerados no ano vigente, informe abaixo o <strong>último número já utilizado no livro anterior</strong>. O sistema registrará o <strong>Marco Zero</strong> auditado e o próximo ato emitido no Redator continuará automaticamente em <strong>nº + 1</strong> (reiniciando em <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">001</code> na virada do ano).
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0 self-start sm:self-center flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Trava LockService</span>
                </span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                {/* COLUNA ESQUERDA (7 cols): FORMULÁRIO DE MARCO ZERO */}
                <div
                  ref={marcoZeroFormRef}
                  className="xl:col-span-7 p-4 sm:p-5 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/70">
                    <div>
                      <h5 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Definir Numeração Inicial (Marco Zero)</span>
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Grava um registro oficial de corte na aba Numeração e no Log de Auditoria.
                      </p>
                    </div>
                    {mzIsGlobal ? (
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 shrink-0">
                        <Globe className="w-3 h-3" />
                        <span>Sequência Global Municipal</span>
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shrink-0">
                        Sequência por Secretaria
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSubmitMarcoZero} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Tipo de Documento *
                        </label>
                        <select
                          value={mzTipoDocumento}
                          onChange={e => setMzTipoDocumento(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {TIPOS_DOCUMENTO_NUMERADOS.map(tipo => (
                            <option key={tipo} value={tipo}>
                              {tipo}{isTipoSequenciaGlobal(tipo, { tiposSequenciaGlobal: tiposGlobaisDraft }) ? ' (Global Municipal)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Ano de Referência *
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          value={mzAno}
                          onChange={e => setMzAno(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="2026"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          {mzIsGlobal ? 'Órgão Responsável pelo Registro *' : 'Secretaria / Órgão *'}
                        </label>
                        <select
                          value={mzSecretaria}
                          onChange={e => {
                            const val = e.target.value;
                            setMzSecretaria(val);
                            const found = secretarias.find(s => `${s.nome} (${s.sigla})` === val || s.nome === val);
                            if (found && found.departamentos && found.departamentos.length > 0) {
                              setMzDepartamento(found.departamentos[0]);
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {secretarias.map(s => {
                            const label = `${s.nome} (${s.sigla})`;
                            return (
                              <option key={s.sigla} value={label}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                        {mzIsGlobal && (
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">
                            Como <strong>{mzTipoDocumento}</strong> está em Sequência Global Municipal, este Marco Zero valerá para toda a Prefeitura.
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Departamento / Setor
                          </label>
                          {isOutroMzDepto && (
                            <button
                              type="button"
                              onClick={() => setIsOutroMzDepto(false)}
                              className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              Voltar para lista
                            </button>
                          )}
                        </div>
                        {!isOutroMzDepto ? (
                          <select
                            value={mzDepartamento}
                            onChange={e => {
                              if (e.target.value === '__OUTRO__') {
                                setIsOutroMzDepto(true);
                                setMzDepartamento('');
                              } else {
                                setMzDepartamento(e.target.value);
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {mzDepartamento &&
                              !departamentosMzCombo.some(d => d.toLowerCase() === mzDepartamento.trim().toLowerCase()) && (
                                <option value={mzDepartamento}>{mzDepartamento} (atual)</option>
                              )}
                            {departamentosMzCombo.map(dep => (
                              <option key={dep} value={dep}>
                                {dep}
                              </option>
                            ))}
                            <option value="__OUTRO__">➕ Outro setor (digitar manualmente)...</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={mzDepartamento}
                            onChange={e => setMzDepartamento(e.target.value)}
                            placeholder="Ex: Chefia de Gabinete, Assessoria Jurídica..."
                            autoFocus
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Último Nº Já Emitido no Livro Anterior *
                        </label>
                        <input
                          type="number"
                          min={mzMaiorAtual + 1}
                          step={1}
                          value={mzUltimoNumero}
                          onChange={e => setMzUltimoNumero(e.target.value)}
                          placeholder={`Ex: ${Math.max(mzMaiorAtual + 1, 248)}`}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border-2 border-blue-300 dark:border-blue-700 rounded-lg text-sm font-mono font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Observação para Auditoria
                        </label>
                        <input
                          type="text"
                          value={mzObservacao}
                          onChange={e => setMzObservacao(e.target.value)}
                          placeholder="Último nº do livro físico/Excel em nov/2026"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {!mzIsGlobal && (
                      <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={mzIncluirSigla}
                          onChange={e => setMzIncluirSigla(e.target.checked)}
                          className="w-3.5 h-3.5 rounded"
                        />
                        <span>Incluir sigla da pasta no registro do Marco Zero (ex.: <strong>{mzSigla}</strong>)</span>
                      </label>
                    )}

                    {/* Painel de Conferência Ao Vivo antes de Gravar */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Atual no Sistema
                        </span>
                        <strong className="text-sm font-mono font-extrabold text-slate-700 dark:text-slate-200 mt-0.5 block">
                          {mzMaiorAtual > 0 ? `${String(mzMaiorAtual).padStart(3, '0')}/${mzAno}` : 'Nenhum (000)'}
                        </strong>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/80">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-500">
                          Marco Zero a Gravar
                        </span>
                        <strong className="text-sm font-mono font-extrabold text-blue-700 dark:text-blue-300 mt-0.5 block">
                          {mzPreviewMarco}
                        </strong>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Próximo no Redator
                        </span>
                        <strong className="text-sm font-mono font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                          {mzPreviewProximo}
                        </strong>
                      </div>
                    </div>

                    {mzUltimoNumero !== '' && !mzNumeroValido && (
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          Informe um número maior que o atual ({String(mzMaiorAtual).padStart(3, '0')}/{mzAno}) para evitar duplicidade ou retrocesso na sequência oficial.
                        </span>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={!mzNumeroValido || isSavingMarcoZero}
                        className="sgep-btn-primary px-4 py-2.5 rounded-lg border text-xs font-bold flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isSavingMarcoZero ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Registrando Marco Zero...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Registrar Marco Zero Oficial</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* COLUNA DIREITA (5 cols): SEQUÊNCIA GLOBAL MUNICIPAL */}
                <div className="xl:col-span-5 p-4 sm:p-5 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="pb-2 border-b border-slate-100 dark:border-slate-700/70">
                      <h5 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Sequência Global Municipal</span>
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Tipos ativados abaixo compartilham uma <strong>numeração única na Prefeitura inteira</strong> (não separada por secretaria). Ideal para <strong>Decretos</strong> e <strong>Portarias</strong>.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {TIPOS_DOCUMENTO_NUMERADOS.map(tipo => {
                        const ativo = tiposGlobaisDraft.includes(tipo);
                        const recomendado = tipo === 'DECRETO' || tipo === 'PORTARIA';
                        return (
                          <button
                            key={tipo}
                            type="button"
                            onClick={() => handleToggleTipoGlobal(tipo)}
                            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                              ativo
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100 shadow-2xs'
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="block text-xs font-bold truncate">{tipo}</span>
                              <span className="block text-[10px] mt-0.5 opacity-80">
                                {ativo
                                  ? 'Única Municipal'
                                  : recomendado
                                  ? 'Por Secretaria (rec. Global)'
                                  : 'Por Secretaria'}
                              </span>
                            </div>
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                                ativo
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                              }`}
                            >
                              {ativo && <Check className="w-3 h-3" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {tiposGlobaisDraft.length === 0
                        ? 'Todos os atos isolados por Secretaria.'
                        : `${tiposGlobaisDraft.length} tipo(s) em sequência única municipal.`}
                    </span>
                    <button
                      type="button"
                      disabled={isSavingConfigNum}
                      onClick={handleSalvarRegrasNumeracao}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer shrink-0"
                    >
                      {isSavingConfigNum ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Salvar Regras</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* MAPA DE SITUAÇÃO ATUAL DA NUMERAÇÃO POR SECRETARIA & TIPO */}
              <div className="p-4 sm:p-5 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h5 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      Mapa de Situação Atual da Numeração ({mzAno})
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Confira qual será o próximo número gerado para cada tipo de ato antes de liberar o acesso à equipe.
                    </p>
                  </div>

                  <select
                    value={mapaSecFiltro}
                    onChange={e => setMapaSecFiltro(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {secretarias.map(s => {
                      const label = `${s.nome} (${s.sigla})`;
                      return (
                        <option key={s.sigla} value={label}>
                          🏛️ {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-3 font-bold">Tipo de Ato</th>
                        <th className="py-2.5 px-3 font-bold">Escopo</th>
                        <th className="py-2.5 px-3 font-bold">Último Nº Registrado</th>
                        <th className="py-2.5 px-3 font-bold">Próximo Nº Previsto</th>
                        <th className="py-2.5 px-3 font-bold text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {TIPOS_DOCUMENTO_NUMERADOS.map(tipo => {
                        const isGlobal = isTipoSequenciaGlobal(tipo, { tiposSequenciaGlobal: tiposGlobaisDraft });
                        const maior = getMaxSequentialForSecretaria(
                          numeracoes,
                          tipo,
                          mapaSecFiltro,
                          mzAno,
                          secretarias,
                          { tiposSequenciaGlobal: tiposGlobaisDraft }
                        );
                        const proximoFmt = formatNumeroOficialSequencial(
                          maior + 1,
                          mzAno,
                          false,
                          getSecretariaSigla(mapaSecFiltro, secretarias),
                          isGlobal
                        );
                        return (
                          <tr key={tipo} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
                            <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">{tipo}</td>
                            <td className="py-2.5 px-3">
                              {isGlobal ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                                  <Globe className="w-3 h-3" />
                                  Global Municipal
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  Pasta ({getSecretariaSigla(mapaSecFiltro, secretarias)})
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                              {maior > 0 ? (
                                `${String(maior).padStart(3, '0')}/${mzAno}`
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 font-sans italic text-[11px]">
                                  Sem registro em {mzAno}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                  maior === 0
                                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                }`}
                              >
                                <ArrowRight className="w-3 h-3" />
                                {proximoFmt}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setMzSecretaria(mapaSecFiltro);
                                  setMzTipoDocumento(tipo);
                                  setMzUltimoNumero(maior > 0 ? String(maior + 1) : '');
                                  marcoZeroFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold cursor-pointer transition-colors"
                              >
                                Definir Marco Zero
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: AUDITORIA & EXPORTAÇÃO */}
          {activeTab === 'auditoria' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">Exportação Cadastral de Servidores</h4>
                <p className="text-xs text-slate-500 mb-4">
                  Gere um arquivo CSV compatível com Excel contendo a lista completa de matrículas, secretarias, cargos e status de todos os servidores.
                </p>
                <button
                  onClick={handleExportarCSV}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-2 transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Planilha de Servidores (.CSV)</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">Status da Integração com Google Sheets</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Endpoint do Web App do Google Apps Script ativo para operações de escrita e auditoria:
                </p>
                <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] break-all text-slate-700 dark:text-slate-300">
                  {realApiUrl}
                </div>
                <div className="mt-3 flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Trava atômica (LockService) e hash SHA-256 ativos no backend v3.6.</span>
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: PEDIDOS DE RECUPERAÇÃO DE SENHA */}
          {activeTab === 'pedidos' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-500" />
                    Solicitações de Novos Servidores e Redefinição de Senha
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Novos cadastros de servidores aguardam sua autorização (ativação de acesso) antes do primeiro login. Pedidos de senha podem ser atendidos com 1 clique definindo <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded font-mono font-bold">123456</code> ou senha personalizada.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold border border-amber-300 dark:border-amber-700/50">
                    {pendentesCount} {pendentesCount === 1 ? 'Pendente' : 'Pendentes'}
                  </span>
                </div>
              </div>

              {servidoresPendentesSemPedido.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" />
                      Servidores Inativos / Aguardando Liberação na Planilha ({servidoresPendentesSemPedido.length})
                    </h5>
                  </div>
                  {servidoresPendentesSemPedido.map(srv => (
                    <div
                      key={`srv-pend-${srv.matricula}`}
                      className="p-3.5 rounded-xl border border-indigo-300 dark:border-indigo-800/70 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-white font-bold">
                            Matrícula: {srv.matricula}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                            Aguardando Autorização
                          </span>
                          <strong className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {srv.nome}
                          </strong>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>
                            <strong>Lotação:</strong> {srv.secretaria} {srv.departamento ? `— ${srv.departamento}` : ''}
                          </span>
                          {srv.cargo && (
                            <span>
                              <strong>Cargo:</strong> {srv.cargo}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            await onToggleStatusUsuario(srv.matricula, true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all"
                          title="Autorizar e ativar acesso deste servidor no sistema"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Autorizar Acesso</span>
                        </button>
                        {onRecusarServidorInativo && (
                          <button
                            type="button"
                            onClick={() => handleOpenRecusarServidorInativo(srv)}
                            className="px-3 py-1.5 bg-white hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white border border-rose-300 dark:border-rose-800 active:scale-95 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all"
                            title="Recusar cadastro pendente e remover este registro inativo da fila"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Recusar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(!pedidosRecuperacao || pedidosRecuperacao.length === 0) && servidoresPendentesSemPedido.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">Nenhuma Solicitação Pendente</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Todos os servidores estão com acesso regularizado. Novas solicitações de cadastro ou redefinição aparecerão nesta fila automaticamente.
                  </p>
                </div>
              ) : pedidosRecuperacao.length > 0 ? (
                <div className="space-y-3">
                  {pedidosRecuperacao.map(pedido => {
                    const isPendente = pedido.status === 'PENDENTE';
                    const isAtendido = pedido.status === 'ATENDIDO';
                    const isCancelado = pedido.status === 'CANCELADO';

                    return (
                      <div
                        key={pedido.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isPendente
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60 shadow-xs'
                            : isAtendido
                            ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-white font-bold">
                                Matrícula: {pedido.matricula}
                              </span>
                              {pedido.tipo === 'NOVO_CADASTRO' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                                  Novo Cadastro
                                </span>
                              )}
                              <strong className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                {pedido.nome}
                              </strong>
                              {isPendente && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 animate-pulse">
                                  <Clock className="w-3 h-3" /> Aguardando Atendimento
                                </span>
                              )}
                                {isAtendido && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                    <CheckCircle2 className="w-3 h-3" /> {pedido.tipo === 'NOVO_CADASTRO' ? 'Autorizado (Acesso Ativo)' : 'Atendido (Senha Provisória Ativa)'}
                                  </span>
                                )}
                                {isCancelado && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                    <X className="w-3 h-3" /> {pedido.tipo === 'NOVO_CADASTRO' ? 'Recusado / Inativo' : 'Cancelado / Descartado'}
                                  </span>
                                )}
                            </div>

                            <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span>
                                <strong>Lotação:</strong> {pedido.secretaria} {pedido.departamento ? `— ${pedido.departamento}` : ''}
                              </span>
                              {pedido.cargo && (
                                <span>
                                  <strong>Cargo:</strong> {pedido.cargo}
                                </span>
                              )}
                              {pedido.contato && (
                                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                                  <Phone className="w-3 h-3" />
                                  <span>{pedido.contato}</span>
                                </span>
                              )}
                              <span className="text-slate-400">
                                Solicitado em: {pedido.dataHora}
                              </span>
                            </div>

                            {isAtendido && (
                              <div className="p-2.5 bg-emerald-100/60 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700/50 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 mt-2 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <span>{pedido.tipo === 'NOVO_CADASTRO' ? 'Autorizado por' : 'Atendido por'} <strong>{pedido.resolvidoPor || 'Administrador'}</strong> em {pedido.resolvidoEm}</span>
                                  {pedido.senhaProvisoria && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span>Senha Provisória: <code className="font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-900 dark:text-slate-100">{pedido.senhaProvisoria}</code></span>
                                    </>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const senha = pedido.senhaProvisoria;
                                    const texto = pedido.tipo === 'NOVO_CADASTRO'
                                      ? `Prezado(a) ${pedido.nome},\n\nSeu cadastro no Sistema de Gestão Documental de Rio Claro - RJ foi AUTORIZADO pelo Administrador.\n\nMatrícula: ${pedido.matricula}${senha ? `\nSenha Provisória: ${senha}` : '\nSenha: a senha definida no cadastro'}\n\nVocê já pode acessar o sistema normalmente.`
                                      : `Prezado(a) ${pedido.nome},\n\nSua solicitação de redefinição de acesso no Sistema de Despachos e Documentos Oficiais de Rio Claro - RJ foi atendida pelo Administrador.\n\nMatrícula: ${pedido.matricula}\nSenha Provisória: ${senha || '123456'}\n\nAcesse o sistema e atualize sua senha após o primeiro acesso.`;
                                    navigator.clipboard.writeText(texto);
                                    showToast('Mensagem de aviso copiada para o WhatsApp/E-mail!');
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer"
                                  title="Copiar texto de aviso para enviar ao servidor"
                                >
                                  <Copy className="w-3 h-3" /> Copiar Aviso p/ WhatsApp
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex sm:flex-col items-center gap-1.5 shrink-0 self-end sm:self-center">
                            {isPendente && pedido.tipo === 'NOVO_CADASTRO' && (
                              <>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (onAprovarPedidoRecuperacao) {
                                      await onAprovarPedidoRecuperacao(pedido.id);
                                      showToast(`Novo servidor ${pedido.nome} autorizado e ativado com sucesso!`);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                                  title="Autorizar cadastro e ativar acesso preservando a senha escolhida pelo servidor"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Autorizar Acesso</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (onAprovarPedidoRecuperacao) {
                                      await onAprovarPedidoRecuperacao(pedido.id, '123456');
                                      showToast(`Servidor ${pedido.nome} autorizado com senha provisória 123456!`);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                                  title="Ativar acesso e redefinir senha para 123456"
                                >
                                  <Key className="w-3 h-3" />
                                  <span>Ativar (123456)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onCancelarPedidoRecuperacao) {
                                      onCancelarPedidoRecuperacao(pedido.id);
                                      showToast('Solicitação de novo servidor recusada (permanece inativo).');
                                    }
                                  }}
                                  className="px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md text-[11px] font-semibold cursor-pointer"
                                  title="Recusar solicitação e manter servidor inativo"
                                >
                                  Recusar
                                </button>
                              </>
                            )}

                            {isPendente && pedido.tipo !== 'NOVO_CADASTRO' && (
                              <>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (onAprovarPedidoRecuperacao) {
                                      await onAprovarPedidoRecuperacao(pedido.id, '123456');
                                      showToast(`Senha do servidor ${pedido.nome} redefinida para 123456 com sucesso!`);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                                  title="Redefinir senha imediatamente para o padrão 123456"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  <span>Redefinir (123456)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    openConfirmDialog({
                                      title: 'Definir Senha Provisória Personalizada',
                                      message: `Informe a nova senha provisória para ${pedido.nome} (Matrícula: ${pedido.matricula}).`,
                                      confirmLabel: 'Aplicar Senha',
                                      tone: 'indigo',
                                      inputConfig: {
                                        label: 'Nova senha provisória (mínimo 4 caracteres)',
                                        placeholder: 'Digite a senha provisória',
                                        initialValue: '123456',
                                        required: true,
                                        minLength: 4
                                      },
                                      onConfirm: async (customSenha) => {
                                        if (customSenha && onAprovarPedidoRecuperacao) {
                                          await onAprovarPedidoRecuperacao(pedido.id, customSenha);
                                          showToast(`Senha redefinida para "${customSenha}"!`);
                                        }
                                      }
                                    });
                                  }}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                                  title="Definir outra senha além do padrão"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Personalizada</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onCancelarPedidoRecuperacao) {
                                      onCancelarPedidoRecuperacao(pedido.id);
                                      showToast('Pedido de redefinição descartado.');
                                    }
                                  }}
                                  className="px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md text-[11px] font-semibold cursor-pointer"
                                  title="Descartar ou cancelar esta solicitação"
                                >
                                  Descartar
                                </button>
                              </>
                            )}

                            {!isPendente && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (onAprovarPedidoRecuperacao) {
                                    await onAprovarPedidoRecuperacao(pedido.id, '123456');
                                    showToast(`Acesso/senha de ${pedido.nome} reativado com 123456.`);
                                  }
                                }}
                                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                                title="Reativar e redefinir senha para 123456"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reativar / 123456</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}

          {/* ABA 6: QUADRO DE VAGAS (ANEXO I — SS/CC, ANEXO II — FG E QUADRO EFETIVO * / **) */}
          {activeTab === 'quadro_vagas' && (
            <div className="space-y-4">
              {/* Cabeçalho Informativo */}
              <div className="p-4 rounded-xl bg-violet-50/70 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      Quadro Oficial de Cargos e Funções — Prefeitura Municipal de Rio Claro – RJ
                    </h3>
                    <HelpTooltip
                      tone="violet"
                      title="Quadro Oficial Editável"
                      content="Você pode editar qualquer cargo, corrigir simbologias ou vagas previstas em Lei, adicionar novos cargos criados por leis futuras e exportar o relatório consolidado em CSV para o DRH."
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Controle integrado das vagas previstas em Lei (<strong>Anexo I</strong> — Subsídio e Cargos em Comissão; <strong>Anexo II</strong> — Funções Gratificadas de 10% a 40%) e situação legal do <strong>Quadro Efetivo</strong> (<strong>*</strong> Em Extinção • <strong>**</strong> Extintos).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={qvCategoria === 'EFETIVOS' ? handleOpenNovoEfetivo : handleOpenNovaFuncao}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title={qvCategoria === 'EFETIVOS' ? 'Adicionar novo cargo efetivo' : 'Adicionar novo cargo em comissão ou FG'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{qvCategoria === 'EFETIVOS' ? 'Novo Efetivo' : 'Novo Cargo / FG'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportarQuadroVagasCSV}
                    className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Exportar relatório de vagas e ocupação em CSV para Excel"
                  >
                    <Download className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    <span>Exportar CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRestaurarQuadroPadrao}
                    className="px-2.5 py-2 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    title="Restaurar a relação padrão da Lei Municipal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Padrão</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenNovoServidor}
                    className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Novo Servidor</span>
                  </button>
                </div>
              </div>

              {/* 4 KPIs Resumo */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                    Anexo I • Subsídio (SS)
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <strong className="text-lg font-black text-amber-900 dark:text-amber-100">
                      {quadroVagasStats.ocupSS} / {quadroVagasStats.totalSS}
                    </strong>
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      {Math.max(0, quadroVagasStats.totalSS - quadroVagasStats.ocupSS)} vagas livres
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 block">
                    Anexo I • Comissão (CC-01..08)
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <strong className="text-lg font-black text-indigo-900 dark:text-indigo-100">
                      {quadroVagasStats.ocupCC} / {quadroVagasStats.totalCC}
                    </strong>
                    <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                      {Math.max(0, quadroVagasStats.totalCC - quadroVagasStats.ocupCC)} vagas livres
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                    Anexo II • Funções Gratificadas (FG)
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <strong className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                      {quadroVagasStats.ocupFG} / {quadroVagasStats.totalFG}
                    </strong>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      {Math.max(0, quadroVagasStats.totalFG - quadroVagasStats.ocupFG)} vagas livres
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Quadro Efetivo ({quadroVagasStats.efetivosTotal} cargos)
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {quadroVagasStats.efetivosAtivos} Ativos
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      {quadroVagasStats.efetivosEmExtincao} * Extinção
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                      {quadroVagasStats.efetivosExtintos} ** Extintos
                    </span>
                  </div>
                </div>
              </div>

              {/* Seletor de Categoria + Filtros */}
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { id: 'TODOS', label: `Todos Anexos (${listaFuncoesOficiais.length} cargos)` },
                    { id: 'SUBSIDIO', label: `Subsídio • SS (${listaFuncoesOficiais.filter(i => i.categoria === 'SUBSIDIO').length})` },
                    { id: 'COMISSAO', label: `Comissão • CC (${listaFuncoesOficiais.filter(i => i.categoria === 'COMISSAO').length})` },
                    { id: 'FG', label: `Funções Gratificadas • FG (${listaFuncoesOficiais.filter(i => i.categoria === 'FG').length})` },
                    { id: 'EFETIVOS', label: `Quadro Efetivo • * / ** (${listaCargosEfetivos.length})` }
                  ] as const).map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setQvCategoria(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        qvCategoria === cat.id
                          ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={qvBusca}
                      onChange={e => setQvBusca(e.target.value)}
                      placeholder={
                        qvCategoria === 'EFETIVOS'
                          ? 'Buscar cargo efetivo (ex: Auxiliar, Médico, Docente, Fiscal)...'
                          : 'Buscar por nome do cargo, simbologia (CC-03, FG, SS) ou secretaria...'
                      }
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  {qvCategoria === 'EFETIVOS' ? (
                    <select
                      value={qvStatusEfetivo}
                      onChange={e => setQvStatusEfetivo(e.target.value as any)}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="TODOS">Todas as Situações ({listaCargosEfetivos.length})</option>
                      <option value="ATIVO">Quadro Permanente Ativo ({quadroVagasStats.efetivosAtivos})</option>
                      <option value="EM_EXTINCAO">* Cargos em Extinção ({quadroVagasStats.efetivosEmExtincao})</option>
                      <option value="EXTINTO">** Cargos Extintos ({quadroVagasStats.efetivosExtintos})</option>
                    </select>
                  ) : (
                    <select
                      value={qvSecretaria}
                      onChange={e => setQvSecretaria(e.target.value)}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="TODAS">🏛️ Todas as Secretarias / Órgãos</option>
                      <option value="ALTA_ADM">ALTA ADM — Alta Administração (Subsídio)</option>
                      {secretarias.map(s => (
                        <option key={s.sigla} value={s.sigla}>
                          {s.sigla} — {s.nome}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Tabela: Anexos I e II OU Quadro Efetivo */}
              {qvCategoria !== 'EFETIVOS' ? (() => {
                const q = qvBusca.trim().toLowerCase();
                const listaAnexos = listaFuncoesOficiais.filter(item => {
                  if (qvCategoria !== 'TODOS' && item.categoria !== qvCategoria) return false;
                  if (qvSecretaria !== 'TODAS' && item.secretariaSigla !== qvSecretaria) return false;
                  if (q) {
                    const hit =
                      item.nome.toLowerCase().includes(q) ||
                      item.simbologia.toLowerCase().includes(q) ||
                      item.secretariaNome.toLowerCase().includes(q) ||
                      item.secretariaSigla.toLowerCase().includes(q);
                    if (!hit) return false;
                  }
                  return true;
                });

                const totalVagasFiltradas = listaAnexos.reduce((acc, i) => acc + i.vagas, 0);
                const totalOcupFiltradas = listaAnexos.reduce((acc, i) => acc + (quadroVagasStats.ocupacaoPorId.get(i.id)?.length || 0), 0);

                return (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <span>
                        Exibindo <strong>{listaAnexos.length}</strong> denominações • <strong>{totalVagasFiltradas}</strong> vagas em Lei
                      </span>
                      <span>
                        Ocupadas: <strong className="text-indigo-700 dark:text-indigo-300">{totalOcupFiltradas}</strong> • Disponíveis:{' '}
                        <strong className="text-emerald-700 dark:text-emerald-400">{Math.max(0, totalVagasFiltradas - totalOcupFiltradas)}</strong>
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-3">Cargo / Função Gratificada</th>
                            <th className="p-3">Secretaria / Órgão</th>
                            <th className="p-3 text-center">Simbologia</th>
                            <th className="p-3 text-center">Vagas Lei</th>
                            <th className="p-3 text-center">Ocupadas</th>
                            <th className="p-3 text-center">Disponíveis</th>
                            <th className="p-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {listaAnexos.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400">
                                Nenhum cargo ou função encontrado com os filtros aplicados.
                              </td>
                            </tr>
                          ) : (
                            listaAnexos.map(item => {
                              const ocupantes = quadroVagasStats.ocupacaoPorId.get(item.id) || [];
                              const ocupadas = ocupantes.length;
                              const livres = item.vagas - ocupadas;
                              return (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                  <td className="p-3">
                                    <strong className="text-slate-900 dark:text-slate-100 block">{item.nome}</strong>
                                    {item.percentualFG && (
                                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                                        Gratificação: {item.percentualFG} (Anexo II)
                                      </span>
                                    )}
                                    {item.observacao && (
                                      <span className="text-[10px] text-slate-400 block">{item.observacao}</span>
                                    )}
                                    {ocupantes.length > 0 && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {ocupantes.map(oc => (
                                          <span
                                            key={oc.matricula}
                                            className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-medium"
                                          >
                                            {oc.nome} (Mat. {oc.matricula})
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mr-1.5">
                                      {item.secretariaSigla === 'ALTA_ADM' ? 'ALTA ADM' : item.secretariaSigla}
                                    </span>
                                    <span className="text-[11px] text-slate-600 dark:text-slate-400">{item.secretariaNome}</span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
                                      item.categoria === 'SUBSIDIO'
                                        ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700'
                                        : item.categoria === 'FG'
                                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700'
                                        : 'bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-700'
                                    }`}>
                                      {item.simbologia}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {item.vagas}
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-indigo-700 dark:text-indigo-300">
                                    {ocupadas}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                      livres < 0
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                        : livres === 0
                                        ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    }`}>
                                      {livres < 0 ? `${livres} (Exced.)` : livres}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="inline-flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditarFuncao(item)}
                                        className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-blue-600 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                                        title="Editar denominação, simbologia, vagas ou órgão deste cargo/função"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                        <span>Editar</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleVincularVagaOficial(item)}
                                        className="px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-600 text-violet-700 hover:text-white dark:bg-violet-950/50 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white border border-violet-200 dark:border-violet-800 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                                        title="Cadastrar servidor já vinculado a esta secretaria e função"
                                      >
                                        + Vincular
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
                );
              })() : (() => {
                const q = qvBusca.trim().toLowerCase();
                const listaEfetivos = listaCargosEfetivos.map(nome => ({
                  nomeOriginal: nome,
                  info: getStatusCargoEfetivo(nome),
                  servidoresAtivos: usuarios.filter(
                    u => u.ativo !== false && u.cargo && u.cargo.trim().toUpperCase() === nome.trim().toUpperCase()
                  )
                })).filter(item => {
                  if (qvStatusEfetivo !== 'TODOS' && item.info.status !== qvStatusEfetivo) return false;
                  if (q && !item.nomeOriginal.toLowerCase().includes(q) && !item.info.nomeLimpo.toLowerCase().includes(q)) {
                    return false;
                  }
                  return true;
                });

                return (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <span>
                        Exibindo <strong>{listaEfetivos.length}</strong> de <strong>{listaCargosEfetivos.length}</strong> cargos efetivos
                      </span>
                      <span className="font-medium">
                        Legenda oficial: <strong className="text-amber-700 dark:text-amber-400">* Cargo em Extinção</strong> •{' '}
                        <strong className="text-rose-700 dark:text-rose-400">** Cargo Extinto</strong>
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-3">Denominação Oficial do Cargo Efetivo</th>
                            <th className="p-3">Situação Legal</th>
                            <th className="p-3 text-center">Servidores no Sistema</th>
                            <th className="p-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {listaEfetivos.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-400">
                                Nenhum cargo efetivo encontrado com os filtros aplicados.
                              </td>
                            </tr>
                          ) : (
                            listaEfetivos.map(item => (
                              <tr key={item.nomeOriginal} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-3">
                                  <strong className="text-slate-900 dark:text-slate-100 block">{item.info.nomeLimpo}</strong>
                                  {item.info.status !== 'ATIVO' && (
                                    <span className="text-[10px] font-mono text-slate-400">Registro oficial: {item.nomeOriginal}</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {item.info.status === 'ATIVO' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      <BadgeCheck className="w-3 h-3" />
                                      Quadro Permanente
                                    </span>
                                  ) : item.info.status === 'EM_EXTINCAO' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                      * Cargo em Extinção
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                      ** Cargo Extinto
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {item.servidoresAtivos.length}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditarEfetivo(item.nomeOriginal)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-blue-600 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                                    title="Corrigir grafia ou alterar situação legal (Ativo / * Em Extinção / ** Extinto)"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Editar</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>

        {/* Rodapé do Modal Principal */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Administrador logado: <strong>{currentUser.nome}</strong> (Matrícula {currentUser.matricula})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Fechar Painel
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL SECUNDÁRIO 1: FORMULÁRIO DE CRIAR / EDITAR SERVIDOR                */}
      {/* ========================================================================= */}
      {isFormServidorOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:w-[94vw] sm:max-w-2xl max-h-[94dvh] sm:max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {editingServidor.id || usuarios.some(u => u.matricula === editingServidor.matricula) ? 'Editar Servidor Municipal' : 'Cadastrar Novo Servidor'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormServidorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarServidorSubmit} className="p-4 sm:p-5 pb-safe space-y-4 text-xs overflow-y-auto overscroll-contain">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome Completo do Servidor *</label>
                <input
                  type="text"
                  required
                  value={editingServidor.nome || ''}
                  onChange={e => setEditingServidor({ ...editingServidor, nome: e.target.value })}
                  placeholder="Ex: João da Silva Santos"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Matrícula Funcional *</label>
                  <input
                    type="text"
                    required
                    value={editingServidor.matricula || ''}
                    onChange={e => setEditingServidor({ ...editingServidor, matricula: e.target.value.trim() })}
                    placeholder="Ex: 20851"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nível de Acesso *</label>
                  <select
                    value={editingServidor.nivel || 'PADRAO'}
                    onChange={e => setEditingServidor({ ...editingServidor, nivel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="PADRAO">PADRAO (Emissão & Minutas)</option>
                    <option value="EDITOR">EDITOR (Redator Avançado)</option>
                    <option value="ADMIN">ADMIN (Controle Total & Gestão)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Secretarias Autorizadas / Lotações (Acúmulo de Pastas) *
                </label>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg max-h-44 overflow-y-auto space-y-1">
                  {secretarias.map(s => {
                    const isChecked = (editingServidor.secretarias && editingServidor.secretarias.length > 0)
                      ? editingServidor.secretarias.some(x => x && (x === s.sigla || x === s.nome || x.includes(s.sigla) || x.includes(s.nome)))
                      : (editingServidor.secretaria && (editingServidor.secretaria === s.sigla || editingServidor.secretaria.includes(s.sigla) || editingServidor.secretaria.includes(s.nome)));

                    return (
                      <label key={s.sigla} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 p-1.5 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={!!isChecked}
                          onChange={e => {
                            const curList = (editingServidor.secretarias && editingServidor.secretarias.length > 0)
                              ? [...editingServidor.secretarias]
                              : (editingServidor.secretaria ? [editingServidor.secretaria] : []);
                            
                            let updated: string[];
                            if (e.target.checked) {
                              updated = Array.from(new Set([...curList, `${s.nome} (${s.sigla})`]));
                            } else {
                              updated = curList.filter(x => !x.includes(s.sigla) && !x.includes(s.nome));
                            }
                            setEditingServidor({
                              ...editingServidor,
                              secretaria: updated[0] || `${s.nome} (${s.sigla})`,
                              secretarias: updated
                            });
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <span className="text-xs text-slate-800 dark:text-slate-200">
                          <strong className="text-indigo-600 dark:text-indigo-400 font-mono">[{s.sigla}]</strong> {s.nome}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Marque uma ou mais secretarias caso o servidor exerça funções cumulativas em diferentes pastas.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status do Servidor *</label>
                <select
                  value={editingServidor.ativo ? 'true' : 'false'}
                  onChange={e => setEditingServidor({ ...editingServidor, ativo: e.target.value === 'true' })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="true">✅ Ativo (Acesso Liberado)</option>
                  <option value="false">⛔ Inativo / Suspenso</option>
                </select>
              </div>

              <div className="space-y-3 p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Vínculo Funcional & Lotação Interna</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    <strong>*</strong> Em Extinção • <strong>**</strong> Extinto
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <label className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <span>Cargo Efetivo (Quadro Permanente)</span>
                        <HelpTooltip
                          tone="indigo"
                          title="Combo do Quadro Efetivo da Prefeitura"
                          content="Lista oficial organizada por situação legal (Ativos, * Em Extinção e ** Extintos). Atualizações feitas na aba Quadro Oficial refletem automaticamente aqui."
                        />
                      </label>
                      <div className="flex items-center gap-1.5">
                        {editingServidor.cargo && (() => {
                          const st = getStatusCargoEfetivo(editingServidor.cargo);
                          if (st.status === 'EM_EXTINCAO') {
                            return (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                * Em Extinção
                              </span>
                            );
                          }
                          if (st.status === 'EXTINTO') {
                            return (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                ** Extinto
                              </span>
                            );
                          }
                          return null;
                        })()}
                        {isOutroCargoAdmin && (
                          <button
                            type="button"
                            onClick={() => setIsOutroCargoAdmin(false)}
                            className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Voltar para lista
                          </button>
                        )}
                      </div>
                    </div>
                    {!isOutroCargoAdmin ? (
                      <select
                        value={editingServidor.cargo || ''}
                        onChange={e => {
                          if (e.target.value === '__OUTRO__') {
                            setIsOutroCargoAdmin(true);
                            setEditingServidor({ ...editingServidor, cargo: '' });
                          } else {
                            setEditingServidor({ ...editingServidor, cargo: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Sem vínculo efetivo (livre nomeação) / Selecione...</option>
                        {editingServidor.cargo &&
                          !cargosSugeridosAdmin.some(
                            c => c.toLowerCase() === (editingServidor.cargo || '').trim().toLowerCase()
                          ) && (
                            <option value={editingServidor.cargo}>
                              {editingServidor.cargo} (atual)
                            </option>
                          )}
                        {cargosAgrupadosAdmin.ativos.length > 0 && (
                          <optgroup label={`✅ Quadro Permanente Ativo (${cargosAgrupadosAdmin.ativos.length})`}>
                            {cargosAgrupadosAdmin.ativos.map(c => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {cargosAgrupadosAdmin.emExtincao.length > 0 && (
                          <optgroup label={`⚠️ * Cargos em Extinção (${cargosAgrupadosAdmin.emExtincao.length})`}>
                            {cargosAgrupadosAdmin.emExtincao.map(c => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {cargosAgrupadosAdmin.extintos.length > 0 && (
                          <optgroup label={`⛔ ** Cargos Extintos (${cargosAgrupadosAdmin.extintos.length})`}>
                            {cargosAgrupadosAdmin.extintos.map(c => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <option value="__OUTRO__">➕ Outro cargo efetivo (digitar manualmente)...</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={editingServidor.cargo || ''}
                        onChange={e => setEditingServidor({ ...editingServidor, cargo: e.target.value })}
                        placeholder="Digite a denominação do cargo efetivo..."
                        autoFocus
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-400 dark:border-indigo-600 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <span>Departamento / Divisão</span>
                        <HelpTooltip
                          tone="indigo"
                          title="Lista Combo de Departamentos"
                          content="Lista preenchida automaticamente com os departamentos oficiais das secretarias selecionadas acima. Se o setor ainda não existir, escolha 'Outro departamento' para digitar."
                        />
                      </label>
                      {isOutroDeptoAdmin && (
                        <button
                          type="button"
                          onClick={() => setIsOutroDeptoAdmin(false)}
                          className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Voltar para lista
                        </button>
                      )}
                    </div>
                    {!isOutroDeptoAdmin ? (
                      <select
                        value={editingServidor.departamento || ''}
                        onChange={e => {
                          if (e.target.value === '__OUTRO__') {
                            setIsOutroDeptoAdmin(true);
                            setEditingServidor({ ...editingServidor, departamento: '' });
                          } else {
                            setEditingServidor({ ...editingServidor, departamento: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Selecione o Departamento / Divisão...</option>
                        {editingServidor.departamento &&
                          !departamentosSugeridosAdmin.some(
                            d => d.toLowerCase() === (editingServidor.departamento || '').trim().toLowerCase()
                          ) && (
                            <option value={editingServidor.departamento}>
                              {editingServidor.departamento} (atual)
                            </option>
                          )}
                        {departamentosSugeridosAdmin.map(d => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                        <option value="__OUTRO__">➕ Outro departamento (digitar manualmente)...</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={editingServidor.departamento || ''}
                        onChange={e => setEditingServidor({ ...editingServidor, departamento: e.target.value })}
                        placeholder="Digite o nome do departamento ou divisão..."
                        autoFocus
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-400 dark:border-indigo-600 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <span>Cargo em Comissão (Anexo I) / Função Gratificada (Anexo II) — Opcional</span>
                      <HelpTooltip
                        tone="violet"
                        title="Assinatura Inteligente"
                        content="Quando preenchido, esta função comissionada ou FG aparece automaticamente na assinatura do Redator Oficial, mantendo o cargo efetivo salvo para portarias e comissões."
                      />
                    </label>
                    <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                      Priorizando {funcoesAgrupadasForm.sigla}
                    </span>
                  </div>
                  <select
                    value={
                      editingServidor.funcaoGratificada &&
                      !listaFuncoesOficiais.some(f => formatCargoComSimbologia(f) === editingServidor.funcaoGratificada)
                        ? '__CUSTOM__'
                        : (editingServidor.funcaoGratificada || '')
                    }
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '__CUSTOM__') return;
                      const deptoSugerido = inferirDepartamentoDaFuncao(val);
                      if (deptoSugerido) setIsOutroDeptoAdmin(false);
                      setEditingServidor(prev => ({
                        ...prev,
                        funcaoGratificada: val,
                        departamento: (!prev.departamento || prev.departamento === 'Gabinete') && deptoSugerido
                          ? deptoSugerido
                          : prev.departamento
                      }));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Nenhum (somente cargo efetivo)</option>
                    {editingServidor.funcaoGratificada &&
                      !listaFuncoesOficiais.some(f => formatCargoComSimbologia(f) === editingServidor.funcaoGratificada) && (
                        <option value="__CUSTOM__">Atual: {editingServidor.funcaoGratificada}</option>
                      )}
                    {funcoesAgrupadasForm.comissaoDaPasta.length > 0 && (
                      <optgroup label={`⭐ Cargos em Comissão / Subsídio — ${funcoesAgrupadasForm.sigla} (Anexo I)`}>
                        {funcoesAgrupadasForm.comissaoDaPasta.map(item => (
                          <option key={item.id} value={formatCargoComSimbologia(item)}>
                            {item.nome} ({item.simbologia}) — {item.vagas} {item.vagas === 1 ? 'vaga' : 'vagas'}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {funcoesAgrupadasForm.fgDaPasta.length > 0 && (
                      <optgroup label={`⭐ Funções Gratificadas (FG) — ${funcoesAgrupadasForm.sigla} (Anexo II)`}>
                        {funcoesAgrupadasForm.fgDaPasta.map(item => (
                          <option key={item.id} value={formatCargoComSimbologia(item)}>
                            {item.nome} ({item.simbologia}) — {item.vagas} {item.vagas === 1 ? 'vaga' : 'vagas'}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {funcoesAgrupadasForm.altaAdministracao.length > 0 && (
                      <optgroup label="🏛️ Alta Administração — Subsídio (Anexo I)">
                        {funcoesAgrupadasForm.altaAdministracao.map(item => (
                          <option key={item.id} value={formatCargoComSimbologia(item)}>
                            {item.nome} ({item.simbologia}) — {item.vagas} {item.vagas === 1 ? 'vaga' : 'vagas'}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {funcoesAgrupadasForm.outrasComissao.length > 0 && (
                      <optgroup label="📋 Demais Cargos em Comissão — Outras Secretarias (Anexo I)">
                        {funcoesAgrupadasForm.outrasComissao.map(item => (
                          <option key={item.id} value={formatCargoComSimbologia(item)}>
                            [{item.secretariaSigla}] {item.nome} ({item.simbologia})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {funcoesAgrupadasForm.outrasFG.length > 0 && (
                      <optgroup label="📋 Demais Funções Gratificadas — Outras Secretarias (Anexo II)">
                        {funcoesAgrupadasForm.outrasFG.map(item => (
                          <option key={item.id} value={formatCargoComSimbologia(item)}>
                            [{item.secretariaSigla}] {item.nome} ({item.simbologia})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Quando preenchido, este cargo/função será priorizado automaticamente nas assinaturas do <strong>Redator Oficial</strong>, preservando o cargo efetivo para portarias e comissões.
                  </p>
                </div>
              </div>

              {/* Filtro de Acessibilidade Documental (Secretaria / Departamento / Próprio Servidor) */}
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      Filtro de Acessibilidade de Documentos
                    </span>
                    <HelpTooltip
                      tone="indigo"
                      title="Privacidade e Escopo no Livro"
                      content="Define quais documentos numerados este servidor pode visualizar no Livro: apenas os seus próprios, os do seu departamento ou os de toda a sua secretaria."
                    />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    {editingServidor.nivel === 'ADMIN'
                      ? 'Total (Admin)'
                      : formatAccessibilityFilterLabel(editingServidor as UsuarioSistema)}
                  </span>
                </div>

                {editingServidor.nivel === 'ADMIN' ? (
                  <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed">
                    Usuários com perfil <strong>ADMIN</strong> possuem acesso irrestrito de auditoria a todas as secretarias, departamentos e documentos do sistema.
                  </p>
                ) : (() => {
                  const currentFilter: FiltroAcessibilidadeDocs = editingServidor.filtroAcessibilidade || getEffectiveAccessibilityFilter(editingServidor as UsuarioSistema);
                  const updateFilter = (patch: Partial<FiltroAcessibilidadeDocs>) => {
                    setEditingServidor({
                      ...editingServidor,
                      filtroAcessibilidade: {
                        ...currentFilter,
                        ...patch
                      }
                    });
                  };
                  return (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingServidor({
                            ...editingServidor,
                            filtroAcessibilidade: { acessarSecretaria: true, acessarDepartamento: true, acessarProprios: true }
                          })}
                          className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 cursor-pointer"
                        >
                          Toda Secretaria
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingServidor({
                            ...editingServidor,
                            filtroAcessibilidade: { acessarSecretaria: false, acessarDepartamento: true, acessarProprios: true }
                          })}
                          className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 cursor-pointer"
                        >
                          Depto + Próprios
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingServidor({
                            ...editingServidor,
                            filtroAcessibilidade: { acessarSecretaria: false, acessarDepartamento: false, acessarProprios: true }
                          })}
                          className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 cursor-pointer"
                        >
                          Somente Próprios
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingServidor({
                            ...editingServidor,
                            filtroAcessibilidade: { acessarSecretaria: false, acessarDepartamento: false, acessarProprios: false }
                          })}
                          className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-[10px] font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          Bloquear Consulta
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-start gap-2 p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-indigo-300">
                          <input
                            type="checkbox"
                            checked={currentFilter.acessarSecretaria}
                            onChange={e => updateFilter({ acessarSecretaria: e.target.checked })}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 block">
                              Documentos da Secretaria vinculada
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              Permite consultar documentos de qualquer departamento dentro da(s) Secretaria(s) autorizada(s) acima.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-indigo-300">
                          <input
                            type="checkbox"
                            checked={currentFilter.acessarDepartamento}
                            onChange={e => updateFilter({ acessarDepartamento: e.target.checked })}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 block">
                              Documentos do Departamento de lotação
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              Permite acessar documentos emitidos no mesmo Departamento/Divisão do servidor{editingServidor.departamento ? ` (${editingServidor.departamento})` : ''}.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-indigo-300">
                          <input
                            type="checkbox"
                            checked={currentFilter.acessarProprios}
                            onChange={e => updateFilter({ acessarProprios: e.target.checked })}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 block">
                              Documentos emitidos pelo próprio servidor
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              Permite consultar os documentos cuja autoria/emissão esteja vinculada à matrícula ou nome deste servidor.
                            </span>
                          </div>
                        </label>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Senha de Acesso {editingServidor.id ? '(Deixe em branco para manter a atual)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={senhaInput}
                    onChange={e => setSenhaInput(e.target.value)}
                    placeholder={editingServidor.id ? 'Manter senha inalterada' : 'Definir senha inicial (ex: 123456)'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormServidorOpen(false)}
                  className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingServidor}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingServidor ? 'Gravando...' : 'Salvar Servidor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL SECUNDÁRIO 2: REDEFINIÇÃO RÁPIDA DE SENHA DO SERVIDOR               */}
      {/* ========================================================================= */}
      {isResetSenhaOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-sm w-full max-h-[92dvh] overflow-y-auto shadow-2xl p-4 sm:p-5 pb-safe space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Redefinir Senha do Servidor</h3>
                <p className="text-[11px] text-slate-500">{resetNome} (Mat. {resetMatricula})</p>
              </div>
            </div>

            <form onSubmit={handleConfirmarResetSenha} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nova Senha</label>
                <input
                  type="password"
                  required
                  value={novaSenhaReset}
                  onChange={e => setNovaSenhaReset(e.target.value)}
                  placeholder="Digite a nova senha provisória"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetSenhaOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-xs"
                >
                  Atualizar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL SECUNDÁRIO 3: CRIAR / EDITAR SECRETARIA E DEPARTAMENTOS            */}
      {/* ========================================================================= */}
      {isFormSecOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:w-[94vw] sm:max-w-2xl max-h-[94dvh] overflow-y-auto shadow-2xl p-4 sm:p-5 pb-safe space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {editingSec.sigla ? `Editar Secretaria (${editingSec.sigla})` : 'Nova Secretaria Municipal'}
                </h3>
              </div>
              <button onClick={() => setIsFormSecOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSalvarSecSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sigla Oficial *</label>
                  <input
                    type="text"
                    required
                    value={editingSec.sigla || ''}
                    onChange={e => setEditingSec({ ...editingSec, sigla: e.target.value.toUpperCase() })}
                    placeholder="Ex: SMA"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome por Extenso *</label>
                  <input
                    type="text"
                    required
                    value={editingSec.nome || ''}
                    onChange={e => setEditingSec({ ...editingSec, nome: e.target.value })}
                    placeholder="Ex: Secretaria Municipal de Administração"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Titular / Secretário(a)</label>
                <input
                  type="text"
                  value={editingSec.titular || ''}
                  onChange={e => setEditingSec({ ...editingSec, titular: e.target.value })}
                  placeholder="Ex: Nome do(a) Secretário(a)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">E-mail Institucional</label>
                  <input
                    type="email"
                    value={editingSec.email || ''}
                    onChange={e => setEditingSec({ ...editingSec, email: e.target.value })}
                    placeholder="contato@rioclaro.rj.gov.br"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Telefone / Ramal</label>
                  <input
                    type="text"
                    value={editingSec.telefone || ''}
                    onChange={e => setEditingSec({ ...editingSec, telefone: e.target.value })}
                    placeholder="(24) 3332-1200"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Departamentos & Divisões</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={novoDeptInput}
                    onChange={e => setNovoDeptInput(e.target.value)}
                    placeholder="Nome do departamento (ex: Divisão de RH)"
                    className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddDept}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg font-bold"
                  >
                    + Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  {(editingSec.departamentos || []).map(d => (
                    <span key={d} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">
                      <span>{d}</span>
                      <button type="button" onClick={() => handleRemoveDept(d)} className="text-slate-400 hover:text-rose-500">×</button>
                    </span>
                  ))}
                  {(!editingSec.departamentos || editingSec.departamentos.length === 0) && (
                    <span className="text-[11px] text-slate-400 italic">Nenhum departamento adicionado ainda.</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormSecOpen(false)}
                  className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs"
                >
                  Salvar Secretaria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL SECUNDÁRIO 4: EDITAR / CRIAR CARGO OU FUNÇÃO (ANEXOS I E II)       */}
      {/* ========================================================================= */}
      {isFormFuncaoOpen && (
        <div className="fixed inset-0 z-[75] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-violet-50/70 dark:bg-violet-950/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {editingFuncaoId ? 'Editar Cargo / Função Oficial' : 'Adicionar Cargo / Função (Anexos I e II)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormFuncaoOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarFuncaoOficial} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Denominação Oficial do Cargo / Função *
                </label>
                <input
                  type="text"
                  required
                  value={editingFuncao.nome}
                  onChange={e => setEditingFuncao({ ...editingFuncao, nome: e.target.value })}
                  placeholder="Ex: Diretor de Departamento de Pessoal"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoria *</label>
                  <select
                    value={editingFuncao.categoria}
                    onChange={e => {
                      const cat = e.target.value as CategoriaFuncaoOficial;
                      setEditingFuncao(prev => ({
                        ...prev,
                        categoria: cat,
                        simbologia: (cat === 'SUBSIDIO' ? 'SS' : cat === 'FG' ? 'FG' : (prev.simbologia.startsWith('CC') ? prev.simbologia : 'CC-03')) as SimbologiaOficial,
                        percentualFG: cat === 'FG' ? (prev.percentualFG || '10% a 40%') : ''
                      }));
                    }}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="SUBSIDIO">Anexo I • Subsídio (SS)</option>
                    <option value="COMISSAO">Anexo I • Comissão (CC)</option>
                    <option value="FG">Anexo II • Função Gratificada (FG)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Simbologia *</label>
                  <select
                    value={editingFuncao.simbologia}
                    onChange={e => setEditingFuncao({ ...editingFuncao, simbologia: e.target.value as SimbologiaOficial })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                  >
                    <option value="SS">SS (Subsídio)</option>
                    <option value="CC-01">CC-01</option>
                    <option value="CC-02">CC-02</option>
                    <option value="CC-03">CC-03</option>
                    <option value="CC-04">CC-04</option>
                    <option value="CC-05">CC-05</option>
                    <option value="CC-06">CC-06</option>
                    <option value="CC-07">CC-07</option>
                    <option value="CC-08">CC-08</option>
                    <option value="FG">FG (Função Gratificada)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Vagas em Lei *</label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    required
                    value={editingFuncao.vagas}
                    onChange={e => setEditingFuncao({ ...editingFuncao, vagas: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Secretaria / Órgão Vinculado *</label>
                <select
                  value={editingFuncao.secretariaSigla}
                  onChange={e => {
                    const sigla = e.target.value;
                    const sec = secretarias.find(s => s.sigla === sigla);
                    setEditingFuncao({
                      ...editingFuncao,
                      secretariaSigla: sigla,
                      secretariaNome: sigla === 'ALTA_ADM' ? 'Alta Administração (Subsídio)' : (sec?.nome || sigla)
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  <option value="ALTA_ADM">ALTA ADM — Alta Administração (Subsídio)</option>
                  {secretarias.map(s => (
                    <option key={s.sigla} value={s.sigla}>
                      {s.sigla} — {s.nome}
                    </option>
                  ))}
                </select>
              </div>

              {editingFuncao.categoria === 'FG' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Faixa / Percentual de Gratificação (Anexo II)
                  </label>
                  <input
                    type="text"
                    value={editingFuncao.percentualFG}
                    onChange={e => setEditingFuncao({ ...editingFuncao, percentualFG: e.target.value })}
                    placeholder="Ex: 10% a 40% sobre o vencimento base"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observação / Referência Legal (Opcional)
                </label>
                <input
                  type="text"
                  value={editingFuncao.observacao}
                  onChange={e => setEditingFuncao({ ...editingFuncao, observacao: e.target.value })}
                  placeholder="Ex: Lei Municipal nº ..., alterado em 2026"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                {editingFuncaoId ? (
                  <button
                    type="button"
                    onClick={handleExcluirFuncaoOficial}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-800 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormFuncaoOpen(false)}
                    className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL SECUNDÁRIO 5: EDITAR / CRIAR CARGO EFETIVO (* / **)                 */}
      {/* ========================================================================= */}
      {isFormEfetivoOpen && (
        <div className="fixed inset-0 z-[75] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {editingEfetivoOriginal ? 'Editar Cargo Efetivo' : 'Novo Cargo Efetivo'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormEfetivoOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarEfetivo} className="p-4 sm:p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Denominação Oficial do Cargo Efetivo *
                </label>
                <input
                  type="text"
                  required
                  value={editingEfetivoNome}
                  onChange={e => setEditingEfetivoNome(e.target.value)}
                  placeholder="Ex: AUXILIAR ADMINISTRATIVO"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Situação Legal no Quadro Municipal *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {([
                    { id: 'ATIVO', label: 'Quadro Permanente (Ativo)', desc: 'Cargo efetivo regular sem marcação de extinção' },
                    { id: 'EM_EXTINCAO', label: '* Cargo em Extinção', desc: 'Aplica marcação oficial (*) — extinto na vacância' },
                    { id: 'EXTINTO', label: '** Cargo Extinto', desc: 'Aplica marcação oficial (**) — histórico funcional' }
                  ] as const).map(opt => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        editingEfetivoStatus === opt.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700'
                          : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status-efetivo"
                        checked={editingEfetivoStatus === opt.id}
                        onChange={() => setEditingEfetivoStatus(opt.id)}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <strong className="text-slate-800 dark:text-slate-100 block">{opt.label}</strong>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Prévia do registro oficial: </span>
                <strong className="font-mono text-slate-900 dark:text-slate-100">
                  {formatarCargoEfetivoComStatus(editingEfetivoNome, editingEfetivoStatus) || '—'}
                </strong>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                {editingEfetivoOriginal ? (
                  <button
                    type="button"
                    onClick={handleExcluirEfetivo}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-800 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormEfetivoOpen(false)}
                    className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Cargo</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INTERNO DE CONFIRMAÇÃO / ENTRADA (COMPATÍVEL COM IFRAME E PWA) */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
          onClick={() => {
            if (!isConfirmSubmitting) {
              setConfirmDialog(null);
              setConfirmInputValue('');
            }
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div
              className={`p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between ${
                confirmDialog.tone === 'danger'
                  ? 'bg-rose-50 dark:bg-rose-950/30'
                  : confirmDialog.tone === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/30'
                    : confirmDialog.tone === 'emerald'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30'
                      : 'bg-indigo-50 dark:bg-indigo-950/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg text-white ${
                    confirmDialog.tone === 'danger'
                      ? 'bg-rose-600'
                      : confirmDialog.tone === 'warning'
                        ? 'bg-amber-600'
                        : confirmDialog.tone === 'emerald'
                          ? 'bg-emerald-600'
                          : 'bg-indigo-600'
                  }`}
                >
                  {confirmDialog.tone === 'danger' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : confirmDialog.tone === 'emerald' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : confirmDialog.tone === 'warning' ? (
                    <RotateCcw className="w-4 h-4" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {confirmDialog.title}
                </h4>
              </div>
              <button
                type="button"
                disabled={isConfirmSubmitting}
                onClick={() => {
                  setConfirmDialog(null);
                  setConfirmInputValue('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
                aria-label="Fechar confirmação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDialogSubmit} className="p-5 space-y-4">
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                {confirmDialog.message}
              </p>

              {confirmDialog.detail && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {confirmDialog.detail}
                </div>
              )}

              {confirmDialog.inputConfig && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {confirmDialog.inputConfig.label}
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={confirmInputValue}
                    onChange={e => setConfirmInputValue(e.target.value)}
                    placeholder={confirmDialog.inputConfig.placeholder || ''}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  {confirmDialog.inputConfig.presets && confirmDialog.inputConfig.presets.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {confirmDialog.inputConfig.presets.map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setConfirmInputValue(preset)}
                          className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer ${
                            confirmInputValue === preset
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isConfirmSubmitting}
                  onClick={() => {
                    setConfirmDialog(null);
                    setConfirmInputValue('');
                  }}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isConfirmSubmitting}
                  className={`px-4 py-2 text-white rounded-lg text-xs font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-60 ${
                    confirmDialog.tone === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : confirmDialog.tone === 'warning'
                        ? 'bg-amber-600 hover:bg-amber-500'
                        : confirmDialog.tone === 'emerald'
                          ? 'bg-emerald-600 hover:bg-emerald-500'
                          : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  {isConfirmSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isConfirmSubmitting ? 'Processando...' : confirmDialog.confirmLabel}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
