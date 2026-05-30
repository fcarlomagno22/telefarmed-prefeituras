import type { FastifyInstance } from 'fastify'
import { env, isProduction } from '../../config/env.js'
import {
  AuthError,
  getAdminById,
  loginAdmin,
  logoutAdmin,
  refreshAdminSession,
  verifyAdminAuthorizationPin,
} from './service.js'
import { loginBodySchema, verifyAdminPinBodySchema } from './schemas.js'
import { mapAuthError, requireAdminAuth } from './middleware.js'

const REFRESH_COOKIE = 'token_refresh_admin'

function refreshCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: isProduction || env.COOKIE_SECURE === true,
    sameSite: 'lax' as const,
    path: '/api/v1/admin/auth',
    expires: expiresAt,
  }
}

function refreshCookieMaxAge() {
  return 7 * 24 * 60 * 60
}

export async function registerAdminAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    handler: async (request, reply) => {
      const parsed = loginBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const result = await loginAdmin({
          cpf: parsed.data.cpf,
          password: parsed.data.password,
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
        })

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        reply.setCookie(REFRESH_COOKIE, result.refreshToken, {
          ...refreshCookieOptions(expiresAt),
          maxAge: refreshCookieMaxAge(),
        })

        return reply.send({
          accessToken: result.accessToken,
          user: result.user,
        })
      } catch (error) {
        const mapped = mapAuthError(error)
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
        const result = await refreshAdminSession({
          refreshToken,
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
        })

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        reply.setCookie(REFRESH_COOKIE, result.refreshToken, {
          ...refreshCookieOptions(expiresAt),
          maxAge: refreshCookieMaxAge(),
        })

        return reply.send({
          accessToken: result.accessToken,
          user: result.user,
        })
      } catch (error) {
        reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/admin/auth' })
        const mapped = mapAuthError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  })

  app.post('/logout', async (request, reply) => {
    try {
      await logoutAdmin(request.cookies[REFRESH_COOKIE])
    } catch {
      // logout sempre idempotente para o cliente
    }

    reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/admin/auth' })
    return reply.send({ ok: true })
  })

  app.post('/verificar-pin', { preHandler: requireAdminAuth }, async (request, reply) => {
    const admin = request.admin
    if (!admin) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    const parsed = verifyAdminPinBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'PIN inválido.' })
    }

    try {
      await verifyAdminAuthorizationPin(admin.id, parsed.data.pin)
      return reply.send({ ok: true })
    } catch (error) {
      const mapped = mapAuthError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/me', { preHandler: requireAdminAuth }, async (request, reply) => {
    const admin = request.admin
    if (!admin) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    try {
      const user = await getAdminById(admin.id)
      return reply.send({ user })
    } catch (error) {
      if (error instanceof AuthError) {
        const mapped = mapAuthError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
      return reply.status(500).send({ error: 'Erro interno.' })
    }
  })
}
