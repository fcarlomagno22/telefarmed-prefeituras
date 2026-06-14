import { supabaseAdmin } from '../../db/supabase.js'
import { monthStartIso } from '../../lib/escalaDateTime.js'
import type { ProfissionalEscalaContext, ProfissionalEscalaSummaryDto } from './types.js'

export async function getProfissionalEscalaSummary(
  ctx: ProfissionalEscalaContext,
): Promise<ProfissionalEscalaSummaryDto> {
  const monthStart = monthStartIso()

  const [plantoesResult, inscricoesResult, inscricoesTotalResult] = await Promise.all([
    supabaseAdmin
      .from('escala_plantoes_confirmados')
      .select('id, status, confirmado_em, escala_slots!inner(valor_centavos)')
      .eq('profissional_id', ctx.profissionalId)
      .gte('confirmado_em', monthStart)
      .in('status', ['confirmado', 'realizado']),
    supabaseAdmin
      .from('escala_inscricoes_profissional')
      .select('id', { count: 'exact', head: true })
      .eq('profissional_id', ctx.profissionalId)
      .eq('status', 'pendente'),
    supabaseAdmin
      .from('escala_inscricoes_profissional')
      .select('id, status')
      .eq('profissional_id', ctx.profissionalId),
  ])

  if (plantoesResult.error) throw plantoesResult.error
  if (inscricoesResult.error) throw inscricoesResult.error
  if (inscricoesTotalResult.error) throw inscricoesTotalResult.error

  const plantoes = plantoesResult.data ?? []
  const claimedThisMonth = plantoes.length
  const grossRevenueCents = plantoes.reduce((sum, row) => {
    const slot = row.escala_slots as unknown as { valor_centavos: number }
    return sum + Number(slot?.valor_centavos ?? 0)
  }, 0)

  const inscricoes = inscricoesTotalResult.data ?? []
  const accepted = inscricoes.filter((row) => row.status === 'aceita').length
  const rejected = inscricoes.filter((row) => row.status === 'rejeitada').length
  const responded = accepted + rejected
  const acceptanceRatePercent =
    responded > 0 ? Math.round((accepted / responded) * 100) : claimedThisMonth > 0 ? 100 : 0

  return {
    claimedThisMonth,
    grossRevenueCents,
    acceptanceRatePercent,
    pendingInscriptions: inscricoesResult.count ?? 0,
  }
}
