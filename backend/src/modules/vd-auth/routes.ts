import type { FastifyInstance } from 'fastify'
import {
  auditAuthLoginFailure,
  auditAuthLoginSuccess,
  auditAuthLogout,
  auditAuthRefresh,
} from '../../lib/auditoria/auth-events.js'
import {
  vdAuthRefreshClearCookieOptions,
  vdAuthRefreshCookieOptions,
} from '../../lib/vdAuthRefreshCookie.js'
import { resolveTenantHostHeader } from '../../lib/tenant/loginHost.js'
import {
  VD_REFRESH_COOKIE,
} from '../../lib/vdAuthSession.js'
import { resolveRequestHost, resolveVdCadastroEntidadeScopeDetailed } from '../vd-cadastro/scope.js'
import { mapVdAuthError, requireVdAuth } from './middleware.js'
import {
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  vdPasswordRecoveryCompleteSchema,
  vdPasswordRecoveryRequestSchema,
  vdPasswordRecoveryVerifySchema,
} from './schemas.js'
import {
  completeVdPasswordRecovery,
  mapVdPasswordRecoveryError,
  requestVdPasswordRecovery,
  verifyVdPasswordRecoveryCode,
} from './password-recovery.service.js'
import {
  getVdPacienteUserByCredencialId,
  loginVdPaciente,
  logoutVdPaciente,
  refreshVdPacienteSession,
} from './service.js'

export async function registerVdAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    handler: async (request, reply) => {
      const parsed = loginBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const tenantHost = resolveTenantHostHeader(request.headers, parsed.data.tenantHost)
        const result = await loginVdPaciente({
          cpf: parsed.data.cpf,
          password: parsed.data.password,
          tenantHost,
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
        })

        reply.setCookie(
          VD_REFRESH_COOKIE,
          result.refreshToken,
          vdAuthRefreshCookieOptions(),
        )

        auditAuthLoginSuccess('vd', request, {
          atorId: result.user.credencialId,
          atorNome: result.user.name,
          cpf: result.user.cpf,
          role: 'paciente_app',
          entidadeContratanteId: result.user.entidadeContratanteId,
        })

        return reply.send({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        })
      } catch (error) {
        auditAuthLoginFailure('vd', request, { cpf: parsed.data.cpf })
        const mapped = mapVdAuthError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  })

  app.post('/refresh', {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    handler: async (request, reply) => {
      const parsed = refreshBodySchema.safeParse(request.body ?? {})
      const refreshToken =
        parsed.success && parsed.data.refreshToken?.trim()
          ? parsed.data.refreshToken.trim()
          : request.cookies[VD_REFRESH_COOKIE]

      if (!refreshToken) {
        return reply.status(401).send({ error: 'Sessão expirada.', code: 'INVALID_REFRESH' })
      }

      try {
        const tenantHost = resolveTenantHostHeader(
          request.headers,
          parsed.success ? parsed.data.tenantHost : undefined,
        )
        const result = await refreshVdPacienteSession({
          refreshToken,
          tenantHost,
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
        })

        reply.setCookie(
          VD_REFRESH_COOKIE,
          result.refreshToken,
          vdAuthRefreshCookieOptions(),
        )

        auditAuthRefresh('vd', request, {
          atorId: result.user.credencialId,
          atorNome: result.user.name,
          cpf: result.user.cpf,
          role: 'paciente_app',
        })

        return reply.send({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        })
      } catch (error) {
        reply.clearCookie(VD_REFRESH_COOKIE, vdAuthRefreshClearCookieOptions())
        const mapped = mapVdAuthError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  })

  app.post('/logout', async (request, reply) => {
    const user = request.vdUser
    const parsed = logoutBodySchema.safeParse(request.body ?? {})
    const refreshToken =
      parsed.success && parsed.data.refreshToken?.trim()
        ? parsed.data.refreshToken.trim()
        : request.cookies[VD_REFRESH_COOKIE]

    try {
      await logoutVdPaciente(refreshToken)
      auditAuthLogout('vd', request, {
        atorId: user?.credencialId ?? null,
        atorNome: user?.nome,
        cpf: user?.cpf,
      })
    } catch {
      // logout idempotente
    }

    reply.clearCookie(VD_REFRESH_COOKIE, vdAuthRefreshClearCookieOptions())
    return reply.send({ ok: true })
  })

  app.get('/me', { preHandler: requireVdAuth }, async (request, reply) => {
    const user = request.vdUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    try {
      const profile = await getVdPacienteUserByCredencialId(user.credencialId)
      return reply.send({ user: profile })
    } catch (error) {
      const mapped = mapVdAuthError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/recuperacao-senha/solicitar', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    handler: async (request, reply) => {
      const parsed = vdPasswordRecoveryRequestSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Informe um CPF válido.', code: 'INVALID_CPF' })
      }

      const tenantHost = resolveTenantHostHeader(request.headers, parsed.data.tenantHost)
      const hostHeader = resolveRequestHost(request.headers, tenantHost)
      const scopeResult = await resolveVdCadastroEntidadeScopeDetailed({
        hostHeader,
        slug: parsed.data.slug,
      })

      if (!scopeResult.ok) {
        return reply.status(scopeResult.error.statusCode).send({
          error: scopeResult.error.message,
          code: scopeResult.error.code,
        })
      }

      try {
        const result = await requestVdPasswordRecovery(parsed.data.cpf, scopeResult.scope)
        return reply.send(result)
      } catch (error) {
        const mapped = mapVdPasswordRecoveryError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  })

  app.post('/recuperacao-senha/verificar-codigo', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    handler: async (request, reply) => {
      const parsed = vdPasswordRecoveryVerifySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const result = await verifyVdPasswordRecoveryCode(parsed.data)
        return reply.send(result)
      } catch (error) {
        const mapped = mapVdPasswordRecoveryError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  })

  app.post('/recuperacao-senha/concluir', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    handler: async (request, reply) => {
      const parsed = vdPasswordRecoveryCompleteSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        await completeVdPasswordRecovery(parsed.data)
        return reply.send({ ok: true })
      } catch (error) {
        const mapped = mapVdPasswordRecoveryError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  })
}
