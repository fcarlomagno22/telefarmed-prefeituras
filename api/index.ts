import type { IncomingMessage, ServerResponse } from 'node:http'
import { buildApp } from '../backend/dist/app.js'

type FastifyApp = Awaited<ReturnType<typeof buildApp>>

/** Instância única reutilizada entre invocações serverless (warm starts). */
let cachedApp: FastifyApp | null = null

async function getApp(): Promise<FastifyApp> {
  if (!cachedApp) {
    cachedApp = await buildApp()
    await cachedApp.ready()
  }
  return cachedApp
}

/**
 * Entrada serverless da Vercel — repassa req/res ao Fastify sem `app.listen()`.
 * Rotas da API permanecem em `/api/v1/...` (mesmo prefixo do dev local via proxy).
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await getApp()
  app.server.emit('request', req, res)
}
