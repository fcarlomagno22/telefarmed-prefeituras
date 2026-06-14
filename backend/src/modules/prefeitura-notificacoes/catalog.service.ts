import { supabaseAdmin } from '../../db/supabase.js'
import { buildFilterOptions, mapOperatorRow } from '../prefeitura-rede/formatters.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import { listProfissionaisForEntidade } from '../comunicados/profissionais-scope.service.js'
import type { PrefeituraProfissionaisCatalogQuery } from './schemas.js'

export async function listPrefeituraProfissionaisCatalog(
  entidadeId: string,
  query: PrefeituraProfissionaisCatalogQuery,
) {
  const profissionais = await listProfissionaisForEntidade(entidadeId, {
    search: query.search,
  })

  return profissionais.map((item) => ({
    id: item.id,
    name: item.nome,
    specialty: item.especialidade,
  }))
}

export async function listPrefeituraUbtBroadcastCatalog(entidadeId: string) {
  const units = (await listRedeUnits(entidadeId)).filter((unit) => unit.status !== 'inativa')
  const unitIds = units.map((unit) => unit.id)

  let operators: ReturnType<typeof mapOperatorRow>[] = []
  if (unitIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('usuarios_ubt')
      .select('id, unidade_ubt_id, nome, funcao')
      .eq('entidade_contratante_id', entidadeId)
      .in('unidade_ubt_id', unitIds)
      .eq('status', 'ativo')
      .eq('eh_responsavel_ubt', false)
      .order('nome', { ascending: true })

    if (error) throw error
    operators = (data ?? []).map(mapOperatorRow)
  }

  const { regions: regionOptions } = buildFilterOptions(units)

  return { units, operators, regionOptions }
}
