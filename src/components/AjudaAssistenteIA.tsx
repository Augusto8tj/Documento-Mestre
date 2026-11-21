import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  BookOpen,
  Trash2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';

export interface AjudaChatTurn {
  id: string;
  pergunta: string;
  resposta: string;
  fonte?: string;
  piiProtegido?: boolean;
  timestamp: string;
}

interface AjudaAssistenteIAProps {
  variant: 'hero' | 'guia';
  userRole?: string;
  activeSecretaria?: string;
  userName?: string;
  onAbrirGuiaCompleto?: () => void;
  onIrParaAbaGuia?: (aba: 'escrever' | 'estilos' | 'importar' | 'numero' | 'livro' | 'senha' | 'comissoes' | 'app' | 'admin' | 'glossario' | 'faq') => void;
  initialQuestion?: string;
}

function formatModelLabel(fonte?: string | null): string | null {
  if (!fonte) return null;
  const f = fonte.trim();
  if (!f) return null;
  if (f.toLowerCase().includes('nemotron-3.5-bolt')) return 'NVIDIA Nemotron 3.5 Bolt';
  if (f.toLowerCase().startsWith('nvidia/')) return `NVIDIA ${f.slice(7)}`;
  if (f.toLowerCase() === 'gemini-4-hydrogen') return 'Gemini 4 Hydrogen';
  if (f.toLowerCase().includes('gemini')) return f.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return f;
}

const SUGESTOES_HERO = [
  'Como clonar o estilo de um PDF ou Word do meu setor?',
  'Como colocar assinatura dupla (Prefeito + Secretário)?',
  'Como funciona o Marco Zero da numeração?',
  'Onde encontro modelos da Procuradoria, Gabinete e Licitações?',
];

const SUGESTOES_GUIA: Array<{ categoria: string; perguntas: string[] }> = [
  {
    categoria: 'Redator & Estilos Visuais',
    perguntas: [
      'Como clonar o estilo visual de um PDF, DOCX ou ODT do meu setor?',
      'Como configurar Assinatura Dupla / Referendo (Prefeito + Secretário)?',
      'Qual a diferença entre o Modo Simples e o Modo Avançado no Redator?',
      'Como mudar a cor, cabeçalho e rodapé do papel timbrado?',
    ],
  },
  {
    categoria: 'Numeração, Livro & Planilha',
    perguntas: [
      'Como gerar número oficial sem duplicar entre secretarias?',
      'Quando devo usar Higienização (Excluir) ou Anulação de número?',
      'Como configurar o Marco Zero de uma secretaria nova?',
      'Como responder ou reaproveitar um documento do Livro?',
    ],
  },
  {
    categoria: 'OCR, Assinatura Digital & Setores',
    perguntas: [
      'O que acontece quando importo um PDF com assinatura digital Gov.br ou ICP-Brasil?',
      'Como o OCR abastece servidores, cargos e departamentos do sistema?',
      'Quais modelos já existem para Gabinete, PGM, Controladoria, Finanças e Lei 14.133?',
      'Como montar assinaturas em trio para Comissões de PAD/Sindicância?',
    ],
  },
];

function renderFormattedAnswer(text: string, isDarkHero: boolean) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];

  const renderInlineBold = (line: string) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong
            key={i}
            className={isDarkHero ? 'font-bold text-white' : 'font-bold text-slate-900 dark:text-slate-100'}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={i}
            className={
              isDarkHero
                ? 'px-1 py-0.5 rounded bg-white/15 font-mono text-[11px] text-white'
                : 'px-1 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200'
            }
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) {
      blocks.push(<div key={`sp-${idx}`} className="h-1.5" />);
      return;
    }

    if (/^[-•*]\s+/.test(line)) {
      const content = line.replace(/^[-•*]\s+/, '');
      blocks.push(
        <div key={idx} className="flex items-start gap-2 pl-1">
          <span
            className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
              isDarkHero ? 'bg-sky-300' : 'bg-sky-600 dark:bg-sky-400'
            }`}
          />
          <span className="leading-relaxed">{renderInlineBold(content)}</span>
        </div>
      );
      return;
    }

    const numMatch = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (numMatch) {
      blocks.push(
        <div key={idx} className="flex items-start gap-2 pl-0.5">
          <span
            className={`mt-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
              isDarkHero
                ? 'bg-white/20 text-white'
                : 'bg-sky-100 dark:bg-sky-900/70 text-sky-800 dark:text-sky-200'
            }`}
          >
            {numMatch[1]}
          </span>
          <span className="leading-relaxed">{renderInlineBold(numMatch[2])}</span>
        </div>
      );
      return;
    }

    if (/^#{1,3}\s+/.test(line)) {
      const heading = line.replace(/^#{1,3}\s+/, '');
      blocks.push(
        <p
          key={idx}
          className={`font-bold pt-1 ${
            isDarkHero ? 'text-white text-xs' : 'text-slate-900 dark:text-slate-100 text-xs'
          }`}
        >
          {renderInlineBold(heading)}
        </p>
      );
      return;
    }

    blocks.push(
      <p key={idx} className="leading-relaxed">
        {renderInlineBold(line)}
      </p>
    );
  });

  return <div className="space-y-1 text-xs">{blocks}</div>;
}

export const AjudaAssistenteIA: React.FC<AjudaAssistenteIAProps> = ({
  variant,
  userRole = 'EDITOR',
  activeSecretaria = '',
  userName = '',
  onAbrirGuiaCompleto,
  onIrParaAbaGuia,
  initialQuestion = '',
}) => {
  const [pergunta, setPergunta] = useState(initialQuestion);
  const [historico, setHistorico] = useState<AjudaChatTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isHeroAnswerExpanded, setIsHeroAnswerExpanded] = useState(true);
  const [modeloAtivo, setModeloAtivo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/ai/modelo-ativo')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled && data?.modelo) {
          setModeloAtivo(String(data.modelo));
        }
      })
      .catch(() => {
        // Silencioso: ao responder, a etiqueta usa exatamente data.fonte
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const enviarPergunta = async (textoPergunta?: string) => {
    const q = (textoPergunta !== undefined ? textoPergunta : pergunta).trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    setIsHeroAnswerExpanded(true);

    try {
      const response = await fetch('/api/ai/ajuda-sistema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pergunta: q,
          historico: historico.slice(-4).map(h => ({
            pergunta: h.pergunta,
            resposta: h.resposta,
          })),
          contextoUsuario: {
            perfil: userRole,
            secretaria: activeSecretaria,
            nome: userName,
            origem: variant === 'hero' ? 'Central de Início' : 'Guia de Ajuda',
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success || !data?.resposta) {
        throw new Error(data?.error || 'Não foi possível obter resposta da IA no momento.');
      }

      if (data.fonte) {
        setModeloAtivo(String(data.fonte));
      }

      const novoTurno: AjudaChatTurn = {
        id: `qa-${Date.now()}`,
        pergunta: q,
        resposta: String(data.resposta),
        fonte: data.fonte,
        piiProtegido: Boolean(data.piiProtegido),
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setHistorico(prev => [...prev, novoTurno]);
      setPergunta('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro de comunicação com o assistente de ajuda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (turn: AjudaChatTurn) => {
    navigator.clipboard.writeText(turn.resposta);
    setCopiedId(turn.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    enviarPergunta();
  };

  // =========================================================================
  // VARIANTE HERO: Bloco integrado ao Banner da Central de Início
  // =========================================================================
  if (variant === 'hero') {
    const ultimaResposta = historico.length > 0 ? historico[historico.length - 1] : null;
    const poweredLabel = formatModelLabel(ultimaResposta?.fonte || modeloAtivo);

    return (
      <div className="mt-5 pt-5 border-t border-white/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Tire dúvidas sobre o sistema com a IA</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </h3>
              <p className="text-[11px] text-white/75">
                Pergunte como emitir documentos, clonar estilos de PDF, gerar números ou usar qualquer recurso
              </p>
            </div>
          </div>

          {onAbrirGuiaCompleto && (
            <button
              type="button"
              onClick={onAbrirGuiaCompleto}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-semibold text-white transition-colors cursor-pointer shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Abrir Guia Completo</span>
            </button>
          )}
        </div>

        {/* Barra de Pergunta Direta */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-start gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={pergunta}
              onChange={e => setPergunta(e.target.value)}
              disabled={isLoading}
              placeholder="Ex.: Como clonar o estilo de um PDF do Gabinete ou colocar 2 assinaturas?"
              className="w-full px-3.5 py-2.5 bg-white/15 hover:bg-white/20 focus:bg-white/25 border border-white/30 rounded-xl text-xs sm:text-sm text-white placeholder:text-white/65 focus:outline-none focus:ring-2 focus:ring-white/70 transition-colors"
            />
          </div>
          <div className="flex flex-col items-stretch sm:items-end shrink-0 gap-1">
            <button
              type="submit"
              disabled={isLoading || !pergunta.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-sky-50 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Consultando IA...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Perguntar à IA</span>
                </>
              )}
            </button>
            {poweredLabel && (
              <span
                className="text-[10px] leading-none text-white/65 text-center sm:text-right select-none"
                title={`Motor de IA em uso: ${ultimaResposta?.fonte || modeloAtivo}`}
              >
                Powered by <span className="font-semibold text-white/80">{poweredLabel}</span>
              </span>
            )}
          </div>
        </form>

        {/* Sugestões Rápidas de 1 Clique */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-white/70 font-medium mr-0.5">Dúvidas rápidas:</span>
          {SUGESTOES_HERO.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => enviarPergunta(sug)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] text-white/90 hover:text-white transition-colors cursor-pointer disabled:opacity-50 text-left"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Mensagem de Erro Transparente */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-300/40 text-xs text-rose-100 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Não foi possível responder agora</p>
              <p className="text-rose-200/90 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Card de Resposta da IA dentro do Hero */}
        {ultimaResposta && (
          <div className="rounded-xl bg-slate-950/35 border border-white/25 backdrop-blur-xs overflow-hidden">
            <div className="px-3.5 py-2.5 bg-white/10 border-b border-white/15 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="text-xs font-bold text-white truncate">
                  {ultimaResposta.pergunta}
                </span>
                <span className="text-[10px] text-white/65 tabular-nums shrink-0">
                  {ultimaResposta.timestamp}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(ultimaResposta)}
                  className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] text-white font-medium inline-flex items-center gap-1 cursor-pointer"
                  title="Copiar resposta"
                >
                  {copiedId === ultimaResposta.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsHeroAnswerExpanded(prev => !prev)}
                  className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title={isHeroAnswerExpanded ? 'Recolher resposta' : 'Expandir resposta'}
                >
                  {isHeroAnswerExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHistorico([]);
                    setErrorMsg(null);
                  }}
                  className="p-1 rounded-md bg-white/10 hover:bg-rose-500/40 text-white/80 hover:text-white cursor-pointer"
                  title="Limpar resposta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isHeroAnswerExpanded && (
              <div className="p-3.5 text-white/95 space-y-2.5 max-h-72 overflow-y-auto">
                {renderFormattedAnswer(ultimaResposta.resposta, true)}
                {historico.length > 1 && (
                  <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-white/70">
                    <span>
                      {historico.length} perguntas respondidas nesta sessão (contexto mantido)
                    </span>
                    <button
                      type="button"
                      onClick={() => inputRef.current?.focus()}
                      className="font-semibold text-white hover:underline cursor-pointer"
                    >
                      Fazer pergunta complementar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VARIANTE GUIA: Aba interativa completa dentro do Guia de Orientações
  // =========================================================================
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <span>Assistente IA de Dúvidas do Sistema</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pergunte em linguagem natural sobre qualquer tela, botão, modelo ou regra do Banco Mestre da Prefeitura de Rio Claro – RJ.
          </p>
        </div>
        {historico.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setHistorico([]);
              setErrorMsg(null);
            }}
            className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar conversa</span>
          </button>
        )}
      </div>

      {/* Formulário de Pergunta */}
      <form
        onSubmit={handleSubmit}
        className="p-3.5 rounded-xl bg-gradient-to-br from-violet-50/80 to-sky-50/70 dark:from-violet-950/30 dark:to-sky-950/30 border border-violet-200 dark:border-violet-800/60 space-y-2.5"
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={inputRef}
            type="text"
            value={pergunta}
            onChange={e => setPergunta(e.target.value)}
            disabled={isLoading}
            placeholder="Digite sua dúvida sobre o sistema... (ex.: Como importar um PDF escaneado e salvar o estilo do setor?)"
            className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-violet-300 dark:border-violet-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            type="submit"
            disabled={isLoading || !pergunta.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Respondendo...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Perguntar à IA</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-violet-500" />
            <span>Gratuito para servidores • Proteção LGPD ativa (CPFs e e-mails são mascarados)</span>
          </span>
          {activeSecretaria && (
            <span className="font-medium text-slate-600 dark:text-slate-300">
              Contexto: {activeSecretaria}
            </span>
          )}
        </div>
      </form>

      {/* Erro Transparente */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Não foi possível consultar a IA</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Histórico de Respostas */}
      {historico.length > 0 && (
        <div className="space-y-3">
          {historico.map(turn => (
            <div
              key={turn.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 overflow-hidden shadow-2xs"
            >
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <HelpCircle className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {turn.pergunta}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 tabular-nums">{turn.timestamp}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(turn)}
                    className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === turn.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="p-4 text-slate-700 dark:text-slate-300">
                {renderFormattedAnswer(turn.resposta, false)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grade de Perguntas Sugeridas por Assunto */}
      <div className="space-y-2.5 pt-1">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Clique em uma dúvida frequente para testar agora:
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SUGESTOES_GUIA.map((grupo, gIdx) => (
            <div
              key={gIdx}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                {grupo.categoria}
              </div>
              <div className="space-y-1.5">
                {grupo.perguntas.map((q, qIdx) => (
                  <button
                    key={qIdx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => enviarPergunta(q)}
                    className="w-full text-left px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900/80 hover:bg-violet-50 dark:hover:bg-violet-950/50 border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 text-[11px] text-slate-700 dark:text-slate-300 hover:text-violet-900 dark:hover:text-violet-200 transition-colors cursor-pointer disabled:opacity-50 leading-snug"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Atalhos Diretos para Seções do Manual */}
      {onIrParaAbaGuia && (
        <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold">Ir direto ao manual ilustrado:</span>
          {(
            [
              { id: 'escrever', label: 'Redator' },
              { id: 'estilos', label: 'Estilos, Setores & PGM' },
              { id: 'importar', label: 'Importar & OCR' },
              { id: 'numero', label: 'Numeração & Marco Zero' },
              { id: 'admin', label: 'Administração' },
              { id: 'faq', label: 'FAQ' },
            ] as const
          ).map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onIrParaAbaGuia(item.id)}
              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-slate-700 dark:text-slate-300 hover:text-sky-800 dark:hover:text-sky-200 font-medium cursor-pointer transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
