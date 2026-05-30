/**
 * Busca SUPABASE_SERVICE_ROLE_KEY via Management API (mesmo token do MCP Supabase).
 * Token: https://supabase.com/dashboard/account/tokens
 */
import { config } from 'dotenv'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

config({ path: resolve(process.cwd(), '.env') })

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? 'fsyiqpueswytvxgrlibq'
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const ENV_PATH = resolve(process.cwd(), '.env')

type ApiKey = {
  name?: string
  type?: string
  api_key?: string
  disabled?: boolean
}

function roleFromJwt(apiKey: string): string | null {
  try {
    const segment = apiKey.split('.')[1]
    if (!segment) return null
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(Buffer.from(normalized, 'base64').toString('utf8')) as {
      role?: string
    }
    return json.role ?? null
  } catch {
    return null
  }
}

function pickServiceRoleKey(keys: ApiKey[]): string | null {
  const enabled = keys.filter((k) => k.api_key && k.disabled !== true)

  for (const key of enabled) {
    if (key.api_key && roleFromJwt(key.api_key) === 'service_role') {
      return key.api_key
    }
  }

  const byName = enabled.find((k) => k.name === 'service_role')
  if (byName?.api_key) return byName.api_key

  const secret = enabled.find((k) => k.type === 'secret')
  if (secret?.api_key) return secret.api_key

  return null
}

function upsertEnvLine(content: string, key: string, value: string): string {
  const line = `${key}=${value}`
  const pattern = new RegExp(`^${key}=.*$`, 'm')
  if (pattern.test(content)) {
    return content.replace(pattern, line)
  }
  return `${content.trimEnd()}\n${line}\n`
}

async function main() {
  if (!ACCESS_TOKEN) {
    console.error(
      'Defina SUPABASE_ACCESS_TOKEN no backend/.env (mesmo token usado no MCP do Cursor).',
    )
    process.exit(1)
  }

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys?reveal=true`,
    {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    },
  )

  if (!response.ok) {
    const body = await response.text()
    console.error(`Management API erro ${response.status}:`, body)
    process.exit(1)
  }

  const payload = (await response.json()) as ApiKey[] | { data?: ApiKey[] }
  const keys = Array.isArray(payload) ? payload : (payload.data ?? [])
  const serviceRoleKey = pickServiceRoleKey(keys)

  if (!serviceRoleKey) {
    console.error(
      'service_role não encontrada. Copie manualmente em Project Settings → API → service_role e cole em SUPABASE_SERVICE_ROLE_KEY.',
    )
    process.exit(1)
  }

  const supabaseUrl = `https://${PROJECT_REF}.supabase.co`
  let envContent = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : ''

  envContent = upsertEnvLine(envContent, 'SUPABASE_URL', supabaseUrl)
  envContent = upsertEnvLine(envContent, 'SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey)
  envContent = upsertEnvLine(envContent, 'SUPABASE_PROJECT_REF', PROJECT_REF)

  writeFileSync(ENV_PATH, envContent, 'utf8')
  console.log('[setup] backend/.env atualizado com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
}

main().catch((error) => {
  console.error('[setup] Falha', error)
  process.exit(1)
})
