import React, { useState, useMemo } from 'react';
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
  UserPlus
} from 'lucide-react';
import {
  UsuarioSistema,
  SecretariaItem,
  PedidoRecuperacaoSenha,
  FiltroAcessibilidadeDocs,
  getEffectiveAccessibilityFilter,
  formatAccessibilityFilterLabel
} from '../mockData';

interface AdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UsuarioSistema;
  usuarios: UsuarioSistema[];
  onSaveUsuario: (usuario: Partial<UsuarioSistema>, novaSenha?: string) => Promise<boolean>;
  onToggleStatusUsuario: (matricula: string, novoStatus: boolean) => Promise<boolean>;
  secretarias: SecretariaItem[];
  onSaveSecretaria: (sec: SecretariaItem) => void;
  realApiUrl: string;
  useRealApi: boolean;
  showToast: (msg: string, title?: string, isError?: boolean) => void;
  pedidosRecuperacao?: PedidoRecuperacaoSenha[];
  onAprovarPedidoRecuperacao?: (pedidoId: string, novaSenha?: string) => Promise<void> | void;
  onCancelarPedidoRecuperacao?: (pedidoId: string) => void;
}

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  usuarios,
  onSaveUsuario,
  onToggleStatusUsuario,
  secretarias,
  onSaveSecretaria,
  realApiUrl,
  useRealApi,
  showToast,
  pedidosRecuperacao = [],
  onAprovarPedidoRecuperacao,
  onCancelarPedidoRecuperacao
}) => {
  const [activeTab, setActiveTab] = useState<'servidores' | 'secretarias' | 'pedidos' | 'auditoria'>('servidores');
  
  // Filtros de servidores
  const [buscaServidor, setBuscaServidor] = useState('');
  const [filtroSec, setFiltroSec] = useState('TODAS');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ATIVOS' | 'INATIVOS'>('TODOS');

  // Modal interno de Edição/Criação de Servidor
  const [isFormServidorOpen, setIsFormServidorOpen] = useState(false);
  const [editingServidor, setEditingServidor] = useState<Partial<UsuarioSistema>>({});
  const [senhaInput, setSenhaInput] = useState('');
  const [isSavingServidor, setIsSavingServidor] = useState(false);

  // Modal interno de Redefinição de Senha
  const [isResetSenhaOpen, setIsResetSenhaOpen] = useState(false);
  const [resetMatricula, setResetMatricula] = useState('');
  const [resetNome, setResetNome] = useState('');
  const [novaSenhaReset, setNovaSenhaReset] = useState('');

  // Modal interno de Secretaria/Departamento
  const [isFormSecOpen, setIsFormSecOpen] = useState(false);
  const [editingSec, setEditingSec] = useState<Partial<SecretariaItem>>({});
  const [novoDeptInput, setNovoDeptInput] = useState('');

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
        return nomeMatch || matMatch || secMatch || cargoMatch;
      }
      return true;
    });
  }, [usuarios, buscaServidor, filtroSec, filtroStatus]);

  // Sugestões em combo para Cargo e Departamento baseadas na planilha e secretarias selecionadas
  const cargosSugeridosAdmin = useMemo(() => {
    const padroes = [
      'Agente Administrativo',
      'Assessor Técnico',
      'Assistente Administrativo',
      'Auxiliar Administrativo',
      'Chefe de Divisão',
      'Contador',
      'Coordenador',
      'Diretor de Departamento',
      'Enfermeiro(a)',
      'Fiscal Municipal',
      'Procurador Municipal',
      'Professor(a)',
      'Secretário(a) Municipal',
      'Técnico Administrativo',
      'Técnico em Enfermagem'
    ];
    const set = new Set<string>(padroes);
    usuarios.forEach(u => {
      if (u.cargo && u.cargo.trim() && u.cargo.trim().toLowerCase() !== 'servidor municipal') {
        set.add(u.cargo.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [usuarios]);

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
      secretaria: 'SMA',
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
    setIsFormServidorOpen(true);
  };

  const handleOpenEditarServidor = (u: UsuarioSistema) => {
    setEditingServidor({
      ...u,
      filtroAcessibilidade: getEffectiveAccessibilityFilter(u)
    });
    setSenhaInput('');
    setIsFormServidorOpen(true);
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

  const handleToggleStatus = async (u: UsuarioSistema) => {
    const acao = u.ativo ? 'desativar' : 'ativar';
    if (u.matricula === currentUser.matricula && u.ativo) {
      showToast('Você não pode desativar seu próprio usuário de administrador logado.', 'Ação Bloqueada', true);
      return;
    }
    if (window.confirm(`Deseja realmente ${acao} o acesso do servidor(a) ${u.nome} (Matrícula: ${u.matricula})?`)) {
      await onToggleStatusUsuario(u.matricula, !u.ativo);
    }
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
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-5xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
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
                        return (
                          <tr key={u.matricula} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <strong className="text-slate-900 dark:text-slate-100 block">{u.nome}</strong>
                                  <span className="text-[11px] text-slate-400 block">{u.cargo || 'Servidor Municipal'}</span>
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
                                  onClick={() => handleOpenEditarServidor(u)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Editar dados cadastrais"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenResetSenha(u)}
                                  className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                                  title="Redefinir senha de acesso"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(u)}
                                  className={`p-1.5 rounded-lg transition-colors ${
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
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            await onToggleStatusUsuario(srv.matricula, true);
                            showToast(`Acesso do servidor ${srv.nome} autorizado e ativado!`);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                          title="Autorizar e ativar acesso deste servidor no sistema"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Autorizar Acesso</span>
                        </button>
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
                                  onClick={async () => {
                                    const customSenha = window.prompt(`Defina uma senha provisória personalizada para ${pedido.nome} (Matrícula: ${pedido.matricula}):`, '123456');
                                    if (customSenha && customSenha.trim().length >= 4) {
                                      if (onAprovarPedidoRecuperacao) {
                                        await onAprovarPedidoRecuperacao(pedido.id, customSenha.trim());
                                        showToast(`Senha redefinida para "${customSenha.trim()}"!`);
                                      }
                                    } else if (customSenha !== null) {
                                      showToast('A senha deve ter pelo menos 4 caracteres.', 'Atenção', true);
                                    }
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
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {editingServidor.id || usuarios.some(u => u.matricula === editingServidor.matricula) ? 'Editar Servidor Municipal' : 'Cadastrar Novo Servidor'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormServidorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarServidorSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
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

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cargo / Função (Opcional)</label>
                  <input
                    type="text"
                    list="admin-combo-cargos"
                    value={editingServidor.cargo || ''}
                    onChange={e => setEditingServidor({ ...editingServidor, cargo: e.target.value })}
                    placeholder="Selecione da lista ou digite..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <datalist id="admin-combo-cargos">
                    {cargosSugeridosAdmin.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Departamento / Divisão</label>
                  <input
                    type="text"
                    list="admin-combo-departamentos"
                    value={editingServidor.departamento || ''}
                    onChange={e => setEditingServidor({ ...editingServidor, departamento: e.target.value })}
                    placeholder="Selecione da lista ou digite..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <datalist id="admin-combo-departamentos">
                    {departamentosSugeridosAdmin.map(d => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
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
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden p-5 space-y-4">
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

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetSenhaOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-xs"
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
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {editingSec.sigla ? `Editar Secretaria (${editingSec.sigla})` : 'Nova Secretaria Municipal'}
                </h3>
              </div>
              <button onClick={() => setIsFormSecOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSalvarSecSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
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
                <div className="col-span-2">
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

    </div>
  );
};
