import { supabaseAdmin } from '../../db/supabase.js'
import { uiStatusFromDb } from './formatters.js'
import type { CandidaturasSummaryDto, DbCandidaturaStatus } from './types.js'

type SummaryRow = {
  status: DbCandidaturaStatus
  empresa_status: string | null
}

export async function getCandidaturasSummary(): Promise<CandidaturasSummaryDto> {
  const { data, error } = await supabaseAdmin
    .from('vw_admin_candidaturas_listagem')
    .select('status, empresa_status')

  if (error) throw error

  const rows = (data ?? []) as SummaryRow[]
  const counts = {
    total: rows.length,
    pendente: 0,
    incompleto: 0,
    aprovado: 0,
    reprovado: 0,
    em_analise: 0,
    aguardandoFinalizacao: 0,
  }

  for (const row of rows) {
    const uiStatus = uiStatusFromDb(row.status)
    if (uiStatus === 'pendente') counts.pendente += 1
    if (uiStatus === 'incompleto') counts.incompleto += 1
    if (uiStatus === 'aprovado') counts.aprovado += 1
    if (uiStatus === 'reprovado') counts.reprovado += 1
    if (uiStatus === 'em_analise') counts.em_analise += 1
    if (row.empresa_status === 'aguardando_finalizacao') counts.aguardandoFinalizacao += 1
  }

  return counts
}
