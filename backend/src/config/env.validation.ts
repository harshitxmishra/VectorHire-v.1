import { z } from 'zod';

/**
 * Zod schema for validating VectorHire backend environment variables.
 * Enforces fail-fast startup on genuinely required configuration while
 * treating feature-specific provider keys as optional with sensible fallbacks.
 */
export const envSchema = z
  .object({
    // Node Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().min(1).max(65535).optional(),
    BACKEND_PORT: z.coerce.number().min(1).max(65535).optional(),

    // Supabase (Required for DB & Auth)
    NEXT_PUBLIC_SUPABASE_URL: z
      .string({ message: 'NEXT_PUBLIC_SUPABASE_URL is required' })
      .min(1, 'NEXT_PUBLIC_SUPABASE_URL is required')
      .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
    SUPABASE_SERVICE_ROLE_KEY: z
      .string({ message: 'SUPABASE_SERVICE_ROLE_KEY is required' })
      .min(1, 'SUPABASE_SERVICE_ROLE_KEY cannot be empty'),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),


    // Redis / BullMQ (Required: either REDIS_URL or REDIS_HOST/REDIS_PORT)
    REDIS_URL: z
      .string()
      .refine(
        (val) => val.startsWith('redis://') || val.startsWith('rediss://'),
        'REDIS_URL must start with redis:// (plain) or rediss:// (TLS)'
      )
      .optional(),
    REDIS_HOST: z.string().default('127.0.0.1'),
    REDIS_PORT: z.coerce.number().min(1).max(65535).default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_TLS: z.enum(['true', 'false']).optional(),

    // CORS & Frontend
    CORS_ORIGINS: z.string().optional(),
    FRONTEND_URL: z.string().url().optional(),

    // Optional Integrations (Features degrade gracefully if absent)
    GITHUB_TOKEN: z.string().optional(),
    GMAIL_USER: z.string().optional(),
    GMAIL_APP_PASSWORD: z.string().optional(),
    DEMO_EMAIL_OVERRIDE: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REDIRECT_URI: z.string().optional(),
    GOOGLE_REFRESH_TOKEN: z.string().optional(),

    // AI Providers (Optional — Fallback chain used)
    AI_PROVIDER: z.enum(['gemini', 'grok', 'groq', 'openrouter', 'openai']).default('gemini'),
    GEMINI_API_KEY: z.string().optional(),
    GROK_API_KEY: z.string().optional(),
    GROK_MODEL: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    GROQ_MODEL: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_MODEL: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().optional(),
  })
  .passthrough();

export type EnvironmentVariables = z.infer<typeof envSchema>;

/**
 * Validates environment configuration object.
 * Fails fast on invalid or missing required variables.
 * Formats errors with variable names and failure reasons without leaking secret values.
 */
export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error?.issues ?? [];
    const errorDetails = issues
      .map((err) => {
        const path = err.path.join('.');
        return `  - ${path}: ${err.message}`;
      })
      .join('\n');

    throw new Error(
      `[ConfigError] Environment configuration validation failed:\n${errorDetails}\nCheck your .env or .env.local file.`
    );
  }

  return result.data;
}
