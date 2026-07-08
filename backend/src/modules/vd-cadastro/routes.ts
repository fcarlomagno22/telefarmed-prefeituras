import type { FastifyInstance } from 'fastify'
import { auditVdCadastroRegistration } from '../../lib/auditoria/vd-cadastro-events.js'
import {
  vdAuthRefreshCookieOptions,
} from '../../lib/vdAuthRefreshCookie.js'
import { VD_REFRESH_COOKIE } from '../../lib/vdAuthSession.js'
import { setPublicCatalogCacheHeaders } from '../../lib/cache/httpCacheHeaders.js'
import { mapPacientesError } from '../admin-pacientes/errors.js'
import { checkVdCadastroElegibilidadeCep } from './elegibilidade-cep.service.js'
import { mapVdCadastroError, VdCadastroError } from './errors.js'
import { lookupVdCadastroCpf } from './lookup.service.js'
import { registerVdCadastroPaciente } from './registration.service.js'
import {
  appPacienteRegistrationSchema,
  formatAppPacienteRegistrationValidationError,
} from './registration.schema.js'
import {
  elegibilidadeCepQuerySchema,
  lookupCpfQuerySchema,
  registrarBodySchema,
} from './schemas.js'
import { resolveRequestHost, resolveVdCadastroEntidadeScopeDetailed } from './scope.js'

const PUBLIC_VD_CADASTRO_RATE_LIMIT_MAX = 30

export async function registerVdCadastroRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/elegibilidade-cep',
    {
      config: {
        rateLimit: {
          max: PUBLIC_VD_CADASTRO_RATE_LIMIT_MAX,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const parsed = elegibilidadeCepQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? 'Parâmetros inválidos.'
        return reply.status(400).send({ message })
      }

      const hostHeader = resolveRequestHost(request.headers, parsed.data.host)
      const scopeResult = await resolveVdCadastroEntidadeScopeDetailed({
        hostHeader,
        slug: parsed.data.slug,
      })

      if (!scopeResult.ok) {
        return reply.status(scopeResult.error.statusCode).send({
          message: scopeResult.error.message,
          code: scopeResult.error.code,
        })
      }

      const scope = scopeResult.scope

      try {
        const result = await checkVdCadastroElegibilidadeCep(scope, {
          cep: parsed.data.cep,
          cidade: parsed.data.cidade,
          uf: parsed.data.uf,
        })

        setPublicCatalogCacheHeaders(reply)
        return reply.send(result)
      } catch (error) {
        const mapped = mapPacientesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.get(
    '/lookup',
    {
      config: {
        rateLimit: {
          max: PUBLIC_VD_CADASTRO_RATE_LIMIT_MAX,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const parsed = lookupCpfQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? 'Parâmetros inválidos.'
        return reply.status(400).send({ message })
      }

      const hostHeader = resolveRequestHost(request.headers, parsed.data.host)
      const scopeResult = await resolveVdCadastroEntidadeScopeDetailed({
        hostHeader,
        slug: parsed.data.slug,
      })

      if (!scopeResult.ok) {
        return reply.status(scopeResult.error.statusCode).send({
          message: scopeResult.error.message,
          code: scopeResult.error.code,
        })
      }

      const scope = scopeResult.scope

      try {
        const result = await lookupVdCadastroCpf(scope, parsed.data.cpf)
        reply.header('Cache-Control', 'private, no-store')
        return reply.send(result)
      } catch (error) {
        const mapped = mapPacientesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post(
    '/registrar',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const parsed = registrarBodySchema.safeParse(request.body)
      if (!parsed.success) {
        const message = formatAppPacienteRegistrationValidationError(parsed.error)
        return reply.status(400).send({ message })
      }

      const hostHeader = resolveRequestHost(request.headers, parsed.data.host)
      const scopeResult = await resolveVdCadastroEntidadeScopeDetailed({
        hostHeader,
        slug: parsed.data.slug,
      })

      if (!scopeResult.ok) {
        return reply.status(scopeResult.error.statusCode).send({
          message: scopeResult.error.message,
          code: scopeResult.error.code,
        })
      }

      const scope = scopeResult.scope
      const registrationInput = appPacienteRegistrationSchema.parse(parsed.data)

      try {
        const result = await registerVdCadastroPaciente(scope, registrationInput, {
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
        })

        reply.setCookie(
          VD_REFRESH_COOKIE,
          result.refreshToken,
          vdAuthRefreshCookieOptions(),
        )

        auditVdCadastroRegistration(request, {
          pacienteId: result.user.id,
          credencialId: result.user.credencialId,
          cpf: result.user.cpf,
          patientName: result.user.name,
          entidadeContratanteId: scope.entidadeId,
          mode: result.mode,
        })

        return reply.status(201).send({
          accessToken: result.accessToken,
          user: result.user,
          mode: result.mode,
        })
      } catch (error) {
        if (error instanceof VdCadastroError) {
          const mapped = mapVdCadastroError(error)
          return reply.status(mapped.statusCode).send(mapped.body)
        }

        const mapped = mapPacientesError(error)
        return reply.status(mapped.statusCode).send({
          ...mapped.body,
          message: mapped.body.error,
        })
      }
    },
  )
}
