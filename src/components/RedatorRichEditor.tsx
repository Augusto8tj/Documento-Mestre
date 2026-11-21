import React, { useEffect, useImperativeHandle, useRef, forwardRef, useCallback } from 'react';
import { Code2, Eye } from 'lucide-react';

export type RedatorInlineFormatKind = 'bold' | 'italic' | 'underline' | 'strike' | 'mark' | 'campo';
export type RedatorBlockFormatKind = 'ul' | 'ol' | 'quote' | 'hr' | 'inciso' | 'alinea';

export interface RedatorActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  mark: boolean;
  ul: boolean;
  ol: boolean;
  quote: boolean;
}

export interface RedatorRichEditorHandle {
  toggleFormat: (kind: RedatorInlineFormatKind) => void;
  applyBlock: (kind: RedatorBlockFormatKind) => void;
  clearFormatting: () => void;
  focus: () => void;
}

interface RedatorRichEditorProps {
  value: string;
  onChange: (novoTexto: string) => void;
  fonte: 'Times New Roman' | 'Arial' | 'Calibri';
  tamanhoFonte: '12pt' | '11pt' | '10pt';
  alinhamento: 'justify' | 'left' | 'center';
  recuoPrimeiraLinha: number;
  recuoSegundaLinha: number;
  margemEsquerda: number;
  margemDireita: number;
  disabled?: boolean;
  placeholder?: string;
  mode: 'visual' | 'codigo';
  onModeChange: (mode: 'visual' | 'codigo') => void;
  onTabular: (direcao: 'aumentar' | 'diminuir') => void;
  sanitizarTexto: (texto: string) => string;
  onActiveFormatsChange?: (formats: RedatorActiveFormats) => void;
  textareaFallbackRef?: React.RefObject<HTMLTextAreaElement | null>;
}

const DEFAULT_ACTIVE_FORMATS: RedatorActiveFormats = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  mark: false,
  ul: false,
  ol: false,
  quote: false,
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Converte o texto canônico do Redator (Markdown leve + tags seguras) em HTML limpo
 * para edição WYSIWYG em tempo real sem exibir códigos brutos ao usuário.
 */
export function redatorMarkupToEditorHtml(
  texto: string,
  sanitizarTexto: (t: string) => string
): string {
  if (!texto || !texto.trim()) return '';

  const textoLimpo = sanitizarTexto(texto).replace(/&nbsp;|&#160;|&#xA0;|&#9;|&#x9;/gi, ' ');
  let seguro = escapeHtml(textoLimpo);

  // Restaura tags seguras de formatação
  seguro = seguro
    .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<u>$1</u>')
    .replace(/&lt;mark&gt;([\s\S]*?)&lt;\/mark&gt;/gi, '<mark>$1</mark>')
    .replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/gi, '<strong>$1</strong>')
    .replace(/&lt;strong&gt;([\s\S]*?)&lt;\/strong&gt;/gi, '<strong>$1</strong>')
    .replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/gi, '<em>$1</em>')
    .replace(/&lt;em&gt;([\s\S]*?)&lt;\/em&gt;/gi, '<em>$1</em>')
    .replace(/&lt;s&gt;([\s\S]*?)&lt;\/s&gt;/gi, '<del>$1</del>')
    .replace(/&lt;del&gt;([\s\S]*?)&lt;\/del&gt;/gi, '<del>$1</del>');

  // Formatação inline Markdown -> HTML semântico
  seguro = seguro.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  seguro = seguro.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  seguro = seguro.replace(/__(.+?)__/g, '<u>$1</u>');
  seguro = seguro.replace(/~~(.+?)~~/g, '<del>$1</del>');
  seguro = seguro.replace(/==(.+?)==/g, '<mark>$1</mark>');

  // Destaque visual para [CAMPOS] obrigatórios (mantém edição direta sem códigos)
  seguro = seguro.replace(
    /\[([A-ZÀ-Ú0-9_\-/\s]{3,})\]/g,
    '<span data-redator-campo="1" class="sgep-campo-badge">[$1]</span>'
  );

  const linhas = seguro.split('\n');
  let htmlFinal = '';
  let emListaUL = false;
  let emListaOL = false;
  let paragrafoAtual: string[] = [];

  const fecharP = () => {
    if (paragrafoAtual.length > 0) {
      htmlFinal += `<p>${paragrafoAtual.join('<br>')}</p>`;
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

    if (l === '---' || l === '***' || l === '___') {
      fecharP();
      fecharListas();
      htmlFinal += '<hr>';
      continue;
    }

    if (l.startsWith('&gt; ') || l.startsWith('> ')) {
      fecharP();
      fecharListas();
      const textoCitacao = l.replace(/^(&gt;|>)\s*/, '');
      htmlFinal += `<blockquote>${textoCitacao || '<br>'}</blockquote>`;
      continue;
    }

    if (l.startsWith('- ') || l.startsWith('• ') || l.startsWith('* ')) {
      fecharP();
      if (emListaOL) {
        htmlFinal += '</ol>';
        emListaOL = false;
      }
      if (!emListaUL) {
        htmlFinal += '<ul>';
        emListaUL = true;
      }
      const itemTexto = l.replace(/^([-•*])\s+/, '');
      htmlFinal += `<li>${itemTexto || '<br>'}</li>`;
      continue;
    }

    const numMatch = l.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      fecharP();
      if (emListaUL) {
        htmlFinal += '</ul>';
        emListaUL = false;
      }
      if (!emListaOL) {
        htmlFinal += '<ol>';
        emListaOL = true;
      }
      htmlFinal += `<li>${numMatch[2] || '<br>'}</li>`;
      continue;
    }

    fecharListas();
    paragrafoAtual.push(l);
  }

  fecharP();
  fecharListas();

  return htmlFinal;
}

function wrapInlinePreservingSpaces(content: string, open: string, close: string): string {
  if (!content) return '';
  const match = content.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return content;
  const [, leading, core, trailing] = match;
  if (!core) return content;
  return `${leading}${open}${core}${close}${trailing}`;
}

function serializeInlineNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent || '')
      .replace(/\u00A0/g, ' ')
      .replace(/\u200B/g, '');
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.tagName.toUpperCase();

  if (tag === 'BR') return '\n';
  if (tag === 'HR') return '\n---\n';

  let inner = '';
  el.childNodes.forEach((child) => {
    inner += serializeInlineNode(child);
  });

  if (tag === 'STRONG' || tag === 'B') {
    return wrapInlinePreservingSpaces(inner, '**', '**');
  }
  if (tag === 'EM' || tag === 'I') {
    return wrapInlinePreservingSpaces(inner, '*', '*');
  }
  if (tag === 'U') {
    return wrapInlinePreservingSpaces(inner, '<u>', '</u>');
  }
  if (tag === 'DEL' || tag === 'S' || tag === 'STRIKE') {
    return wrapInlinePreservingSpaces(inner, '~~', '~~');
  }
  if (tag === 'MARK') {
    return wrapInlinePreservingSpaces(inner, '<mark>', '</mark>');
  }

  if (tag === 'SPAN') {
    // Badge de [CAMPO] serializa apenas o conteúdo textual já com colchetes
    if (el.getAttribute('data-redator-campo') === '1') {
      return inner;
    }
    let out = inner;
    const style = el.style;
    const fw = style.fontWeight;
    if (fw === 'bold' || fw === 'bolder' || (fw && Number(fw) >= 600)) {
      out = wrapInlinePreservingSpaces(out, '**', '**');
    }
    if (style.fontStyle === 'italic') {
      out = wrapInlinePreservingSpaces(out, '*', '*');
    }
    const td = `${style.textDecoration || ''} ${style.textDecorationLine || ''}`.toLowerCase();
    if (td.includes('underline')) {
      out = wrapInlinePreservingSpaces(out, '<u>', '</u>');
    }
    if (td.includes('line-through')) {
      out = wrapInlinePreservingSpaces(out, '~~', '~~');
    }
    const bg = (style.backgroundColor || '').toLowerCase();
    if (bg.includes('254, 240, 138') || bg.includes('#fef08a') || bg === 'yellow') {
      out = wrapInlinePreservingSpaces(out, '<mark>', '</mark>');
    }
    return out;
  }

  return inner;
}

function cleanBlockText(raw: string): string {
  // Remove um único \n final produzido por <br> sentinela do contentEditable
  const semTrailingBr = raw.endsWith('\n') ? raw.slice(0, -1) : raw;
  return semTrailingBr
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, '').replace(/^[ \t]+/g, ''))
    .join('\n')
    .trim();
}

/**
 * Converte o DOM editável (contentEditable) de volta para o texto canônico do Redator,
 * preservando 100% da compatibilidade com a Prévia Timbrada, PDF, Word (.doc), IA e rascunhos.
 */
export function domToRedatorMarkup(root: HTMLElement): string {
  const blocks: string[] = [];
  let inlineBuffer = '';

  const flushInlineBuffer = () => {
    const cleaned = cleanBlockText(inlineBuffer);
    if (cleaned) blocks.push(cleaned);
    inlineBuffer = '';
  };

  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      inlineBuffer += (node.textContent || '')
        .replace(/\u00A0/g, ' ')
        .replace(/\u200B/g, '');
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();

    if (tag === 'HR') {
      flushInlineBuffer();
      blocks.push('---');
      return;
    }

    if (tag === 'UL') {
      flushInlineBuffer();
      const items: string[] = [];
      el.querySelectorAll(':scope > li').forEach((li) => {
        let liText = '';
        li.childNodes.forEach((c) => {
          liText += serializeInlineNode(c);
        });
        const cleaned = cleanBlockText(liText).replace(/\n+/g, ' ');
        if (cleaned) items.push(`- ${cleaned}`);
      });
      if (items.length > 0) blocks.push(items.join('\n'));
      return;
    }

    if (tag === 'OL') {
      flushInlineBuffer();
      const items: string[] = [];
      let idx = 1;
      el.querySelectorAll(':scope > li').forEach((li) => {
        let liText = '';
        li.childNodes.forEach((c) => {
          liText += serializeInlineNode(c);
        });
        const cleaned = cleanBlockText(liText).replace(/\n+/g, ' ');
        if (cleaned) {
          items.push(`${idx}. ${cleaned}`);
          idx++;
        }
      });
      if (items.length > 0) blocks.push(items.join('\n'));
      return;
    }

    if (tag === 'BLOCKQUOTE') {
      flushInlineBuffer();
      let qText = '';
      el.childNodes.forEach((c) => {
        qText += serializeInlineNode(c);
      });
      const lines = cleanBlockText(qText)
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => `> ${l}`);
      if (lines.length > 0) blocks.push(lines.join('\n'));
      return;
    }

    if (tag === 'P' || tag === 'DIV' || tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4') {
      flushInlineBuffer();
      // Se um DIV contém outros blocos (p/div/ul/ol/blockquote/hr), desce recursivamente
      const hasNestedBlocks = Array.from(el.children).some((child) =>
        ['P', 'DIV', 'UL', 'OL', 'BLOCKQUOTE', 'HR'].includes(child.tagName.toUpperCase())
      );
      if (hasNestedBlocks) {
        el.childNodes.forEach((child) => processNode(child));
        flushInlineBuffer();
        return;
      }

      let pText = '';
      el.childNodes.forEach((c) => {
        pText += serializeInlineNode(c);
      });
      const cleaned = cleanBlockText(pText);
      if (cleaned) blocks.push(cleaned);
      return;
    }

    // Elementos inline soltos na raiz
    inlineBuffer += serializeInlineNode(el);
  };

  root.childNodes.forEach((child) => processNode(child));
  flushInlineBuffer();

  return blocks.join('\n\n');
}

function getFontFamilyCss(fonte: 'Times New Roman' | 'Arial' | 'Calibri'): string {
  if (fonte === 'Arial') return 'Arial, Helvetica, sans-serif';
  if (fonte === 'Calibri') return 'Calibri, "Segoe UI", Arial, sans-serif';
  return '"Times New Roman", Times, Georgia, serif';
}

function getAlinhamentoLabel(alinhamento: 'justify' | 'left' | 'center'): string {
  if (alinhamento === 'center') return 'Centralizado';
  if (alinhamento === 'left') return 'À Esquerda';
  return 'Justificado';
}

function findAncestorTag(node: Node | null, root: HTMLElement, tagNames: string[]): HTMLElement | null {
  let curr: Node | null = node;
  while (curr && curr !== root) {
    if (curr.nodeType === Node.ELEMENT_NODE) {
      const el = curr as HTMLElement;
      if (tagNames.includes(el.tagName.toUpperCase())) {
        return el;
      }
    }
    curr = curr.parentNode;
  }
  return null;
}

function unwrapElement(el: HTMLElement) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el);
  }
  parent.removeChild(el);
}

export const RedatorRichEditor = forwardRef<RedatorRichEditorHandle, RedatorRichEditorProps>(
  (
    {
      value,
      onChange,
      fonte,
      tamanhoFonte,
      alinhamento,
      recuoPrimeiraLinha,
      recuoSegundaLinha,
      margemEsquerda,
      margemDireita,
      disabled = false,
      placeholder = 'Digite o teor do documento oficial ou utilize a barra de ferramentas de formatação e régua de parágrafos acima...',
      mode,
      onModeChange,
      onTabular,
      sanitizarTexto,
      onActiveFormatsChange,
      textareaFallbackRef,
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const lastSyncedMarkupRef = useRef<string | null>(null);
    const lastModeRef = useRef<'visual' | 'codigo'>(mode);
    const sanitizarRef = useRef(sanitizarTexto);
    sanitizarRef.current = sanitizarTexto;

    // Sincroniza HTML inicial e atualizações externas (IA, Modelos, Undo/Redo, Importação, Troca de Modo)
    useEffect(() => {
      if (mode !== 'visual') {
        lastModeRef.current = mode;
        return;
      }
      const el = editorRef.current;
      if (!el) return;

      const switchedToVisual = lastModeRef.current !== 'visual' || lastSyncedMarkupRef.current === null;
      lastModeRef.current = mode;

      if (!switchedToVisual && value === lastSyncedMarkupRef.current) {
        return;
      }

      const nextHtml = redatorMarkupToEditorHtml(value, sanitizarRef.current);
      if (el.innerHTML !== nextHtml) {
        el.innerHTML = nextHtml;
      }
      lastSyncedMarkupRef.current = value;
    }, [value, mode]);

    // Emite mudanças do DOM visual para o estado canônico redatorTexto
    const emitFromDom = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const markup = domToRedatorMarkup(el);
      if (markup === lastSyncedMarkupRef.current) return;
      lastSyncedMarkupRef.current = markup;
      onChange(markup);
    }, [onChange]);

    // Detecta formatações ativas na posição atual do cursor para acender os botões da barra
    const updateActiveFormats = useCallback(() => {
      if (!onActiveFormatsChange) return;
      if (mode !== 'visual') {
        onActiveFormatsChange(DEFAULT_ACTIVE_FORMATS);
        return;
      }
      const el = editorRef.current;
      const sel = window.getSelection();
      if (!el || !sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
        onActiveFormatsChange(DEFAULT_ACTIVE_FORMATS);
        return;
      }

      try {
        const anchor = sel.anchorNode;
        const bold =
          document.queryCommandState('bold') || !!findAncestorTag(anchor, el, ['STRONG', 'B']);
        const italic =
          document.queryCommandState('italic') || !!findAncestorTag(anchor, el, ['EM', 'I']);
        const underline =
          document.queryCommandState('underline') || !!findAncestorTag(anchor, el, ['U']);
        const strike =
          document.queryCommandState('strikeThrough') ||
          !!findAncestorTag(anchor, el, ['DEL', 'S', 'STRIKE']);
        const mark = !!findAncestorTag(anchor, el, ['MARK']);
        const ul =
          document.queryCommandState('insertUnorderedList') || !!findAncestorTag(anchor, el, ['UL']);
        const ol =
          document.queryCommandState('insertOrderedList') || !!findAncestorTag(anchor, el, ['OL']);
        const quote = !!findAncestorTag(anchor, el, ['BLOCKQUOTE']);

        onActiveFormatsChange({ bold, italic, underline, strike, mark, ul, ol, quote });
      } catch {
        onActiveFormatsChange(DEFAULT_ACTIVE_FORMATS);
      }
    }, [mode, onActiveFormatsChange]);

    useEffect(() => {
      if (mode !== 'visual') return;
      const handleSelectionChange = () => updateActiveFormats();
      document.addEventListener('selectionchange', handleSelectionChange);
      return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [mode, updateActiveFormats]);

    // Garante que existe uma seleção válida dentro do editor antes de aplicar comandos
    const ensureSelectionInsideEditor = useCallback((): Range | null => {
      const el = editorRef.current;
      if (!el) return null;
      el.focus();
      try {
        document.execCommand('defaultParagraphSeparator', false, 'p');
      } catch {
        // Ignora em navegadores sem suporte
      }
      const sel = window.getSelection();
      if (!sel) return null;

      if (sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
        return sel.getRangeAt(0);
      }

      // Coloca o cursor no final do conteúdo
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      return range;
    }, []);

    const toggleMarkOrCampo = useCallback(
      (kind: 'mark' | 'campo') => {
        const el = editorRef.current;
        if (!el) return;
        const range = ensureSelectionInsideEditor();
        const sel = window.getSelection();
        if (!range || !sel) return;

        if (kind === 'mark') {
          const existingMark = findAncestorTag(range.commonAncestorContainer, el, ['MARK']);
          if (existingMark) {
            unwrapElement(existingMark);
            emitFromDom();
            updateActiveFormats();
            return;
          }

          const markEl = document.createElement('mark');
          if (range.collapsed) {
            markEl.textContent = 'texto destacado';
            range.insertNode(markEl);
            const newRange = document.createRange();
            newRange.selectNodeContents(markEl);
            sel.removeAllRanges();
            sel.addRange(newRange);
          } else {
            const frag = range.extractContents();
            markEl.appendChild(frag);
            range.insertNode(markEl);
            const newRange = document.createRange();
            newRange.selectNodeContents(markEl);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
          emitFromDom();
          updateActiveFormats();
          return;
        }

        // Inserir [CAMPO]
        const span = document.createElement('span');
        span.setAttribute('data-redator-campo', '1');
        span.className = 'sgep-campo-badge';
        const selectedText = range.toString().trim();
        const cleanLabel = selectedText.replace(/^\[|\]$/g, '') || 'PREENCHER';
        span.textContent = `[${cleanLabel.toUpperCase()}]`;

        range.deleteContents();
        range.insertNode(span);
        const spaceAfter = document.createTextNode(' ');
        span.after(spaceAfter);

        const newRange = document.createRange();
        newRange.setStartAfter(spaceAfter);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);

        emitFromDom();
        updateActiveFormats();
      },
      [ensureSelectionInsideEditor, emitFromDom, updateActiveFormats]
    );

    const toggleBlockquote = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const range = ensureSelectionInsideEditor();
      const sel = window.getSelection();
      if (!range || !sel) return;

      const existingQuote = findAncestorTag(range.commonAncestorContainer, el, ['BLOCKQUOTE']);
      if (existingQuote) {
        const p = document.createElement('p');
        while (existingQuote.firstChild) {
          p.appendChild(existingQuote.firstChild);
        }
        existingQuote.replaceWith(p);
        const r = document.createRange();
        r.selectNodeContents(p);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
        emitFromDom();
        updateActiveFormats();
        return;
      }

      const currentBlock = findAncestorTag(range.commonAncestorContainer, el, ['P', 'DIV', 'LI']);
      const bq = document.createElement('blockquote');
      if (currentBlock && currentBlock !== el && currentBlock.tagName !== 'LI') {
        while (currentBlock.firstChild) {
          bq.appendChild(currentBlock.firstChild);
        }
        if (!bq.textContent?.trim()) {
          bq.textContent = 'Transcrição de artigo de lei ou parecer';
        }
        currentBlock.replaceWith(bq);
      } else {
        const selected = range.toString().trim();
        bq.textContent = selected || 'Transcrição de artigo de lei ou parecer';
        range.deleteContents();
        range.insertNode(bq);
      }

      const r = document.createRange();
      r.selectNodeContents(bq);
      sel.removeAllRanges();
      sel.addRange(r);

      emitFromDom();
      updateActiveFormats();
    }, [ensureSelectionInsideEditor, emitFromDom, updateActiveFormats]);

    const insertHorizontalRule = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const range = ensureSelectionInsideEditor();
      const sel = window.getSelection();
      if (!range || !sel) return;

      const hr = document.createElement('hr');
      const nextP = document.createElement('p');
      nextP.innerHTML = '<br>';

      const currentBlock = findAncestorTag(range.commonAncestorContainer, el, [
        'P',
        'DIV',
        'BLOCKQUOTE',
        'UL',
        'OL',
      ]);

      if (currentBlock && currentBlock.parentNode === el) {
        currentBlock.after(hr, nextP);
      } else {
        el.appendChild(hr);
        el.appendChild(nextP);
      }

      const r = document.createRange();
      r.setStart(nextP, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);

      emitFromDom();
      updateActiveFormats();
    }, [ensureSelectionInsideEditor, emitFromDom, updateActiveFormats]);

    const insertNormativePrefix = useCallback(
      (prefixo: string, placeholderText: string) => {
        const el = editorRef.current;
        if (!el) return;
        const range = ensureSelectionInsideEditor();
        const sel = window.getSelection();
        if (!range || !sel) return;

        const selectedText = range.toString();
        if (selectedText.trim()) {
          const lines = selectedText.split('\n').filter((l) => l.trim());
          const frag = document.createDocumentFragment();
          let lastP: HTMLParagraphElement | null = null;
          lines.forEach((line) => {
            const p = document.createElement('p');
            p.textContent = `${prefixo}${line.trim()}`;
            frag.appendChild(p);
            lastP = p;
          });
          range.deleteContents();
          range.insertNode(frag);
          if (lastP) {
            const r = document.createRange();
            r.selectNodeContents(lastP);
            r.collapse(false);
            sel.removeAllRanges();
            sel.addRange(r);
          }
        } else {
          const p = document.createElement('p');
          p.textContent = `${prefixo}${placeholderText}`;
          const currentBlock = findAncestorTag(range.commonAncestorContainer, el, [
            'P',
            'DIV',
            'BLOCKQUOTE',
            'UL',
            'OL',
          ]);
          if (currentBlock && currentBlock.parentNode === el) {
            if (!currentBlock.textContent?.trim()) {
              currentBlock.replaceWith(p);
            } else {
              currentBlock.after(p);
            }
          } else {
            el.appendChild(p);
          }

          // Seleciona o texto de exemplo após o prefixo para substituição imediata
          const textNode = p.firstChild;
          if (textNode) {
            const r = document.createRange();
            r.setStart(textNode, prefixo.length);
            r.setEnd(textNode, p.textContent.length);
            sel.removeAllRanges();
            sel.addRange(r);
          }
        }

        emitFromDom();
        updateActiveFormats();
      },
      [ensureSelectionInsideEditor, emitFromDom, updateActiveFormats]
    );

    // Fallback para quando o usuário estiver no modo Código (Texto Puro)
    const applyTextareaFallback = useCallback(
      (antes: string, depois: string, placeholderText: string) => {
        const ta = textareaFallbackRef?.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = ta.value;
        const hasSel = start !== end;
        const selected = val.substring(start, end) || placeholderText;
        const next = val.substring(0, start) + antes + selected + depois + val.substring(end);
        onChange(next);
        setTimeout(() => {
          ta.focus();
          ta.setSelectionRange(
            start + antes.length,
            start + antes.length + (hasSel ? selected.length : placeholderText.length)
          );
        }, 10);
      },
      [textareaFallbackRef, onChange]
    );

    const applyTextareaPrefixFallback = useCallback(
      (prefixo: string, placeholderText: string) => {
        const ta = textareaFallbackRef?.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = ta.value;
        const sel = val.substring(start, end);
        let novo = '';
        if (sel) {
          novo = sel
            .split('\n')
            .map((l) => (l.trim() ? `${prefixo}${l}` : l))
            .join('\n');
        } else {
          novo = prefixo === '---' ? '\n---\n' : `\n${prefixo}${placeholderText}\n`;
        }
        const next = val.substring(0, start) + novo + val.substring(end);
        onChange(next);
        setTimeout(() => {
          ta.focus();
          ta.setSelectionRange(start + novo.length, start + novo.length);
        }, 10);
      },
      [textareaFallbackRef, onChange]
    );

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          if (mode === 'visual') {
            editorRef.current?.focus();
          } else {
            textareaFallbackRef?.current?.focus();
          }
        },
        toggleFormat: (kind) => {
          if (mode === 'codigo') {
            const map: Record<RedatorInlineFormatKind, [string, string, string]> = {
              bold: ['**', '**', 'texto em negrito'],
              italic: ['*', '*', 'texto em itálico'],
              underline: ['<u>', '</u>', 'texto sublinhado'],
              strike: ['~~', '~~', 'texto tachado'],
              mark: ['<mark>', '</mark>', 'texto destacado'],
              campo: ['[', ']', 'PREENCHER'],
            };
            const [a, d, ph] = map[kind];
            applyTextareaFallback(a, d, ph);
            return;
          }

          if (kind === 'mark' || kind === 'campo') {
            toggleMarkOrCampo(kind);
            return;
          }

          const range = ensureSelectionInsideEditor();
          if (!range) return;

          const cmdMap: Record<'bold' | 'italic' | 'underline' | 'strike', string> = {
            bold: 'bold',
            italic: 'italic',
            underline: 'underline',
            strike: 'strikeThrough',
          };

          const labelMap: Record<'bold' | 'italic' | 'underline' | 'strike', string> = {
            bold: 'texto em negrito',
            italic: 'texto em itálico',
            underline: 'texto sublinhado',
            strike: 'texto tachado',
          };

          const tagMap: Record<'bold' | 'italic' | 'underline' | 'strike', string> = {
            bold: 'strong',
            italic: 'em',
            underline: 'u',
            strike: 'del',
          };

          // Se não há texto selecionado e o editor está vazio, insere exemplo já formatado e selecionado
          const el = editorRef.current;
          if (range.collapsed && el && !el.textContent?.trim()) {
            const p = document.createElement('p');
            const node = document.createElement(tagMap[kind]);
            node.textContent = labelMap[kind];
            p.appendChild(node);
            el.innerHTML = '';
            el.appendChild(p);
            const sel = window.getSelection();
            if (sel) {
              const r = document.createRange();
              r.selectNodeContents(node);
              sel.removeAllRanges();
              sel.addRange(r);
            }
            emitFromDom();
            updateActiveFormats();
            return;
          }

          document.execCommand(cmdMap[kind], false);
          emitFromDom();
          updateActiveFormats();
        },
        applyBlock: (kind) => {
          if (mode === 'codigo') {
            const map: Record<RedatorBlockFormatKind, [string, string]> = {
              ul: ['- ', 'Item da lista'],
              ol: ['1. ', 'Item numerado'],
              quote: ['> ', 'Transcrição de artigo de lei ou parecer'],
              hr: ['---', ''],
              inciso: ['I - ', 'Disposição normativa'],
              alinea: ['a) ', 'Alínea correspondente'],
            };
            const [pref, ph] = map[kind];
            applyTextareaPrefixFallback(pref, ph);
            return;
          }

          if (kind === 'quote') {
            toggleBlockquote();
            return;
          }
          if (kind === 'hr') {
            insertHorizontalRule();
            return;
          }
          if (kind === 'inciso') {
            insertNormativePrefix('I - ', 'Disposição normativa');
            return;
          }
          if (kind === 'alinea') {
            insertNormativePrefix('a) ', 'Alínea correspondente');
            return;
          }

          ensureSelectionInsideEditor();
          document.execCommand(kind === 'ul' ? 'insertUnorderedList' : 'insertOrderedList', false);
          emitFromDom();
          updateActiveFormats();
        },
        clearFormatting: () => {
          const limparTextoBruto = (str: string) =>
            sanitizarTexto(
              str
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
                .replace(/^---\s*$/gm, '')
            );

          if (mode === 'codigo') {
            const ta = textareaFallbackRef?.current;
            if (!ta) {
              onChange(limparTextoBruto(value));
              return;
            }
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const sel = ta.value.substring(start, end);
            const next = sel
              ? ta.value.substring(0, start) + limparTextoBruto(sel) + ta.value.substring(end)
              : limparTextoBruto(ta.value);
            onChange(next);
            return;
          }

          const el = editorRef.current;
          const sel = window.getSelection();
          if (el && sel && sel.rangeCount > 0 && !sel.isCollapsed && el.contains(sel.anchorNode)) {
            document.execCommand('removeFormat', false);
            const markAnc = findAncestorTag(sel.anchorNode, el, ['MARK', 'U', 'DEL', 'S', 'STRONG', 'B', 'EM', 'I']);
            if (markAnc) unwrapElement(markAnc);
            emitFromDom();
            updateActiveFormats();
            return;
          }

          const limpo = limparTextoBruto(value);
          if (el) {
            el.innerHTML = redatorMarkupToEditorHtml(limpo, sanitizarRef.current);
          }
          lastSyncedMarkupRef.current = limpo;
          onChange(limpo);
          updateActiveFormats();
        },
      }),
      [
        mode,
        value,
        onChange,
        sanitizarTexto,
        textareaFallbackRef,
        applyTextareaFallback,
        applyTextareaPrefixFallback,
        toggleMarkOrCampo,
        ensureSelectionInsideEditor,
        emitFromDom,
        updateActiveFormats,
        toggleBlockquote,
        insertHorizontalRule,
        insertNormativePrefix,
      ]
    );

    const handlePasteVisual = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData?.getData('text/plain') || '';
      const limpo = sanitizarTexto(pasted);
      if (!limpo) return;

      // Insere texto limpo preservando quebras de parágrafo sem trazer sujeira HTML externa
      const paragrafos = limpo.split(/\n{2,}/);
      if (paragrafos.length === 1 && !limpo.includes('\n')) {
        document.execCommand('insertText', false, limpo);
      } else {
        const html = paragrafos
          .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
          .join('');
        document.execCommand('insertHTML', false, html);
      }
      emitFromDom();
      updateActiveFormats();
    };

    const handleKeyDownVisual = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        onTabular(e.shiftKey ? 'diminuir' : 'aumentar');
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'b') {
          e.preventDefault();
          document.execCommand('bold', false);
          emitFromDom();
          updateActiveFormats();
        } else if (k === 'i') {
          e.preventDefault();
          document.execCommand('italic', false);
          emitFromDom();
          updateActiveFormats();
        } else if (k === 'u') {
          e.preventDefault();
          document.execCommand('underline', false);
          emitFromDom();
          updateActiveFormats();
        }
      }
    };

    // Cálculos exatos de recuo de 1ª e 2ª linha e margem visual proporcional no editor
    const recuo1 = Number.isFinite(recuoPrimeiraLinha) ? Math.max(0, recuoPrimeiraLinha) : 0;
    const recuo2 = Number.isFinite(recuoSegundaLinha) ? Math.max(0, recuoSegundaLinha) : 0;
    const diffIndentCm = (recuo1 - recuo2).toFixed(2);
    const padLeftCm = recuo2.toFixed(2);

    // Converte margens A4 (cm) em padding horizontal perceptível sem espremer telas menores
    const visualPadLeftPx = Math.round(Math.min(48, Math.max(12, margemEsquerda * 9)));
    const visualPadRightPx = Math.round(Math.min(44, Math.max(12, margemDireita * 9)));

    const editorStyle: React.CSSProperties & Record<string, string | number> = {
      fontFamily: getFontFamilyCss(fonte),
      fontSize: tamanhoFonte,
      textAlign: alinhamento,
      paddingLeft: `${visualPadLeftPx}px`,
      paddingRight: `${visualPadRightPx}px`,
      '--redator-indent-1': recuo2 > 0 ? `${diffIndentCm}cm` : recuo1 > 0 ? `${recuo1.toFixed(2)}cm` : '0cm',
      '--redator-indent-2': recuo2 > 0 ? `${padLeftCm}cm` : '0cm',
    };

    const isVazio = !value.trim();

    return (
      <div className="border border-slate-300 dark:border-slate-700 border-t-0 rounded-b-xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden transition-colors">
        {mode === 'visual' ? (
          <div className="relative">
            {isVazio && (
              <div
                aria-hidden="true"
                style={{
                  fontFamily: getFontFamilyCss(fonte),
                  fontSize: tamanhoFonte,
                  paddingLeft: `${visualPadLeftPx}px`,
                  paddingRight: `${visualPadRightPx}px`,
                }}
                className="pointer-events-none select-none absolute inset-x-0 top-3.5 text-slate-400 dark:text-slate-500 leading-relaxed"
              >
                {placeholder}
              </div>
            )}
            <div
              ref={editorRef}
              contentEditable={!disabled}
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-label="Texto do Documento (Redação Oficial)"
              spellCheck
              onInput={() => {
                emitFromDom();
                updateActiveFormats();
              }}
              onFocus={() => {
                try {
                  document.execCommand('defaultParagraphSeparator', false, 'p');
                } catch {}
                updateActiveFormats();
              }}
              onBlur={() => {
                emitFromDom();
              }}
              onKeyUp={updateActiveFormats}
              onMouseUp={updateActiveFormats}
              onKeyDown={handleKeyDownVisual}
              onPaste={handlePasteVisual}
              style={editorStyle}
              className={`sgep-rich-editor min-h-[220px] max-h-[460px] overflow-y-auto py-3.5 text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-hidden transition-opacity ${
                disabled ? 'opacity-40 pointer-events-none' : ''
              }`}
            />
          </div>
        ) : (
          <textarea
            ref={textareaFallbackRef}
            rows={9}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={(e) => {
              const pasted = e.clipboardData?.getData('text/plain');
              if (pasted !== undefined) {
                e.preventDefault();
                const ta = e.currentTarget;
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                const limpo = sanitizarTexto(pasted);
                const novoTexto = ta.value.substring(0, start) + limpo + ta.value.substring(end);
                onChange(novoTexto);
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
                onTabular(e.shiftKey ? 'diminuir' : 'aumentar');
              }
            }}
            style={{
              tabSize: 4,
              MozTabSize: 4,
            }}
            className={`w-full px-3.5 py-3 bg-white dark:bg-slate-800 text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 focus:outline-hidden transition-opacity ${
              disabled ? 'opacity-40 pointer-events-none' : ''
            }`}
            placeholder={placeholder}
          />
        )}

        {/* Barra de Status da Edição em Tempo Real & Alternador Visual/Código */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/70 border-t border-slate-200 dark:border-slate-700/80 text-[10px] text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{fonte}</span>
            <span>•</span>
            <span>{tamanhoFonte}</span>
            <span>•</span>
            <span>{getAlinhamentoLabel(alinhamento)}</span>
            <span>•</span>
            <span>
              1ª linha: <strong className="text-slate-700 dark:text-slate-200">{recuo1.toFixed(2).replace('.', ',')} cm</strong>
            </span>
            {recuo2 > 0 && (
              <>
                <span>•</span>
                <span>
                  2ª linha: <strong className="text-slate-700 dark:text-slate-200">{recuo2.toFixed(2).replace('.', ',')} cm</strong>
                </span>
              </>
            )}
          </div>

          <div className="inline-flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-md border border-slate-300/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onModeChange('visual')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                mode === 'visual'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Exibe negrito, itálico, fonte, recuos e margens em tempo real sem códigos"
            >
              <Eye className="w-3 h-3" />
              <span>Visual (Tempo Real)</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange('codigo')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                mode === 'codigo'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Alternar para edição de texto puro com marcações"
            >
              <Code2 className="w-3 h-3" />
              <span>Código</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

RedatorRichEditor.displayName = 'RedatorRichEditor';
