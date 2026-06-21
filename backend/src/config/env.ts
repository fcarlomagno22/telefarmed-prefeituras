import { config } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
config({ path: resolve(backendRoot, '.env') })
config({ path: resolve(backendRoot, '../.env') })

function envValue(key: string): string | undefined {
  const raw = process.env[key]
  if (raw == null) return undefined
  return raw.replace(/^["']|["']$/g, '').trim()
}

/** Aceita alias legado de env vars (ex.: migração DOC24_* → RH3_*). */
function envValueFirst(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = envValue(key)
    if (value) return value
  }
  return undefined
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  SUPABASE_URL: z.string().url('SUPABASE_URL é obrigatório'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY é obrigatório (rode npm run setup:supabase-env)'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET deve ter ao menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter ao menos 32 caracteres'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  LIVEKIT_URL: z
    .string()
    .url('LIVEKIT_URL deve ser uma URL válida (ex.: wss://seu-projeto.livekit.cloud)'),
  LIVEKIT_API_KEY: z.string().min(1, 'LIVEKIT_API_KEY é obrigatório'),
  LIVEKIT_API_SECRET: z.string().min(1, 'LIVEKIT_API_SECRET é obrigatório'),
  SMTP_HOST: z.string().min(1, 'SMTP_HOST é obrigatório'),
  SMTP_PORT: z.coerce.number().int().positive('SMTP_PORT deve ser um número positivo'),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  SMTP_USER: z.string().min(1, 'SMTP_USER é obrigatório'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS é obrigatório'),
  SMTP_FROM: z.string().optional(),
  /** Segredo para rotas `/internal/cron/*` (Vercel Cron envia Bearer token). */
  CRON_SECRET: z.string().min(16).optional(),
  /** Domínio raiz dos tenants (ex.: telefarmed.com.br). */
  PUBLIC_ROOT_DOMAIN: z.string().min(3).default('telefarmed.com.br'),
  /** Aceita origens https://{slug}.PUBLIC_ROOT_DOMAIN e http://{slug}.localhost (dev). */
  CORS_ALLOW_TENANT_ORIGINS: z
    .string()
    .optional()
    .transform((v) => v !== 'false' && v !== '0'),
  /** Credenciais OAuth da API ICD da OMS (https://icd.who.int/icdapi). */
  WHO_ICD_CLIENT_ID: z.string().trim().min(1).optional(),
  WHO_ICD_CLIENT_SECRET: z.string().trim().min(1).optional(),
  /** Integração RH3 (teleconsulta terceirizada). */
  RH3_API_BASE_URL: z.string().url().optional(),
  RH3_CLIENT_ID: z.string().trim().min(1).optional(),
  RH3_CLIENT_SECRET: z.string().trim().min(1).optional(),
  /** Segredo opcional para validar POST /api/webhooks/consultas-status. */
  RH3_WEBHOOK_SECRET: z.string().trim().min(8).optional(),
})

export type Env = z.infer<typeof envSchema> & {
  SMTP_FROM: string
}

const parsedEnv = envSchema.parse({
  NODE_ENV: envValue('NODE_ENV'),
  PORT: envValue('PORT'),
  SUPABASE_URL: envValue('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: envValue('SUPABASE_SERVICE_ROLE_KEY'),
  JWT_ACCESS_SECRET: envValue('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: envValue('JWT_REFRESH_SECRET'),
  CORS_ORIGIN: envValue('CORS_ORIGIN'),
  COOKIE_SECURE: envValue('COOKIE_SECURE'),
  LIVEKIT_URL: envValue('LIVEKIT_URL'),
  LIVEKIT_API_KEY: envValue('LIVEKIT_API_KEY'),
  LIVEKIT_API_SECRET: envValue('LIVEKIT_API_SECRET'),
  SMTP_HOST: envValue('SMTP_HOST'),
  SMTP_PORT: envValue('SMTP_PORT'),
  SMTP_SECURE: envValue('SMTP_SECURE'),
  SMTP_USER: envValue('SMTP_USER'),
  SMTP_PASS: envValue('SMTP_PASS'),
  SMTP_FROM: envValue('SMTP_FROM'),
  CRON_SECRET: envValue('CRON_SECRET'),
  PUBLIC_ROOT_DOMAIN: envValue('PUBLIC_ROOT_DOMAIN'),
  CORS_ALLOW_TENANT_ORIGINS: envValue('CORS_ALLOW_TENANT_ORIGINS'),
  WHO_ICD_CLIENT_ID: envValue('WHO_ICD_CLIENT_ID'),
  WHO_ICD_CLIENT_SECRET: envValue('WHO_ICD_CLIENT_SECRET'),
  RH3_API_BASE_URL: envValueFirst('RH3_API_BASE_URL', 'DOC24_API_BASE_URL'),
  RH3_CLIENT_ID: envValueFirst('RH3_CLIENT_ID', 'DOC24_CLIENT_ID'),
  RH3_CLIENT_SECRET: envValueFirst('RH3_CLIENT_SECRET', 'DOC24_CLIENT_SECRET'),
  RH3_WEBHOOK_SECRET: envValueFirst('RH3_WEBHOOK_SECRET', 'DOC24_WEBHOOK_SECRET'),
})

export const env: Env = {
  ...parsedEnv,
  SMTP_FROM: parsedEnv.SMTP_FROM ?? `Telefarmed <${parsedEnv.SMTP_USER}>`,
}

export const isProduction = env.NODE_ENV === 'production'
