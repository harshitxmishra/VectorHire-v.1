import { AIGenerateJSONInput, AIGenerateTextInput, AIProviderError } from '@/lib/ai/types';
import { getProviderChain } from '@/lib/ai/providers';

const MAX_RETRIES_PER_PROVIDER = 2;
const BASE_BACKOFF_MS = 500;
const REQUEST_TIMEOUT_MS = 30_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number, providerName: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new AIProviderError(`${providerName} timed out.`, providerName, true)), ms)
    ),
  ]);
}

/**
 * Tries each configured provider in order. Within a provider, retries
 * retryable failures (429/quota/rate-limit/5xx/timeout/network) with
 * exponential backoff before giving up on it and moving to the next
 * provider. Non-retryable errors (bad request, invalid response) skip
 * straight to the next provider without wasting retries.
 */
async function withFallback<T>(run: (provider: ReturnType<typeof getProviderChain>[number]) => Promise<T>): Promise<T> {
  const chain = getProviderChain();

  if (chain.length === 0) {
    throw new Error(
      'No AI provider is configured. Set AI_PROVIDER and at least one of GEMINI_API_KEY, GROK_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY.'
    );
  }

  let lastError: unknown;

  for (const provider of chain) {
    for (let attempt = 0; attempt <= MAX_RETRIES_PER_PROVIDER; attempt++) {
      try {
        return await withTimeout(run(provider), REQUEST_TIMEOUT_MS, provider.name);
      } catch (err) {
        lastError = err;
        const retryable = err instanceof AIProviderError ? err.retryable : true;

        if (!retryable) break; // move to next provider immediately
        if (attempt === MAX_RETRIES_PER_PROVIDER) break; // exhausted retries on this provider

        await sleep(BASE_BACKOFF_MS * 2 ** attempt);
      }
    }
  }

  const message =
    lastError instanceof AIProviderError
      ? `AI request failed across all configured providers (last: ${lastError.providerName}).`
      : 'AI request failed across all configured providers.';

  console.error('AI fallback chain exhausted:', lastError);
  throw new Error(message);
}

export async function aiGenerateJSON<T = unknown>(input: AIGenerateJSONInput): Promise<T> {
  return withFallback((provider) => provider.generateJSON<T>(input));
}

export async function aiGenerateText(input: AIGenerateTextInput): Promise<string> {
  return withFallback((provider) => provider.generateText(input));
}
