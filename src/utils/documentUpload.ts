export const MAX_DOCUMENT_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB para DOCX/DOC/TXT/HTML
export const MAX_PDF_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB para PDF (pesquisável ou escaneado)

export interface ParsedUploadedDocument {
  titulo: string;
  texto: string;
  textoModelo?: string;
  assunto?: string;
  destinatario?: string;
  secretariaOrigem?: string;
  categoria?: string;
  tipoSugerido?: string;
  numeroOriginal?: string;
  dataDocumento?: string;
  referencia?: string;
  baseLegal?: string;
  palavrasChave?: string;
  resumoCatalogacao?: string;
  formatoOriginal: string;
  tamanhoBytes: number;
  reconhecidoPorIA?: boolean;
  avisoIA?: string;
}

export interface CatalogUploadOptions {
  categoriasExistentes?: string[];
  secretariasExistentes?: string[];
  usarIA?: boolean;
}

const TIPOS_VALIDOS = new Set([
  'MEMORANDO',
  'OFICIO',
  'DESPACHO',
  'CIRCULAR',
  'PORTARIA',
  'DECRETO',
  'ATO',
  'TERMO',
  'PARECER',
  'EMAIL',
  'CHECKLIST',
]);

function normalizeTipoCatalogado(raw?: string): string {
  const clean = String(raw || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '');
  if (TIPOS_VALIDOS.has(clean)) return clean;
  if (clean.includes('OFIC')) return 'OFICIO';
  if (clean.includes('MEMO')) return 'MEMORANDO';
  if (clean.includes('DESP')) return 'DESPACHO';
  if (clean.includes('CIRC')) return 'CIRCULAR';
  if (clean.includes('PORT')) return 'PORTARIA';
  if (clean.includes('DECR')) return 'DECRETO';
  if (clean.includes('PARE')) return 'PARECER';
  if (clean.includes('TERM')) return 'TERMO';
  if (clean.includes('MAIL')) return 'EMAIL';
  if (clean.includes('CHECK')) return 'CHECKLIST';
  if (clean.includes('ATO')) return 'ATO';
  return 'MEMORANDO';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const commaIdx = result.indexOf(',');
      resolve(commaIdx !== -1 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error(`Erro ao ler o arquivo "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

async function solicitarCatalogacaoIA(payload: {
  fileName: string;
  mimeType: string;
  fileBase64?: string;
  textoExtraido?: string;
  categoriasExistentes?: string[];
  secretariasExistentes?: string[];
}): Promise<{
  tipoDocumento: string;
  categoria: string;
  titulo: string;
  assunto: string;
  destinatario: string;
  secretariaOrigem: string;
  numeroOriginal: string;
  dataDocumento: string;
  referencia: string;
  baseLegal: string;
  palavrasChave: string;
  resumoCatalogacao: string;
  textoLimpo: string;
  textoModelo: string;
}> {
  const response = await fetch('/api/ai/catalogar-documento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let data: any = null;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Erro inesperado do servidor de reconhecimento (HTTP ${response.status}).`);
  }
  if (!response.ok || !data?.success || !data?.catalogacao) {
    throw new Error(data?.error || `Não foi possível analisar o documento (HTTP ${response.status}).`);
  }
  return data.catalogacao;
}

function normalizeLineBreaks(text: string): string {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000\t]+/g, ' ')
    .split('\n')
    .map(line => line.replace(/^[ ]+|[ ]+$/g, '').replace(/[ ]{2,}/g, ' '))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

function extractTextFromHtmlString(html: string): {
  texto: string;
  assunto?: string;
  destinatario?: string;
  referencia?: string;
  tipoSugerido?: string;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove elementos não textuais
  doc.querySelectorAll('script, style, noscript, head').forEach(el => el.remove());

  // Caso seja um .doc exportado pelo próprio Banco Mestre
  const docBodyEl = doc.querySelector('.doc-body');
  if (docBodyEl) {
    const bodyText = Array.from(docBodyEl.querySelectorAll('p, div, li'))
      .map(el => (el.textContent || '').trim())
      .filter(Boolean)
      .join('\n\n');

    const fullText = doc.body?.textContent || '';
    const assuntoMatch = fullText.match(/Assunto\s*:\s*([^\n]+)/i);
    const destMatch = fullText.match(/Para\s*:\s*([^\n]+)|Ao\s*\(À\)\s*([^\n]+)/i);
    const refMatch = fullText.match(/Referência\s*:\s*([^\n]+)/i);
    const tipoMatch = fullText.match(/\b(MEMORANDO|OFICIO|OFÍCIO|DESPACHO|CIRCULAR|PORTARIA|DECRETO|ATO|TERMO|EMAIL|PARECER)\b/i);

    return {
      texto: normalizeLineBreaks(bodyText || docBodyEl.textContent || ''),
      assunto: assuntoMatch?.[1]?.trim(),
      destinatario: (destMatch?.[1] || destMatch?.[2])?.trim(),
      referencia: refMatch?.[1]?.trim(),
      tipoSugerido: tipoMatch?.[1]?.toUpperCase().replace('Í', 'I')
    };
  }

  // HTML / MHTML genérico ou salvo pelo Word Web
  const blockTags = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TR', 'BLOCKQUOTE', 'PRE']);
  const chunks: string[] = [];

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const val = node.textContent || '';
      if (val.trim()) chunks.push(val.replace(/\s+/g, ' '));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (el.tagName === 'BR') {
      chunks.push('\n');
      return;
    }
    const isBlock = blockTags.has(el.tagName);
    if (isBlock && chunks.length > 0 && !chunks[chunks.length - 1].endsWith('\n')) {
      chunks.push('\n');
    }
    Array.from(el.childNodes).forEach(walk);
    if (isBlock) {
      chunks.push('\n\n');
    }
  };

  if (doc.body) {
    walk(doc.body);
  }

  return {
    texto: normalizeLineBreaks(chunks.join(''))
  };
}

function parseBancoMestreTxtIfApplicable(rawText: string): {
  texto: string;
  assunto?: string;
  destinatario?: string;
  referencia?: string;
  tipoSugerido?: string;
} {
  const normalized = normalizeLineBreaks(rawText);
  const eqDivider = '='.repeat(30);
  const dashDivider = '-'.repeat(30);

  if (normalized.includes(eqDivider) && normalized.includes(dashDivider)) {
    const eqIdx = normalized.indexOf(eqDivider);
    const dashIdx = normalized.indexOf(dashDivider, eqIdx);
    if (eqIdx !== -1 && dashIdx !== -1) {
      const metaBlock = normalized.slice(eqIdx, dashIdx);
      const afterDash = normalized.slice(dashIdx).replace(/^-+\s*\n?/, '').trim();

      const assuntoMatch = metaBlock.match(/Assunto\s*\/\s*Ementa:\s*([^\n]+)/i);
      const destMatch = metaBlock.match(/Destinatário:\s*([^\n]+)/i);
      const refMatch = metaBlock.match(/Referência:\s*([^\n]+)/i);
      const tipoMatch = metaBlock.match(/\n(MEMORANDO|OFICIO|OFÍCIO|DESPACHO|CIRCULAR|PORTARIA|DECRETO|ATO|TERMO|EMAIL|PARECER)\b/i);

      return {
        texto: afterDash || normalized,
        assunto: assuntoMatch?.[1]?.trim(),
        destinatario: destMatch?.[1]?.trim(),
        referencia: refMatch?.[1]?.trim(),
        tipoSugerido: tipoMatch?.[1]?.toUpperCase().replace('Í', 'I')
      };
    }
  }

  return { texto: normalized };
}

async function extractDocxXmlFromZip(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Localiza End of Central Directory (0x06054b50) a partir do final do arquivo
  let eocdOffset = -1;
  const minOffset = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= minOffset; i--) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('Arquivo .docx inválido ou corrompido (estrutura ZIP não localizada).');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);
  const decoder = new TextDecoder('utf-8');

  let cursor = centralDirOffset;
  for (let entry = 0; entry < totalEntries; entry++) {
    if (cursor + 46 > bytes.length || view.getUint32(cursor, true) !== 0x02014b50) {
      break;
    }

    const compressionMethod = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const fileNameLen = view.getUint16(cursor + 28, true);
    const extraLen = view.getUint16(cursor + 30, true);
    const commentLen = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);

    const fileName = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + fileNameLen));

    if (fileName === 'word/document.xml') {
      if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
        throw new Error('Cabeçalho interno do arquivo .docx inválido.');
      }

      const localNameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compressedSlice = bytes.subarray(dataStart, dataStart + compressedSize);

      if (compressionMethod === 0) {
        return decoder.decode(compressedSlice);
      }

      if (compressionMethod === 8) {
        if (typeof DecompressionStream === 'undefined') {
          throw new Error('Seu navegador não suporta descompressão nativa de .docx. Salve o documento como .txt para importar.');
        }
        const ds = new DecompressionStream('deflate-raw');
        const decompressedStream = new Blob([compressedSlice]).stream().pipeThrough(ds);
        return await new Response(decompressedStream).text();
      }

      throw new Error(`Método de compressão .docx não suportado (código ${compressionMethod}).`);
    }

    cursor += 46 + fileNameLen + extraLen + commentLen;
  }

  throw new Error('Conteúdo word/document.xml não encontrado dentro do arquivo .docx.');
}

function extractTextFromWordXml(xmlString: string): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
  const paragraphs = Array.from(xmlDoc.getElementsByTagName('*')).filter(
    el => el.localName === 'p'
  );

  const lines: string[] = [];

  for (const p of paragraphs) {
    let pText = '';
    const walkParagraph = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (el.localName === 't' || el.localName === 'delText') {
          pText += el.textContent || '';
          return;
        }
        if (el.localName === 'tab') {
          pText += ' ';
          return;
        }
        if (el.localName === 'br' || el.localName === 'cr') {
          pText += '\n';
          return;
        }
      }
      Array.from(node.childNodes).forEach(walkParagraph);
    };
    walkParagraph(p);
    lines.push(pText);
  }

  return normalizeLineBreaks(lines.join('\n\n'));
}

async function extractLocalTextDocument(file: File): Promise<ParsedUploadedDocument> {
  if (file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `O arquivo "${file.name}" possui ${sizeMb} MB e excede o limite de 5 MB para documentos editáveis.`
    );
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const titulo = stripFileExtension(file.name) || 'Documento Importado';

  if (ext === 'docx') {
    const buffer = await file.arrayBuffer();
    const xml = await extractDocxXmlFromZip(buffer);
    const texto = extractTextFromWordXml(xml);
    if (!texto) {
      throw new Error('Não foi possível extrair texto legível deste arquivo .docx.');
    }
    return {
      titulo,
      texto,
      formatoOriginal: 'DOCX',
      tamanhoBytes: file.size,
    };
  }

  if (ext === 'doc') {
    const buffer = await file.arrayBuffer();
    const head = new Uint8Array(buffer.slice(0, 4));
    const isLegacyOle2 = head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0;
    if (isLegacyOle2) {
      throw new Error(
        'Este arquivo .doc está no formato binário antigo (Word 97-2003). Abra-o no Word ou LibreOffice, salve como .docx ou .pdf e envie novamente.'
      );
    }
    const rawHtmlOrText = new TextDecoder('utf-8').decode(buffer);
    if (/<html|<body|<div/i.test(rawHtmlOrText)) {
      const parsed = extractTextFromHtmlString(rawHtmlOrText);
      if (!parsed.texto) {
        throw new Error('Não foi possível extrair texto deste arquivo .doc.');
      }
      return {
        titulo,
        ...parsed,
        formatoOriginal: 'DOC',
        tamanhoBytes: file.size,
      };
    }
    const parsedTxt = parseBancoMestreTxtIfApplicable(rawHtmlOrText);
    if (!parsedTxt.texto) {
      throw new Error('O arquivo .doc selecionado está vazio.');
    }
    return {
      titulo,
      ...parsedTxt,
      formatoOriginal: 'DOC',
      tamanhoBytes: file.size,
    };
  }

  if (ext === 'html' || ext === 'htm') {
    const rawHtml = await file.text();
    const parsed = extractTextFromHtmlString(rawHtml);
    if (!parsed.texto) {
      throw new Error('Não foi possível extrair texto deste arquivo HTML.');
    }
    return {
      titulo,
      ...parsed,
      formatoOriginal: 'HTML',
      tamanhoBytes: file.size,
    };
  }

  if (ext === 'txt' || ext === 'md' || ext === 'csv' || file.type.startsWith('text/')) {
    const rawText = await file.text();
    const parsed = parseBancoMestreTxtIfApplicable(rawText);
    if (!parsed.texto) {
      throw new Error('O arquivo de texto selecionado está vazio.');
    }
    return {
      titulo,
      ...parsed,
      formatoOriginal: ext.toUpperCase() || 'TXT',
      tamanhoBytes: file.size,
    };
  }

  throw new Error(
    `Formato ".${ext || 'desconhecido'}" não suportado. Utilize .pdf, .docx, .doc (Word/HTML), .html ou .txt.`
  );
}

export async function parseUploadedDocumentFile(
  file: File,
  options: CatalogUploadOptions = {}
): Promise<ParsedUploadedDocument> {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isPdf = ext === 'pdf' || file.type === 'application/pdf';
  const tituloPadrao = stripFileExtension(file.name) || 'Documento Importado';

  if (isPdf) {
    if (file.size > MAX_PDF_UPLOAD_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(
        `O PDF "${file.name}" possui ${sizeMb} MB e excede o limite de 10 MB para leitura e reconhecimento automático.`
      );
    }
    const fileBase64 = await fileToBase64(file);
    const cat = await solicitarCatalogacaoIA({
      fileName: file.name,
      mimeType: 'application/pdf',
      fileBase64,
      categoriasExistentes: options.categoriasExistentes,
      secretariasExistentes: options.secretariasExistentes,
    });
    const textoLimpo = normalizeLineBreaks(cat.textoLimpo || cat.textoModelo || '');
    const textoModelo = normalizeLineBreaks(cat.textoModelo || textoLimpo);
    if (!textoLimpo) {
      throw new Error(`Não foi possível extrair texto legível do PDF "${file.name}".`);
    }
    return {
      titulo: (cat.titulo || tituloPadrao).trim(),
      texto: textoLimpo,
      textoModelo,
      assunto: (cat.assunto || cat.titulo || '').trim(),
      destinatario: (cat.destinatario || '').trim(),
      secretariaOrigem: (cat.secretariaOrigem || '').trim(),
      categoria: (cat.categoria || '1. Geral').trim(),
      tipoSugerido: normalizeTipoCatalogado(cat.tipoDocumento),
      numeroOriginal: (cat.numeroOriginal || '').trim(),
      dataDocumento: (cat.dataDocumento || '').trim(),
      referencia: (cat.referencia || '').trim(),
      baseLegal: (cat.baseLegal || '').trim(),
      palavrasChave: (cat.palavrasChave || '').trim(),
      resumoCatalogacao: (cat.resumoCatalogacao || '').trim(),
      formatoOriginal: 'PDF',
      tamanhoBytes: file.size,
      reconhecidoPorIA: true,
    };
  }

  const localParsed = await extractLocalTextDocument(file);

  if (options.usarIA) {
    try {
      const cat = await solicitarCatalogacaoIA({
        fileName: file.name,
        mimeType: file.type || 'text/plain',
        textoExtraido: localParsed.texto,
        categoriasExistentes: options.categoriasExistentes,
        secretariasExistentes: options.secretariasExistentes,
      });
      const textoLimpo = normalizeLineBreaks(cat.textoLimpo || localParsed.texto);
      const textoModelo = normalizeLineBreaks(cat.textoModelo || localParsed.texto);
      return {
        ...localParsed,
        titulo: (cat.titulo || localParsed.titulo || tituloPadrao).trim(),
        texto: textoLimpo || localParsed.texto,
        textoModelo,
        assunto: (cat.assunto || localParsed.assunto || cat.titulo || '').trim(),
        destinatario: (cat.destinatario || localParsed.destinatario || '').trim(),
        secretariaOrigem: (cat.secretariaOrigem || '').trim(),
        categoria: (cat.categoria || '1. Geral').trim(),
        tipoSugerido: normalizeTipoCatalogado(cat.tipoDocumento || localParsed.tipoSugerido),
        numeroOriginal: (cat.numeroOriginal || '').trim(),
        dataDocumento: (cat.dataDocumento || '').trim(),
        referencia: (cat.referencia || localParsed.referencia || '').trim(),
        baseLegal: (cat.baseLegal || '').trim(),
        palavrasChave: (cat.palavrasChave || '').trim(),
        resumoCatalogacao: (cat.resumoCatalogacao || '').trim(),
        reconhecidoPorIA: true,
      };
    } catch (iaErr: any) {
      return {
        ...localParsed,
        textoModelo: localParsed.texto,
        tipoSugerido: normalizeTipoCatalogado(localParsed.tipoSugerido),
        categoria: '1. Geral',
        reconhecidoPorIA: false,
        avisoIA: iaErr?.message || 'Texto extraído localmente; reconhecimento automático indisponível no momento.',
      };
    }
  }

  return localParsed;
}
