import type { FastifyRequest } from 'fastify'
import { InternalCronError } from './errors.js'

/**
 * Valida chamadas de cron (Vercel envia `Authorization: Bearer <CRON_SECRET>`).
 * @see https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 */
export function assertCronSecret(request: FastifyRequest): void {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    throw new InternalCronError(
      'CRON_SECRET não configurado no servidor.',
      503,
    )
  }

  const authorization = request.headers.authorization?.trim()
  if (authorization !== `Bearer ${secret}`) {
    throw new InternalCronError('Não autorizado.', 401)
  }
}
