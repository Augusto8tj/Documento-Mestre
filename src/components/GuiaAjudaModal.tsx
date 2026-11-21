import React, { useState } from 'react';
import { 
  HelpCircle, 
  X, 
  FileText, 
  Hash, 
  BookOpen, 
  Key, 
  Download, 
  Shield, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Search,
  Send,
  Building2,
  UserPlus,
  Scale,
  FileCheck2,
  ShieldCheck,
  Upload,
  Bot,
  Palette,
  Users,
  Landmark
} from 'lucide-react';
import { BRASAO_RIO_CLARO } from '../brasaoBase64';
import { AjudaAssistenteIA } from './AjudaAssistenteIA';

interface GuiaAjudaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReiniciarDicas?: () => void;
  isLoggedIn?: boolean;
  userRole?: string;
  activeSecretaria?: string;
  userName?: string;
}

type GuiaAbaId =
  | 'ia'
  | 'escrever'
  | 'estilos'
  | 'importar'
  | 'numero'
  | 'livro'
  | 'senha'
  | 'comissoes'
  | 'app'
  | 'admin'
  | 'glossario'
  | 'faq';

export const GuiaAjudaModal: React.FC<GuiaAjudaModalProps> = ({
  isOpen,
  onClose,
  onReiniciarDicas,
  isLoggedIn = false,
  userRole = 'EDITOR',
  activeSecretaria = '',
  userName = '',
}) => {
  const [activeTab, setActiveTab] = useState<GuiaAbaId>('ia');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [dicasReiniciadas, setDicasReiniciadas] = useState(false);
  const [buscaGuia, setBuscaGuia] = useState('');
  const [iaQuestionSeed, setIaQuestionSeed] = useState('');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleReverDicas = () => {
    if (typeof (window as any).reiniciarDicas === 'function') {
      (window as any).reiniciarDicas();
    } else if (onReiniciarDicas) {
      onReiniciarDicas();
    }
    setDicasReiniciadas(true);
    setTimeout(() => setDicasReiniciadas(false), 4000);
  };

  const faqs = [
    {
      q: 'Não consigo entrar no sistema. O que fazer?',
      a: 'Verifique se você digitou apenas os números de sua matrícula, sem pontos nem traços. Confira se o Caps Lock (tecla de maiúsculas) está desligado ao digitar a senha. Após 5 tentativas incorretas consecutivas, o sistema bloqueia temporariamente por 15 minutos para proteger sua conta.'
    },
    {
      q: 'Esqueci minha senha ou é meu primeiro acesso. Como faço?',
      a: 'Na tela de entrada, clique no botão "Primeiro acesso / Esqueci minha senha". Se você já possui cadastro, envie o pedido direto ao Administrador para redefinição. Se for servidor novo, preencha seus dados cadastrais e aguarde a liberação pelo Administrador (DRH/SMA • Ramal 407).'
    },
    {
      q: 'Fiz meu cadastro de primeiro acesso, mas aparece "Aguardando autorização". É normal?',
      a: 'Sim! Por segurança institucional, todo novo cadastro passa pela conferência do Administrador do sistema na aba "Autorizações & Senhas". Assim que aprovado, você já pode acessar com a matrícula e senha escolhidas. Em caso de urgência, contate o DRH/SMA pelo Ramal 407.'
    },
    {
      q: 'Apareceu a mensagem "Sessão expirada". O que aconteceu?',
      a: 'Por segurança e conformidade com a LGPD, o acesso expira após algumas horas de inatividade. Basta entrar novamente com sua matrícula e senha. Documentos emitidos continuam no Livro e textos não emitidos no Redator ficam protegidos pelo Rascunho Automático.'
    },
    {
      q: 'O número que gerei não aparece no Livro de Numeração?',
      a: 'Clique no botão de sincronização (🔄) no topo da tela para atualizar a visualização em nuvem. Verifique também os filtros rápidos (Todos, Hoje, Este mês, Meus documentos) ou clique em "Todos" para limpar filtros ativos.'
    },
    {
      q: 'Gerei um número de documento por engano ou fiz um teste. O que fazer?',
      a: 'Se o documento já foi protocolado ou circulou, o Administrador deve usar a opção "Anular / Cancelar Número (Protocolo)" na planilha Numeração: o número permanece reservado na sequência e recebe a marcação [ANULADO - motivo] com auditoria em Logs. Já para lançamentos de teste ou duplicidades antes de uso oficial, o Administrador pode utilizar a ferramenta de "Higienização (Excluir)" individualmente ou em lote, com justificativa registrada nos Logs.'
    },
    {
      q: 'A IA assistente do Redator é gratuita? Tem algum custo para os servidores? É segura pela LGPD?',
      a: 'Sim, é 100% gratuita para todos os servidores e secretarias — ninguém precisa cadastrar cartão nem chave de API pessoal. O sistema utiliza um motor híbrido no servidor (NVIDIA NIM Nemotron 3.5 Bolt como motor principal, com contingência automática para Gemini e motor local). Antes de qualquer envio externo, um filtro de conformidade LGPD mascara automaticamente CPFs e e-mails detectados no texto.'
    },
    {
      q: 'O que significam os asteriscos (*) e (**) nos cargos efetivos? E por que minha Função Gratificada/Comissão aparece na assinatura?',
      a: 'Na relação oficial de cargos efetivos da Prefeitura de Rio Claro – RJ, "*" indica Cargo em Extinção (extinto na vacância) e "**" indica Cargo Extinto. Já os cargos de Subsídio (SS), Comissão (CC-01 a CC-08 — Anexo I) e Funções Gratificadas (FG — Anexo II) ficam no campo específico do cadastro e são priorizados automaticamente na linha de assinatura do Redator Oficial, preservando o cargo efetivo para portarias e comissões.'
    },
    {
      q: 'A tela ficou travada ou o layout parece desconfigurado?',
      a: 'Recarregue a página limpando o cache temporário do navegador pressionando simultaneamente as teclas Ctrl + F5 (ou Cmd + Shift + R no Mac). No celular, você também pode abrir o seletor de "Tema e Cores" e escolher o estilo de formulário "Celular / Toque Ampliado".'
    },
    {
      q: 'Quais formatos de documento posso importar com OCR? E se o arquivo tiver assinatura digital?',
      a: 'Clique em "Importar / OCR" na barra superior ou na Central de Início. O sistema aceita envio individual ou em lote de PDF (digital, escaneado ou apresentação até 10 MB), fotos (.jpg/.png/.webp até 10 MB), LibreOffice (.odt), Word atual e antigo (.docx e .doc binário), .rtf, planilhas .csv (Excel Brasil com ; ou ,) e .txt/.html (até 5 MB), incluindo OCR em imagens embutidas. Quando há assinatura digital (ICP-Brasil, Gov.br, PAdES, XMLDSig), o arquivo é lido em modo somente-leitura, o hash SHA-256 é calculado sem alterar o original e o sistema protege a validade jurídica orientando a indexação no Livro sem reexportar o arquivo assinado.'
    },
    {
      q: 'Como clonar o estilo visual de um PDF, DOCX ou ODT do meu setor?',
      a: 'Clique em "Clonar de PDF/DOCX" dentro do Redator Oficial (ou abra "Importar / OCR" no topo). Envie um documento modelo do seu setor (ex.: Gabinete do Prefeito, PGM, Controladoria ou Finanças). O sistema analisa automaticamente fonte, tamanho, margens, cabeçalho, cor, ementa, rodapé e assinatura e exibe o botão "Salvar Estilo p/ o Setor". Depois basta selecionar esse estilo no combo "Estilo do Setor" dentro do Redator.'
    },
    {
      q: 'Como colocar assinatura dupla (Prefeito + Secretário / Procurador-Geral) em Decretos e Projetos de Lei?',
      a: 'Na seção "Assinatura & Órgão Emissor" do Redator Oficial (disponível mesmo no Modo Simples), clique no botão "Dupla / Referendo". Preencha ou escolha no combo a 2ª autoridade (Secretário ou Procurador-Geral). As duas assinaturas aparecerão perfeitamente alinhadas lado a lado na prévia, na impressão timbrada, no PDF, no Word (.doc) e no arquivo .txt.'
    },
    {
      q: 'Onde encontro modelos prontos da Procuradoria (PGM), Gabinete do Prefeito, Controladoria, Finanças e Licitações (Lei 14.133/21)?',
      a: 'No Banco de Modelos (ou pelos botões de grupo no topo do Redator), você encontra categorias completas e prontas: 10 modelos do Gabinete do Prefeito (Decretos, Mensagens de Lei/Veto, Posse, Portarias), peças jurídicas e judiciais da PGM (Parecer, Nota Técnica, Petição, Contrato, Notificação, CDA, Procuração), Controladoria-Geral (Auditoria, Recomendação, Diligência), Fazenda/Finanças (LRF, CDO, Impacto Orçamentário) e Licitações Lei 14.133/2021 (DFD, ETP, TR, Dispensa/Inexigibilidade, Aditivo).'
    },
    {
      q: 'Quando o sistema sincroniza em segundo plano, eu perco a tela ou o documento em que estou trabalhando?',
      a: 'Não! A sincronização automática em nuvem atualiza os dados silenciosamente em segundo plano sem recarregar a página nem voltar para a tela inicial. Além disso, o Redator mantém auto-save constante do rascunho no seu navegador.'
    },
    {
      q: 'Como aprovar ou recusar cadastros pendentes / servidores inativos na fila de liberação?',
      a: 'Administradores podem acessar "Gestão" > aba "Autorizações & Senhas". Na seção "Servidores Inativos / Aguardando Liberação na Planilha", cada linha possui botões dedicados para "Aprovar / Liberar Acesso" ou "Recusar" (removendo o pedido indevido com confirmação segura e registro em auditoria).'
    },
    {
      q: 'Como desativo ou mostro novamente os balões de dicas flutuantes?',
      a: 'Em qualquer balão de dica que aparecer, você pode clicar em "Parar dicas" para ocultá-las. Além disso, os ícones de interrogação (?) ao lado dos campos podem ser clicados ou sobrepostos com o mouse a qualquer momento. Para reativar todas as dicas flutuantes automáticas, clique no botão "Mostrar as dicas de novo" logo abaixo.'
    }
  ];

  const buscaNormalizada = buscaGuia.trim().toLowerCase();
  const faqsFiltradas = buscaNormalizada
    ? faqs.filter(f => f.q.toLowerCase().includes(buscaNormalizada) || f.a.toLowerCase().includes(buscaNormalizada))
    : faqs;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        id="modal-guia-ajuda"
        className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:w-[95vw] sm:max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95dvh] sm:max-h-[92dvh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-300 dark:border-sky-800 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 tracking-tight">
                  Guia de Orientações & Ajuda ao Servidor
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-300 dark:border-emerald-700">
                  v2.1 Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Prefeitura Municipal de Rio Claro – RJ • Assistente IA de dúvidas, passo a passo ilustrado e respostas rápidas
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              title="Imprimir Guia Oficial"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Fechar Guia"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Busca Rápida no Guia / Encaminhamento para IA */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={buscaGuia}
              onChange={e => {
                setBuscaGuia(e.target.value);
                if (e.target.value.trim() && activeTab !== 'faq' && activeTab !== 'ia') {
                  setActiveTab('faq');
                }
              }}
              placeholder="Buscar no Guia (ex.: clonar PDF, assinatura dupla, Marco Zero, PGM, senha)..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          {buscaGuia.trim() && (
            <button
              type="button"
              onClick={() => {
                setIaQuestionSeed(buscaGuia.trim());
                setActiveTab('ia');
              }}
              className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Perguntar à IA</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/50 flex-shrink-0 scrollbar-none text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('ia')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ia'
                ? 'bg-violet-600 text-white shadow-xs font-bold'
                : 'text-violet-700 dark:text-violet-300 bg-violet-50/80 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/60 border border-violet-200 dark:border-violet-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Perguntar à IA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('escrever')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'escrever'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Escrever Documento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('estilos')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'estilos'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/60'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Estilos, Setores &amp; PGM</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('importar')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'importar'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar &amp; OCR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('numero')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'numero'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Pegar Número</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('livro')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'livro'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Consultar Livro</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('senha')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'senha'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Senha & Acesso</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comissoes')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'comissoes'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Comissões & PAD/CAC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('app')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'app'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar no PC/Celular</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Administradores</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('glossario')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'glossario'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Glossário</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'faq'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Algo deu errado? (FAQ)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          
          {/* Box de 3 Passos Essenciais (Aparece no topo) */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-800/70 dark:to-sky-950/40 p-4 rounded-xl border border-sky-200 dark:border-sky-800/60">
            <h4 className="font-bold text-xs uppercase tracking-wider text-sky-800 dark:text-sky-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-500" />
              Os 3 Primeiros Passos no Banco Mestre
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-sky-100 dark:border-slate-700">
                <span className="font-black text-sky-600 dark:text-sky-400 text-sm block mb-1">1. Central de Início e Pasta</span>
                Após o login, a <b>Central de Início</b> mostra sua <b>Secretaria Ativa</b>, rascunhos pendentes, atos recentes e atalhos diretos para cada módulo.
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-sky-100 dark:border-slate-700">
                <span className="font-black text-sky-600 dark:text-sky-400 text-sm block mb-1">2. Escolha a Tarefa</span>
                Acesse direto o <b>Redator Oficial</b>, <b>Despachos</b>, <b>Livro de Numeração</b>, <b>Importar PDF/DOCX</b> ou alterne entre <b>Início</b> e <b>Modelos</b> no topo.
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-sky-100 dark:border-slate-700">
                <span className="font-black text-sky-600 dark:text-sky-400 text-sm block mb-1">3. Gere o Número e Exporte</span>
                Clique em <b>Gerar Número Oficial</b>, revise na visualização flutuante e baixe direto em <b>PDF A4 Timbrado</b> ou <b>Word (.doc)</b>.
              </div>
            </div>
          </div>

          {/* TAB: PERGUNTAR À IA */}
          {activeTab === 'ia' && (
            <AjudaAssistenteIA
              key={iaQuestionSeed || 'guia-ia'}
              variant="guia"
              userRole={userRole}
              activeSecretaria={activeSecretaria}
              userName={userName}
              initialQuestion={iaQuestionSeed}
              onIrParaAbaGuia={aba => setActiveTab(aba)}
            />
          )}

          {/* TAB: ESCREVER DOCUMENTO */}
          {activeTab === 'escrever' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-500" />
                  Como Escrever e Emitir Documentos no Redator Oficial
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Siga o fluxo oficial de criação com numeração automática, salvamento em tempo real e visualização timbrada.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</div>
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Modo Simples vs. Modo Avançado</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      O Redator abre por padrão no <b>Modo Simples</b>, exibindo apenas os campos essenciais do dia a dia (Tipo, Destinatário, Assunto, Texto, Formatação básica e Numeração). Precisa de mais controles? Clique em <b>"Avançado"</b> no topo do Redator para liberar <b>Local e Data personalizados (além do automático), Régua de Parágrafos, Margens A4, Importação de Arquivos, Referência a Documento Anterior, Fontes/Tamanhos e Comissões de PAD/TAC</b>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Escolha o Tipo, Destinatário e Assunto</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Selecione entre <b>Memorando</b> (interno), <b>Ofício</b> (externo), <b>Despacho</b>, <b>Circular</b>, <b>Portaria</b>, <b>E-mail</b> (ou <b>Decreto / Ato PAD / Termo TAC</b> no Modo Avançado). Utilize os combos inteligentes com a base municipal de secretarias e os modelos padronizados de assunto.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Editor Visual em Tempo Real (WYSIWYG), Margens e Régua Oficial</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      O Redator conta com <b>Editor Visual em Tempo Real</b>: ao aplicar <b>Negrito</b>, <i>Itálico</i>, sublinhado, listas ou recuos, você já enxerga o resultado formatado na hora (sem códigos ou asteriscos). Ao colar textos externos ou importar arquivos (<code>.pdf</code>, <code>.docx</code>, <code>.doc</code> ou <code>.txt</code>), o sistema limpa espaços residuais automaticamente. No <b>Modo Avançado</b>, ajuste as 4 margens da página A4 (padrão PMRC: <b>Esq. 3,0 cm</b>, <b>Dir. 2,0 cm</b>, <b>Sup. 2,5 cm</b>, <b>Inf. 2,0 cm</b>) e controle na Régua a <b>1ª Linha</b> (1,50 cm) e a <b>2ª Linha</b> (0,00 cm) ou use <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[10px] font-mono">Tab</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[10px] font-mono">Shift+Tab</kbd>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">4</div>
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Assistente de IA Híbrido (Gratuito + Proteção LGPD)</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Clique em <b>"Assistente IA"</b> dentro do Redator para redigir minutas do zero, revisar gramática, formalizar a linguagem administrativa ou resumir ofícios. O motor híbrido (<b>NVIDIA NIM Nemotron 3.5 Bolt</b> + contingência automática <b>Gemini</b> e motor local) é <b>100% gratuito para os servidores</b> e aplica <b>mascaramento automático de CPFs e e-mails (LGPD)</b> antes do envio externo.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">5</div>
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Tela Toda, Prévia Flutuante e Assinatura Inteligente</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      A janela do Redator pode ser expandida com <b>"Tela Toda"</b> ou redimensionada pelas bordas. Ative a <b>"Prévia Flutuante"</b> para acompanhar o papel timbrado A4 enquanto escreve. Se o seu cadastro tiver <b>Cargo em Comissão (Anexo I)</b> ou <b>Função Gratificada (Anexo II)</b>, ele já vem selecionado automaticamente na assinatura do documento.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">6</div>
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Numeração Automática e Exportação em PDF A4 ou Word</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Confira o <b>Próximo Nº Previsto</b>, clique em <b>"Gerar e Reservar Número Agora"</b> e exporte em <b>PDF A4 Timbrado</b> (pronto para impressão/assinatura) ou <b>Word (.doc)</b>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <b>Rascunho Automático (Auto-save) Ativo:</b> Enquanto você digita, o Redator salva seu rascunho automaticamente a cada instante (exibindo <i>"Rascunho salvo às HH:mm"</i> no topo). Se fechar sem querer ou a energia cair, ao reabrir o Redator basta clicar em <b>"Restaurar rascunho"</b> (ou <b>"Descartar"</b>). O rascunho é limpo automaticamente após a emissão do número oficial.
                </div>
              </div>
            </div>
          )}

          {/* TAB: ESTILOS VISUAIS, SETORES & PROCURADORIA (PGM) */}
          {activeTab === 'estilos' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-500" />
                  Perfis Visuais por Setor, Clonador de PDF, Assinatura Dupla &amp; Modelos Setoriais
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Padronize o timbrado de cada órgão da Prefeitura, clone estilos de arquivos existentes e use minutas prontas para todos os setores.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-1.5">
                  <h5 className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    1. 6 Perfis Oficiais + Clonador de PDF/DOCX/ODT
                  </h5>
                  <p className="text-indigo-900 dark:text-indigo-300 leading-relaxed">
                    No topo do Redator, escolha o <b>Estilo do Setor</b> (<i>PMRC/SMA</i>, <i>Gabinete Solene</i>, <i>PGM Jurídico</i>, <i>Controladoria CGM</i>, <i>Finanças SMF</i> ou <i>Secretarias</i>). Quer copiar exatamente o padrão de um arquivo real do setor? Clique em <b>"Clonar de PDF/DOCX"</b>, suba o modelo e salve o estilo para reutilizar em 1 clique.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-1.5">
                  <h5 className="font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    2. Assinatura Dupla / Referendo (Prefeito + Secretário)
                  </h5>
                  <p className="text-purple-900 dark:text-purple-300 leading-relaxed">
                    Na área de assinaturas do Redator (mesmo no Modo Simples), alterne para <b>"Dupla / Referendo"</b> e escolha a 2ª autoridade no combo. As assinaturas saem lado a lado na prévia, impressão timbrada, PDF, Word (<code>.doc</code>) e <code>.txt</code> — ativada automaticamente em Decretos, Projetos de Lei e Termos de Posse.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                <h5 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  3. Biblioteca Ampliada por Setor Municipal (Pronta para Uso)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <div className="p-2.5 bg-white dark:bg-slate-900/70 rounded-lg border border-slate-200 dark:border-slate-700">
                    <b className="text-slate-900 dark:text-slate-100 block mb-0.5">Gabinete do Prefeito (GP)</b>
                    <span className="text-slate-600 dark:text-slate-400">Decretos (Normativo, Ponto Facultativo, Crédito Suplementar, Nomeação/Exoneração), Projetos de Lei, Veto, Portarias, Ofício de Gabinete, Despacho Decisório e Termo de Posse.</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900/70 rounded-lg border border-slate-200 dark:border-slate-700">
                    <b className="text-slate-900 dark:text-slate-100 block mb-0.5">Procuradoria-Geral (PGM)</b>
                    <span className="text-slate-600 dark:text-slate-400">Parecer Jurídico, Nota Técnica/Cota, Petição Judicial (CPC/Fazenda Pública), Notificação Extrajudicial, Recomendação, Contrato/Aditivo, Decisão, CDA, Procuração e Checklist.</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900/70 rounded-lg border border-slate-200 dark:border-slate-700">
                    <b className="text-slate-900 dark:text-slate-100 block mb-0.5">Controladoria-Geral (CGM)</b>
                    <span className="text-slate-600 dark:text-slate-400">Relatório de Auditoria Interna, Recomendação de Controle Interno, Nota Técnica Preventiva e Diligência/Prestação de Contas.</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900/70 rounded-lg border border-slate-200 dark:border-slate-700">
                    <b className="text-slate-900 dark:text-slate-100 block mb-0.5">Fazenda e Finanças (SMF)</b>
                    <span className="text-slate-600 dark:text-slate-400">Declaração de Adequação Orçamentária (LRF arts. 16 e 17), Certidão de Disponibilidade (CDO), Parecer de Impacto e Notificação Fiscal.</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900/70 rounded-lg border border-slate-200 dark:border-slate-700">
                    <b className="text-slate-900 dark:text-slate-100 block mb-0.5">Licitações — Lei 14.133/21</b>
                    <span className="text-slate-600 dark:text-slate-400">DFD, Estudo Técnico Preliminar (ETP), Termo de Referência (TR), Justificativa de Dispensa/Inexigibilidade e Termo de Aditivo/Apostilamento.</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900/70 rounded-lg border border-slate-200 dark:border-slate-700">
                    <b className="text-slate-900 dark:text-slate-100 block mb-0.5">Secretarias Finalísticas</b>
                    <span className="text-slate-600 dark:text-slate-400">Saúde (SMS), Educação (SME), Obras/Medição (SMOSP), Assistência Social (SMAS), Posturas/Meio Ambiente e Previdência (IPRC).</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: IMPORTAR E CATALOGAR DOCUMENTOS & OCR */}
          {activeTab === 'importar' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-500" />
                  Importar, OCR Multi-Formato &amp; Proteção de Assinatura Digital
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Envie ofícios, memorandos, portarias, planilhas ou documentos digitalizados em diversos formatos para reconhecimento automático e catalogação segura.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</div>
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Formatos Aceitos (Individual ou em Lote)</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Clique em <b>"Importar / OCR"</b> no topo ou na barra inferior do celular e envie <b>1 ou vários arquivos</b>:
                      {' '}<code>.pdf</code> (pesquisável, escaneado ou apresentação) e fotos <code>.jpg / .png / .webp</code> até <b>10 MB</b>;
                      {' '}<code>.odt</code> (LibreOffice Writer), <code>.docx</code> e <code>.doc</code> (Word atual e legado 97–2003), <code>.rtf</code>, <code>.csv</code> (com detecção automática de <code>;</code> ou <code>,</code> e acentos do Excel Brasil), <code>.txt</code> e <code>.html</code> até <b>5 MB</b>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Extração Híbrida + OCR em Imagens Embutidas</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Textos digitais são extraídos instantaneamente; já PDFs escaneados, fotos ou arquivos <code>.docx/.odt/.rtf</code> que contenham imagens coladas de documentos passam automaticamente por <b>OCR</b>. O sistema identifica <b>Tipo</b>, <b>Categoria</b>, <b>Título</b>, <b>Assunto</b>, <b>Destinatário</b>, <b>Secretaria</b>, <b>Número/Data</b>, <b>Base Legal</b> e <b>Palavras-Chave</b> sem gravar arquivos pesados no Drive.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Preservação de Documentos com Assinatura Digital (ICP-Brasil / Gov.br / XMLDSig)</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Ao detectar assinatura criptográfica em <b>PDF (PAdES/ByteRange)</b>, <b>ODT (META-INF XMLDSig)</b>, <b>DOCX (_xmlsignatures)</b>, <b>DOC</b> ou carimbos <b>Gov.br / ICP-Brasil / SEI</b>, o sistema ativa o <b>Modo Preservação</b>: lê o arquivo apenas em modo leitura, calcula o <b>hash SHA-256 original</b>, protege o texto contra edição acidental e permite indexar o ato no Livro com o hash e o link do arquivo original intacto — evitando que a validade jurídica da assinatura seja perdida.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">4</div>
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Escolha o Destino (Individual ou em Lote)</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                        <b className="text-emerald-900 dark:text-emerald-200 block mb-0.5">Livro de Numeração</b>
                        <span className="text-emerald-800 dark:text-emerald-300">Cataloga no histórico mantendo o número original, registrando o hash SHA-256 e o link do arquivo assinado intacto.</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
                        <b className="text-indigo-900 dark:text-indigo-200 block mb-0.5">Banco de Modelos</b>
                        <span className="text-indigo-800 dark:text-indigo-300">Deriva minutas parametrizadas com <code>[CAMPOS]</code> (sem dados pessoais ou assinaturas) para reutilização pela equipe.</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60">
                        <b className="text-sky-900 dark:text-sky-200 block mb-0.5">Redator Oficial</b>
                        <span className="text-sky-800 dark:text-sky-300">Abre o texto (ou uma cópia derivada editável, mantendo o original assinado à parte) no Timbrado A4 oficial.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">5</div>
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Abastecimento Inteligente do Sistema via OCR (com Validação Humana)</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Ao importar Portarias de Nomeação/Exoneração, Designações de FG/CC, Ofícios ou Memorandos, o OCR também extrai <b>Servidores e Matrículas</b>, <b>Departamentos/Divisões</b>, <b>Cargos novos</b>, <b>Destinatários frequentes</b> e <b>Numeração mais recente (Marco Zero)</b>. Nada é alterado automaticamente: um painel dedicado exibe cada achado para o servidor ou <b>ADMIN</b> confirmar com 1 clique e abastecer os combos e cadastros oficiais com registro em auditoria.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-sky-50 dark:bg-sky-950/40 p-3 rounded-lg border border-sky-200 dark:border-sky-800/50 text-xs text-sky-900 dark:text-sky-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <b>Atalho Rápido no Redator e em Novo Modelo:</b> Todos esses formatos (<code>.pdf</code>, <code>.odt</code>, <code>.docx</code>, <code>.doc</code>, <code>.rtf</code>, <code>.csv</code>, <code>.txt</code> e fotos) também podem ser enviados diretamente pelo botão de upload dentro do <b>Redator Oficial</b> (Modo Avançado) ou do formulário de <b>Novo Modelo</b>.
                </div>
              </div>
            </div>
          )}

          {/* TAB: PEGAR NÚMERO */}
          {activeTab === 'numero' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-sky-500" />
                  Como Funciona a Numeração Oficial Sequencial
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Garantia de unicidade e validade jurídica para os atos da Prefeitura de Rio Claro.
                </p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <p>
                  A numeração de documentos é <b>sequencial, anual e exclusiva por Secretaria Municipal</b>. Isso significa que o Memorando nº 001/2026 da Secretaria Municipal de Administração (SMA) não se confunde com o Memorando nº 001/2026 da Secretaria Municipal de Educação (SME).
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200">Regras de Ouro da Numeração:</h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                    <li><b>Gere o número somente quando o documento for definitivo:</b> Não gere números para simples testes ou rascunhos descartáveis.</li>
                    <li><b>Identificação permanente:</b> Cada número gerado armazena o nome e a matrícula do servidor emissor, a data, hora exata e o destinatário.</li>
                    <li><b>Numeração sem saltos:</b> O sistema calcula o próximo número consultando a base mestre no Google Apps Script / Nuvem, evitando duplicações mesmo com múltiplos servidores emitindo simultaneamente.</li>
                    <li><b>Sequência Global Municipal (Decretos e Portarias):</b> Atos normativos municipais (como <code>DECRETO</code> e <code>PORTARIA</code>) seguem uma sequência única para toda a Prefeitura, independentemente da secretaria emissora.</li>
                  </ul>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800/50 text-indigo-900 dark:text-indigo-200">
                  <b>Marco Zero de Implantação:</b> Secretarias que passam a usar o sistema no meio do ano (com numeração já em andamento em livro físico ou planilha anterior) podem registrar o <b>Marco Zero</b> no Painel Administrativo (aba <i>Numeração &amp; Marco Zero</i>). A partir daí, o sistema continua automaticamente do número seguinte (ex: Marco Zero em <code>412/2026</code> → próximo gerado será <code>413/2026</code>).
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300">
                  <b>Incluir Sigla da Secretaria:</b> Você pode marcar a caixa "Incluir Sigla" (ex: <i>Memo nº 042/2026 - SMA</i>) para facilitar a tramitação entre secretarias e identificação rápida nos gabinetes.
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONSULTAR LIVRO */}
          {activeTab === 'livro' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-500" />
                  Livro de Numeração & Consulta Rápida de Atos
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Acesse o histórico de expedição, filtre por pastas e responda documentos de forma cruzada.
                </p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <p>
                  O <b>Livro de Numeração</b> é o cartório eletrônico de todos os atos emitidos no município. Nele você pode:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-sky-500" />
                      Filtros Rápidos & Ordenação por Data
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400">
                      Use os botões rápidos de 1 clique (<b>Todos</b>, <b>Meus documentos</b>, <b>Hoje</b>, <b>Este mês</b>, <b>Ofícios</b> e <b>Memorandos</b>) e alterne a classificação da coluna <b>DataHora</b> entre <b>Mais recentes (Decrescente)</b> e <b>Mais antigos (Crescente)</b>.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      Reaproveitar Documento ("Usar como base")
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400">
                      Precisa emitir um documento parecido com outro já expedido? Clique em <b>"Usar como base"</b> para copiar tipo, destinatário e assunto direto para o Redator <b>sem repetir o número antigo</b> — um novo número sequencial será gerado ao finalizar.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-emerald-500" />
                      Resposta Oficial Cruzada
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400">
                      Ao clicar em <b>"Responder"</b> em um documento do Livro (ou na barra <b>"Atos Recentes"</b> no topo), o Redator abre preenchido com o destinatário e citando automaticamente o número anterior no assunto.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                      Cartões Mobile & Privacidade por Escopo
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400">
                      Alterne entre visualização em <b>Cartões</b> (ideal no celular) ou <b>Tabela</b>. A listagem respeita automaticamente o nível de acessibilidade configurado para sua matrícula (Secretaria, Departamento ou Próprios).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SENHA & ACESSO */}
          {activeTab === 'senha' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-500" />
                  Acesso, Verificação de Matrícula, Autoatendimento e Aprovação (v1.6)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Fluxo simplificado na tela de login com 2 ações diretas, alteração do próprio nome/senha e controle administrativo.
                </p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                {/* 1. Verificação Instantânea */}
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                  <h5 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    1. Verificação Instantânea de Matrícula na Tela de Login
                  </h5>
                  <p className="text-emerald-800 dark:text-emerald-300">
                    Ao digitar sua matrícula funcional na tela inicial, o sistema informa o status na hora:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-emerald-900 dark:text-emerald-300 pl-1">
                    <li><b>Cadastrado e ativo:</b> exibe o selo verde <code>✓ Cadastrado</code> com seu <b>Nome</b>, <b>Secretaria</b> e <b>Cargo</b>.</li>
                    <li><b>Aguardando autorização:</b> exibe aviso informando que seu cadastro já foi enviado e aguarda liberação do Administrador (<b>DRH/SMA • Ramal 407</b>).</li>
                    <li><b>Não cadastrado:</b> exibe o selo âmbar <code>Não cadastrado</code> e o botão imediato <b>"Cadastrar Agora"</b>.</li>
                  </ul>
                </div>

                {/* 2. Recuperação de Senha */}
                <div className="bg-sky-50 dark:bg-sky-950/40 p-3.5 rounded-xl border border-sky-200 dark:border-sky-800/60 space-y-1.5">
                  <h5 className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    2. Primeiro Acesso ou Senha Esquecida
                  </h5>
                  <ol className="list-decimal list-inside space-y-1 text-sky-900 dark:text-sky-300 pl-1">
                    <li>Clique no botão <b>"Primeiro acesso / Esqueci minha senha"</b> logo abaixo de "Entrar no Sistema".</li>
                    <li>Se você já tem cadastro, informe seu ramal/WhatsApp e envie o pedido de redefinição ao Administrador.</li>
                    <li>O Administrador visualiza a solicitação na aba <b>"Autorizações & Senhas"</b> e libera com 1 clique.</li>
                  </ol>
                </div>

                {/* 3. Primeiro Acesso / Novo Cadastro */}
                <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                  <h5 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    3. Cadastro de Novo Servidor (Sujeito à Autorização do Administrador)
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-amber-900 dark:text-amber-300 pl-1">
                    <li>Preencha seu <b>Nome Completo</b>, <b>Secretaria de Lotação</b>, <b>Cargo</b> e a senha desejada.</li>
                    <li>Ao clicar em <b>"Cadastrar Servidor e Solicitar Acesso"</b>, o pedido vai imediatamente para a fila <b>"Autorizações & Senhas"</b> do Administrador do sistema.</li>
                    <li>Por segurança, o acesso permanece <b>aguardando liberação</b> até que o Administrador autorize sua conta (urgência: <b>Ramal 407 • DRH/SMA</b>).</li>
                  </ul>
                </div>

                {/* 4. Autoatendimento: Alterar Nome e Senha Logado */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">4. Como Alterar seu Nome ou Senha Estando Logado:</h5>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
                    <li>No cabeçalho do sistema, clique no ícone da <b>Chave (🔑)</b> próximo ao seu perfil.</li>
                    <li>Você pode corrigir/atualizar seu <b>Nome Completo</b> (que passa a sair nas assinaturas e documentos) e/ou definir uma <b>Nova Senha</b> informando a senha atual.</li>
                    <li>Clique em <b>Salvar Alterações</b>. A atualização sincroniza instantaneamente com a planilha da Prefeitura.</li>
                  </ol>
                </div>

                <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
                  <b>Segurança Institucional:</b> Nunca compartilhe sua senha com terceiros. Todos os atos, despachos e documentos gerados no sistema ficam juridicamente vinculados à matrícula do titular da conta.
                </div>
              </div>
            </div>
          )}

          {/* TAB: COMISSÕES & PROCESSOS (PAD / CAC) */}
          {activeTab === 'comissoes' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-indigo-500" />
                    Atos Administrativos de Comissões, PAD & Ajuste de Conduta (CAC/TAC)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    12 modelos em espécie padronizados para Comissões Processantes e Resolução Consensual Disciplinar.
                  </p>
                </div>
                <span className="self-start sm:self-auto px-2 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                  Categoria 8 Oficial
                </span>
              </div>

              {/* Fundamentação Legal e Garantias */}
              <div className="bg-indigo-50/70 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 text-xs space-y-2">
                <h5 className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Garantias Constitucionais & Fundamentação Jurídica
                </h5>
                <p className="text-indigo-900 dark:text-indigo-300 leading-relaxed">
                  Todos os modelos foram redigidos com estrita observância ao <b>Princípio do Devido Processo Legal</b>, <b>Contraditório e Ampla Defesa</b> (CF/88, art. 5º, LV), ao <b>Estatuto dos Servidores Públicos Municipais de Rio Claro/RJ</b> e aos <b>artigos 20, 21 e 26 da LINDB</b> (Decreto-Lei nº 4.657/1942), garantindo segurança jurídica contra anulações processuais.
                </p>
              </div>

              {/* Grid 2 Colunas: Atos da Comissão vs. Ajuste de Conduta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* Coluna 1: Atos em Espécie da Comissão */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <FileCheck2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <h5 className="font-bold text-slate-900 dark:text-slate-100">
                      1. Fluxo de Atos da Comissão (PAD / Sindicância)
                    </h5>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Acompanhe o rito sequencial obrigatório desde a denúncia inicial até o julgamento final pela autoridade:
                  </p>
                  
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                    <li className="p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800">
                      <b>MOD-087 & 088:</b> Registro de Ocorrência e Representação Funcional para formalizar a notitia criminis/disciplinar.
                    </li>
                    <li className="p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800">
                      <b>MOD-089 & 090:</b> Portaria de Instauração e Ata de Instalação dos trabalhos (abertura formal dos prazos).
                    </li>
                    <li className="p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800">
                      <b>MOD-091:</b> Mandado de Citação e Notificação Inicial com entrega de contrafé dos autos.
                    </li>
                    <li className="p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800">
                      <b>MOD-092 & 093:</b> Notificação de Testemunha e Termo de Depoimento e Inquirição com perguntas da defesa.
                    </li>
                    <li className="p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800">
                      <b>MOD-094:</b> Termo de Indiciação Formal (especificação das condutas e capitulação legal exata para a Defesa Prévia).
                    </li>
                    <li className="p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800">
                      <b>MOD-095, 096 & 097:</b> Relatório Final Circunstanciado, Julgamento/Decisão da Autoridade e Termo de Juntada.
                    </li>
                  </ul>
                </div>

                {/* Coluna 2: Ajuste de Conduta (CAC / TAC) */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h5 className="font-bold text-slate-900 dark:text-slate-100">
                      2. Ajustamento de Conduta (CAC / TAC - MOD-098)
                    </h5>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Instrumento consensual e pragmático de resolução de conflitos no serviço público (art. 26 da LINDB):
                  </p>

                  <div className="space-y-2 text-slate-700 dark:text-slate-300">
                    <div className="p-2 bg-emerald-50/70 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-800/50">
                      <b className="text-emerald-900 dark:text-emerald-200 block mb-0.5">Quando é cabível:</b>
                      Faltas funcionais puníveis com advertência ou suspensão até 30 dias, ausência de má-fé dolosa, primariedade e inexistência de lesão irreversível aos cofres públicos.
                    </div>

                    <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800">
                      <b className="text-slate-900 dark:text-slate-100 block mb-0.5">Efeitos do Acordo:</b>
                      O processo disciplinar fica suspenso durante o prazo de cumprimento das obrigações (6 a 24 meses). Cumpridas as metas, a punibilidade é declarada extinta sem registro desabonador na ficha funcional.
                    </div>

                    <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800">
                      <b className="text-slate-900 dark:text-slate-100 block mb-0.5">Ressarcimento e Compromissos:</b>
                      Inclui ressarcimento parcelado de eventual prejuízo, frequência em capacitação técnica e relatório bimestral de assiduidade.
                    </div>
                  </div>
                </div>
              </div>

              {/* Como Utilizar no Redator e Gestão de Comissões */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <h5 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  Como Configurar as Comissões de PAD e Sindicância no Redator
                </h5>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                  <li>No Redator Oficial, role até a seção de assinaturas e selecione o modo desejado: <b>[Comissão PAD / Sindicância (Trio)]</b>, <b>[Comissão + Notificado/Defensor]</b> ou <b>[TAC/CAC]</b>.</li>
                  <li>No menu de comissões, você pode escolher uma comissão institucional pré-cadastrada (ex: <i>Comissão Permanente de PAD - Portaria SMA 042/2026</i>) ou editar livremente os membros.</li>
                  <li>Para cada membro, selecione o servidor na base municipal ou informe <b>Função</b> (Presidente, Secretária, Vogal), <b>Nome</b>, <b>Matrícula</b> e <b>Cargo Efetivo</b>.</li>
                  <li>Clique em <b>"🔄 Sincronizar no Texto"</b>: o sistema substitui automaticamente todas as tags como <code>[PRESIDENTE]</code>, <code>[SECRETÁRIO]</code>, <code>[VOGAL]</code> e <code>[COMPROMISSADO]</code> no teor do documento com os nomes e matrículas cadastrados!</li>
                  <li>Clique em <b>"💾 Salvar Comissão"</b> para guardar o trio ou grupo com nome personalizado e reutilizar em futuras minutas sem redigitar nada.</li>
                  <li>Na visualização, no PDF e no Word (.doc), as assinaturas são organizadas em colunas perfeitamente alinhadas lado a lado com linhas de firma individuais e cargos.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB: INSTALAR APP (PWA) */}
          {activeTab === 'app' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Download className="w-5 h-5 text-sky-500" />
                  Instalar como Aplicativo Oficial (Desktop e Celular)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tenha o Banco Mestre na Área de Trabalho com abertura instantânea e suporte offline.
                </p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <p>
                  O Banco Mestre é um <b>PWA (Progressive Web App)</b> de última geração. Ele pode ser instalado diretamente no seu computador (Windows, Linux, Mac) ou no celular institucional sem precisar passar pela loja de aplicativos.
                </p>

                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <img
                    src="/pwa-192x192.png"
                    alt="Ícone oficial DOCS PMRC Rio Claro"
                    className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 object-cover"
                  />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Ícone Oficial na Tela Inicial: DOCS PMRC
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Ao instalar no computador (Windows, Mac, Linux) ou celular (Android e iPhone), este ícone oficial aparece diretamente na Área de Trabalho e na Tela de Início.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">No Computador (Chrome / Edge):</h5>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
                      <li>Clique no botão <b>"Instalar Aplicativo"</b> no topo ou lateral da tela.</li>
                      <li>Ou clique no ícone de monitor com setinha na barra de endereços do navegador.</li>
                      <li>Confirme em <b>"Instalar"</b>. Um atalho com o ícone oficial <b>DOCS PMRC</b> será criado na sua Área de Trabalho.</li>
                    </ol>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">No Celular (Android / iOS):</h5>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
                      <li>No Chrome (Android), toque nos 3 pontinhos ⋮ e escolha <b>"Instalar aplicativo"</b>.</li>
                      <li>No Safari (iPhone), toque no ícone de compartilhar e selecione <b>"Adicionar à Tela de Início"</b>.</li>
                    </ol>
                  </div>
                </div>

                {/* Personalização de Tema, Cores e Formulários para Celular */}
                <div className="bg-sky-50 dark:bg-sky-950/40 p-3.5 rounded-xl border border-sky-200 dark:border-sky-800/60 space-y-1.5">
                  <h5 className="font-bold text-sky-900 dark:text-sky-200">Tema, Paleta de Cores e Formulários para Celular</h5>
                  <p className="text-sky-800 dark:text-sky-300">
                    Clique no botão de <b>Tema e Cores</b> (ícone de Sol/Lua/Monitor no topo ou na tela de login) para personalizar sua experiência:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sky-900 dark:text-sky-300 pl-1">
                    <li><b>Aparência:</b> escolha entre <b>Claro</b>, <b>Escuro</b> ou <b>Automático</b> (acompanha o tema do seu celular ou Windows).</li>
                    <li><b>5 Paletas de Cores:</b> Azul Institucional, Esmeralda, Índigo, Grafite ou Âmbar — preservando sempre o papel timbrado A4 em branco puro para impressão.</li>
                    <li><b>Estilo dos Formulários:</b> escolha <b>Padrão</b>, <b>Celular / Toque Ampliado</b> (botões e campos maiores com fonte 16px que evita zoom automático no celular) ou <b>Alto Contraste</b> (bordas reforçadas para leitura).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ADMINISTRADORES */}
          {activeTab === 'admin' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-500" />
                    Painel de Gestão & Administração Municipal (v2.0)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Instruções exclusivas para chefias de departamento e administradores credenciados.
                  </p>
                </div>

                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200">Principais Rotinas Administrativas:</h5>
                    <ul className="space-y-2.5 text-slate-600 dark:text-slate-400">
                      <li>
                        <b>Autorizações de Novos Servidores & Pedidos de Senha:</b> Quando houver solicitações pendentes, um <b>indicador vermelho pulsante</b> aparece no botão <b>"Gestão"</b> do cabeçalho. Abra a aba <b>"Autorizações & Senhas"</b> para aprovar cadastros, redefinir senhas ou rejeitar solicitações.
                      </li>
                      <li>
                        <b>Cadastro Inteligente de Servidores (Combo de Departamentos + Anexos I e II):</b> O campo <b>Departamento / Divisão</b> oferece lista combo filtrada pelas secretarias marcadas (com opção <i>"Outro departamento"</i> para novos setores), além de seleção separada de <b>Cargo Efetivo</b> e <b>Cargo em Comissão / Função Gratificada</b>.
                      </li>
                      <li>
                        <b>Quadro Oficial de Cargos e Funções Editável (Aba "Quadro de Vagas"):</b> Acompanhe vagas previstas em Lei × ocupadas × disponíveis para <b>Anexo I (SS / CC-01..CC-08)</b>, <b>Anexo II (FG)</b> e <b>Quadro Efetivo (* Em Extinção / ** Extintos)</b>. Utilize o botão <b>"Editar"</b> em qualquer linha para corrigir grafia, simbologia, vagas ou situação legal, clique em <b>"+ Novo Cargo / FG"</b> para novas leis municipais ou <b>"Exportar CSV"</b> para relatórios do DRH.
                      </li>
                      <li>
                        <b>Higienização &amp; Anulação na Planilha <code>Numeração</code>:</b> Na aba <b>Numeração</b> da Planilha Google Sheets, administradores contam com seleção múltipla e botões dedicados para:
                        <div className="mt-1 pl-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                          <p>• <b>Excluir Definitivamente (Higienização):</b> remove linhas de teste ou duplicidades (individualmente ou em lote) na tela e no Google Sheets, registrando a justificativa nos Logs.</p>
                          <p>• <b>Anular / Cancelar Número (Protocolo):</b> preserva o número na sequência oficial e marca o assunto com <code>[ANULADO - motivo]</code>, mantendo plena rastreabilidade legal.</p>
                        </div>
                      </li>
                      <li>
                        <b>Numeração &amp; Marco Zero (Implantação em Novas Secretarias):</b> Configure o último número do livro físico/planilha anterior de cada pasta (ex: Gabinete do Prefeito, PGM, Finanças) e defina quais espécies seguem <b>Sequência Global Municipal</b> (ex: <code>DECRETO</code> e <code>PORTARIA</code>).
                      </li>
                      <li>
                        <b>Filtro de Acessibilidade Documental &amp; Auditoria:</b> Defina por servidor o escopo de leitura no Livro (<i>Toda a Secretaria</i>, <i>Apenas o Departamento</i>, <i>Apenas Próprios</i>) e exporte os relatórios cadastrais em CSV compatível com Excel.
                      </li>
                    </ul>
                  </div>
                </div>
            </div>
          )}

          {/* TAB: GLOSSÁRIO */}
          {activeTab === 'glossario' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-500" />
                  Glossário de Termos Administrativos
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Definições das expressões e conceitos utilizados na rotina do sistema.
                </p>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <dt className="font-bold text-slate-900 dark:text-slate-100 mb-1">Modelo Documental</dt>
                  <dd className="text-slate-600 dark:text-slate-400">Minuta jurídica ou administrativa pré-estruturada para adaptação rápida, evitando a criação de textos do zero.</dd>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <dt className="font-bold text-slate-900 dark:text-slate-100 mb-1">Secretaria / Pasta Ativa</dt>
                  <dd className="text-slate-600 dark:text-slate-400">A pasta municipal em nome da qual o servidor está operando no momento. Ela define o livro e o prefixo sequencial.</dd>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <dt className="font-bold text-slate-900 dark:text-slate-100 mb-1">Marco Zero &amp; Sequência Global</dt>
                  <dd className="text-slate-600 dark:text-slate-400"><b>Marco Zero</b> registra o último número do livro anterior ao implantar uma secretaria. <b>Sequência Global</b> unifica a numeração de Decretos e Portarias em toda a Prefeitura.</dd>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <dt className="font-bold text-slate-900 dark:text-slate-100 mb-1">Higienização vs. Anulação</dt>
                  <dd className="text-slate-600 dark:text-slate-400"><b>Higienização (Excluir)</b> limpa registros de teste ou duplicidades. <b>Anulação</b> mantém o número ocupado no protocolo com a justificativa <code>[ANULADO]</code>.</dd>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <dt className="font-bold text-slate-900 dark:text-slate-100 mb-1">Anexo I (SS / CC) e Anexo II (FG)</dt>
                  <dd className="text-slate-600 dark:text-slate-400">Cargos em <b>Subsídio (SS)</b>, <b>Comissão (CC-01 a CC-08)</b> e <b>Funções Gratificadas (FG)</b> previstos na estrutura legal de Rio Claro – RJ.</dd>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <dt className="font-bold text-slate-900 dark:text-slate-100 mb-1">Cargos Efetivos: * e **</dt>
                  <dd className="text-slate-600 dark:text-slate-400">Marcações legais do quadro permanente: <b>*</b> indica <b>Cargo em Extinção</b> (extinto na vacância) e <b>**</b> indica <b>Cargo Extinto</b>.</dd>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <dt className="font-bold text-slate-900 dark:text-slate-100 mb-1">Memorando vs. Ofício</dt>
                  <dd className="text-slate-600 dark:text-slate-400"><b>Memorando</b> tramita internamente entre órgãos da própria Prefeitura. <b>Ofício</b> é destinado a órgãos externos, entidades ou cidadãos.</dd>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <dt className="font-bold text-slate-900 dark:text-slate-100 mb-1">Folha Timbrada Oficial &amp; PII Masking</dt>
                  <dd className="text-slate-600 dark:text-slate-400"><b>Timbrado</b> traz o brasão oficial de Rio Claro em A4. <b>PII Masking</b> mascara CPFs e e-mails antes de consultar a IA (conformidade LGPD).</dd>
                </div>
              </dl>
            </div>
          )}

          {/* TAB: ALGO DEU ERRADO (FAQ) */}
          {activeTab === 'faq' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-500" />
                    Perguntas Frequentes & Resolução de Problemas
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Soluções diretas para as situações mais comuns no uso diário.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {faqsFiltradas.length === 0 ? (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Nenhuma pergunta fixa encontrada para <b>"{buscaGuia}"</b>.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIaQuestionSeed(buscaGuia.trim());
                        setActiveTab('ia');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Perguntar isso à IA agora</span>
                    </button>
                  </div>
                ) : (
                  faqsFiltradas.map((faq, idx) => (
                    <div 
                      key={idx}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-800/40"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                        className="w-full text-left p-3.5 flex items-center justify-between font-semibold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaqIndex === idx ? 'rotate-180 text-sky-500' : ''}`} />
                      </button>
                      {openFaqIndex === idx && (
                        <div className="p-3.5 pt-0 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Botão de Restaurar Dicas Flutuantes */}
              <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-xs text-sky-900 dark:text-sky-300">
                    Deseja rever os balões de dicas flutuantes na tela?
                  </h5>
                  <p className="text-[11px] text-sky-700 dark:text-sky-400">
                    Se você clicou em "Parar dicas" ou já as visualizou, pode reativá-las para que acompanhem sua navegação novamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReverDicas}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dicasReiniciadas ? 'animate-spin' : ''}`} />
                  <span>{dicasReiniciadas ? 'Dicas Reativadas!' : 'Mostrar as dicas de novo'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Seção Fixa: Combinados que ajudam todo mundo */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Combinados que Ajudam Todo Mundo
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Senha é pessoal</span>
                Tudo o que é emitido fica registrado no seu nome e matrícula.
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Confira a pasta</span>
                Secretaria e destinatário certos evitam retificação no Livro.
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Revise a IA</span>
                O assistente gera minutas úteis, mas a responsabilidade técnica é sua.
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Saia ao terminar</span>
                Sempre encerre a sessão caso utilize computadores compartilhados.
              </div>
            </div>
          </div>

          {/* Rodapé Institucional com Contato de Suporte */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Suporte Técnico & Gestão do Sistema:</span>
              <span className="ml-1">Secretaria Municipal de Administração (SMA) • DRH</span>
            </div>
            <div className="font-mono text-[11px] text-sky-600 dark:text-sky-400">
              Ramal 407 • DRH/SMA • rh@rioclaro.rj.gov.br
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 pb-safe border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Banco Mestre de Atos & Documentos • Prefeitura de Rio Claro – RJ</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            Fechar Guia
          </button>
        </div>
      </div>
    </div>
  );
};
