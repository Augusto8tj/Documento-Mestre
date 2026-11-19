import React, { useState, useEffect, useMemo } from 'react';
import { 
  Key, 
  X, 
  UserCheck, 
  CheckCircle2, 
  Send, 
  Clock, 
  AlertCircle,
  PhoneCall,
  ShieldCheck,
  UserPlus,
  Building2,
  Lock,
  ArrowRight
} from 'lucide-react';
import {
  UsuarioSistema,
  SecretariaItem,
  PedidoRecuperacaoSenha,
  getSecretariaSigla,
  isSameSecretaria,
  resolveCanonicalSecretariaName
} from '../mockData';

interface RecuperarSenhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMatricula?: string;
  usuarios: UsuarioSistema[];
  secretarias: SecretariaItem[];
  pedidosRecuperacao: PedidoRecuperacaoSenha[];
  onCriarPedidoRecuperacao: (
    matricula: string,
    contato: string,
    tipo?: 'REDEFINICAO' | 'NOVO_CADASTRO',
    dadosServidor?: Partial<UsuarioSistema>
  ) => void;
  onCadastrarServidor: (novoServidor: Partial<UsuarioSistema>, senhaInicial?: string) => Promise<boolean>;
  onShowToast: (msg: string, title?: string, isError?: boolean) => void;
  onSuccessCadastro?: (matricula: string) => void;
}

export const RecuperarSenhaModal: React.FC<RecuperarSenhaModalProps> = ({
  isOpen,
  onClose,
  initialMatricula = '',
  usuarios,
  secretarias,
  pedidosRecuperacao,
  onCriarPedidoRecuperacao,
  onCadastrarServidor,
  onShowToast,
  onSuccessCadastro
}) => {
  const [matriculaInput, setMatriculaInput] = useState('');
  const [contatoInput, setContatoInput] = useState('');
  
  // Campos do formulário de cadastro de novo servidor
  const [nomeInput, setNomeInput] = useState('');
  const [cargoInput, setCargoInput] = useState('');
  const [secretariaInput, setSecretariaInput] = useState('');
  const [departamentoInput, setDepartamentoInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('123456');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [cadastroRealizado, setCadastroRealizado] = useState(false);
  const [tabMode, setTabMode] = useState<'AUTO' | 'CADASTRO_FORCADO'>('AUTO');
  const [isOutroDepto, setIsOutroDepto] = useState(false);
  const [isOutroCargo, setIsOutroCargo] = useState(false);

  // Lista unificada de Secretarias vinda da Planilha (Secretarias + aba Usuarios)
  const secretariasParaCombo = useMemo(() => {
    const map = new Map<string, { sigla: string; nome: string; labelCompleta: string; departamentos: string[] }>();

    const adicionarSec = (rawSec: string, extraDeps: string[] = []) => {
      const clean = (rawSec || '').trim();
      if (!clean || clean.toUpperCase() === 'TODAS') return;
      const sigla = getSecretariaSigla(clean, secretarias);
      const canonical = resolveCanonicalSecretariaName(clean, secretarias);
      const nomeLimpo = canonical.replace(/\s*\([^)]+\)\s*$/, '').trim() || clean.replace(/\s*\([^)]+\)\s*$/, '').trim();
      const key = sigla.toUpperCase();

      const existing = map.get(key);
      if (existing) {
        extraDeps.forEach(d => {
          const dt = d.trim();
          if (dt && dt !== 'Geral' && !existing.departamentos.some(x => x.toLowerCase() === dt.toLowerCase())) {
            existing.departamentos.push(dt);
          }
        });
      } else {
        map.set(key, {
          sigla,
          nome: nomeLimpo,
          labelCompleta: `${nomeLimpo} (${sigla})`,
          departamentos: extraDeps.map(d => d.trim()).filter(d => d && d !== 'Geral')
        });
      }
    };

    (secretarias || []).forEach(s => {
      adicionarSec(`${s.nome} (${s.sigla})`, s.departamentos || []);
    });

    (usuarios || []).forEach(u => {
      const dep = (u.departamento || '').trim();
      const secs = (u.secretarias && u.secretarias.length > 0 ? u.secretarias : [u.secretaria]).filter(Boolean) as string[];
      secs.forEach(s => adicionarSec(s, dep ? [dep] : []));
    });

    return Array.from(map.values()).sort((a, b) => a.sigla.localeCompare(b.sigla, 'pt-BR'));
  }, [secretarias, usuarios]);

  // Departamentos dinâmicos da Secretaria selecionada (Planilha + Estrutura)
  const departamentosParaCombo = useMemo(() => {
    const set = new Set<string>();
    const selectedItem = secretariasParaCombo.find(
      s => s.labelCompleta === secretariaInput || s.sigla === secretariaInput || isSameSecretaria(s.labelCompleta, secretariaInput, secretarias)
    );
    if (selectedItem) {
      selectedItem.departamentos.forEach(d => set.add(d));
    }
    (usuarios || []).forEach(u => {
      if (!u.departamento || !u.departamento.trim()) return;
      const uSecs = (u.secretarias && u.secretarias.length > 0 ? u.secretarias : [u.secretaria]).filter(Boolean) as string[];
      if (uSecs.some(us => isSameSecretaria(us, secretariaInput, secretarias))) {
        set.add(u.departamento.trim());
      }
    });
    if (set.size === 0) {
      set.add('Gabinete');
      set.add('Geral');
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [secretariasParaCombo, secretariaInput, usuarios, secretarias]);

  // Cargos / Funções dinâmicos vindos da aba Usuarios da planilha + cargos municipais padrão
  const cargosParaCombo = useMemo(() => {
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
    (usuarios || []).forEach(u => {
      const c = (u.cargo || '').trim();
      if (c && c.toLowerCase() !== 'servidor municipal') {
        set.add(c);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [usuarios]);

  // Inicializa quando o modal abre
  useEffect(() => {
    if (isOpen) {
      const initial = initialMatricula.trim();
      setMatriculaInput(initial);
      setContatoInput('');
      setNomeInput('');
      setCargoInput('');
      setSenhaInput('123456');
      setPedidoEnviado(false);
      setCadastroRealizado(false);
      setTabMode('AUTO');
      setIsOutroDepto(false);
      setIsOutroCargo(false);

      // Define secretaria padrão da lista vinda da planilha (SMA ou primeira da lista)
      if (secretariasParaCombo.length > 0) {
        const sma = secretariasParaCombo.find(s => s.sigla.toUpperCase() === 'SMA');
        const target = sma || secretariasParaCombo[0];
        setSecretariaInput(target.labelCompleta);
        setDepartamentoInput(target.departamentos[0] || 'Gabinete');
      } else {
        setSecretariaInput('Secretaria Municipal de Administração (SMA)');
        setDepartamentoInput('Departamento de Recursos Humanos (DRH)');
      }
    }
  }, [isOpen, initialMatricula, secretariasParaCombo]);

  const cleanMatricula = matriculaInput.trim();

  // Busca em tempo real se a matrícula existe no cadastro de servidores
  const foundUser = useMemo(() => {
    if (!cleanMatricula) return null;
    return usuarios.find(u => String(u.matricula).trim().toLowerCase() === cleanMatricula.toLowerCase()) || null;
  }, [cleanMatricula, usuarios]);

  // Busca se já existe pedido para essa matrícula
  const pedidoExistente = useMemo(() => {
    if (!cleanMatricula) return null;
    return pedidosRecuperacao.find(p => String(p.matricula).trim() === cleanMatricula) || null;
  }, [cleanMatricula, pedidosRecuperacao]);

  if (!isOpen) return null;

  // Envio de Pedido de Redefinição de Senha (Servidor existente)
  const handleEnviarPedidoSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanMatricula) {
      onShowToast('Informe sua matrícula funcional.', 'Atenção', true);
      return;
    }

    onCriarPedidoRecuperacao(cleanMatricula, contatoInput.trim(), 'REDEFINICAO');
    setPedidoEnviado(true);
    onShowToast(`Pedido de redefinição para a matrícula ${cleanMatricula} enviado ao Administrador!`);
  };

  // Envio de Cadastro de Novo Servidor (Matrícula não cadastrada)
  const handleSalvarNovoCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanMatricula) {
      onShowToast('Informe a matrícula funcional.', 'Atenção', true);
      return;
    }
    if (!nomeInput.trim()) {
      onShowToast('Informe o nome completo do servidor.', 'Atenção', true);
      return;
    }

    setIsSubmitting(true);
    try {
      const novoUsuario: Partial<UsuarioSistema> = {
        matricula: cleanMatricula,
        nome: nomeInput.trim(),
        cargo: cargoInput.trim() || 'Servidor Municipal',
        secretaria: secretariaInput || 'SMA',
        departamento: departamentoInput.trim() || 'Geral',
        nivel: 'PADRAO',
        ativo: false
      };

      const senhaFinal = senhaInput.trim() || '123456';
      const ok = await onCadastrarServidor(novoUsuario, senhaFinal);

      if (ok) {
        // Envia a solicitação de autorização de novo cadastro para a fila do Administrador
        onCriarPedidoRecuperacao(cleanMatricula, contatoInput.trim(), 'NOVO_CADASTRO', novoUsuario);
        setCadastroRealizado(true);
        onShowToast(`Solicitação de cadastro de ${nomeInput.trim()} enviada para autorização do Administrador!`);
      } else {
        onShowToast('Não foi possível concluir o cadastro. Verifique os dados.', 'Erro', true);
      }
    } catch {
      onShowToast('Erro ao processar o cadastro.', 'Erro', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMatriculaInput('');
    setContatoInput('');
    setNomeInput('');
    setCargoInput('');
    setDepartamentoInput('');
    setPedidoEnviado(false);
    setCadastroRealizado(false);
    onClose();
  };

  const handleConcluirEIrParaLogin = () => {
    if (onSuccessCadastro && cleanMatricula) {
      onSuccessCadastro(cleanMatricula);
    }
    handleClose();
  };

  // Define se exibe o formulário de cadastro ou o pedido de redefinição
  const isModoCadastro = tabMode === 'CADASTRO_FORCADO' || (cleanMatricula !== '' && !foundUser);

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              isModoCadastro
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
            }`}>
              {isModoCadastro ? <UserPlus className="w-5 h-5" /> : <Key className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                {isModoCadastro ? 'Cadastro de Novo Servidor' : 'Recuperação de Senha'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prefeitura Municipal de Rio Claro – RJ • Acesso Direto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">

          {/* SUCESSO: SOLICITAÇÃO DE NOVO CADASTRO ENVIADA PARA AUTORIZAÇÃO */}
          {cadastroRealizado ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Solicitação Enviada para Autorização!</span>
              </div>
              <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                O cadastro de <b>{nomeInput}</b> na matrícula <code className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded font-mono font-bold text-amber-700 dark:text-amber-300">{cleanMatricula}</code> foi registrado e encaminhado ao <b>Administrador do Sistema (DRH/SMA)</b> para aprovação.
              </p>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <p><b>Secretaria:</b> {secretariaInput}</p>
                <p><b>Departamento:</b> {departamentoInput}</p>
                <p><b>Status Atual:</b> <span className="text-amber-600 dark:text-amber-400 font-bold">Pendente de Autorização do Administrador</span></p>
                <p><b>Acesso:</b> Assim que o Administrador autorizar seu cadastro no painel, você poderá entrar com sua matrícula e a senha definida.</p>
              </div>
              <button
                type="button"
                onClick={handleConcluirEIrParaLogin}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>Voltar à Tela de Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : pedidoEnviado ? (
            /* SUCESSO: PEDIDO DE SENHA ENVIADO AO ADMINISTRADOR */
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Pedido Registrado no Painel do Administrador!</span>
              </div>
              <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                Sua solicitação de redefinição de senha para a matrícula <b>{cleanMatricula}</b> já está na tela do Administrador do DRH/SMA.
              </p>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <p><b>Servidor:</b> {foundUser ? foundUser.nome : `Matrícula ${cleanMatricula}`}</p>
                <p><b>Status:</b> <span className="text-amber-600 dark:text-amber-400 font-bold">Pendente de Autorização</span></p>
                <p><b>Instruções:</b> Assim que o Administrador clicar em <i>"Redefinir"</i>, sua senha provisória será redefinida para a padrão <code className="font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded">123456</code>.</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-all shadow-xs cursor-pointer mt-1"
              >
                Voltar à Tela de Login
              </button>
            </div>
          ) : (
            <>
              {/* CAMPO DE MATRÍCULA FUNCIONAL COM DETECÇÃO IMEDIATA */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Digite sua Matrícula Funcional:
                  </label>
                  {cleanMatricula && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      foundUser 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {foundUser ? (
                        <>
                          <UserCheck className="w-3 h-3" />
                          <span>Cadastrado</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>Novo Cadastro</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={matriculaInput}
                    onChange={(e) => {
                      setMatriculaInput(e.target.value);
                      if (tabMode === 'CADASTRO_FORCADO') {
                        setTabMode('AUTO');
                      }
                    }}
                    placeholder="Ex: 1001, 20851, etc."
                    autoFocus
                    required
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <p className="text-[10px] text-slate-400">
                  {foundUser 
                    ? '✓ Servidor localizado! O formulário de redefinição de senha está pronto abaixo.'
                    : cleanMatricula 
                    ? '⚠️ Matrícula não cadastrada. O formulário de cadastro de novo servidor foi aberto automaticamente.'
                    : 'Digite sua matrícula para que o sistema identifique se você já possui cadastro ou precisa de novo cadastro.'
                  }
                </p>
              </div>

              {/* CASO 1: MATRÍCULA EM BRANCO */}
              {!cleanMatricula && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                  <Key className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Informe sua matrícula acima para continuar.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    O sistema abrirá <b>imediatamente</b> o formulário adequado: <b>redefinição de senha</b> para cadastrados ou <b>novo cadastro</b> para servidores novos.
                  </p>
                </div>
              )}

              {/* CASO 2: SERVIDOR LOCALIZADO NO SISTEMA -> FORMULÁRIO DE PEDIDO DE SENHA */}
              {cleanMatricula && foundUser && tabMode !== 'CADASTRO_FORCADO' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  
                  {/* Status de pedido já existente */}
                  {pedidoExistente && (
                    <div className={`p-3 rounded-xl border space-y-1.5 ${
                      pedidoExistente.status === 'PENDENTE'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {pedidoExistente.status === 'PENDENTE' ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Solicitação já enviada e em análise pelo Administrador</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Seu pedido já foi ATENDIDO!</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {pedidoExistente.status === 'PENDENTE' ? (
                          <>Enviado em <b>{pedidoExistente.dataHora}</b>. O Administrador já visualiza seu pedido.</>
                        ) : (
                          <>Senha provisória padrão: <b className="font-mono font-bold text-emerald-600">{pedidoExistente.senhaProvisoria || '123456'}</b>.</>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Ficha do Servidor Localizado */}
                  <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                        Servidor Localizado Oficialmente
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white">
                        Mat. {foundUser.matricula}
                      </span>
                    </div>
                    <strong className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
                      {foundUser.nome}
                    </strong>
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                      <p><b>Secretaria:</b> {foundUser.secretaria}</p>
                      {foundUser.departamento && <p><b>Departamento:</b> {foundUser.departamento}</p>}
                      {foundUser.cargo && <p><b>Cargo:</b> {foundUser.cargo}</p>}
                    </div>
                  </div>

                  <form onSubmit={handleEnviarPedidoSenha} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Ramal, WhatsApp ou Observação (Opcional):
                      </label>
                      <input
                        type="text"
                        value={contatoInput}
                        onChange={(e) => setContatoInput(e.target.value)}
                        placeholder="Ex: Ramal 1130 ou WhatsApp (24) 99881-2233"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Informa o Administrador onde enviar a confirmação ou entrar em contato.
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-900 dark:text-blue-300 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        Ao clicar no botão abaixo, sua matrícula entrará na aba <b>"Pedidos de Senha"</b> do Administrador, que poderá redefinir sua senha com 1 clique para a provisória <code className="font-bold font-mono">123456</code>.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar Pedido de Senha ao Administrador</span>
                    </button>
                  </form>
                </div>
              )}

              {/* CASO 3: MATRÍCULA NÃO CADASTRADA -> FORMULÁRIO DE CADASTRO DE NOVO SERVIDOR */}
              {isModoCadastro && cleanMatricula && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs text-amber-900 dark:text-amber-200 block">
                        Matrícula {cleanMatricula} não cadastrada no sistema.
                      </strong>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                        Preencha o formulário abaixo para registrar seu cadastro de servidor. O Administrador também receberá sua solicitação na fila.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSalvarNovoCadastro} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nome Completo do Servidor *
                      </label>
                      <input
                        type="text"
                        required
                        value={nomeInput}
                        onChange={(e) => setNomeInput(e.target.value)}
                        placeholder="Ex: Maria de Souza Santos"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Secretaria Municipal *
                          </label>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                            {secretariasParaCombo.length} da planilha
                          </span>
                        </div>
                        <select
                          value={secretariaInput}
                          onChange={(e) => {
                            const novaSec = e.target.value;
                            setSecretariaInput(novaSec);
                            setIsOutroDepto(false);
                            const matched = secretariasParaCombo.find(s => s.labelCompleta === novaSec);
                            setDepartamentoInput(matched?.departamentos?.[0] || 'Gabinete');
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                        >
                          {secretariasParaCombo.map((s) => (
                            <option key={s.sigla} value={s.labelCompleta}>
                              {s.sigla} — {s.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Departamento / Divisão
                        </label>
                        <select
                          value={isOutroDepto ? '__OUTRO__' : (departamentosParaCombo.includes(departamentoInput) ? departamentoInput : (departamentoInput ? '__OUTRO__' : ''))}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__OUTRO__') {
                              setIsOutroDepto(true);
                              setDepartamentoInput('');
                            } else {
                              setIsOutroDepto(false);
                              setDepartamentoInput(val);
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Selecione o departamento...</option>
                          {departamentosParaCombo.map((dep) => (
                            <option key={dep} value={dep}>
                              {dep}
                            </option>
                          ))}
                          <option value="__OUTRO__">➕ Outro departamento (digitar manualmente)...</option>
                        </select>
                        {isOutroDepto && (
                          <input
                            type="text"
                            value={departamentoInput}
                            onChange={(e) => setDepartamentoInput(e.target.value)}
                            placeholder="Digite o nome do departamento..."
                            className="mt-1.5 w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Cargo / Função
                        </label>
                        <select
                          value={isOutroCargo ? '__OUTRO__' : (cargosParaCombo.includes(cargoInput) ? cargoInput : (cargoInput ? '__OUTRO__' : ''))}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__OUTRO__') {
                              setIsOutroCargo(true);
                              setCargoInput('');
                            } else {
                              setIsOutroCargo(false);
                              setCargoInput(val);
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Selecione o cargo / função...</option>
                          {cargosParaCombo.map((cargo) => (
                            <option key={cargo} value={cargo}>
                              {cargo}
                            </option>
                          ))}
                          <option value="__OUTRO__">➕ Outro cargo (digitar manualmente)...</option>
                        </select>
                        {isOutroCargo && (
                          <input
                            type="text"
                            value={cargoInput}
                            onChange={(e) => setCargoInput(e.target.value)}
                            placeholder="Digite o cargo / função..."
                            className="mt-1.5 w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Ramal / WhatsApp (Contato)
                        </label>
                        <input
                          type="text"
                          value={contatoInput}
                          onChange={(e) => setContatoInput(e.target.value)}
                          placeholder="Ex: (24) 99881-2233"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Senha Desejada de Acesso
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={senhaInput}
                          onChange={(e) => setSenhaInput(e.target.value)}
                          placeholder="123456"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Padrão sugerido: <code className="font-mono font-bold">123456</code>. Você poderá alterá-la após o primeiro acesso.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isSubmitting ? 'Cadastrando Servidor...' : 'Cadastrar Servidor e Solicitar Acesso'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Contato Suporte DRH */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Dúvidas ou urgência?</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <PhoneCall className="w-3 h-3 text-sky-500" />
                  Ramal 407 • DRH/SMA
                </span>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {foundUser && cleanMatricula && (
              <button
                type="button"
                onClick={() => setTabMode(tabMode === 'CADASTRO_FORCADO' ? 'AUTO' : 'CADASTRO_FORCADO')}
                className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
              >
                {tabMode === 'CADASTRO_FORCADO' ? 'Voltar para Pedido de Senha' : 'Não sou este servidor? Cadastrar outro'}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
