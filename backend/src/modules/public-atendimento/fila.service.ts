import { supabaseAdmin } from '../../db/supabase.js'
import type { PublicFilaStatusDto } from './types.js'

export type { PublicFilaStatusDto } from './types.js'

type FilaContext = {
  consultaStatus: string
  unidadeUbtId: string
  filaEsperaId: string | null
}

function estimateWaitMinutes(total: number): number {
  return Math.max(3, Math.min(45, Math.max(total, 1) * 5))
}

function mapFilaDbStatus(
  status: string,
): PublicFilaStatusDto['status'] {
  if (status === 'chamado') return 'chamado'
  if (status === 'em_atendimento') return 'em_atendimento'
  if (status === 'finalizado') return 'finalizado'
  if (status === 'desistiu') return 'desistiu'
  if (status === 'aguardando') return 'aguardando'
  return 'sem_fila'
}

export async function computePublicFilaStatus(ctx: FilaContext): Promise<PublicFilaStatusDto> {
  const { consultaStatus } = ctx

  if (consultaStatus === 'em_andamento') {
    return {
      position: 1,
      total: 1,
      status: 'em_atendimento',
      estimatedMinutes: 0,
      readyForConsultation: true,
    }
  }

  if (consultaStatus === 'concluida') {
    return {
      position: 0,
      total: 0,
      status: 'finalizado',
      estimatedMinutes: 0,
      readyForConsultation: false,
    }
  }

  if (consultaStatus === 'interrompida') {
    return {
      position: 0,
      total: 0,
      status: 'desistiu',
      estimatedMinutes: 0,
      readyForConsultation: false,
    }
  }

  if (!ctx.filaEsperaId) {
    return {
      position: 1,
      total: 1,
      status: 'sem_fila',
      estimatedMinutes: 5,
      readyForConsultation: false,
    }
  }

  const [{ data: filaRow, error: filaError }, { data: activeQueue, error: queueError }] =
    await Promise.all([
      supabaseAdmin
        .from('fila_espera')
        .select('id, status')
        .eq('id', ctx.filaEsperaId)
        .maybeSingle(),
      supabaseAdmin
        .from('fila_espera')
        .select('id')
        .eq('unidade_ubt_id', ctx.unidadeUbtId)
        .in('status', ['aguardando', 'chamado'])
        .order('chegada_em', { ascending: true }),
    ])

  if (filaError) throw filaError
  if (queueError) throw queueError

  const queue = activeQueue ?? []
  const total = queue.length
  const index = queue.findIndex((row) => String(row.id) === ctx.filaEsperaId)
  const position = index >= 0 ? index + 1 : Math.max(total, 1)

  return {
    position,
    total: Math.max(total, 1),
    status: mapFilaDbStatus(String(filaRow?.status ?? 'aguardando')),
    estimatedMinutes: estimateWaitMinutes(total),
    readyForConsultation: false,
  }
}
