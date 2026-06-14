import { config } from 'dotenv'
import { resolve } from 'node:path'
import { z } from 'zod'

config({ path: resolve(process.cwd(), '.env') })

function envValue(key: string): string | undefined {
  const raw = process.env[key]
  if (raw == null) return undefined
  return raw.replace(/^["']|["']$/g, '').trim()
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
})

export const env: Env = {
  ...parsedEnv,
  SMTP_FROM: parsedEnv.SMTP_FROM ?? `Telefarmed <${parsedEnv.SMTP_USER}>`,
}

export const isProduction = env.NODE_ENV === 'production'
