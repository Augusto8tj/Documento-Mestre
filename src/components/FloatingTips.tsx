import React, { useEffect, useState, useRef } from 'react';

export interface DicaItem {
  id: string;
  sel: string;
  t: string;
  x: string;
}

export const DICAS_SGEP: DicaItem[] = [
  { id: "pasta", sel: "#wrapper-seletor-secretaria-ativa, [data-tip=\"pasta\"]", t: "Sua pasta / Secretaria", x: "Os números e o Livro seguem a secretaria escolhida aqui. Confira sempre antes de gerar um ato oficial." },
  { id: "tipos", sel: "#type-filters, [data-tip=\"tipos\"]", t: "Tipo de documento", x: "Clique em Memorando, Ofício, Despacho, Portaria… para filtrar modelos daquela espécie." },
  { id: "indice", sel: "#category-list, [data-tip=\"indice\"]", t: "Índice Temático", x: "Escolha um assunto específico para ver apenas as minutas e modelos pertinentes." },
  { id: "busca", sel: "#search-input, [data-tip=\"busca\"]", t: "Busca inteligente", x: "Procure por título, teor do modelo, base legal, palavra-chave ou número de lei." },
  { id: "favorito", sel: "[data-tip=\"favorito\"], button[title*=\"Favorito\"], button[title*=\"favorito\"]", t: "Favoritar", x: "Marque os modelos que você mais utiliza no dia a dia para acessá-los rapidamente." },
  { id: "personalizar", sel: "[data-tip=\"personalizar\"], button[title*=\"Personalizar\"]", t: "Personalizar", x: "Preencha as variáveis e campos do modelo (nomes, datas, valores) antes de copiar ou baixar." },
  { id: "redator", sel: "#btn-abrir-redator, [data-tip=\"redator\"], button:has(.lucide-pen-tool)", t: "Redator Oficial", x: "Cria Memorando, Ofício, Despacho ou Circular com numeração automática e folha timbrada oficial." },
  { id: "gerarnum", sel: "#btn-redator-gerar-num, [data-tip=\"gerarnum\"]", t: "Número oficial", x: "Cada número gerado fica registrado com o seu nome e matrícula no Livro. Gere quando o ato for valer." },
  { id: "ia", sel: "#btn-redator-ia, [data-tip=\"ia\"], button:has(.lucide-sparkles)", t: "Assistente de IA (Gratuito + LGPD)", x: "Redige, formaliza ou resume textos com motor híbrido (NVIDIA NIM + Gemini). CPFs e e-mails são mascarados automaticamente antes do envio, sem custo para o servidor." },
  { id: "word", sel: "#btn-redator-word, [data-tip=\"word\"]", t: "Baixar para o Word (.doc)", x: "Gera o arquivo editável contendo o cabeçalho timbrado e o brasão oficial da Prefeitura." },
  { id: "salvarpdf", sel: "#btn-salvar-pdf-redator, [data-tip=\"salvarpdf\"], button[title*=\"Salvar em PDF\"]", t: "Salvar em PDF Timbrado A4", x: "Gera o PDF final em padrão A4 de alta definição com o brasão oficial para impressão ou assinatura digital." },
  { id: "previaflutuante", sel: "#btn-toggle-floating-preview, [data-tip=\"previaflutuante\"]", t: "Visualização Flutuante", x: "Fixe a visualização do documento em uma janela flutuante para acompanhar a diagramação em tempo real enquanto digita." },
  { id: "livro", sel: "#btn-abrir-livro, [data-tip=\"livro\"], button:has(.lucide-book-open)", t: "Livro de Numeração", x: "Registro completo de todos os documentos numerados na Prefeitura. Permite busca, filtros, reimpressão e resposta cruzada." },
  { id: "meusdocs", sel: "#btn-meus-docs-livro, [data-tip=\"meusdocs\"]", t: "Meus Docs", x: "Filtra rapidamente apenas os documentos expedidos sob sua matrícula." },
  { id: "sync", sel: "#btn-sync-header, [data-tip=\"sync\"], [title^=\"Sincronizar\"]", t: "Sincronização em Nuvem", x: "Atualiza os modelos e a numeração com a planilha mestre do Google Apps Script em tempo real." },
  { id: "senha", sel: "#btn-alterar-senha, [data-tip=\"senha\"], [title^=\"Alterar Minha Senha\"]", t: "Sua senha", x: "Altere sua senha de acesso periodicamente ou sempre que julgar necessário para maior segurança." },
  { id: "admin", sel: "#btn-gestao-admin, [data-tip=\"admin\"]", t: "Painel de Administração", x: "Área restrita para cadastrar servidores, editar o Quadro Oficial de Cargos e Funções, configurar Marco Zero e auditar acessos." },
  { id: "ajuda", sel: "#btn-guia-ajuda, [data-tip=\"ajuda\"]", t: "Guia de Orientações", x: "Não sabe por onde começar? Abra o passo a passo completo, consulte perguntas frequentes ou reative estes balões de ajuda." },
  { id: "combotopo", sel: "#combo-livro-numeracao, [data-tip=\"combotopo\"]", t: "Consulta Rápida de Atos", x: "Consulte atos emitidos recentemente direto aqui no topo para ler detalhes ou responder na hora." },
  { id: "responderdoc", sel: "[data-tip=\"responderdoc\"], button:has(.lucide-reply)", t: "Resposta Oficial Cruzada", x: "Abre o Redator com o número anterior citado no assunto e o destinatário já configurados para resposta." },
  { id: "tiposredator", sel: "#redator-tipo-botoes, [data-tip=\"tiposredator\"]", t: "Espécie Documental", x: "Selecione Memorando, Ofício, Despacho, Circular, Portaria ou Decreto. A numeração e a estrutura se adaptam automaticamente." },
  { id: "destcombo", sel: "#redator-destinatario-combo, [data-tip=\"destcombo\"]", t: "Destinatários Oficiais", x: "Selecione secretarias, fundações ou tribunais da base oficial sem risco de errar o nome ou a sigla." },
  { id: "atalhosdest", sel: "#redator-atalhos-dest, [data-tip=\"atalhosdest\"]", t: "Pastas Frequentes", x: "Toque nestes atalhos rápidos para preencher Saúde, Educação, SMA, PGM ou Gabinete com um clique." },
  { id: "assuntocombo", sel: "#redator-assunto-combo, [data-tip=\"assuntocombo\"]", t: "Modelos Padronizados", x: "Carregue minutas prontas com redação técnica e fundamentação jurídica oficial da Prefeitura." },
  { id: "toolbar", sel: "#redator-toolbar, .sgep-toolbar, [data-tip=\"toolbar\"]", t: "Barra de Redação Oficial", x: "Aplique Negrito, Itálico, Listas numeradas e marcadores diretamente no Editor Visual em tempo real (WYSIWYG)." },
  { id: "tabulacao", sel: "#btn-redator-tab, [data-tip=\"tabulacao\"]", t: "Tabulação & Recuo", x: "Aumente ou diminua o recuo do texto com os botões ou diretamente pelas teclas Tab e Shift+Tab." },
  { id: "reguaparagrafo", sel: "#redator-regua-paragrafo, [data-tip=\"reguaparagrafo\"]", t: "Régua de Margens e Parágrafos", x: "Arraste as alças roxas na régua A4 (0–21 cm) para ajustar as Margens Esquerda/Direita e os marcadores ▼ / ▲ para os recuos de 1ª e 2ª linha." },
  { id: "autosave", sel: "#sgep-autosave-indicator, [data-tip=\"autosave\"]", t: "Salvamento em Tempo Real", x: "Seu rascunho é guardado automaticamente a cada digitação. Você não perde o texto mesmo se a página fechar." },
  { id: "copiarformatado", sel: "#btn-redator-copiar-formatado, [data-tip=\"copiarformatado\"]", t: "Copiar com Formatação", x: "Copia o texto preservando parágrafos, negritos e listas para colar no Word, Docs ou Outlook." },
  { id: "imprimirtimbrado", sel: "#btn-redator-imprimir-timbrado, [data-tip=\"imprimirtimbrado\"]", t: "Folha Timbrada A4", x: "Visualiza e imprime em folha timbrada oficial da Prefeitura de Rio Claro com brasão vetorizado." },
  { id: "emailredator", sel: "#btn-redator-mailto, [data-tip=\"emailredator\"]", t: "Encaminhar por E-mail", x: "Abre seu programa de e-mail institucional já com destinatário, número oficial e teor do documento preenchidos." },
  { id: "salvarredator", sel: "#btn-redator-salvar-registro, [data-tip=\"salvarredator\"]", t: "Emitir e Registrar", x: "Salva o documento no histórico oficial da Prefeitura e registra o ato no Livro de Numeração de forma definitiva." },
  { id: "filtrosecglobal", sel: "#container-filtro-secretaria, #filtro-secretaria-global, [data-tip=\"filtrosecglobal\"]", t: "Sigilo e Filtro por Pasta", x: "Filtra os modelos e o histórico para a sua secretaria, assegurando a privacidade e o sigilo departamental." },
  { id: "filtroseclivro", sel: "#filtro-secretaria-livro-modal, [data-tip=\"filtroseclivro\"]", t: "Secretaria no Livro", x: "Consulte apenas os atos emitidos pela secretaria municipal selecionada." },
  { id: "filtrodeptolivro", sel: "#filtro-depto-livro-modal, [data-tip=\"filtrodeptolivro\"]", t: "Filtro por Departamento", x: "Refine a pesquisa por divisões internas (ex: DRH, Protocolo, Compras) da secretaria selecionada." },
  { id: "copiarcitacao", sel: "[data-tip=\"copiarcitacao\"], button[title*=\"Copiar Referência\"]", t: "Copiar Citação Oficial", x: "Copia a referência padronizada do documento (ex: Memorando nº 012/2026 - SMA) para anexar em pareceres." },
  { id: "siglanumero", sel: "#chk-incluir-sigla, label:has(#chk-incluir-sigla), [data-tip=\"siglanumero\"]", t: "Padrão da Numeração", x: "Marque para incluir a sigla da secretaria no número (ex: 001/2026 - SMA) ou desmarque para manter apenas o número." },
  { id: "pwainstalar", sel: "#btn-instalar-pwa, [data-tip=\"pwainstalar\"]", t: "Instalar Aplicativo", x: "Instale o Banco Mestre na Área de Trabalho ou celular para abrir direto como aplicativo rápido." },
  { id: "modotema", sel: "#theme-toggle, [data-tip=\"modotema\"]", t: "Modo Escuro / Noturno", x: "Alterne entre visual claro e escuro ou escolha uma paleta de cores confortável para longos expedientes." },
  { id: "importardoc", sel: "[data-tip=\"importardoc\"], button[title*=\"Importar PDF ou Word\"]", t: "Importar PDF ou Word", x: "Traga documentos prontos (PDF ou DOCX) para extrair o texto, catalogar como novo modelo ou abrir direto no Redator." },
  { id: "usarbase", sel: "[data-tip=\"usarbase\"], button[title*=\"Duplicar dados deste documento\"]", t: "Usar como Base", x: "Copia assunto e destinatário de um ato anterior para o Redator, mas com numeração limpa para emitir um novo documento." },
  { id: "localdata", sel: "[data-tip=\"localdata\"]", t: "Local e Data (Modo Avançado)", x: "Por padrão o sistema imprime 'Rio Claro – RJ' com a data de hoje. Ative para digitar outra data ou cidade." },
  { id: "wysiwyg", sel: "[data-tip=\"wysiwyg\"]", t: "Editor Visual em Tempo Real", x: "Formate negrito, itálico, listas e recuos vendo o resultado na hora — igual ao Word, sem códigos estranhos." },
  { id: "proximonum", sel: "[data-tip=\"proximonum\"]", t: "Próximo Número Previsto", x: "Mostra automaticamente qual número sequencial será emitido nesta secretaria (ou na sequência global para Decretos/Portarias)." },
  { id: "higienizarnum", sel: "[data-tip=\"higienizarnum\"]", t: "Higienização vs. Anulação (Admin)", x: "Use 'Excluir' para limpar testes/duplicidades da planilha ou 'Anular' para manter o número reservado no protocolo com justificativa." },
  { id: "quadrovagas", sel: "[data-tip=\"quadrovagas\"]", t: "Quadro Oficial de Cargos e Funções", x: "Consulte, edite e exporte as vagas em Lei (Anexo I SS/CC, Anexo II FG) e a situação do Quadro Efetivo (* Em Extinção / ** Extinto)." },
  { id: "marcozero", sel: "[data-tip=\"marcozero\"]", t: "Marco Zero de Implantação", x: "Registre o último número usado no livro físico/planilha antiga da secretaria para o sistema continuar exatamente do número seguinte." },
  { id: "assinaturas", sel: "[data-tip=\"assinaturas\"]", t: "Assinatura Oficial Inteligente", x: "Se você tiver Cargo em Comissão ou Função Gratificada no cadastro, ele aparece automaticamente na assinatura do documento." }
];

interface FloatingTipsProps {
  currentUserMatricula?: string;
  onShowToast?: (msg: string) => void;
}

export const FloatingTips: React.FC<FloatingTipsProps> = ({ currentUserMatricula = 'anon', onShowToast }) => {
  const [activeDica, setActiveDica] = useState<DicaItem | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const activeElementRef = useRef<HTMLElement | null>(null);
  const seenTimerRef = useRef<any>(null);
  const hideTimerRef = useRef<any>(null);
  const touchTimerRef = useRef<any>(null);

  const getStorageKey = () => `sgep_dicas_${currentUserMatricula || 'anon'}`;

  const readState = (): { v?: Record<string, number>; off?: boolean } => {
    try {
      const data = localStorage.getItem(getStorageKey());
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  };

  const saveState = (state: { v?: Record<string, number>; off?: boolean }) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(state));
    } catch {}
  };

  const markSeen = (id: string) => {
    const s = readState();
    s.v = s.v || {};
    s.v[id] = 1;
    saveState(s);
  };

  const clearTimers = () => {
    if (seenTimerRef.current) clearTimeout(seenTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  };

  const closeTooltip = () => {
    clearTimers();
    setActiveDica(null);
    setPosition(null);
    activeElementRef.current = null;
  };

  // Global function to reset/re-enable tips
  useEffect(() => {
    (window as any).reiniciarDicas = () => {
      saveState({});
      setIsDismissed(false);
      if (onShowToast) {
        onShowToast('Dicas e orientações reativadas! Elas voltarão a aparecer ao navegar pelo sistema.');
      }
    };
    return () => {
      delete (window as any).reiniciarDicas;
    };
  }, [currentUserMatricula, onShowToast]);

  useEffect(() => {
    const handlePointerEnter = (e: MouseEvent | TouchEvent) => {
      const s = readState();
      if (s.off) {
        setIsDismissed(true);
        return;
      }

      const target = e.target as HTMLElement;
      if (!target || !target.closest) return;

      // Don't trigger if hovering the tooltip popover itself
      const popElement = document.getElementById('dica-pop');
      if (popElement && popElement.contains(target)) {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        return;
      }

      // Check against all tips
      for (let i = 0; i < DICAS_SGEP.length; i++) {
        const dica = DICAS_SGEP[i];
        if (s.v && s.v[dica.id]) continue; // Already seen

        try {
          const matchingElement = target.closest(dica.sel) as HTMLElement;
          if (matchingElement) {
            if (activeDica && activeDica.id === dica.id) {
              if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
              return;
            }

            clearTimers();
            activeElementRef.current = matchingElement;
            setActiveDica(dica);

            // Compute coordinates
            const rect = matchingElement.getBoundingClientRect();
            const margin = 8;
            const W = window.innerWidth;
            const H = window.innerHeight;
            const approxW = 280;
            const approxH = 110;

            let top = rect.bottom + margin;
            let left = rect.left + rect.width / 2 - approxW / 2;

            if (top + approxH > H - margin) {
              top = rect.top - approxH - margin;
            }
            if (top < margin) top = margin;
            if (left < margin) left = margin;
            if (left + approxW > W - margin) left = W - approxW - margin;

            setPosition({ top, left });

            // Auto-mark as seen after 1.8 seconds of continuous hovering
            seenTimerRef.current = setTimeout(() => {
              markSeen(dica.id);
            }, 1800);

            if (e.type === 'touchstart') {
              touchTimerRef.current = setTimeout(closeTooltip, 6000);
            }
            return;
          }
        } catch {}
      }
    };

    const handlePointerLeave = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement;
      const popElement = document.getElementById('dica-pop');
      if (popElement && popElement.contains(related)) {
        return;
      }
      hideTimerRef.current = setTimeout(closeTooltip, 200);
    };

    document.addEventListener('mouseover', handlePointerEnter, true);
    document.addEventListener('mouseout', handlePointerLeave, true);
    document.addEventListener('touchstart', handlePointerEnter, { passive: true, capture: true });

    return () => {
      document.removeEventListener('mouseover', handlePointerEnter, true);
      document.removeEventListener('mouseout', handlePointerLeave, true);
      document.removeEventListener('touchstart', handlePointerEnter, true);
      clearTimers();
    };
  }, [activeDica, currentUserMatricula]);

  if (!activeDica || !position || isDismissed) return null;

  return (
    <div
      id="dica-pop"
      role="tooltip"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 9999,
        maxWidth: '300px',
        minWidth: '240px'
      }}
      className="bg-slate-900/95 text-slate-100 text-xs p-3 rounded-xl shadow-2xl border border-sky-500/40 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
      onMouseEnter={() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      }}
      onMouseLeave={() => {
        hideTimerRef.current = setTimeout(closeTooltip, 200);
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 font-bold text-sky-400 text-[12px]">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
          <span className="d-t">{activeDica.t}</span>
        </div>
        <button
          type="button"
          onClick={closeTooltip}
          className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
          title="Fechar dica"
        >
          ✕
        </button>
      </div>

      <p className="d-x text-slate-200 text-[11px] leading-relaxed mb-2.5">
        {activeDica.x}
      </p>

      <div className="d-b flex items-center justify-between pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={() => {
            markSeen(activeDica.id);
            closeTooltip();
          }}
          className="d-ok px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] rounded-md shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          Entendi
        </button>

        <button
          type="button"
          onClick={() => {
            const s = readState();
            s.off = true;
            saveState(s);
            setIsDismissed(true);
            closeTooltip();
            if (onShowToast) {
              onShowToast('Dicas desativadas. Você pode reativá-las a qualquer momento no Guia de Ajuda (?)');
            }
          }}
          className="d-off text-[10px] text-slate-400 hover:text-sky-300 underline cursor-pointer transition-colors"
        >
          Parar dicas
        </button>
      </div>
    </div>
  );
};
