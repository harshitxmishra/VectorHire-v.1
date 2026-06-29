import { GoogleGenAI, Type } from '@google/genai';
import { AIDocument, AIGenerateJSONInput, AIGenerateTextInput, AIProvider, AIProviderError, AISchema } from '@/lib/ai/types';

const GEMINI_TYPE_MAP: Record<AISchema['type'], unknown> = {
  object: Type.OBJECT,
  string: Type.STRING,
  number: Type.NUMBER,
  array: Type.ARRAY,
  boolean: Type.BOOLEAN,
};

function toGeminiSchema(schema: AISchema): Record<string, unknown> {
  const out: Record<string, unknown> = { type: GEMINI_TYPE_MAP[schema.type] };
  if (schema.properties) {
    out.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [key, toGeminiSchema(value)])
    );
  }
  if (schema.items) out.items = toGeminiSchema(schema.items);
  if (schema.required) out.required = schema.required;
  if (schema.minimum !== undefined) out.minimum = schema.minimum;
  if (schema.maximum !== undefined) out.maximum = schema.maximum;
  return out;
}

function toParts(prompt: string, document?: AIDocument) {
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (document) {
    parts.push({ inlineData: { mimeType: document.mimeType, data: document.base64 } });
  }
  return parts;
}

function classifyError(err: unknown, providerName: string): AIProviderError {
  const message = err instanceof Error ? err.message : 'Gemini request failed.';
  const retryable = /429|quota|rate.?limit|5\d\d|timeout|ECONNRESET|ETIMEDOUT|fetch failed/i.test(message);
  return new AIProviderError(message, providerName, retryable);
}

export function createGeminiProvider(apiKey: string, model = 'gemini-2.5-flash'): AIProvider {
  const client = new GoogleGenAI({ apiKey });

  return {
    name: 'gemini',
    async generateJSON<T>(input: AIGenerateJSONInput): Promise<T> {
      try {
        const response = await client.models.generateContent({
          model,
          contents: [{ role: 'user', parts: toParts(input.prompt, input.document) }],
          config: {
            responseMimeType: 'application/json',
            responseSchema: toGeminiSchema(input.schema),
          },
        });

        const text = response.text?.trim();
        if (!text) throw new Error('Gemini returned no text content.');
        return JSON.parse(text) as T;
      } catch (err) {
        throw classifyError(err, 'gemini');
      }
    },
    async generateText(input: AIGenerateTextInput): Promise<string> {
      try {
        const response = await client.models.generateContent({
          model,
          contents: [{ role: 'user', parts: toParts(input.prompt, input.document) }],
        });

        const text = response.text?.trim();
        if (!text) throw new Error('Gemini returned no text content.');
        return text;
      } catch (err) {
        throw classifyError(err, 'gemini');
      }
    },
  };
}
