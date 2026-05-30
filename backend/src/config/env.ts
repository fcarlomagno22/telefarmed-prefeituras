import { config } from 'dotenv'
import { resolve } from 'node:path'
import { z } from 'zod'

config({ path: resolve(process.cwd(), '../.env') })
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
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse({
  NODE_ENV: envValue('NODE_ENV'),
  PORT: envValue('PORT'),
  SUPABASE_URL: envValue('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: envValue('SUPABASE_SERVICE_ROLE_KEY'),
  JWT_ACCESS_SECRET: envValue('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: envValue('JWT_REFRESH_SECRET'),
  CORS_ORIGIN: envValue('CORS_ORIGIN'),
  COOKIE_SECURE: envValue('COOKIE_SECURE'),
})

export const isProduction = env.NODE_ENV === 'production'
