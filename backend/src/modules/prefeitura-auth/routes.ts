import type { FastifyInstance } from 'fastify'
import { authRefreshCookieOptions } from '../../lib/sessionCookie.js'
import {
  getPrefeituraUserById,
  loginPrefeitura,
  logoutPrefeitura,
  refreshPrefeituraSession,
  verifyPrefeituraAuthorizationPin,
} from './service.js'
import { loginBodySchema, verifyPrefeituraPinBodySchema } from './schemas.js'
import { mapPrefeituraAuthError, requirePrefeituraAuth } from './middleware.js'
import {
  auditAuthLoginFailure,
  auditAuthLoginSuccess,
  auditAuthLogout,
  auditAuthRefresh,
} from '../../lib/auditoria/auth-events.js'

const REFRESH_COOKIE = 'token_refresh_prefeitura'

export async function registerPrefeituraAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    handler: async (request, reply) => {
      const parsed = loginBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const result = await loginPrefeitura({
          cpf: parsed.data.cpf,
          password: parsed.data.password,
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
        })

        reply.setCookie(
          REFRESH_COOKIE,
          result.refreshToken,
          authRefreshCookieOptions('/api/v1/prefeitura/auth'),
        )

        auditAuthLoginSuccess('prefeitura', request, {
          atorId: result.user.id,
          atorNome: result.user.nome,
          cpf: result.user.cpf,
          role: result.user.accessLevel,
          entidadeContratanteId: result.user.entidadeContratanteId,
        })

        return reply.send({
          accessToken: result.accessToken,
          user: result.user,
        })
      } catch (error) {
        auditAuthLoginFailure('prefeitura', request, { cpf: parsed.data.cpf })
        const mapped = mapPrefeituraAuthError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  })

  app.post('/refresh', {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    handler: async (request, reply) => {
      const refreshToken = request.cookies[REFRESH_COOKIE]
      if (!refreshToken) {
        return reply.status(401).send({ error: 'Sessão expirada.', code: 'INVALID_REFRESH' })
      }

      try {
        const result = await refreshPrefeituraSession({
          refreshToken,
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
        })

        reply.setCookie(
          REFRESH_COOKIE,
          result.refreshToken,
          authRefreshCookieOptions('/api/v1/prefeitura/auth'),
        )

        auditAuthRefresh('prefeitura', request, {
          atorId: result.user.id,
          atorNome: result.user.nome,
          cpf: result.user.cpf,
          role: result.user.accessLevel,
        })

        return reply.send({
          accessToken: result.accessToken,
          user: result.user,
        })
      } catch (error) {
        reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/prefeitura/auth' })
        const mapped = mapPrefeituraAuthError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  })

  app.post('/logout', async (request, reply) => {
    try {
      await logoutPrefeitura(request.cookies[REFRESH_COOKIE])
      auditAuthLogout('prefeitura', request, {})
    } catch {
      // logout idempotente
    }

    reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/prefeitura/auth' })
    return reply.send({ ok: true })
  })

  app.post('/verificar-pin', { preHandler: requirePrefeituraAuth }, async (request, reply) => {
    const user = request.prefeituraUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    const parsed = verifyPrefeituraPinBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'PIN inválido.' })
    }

    try {
      await verifyPrefeituraAuthorizationPin(user.id, parsed.data.pin)
      return reply.send({ ok: true })
    } catch (error) {
      const mapped = mapPrefeituraAuthError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/me', { preHandler: requirePrefeituraAuth }, async (request, reply) => {
    const user = request.prefeituraUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    try {
      const profile = await getPrefeituraUserById(user.id)
      return reply.send({ user: profile })
    } catch (error) {
      const mapped = mapPrefeituraAuthError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
