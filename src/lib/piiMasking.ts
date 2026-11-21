/**
 * Motor de Higienização de Dados (PII Masking — Conformidade LGPD)
 * Garante que CPFs e endereços de e-mail não trafeguem expostos para provedores externos de IA.
 */

const CPF_FORMATTED_REGEX = /\d{3}\.\d{3}\.\d{3}-\d{2}/g;
const CPF_RAW_REGEX = /\b\d{11}\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/**
 * Mascara irreversivelmente CPFs e e-mails antes do envio para provedores externos de IA.
 */
export function maskPII(text: string): string {
  if (!text) return '';
  return text
    .replace(CPF_FORMATTED_REGEX, '[CPF MASCARADO]')
    .replace(CPF_RAW_REGEX, '[CPF MASCARADO]')
    .replace(EMAIL_REGEX, '[EMAIL MASCARADO]');
}

export interface ReversiblePIIResult {
  masked: string;
  maskedCount: number;
  restore: (output: string) => string;
}

/**
 * Mascara CPFs e e-mails com marcadores indexados ([CPF_MASCARADO_1], [EMAIL_MASCARADO_1])
 * antes do envio para a IA, permitindo restaurar localmente os dados no texto final
 * devolvido ao servidor municipal sem nunca expor os valores reais à API externa.
 */
export function maskPIIReversible(text: string): ReversiblePIIResult {
  if (!text) {
    return {
      masked: '',
      maskedCount: 0,
      restore: (output: string) => output,
    };
  }

  const replacements = new Map<string, string>();
  let cpfIdx = 0;
  let emailIdx = 0;

  const replaceWithToken = (match: string, prefix: 'CPF' | 'EMAIL'): string => {
    for (const [token, original] of replacements.entries()) {
      if (original === match) return token;
    }
    const nextIdx = prefix === 'CPF' ? ++cpfIdx : ++emailIdx;
    const token = `[${prefix}_MASCARADO_${nextIdx}]`;
    replacements.set(token, match);
    return token;
  };

  let masked = text.replace(CPF_FORMATTED_REGEX, (m) => replaceWithToken(m, 'CPF'));
  masked = masked.replace(CPF_RAW_REGEX, (m) => replaceWithToken(m, 'CPF'));
  masked = masked.replace(EMAIL_REGEX, (m) => replaceWithToken(m, 'EMAIL'));

  const restore = (output: string): string => {
    if (!output || replacements.size === 0) return output;
    let restored = output;
    for (const [token, original] of replacements.entries()) {
      restored = restored.split(token).join(original);
    }
    return restored;
  };

  return {
    masked,
    maskedCount: replacements.size,
    restore,
  };
}
