import {
  isAppCidadesDedicatedHost,
  isVdPlatformHost,
  normalizeVdTenantEntitySlugInput,
} from '../../lib/tenant/appCidadesHost.js'
import {
  resolveVdTenantByEntitySlug,
  resolveVdTenantByHost,
} from '../../lib/tenant/resolveTenantByHost.js'
import { resolveVdPlatformEntitySlug } from '../../lib/tenant/vdPlatformEntity.js'
import type { VdCadastroEntidadeScope } from './types.js'

export type VdCadastroScopeError = {
  statusCode: number
  message: string
  code: string
}

export function resolveRequestHost(
  headers: { host?: string; 'x-forwarded-host'?: string | string[] },
  queryHost?: string,
): string | undefined {
  const forwardedHost = headers['x-forwarded-host']
  const fromForwarded =
    typeof forwardedHost === 'string' ? forwardedHost.split(',')[0]?.trim() : undefined

  return fromForwarded || queryHost || headers.host
}

function buildScopeFailure(input: {
  hostHeader?: string
  slug?: string
}): VdCadastroScopeError {
  if (input.hostHeader && isVdPlatformHost(input.hostHeader)) {
    return {
      statusCode: 503,
      code: 'VD_PLATFORM_NOT_CONFIGURED',
      message:
        'O app Telefarmed ainda não está configurado no servidor. Cadastre a entidade plataforma (telefarmed-app) no admin ou aplique as migrations pendentes.',
    }
  }

  if (input.hostHeader && isAppCidadesDedicatedHost(input.hostHeader)) {
    return {
      statusCode: 404,
      code: 'VD_TENANT_NOT_FOUND',
      message: 'Este app não está disponível para o endereço informado. Verifique o link vd-{município}.',
    }
  }

  const slug = input.slug?.trim()
  if (slug) {
    const entitySlug = normalizeVdTenantEntitySlugInput(slug)
    if (entitySlug) {
      return {
        statusCode: 404,
        code: 'VD_ENTITY_NOT_FOUND',
        message: `Não encontramos um município com o slug "${entitySlug}". Verifique o endereço ou fale com a prefeitura.`,
      }
    }
  }

  return {
    statusCode: 400,
    code: 'VD_TENANT_REQUIRED',
    message:
      'Abra o app pelo endereço do seu município (vd-{slug}) ou use o app Telefarmed em vd.telefarmed.com.br.',
  }
}

export async function resolveVdCadastroEntidadeScope(input: {
  hostHeader?: string
  slug?: string
}): Promise<VdCadastroEntidadeScope | null> {
  const result = await resolveVdCadastroEntidadeScopeDetailed(input)
  return result.ok ? result.scope : null
}

export async function resolveVdCadastroEntidadeScopeDetailed(
  input: {
    hostHeader?: string
    slug?: string
  },
): Promise<
  | { ok: true; scope: VdCadastroEntidadeScope }
  | { ok: false; error: VdCadastroScopeError }
> {
  if (input.hostHeader && isAppCidadesDedicatedHost(input.hostHeader)) {
    const tenant = await resolveVdTenantByHost(input.hostHeader)
    if (tenant?.entidadeId) {
      return {
        ok: true,
        scope: {
          entidadeId: tenant.entidadeId,
          entidadeSlug: tenant.slug,
        },
      }
    }

    return { ok: false, error: buildScopeFailure(input) }
  }

  const entitySlug = input.slug?.trim()
    ? normalizeVdTenantEntitySlugInput(input.slug)
    : null

  if (entitySlug) {
    const tenant = await resolveVdTenantByEntitySlug(entitySlug)
    if (tenant?.entidadeId) {
      return {
        ok: true,
        scope: {
          entidadeId: tenant.entidadeId,
          entidadeSlug: tenant.slug,
        },
      }
    }

    return { ok: false, error: buildScopeFailure(input) }
  }

  if (input.hostHeader || input.slug?.trim()) {
    return { ok: false, error: buildScopeFailure(input) }
  }

  return {
    ok: false,
    error: buildScopeFailure(input),
  }
}

/** Slug canônico quando o host é vd / vd.localhost (sem vd-{cliente}). */
export function resolveVdPlatformEntitySlugForHost(): string {
  return resolveVdPlatformEntitySlug()
}
