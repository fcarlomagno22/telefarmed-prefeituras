import { supabaseAdmin } from '../../db/supabase.js'
import { monthStartIso } from '../../lib/escalaDateTime.js'
import type { EscalaSummaryDto } from './types.js'

export async function getEscalaSummary(): Promise<EscalaSummaryDto> {
  const monthStart = monthStartIso()

  const [slotsResult, inscricoesResult, claimedResult] = await Promise.all([
    supabaseAdmin
      .from('vw_admin_escala_slots_listagem')
      .select(
        'status, modo_atribuicao, vagas_disponiveis, status_preenchimento, valor_centavos, fila_reserva',
      ),
    supabaseAdmin
      .from('escala_inscricoes_profissional')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pendente'),
    supabaseAdmin
      .from('escala_plantoes_confirmados')
      .select('id', { count: 'exact', head: true })
      .gte('confirmado_em', monthStart)
      .in('status', ['confirmado', 'realizado']),
  ])

  if (slotsResult.error) throw slotsResult.error
  if (inscricoesResult.error) throw inscricoesResult.error
  if (claimedResult.error) throw claimedResult.error

  const rows = slotsResult.data ?? []
  const published = rows.filter((row) => row.status === 'publicada' || row.status === 'encerrada')
  const openPublished = published.filter((row) => row.modo_atribuicao === 'open')
  const openVacancies = openPublished.reduce(
    (sum, row) => sum + Math.max(0, Number(row.vagas_disponiveis ?? 0)),
    0,
  )
  const partialCount = openPublished.filter((row) => row.status_preenchimento === 'parcial').length
  const withoutBackupCount = published.filter((row) => {
    const backup = row.fila_reserva
    return !Array.isArray(backup) || backup.length === 0
  }).length
  const draftCount = rows.filter((row) => row.status === 'rascunho').length
  const filledOpen = openPublished.filter((row) => row.status_preenchimento === 'lotado').length
  const fillRatePercent =
    openPublished.length > 0
      ? Math.round((filledOpen / openPublished.length) * 100)
      : published.length > 0
        ? 100
        : 0
  const averageOpenAmountCents =
    openPublished.length > 0
      ? Math.round(
          openPublished.reduce((sum, row) => sum + Number(row.valor_centavos ?? 0), 0) /
            openPublished.length,
        )
      : 0

  return {
    publishedCount: published.length,
    openVacancies,
    claimedThisMonth: claimedResult.count ?? 0,
    fillRatePercent,
    averageOpenAmountCents,
    partialCount,
    withoutBackupCount,
    draftCount,
    pendingInscriptions: inscricoesResult.count ?? 0,
  }
}
