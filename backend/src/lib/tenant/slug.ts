/** Slugs reservados — não podem ser usados por entidade nem UBT. */
export const RESERVED_TENANT_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'www',
  'mail',
  'smtp',
  'ftp',
  'cdn',
  'static',
  'assets',
  'gestao',
  'prefeitura',
  'ubt',
  'profissional',
  'medico',
  'seguranca',
  'login',
  'auth',
  'oauth',
  'webhook',
  'hooks',
  'internal',
  'cron',
  'status',
  'health',
  'docs',
  'blog',
  'suporte',
  'help',
  'telefarmed',
  'platform',
  'staging',
  'dev',
  'test',
  'demo',
  'sandbox',
])

const SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])?$/

export function normalizeTenantSlugInput(value: string): string {
  return value.trim().toLowerCase()
}

export function validateTenantSlug(value: string): string | null {
  const slug = normalizeTenantSlugInput(value)
  if (slug.length < 3) return 'O slug deve ter ao menos 3 caracteres.'
  if (slug.length > 50) return 'O slug deve ter no máximo 50 caracteres.'
  if (!SLUG_PATTERN.test(slug)) {
    return 'Use apenas letras minúsculas, números e hífens (sem hífen no início ou fim).'
  }
  if (RESERVED_TENANT_SLUGS.has(slug)) return 'Este endereço está reservado pela plataforma.'
  return null
}
