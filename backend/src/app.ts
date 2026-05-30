import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { env, isProduction } from './config/env.js'
import { registerAdminAuthRoutes } from './modules/admin-auth/routes.js'
import {
  registerAdminConfiguracoesRoutes,
  registerPublicConfiguracoesRoutes,
} from './modules/admin-configuracoes/routes.js'
import { registerAdminCredenciaisRoutes } from './modules/admin-credenciais/routes.js'

export async function buildApp() {
  const app = Fastify({
    logger: !isProduction,
    trustProxy: true,
  })

  // refresh/logout usam cookie sem body JSON
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    if (body === '' || body == null) {
      done(null, {})
      return
    }
    try {
      done(null, JSON.parse(body) as Record<string, unknown>)
    } catch (error) {
      done(error as Error, undefined)
    }
  })

  await app.register(helmet, {
    contentSecurityPolicy: false,
  })

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((value) => value.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(cookie, {
    secret: env.JWT_REFRESH_SECRET,
    hook: 'onRequest',
  })

  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
  })

  app.get('/health', async () => ({ ok: true }))

  await app.register(
    async (adminAuth) => {
      await registerAdminAuthRoutes(adminAuth)
    },
    { prefix: '/api/v1/admin/auth' },
  )

  await app.register(
    async (adminCredenciais) => {
      await registerAdminCredenciaisRoutes(adminCredenciais)
    },
    { prefix: '/api/v1/admin/credenciais' },
  )

  await app.register(
    async (publicConfiguracoes) => {
      await registerPublicConfiguracoesRoutes(publicConfiguracoes)
    },
    { prefix: '/api/v1/configuracoes' },
  )

  await app.register(
    async (adminConfiguracoes) => {
      await registerAdminConfiguracoesRoutes(adminConfiguracoes)
    },
    { prefix: '/api/v1/admin/configuracoes' },
  )

  return app
}
