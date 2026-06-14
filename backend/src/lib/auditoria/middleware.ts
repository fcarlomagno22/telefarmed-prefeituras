import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import {
  extractClientIp,
  extractUserAgent,
  isPublicAtendimentoMutation,
  isSensitiveApiPath,
  mapHttpMethodToEventAction,
  resolveActorFromRequest,
  resolveModuleFromPath,
  shouldSkipAuditoriaPath,
} from './context.js'
import { mapHttpStatusToServerResponse } from './formatters.js'
import { logAuditoriaEventoSafe } from './write.service.js'

function extractResourceId(url: string): string {
  const segments = url.split('/').filter(Boolean)
  const last = segments[segments.length - 1]
  if (!last) return ''
  if (last.includes('?')) return last.split('?')[0] ?? ''
  if (/^[0-9a-f-]{36}$/i.test(last)) return last
  if (/^\d+$/.test(last)) return last
  return ''
}

async function logRequestEvent(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const url = request.url.split('?')[0] ?? request.url
  if (shouldSkipAuditoriaPath(url, request.method)) return

  const method = request.method.toUpperCase()
  const actor = resolveActorFromRequest(request)
  const isPublicMutation = isPublicAtendimentoMutation(url, method)

  if (!actor?.atorId && !isPublicMutation) return

  const effectiveActor =
    actor?.atorId != null
      ? actor
      : {
          portal: 'atendimento' as const,
          atorId: null,
          atorNome: 'Portal público',
          atorTipo: 'atendimento_publico',
        }

  const statusCode = reply.statusCode
  const moduleName = resolveModuleFromPath(url)
  const sensitive = isSensitiveApiPath(url)
  const responseMeta = mapHttpStatusToServerResponse(statusCode)

  logAuditoriaEventoSafe({
    portal: effectiveActor.portal,
    acao: sensitive ? 'acao_sensivel' : mapHttpMethodToEventAction(method),
    pagina: moduleName,
    descricao: `${method} ${url}`,
    recursoTipo: moduleName,
    recursoId: extractResourceId(url),
    actor: effectiveActor,
    ip: extractClientIp(request),
    payload: {
      method,
      path: url,
      statusCode,
      moduleName,
      pagePath: url,
      actionLabel: `${method} ${moduleName}`,
      resourceLabel: url,
      serverResponse: responseMeta.label,
      serverResponseTone: responseMeta.tone,
      userAgent: extractUserAgent(request),
      query: request.query,
      params: request.params,
      body: request.body,
    },
  })
}

export function registerAuditoriaMiddleware(app: FastifyInstance): void {
  app.addHook('onResponse', async (request, reply) => {
    void logRequestEvent(request, reply)
  })
}
