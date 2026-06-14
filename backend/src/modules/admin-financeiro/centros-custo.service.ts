import { supabaseAdmin } from '../../db/supabase.js'
import { formatCentroCusto } from './formatters.js'
import { FinanceiroError } from './errors.js'
import type { CentroCustoDto } from './types.js'

export async function listCentrosCusto(): Promise<CentroCustoDto[]> {
  const { data, error } = await supabaseAdmin
    .from('financeiro_centros_custo')
    .select('id, nome')
    .order('nome')

  if (error) throw error
  return (data ?? []).map(formatCentroCusto)
}

export async function createCentroCusto(nome: string): Promise<CentroCustoDto> {
  const { data, error } = await supabaseAdmin
    .from('financeiro_centros_custo')
    .insert({ nome: nome.trim() })
    .select('id, nome')
    .single()

  if (error) throw error
  if (!data) throw new FinanceiroError('Não foi possível criar centro de custo.', 'INVALID_DATA', 500)
  return formatCentroCusto(data)
}
