import { AIDocument, AIGenerateJSONInput, AIGenerateTextInput, AIProvider, AIProviderError, AISchema } from '@/lib/ai/types';

function schemaHint(schema: AISchema): string {
  // Used as a prompt-level hint in addition to response_format, since
  // strict JSON-schema response modes aren't uniformly supported across
  // OpenAI-compatible providers (Grok, OpenRouter, OpenAI all vary).
  return JSON.stringify(schema, null, 2);
}

function toContent(prompt: string, document?: AIDocument) {
  if (!document) return prompt;

  return [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: `data:${document.mimeType};base64,${document.base64}` } },
  ];
}

async function classifyAndThrow(res: Response, providerName: string): Promise<never> {
  const body = await res.text().catch(() => '');
  const message = `${providerName} request failed (HTTP ${res.status}): ${body.slice(0, 300)}`;
  const retryable = res.status === 429 || res.status >= 500 || res.status === 408;
  throw new AIProviderError(message, providerName, retryable);
}

export interface OpenAICompatibleConfig {
  name: string;
  baseURL: string;
  apiKey: string;
  model: string;
}

export function createOpenAICompatibleProvider(config: OpenAICompatibleConfig): AIProvider {
  async function chatCompletion(
    content: string | Array<Record<string, unknown>>,
    jsonMode: boolean
  ): Promise<string> {
    let response: Response;

    try {
      response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content }],
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network request failed.';
      throw new AIProviderError(message, config.name, true);
    }

    if (!response.ok) {
      await classifyAndThrow(response, config.name);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (typeof text !== 'string' || !text.trim()) {
      throw new AIProviderError(`${config.name} returned no content.`, config.name, false);
    }

    return text.trim();
  }

  return {
    name: config.name,
    async generateJSON<T>(input: AIGenerateJSONInput): Promise<T> {
      const prompt = `${input.prompt}\n\nRespond with ONLY a JSON object matching this schema (no markdown, no commentary):\n${schemaHint(input.schema)}`;
      const text = await chatCompletion(toContent(prompt, input.document), true);
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new AIProviderError(`${config.name} returned invalid JSON.`, config.name, false);
      }
    },
    async generateText(input: AIGenerateTextInput): Promise<string> {
      return chatCompletion(toContent(input.prompt, input.document), false);
    },
  };
}
