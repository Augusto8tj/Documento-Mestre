/**
 * Cliente Server-Side NVIDIA NIM (OpenAI-Compatible Gateway)
 * Modelo padrão: nvidia/nemotron-3.5-bolt-e4b (ultra-rápido, baixa latência)
 * Referência: SGEP Web Enterprise — Motor de Inteligência Híbrido
 */

import { maskPII } from '../lib/piiMasking';

export const DEFAULT_NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
export const DEFAULT_NVIDIA_MODEL = 'nvidia/nemotron-3.5-bolt-e4b';
const DEFAULT_TIMEOUT_MS = 60_000;

export interface NvidiaGenerateOptions {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  responseFormatJson?: boolean;
  skipMasking?: boolean;
}

export interface NvidiaGenerateResult {
  success: boolean;
  text?: string;
  model?: string;
  statusCode?: number;
  error?: string;
}

export function isNvidiaConfigured(): boolean {
  const key = (process.env.NVIDIA_API_KEY || '').trim();
  return Boolean(key && key !== 'nvapi-XXXXXX' && key !== 'MY_NVIDIA_API_KEY');
}

/**
 * Remove blocos internos de raciocínio (<think>...</think>) caso o modelo MoE emita tags de pensamento.
 */
function stripReasoningTags(raw: string): string {
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Executa chamada resiliente ao gateway NVIDIA NIM (Nemotron 3.5 Bolt) com timeout de 60s
 * e higienização proativa de PII (LGPD).
 */
export async function askNvidiaAI(
  input: string | NvidiaGenerateOptions
): Promise<NvidiaGenerateResult> {
  const apiKey = (process.env.NVIDIA_API_KEY || '').trim();
  if (!isNvidiaConfigured()) {
    return {
      success: false,
      statusCode: 503,
      error: 'Chave NVIDIA_API_KEY não configurada no servidor.',
    };
  }

  const opts: NvidiaGenerateOptions =
    typeof input === 'string' ? { prompt: input } : input;

  const baseUrl = (process.env.NVIDIA_BASE_URL || DEFAULT_NVIDIA_BASE_URL).replace(/\/+$/, '');
  const model = (process.env.NVIDIA_MODEL || DEFAULT_NVIDIA_MODEL).trim();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const cleanPrompt = opts.skipMasking ? opts.prompt : maskPII(opts.prompt);
  const systemText =
    opts.system || 'Você é um assistente técnico administrativo de alto desempenho.';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload: Record<string, any> = {
      model,
      messages: [
        { role: 'system', content: systemText },
        { role: 'user', content: cleanPrompt },
      ],
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 2048,
    };

    if (opts.responseFormatJson) {
      payload.response_format = { type: 'json_object' };
    }

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const errBody = await resp.text().catch(() => '');
      if (resp.status === 503 || resp.status === 429) {
        return {
          success: false,
          statusCode: resp.status,
          error: 'Limite de cota atingido no gateway NVIDIA. Tente em 2 segundos.',
        };
      }
      if (resp.status === 404) {
        return {
          success: false,
          statusCode: 404,
          error: `Modelo não encontrado no gateway NVIDIA. Verifique o ID '${model}'.`,
        };
      }
      if (resp.status === 401 || resp.status === 403) {
        return {
          success: false,
          statusCode: resp.status,
          error: 'Chave NVIDIA_API_KEY inválida ou sem permissão no gateway NVIDIA NIM.',
        };
      }
      return {
        success: false,
        statusCode: resp.status,
        error: `Erro HTTP ${resp.status} no gateway NVIDIA NIM${errBody ? `: ${errBody.slice(0, 180)}` : '.'}`,
      };
    }

    const data: any = await resp.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    const text = typeof rawContent === 'string' ? stripReasoningTags(rawContent) : '';

    if (!text) {
      return {
        success: false,
        statusCode: 502,
        error: 'O servidor NVIDIA retornou uma resposta vazia.',
      };
    }

    return {
      success: true,
      text,
      model,
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        success: false,
        statusCode: 504,
        error: 'Tempo limite excedido (60s) na comunicação com o gateway NVIDIA NIM.',
      };
    }
    const msg = String(err?.message || '');
    if (msg.includes('503') || msg.includes('429')) {
      return {
        success: false,
        statusCode: 429,
        error: 'Limite de cota atingido no gateway NVIDIA. Tente em 2 segundos.',
      };
    }
    if (msg.includes('404')) {
      return {
        success: false,
        statusCode: 404,
        error: `Modelo não encontrado. Verifique o ID '${model}'.`,
      };
    }
    return {
      success: false,
      statusCode: 502,
      error: 'Falha na comunicação com o provedor NVIDIA NIM.',
    };
  } finally {
    clearTimeout(timer);
  }
}
