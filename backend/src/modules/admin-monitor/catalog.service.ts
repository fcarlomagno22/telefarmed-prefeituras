import { supabaseAdmin } from '../../db/supabase.js'
import {
  computeStationsOnline,
  mapUnitRowToApi,
  normalizeMaintenanceIndexes,
} from '../prefeitura-rede/formatters.js'
import type { UnidadeUbtRow } from '../prefeitura-rede/types.js'
import type { AdminMonitorCatalogUnit } from './types.js'

const UNIT_SELECT =
  'id, entidade_contratante_id, nome, ra_chave, ra_rotulo, cnes, tipo_unidade, endereco, telefone, capacidade_diaria, especialidades, notas, terminais_total, terminais_manutencao, estado_operacional, status'

type EntidadeRow = {
  id: string
  nome_exibicao: string
  municipio: string
  uf: string
  status_cliente: string
}

type ResponsibleRow = {
  unidade_ubt_id: string
  nome: string
}

export async function loadAdminMonitorEntidades(): Promise<
  Array<{ id: string; nome: string; uf: string }>
> {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('id, nome_exibicao, municipio, uf, status_cliente')
    .in('status_cliente', ['ativa', 'suspensa', 'implantacao'])
    .order('nome_exibicao', { ascending: true })

  if (error) throw error

  return ((data ?? []) as EntidadeRow[]).map((row) => ({
    id: row.id,
    nome: row.nome_exibicao?.trim() || row.municipio || 'Prefeitura',
    uf: row.uf?.trim() || '—',
  }))
}

export async function loadAdminMonitorCatalog(): Promise<AdminMonitorCatalogUnit[]> {
  const [unitsResult, responsiblesResult] = await Promise.all([
    supabaseAdmin.from('unidades_ubt').select(UNIT_SELECT).neq('estado_operacional', 'inativa'),
    supabaseAdmin
      .from('usuarios_ubt')
      .select('unidade_ubt_id, nome')
      .eq('eh_responsavel_ubt', true)
      .eq('status', 'ativo'),
  ])

  if (unitsResult.error) throw unitsResult.error
  if (responsiblesResult.error) throw responsiblesResult.error

  const entidadeIds = [
    ...new Set(((unitsResult.data ?? []) as UnidadeUbtRow[]).map((row) => row.entidade_contratante_id)),
  ]

  const entidadeMap = new Map<string, { nome: string; uf: string }>()
  if (entidadeIds.length > 0) {
    const { data: entidades, error } = await supabaseAdmin
      .from('entidades_contratantes')
      .select('id, nome_exibicao, municipio, uf')
      .in('id', entidadeIds)

    if (error) throw error

    for (const row of (entidades ?? []) as EntidadeRow[]) {
      entidadeMap.set(row.id, {
        nome: row.nome_exibicao?.trim() || row.municipio || 'Prefeitura',
        uf: row.uf?.trim() || '—',
      })
    }
  }

  const responsibleByUnit = new Map<string, string>()
  for (const row of (responsiblesResult.data ?? []) as ResponsibleRow[]) {
    responsibleByUnit.set(String(row.unidade_ubt_id), row.nome?.trim() || 'Operador')
  }

  return ((unitsResult.data ?? []) as UnidadeUbtRow[]).map((row) => {
    const maintenanceTerminalIndexes = normalizeMaintenanceIndexes(
      row.terminais_manutencao,
      row.terminais_total,
    )
    const apiUnit = mapUnitRowToApi(row, {
      name: responsibleByUnit.get(row.id) ?? 'Responsável pendente',
      phone: row.telefone ?? '',
    })
    const entidade = entidadeMap.get(row.entidade_contratante_id)

    return {
      id: row.id,
      entidadeId: row.entidade_contratante_id,
      prefeituraNome: entidade?.nome ?? 'Prefeitura',
      uf: entidade?.uf ?? '—',
      name: apiUnit.name,
      region: apiUnit.region,
      regionKey: apiUnit.regionKey,
      stationsTotal: apiUnit.stationsTotal,
      stationsOnline: computeStationsOnline(
        row.terminais_total,
        maintenanceTerminalIndexes,
        row.estado_operacional,
      ),
      status: apiUnit.status,
      operatorName: responsibleByUnit.get(row.id) ?? 'Operador de plantão',
    }
  })
}
