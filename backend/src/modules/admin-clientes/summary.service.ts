import { supabaseAdmin } from '../../db/supabase.js'
import { formatRelativeTimeAgo } from './formatters.js'
import type { ClientesSummaryDto } from './types.js'

type SummaryViewRow = {
  total_cadastrados: number
  ativas: number
  implantacao: number
  prospects: number
  suspensas: number
  sem_contrato: number
}

type LatestUpdateRow = {
  municipio: string
  uf: string
  atualizado_em: string
}

export async function getClientesSummary(): Promise<ClientesSummaryDto> {
  const [summaryResult, latestResult] = await Promise.all([
    supabaseAdmin.from('vw_admin_clientes_summary').select('*').maybeSingle(),
    supabaseAdmin
      .from('entidades_contratantes')
      .select('municipio, uf, atualizado_em')
      .order('atualizado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (summaryResult.error) throw summaryResult.error
  if (latestResult.error) throw latestResult.error

  const summary = (summaryResult.data ?? {
    total_cadastrados: 0,
    ativas: 0,
    implantacao: 0,
    prospects: 0,
    suspensas: 0,
    sem_contrato: 0,
  }) as SummaryViewRow

  const latest = latestResult.data as LatestUpdateRow | null

  return {
    ativas: summary.ativas,
    ativasTrend: `${summary.ativas} cliente${summary.ativas === 1 ? '' : 's'} ativo${summary.ativas === 1 ? '' : 's'}`,
    implantacao: summary.implantacao,
    implantacaoTrend: `${summary.implantacao} em implantação`,
    prospects: summary.prospects,
    prospectsTrend: `${summary.prospects} prospect${summary.prospects === 1 ? '' : 's'}`,
    suspensas: summary.suspensas,
    suspensasTrend: `${summary.suspensas} suspensa${summary.suspensas === 1 ? '' : 's'}`,
    totalCadastrados: summary.total_cadastrados,
    ultimaAtualizacaoMunicipio: latest ? `${latest.municipio}/${latest.uf}` : '—',
    ultimaAtualizacaoAgo: latest ? formatRelativeTimeAgo(latest.atualizado_em) : '—',
    porStatus: {
      ativas: summary.ativas,
      implantacao: summary.implantacao,
      prospects: summary.prospects,
      suspensas: summary.suspensas,
      semContrato: summary.sem_contrato,
    },
  }
}
