import { supabaseAdmin } from '../../db/supabase.js'
import { centavosToReais } from './money.js'
import type { FinanceiroSummaryDto } from './types.js'

export async function getFinanceiroSummary(): Promise<FinanceiroSummaryDto> {
  const [{ data: fechamentos, error: fechError }, { data: contas, error: contasError }] =
    await Promise.all([
      supabaseAdmin.from('fechamentos_competencia').select('valor_final_centavos, status_vencimento'),
      supabaseAdmin.from('financeiro_contas_pagar').select('valor_centavos, status'),
    ])

  if (fechError) throw fechError
  if (contasError) throw contasError

  const fechRows = fechamentos ?? []
  const pagarRows = contas ?? []

  const receitaPrevista = fechRows.reduce((s, r) => s + Number(r.valor_final_centavos), 0)
  const receitaRecebida = fechRows
    .filter((r) => r.status_vencimento === 'paga')
    .reduce((s, r) => s + Number(r.valor_final_centavos), 0)
  const despesasTotais = pagarRows.reduce((s, r) => s + Number(r.valor_centavos), 0)
  const totalEmAtrasoReceber = fechRows
    .filter((r) => r.status_vencimento === 'atrasada')
    .reduce((s, r) => s + Number(r.valor_final_centavos), 0)

  return {
    receitaPrevista: centavosToReais(receitaPrevista),
    receitaRecebida: centavosToReais(receitaRecebida),
    despesasTotais: centavosToReais(despesasTotais),
    saldoOperacional: centavosToReais(receitaRecebida - despesasTotais),
    totalEmAtrasoReceber: centavosToReais(totalEmAtrasoReceber),
  }
}
