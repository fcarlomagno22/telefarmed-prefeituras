import { supabaseAdmin } from '../../db/supabase.js'
import { normalizeCpf } from '../../lib/cpf.js'
import {
  addressMatchesEntityTerritory,
  buildTerritoryMismatchMessage,
} from '../../lib/municipalityTerritory.js'
import {
  buildAddressPayload,
  formatDailyCapacityLabel,
  formatUnitAddress,
  formatUnitTypeLabel,
  maintenanceIndexesForStatus,
  mapOperatorRow,
  mapUnitRowToApi,
  normalizeMaintenanceIndexes,
  resolveOperationalStatus,
} from './formatters.js'
import { createHash } from 'node:crypto'
import { fetchUnitMetrics } from './metrics.service.js'
import { PrefeituraRedeError } from './errors.js'
import type { CreateUnitBody, UpdateUnitBody } from './schemas.js'
import type { RedeUnitDetailApi, UnidadeUbtRow } from './types.js'

const UNIT_SELECT =
  'id, entidade_contratante_id, nome, ra_chave, ra_rotulo, cnes, tipo_unidade, endereco, telefone, capacidade_diaria, especialidades, notas, terminais_total, terminais_manutencao, estado_operacional, status'

const RESPONSIBLE_ROLE = 'Responsável pela UBT'

function cpfPlaceholderFromSeed(value: string): string {
  const digest = createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
  return digest.replace(/\D/g, '').slice(0, 11).padEnd(11, '0')
}

async function upsertUnitResponsible(
  entidadeId: string,
  unitId: string,
  responsible: { name: string; email?: string; cpf?: string },
): Promise<void> {
  const name = responsible.name.trim()
  if (!name) return

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('usuarios_ubt')
    .select('id')
    .eq('entidade_contratante_id', entidadeId)
    .eq('unidade_ubt_id', unitId)
    .eq('eh_responsavel_ubt', true)
    .eq('status', 'ativo')
    .maybeSingle()

  if (existingError) throw existingError

  const cpfDigits = responsible.cpf ? normalizeCpf(responsible.cpf) : null
  const email = responsible.email?.trim() || null

  if (existing) {
    const patch: Record<string, unknown> = { nome: name, funcao: RESPONSIBLE_ROLE, eh_responsavel_ubt: true }
    if (email !== null) patch.email = email
    if (cpfDigits) patch.cpf = cpfDigits

    const { error } = await supabaseAdmin.from('usuarios_ubt').update(patch).eq('id', existing.id)
    if (error) {
      if (error.code === '23505') {
        throw new PrefeituraRedeError('CPF ou e-mail já cadastrado para outro usuário.', 'CONFLICT', 409)
      }
      throw error
    }
    return
  }

  const cpf = cpfDigits ?? cpfPlaceholderFromSeed(email ?? `${unitId}@pending.local`)

  const { data: created, error } = await supabaseAdmin
    .from('usuarios_ubt')
    .insert({
      cpf,
      nome: name,
      email,
      funcao: RESPONSIBLE_ROLE,
      senha_hash: '',
      nivel_acesso: 'operador',
      status: 'ativo',
      entidade_contratante_id: entidadeId,
      unidade_ubt_id: unitId,
      eh_responsavel_ubt: true,
      permissoes_sistema: {},
      entidade_razao_social: 'pendente',
      municipio: 'pendente',
      uf: 'SP',
      unidade_ubt_nome: 'pendente',
      ra_chave: 'pendente',
      ra_rotulo: 'pendente',
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new PrefeituraRedeError(
        'Já existe um responsável ou CPF/e-mail duplicado nesta UBT.',
        'CONFLICT',
        409,
      )
    }
    throw error
  }

  if (created) {
    await supabaseAdmin
      .from('usuarios_ubt')
      .update({ eh_responsavel_ubt: false, funcao: 'Gestor da UBT' })
      .eq('unidade_ubt_id', unitId)
      .eq('eh_responsavel_ubt', true)
      .neq('id', created.id)
  }
}

async function loadSpecialtyNames(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabaseAdmin
    .from('config_especialidades')
    .select('id, nome')
    .in('id', ids)

  if (error) throw error

  const namesById = new Map((data ?? []).map((row) => [String(row.id), String(row.nome)]))
  return ids.map((id) => namesById.get(id) ?? id).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

async function loadResponsiblesByUnit(
  entidadeId: string,
  unitIds: string[],
): Promise<Map<string, { name: string; phone: string; email: string; cpf: string; configured: boolean }>> {
  const map = new Map<string, { name: string; phone: string; email: string; cpf: string; configured: boolean }>()
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
      phone: '',
      email: row.email ? String(row.email) : '',
      cpf: String(row.cpf),
      configured: true,
    })
  }

  return map
}

async function loadOperatorsByUnit(entidadeId: string, unitId: string) {
  const { data, error } = await supabaseAdmin
    .from('usuarios_ubt')
    .select('id, unidade_ubt_id, nome, funcao')
    .eq('entidade_contratante_id', entidadeId)
    .eq('unidade_ubt_id', unitId)
    .eq('status', 'ativo')
    .eq('eh_responsavel_ubt', false)
    .order('nome', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapOperatorRow)
}

async function assertUnitBelongsToEntity(entidadeId: string, unitId: string): Promise<UnidadeUbtRow> {
  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select(UNIT_SELECT)
    .eq('id', unitId)
    .eq('entidade_contratante_id', entidadeId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new PrefeituraRedeError('Unidade não encontrada.', 'NOT_FOUND', 404)
  }

  return data as UnidadeUbtRow
}

async function loadEntityTerritory(entidadeId: string): Promise<{ municipio: string; uf: string }> {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('municipio, uf')
    .eq('id', entidadeId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new PrefeituraRedeError('Entidade não encontrada.', 'NOT_FOUND', 404)
  }

  return {
    municipio: String(data.municipio),
    uf: String(data.uf),
  }
}

function assertAddressInEntityTerritory(
  territory: { municipio: string; uf: string },
  address?: CreateUnitBody['address'],
): void {
  if (!address?.city?.trim() || !address?.state?.trim()) return

  if (
    !addressMatchesEntityTerritory(
      address.city,
      address.state,
      territory.municipio,
      territory.uf,
    )
  ) {
    throw new PrefeituraRedeError(
      buildTerritoryMismatchMessage(
        territory.municipio,
        territory.uf,
        address.city,
        address.state,
      ),
      'INVALID_DATA',
      400,
    )
  }
}

export async function listRedeUnits(entidadeId: string) {
  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select(UNIT_SELECT)
    .eq('entidade_contratante_id', entidadeId)
    .eq('status', 'ativo')
    .order('nome', { ascending: true })

  if (error) throw error

  const rows = (data ?? []) as UnidadeUbtRow[]
  const unitIds = rows.map((row) => row.id)
  const responsibles = await loadResponsiblesByUnit(entidadeId, unitIds)

  return rows.map((row) => {
    const responsible = responsibles.get(row.id)
    return mapUnitRowToApi(row, {
      name: responsible?.name ?? 'Responsável pendente',
      phone: row.telefone,
    })
  })
}

export async function getRedeUnitDetail(entidadeId: string, unitId: string): Promise<RedeUnitDetailApi> {
  const row = await assertUnitBelongsToEntity(entidadeId, unitId)
  const responsibles = await loadResponsiblesByUnit(entidadeId, [unitId])
  const responsible = responsibles.get(unitId)
  const unit = mapUnitRowToApi(row, {
    name: responsible?.name ?? 'Responsável pendente',
    phone: row.telefone,
  })

  const [specialtyNames, operators, metrics] = await Promise.all([
    loadSpecialtyNames(row.especialidades ?? []),
    loadOperatorsByUnit(entidadeId, unitId),
    fetchUnitMetrics(entidadeId, unitId, unit.stationsOnline),
  ])

  const address = formatUnitAddress(row.endereco)

  return {
    unit,
    cadastral: {
      unitType: formatUnitTypeLabel(row.tipo_unidade),
      responsibleEmail: responsible?.email ?? '',
      responsibleCpf: responsible?.cpf ?? '',
      unitLandline: row.telefone ?? '',
      dailyCapacityLabel: formatDailyCapacityLabel(row.capacidade_diaria),
      specialtyNames,
      address: {
        ...address.parts,
        formatted: address.formatted,
      },
      notes: row.notas ?? '',
      credentialsConfigured: Boolean(responsible?.configured),
    },
    operators,
    metrics,
  }
}

export async function createRedeUnit(entidadeId: string, body: CreateUnitBody): Promise<RedeUnitDetailApi> {
  const territory = await loadEntityTerritory(entidadeId)
  assertAddressInEntityTerritory(territory, body.address)

  const maintenanceIndexes = maintenanceIndexesForStatus(body.status, body.stationsTotal)
  const estadoOperacional = resolveOperationalStatus(body.status, body.stationsTotal, maintenanceIndexes)

  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .insert({
      entidade_contratante_id: entidadeId,
      nome: body.name,
      ra_chave: body.regionKey,
      ra_rotulo: body.regionLabel,
      cnes: body.cnes ?? '',
      tipo_unidade: body.unitType,
      endereco: buildAddressPayload(body.address),
      telefone: body.phone ?? '',
      capacidade_diaria: body.dailyCapacity ?? 0,
      especialidades: body.specialties ?? [],
      notas: body.notes ?? '',
      terminais_total: body.stationsTotal,
      terminais_manutencao: maintenanceIndexes,
      estado_operacional: estadoOperacional,
      status: 'ativo',
    })
    .select('id')
    .single()

  if (error) throw error

  return getRedeUnitDetail(entidadeId, String(data.id))
}

export async function updateRedeUnit(
  entidadeId: string,
  unitId: string,
  body: UpdateUnitBody,
): Promise<RedeUnitDetailApi> {
  const current = await assertUnitBelongsToEntity(entidadeId, unitId)

  if (body.address?.city || body.address?.state) {
    const territory = await loadEntityTerritory(entidadeId)
    const currentAddress = formatUnitAddress(current.endereco)
    assertAddressInEntityTerritory(territory, {
      city: body.address.city ?? currentAddress.parts.city,
      state: body.address.state ?? currentAddress.parts.state,
    })
  }

  const stationsTotal = body.stationsTotal ?? current.terminais_total
  let maintenanceIndexes = normalizeMaintenanceIndexes(current.terminais_manutencao, stationsTotal)

  if (body.maintenanceTerminalIndexes) {
    maintenanceIndexes = normalizeMaintenanceIndexes(body.maintenanceTerminalIndexes, stationsTotal)
  } else if (body.status) {
    maintenanceIndexes = maintenanceIndexesForStatus(body.status, stationsTotal)
  }

  const nextStatus = body.status ?? current.estado_operacional
  const estadoOperacional = resolveOperationalStatus(nextStatus, stationsTotal, maintenanceIndexes)

  const patch: Record<string, unknown> = {
    terminais_manutencao: maintenanceIndexes,
    estado_operacional: estadoOperacional,
  }

  if (body.name) patch.nome = body.name
  if (body.cnes !== undefined) patch.cnes = body.cnes
  if (body.unitType) patch.tipo_unidade = body.unitType
  if (body.regionKey) patch.ra_chave = body.regionKey
  if (body.regionLabel) patch.ra_rotulo = body.regionLabel
  if (body.phone !== undefined) patch.telefone = body.phone
  if (body.dailyCapacity !== undefined) patch.capacidade_diaria = body.dailyCapacity
  if (body.specialties) patch.especialidades = body.specialties
  if (body.notes !== undefined) patch.notas = body.notes
  if (body.stationsTotal !== undefined) patch.terminais_total = body.stationsTotal
  if (body.address) patch.endereco = buildAddressPayload(body.address)

  const { error } = await supabaseAdmin
    .from('unidades_ubt')
    .update(patch)
    .eq('id', unitId)
    .eq('entidade_contratante_id', entidadeId)

  if (error) throw error

  if (body.responsible) {
    await upsertUnitResponsible(entidadeId, unitId, body.responsible)
  }

  return getRedeUnitDetail(entidadeId, unitId)
}

export async function deleteRedeUnit(entidadeId: string, unitId: string): Promise<void> {
  await assertUnitBelongsToEntity(entidadeId, unitId)

  const { error } = await supabaseAdmin
    .from('unidades_ubt')
    .update({ status: 'inativo' })
    .eq('id', unitId)
    .eq('entidade_contratante_id', entidadeId)

  if (error) throw error
}

export async function loadRedeUnitRows(entidadeId: string): Promise<UnidadeUbtRow[]> {
  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select(UNIT_SELECT)
    .eq('entidade_contratante_id', entidadeId)
    .eq('status', 'ativo')

  if (error) throw error
  return (data ?? []) as UnidadeUbtRow[]
}
