import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { setTenantCacheHeaders } from '../../lib/cache/httpCacheHeaders.js'
import {
  isAppCidadesDedicatedHost,
  normalizeVdTenantEntitySlugInput,
} from '../../lib/tenant/appCidadesHost.js'
import {
  resolveVdTenantByEntitySlug,
  resolveVdTenantByHost,
} from '../../lib/tenant/resolveTenantByHost.js'
import { lookupTenantSlugRedirect } from '../../lib/tenant/slugRedirect.js'
import { env } from '../../config/env.js'
import { toPublicTenantPayload } from '../public-tenant/serializer.js'

const PUBLIC_VD_TENANT_RATE_LIMIT_MAX = 60

const vdTenantQuerySchema = z.object({
  host: z.string().trim().optional(),
  slug: z.string().trim().optional(),
})

function resolveRequestHost(
  headers: { host?: string; 'x-forwarded-host'?: string | string[] },
  queryHost?: string,
): string | undefined {
  const forwardedHost = headers['x-forwarded-host']
  const fromForwarded =
    typeof forwardedHost === 'string' ? forwardedHost.split(',')[0]?.trim() : undefined

  return fromForwarded || queryHost || headers.host
}

function vdTenantRootUrl(entitySlug: string): string {
  return `https://vd-${entitySlug}.${env.PUBLIC_ROOT_DOMAIN}/`
}

async function redirectIfLegacyVdEntitySlug(
  entitySlug: string,
  reply: { redirect: (url: string, statusCode?: number) => unknown },
): Promise<boolean> {
  const redirectSlug = await lookupTenantSlugRedirect(entitySlug)
  if (!redirectSlug) return false

  reply.redirect(vdTenantRootUrl(redirectSlug), 301)
  return true
}

export async function registerVdPublicTenantRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/tenant',
    {
      config: {
        rateLimit: {
          max: PUBLIC_VD_TENANT_RATE_LIMIT_MAX,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const parsed = vdTenantQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        return reply.status(400).send({ message: 'Parâmetros inválidos.' })
      }

      const hostHeader = resolveRequestHost(request.headers, parsed.data.host)
      let tenant = null

      if (hostHeader && isAppCidadesDedicatedHost(hostHeader)) {
        tenant = await resolveVdTenantByHost(hostHeader)
      } else if (parsed.data.slug) {
        const entitySlug = normalizeVdTenantEntitySlugInput(parsed.data.slug)
        if (!entitySlug) {
          return reply.status(400).send({
            message: 'Informe o slug da entidade ou um host vd-{slug}.',
          })
        }

        if (await redirectIfLegacyVdEntitySlug(entitySlug, reply)) {
          return
        }

        tenant = await resolveVdTenantByEntitySlug(entitySlug)
      } else if (hostHeader) {
        return reply.status(400).send({
          message: 'Use um host vd-{slug} ou informe o parâmetro slug com o slug da entidade.',
        })
      } else {
        return reply.status(400).send({
          message: 'Informe o header Host (vd-{slug}) ou o parâmetro slug.',
        })
      }

      if (!tenant) {
        return reply.status(404).send({ message: 'App cidadão não encontrado para este endereço.' })
      }

      setTenantCacheHeaders(reply)
      return reply.send(toPublicTenantPayload(tenant))
    },
  )
}
