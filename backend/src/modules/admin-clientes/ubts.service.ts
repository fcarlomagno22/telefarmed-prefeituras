import { supabaseAdmin } from '../../db/supabase.js'
import {
  computeStationsOnline,
  formatDailyCapacityLabel,
  formatUnitAddress,
  formatUnitTypeLabel,
  mapOperatorRow,
  mapUnitRowToApi,
  normalizeMaintenanceIndexes,
} from '../prefeitura-rede/formatters.js'
import { fetchUnitsMetrics } from '../prefeitura-rede/metrics.service.js'
import type { UnidadeUbtRow } from '../prefeitura-rede/types.js'
import { ClientesError } from './errors.js'
import type {
  AdminClienteUbtRowDto,
  AdminClienteUbtsResponseDto,
} from './ubts.types.js'

const UNIT_SELECT =
  'id, entidade_contratante_id, nome, ra_chave, ra_rotulo, cnes, tipo_unidade, endereco, telefone, capacidade_diaria, especialidades, notas, terminais_total, terminais_manutencao, estado_operacional, status'

function mapStatusLabel(status: 'ativa' | 'manutencao' | 'inativa'): string {
  if (status === 'ativa') return 'Ativa'
  if (status === 'manutencao') return 'Manutenção'
  return 'Inativa'
}

async function assertEntidadeExists(entidadeId: string): Promise<{ nome: string }> {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('id, nome_exibicao, municipio')
    .eq('id', entidadeId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ClientesError('Entidade não encontrada.', 'NOT_FOUND', 404)
  }

  return {
    nome: String(data.nome_exibicao ?? data.municipio ?? 'Prefeitura'),
  }
}

async function loadSpecialtyNamesById(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()

  const { data, error } = await supabaseAdmin
    .from('config_especialidades')
    .select('id, nome')
    .in('id', ids)

  if (error) throw error

  return new Map((data ?? []).map((row) => [String(row.id), String(row.nome)]))
}

async function loadResponsiblesByUnit(
  entidadeId: string,
  unitIds: string[],
): Promise<Map<string, AdminClienteUbtRowDto['responsible']>> {
  const map = new Map<string, AdminClienteUbtRowDto['responsible']>()
  if (unitIds.length === 0) return map

  const { data, error } = await supabaseAdmin
    .from('usuarios_ubt')
    .select('unidade_ubt_id, nome, email, cpf')
    .eq('entidade_contratante_id', entidadeId)
    .in('unidade_ubt_id', unitIds)
    .eq('eh_responsavel_ubt', true)
    .eq('status', 'ativo')

  if (error) throw error

  for (const row of data ?? []) {
    map.set(String(row.unidade_ubt_id), {
      name: String(row.nome),
      email: row.email ? String(row.email) : '',
      cpf: String(row.cpf),
      phone: '',
      credentialsConfigured: Boolean(row.email),
    })
  }

  return map
}

async function loadOperatorsByUnits(
  entidadeId: string,
  unitIds: string[],
): Promise<Map<string, AdminClienteUbtRowDto['operators']>> {
  const map = new Map<string, AdminClienteUbtRowDto['operators']>()
  if (unitIds.length === 0) return map

  const { data, error } = await supabaseAdmin
    .from('usuarios_ubt')
    .select('id, unidade_ubt_id, nome, funcao')
    .eq('entidade_contratante_id', entidadeId)
    .in('unidade_ubt_id', unitIds)
    .eq('status', 'ativo')
    .eq('eh_responsavel_ubt', false)
    .order('nome', { ascending: true })

  if (error) throw error

  for (const row of data ?? []) {
    const unitId = String(row.unidade_ubt_id)
    const current = map.get(unitId) ?? []
    current.push(mapOperatorRow(row))
    map.set(unitId, current)
  }

  return map
}

function mapUnitToDto(
  row: UnidadeUbtRow,
  responsible: AdminClienteUbtRowDto['responsible'],
  operators: AdminClienteUbtRowDto['operators'],
  specialtyNames: string[],
  metrics: AdminClienteUbtRowDto['metrics'],
): AdminClienteUbtRowDto {
  const maintenanceTerminalIndexes = normalizeMaintenanceIndexes(
    row.terminais_manutencao,
    row.terminais_total,
  )
  const apiUnit = mapUnitRowToApi(row, {
    name: responsible.name,
    phone: row.telefone ?? '',
  })
  const { formatted, parts } = formatUnitAddress(row.endereco)
  const stationsOnline = computeStationsOnline(
    row.terminais_total,
    maintenanceTerminalIndexes,
    row.estado_operacional,
  )

  return {
    id: row.id,
    name: apiUnit.name,
    region: apiUnit.region,
    regionKey: apiUnit.regionKey,
    status: apiUnit.status,
    statusLabel: mapStatusLabel(apiUnit.status),
    cnes: apiUnit.cnes,
    unitType: formatUnitTypeLabel(row.tipo_unidade),
    address: {
      formatted,
      cep: parts.cep,
      street: parts.street,
      number: parts.number,
      complement: parts.complement,
      neighborhood: parts.neighborhood,
      city: parts.city,
      state: parts.state,
    },
    phone: row.telefone?.trim() || '—',
    dailyCapacityLabel: formatDailyCapacityLabel(row.capacidade_diaria),
    specialtyNames,
    stationsTotal: row.terminais_total,
    stationsOnline,
    maintenanceTerminals: maintenanceTerminalIndexes.length,
    notes: row.notas?.trim() || '—',
    responsible: {
      name: responsible.name,
      email: responsible.email,
      cpf: responsible.cpf,
      phone: responsible.phone || row.telefone?.trim() || '—',
      credentialsConfigured: responsible.credentialsConfigured,
    },
    operators,
    metrics,
  }
}

export async function listClienteUbts(entidadeId: string): Promise<AdminClienteUbtsResponseDto> {
  const entidade = await assertEntidadeExists(entidadeId)

  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select(UNIT_SELECT)
    .eq('entidade_contratante_id', entidadeId)
    .order('nome', { ascending: true })

  if (error) throw error

  const rows = (data ?? []) as UnidadeUbtRow[]
  if (rows.length === 0) {
    return {
      entidadeId,
      prefeitura: entidade.nome,
      total: 0,
      ubts: [],
    }
  }

  const unitIds = rows.map((row) => row.id)
  const specialtyIds = [...new Set(rows.flatMap((row) => row.especialidades ?? []))]

  const [specialtyNamesById, responsibles, operatorsByUnit, metricsMap] = await Promise.all([
    loadSpecialtyNamesById(specialtyIds),
    loadResponsiblesByUnit(entidadeId, unitIds),
    loadOperatorsByUnits(entidadeId, unitIds),
    fetchUnitsMetrics(
      entidadeId,
      unitIds,
      new Map(
        rows.map((row) => {
          const maintenanceTerminalIndexes = normalizeMaintenanceIndexes(
            row.terminais_manutencao,
            row.terminais_total,
          )
          return [
            row.id,
            computeStationsOnline(
              row.terminais_total,
              maintenanceTerminalIndexes,
              row.estado_operacional,
            ),
          ]
        }),
      ),
    ),
  ])

  const ubts = rows.map((row) => {
    const responsible = responsibles.get(row.id) ?? {
      name: 'Responsável pendente',
      email: '',
      cpf: '',
      phone: row.telefone?.trim() || '',
      credentialsConfigured: false,
    }
    const operators = operatorsByUnit.get(row.id) ?? []
    const names = (row.especialidades ?? [])
      .map((id) => specialtyNamesById.get(id) ?? id)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    const metrics = metricsMap.get(row.id) ?? {
      operatorsOnline: 0,
      stationsActive: computeStationsOnline(
        row.terminais_total,
        normalizeMaintenanceIndexes(row.terminais_manutencao, row.terminais_total),
        row.estado_operacional,
      ),
      consultationsCompleted: 0,
      consultationsInProgress: 0,
      cancellationsToday: 0,
      avgConsultationMinutes: 0,
      queueNow: 0,
      consultationsToday: 0,
    }

    return mapUnitToDto(row, responsible, operators, names, metrics)
  })

  return {
    entidadeId,
    prefeitura: entidade.nome,
    total: ubts.length,
    ubts,
  }
}
