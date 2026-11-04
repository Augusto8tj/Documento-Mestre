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
  Trash2
} from 'lucide-react';
import { UsuarioSistema, SecretariaItem } from '../mockData';

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
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'servidores' | 'secretarias' | 'auditoria'>('servidores');
  
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
      ativo: true
    });
    setSenhaInput('');
    setIsFormServidorOpen(true);
  };

  const handleOpenEditarServidor = (u: UsuarioSistema) => {
    setEditingServidor({ ...u });
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
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
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
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
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

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center space-x-3 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Criptografia Ativa</span>
              <strong className="text-xs font-bold text-amber-700 dark:text-amber-300">SHA-256 + Salt</strong>
            </div>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('servidores')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
              activeTab === 'servidores'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Servidores & Senhas ({usuarios.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('secretarias')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
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
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
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

            <form onSubmit={handleSalvarServidorSubmit} className="p-5 space-y-4 text-xs">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cargo / Função (Opcional)</label>
                  <input
                    type="text"
                    value={editingServidor.cargo || ''}
                    onChange={e => setEditingServidor({ ...editingServidor, cargo: e.target.value })}
                    placeholder="Ex: Assistente Administrativo"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Departamento / Divisão</label>
                  <input
                    type="text"
                    value={editingServidor.departamento || ''}
                    onChange={e => setEditingServidor({ ...editingServidor, departamento: e.target.value })}
                    placeholder="Ex: Divisão de RH"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
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
                  placeholder="Ex: Carlos Eduardo Mendes"
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
