import type { FastifyInstance } from 'fastify'
import { authRefreshCookieOptions } from '../../lib/sessionCookie.js'
import {
  getProfissionalUserById,
  loginProfissional,
  logoutProfissional,
  refreshProfissionalSession,
} from './service.js'
import { loginBodySchema } from './schemas.js'
import { mapProfissionalAuthError, requireProfissionalAuth } from './middleware.js'
import {
  auditAuthLoginFailure,
  auditAuthLoginSuccess,
  auditAuthLogout,
  auditAuthRefresh,
} from '../../lib/auditoria/auth-events.js'

const REFRESH_COOKIE = 'token_refresh_profissional'

export async function registerProfissionalAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    handler: async (request, reply) => {
      const parsed = loginBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const result = await loginProfissional({
          cpf: parsed.data.cpf,
          password: parsed.data.password,
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
        })

        reply.setCookie(
          REFRESH_COOKIE,
          result.refreshToken,
          authRefreshCookieOptions('/api/v1/profissional/auth'),
        )

        auditAuthLoginSuccess('profissional', request, {
          atorId: result.user.id,
          atorNome: result.user.nome,
          cpf: result.user.cpf,
        })

        return reply.send({
          accessToken: result.accessToken,
          user: result.user,
        })
      } catch (error) {
        auditAuthLoginFailure('profissional', request, { cpf: parsed.data.cpf })
        const mapped = mapProfissionalAuthError(error)
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
        const result = await refreshProfissionalSession({
          refreshToken,
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
        })

        reply.setCookie(
          REFRESH_COOKIE,
          result.refreshToken,
          authRefreshCookieOptions('/api/v1/profissional/auth'),
        )

        auditAuthRefresh('profissional', request, {
          atorId: result.user.id,
          atorNome: result.user.nome,
          cpf: result.user.cpf,
        })

        return reply.send({
          accessToken: result.accessToken,
          user: result.user,
        })
      } catch (error) {
        reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/profissional/auth' })
        const mapped = mapProfissionalAuthError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  })

  app.post('/logout', async (request, reply) => {
    try {
      await logoutProfissional(request.cookies[REFRESH_COOKIE])
      auditAuthLogout('profissional', request, {})
    } catch {
      // logout idempotente
    }

    reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/profissional/auth' })
    return reply.send({ ok: true })
  })

  app.get('/me', { preHandler: requireProfissionalAuth }, async (request, reply) => {
    const user = request.profissionalUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    try {
      const profile = await getProfissionalUserById(user.id)
      return reply.send({ user: profile })
    } catch (error) {
      const mapped = mapProfissionalAuthError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/permissions', { preHandler: requireProfissionalAuth }, async (request, reply) => {
    const user = request.profissionalUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    return reply.send({ pagePermissions: user.pagePermissions })
  })
}
