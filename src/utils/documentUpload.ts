import { ALL_DOCUMENT_TYPE_CODES, normalizeDocumentTypeCode } from '../documentTypes';
import {
  EstiloVisualExtraido,
  normalizeAlinhamento,
  normalizeEstiloVisualExtraido,
  normalizeFonte,
  normalizeTamanhoFonte,
} from '../documentStyles';

export const MAX_DOCUMENT_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB para ODT/DOCX/DOC/RTF/CSV/TXT/HTML
export const MAX_PDF_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB para PDF e imagens diretas (OCR)

export const SUPPORTED_DOCUMENT_ACCEPT =
  '.pdf,.odt,.docx,.doc,.rtf,.csv,.txt,.html,.htm,.md,.jpg,.jpeg,.png,.webp';

export interface DigitalSignatureInfo {
  detectada: boolean;
  nivelConfianca: 'criptografica' | 'textual_visual' | 'nenhuma';
  padrao: string;
  signatarios?: string;
  codigoVerificacao?: string;
  hashSha256: string;
  detalhes: string;
}

export interface EmbeddedImagePayload {
  mimeType: string;
  data: string;
  name?: string;
}

export interface ServidorExtraidoOCR {
  nome: string;
  matricula?: string;
  cargoEfetivo?: string;
  funcaoGratificada?: string;
  secretaria?: string;
  departamento?: string;
  acaoAto?: string;
}

export interface DepartamentoExtraidoOCR {
  secretaria?: string;
  departamento: string;
}

export interface DadosSistemaExtraidos {
  servidores: ServidorExtraidoOCR[];
  departamentos: DepartamentoExtraidoOCR[];
  cargos: string[];
  destinatarios: string[];
}

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
  ocrAplicado?: boolean;
  avisoIA?: string;
  assinaturaDigital?: DigitalSignatureInfo;
  dadosSistema?: DadosSistemaExtraidos;
  estiloVisual?: EstiloVisualExtraido;
}

export interface CatalogUploadOptions {
  categoriasExistentes?: string[];
  secretariasExistentes?: string[];
  usarIA?: boolean;
}

const TIPOS_VALIDOS = new Set<string>(ALL_DOCUMENT_TYPE_CODES);

function normalizeTipoCatalogado(raw?: string): string {
  const normalized = normalizeDocumentTypeCode(raw);
  return TIPOS_VALIDOS.has(normalized) ? normalized : 'MEMORANDO';
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
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

async function computeSha256Hex(buffer: ArrayBuffer): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fallback em contextos sem crypto.subtle
  }
  return '';
}

function detectPdfBinarySignature(buffer: ArrayBuffer, hashSha256: string): DigitalSignatureInfo {
  // Leitura estritamente somente-leitura dos bytes originais em Latin-1
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder('latin1');
  const raw = decoder.decode(bytes);

  const hasByteRange = /\/ByteRange\s*\[/.test(raw);
  const hasTypeSig = /\/Type\s*\/Sig\b/.test(raw);
  const hasSubFilter = /\/SubFilter\s*\/(adbe\.pkcs7\.(detached|sha1)|ETSI\.CAdES\.detached|ETSI\.RFC3161|adbe\.x509\.rsa_sha1)/i.test(raw);
  const hasDocTimeStamp = /\/Type\s*\/DocTimeStamp\b/.test(raw);

  if (hasByteRange && (hasTypeSig || hasSubFilter || hasDocTimeStamp)) {
    const subFilterMatch = raw.match(/\/SubFilter\s*\/([A-Za-z0-9._-]+)/);
    const nameMatch = raw.match(/\/Name\s*\(([^()]{2,120})\)/);
    const reasonMatch = raw.match(/\/Reason\s*\(([^()]{2,160})\)/);
    const isIcpOrGovBr = /ICP-Brasil|gov\.br|ITI|Serpro|Certisign|Soluti|Valid|Safeweb/i.test(raw);

    const padraoSub = subFilterMatch?.[1] || (hasDocTimeStamp ? 'RFC3161 DocTimeStamp' : 'PAdES / PKCS#7');
    const padrao = isIcpOrGovBr
      ? `PDF Assinado Criptograficamente (${padraoSub} • ICP-Brasil / Gov.br)`
      : `PDF Assinado Criptograficamente (${padraoSub})`;

    const signatarios = nameMatch?.[1]
      ? nameMatch[1].replace(/\\([()\\])/g, '$1').trim()
      : undefined;
    const detalhesPartes = [
      'Estrutura criptográfica /ByteRange e dicionário de assinatura detectados nos bytes originais do PDF.',
      reasonMatch?.[1] ? `Finalidade registrada: ${reasonMatch[1].replace(/\\([()\\])/g, '$1').trim()}.` : '',
    ].filter(Boolean);

    return {
      detectada: true,
      nivelConfianca: 'criptografica',
      padrao,
      signatarios,
      hashSha256,
      detalhes: detalhesPartes.join(' '),
    };
  }

  return {
    detectada: false,
    nivelConfianca: 'nenhuma',
    padrao: '',
    hashSha256,
    detalhes: '',
  };
}

function detectTextualDigitalSignature(text: string, hashSha256: string): DigitalSignatureInfo {
  const sample = String(text || '');
  const patterns: Array<{ regex: RegExp; label: string }> = [
    { regex: /validar\.iti\.gov\.br|assinador\.iti\.br|assinatura\s+avan[çc]ada\s+gov\.br|documento\s+assinado\s+digitalmente[\s\S]{0,120}gov\.br/i, label: 'Assinatura Digital Gov.br (ITI)' },
    { regex: /ICP-Brasil|Medida\s+Provis[óo]ria\s+n[º°]?\s*2\.200-2|Lei\s+n[º°]?\s*14\.063/i, label: 'Assinatura Digital ICP-Brasil / Lei 14.063' },
    { regex: /assinado\s+eletronicamente\s+por[\s\S]{0,200}(c[óo]digo\s+verificador|CRC|SEI)/i, label: 'Assinatura Eletrônica Institucional (SEI / Protocolo)' },
    { regex: /documento\s+assinado\s+digitalmente|assinado\s+digitalmente\s+por|certificado\s+digital\s+(A1|A3)|Autentique|Clicksign|DocuSign/i, label: 'Assinatura Digital / Eletrônica Identificada no Teor' },
  ];

  for (const p of patterns) {
    if (p.regex.test(sample)) {
      const verifMatch = sample.match(
        /(?:c[óo]digo\s+verificador|c[óo]digo\s+CRC|hash|verifique\s+em|validar\.iti\.gov\.br)[^\n]{0,110}/i
      );
      const signMatch = sample.match(
        /(?:assinado\s+(?:digitalmente|eletronicamente)\s+por\s*:?\s*)([^\n,;]{3,90})/i
      );
      return {
        detectada: true,
        nivelConfianca: 'textual_visual',
        padrao: p.label,
        signatarios: signMatch?.[1]?.trim(),
        codigoVerificacao: verifMatch?.[0]?.trim(),
        hashSha256,
        detalhes: 'Indícios textuais de assinatura digital/código verificador identificados no conteúdo do arquivo.',
      };
    }
  }

  return {
    detectada: false,
    nivelConfianca: 'nenhuma',
    padrao: '',
    hashSha256,
    detalhes: '',
  };
}

function mergeSignatureInfo(
  localSig: DigitalSignatureInfo,
  aiSig?: {
    possuiAssinaturaDigital?: boolean;
    tipoAssinaturaDigital?: string;
    signatariosDigitais?: string;
    codigoVerificacao?: string;
  }
): DigitalSignatureInfo {
  if (localSig.detectada) {
    return {
      ...localSig,
      padrao: aiSig?.tipoAssinaturaDigital?.trim()
        ? `${localSig.padrao} • ${aiSig.tipoAssinaturaDigital.trim()}`
        : localSig.padrao,
      signatarios: aiSig?.signatariosDigitais?.trim() || localSig.signatarios,
      codigoVerificacao: aiSig?.codigoVerificacao?.trim() || localSig.codigoVerificacao,
    };
  }
  if (aiSig?.possuiAssinaturaDigital) {
    return {
      detectada: true,
      nivelConfianca: 'textual_visual',
      padrao: aiSig.tipoAssinaturaDigital?.trim() || 'Assinatura Digital / Eletrônica Detectada no Documento',
      signatarios: aiSig.signatariosDigitais?.trim() || undefined,
      codigoVerificacao: aiSig.codigoVerificacao?.trim() || undefined,
      hashSha256: localSig.hashSha256,
      detalhes: 'Assinatura digital ou carimbo de autenticação identificado durante a leitura/OCR do documento.',
    };
  }
  return localSig;
}

async function solicitarCatalogacaoIA(payload: {
  fileName: string;
  mimeType: string;
  formatoOriginal?: string;
  fileBase64?: string;
  textoExtraido?: string;
  embeddedImages?: EmbeddedImagePayload[];
  assinaturaDetectadaLocal?: DigitalSignatureInfo;
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
  possuiAssinaturaDigital: boolean;
  tipoAssinaturaDigital: string;
  signatariosDigitais: string;
  codigoVerificacao: string;
  textoLimpo: string;
  textoModelo: string;
  dadosSistema?: Partial<DadosSistemaExtraidos>;
  estiloVisual?: Record<string, any>;
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

function normalizeAndMergeDadosSistema(
  aiData: Partial<DadosSistemaExtraidos> | undefined,
  texto: string,
  destinatario?: string,
  secretariaOrigem?: string
): DadosSistemaExtraidos {
  const servidoresMap = new Map<string, ServidorExtraidoOCR>();
  const deptMap = new Map<string, DepartamentoExtraidoOCR>();
  const cargosSet = new Map<string, string>();
  const destSet = new Map<string, string>();

  const addServidor = (s: Partial<ServidorExtraidoOCR>) => {
    const nome = String(s.nome || '').trim();
    if (!nome || nome.length < 4 || /^\[.*\]$/.test(nome)) return;
    const key = `${nome.toLowerCase()}|${String(s.matricula || '').trim()}`;
    if (!servidoresMap.has(key)) {
      servidoresMap.set(key, {
        nome,
        matricula: String(s.matricula || '').replace(/[^\dA-Za-z-]/g, '').trim() || undefined,
        cargoEfetivo: String(s.cargoEfetivo || '').trim() || undefined,
        funcaoGratificada: String(s.funcaoGratificada || '').trim() || undefined,
        secretaria: String(s.secretaria || '').trim() || undefined,
        departamento: String(s.departamento || '').trim() || undefined,
        acaoAto: String(s.acaoAto || 'CITACAO').trim().toUpperCase(),
      });
    }
  };

  const addDepto = (d: Partial<DepartamentoExtraidoOCR>) => {
    const dep = String(d.departamento || '').trim().replace(/[.,;:]+$/, '');
    if (!dep || dep.length < 4 || dep.length > 85) return;
    const key = dep.toLowerCase();
    if (!deptMap.has(key)) {
      deptMap.set(key, {
        secretaria: String(d.secretaria || secretariaOrigem || '').trim() || undefined,
        departamento: dep,
      });
    }
  };

  const addCargo = (c?: string) => {
    const clean = String(c || '').trim().replace(/[.,;:]+$/, '');
    if (!clean || clean.length < 3 || clean.length > 85) return;
    const key = clean.toLowerCase();
    if (!cargosSet.has(key)) cargosSet.set(key, clean);
  };

  const addDest = (d?: string) => {
    const clean = String(d || '').trim().replace(/[.,;:]+$/, '');
    if (!clean || clean.length < 4 || clean.length > 100 || clean.toLowerCase() === 'não informado') return;
    const key = clean.toLowerCase();
    if (!destSet.has(key)) destSet.set(key, clean);
  };

  if (Array.isArray(aiData?.servidores)) {
    aiData.servidores.forEach(s => {
      if (s && typeof s === 'object') addServidor(s);
    });
  }
  if (Array.isArray(aiData?.departamentos)) {
    aiData.departamentos.forEach(d => {
      if (d && typeof d === 'object') addDepto(d);
    });
  }
  if (Array.isArray(aiData?.cargos)) {
    aiData.cargos.forEach(c => addCargo(c));
  }
  if (Array.isArray(aiData?.destinatarios)) {
    aiData.destinatarios.forEach(d => addDest(d));
  }
  if (destinatario) {
    addDest(destinatario);
  }

  // Fallback heurístico local (funciona mesmo sem IA ou para complementar)
  const sample = String(texto || '');
  if (sample.length > 15) {
    // Detecta Departamentos / Divisões / Coordenadorias mencionadas no texto
    const deptoRegex = /\b((?:Departamento|Divis[aã]o|Coordenadoria|Diretoria|Setor|N[uú]cleo|Ger[eê]ncia)\s+de\s+[A-ZÀ-Úa-zà-ú0-9\s/-]{3,55}?)(?=[.,;\n]|(?:\s+(?:da|do|de)\s+Secretaria)|$)/gi;
    let dm: RegExpExecArray | null;
    let deptoHits = 0;
    while ((dm = deptoRegex.exec(sample)) !== null && deptoHits < 6) {
      addDepto({ secretaria: secretariaOrigem, departamento: dm[1] });
      deptoHits++;
    }

    // Detecta pares Nome + Matrícula quando a IA não retornou servidores
    if (servidoresMap.size === 0) {
      const servRegex = /(?:servidor(?:a)?|Sr\.?|Sra\.?|nomear|exonerar|designar)\s+([A-ZÀ-Ú][A-Za-zÀ-ú]+(?:\s+(?:da|de|do|dos|das|e|[A-ZÀ-Ú][A-Za-zÀ-ú]+)){1,5})[^.\n]{0,60}?matr[ií]cula\s*(?:n[º°]?\.?)?\s*(\d{2,8})/gi;
      let sm: RegExpExecArray | null;
      let servHits = 0;
      const isExon = /\bexonerar\b|\bexonera[çc][aã]o\b/i.test(sample);
      const isNom = /\bnomear\b|\bnomea[çc][aã]o\b/i.test(sample);
      const isDesig = /\bdesignar\b|\bdesigna[çc][aã]o\b/i.test(sample);
      const acaoFallback = isExon ? 'EXONERACAO' : isNom ? 'NOMEACAO' : isDesig ? 'DESIGNACAO' : 'CITACAO';
      while ((sm = servRegex.exec(sample)) !== null && servHits < 8) {
        addServidor({
          nome: sm[1].trim(),
          matricula: sm[2].trim(),
          secretaria: secretariaOrigem,
          acaoAto: acaoFallback,
        });
        servHits++;
      }
    }
  }

  return {
    servidores: Array.from(servidoresMap.values()).slice(0, 12),
    departamentos: Array.from(deptMap.values()).slice(0, 6),
    cargos: Array.from(cargosSet.values()).slice(0, 10),
    destinatarios: Array.from(destSet.values()).slice(0, 6),
  };
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

// ==========================================
// LEITOR ZIP NATIVO (DOCX + ODT)
// ==========================================
interface ZipEntryMeta {
  fileName: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
}

function parseZipDirectory(buffer: ArrayBuffer): ZipEntryMeta[] {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

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
    throw new Error('Estrutura ZIP interna inválida ou arquivo corrompido.');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);
  const decoder = new TextDecoder('utf-8');
  const entries: ZipEntryMeta[] = [];

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

    entries.push({ fileName, compressionMethod, compressedSize, localHeaderOffset });
    cursor += 46 + fileNameLen + extraLen + commentLen;
  }

  return entries;
}

async function extractZipEntryBytes(buffer: ArrayBuffer, entry: ZipEntryMeta): Promise<Uint8Array> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  if (view.getUint32(entry.localHeaderOffset, true) !== 0x04034b50) {
    throw new Error(`Cabeçalho interno inválido para "${entry.fileName}".`);
  }

  const localNameLen = view.getUint16(entry.localHeaderOffset + 26, true);
  const localExtraLen = view.getUint16(entry.localHeaderOffset + 28, true);
  const dataStart = entry.localHeaderOffset + 30 + localNameLen + localExtraLen;
  const compressedSlice = bytes.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressedSlice;
  }

  if (entry.compressionMethod === 8) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Seu navegador não suporta descompressão nativa (DecompressionStream).');
    }
    const ds = new DecompressionStream('deflate-raw');
    const decompressedStream = new Blob([compressedSlice]).stream().pipeThrough(ds);
    const ab = await new Response(decompressedStream).arrayBuffer();
    return new Uint8Array(ab);
  }

  throw new Error(`Método de compressão ZIP não suportado (código ${entry.compressionMethod}).`);
}

async function extractZipEntryText(buffer: ArrayBuffer, entry: ZipEntryMeta): Promise<string> {
  const rawBytes = await extractZipEntryBytes(buffer, entry);
  return new TextDecoder('utf-8').decode(rawBytes);
}

function imageMimeFromPath(filePath: string): string | null {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  return null;
}

async function extractEmbeddedImagesFromZip(
  buffer: ArrayBuffer,
  entries: ZipEntryMeta[],
  folderPrefix: string
): Promise<EmbeddedImagePayload[]> {
  const candidates = entries
    .filter(e => e.fileName.startsWith(folderPrefix) && imageMimeFromPath(e.fileName) !== null)
    .sort((a, b) => b.compressedSize - a.compressedSize)
    .slice(0, 4);

  const images: EmbeddedImagePayload[] = [];
  let totalBytes = 0;
  const maxTotalBytes = 6 * 1024 * 1024;

  for (const entry of candidates) {
    try {
      const rawBytes = await extractZipEntryBytes(buffer, entry);
      // Ignora ícones minúsculos (< 6 KB) como pequenos brasões/linhas
      if (rawBytes.length < 6 * 1024) continue;
      if (totalBytes + rawBytes.length > maxTotalBytes) continue;
      const mimeType = imageMimeFromPath(entry.fileName);
      if (!mimeType) continue;
      totalBytes += rawBytes.length;
      images.push({
        mimeType,
        data: uint8ToBase64(rawBytes),
        name: entry.fileName.split('/').pop(),
      });
    } catch {
      // Ignora imagem individual ilegível sem falhar o documento inteiro
    }
  }
  return images;
}

async function detectZipDigitalSignature(
  buffer: ArrayBuffer,
  entries: ZipEntryMeta[],
  format: 'DOCX' | 'ODT',
  hashSha256: string
): Promise<DigitalSignatureInfo> {
  const sigEntries =
    format === 'ODT'
      ? entries.filter(e => /^META-INF\/.*signature.*\.xml$/i.test(e.fileName))
      : entries.filter(e => /^_xmlsignatures\/.*\.xml$/i.test(e.fileName));

  if (sigEntries.length === 0) {
    return {
      detectada: false,
      nivelConfianca: 'nenhuma',
      padrao: '',
      hashSha256,
      detalhes: '',
    };
  }

  let signatarios: string | undefined;
  try {
    for (const se of sigEntries) {
      const xml = await extractZipEntryText(buffer, se);
      const subjectMatch = xml.match(/<(?:\w+:)?X509SubjectName[^>]*>([^<]+)<\/(?:\w+:)?X509SubjectName>/i);
      if (subjectMatch?.[1]) {
        const cnMatch = subjectMatch[1].match(/CN=([^,]+)/i);
        signatarios = (cnMatch?.[1] || subjectMatch[1]).trim();
        break;
      }
    }
  } catch {
    // Segue com a detecção estrutural garantida
  }

  return {
    detectada: true,
    nivelConfianca: 'criptografica',
    padrao:
      format === 'ODT'
        ? 'Assinatura Digital XMLDSig — OpenDocument / LibreOffice (META-INF)'
        : 'Assinatura Digital XMLDSig — Microsoft Word / OOXML (_xmlsignatures)',
    signatarios,
    hashSha256,
    detalhes: `Arquivo de assinatura XMLDSig encontrado intacto no pacote ${format} (${sigEntries.map(s => s.fileName).join(', ')}).`,
  };
}

// ==========================================
// EXTRATORES XML (WORD .DOCX & LIBREOFFICE .ODT)
// ==========================================
function extractTextFromWordXml(xmlString: string): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
  const paragraphs = Array.from(xmlDoc.getElementsByTagName('*')).filter(el => el.localName === 'p');

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

function extractWordStyleHints(documentXml: string, stylesXml?: string, footerText?: string): Partial<EstiloVisualExtraido> {
  const hint: Partial<EstiloVisualExtraido> = {};
  const twipsToCm = (val?: string | null) => {
    const n = parseInt(String(val || ''), 10);
    if (Number.isNaN(n) || n <= 0) return undefined;
    return Math.round((n / 566.929) * 100) / 100;
  };
  const marMatch = documentXml.match(/<w:pgMar\b[^>]*>/i);
  if (marMatch) {
    const tag = marMatch[0];
    const top = twipsToCm(tag.match(/w:top="(\d+)"/i)?.[1]);
    const bottom = twipsToCm(tag.match(/w:bottom="(\d+)"/i)?.[1]);
    const left = twipsToCm(tag.match(/w:left="(\d+)"/i)?.[1]);
    const right = twipsToCm(tag.match(/w:right="(\d+)"/i)?.[1]);
    if (top || bottom || left || right) {
      hint.margens = {
        superior: top ?? 2.5,
        inferior: bottom ?? 2.0,
        esquerda: left ?? 3.0,
        direita: right ?? 2.0,
      };
    }
  }
  const combined = `${stylesXml || ''}\n${documentXml.slice(0, 12000)}`;
  const fontMatch = combined.match(/w:(?:ascii|hAnsi)="([^"]+)"/i);
  if (fontMatch?.[1]) {
    hint.fonte = normalizeFonte(fontMatch[1]);
  }
  const szMatch = combined.match(/<w:sz\s+w:val="(\d+)"/i);
  if (szMatch?.[1]) {
    const pt = parseInt(szMatch[1], 10) / 2;
    if (!Number.isNaN(pt) && pt >= 8 && pt <= 16) {
      hint.tamanhoFonte = normalizeTamanhoFonte(pt);
    }
  }
  const jcMatch = documentXml.match(/<w:jc\s+w:val="(both|left|center)"/i);
  if (jcMatch?.[1]) {
    hint.alinhamento = normalizeAlinhamento(jcMatch[1] === 'both' ? 'justify' : jcMatch[1]);
  }
  const firstLineMatch = documentXml.match(/w:firstLine="(\d+)"/i);
  if (firstLineMatch?.[1]) {
    const cm = twipsToCm(firstLineMatch[1]);
    if (cm !== undefined) hint.recuoParagrafoCm = cm;
  }
  if (footerText && footerText.trim().length >= 12) {
    const firstFooterLine = footerText.trim().split('\n').map(l => l.trim()).filter(l => l.length >= 10)[0];
    if (firstFooterLine) hint.rodapeTexto = firstFooterLine.slice(0, 180);
  }
  return hint;
}

function extractOdtStyleHints(stylesXml?: string): Partial<EstiloVisualExtraido> {
  const hint: Partial<EstiloVisualExtraido> = {};
  if (!stylesXml) return hint;
  const parseCm = (attr: string) => {
    const m = stylesXml.match(new RegExp(`fo:${attr}="([0-9.]+)cm"`, 'i'));
    return m?.[1] ? parseFloat(m[1]) : undefined;
  };
  const top = parseCm('margin-top');
  const bottom = parseCm('margin-bottom');
  const left = parseCm('margin-left');
  const right = parseCm('margin-right');
  if (top || bottom || left || right) {
    hint.margens = {
      superior: top ?? 2.5,
      inferior: bottom ?? 2.0,
      esquerda: left ?? 3.0,
      direita: right ?? 2.0,
    };
  }
  const fontMatch = stylesXml.match(/style:font-name="([^"]+)"/i);
  if (fontMatch?.[1]) hint.fonte = normalizeFonte(fontMatch[1]);
  const szMatch = stylesXml.match(/fo:font-size="([0-9.]+)pt"/i);
  if (szMatch?.[1]) hint.tamanhoFonte = normalizeTamanhoFonte(szMatch[1]);
  return hint;
}

function extractTextFromOdtXml(xmlString: string): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
  const blocks: string[] = [];

  const extractInline = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as Element;
    const ln = el.localName;
    if (ln === 'tab') return ' ';
    if (ln === 'line-break') return '\n';
    if (ln === 's') {
      const count = parseInt(el.getAttribute('text:c') || el.getAttribute('c') || '1', 10);
      return ' '.repeat(Math.min(Math.max(count || 1, 1), 8));
    }
    let out = '';
    Array.from(el.childNodes).forEach(child => {
      out += extractInline(child);
    });
    return out;
  };

  const walkBody = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const ln = el.localName;

    if (ln === 'table') {
      const rows = Array.from(el.children).filter(c => c.localName === 'table-row' || c.localName === 'table-header-rows');
      const collectRows = (container: Element): Element[] => {
        if (container.localName === 'table-row') return [container];
        return Array.from(container.children).filter(c => c.localName === 'table-row');
      };
      const tableLines: string[] = [];
      for (const rGroup of rows) {
        for (const row of collectRows(rGroup)) {
          const cells = Array.from(row.children)
            .filter(c => c.localName === 'table-cell')
            .map(cell => extractInline(cell).replace(/\s+/g, ' ').trim())
            .filter(Boolean);
          if (cells.length > 0) {
            tableLines.push(cells.join(' | '));
          }
        }
      }
      if (tableLines.length > 0) {
        blocks.push(tableLines.join('\n'));
      }
      return;
    }

    if (ln === 'p' || ln === 'h') {
      const txt = extractInline(el).trim();
      if (txt) blocks.push(txt);
      return;
    }

    Array.from(el.childNodes).forEach(walkBody);
  };

  const rootBody =
    Array.from(xmlDoc.getElementsByTagName('*')).find(el => el.localName === 'text') ||
    xmlDoc.documentElement;
  if (rootBody) {
    walkBody(rootBody);
  }

  return normalizeLineBreaks(blocks.join('\n\n'));
}

// ==========================================
// EXTRATOR RTF (COM ACENTUAÇÃO WINDOWS-1252 / UNICODE + DETECÇÃO DE IMAGENS \pict)
// ==========================================
function extractFromRtf(buffer: ArrayBuffer): {
  texto: string;
  embeddedImages: EmbeddedImagePayload[];
} {
  const raw = new TextDecoder('latin1').decode(new Uint8Array(buffer));
  const win1252 = new TextDecoder('windows-1252');

  const skipDestinations = new Set([
    'fonttbl',
    'colortbl',
    'stylesheet',
    'info',
    'pict',
    'object',
    'themedata',
    'colorschememapping',
    'latentstyles',
    'datastore',
    'xmlnstbl',
    'listtable',
    'listoverridetable',
    'rsidtbl',
    'mmathpr',
    'generator',
    'fldinst',
    'blipuid',
    'nonshppict',
    'datafield',
  ]);

  interface RtfGroupState {
    uc: number;
    skip: boolean;
  }

  const stack: RtfGroupState[] = [{ uc: 1, skip: false }];
  let out = '';
  let i = 0;
  const len = raw.length;
  let pendingHexBytes: number[] = [];

  const flushHexBytes = () => {
    if (pendingHexBytes.length === 0) return;
    out += win1252.decode(new Uint8Array(pendingHexBytes));
    pendingHexBytes = [];
  };

  while (i < len) {
    const ch = raw[i];
    const current = stack[stack.length - 1];

    if (ch === '{') {
      flushHexBytes();
      stack.push({ uc: current.uc, skip: current.skip });
      i++;
      continue;
    }

    if (ch === '}') {
      flushHexBytes();
      if (stack.length > 1) stack.pop();
      i++;
      continue;
    }

    if (ch === '\r' || ch === '\n') {
      i++;
      continue;
    }

    if (ch === '\\') {
      i++;
      if (i >= len) break;
      const next = raw[i];

      // Ignorable destination \*
      if (next === '*') {
        flushHexBytes();
        current.skip = true;
        i++;
        continue;
      }

      // Escaped literal characters
      if (next === '\\' || next === '{' || next === '}') {
        flushHexBytes();
        if (!current.skip) out += next;
        i++;
        continue;
      }

      if (next === '~') {
        flushHexBytes();
        if (!current.skip) out += ' ';
        i++;
        continue;
      }

      if (next === '_') {
        flushHexBytes();
        if (!current.skip) out += '-';
        i++;
        continue;
      }

      if (next === '-') {
        i++;
        continue;
      }

      if (next === '\r' || next === '\n') {
        flushHexBytes();
        if (!current.skip) out += '\n';
        i++;
        continue;
      }

      // Hex escape \'hh (Windows-1252 acentos em português)
      if (next === "'") {
        const hex = raw.slice(i + 1, i + 3);
        const byteVal = parseInt(hex, 16);
        if (!Number.isNaN(byteVal) && !current.skip) {
          pendingHexBytes.push(byteVal);
        }
        i += 3;
        continue;
      }

      // Control word
      flushHexBytes();
      let word = '';
      while (i < len && /[a-zA-Z]/.test(raw[i])) {
        word += raw[i++];
      }
      let paramStr = '';
      if (i < len && (raw[i] === '-' || /[0-9]/.test(raw[i]))) {
        if (raw[i] === '-') paramStr += raw[i++];
        while (i < len && /[0-9]/.test(raw[i])) {
          paramStr += raw[i++];
        }
      }
      // Delimiter space consumed by RTF spec
      if (i < len && raw[i] === ' ') {
        i++;
      }

      const wordLower = word.toLowerCase();
      const paramNum = paramStr ? parseInt(paramStr, 10) : NaN;

      if (skipDestinations.has(wordLower)) {
        current.skip = true;
        continue;
      }

      if (wordLower === 'uc' && !Number.isNaN(paramNum)) {
        current.uc = Math.max(0, paramNum);
        continue;
      }

      if (current.skip) continue;

      if (wordLower === 'u' && !Number.isNaN(paramNum)) {
        const codePoint = paramNum < 0 ? paramNum + 65536 : paramNum;
        out += String.fromCharCode(codePoint);
        // Pula os N caracteres substitutos definidos por \uc
        let skipped = 0;
        while (skipped < current.uc && i < len) {
          if (raw[i] === '\\' && raw[i + 1] === "'") {
            i += 4;
          } else if (raw[i] === '{' || raw[i] === '}') {
            break;
          } else {
            i++;
          }
          skipped++;
        }
        continue;
      }

      if (wordLower === 'par' || wordLower === 'row') {
        out += '\n\n';
      } else if (wordLower === 'line') {
        out += '\n';
      } else if (wordLower === 'tab') {
        out += ' ';
      } else if (wordLower === 'cell') {
        out += ' | ';
      } else if (wordLower === 'emdash') {
        out += '—';
      } else if (wordLower === 'endash') {
        out += '–';
      } else if (wordLower === 'lquote') {
        out += '‘';
      } else if (wordLower === 'rquote') {
        out += '’';
      } else if (wordLower === 'ldblquote') {
        out += '“';
      } else if (wordLower === 'rdblquote') {
        out += '”';
      } else if (wordLower === 'bullet') {
        out += '• ';
      }
      continue;
    }

    flushHexBytes();
    if (!current.skip) {
      out += ch;
    }
    i++;
  }

  flushHexBytes();
  const texto = normalizeLineBreaks(out);

  // Se o RTF tem pouco texto, tenta extrair imagens \pngblip ou \jpegblip embutidas para OCR
  const embeddedImages: EmbeddedImagePayload[] = [];
  if (texto.length < 180) {
    const pictRegex = /\\(pngblip|jpegblip)[\s\S]*?\s([0-9a-fA-F\r\n\s]{4000,})/g;
    let m: RegExpExecArray | null;
    let totalBytes = 0;
    while ((m = pictRegex.exec(raw)) !== null && embeddedImages.length < 3) {
      const mimeType = m[1] === 'pngblip' ? 'image/png' : 'image/jpeg';
      const hexClean = m[2].replace(/[^0-9a-fA-F]/g, '');
      const byteLen = Math.floor(hexClean.length / 2);
      if (byteLen < 6 * 1024 || totalBytes + byteLen > 5 * 1024 * 1024) continue;
      const imgBytes = new Uint8Array(byteLen);
      for (let b = 0; b < byteLen; b++) {
        imgBytes[b] = parseInt(hexClean.slice(b * 2, b * 2 + 2), 16);
      }
      totalBytes += byteLen;
      embeddedImages.push({
        mimeType,
        data: uint8ToBase64(imgBytes),
        name: `rtf_imagem_${embeddedImages.length + 1}.${mimeType === 'image/png' ? 'png' : 'jpg'}`,
      });
    }
  }

  return { texto, embeddedImages };
}

// ==========================================
// EXTRATOR CSV INTELIGENTE (UTF-8 / WINDOWS-1252 + AUTO-SEPARADOR ; / , / TAB)
// ==========================================
function decodeSmartText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // UTF-8 BOM
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes.subarray(3));
  }
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  // Se surgirem caracteres de substituição U+FFFD, decodifica como Windows-1252 (padrão Excel Brasil)
  if (utf8.includes('\uFFFD')) {
    return new TextDecoder('windows-1252').decode(bytes);
  }
  return utf8;
}

function detectCsvDelimiter(sample: string): string {
  const lines = sample.split(/\r?\n/).filter(l => l.trim()).slice(0, 10);
  const candidates = [';', ',', '\t'];
  let best = ';';
  let bestScore = -1;

  for (const delim of candidates) {
    const counts = lines.map(line => {
      let inQuotes = false;
      let count = 0;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQuotes = !inQuotes;
        else if (line[i] === delim && !inQuotes) count++;
      }
      return count;
    });
    const avg = counts.reduce((a, b) => a + b, 0) / Math.max(counts.length, 1);
    const nonZero = counts.filter(c => c > 0).length;
    const score = avg * (nonZero / Math.max(counts.length, 1));
    if (score > bestScore) {
      bestScore = score;
      best = delim;
    }
  }
  return bestScore > 0 ? best : ',';
}

function parseCsvRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        row.push(field.trim());
        field = '';
      } else if (ch === '\r' || ch === '\n') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field.trim());
        if (row.some(cell => cell.length > 0)) {
          rows.push(row);
        }
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }
  row.push(field.trim());
  if (row.some(cell => cell.length > 0)) {
    rows.push(row);
  }
  return rows;
}

function formatStructuredCsv(buffer: ArrayBuffer, fileName: string): {
  texto: string;
  resumoLocal: string;
} {
  const raw = decodeSmartText(buffer);
  const delimiter = detectCsvDelimiter(raw);
  const rows = parseCsvRows(raw, delimiter);
  if (rows.length === 0) {
    throw new Error(`O arquivo CSV "${fileName}" está vazio ou sem registros legíveis.`);
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const maxCols = Math.max(...rows.map(r => r.length));
  const delimLabel = delimiter === ';' ? 'ponto e vírgula (;)' : delimiter === '\t' ? 'tabulação' : 'vírgula (,)';

  const lines: string[] = [
    `DADOS ESTRUTURADOS (CSV • ${dataRows.length} registro(s), ${maxCols} coluna(s), separador ${delimLabel})`,
    `Colunas: ${headers.join(' | ')}`,
    '---',
  ];

  const previewLimit = 250;
  const rowsToFormat = dataRows.length > 0 ? dataRows.slice(0, previewLimit) : rows.slice(0, previewLimit);

  rowsToFormat.forEach((r, idx) => {
    if (dataRows.length > 0 && headers.length >= 2) {
      const pairs = headers
        .map((h, cIdx) => {
          const val = (r[cIdx] || '').trim();
          if (!val) return '';
          return `${h || `Col ${cIdx + 1}`}: ${val}`;
        })
        .filter(Boolean);
      if (pairs.length > 0) {
        lines.push(`${idx + 1}. ${pairs.join(' | ')}`);
      }
    } else {
      lines.push(r.filter(Boolean).join(' | '));
    }
  });

  if (dataRows.length > previewLimit) {
    lines.push(`\n[... mais ${dataRows.length - previewLimit} linha(s) adicionais no arquivo original ...]`);
  }

  return {
    texto: normalizeLineBreaks(lines.join('\n')),
    resumoLocal: `Planilha CSV estruturada com ${dataRows.length || rows.length} linha(s) e ${maxCols} coluna(s).`,
  };
}

// ==========================================
// EXTRATORES HTML / TXT LEGADO DO BANCO MESTRE
// ==========================================
function extractTextFromHtmlString(html: string): {
  texto: string;
  assunto?: string;
  destinatario?: string;
  referencia?: string;
  tipoSugerido?: string;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('script, style, noscript, head').forEach(el => el.remove());

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
      tipoSugerido: tipoMatch?.[1]?.toUpperCase().replace('Í', 'I'),
    };
  }

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
    texto: normalizeLineBreaks(chunks.join('')),
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
        tipoSugerido: tipoMatch?.[1]?.toUpperCase().replace('Í', 'I'),
      };
    }
  }

  return { texto: normalized };
}

// ==========================================
// EXTRAÇÃO LOCAL / HÍBRIDA DE DOCUMENTOS EDITÁVEIS
// ==========================================
interface LocalExtractionResult {
  parsed: ParsedUploadedDocument;
  embeddedImages: EmbeddedImagePayload[];
  localSignature: DigitalSignatureInfo;
}

async function extractLocalOrServerDocument(
  file: File,
  buffer: ArrayBuffer,
  hashSha256: string
): Promise<LocalExtractionResult> {
  if (file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `O arquivo "${file.name}" possui ${sizeMb} MB e excede o limite de 5 MB para documentos editáveis.`
    );
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const titulo = stripFileExtension(file.name) || 'Documento Importado';

  // 1. ODT (LibreOffice Writer)
  if (ext === 'odt') {
    const entries = parseZipDirectory(buffer);
    const contentEntry = entries.find(e => e.fileName === 'content.xml');
    if (!contentEntry) {
      throw new Error('Arquivo .odt inválido ou corrompido (content.xml não localizado).');
    }
    const contentXml = await extractZipEntryText(buffer, contentEntry);
    let texto = extractTextFromOdtXml(contentXml);

    // Verifica cabeçalhos/rodapés em styles.xml para captar carimbos de assinatura digital e estilo
    const stylesEntry = entries.find(e => e.fileName === 'styles.xml');
    let stylesText = '';
    let odtStyleHint: Partial<EstiloVisualExtraido> = {};
    if (stylesEntry) {
      try {
        const rawStylesXml = await extractZipEntryText(buffer, stylesEntry);
        stylesText = extractTextFromOdtXml(rawStylesXml);
        odtStyleHint = extractOdtStyleHints(rawStylesXml);
      } catch {
        // Opcional
      }
    }

    const zipSig = await detectZipDigitalSignature(buffer, entries, 'ODT', hashSha256);
    const textSig = detectTextualDigitalSignature(`${texto}\n${stylesText}`, hashSha256);
    const localSignature = zipSig.detectada ? zipSig : textSig;

    // Se houver pouco texto no ODT, extrai imagens embutidas em Pictures/ para OCR automático
    let embeddedImages: EmbeddedImagePayload[] = [];
    if (texto.length < 180) {
      embeddedImages = await extractEmbeddedImagesFromZip(buffer, entries, 'Pictures/');
    }

    if (!texto && embeddedImages.length === 0) {
      throw new Error('Não foi possível extrair texto ou imagens legíveis deste arquivo .odt.');
    }

    return {
      parsed: {
        titulo,
        texto,
        formatoOriginal: 'ODT',
        tamanhoBytes: file.size,
        assinaturaDigital: localSignature,
        estiloVisual: normalizeEstiloVisualExtraido(null, { fileName: file.name, localHint: odtStyleHint }),
      },
      embeddedImages,
      localSignature,
    };
  }

  // 2. DOCX (Microsoft Word OpenXML)
  if (ext === 'docx') {
    const entries = parseZipDirectory(buffer);
    const docEntry = entries.find(e => e.fileName === 'word/document.xml');
    if (!docEntry) {
      throw new Error('Arquivo .docx inválido ou corrompido (word/document.xml não localizado).');
    }
    const xml = await extractZipEntryText(buffer, docEntry);
    const texto = extractTextFromWordXml(xml);

    // Lê cabeçalhos/rodapés e styles.xml para não perder códigos verificadores nem DNA visual do Word
    let auxHeaderFooter = '';
    let footerOnlyText = '';
    const hfEntries = entries.filter(e => /^word\/(header|footer)\d*\.xml$/i.test(e.fileName));
    for (const hf of hfEntries.slice(0, 4)) {
      try {
        const hfTxt = extractTextFromWordXml(await extractZipEntryText(buffer, hf));
        auxHeaderFooter += '\n' + hfTxt;
        if (/footer/i.test(hf.fileName)) footerOnlyText += '\n' + hfTxt;
      } catch {
        // Opcional
      }
    }
    let wordStylesXml = '';
    const wordStylesEntry = entries.find(e => e.fileName === 'word/styles.xml');
    if (wordStylesEntry) {
      try {
        wordStylesXml = await extractZipEntryText(buffer, wordStylesEntry);
      } catch {
        // Opcional
      }
    }
    const docxStyleHint = extractWordStyleHints(xml, wordStylesXml, footerOnlyText);

    const zipSig = await detectZipDigitalSignature(buffer, entries, 'DOCX', hashSha256);
    const textSig = detectTextualDigitalSignature(`${texto}\n${auxHeaderFooter}`, hashSha256);
    const localSignature = zipSig.detectada ? zipSig : textSig;

    // Se o DOCX contiver pouco texto, extrai imagens de word/media/ para OCR automático
    let embeddedImages: EmbeddedImagePayload[] = [];
    if (texto.length < 180) {
      embeddedImages = await extractEmbeddedImagesFromZip(buffer, entries, 'word/media/');
    }

    if (!texto && embeddedImages.length === 0) {
      throw new Error('Não foi possível extrair texto ou imagens legíveis deste arquivo .docx.');
    }

    return {
      parsed: {
        titulo,
        texto,
        formatoOriginal: 'DOCX',
        tamanhoBytes: file.size,
        assinaturaDigital: localSignature,
        estiloVisual: normalizeEstiloVisualExtraido(null, { fileName: file.name, localHint: docxStyleHint }),
      },
      embeddedImages,
      localSignature,
    };
  }

  // 3. DOC (Microsoft Word 97-2003 binário OLE2, RTF disfarçado ou Word HTML)
  if (ext === 'doc') {
    const head = new Uint8Array(buffer.slice(0, 8));
    const isLegacyOle2 = head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0;
    const headStr = new TextDecoder('latin1').decode(head);

    if (headStr.startsWith('{\\rtf')) {
      const { texto, embeddedImages } = extractFromRtf(buffer);
      if (!texto && embeddedImages.length === 0) {
        throw new Error('Não foi possível extrair conteúdo legível deste arquivo .doc (RTF).');
      }
      const localSignature = detectTextualDigitalSignature(texto, hashSha256);
      return {
        parsed: {
          titulo,
          texto,
          formatoOriginal: 'DOC',
          tamanhoBytes: file.size,
          assinaturaDigital: localSignature,
        },
        embeddedImages,
        localSignature,
      };
    }

    if (isLegacyOle2) {
      const fileBase64 = uint8ToBase64(new Uint8Array(buffer));
      const resp = await fetch('/api/documents/extract-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileBase64 }),
      });
      let data: any = null;
      try {
        data = await resp.json();
      } catch {
        throw new Error(`Erro ao processar arquivo .doc legado no servidor (HTTP ${resp.status}).`);
      }
      if (!resp.ok || !data?.success) {
        throw new Error(
          data?.error || 'Não foi possível ler este arquivo .doc binário (Word 97-2003).'
        );
      }

      const texto = normalizeLineBreaks(String(data.texto || ''));
      const aux = String(data.cabecalhosRodapes || '');
      const textSig = detectTextualDigitalSignature(`${texto}\n${aux}`, hashSha256);
      const localSignature: DigitalSignatureInfo = data.possuiAssinaturaBinaria
        ? {
            detectada: true,
            nivelConfianca: 'criptografica',
            padrao: 'Assinatura Digital no Contêiner OLE2 (.doc Word 97-2003)',
            signatarios: textSig.signatarios,
            codigoVerificacao: textSig.codigoVerificacao,
            hashSha256,
            detalhes: data.detalhesAssinaturaBinaria || 'Fluxo de assinatura digital detectado no arquivo .doc original.',
          }
        : textSig;

      return {
        parsed: {
          titulo,
          texto,
          formatoOriginal: 'DOC',
          tamanhoBytes: file.size,
          assinaturaDigital: localSignature,
        },
        embeddedImages: [],
        localSignature,
      };
    }

    const rawHtmlOrText = decodeSmartText(buffer);
    if (/<html|<body|<div/i.test(rawHtmlOrText)) {
      const parsed = extractTextFromHtmlString(rawHtmlOrText);
      if (!parsed.texto) {
        throw new Error('Não foi possível extrair texto deste arquivo .doc.');
      }
      const localSignature = detectTextualDigitalSignature(parsed.texto, hashSha256);
      return {
        parsed: {
          titulo,
          ...parsed,
          formatoOriginal: 'DOC',
          tamanhoBytes: file.size,
          assinaturaDigital: localSignature,
        },
        embeddedImages: [],
        localSignature,
      };
    }

    const parsedTxt = parseBancoMestreTxtIfApplicable(rawHtmlOrText);
    if (!parsedTxt.texto) {
      throw new Error('O arquivo .doc selecionado está vazio.');
    }
    const localSignature = detectTextualDigitalSignature(parsedTxt.texto, hashSha256);
    return {
      parsed: {
        titulo,
        ...parsedTxt,
        formatoOriginal: 'DOC',
        tamanhoBytes: file.size,
        assinaturaDigital: localSignature,
      },
      embeddedImages: [],
      localSignature,
    };
  }

  // 4. RTF (Rich Text Format)
  if (ext === 'rtf') {
    const { texto, embeddedImages } = extractFromRtf(buffer);
    if (!texto && embeddedImages.length === 0) {
      throw new Error('Não foi possível extrair texto ou imagens legíveis deste arquivo .rtf.');
    }
    const localSignature = detectTextualDigitalSignature(texto, hashSha256);
    return {
      parsed: {
        titulo,
        texto,
        formatoOriginal: 'RTF',
        tamanhoBytes: file.size,
        assinaturaDigital: localSignature,
      },
      embeddedImages,
      localSignature,
    };
  }

  // 5. CSV (Comma-Separated Values — detecção de codificação e delimitador)
  if (ext === 'csv') {
    const { texto, resumoLocal } = formatStructuredCsv(buffer, file.name);
    const localSignature = detectTextualDigitalSignature(texto, hashSha256);
    return {
      parsed: {
        titulo,
        texto,
        resumoCatalogacao: resumoLocal,
        tipoSugerido: 'CHECKLIST',
        formatoOriginal: 'CSV',
        tamanhoBytes: file.size,
        assinaturaDigital: localSignature,
      },
      embeddedImages: [],
      localSignature,
    };
  }

  // 6. HTML / HTM
  if (ext === 'html' || ext === 'htm') {
    const rawHtml = decodeSmartText(buffer);
    const parsed = extractTextFromHtmlString(rawHtml);
    if (!parsed.texto) {
      throw new Error('Não foi possível extrair texto deste arquivo HTML.');
    }
    const localSignature = detectTextualDigitalSignature(parsed.texto, hashSha256);
    return {
      parsed: {
        titulo,
        ...parsed,
        formatoOriginal: 'HTML',
        tamanhoBytes: file.size,
        assinaturaDigital: localSignature,
      },
      embeddedImages: [],
      localSignature,
    };
  }

  // 7. TXT / MD / texto genérico
  if (ext === 'txt' || ext === 'md' || file.type.startsWith('text/')) {
    const rawText = decodeSmartText(buffer);
    const parsed = parseBancoMestreTxtIfApplicable(rawText);
    if (!parsed.texto) {
      throw new Error('O arquivo de texto selecionado está vazio.');
    }
    const localSignature = detectTextualDigitalSignature(parsed.texto, hashSha256);
    return {
      parsed: {
        titulo,
        ...parsed,
        formatoOriginal: ext.toUpperCase() || 'TXT',
        tamanhoBytes: file.size,
        assinaturaDigital: localSignature,
      },
      embeddedImages: [],
      localSignature,
    };
  }

  throw new Error(
    `Formato ".${ext || 'desconhecido'}" não suportado. Utilize .pdf, .odt, .docx, .doc, .rtf, .csv, .txt, .html ou imagens (.jpg, .png, .webp).`
  );
}

// ==========================================
// ORQUESTRADOR PRINCIPAL DE IMPORTAÇÃO + OCR + INTEGRIDADE DIGITAL
// ==========================================
export async function parseUploadedDocumentFile(
  file: File,
  options: CatalogUploadOptions = {}
): Promise<ParsedUploadedDocument> {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isPdf = ext === 'pdf' || file.type === 'application/pdf';
  const isImage =
    ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ||
    /^image\/(jpeg|jpg|png|webp)$/i.test(file.type);
  const tituloPadrao = stripFileExtension(file.name) || 'Documento Importado';

  // Leitura 100% somente-leitura dos bytes originais + cálculo do hash SHA-256 intacto
  const buffer = await file.arrayBuffer();
  const hashSha256 = await computeSha256Hex(buffer);

  // Fluxo A: PDF ou Imagem Direta (OCR Multimodal completo)
  if (isPdf || isImage) {
    if (file.size > MAX_PDF_UPLOAD_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(
        `O arquivo "${file.name}" possui ${sizeMb} MB e excede o limite de 10 MB para leitura e OCR automático.`
      );
    }

    const localSignature: DigitalSignatureInfo = isPdf
      ? detectPdfBinarySignature(buffer, hashSha256)
      : {
          detectada: false,
          nivelConfianca: 'nenhuma',
          padrao: '',
          hashSha256,
          detalhes: '',
        };

    const fileBase64 = await fileToBase64(file);
    const mimeType = isPdf
      ? 'application/pdf'
      : file.type && /^image\/(jpeg|png|webp)$/i.test(file.type)
      ? file.type
      : ext === 'png'
      ? 'image/png'
      : ext === 'webp'
      ? 'image/webp'
      : 'image/jpeg';

    const cat = await solicitarCatalogacaoIA({
      fileName: file.name,
      mimeType,
      formatoOriginal: isPdf ? 'PDF' : ext.toUpperCase(),
      fileBase64,
      assinaturaDetectadaLocal: localSignature,
      categoriasExistentes: options.categoriasExistentes,
      secretariasExistentes: options.secretariasExistentes,
    });

    const textoLimpo = normalizeLineBreaks(cat.textoLimpo || cat.textoModelo || '');
    const textoModelo = normalizeLineBreaks(cat.textoModelo || textoLimpo);
    if (!textoLimpo) {
      throw new Error(`Não foi possível extrair texto legível de "${file.name}".`);
    }

    const textSigFallback = !localSignature.detectada
      ? detectTextualDigitalSignature(textoLimpo, hashSha256)
      : localSignature;
    const assinaturaFinal = mergeSignatureInfo(textSigFallback, cat);

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
      formatoOriginal: isPdf ? 'PDF' : ext.toUpperCase(),
      tamanhoBytes: file.size,
      reconhecidoPorIA: true,
      ocrAplicado: true,
      assinaturaDigital: assinaturaFinal,
      dadosSistema: normalizeAndMergeDadosSistema(
        cat.dadosSistema,
        textoLimpo,
        cat.destinatario,
        cat.secretariaOrigem
      ),
      estiloVisual: normalizeEstiloVisualExtraido(cat.estiloVisual, {
        fileName: file.name,
        secretariaOrigem: cat.secretariaOrigem,
        tipoDocumento: cat.tipoDocumento,
      }),
    };
  }

  // Fluxo B: ODT / DOCX / DOC / RTF / CSV / HTML / TXT (com OCR automático em imagens embutidas se necessário)
  const { parsed: localParsed, embeddedImages, localSignature } = await extractLocalOrServerDocument(
    file,
    buffer,
    hashSha256
  );

  const precisaOcrEmbutido = embeddedImages.length > 0;

  if (options.usarIA || precisaOcrEmbutido) {
    try {
      const cat = await solicitarCatalogacaoIA({
        fileName: file.name,
        mimeType: file.type || 'text/plain',
        formatoOriginal: localParsed.formatoOriginal,
        textoExtraido: localParsed.texto,
        embeddedImages: precisaOcrEmbutido ? embeddedImages : undefined,
        assinaturaDetectadaLocal: localSignature,
        categoriasExistentes: options.categoriasExistentes,
        secretariasExistentes: options.secretariasExistentes,
      });

      const textoLimpo = normalizeLineBreaks(cat.textoLimpo || localParsed.texto);
      const textoModelo = normalizeLineBreaks(cat.textoModelo || textoLimpo || localParsed.texto);
      const assinaturaFinal = mergeSignatureInfo(localSignature, cat);

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
        resumoCatalogacao: (cat.resumoCatalogacao || localParsed.resumoCatalogacao || '').trim(),
        reconhecidoPorIA: true,
        ocrAplicado: precisaOcrEmbutido,
        assinaturaDigital: assinaturaFinal,
        dadosSistema: normalizeAndMergeDadosSistema(
          cat.dadosSistema,
          textoLimpo || localParsed.texto,
          cat.destinatario || localParsed.destinatario,
          cat.secretariaOrigem
        ),
        estiloVisual: normalizeEstiloVisualExtraido(cat.estiloVisual, {
          fileName: file.name,
          secretariaOrigem: cat.secretariaOrigem || localParsed.secretariaOrigem,
          tipoDocumento: cat.tipoDocumento || localParsed.tipoSugerido,
          localHint: localParsed.estiloVisual,
        }),
      };
    } catch (iaErr: any) {
      if (!localParsed.texto && precisaOcrEmbutido) {
        throw new Error(
          iaErr?.message ||
            `O arquivo "${file.name}" contém apenas imagens embutidas e o serviço de OCR não pôde ser concluído.`
        );
      }
      return {
        ...localParsed,
        textoModelo: localParsed.texto,
        tipoSugerido: normalizeTipoCatalogado(localParsed.tipoSugerido),
        categoria: '1. Geral',
        reconhecidoPorIA: false,
        ocrAplicado: false,
        assinaturaDigital: localSignature,
        dadosSistema: normalizeAndMergeDadosSistema(
          undefined,
          localParsed.texto,
          localParsed.destinatario,
          localParsed.secretariaOrigem
        ),
        estiloVisual: localParsed.estiloVisual || normalizeEstiloVisualExtraido(null, { fileName: file.name }),
        avisoIA: iaErr?.message || 'Texto extraído localmente; reconhecimento automático indisponível no momento.',
      };
    }
  }

  return {
    ...localParsed,
    dadosSistema: normalizeAndMergeDadosSistema(
      undefined,
      localParsed.texto,
      localParsed.destinatario,
      localParsed.secretariaOrigem
    ),
    estiloVisual: localParsed.estiloVisual || normalizeEstiloVisualExtraido(null, { fileName: file.name }),
  };
}
