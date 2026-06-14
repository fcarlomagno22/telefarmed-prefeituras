import { verifyAdminAuthorizationPin } from '../admin-auth/service.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { centavosToReais, reaisToCentavos } from './money.js'
import type { BalancoDto } from './types.js'
import type { listBalancoQuerySchema } from './schemas.js'
import type { z } from 'zod'

type BalancoQuery = z.infer<typeof listBalancoQuerySchema>

function monthRangeFromCompetencia(competencia: string): { start: string; end: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(competencia.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const start = `${match[1]}-${match[2]}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${match[1]}-${match[2]}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export async function getBalanco(params: BalancoQuery = { viewMode: 'consolidado' }): Promise<BalancoDto> {
  let fechQuery = supabaseAdmin.from('fechamentos_competencia').select('valor_final_centavos, status_vencimento, competencia_mes')
  let pagarQuery = supabaseAdmin.from('financeiro_contas_pagar').select('valor_centavos, status, centro_custo_id, vencimento')

  if (params.viewMode === 'competencia' && params.competencia) {
    const range = monthRangeFromCompetencia(params.competencia)
    if (range) {
      fechQuery = fechQuery
        .gte('competencia_mes', range.start)
        .lte('competencia_mes', range.end)
      pagarQuery = pagarQuery.gte('vencimento', range.start).lte('vencimento', range.end)
    }
  } else if (params.viewMode === 'periodo' && params.dataInicial && params.dataFinal) {
    pagarQuery = pagarQuery.gte('vencimento', params.dataInicial).lte('vencimento', params.dataFinal)
  }

  const [{ data: fechamentos }, { data: contas }, { data: centros }, { data: ajustes }] =
    await Promise.all([
      fechQuery,
      pagarQuery,
      supabaseAdmin.from('financeiro_centros_custo').select('id, nome').order('nome'),
      supabaseAdmin.from('financeiro_balanco_ajustes_centro').select('centro_custo_id, valor_ajuste_centavos'),
    ])

  const receitaCentavos = (fechamentos ?? []).reduce((s, r) => s + Number(r.valor_final_centavos), 0)
  const despesaCentavos = (contas ?? []).reduce((s, r) => s + Number(r.valor_centavos), 0)
  const despesasPagasCentavos = (contas ?? [])
    .filter((r) => r.status === 'pago')
    .reduce((s, r) => s + Number(r.valor_centavos), 0)
  const totalEmAtrasoCentavos = (fechamentos ?? [])
    .filter((r) => r.status_vencimento === 'atrasada')
    .reduce((s, r) => s + Number(r.valor_final_centavos), 0)

  const ajusteMap = new Map<string, number>()
  for (const a of ajustes ?? []) {
    ajusteMap.set(String(a.centro_custo_id), Number(a.valor_ajuste_centavos))
  }

  const despesasPorCentro = (centros ?? []).map((centro) => {
    const valorBaseCentavos = (contas ?? [])
      .filter((c) => c.centro_custo_id === centro.id)
      .reduce((s, c) => s + Number(c.valor_centavos), 0)
    const ajusteCentavos = ajusteMap.get(centro.id) ?? 0
    return {
      id: centro.id,
      nome: centro.nome,
      valorBase: centavosToReais(valorBaseCentavos),
      ajuste: centavosToReais(ajusteCentavos),
      valor: centavosToReais(valorBaseCentavos + ajusteCentavos),
    }
  })

  const receita = centavosToReais(receitaCentavos)
  const despesa = centavosToReais(despesaCentavos)
  const resultado = receita - despesa

  return {
    receita,
    despesa,
    resultado,
    lucratividadePercentual: receita ? Number(((resultado / receita) * 100).toFixed(2)) : 0,
    despesasPagas: centavosToReais(despesasPagasCentavos),
    totalEmAtrasoReceber: centavosToReais(totalEmAtrasoCentavos),
    despesasPorCentro,
  }
}

export async function upsertBalancoAjuste(
  centroId: string,
  valorConsolidadoReais: number,
): Promise<BalancoDto> {
  await supabaseAdmin.from('financeiro_balanco_ajustes_centro').upsert(
    {
      centro_custo_id: centroId,
      valor_ajuste_centavos: reaisToCentavos(valorConsolidadoReais),
    },
    { onConflict: 'centro_custo_id' },
  )

  return getBalanco()
}

export async function clearBalancoAjuste(
  adminId: string,
  centroId: string,
  pin: string,
): Promise<BalancoDto> {
  await verifyAdminAuthorizationPin(adminId, pin)

  await supabaseAdmin
    .from('financeiro_balanco_ajustes_centro')
    .delete()
    .eq('centro_custo_id', centroId)

  return getBalanco()
}
