import { AIProvider } from '@/lib/ai/types';
import { createGeminiProvider } from '@/lib/ai/providers/gemini';
import { createOpenAICompatibleProvider } from '@/lib/ai/providers/openai-compatible';

export const PROVIDER_NAMES = ['gemini', 'grok', 'groq', 'openrouter', 'openai'] as const;
export type ProviderName = (typeof PROVIDER_NAMES)[number];

function buildProvider(name: ProviderName): AIProvider | null {
  switch (name) {
    case 'gemini':
      return process.env.GEMINI_API_KEY
        ? createGeminiProvider(process.env.GEMINI_API_KEY)
        : null;

    case 'grok':
      return process.env.GROK_API_KEY
        ? createOpenAICompatibleProvider({
            name: 'grok',
            baseURL: 'https://api.x.ai/v1',
            apiKey: process.env.GROK_API_KEY,
            model: process.env.GROK_MODEL ?? 'grok-2-latest',
          })
        : null;

    case 'groq':
      return process.env.GROQ_API_KEY
        ? createOpenAICompatibleProvider({
            name: 'groq',
            baseURL: 'https://api.groq.com/openai/v1',
            apiKey: process.env.GROQ_API_KEY,
            model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
          })
        : null;

    case 'openrouter':
      return process.env.OPENROUTER_API_KEY
        ? createOpenAICompatibleProvider({
            name: 'openrouter',
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: process.env.OPENROUTER_API_KEY,
            model: process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini',
          })
        : null;

    case 'openai':
      return process.env.OPENAI_API_KEY
        ? createOpenAICompatibleProvider({
            name: 'openai',
            baseURL: 'https://api.openai.com/v1',
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
          })
        : null;
  }
}

/**
 * Returns the provider chain to try, in order. The provider named by
 * AI_PROVIDER goes first (if configured); the remaining default priority
 * order (gemini -> grok -> groq -> openrouter -> openai) fills in the rest,
 * skipping any provider whose API key isn't set.
 */
export function getProviderChain(): AIProvider[] {
  const preferred = process.env.AI_PROVIDER as ProviderName | undefined;
  const order = preferred
    ? [preferred, ...PROVIDER_NAMES.filter((name) => name !== preferred)]
    : [...PROVIDER_NAMES];

  return order
    .map((name) => buildProvider(name))
    .filter((provider): provider is AIProvider => provider !== null);
}
