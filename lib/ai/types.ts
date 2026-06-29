// Provider-agnostic AI types. No code outside lib/ai should import any
// provider SDK (e.g. @google/genai) directly — everything goes through
// lib/ai/client.ts.

export type AISchemaType = 'object' | 'string' | 'number' | 'array' | 'boolean';

export interface AISchema {
  type: AISchemaType;
  properties?: Record<string, AISchema>;
  items?: AISchema;
  required?: string[];
  minimum?: number;
  maximum?: number;
  description?: string;
}

export interface AIDocument {
  mimeType: string;
  base64: string;
}

export interface AIGenerateJSONInput {
  prompt: string;
  schema: AISchema;
  document?: AIDocument;
}

export interface AIGenerateTextInput {
  prompt: string;
  document?: AIDocument;
}

export interface AIProvider {
  readonly name: string;
  generateJSON<T = unknown>(input: AIGenerateJSONInput): Promise<T>;
  generateText(input: AIGenerateTextInput): Promise<string>;
}

/**
 * Thrown by providers. `retryable` controls whether the fallback chain in
 * lib/ai/client.ts should retry (same provider, backoff) or move on to the
 * next configured provider — set for 429/quota/rate-limit/5xx/timeout/network
 * failures. Non-retryable errors (bad request, invalid schema) surface
 * immediately instead of burning calls on every provider.
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly providerName: string,
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
