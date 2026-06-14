import type { FastifyInstance } from 'fastify'
import { authRefreshCookieOptions } from '../../lib/sessionCookie.js'
import {
  getUbtUserById,
  loginUbt,
  logoutUbt,
  refreshUbtSession,
  verifyUbtAuthorizationPin,
} from './service.js'
import { loginBodySchema, verifyUbtPinBodySchema } from './schemas.js'
import { mapUbtAuthError, requireUbtAuth } from './middleware.js'
import {
  auditAuthLoginFailure,
  auditAuthLoginSuccess,
  auditAuthLogout,
  auditAuthRefresh,
} from '../../lib/auditoria/auth-events.js'
import {
  isUbtLgpdUnlockActive,
  mapUbtLgpdError,
  revokeUbtLgpdUnlock,
  unlockUbtLgpdSession,
} from './lgpd.service.js'

const REFRESH_COOKIE = 'token_refresh_ubt'

export async function registerUbtAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    handler: async (request, reply) => {
      const parsed = loginBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const result = await loginUbt({
          cpf: parsed.data.cpf,
          password: parsed.data.password,
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
        })

        reply.setCookie(
          REFRESH_COOKIE,
          result.refreshToken,
          authRefreshCookieOptions('/api/v1/ubt/auth'),
        )

        auditAuthLoginSuccess('ubt', request, {
          atorId: result.user.id,
          atorNome: result.user.nome,
          cpf: result.user.cpf,
          role: result.user.accessLevel,
          entidadeContratanteId: result.user.entidadeContratanteId,
          unidadeUbtId: result.user.unidadeUbtId,
        })

        return reply.send({
          accessToken: result.accessToken,
          user: result.user,
        })
      } catch (error) {
        auditAuthLoginFailure('ubt', request, { cpf: parsed.data.cpf })
        const mapped = mapUbtAuthError(error)
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
        const result = await refreshUbtSession({
          refreshToken,
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
        })

        reply.setCookie(
          REFRESH_COOKIE,
          result.refreshToken,
          authRefreshCookieOptions('/api/v1/ubt/auth'),
        )

        auditAuthRefresh('ubt', request, {
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
        reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/ubt/auth' })
        const mapped = mapUbtAuthError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  })

  app.post('/logout', async (request, reply) => {
    try {
      await logoutUbt(request.cookies[REFRESH_COOKIE])
      auditAuthLogout('ubt', request, {})
    } catch {
      // logout idempotente
    }

    reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/ubt/auth' })
    return reply.send({ ok: true })
  })

  app.post('/verificar-pin', { preHandler: requireUbtAuth }, async (request, reply) => {
    const user = request.ubtUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    const parsed = verifyUbtPinBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'PIN inválido.' })
    }

    try {
      await verifyUbtAuthorizationPin(user.id, parsed.data.pin)
      return reply.send({ ok: true })
    } catch (error) {
      const mapped = mapUbtAuthError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/lgpd/desbloquear', { preHandler: requireUbtAuth }, async (request, reply) => {
    const user = request.ubtUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    const parsed = verifyUbtPinBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'PIN inválido.' })
    }

    try {
      const result = await unlockUbtLgpdSession(user.id, parsed.data.pin)
      return reply.send(result)
    } catch (error) {
      const mapped = mapUbtLgpdError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/lgpd/status', { preHandler: requireUbtAuth }, async (request, reply) => {
    const user = request.ubtUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    const lgpdUnlockToken = String(request.headers['x-ubt-lgpd-token'] ?? '').trim()
    if (!lgpdUnlockToken) {
      return reply.send({ active: false })
    }

    try {
      const active = await isUbtLgpdUnlockActive(user.id, lgpdUnlockToken)
      return reply.send({ active })
    } catch (error) {
      const mapped = mapUbtLgpdError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/lgpd/revogar', { preHandler: requireUbtAuth }, async (request, reply) => {
    const user = request.ubtUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    const lgpdUnlockToken = String(request.headers['x-ubt-lgpd-token'] ?? '').trim()

    try {
      if (lgpdUnlockToken) {
        await revokeUbtLgpdUnlock(user.id, lgpdUnlockToken)
      }
      return reply.send({ ok: true })
    } catch (error) {
      const mapped = mapUbtLgpdError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/me', { preHandler: requireUbtAuth }, async (request, reply) => {
    const user = request.ubtUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    try {
      const profile = await getUbtUserById(user.id)
      return reply.send({ user: profile })
    } catch (error) {
      const mapped = mapUbtAuthError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
