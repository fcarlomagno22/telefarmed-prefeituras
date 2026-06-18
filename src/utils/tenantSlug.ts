/** Espelha validação do backend (`backend/src/lib/tenant/slug.ts`). */

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
  if (slug.length < 3) return 'O endereço deve ter ao menos 3 caracteres.'
  if (slug.length > 50) return 'O endereço deve ter no máximo 50 caracteres.'
  if (!SLUG_PATTERN.test(slug)) {
    return 'Use apenas letras minúsculas, números e hífens (sem hífen no início ou fim).'
  }
  if (RESERVED_TENANT_SLUGS.has(slug)) return 'Este endereço está reservado pela plataforma.'
  return null
}

export function sanitizeTenantSlugInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 50)
}

export function suggestTenantSlugFromText(text: string): string {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 50)

  if (!normalized || validateTenantSlug(normalized)) return ''
  return normalized
}

const MAX_TENANT_SLUG_LENGTH = 50

function normalizeEntitySlugPrefix(entitySlug: string): string {
  return normalizeTenantSlugInput(entitySlug).replace(/-+$/g, '')
}

/** Parte da unidade após o slug da entidade (ex.: `centro` em `fernandopolis-centro`). */
export function extractUbtSlugUnitSuffix(entitySlug: string, fullSlug: string): string {
  const entity = normalizeEntitySlugPrefix(entitySlug)
  const normalized = normalizeTenantSlugInput(fullSlug)
  if (!entity) return normalized
  const prefix = `${entity}-`
  if (normalized.startsWith(prefix)) return normalized.slice(prefix.length)
  return normalized
}

/** Monta `{entidade}-{unidade}` respeitando o limite de 50 caracteres. */
export function buildCompositeUbtSlug(entitySlug: string, unitSuffix: string): string {
  const entity = normalizeEntitySlugPrefix(entitySlug)
  const suffix = sanitizeTenantSlugInput(unitSuffix).replace(/^-+|-+$/g, '')
  if (!suffix) return entity && validateTenantSlug(entity) === null ? entity : ''
  if (!entity) return suffix.slice(0, MAX_TENANT_SLUG_LENGTH).replace(/-+$/g, '')

  const maxSuffixLen = Math.max(1, MAX_TENANT_SLUG_LENGTH - entity.length - 1)
  const trimmedSuffix = suffix.slice(0, maxSuffixLen).replace(/-+$/g, '')
  if (!trimmedSuffix) return ''

  const composite = `${entity}-${trimmedSuffix}`.replace(/-{2,}/g, '-').slice(0, MAX_TENANT_SLUG_LENGTH)
  return composite.replace(/-+$/g, '')
}

export function suggestCompositeUbtSlugFromUnitName(entitySlug: string, unitName: string): string {
  const unitPart = suggestTenantSlugFromText(unitName)
  if (!unitPart) return ''
  return buildCompositeUbtSlug(entitySlug, unitPart)
}

export function validateCompositeUbtSlug(fullSlug: string, entitySlug?: string | null): string | null {
  const normalized = normalizeTenantSlugInput(fullSlug)
  const formatError = validateTenantSlug(normalized)
  if (formatError) return formatError

  const entity = entitySlug?.trim() ? normalizeEntitySlugPrefix(entitySlug) : ''
  if (!entity) return null

  const prefix = `${entity}-`
  if (!normalized.startsWith(prefix) || normalized.length <= prefix.length) {
    return `Use o prefixo ${prefix} seguido do identificador da unidade (ex.: ${prefix}centro).`
  }

  return null
}

export type TenantSlugAvailabilityStatus = 'idle' | 'checking' | 'available' | 'unavailable'

export type TenantSlugAvailabilityState = {
  status: TenantSlugAvailabilityStatus
  reason: string | null
  checkedValue: string
}

export function createIdleSlugAvailability(): TenantSlugAvailabilityState {
  return { status: 'idle', reason: null, checkedValue: '' }
}

export function isSlugAvailabilityConfirmed(
  slug: string,
  availability: TenantSlugAvailabilityState,
): boolean {
  const normalized = normalizeTenantSlugInput(slug)
  return (
    availability.status === 'available' &&
    availability.checkedValue === normalized &&
    validateTenantSlug(normalized) === null
  )
}
