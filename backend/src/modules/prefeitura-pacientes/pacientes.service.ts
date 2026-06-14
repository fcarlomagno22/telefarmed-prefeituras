import { normalizeCpf } from '../../lib/cpf.js'
import { supabaseAdmin } from '../../db/supabase.js'
import {
  createPaciente,
  getPacienteDetail,
  updatePaciente,
} from '../admin-pacientes/pacientes.service.js'
import {
  escapeIlikeTerm,
  mapListagemToPatient,
  readEnderecoField,
  type ListagemRow,
} from '../admin-pacientes/formatters.js'
import { mapAdminDetailToPrefeituraDetail, mapAdminPatientToPrefeituraPatient } from './formatters.js'
import { assertPacienteBelongsToEntity, assertUbtBelongsToEntity } from './ownership.js'
import type {
  CreatePrefeituraPacienteInput,
  ListPrefeituraPacientesQuery,
  PrefeituraMunicipalPatientDetailDto,
  PrefeituraMunicipalPatientDto,
  PrefeituraPacientesListResponse,
  UpdatePrefeituraPacienteInput,
} from './types.js'

async function loadConsultationStats(
  pacienteIds: string[],
): Promise<Map<string, { totalAppointments: number; lastAppointmentIso: string | null }>> {
  const stats = new Map<string, { totalAppointments: number; lastAppointmentIso: string | null }>()
  if (pacienteIds.length === 0) return stats

  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select('paciente_id, criado_em, finalizada_em, status')
    .in('paciente_id', pacienteIds)
    .order('criado_em', { ascending: false })

  if (error) {
    if (error.code === 'PGRST205') return stats
    throw error
  }

  for (const row of data ?? []) {
    const pacienteId = String(row.paciente_id)
    const current = stats.get(pacienteId) ?? { totalAppointments: 0, lastAppointmentIso: null }
    current.totalAppointments += 1
    if (!current.lastAppointmentIso) {
      current.lastAppointmentIso = String(row.finalizada_em ?? row.criado_em)
    }
    stats.set(pacienteId, current)
  }

  return stats
}

function buildListQuery(entidadeId: string, params: ListPrefeituraPacientesQuery) {
  let query = supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('*')
    .eq('entidade_contratante_id', entidadeId)
    .order('criado_em', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.cpf?.trim()) {
    query = query.eq('cpf', normalizeCpf(params.cpf))
  }

  const nomeTerm = params.nome?.trim() || params.search?.trim()
  if (nomeTerm) {
    const term = `%${escapeIlikeTerm(nomeTerm)}%`
    query = query.or(`nome.ilike.${term},cpf.ilike.${term}`)
  }

  const ubtIds = [
    ...(params.unidadeUbtIds ?? []),
    ...(params.unidadeUbtId ? [params.unidadeUbtId] : []),
  ]
  if (ubtIds.length === 1) {
    query = query.eq('unidade_ubt_principal_id', ubtIds[0])
  } else if (ubtIds.length > 1) {
    query = query.in('unidade_ubt_principal_id', ubtIds)
  }

  return query
}

function applyMemoryFilters(
  rows: PrefeituraMunicipalPatientDto[],
  params: ListPrefeituraPacientesQuery,
): PrefeituraMunicipalPatientDto[] {
  let filtered = rows

  if (params.bairros?.length) {
    const allowed = new Set(params.bairros)
    filtered = filtered.filter((row) => allowed.has(row.bairro))
  }

  if (params.inactiveConsultation === '6m') {
    filtered = filtered.filter((row) => (row.monthsWithoutConsultation ?? 0) >= 6)
  } else if (params.inactiveConsultation === '12m') {
    filtered = filtered.filter((row) => (row.monthsWithoutConsultation ?? 0) >= 12)
  } else if (params.inactiveConsultation === 'never') {
    filtered = filtered.filter((row) => row.monthsWithoutConsultation == null)
  }

  if (params.dataQuality === 'complete') {
    filtered = filtered.filter((row) => row.dataQuality === 'complete')
  } else if (params.dataQuality === 'incomplete') {
    filtered = filtered.filter((row) => row.dataQuality === 'incomplete')
  }

  return filtered
}

function sortPatients(
  rows: PrefeituraMunicipalPatientDto[],
  sortBy: ListPrefeituraPacientesQuery['sortBy'],
): PrefeituraMunicipalPatientDto[] {
  const sorted = [...rows]
  switch (sortBy) {
    case 'name_desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'))
      break
    case 'registered_desc':
      sorted.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt, 'pt-BR'))
      break
    case 'registered_asc':
      sorted.sort((a, b) => a.registeredAt.localeCompare(b.registeredAt, 'pt-BR'))
      break
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }
  return sorted
}

export async function listPrefeituraPacientes(
  entidadeId: string,
  params: ListPrefeituraPacientesQuery = {},
): Promise<PrefeituraPacientesListResponse> {
  const { data, error } = await buildListQuery(entidadeId, params)
  if (error) throw error

  const listRows = (data ?? []) as ListagemRow[]
  const statsMap = await loadConsultationStats(listRows.map((row) => row.id))
  const mapped = listRows.map((row) =>
    mapAdminPatientToPrefeituraPatient(mapListagemToPatient(row, statsMap.get(row.id))),
  )

  const filtered = applyMemoryFilters(mapped, params)
  const sorted = sortPatients(filtered, params.sortBy)

  const page = params.page && params.page > 0 ? params.page : 1
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize

  return {
    rows: sorted.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  }
}

export async function getPrefeituraPacienteDetail(
  entidadeId: string,
  pacienteId: string,
): Promise<PrefeituraMunicipalPatientDetailDto> {
  await assertPacienteBelongsToEntity(entidadeId, pacienteId)
  const detail = await getPacienteDetail(pacienteId)
  return mapAdminDetailToPrefeituraDetail(detail)
}

export async function createPrefeituraPaciente(
  entidadeId: string,
  input: CreatePrefeituraPacienteInput,
): Promise<PrefeituraMunicipalPatientDetailDto> {
  if (input.unidadeUbtId) {
    await assertUbtBelongsToEntity(entidadeId, input.unidadeUbtId)
  }

  const detail = await createPaciente({
    ...input,
    entidadeContratanteId: entidadeId,
  })
  return mapAdminDetailToPrefeituraDetail(detail)
}

export async function updatePrefeituraPaciente(
  entidadeId: string,
  pacienteId: string,
  input: UpdatePrefeituraPacienteInput & { unidadeUbtId?: string },
): Promise<PrefeituraMunicipalPatientDetailDto> {
  await assertPacienteBelongsToEntity(entidadeId, pacienteId)

  if (input.unidadeUbtId) {
    await assertUbtBelongsToEntity(entidadeId, input.unidadeUbtId)
    const { error } = await supabaseAdmin.from('paciente_vinculos_ubt').upsert(
      {
        paciente_id: pacienteId,
        unidade_ubt_id: input.unidadeUbtId,
        principal: true,
      },
      { onConflict: 'paciente_id,unidade_ubt_id' },
    )
    if (error) throw error
  }

  const { unidadeUbtId: _ignored, ...patch } = input
  const detail = await updatePaciente(pacienteId, patch)
  return mapAdminDetailToPrefeituraDetail(detail)
}

export async function listDistinctBairros(entidadeId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('endereco')
    .eq('entidade_contratante_id', entidadeId)

  if (error) throw error

  const bairros = new Set<string>()
  for (const row of data ?? []) {
    const endereco = row.endereco as Record<string, unknown> | null
    const bairro = readEnderecoField(endereco, 'bairro').trim()
    if (bairro) bairros.add(bairro)
  }

  return Array.from(bairros).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
