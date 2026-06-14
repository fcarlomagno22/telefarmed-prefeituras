import { supabaseAdmin } from '../../db/supabase.js'
import {
  ageFromBirthDateIso,
  escapeIlikeTerm,
  mapListagemToPatient,
  readEnderecoField,
  type ListagemRow,
} from '../admin-pacientes/formatters.js'
import { loadRecentActivityPatientIds } from './filtros.service.js'
import { mapAdminPatientToUbtPatient } from './formatters.js'
import type { ListUbtPacientesQuery, UbtPacienteDto, UbtPacientesListResponse } from './types.js'

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

function buildBaseQuery(entidadeId: string) {
  return supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('*')
    .eq('entidade_contratante_id', entidadeId)
    .neq('status', 'inativo')
}

function applyDbFilters(query: ReturnType<typeof buildBaseQuery>, params: ListUbtPacientesQuery) {
  let next = query

  if (params.search?.trim()) {
    const term = `%${escapeIlikeTerm(params.search.trim())}%`
    next = next.or(`nome.ilike.${term},cpf.ilike.${term},telefone.ilike.${term}`)
  }

  if (params.gender && params.gender !== 'all') {
    next = next.eq('sexo', params.gender)
  }

  return next
}

function readContactsCount(row: ListagemRow): number {
  if (!Array.isArray(row.contato_emergencia)) return 0
  return row.contato_emergencia.filter(
    (item) => typeof item === 'object' && item !== null,
  ).length
}

function matchesIncompleteData(
  row: UbtPacienteDto,
  filters: Array<'no_phone' | 'no_email' | 'no_emergency_contact'>,
): boolean {
  return filters.every((key) => {
    if (key === 'no_phone') return !row.phone?.trim()
    if (key === 'no_email') return row.missingFields?.includes('e-mail') ?? false
    return row.missingFields?.includes('contato de emergência') ?? false
  })
}

function matchesNewUsers(row: UbtPacienteDto, filter: ListUbtPacientesQuery['newUsers']): boolean {
  if (!filter || filter === 'all') return true
  const registered = row.registeredAt
  const match = registered.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return false
  const [, day, month, year] = match
  const created = new Date(Number(year), Number(month) - 1, Number(day))
  const now = new Date()

  if (filter === 'this_month') {
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }

  const diffMs = now.getTime() - created.getTime()
  return diffMs >= 0 && diffMs <= 30 * 86_400_000
}

function matchesLastAppointment(
  row: UbtPacienteDto,
  filter: ListUbtPacientesQuery['lastAppointment'],
): boolean {
  if (!filter || filter === 'all') return true
  if (filter === 'never') return row.lastAppointmentDate === '—'
  if (filter === 'inactive') {
    return row.totalAppointments === 0 || row.lastAppointmentDate === '—'
  }

  const iso = row.lastAppointmentDate === '—' ? null : parseBrDateToIso(row.lastAppointmentDate)
  if (!iso) return false
  const date = new Date(`${iso}T12:00:00`)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)

  if (filter === 'today') return diffDays === 0
  if (filter === '7d') return diffDays <= 7
  if (filter === '30d') return diffDays <= 30
  if (filter === '90d') return diffDays <= 90
  return true
}

function parseBrDateToIso(value: string): string | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

function matchesTotalAppointments(
  row: UbtPacienteDto,
  filter: ListUbtPacientesQuery['totalAppointments'],
): boolean {
  if (!filter || filter === 'all') return true
  if (filter === 'inactive') return row.totalAppointments === 0
  if (filter === 'low') return row.totalAppointments >= 1 && row.totalAppointments <= 3
  return row.totalAppointments >= 4
}

function matchesAgeGroup(row: UbtPacienteDto, filter: ListUbtPacientesQuery['ageGroup']): boolean {
  if (!filter || filter === 'all') return true
  if (filter === '0-17') return row.age <= 17
  if (filter === '18-29') return row.age >= 18 && row.age <= 29
  if (filter === '30-59') return row.age >= 30 && row.age <= 59
  return row.age >= 60
}

function matchesInactiveConsultation(
  row: UbtPacienteDto,
  filter: ListUbtPacientesQuery['inactiveConsultation'],
): boolean {
  if (!filter || filter === 'all') return true
  const months = row.monthsWithoutConsultation
  if (filter === 'never') return months == null
  if (filter === '6m') return (months ?? 0) >= 6
  if (filter === '12m') return (months ?? 0) >= 12
  return true
}

function applyMemoryFilters(
  rows: UbtPacienteDto[],
  params: ListUbtPacientesQuery,
  recentActivityIds?: Set<string>,
): UbtPacienteDto[] {
  let filtered = rows

  if (params.bairros?.length) {
    const allowed = new Set(params.bairros)
    filtered = filtered.filter((row) => allowed.has(row.bairro))
  }

  if (params.registrationUnits?.length) {
    const allowed = new Set(params.registrationUnits)
    filtered = filtered.filter((row) => allowed.has(row.firstAttendanceUnit))
  }

  if (params.recentActivityOnly && recentActivityIds) {
    filtered = filtered.filter((row) => recentActivityIds.has(row.id))
  }

  if (params.ageGroup && params.ageGroup !== 'all') {
    filtered = filtered.filter((row) => matchesAgeGroup(row, params.ageGroup))
  }

  if (params.newUsers && params.newUsers !== 'all') {
    filtered = filtered.filter((row) => matchesNewUsers(row, params.newUsers))
  }

  if (params.lastAppointment && params.lastAppointment !== 'all') {
    filtered = filtered.filter((row) => matchesLastAppointment(row, params.lastAppointment))
  }

  if (params.totalAppointments && params.totalAppointments !== 'all') {
    filtered = filtered.filter((row) => matchesTotalAppointments(row, params.totalAppointments))
  }

  if (params.incompleteData?.length) {
    filtered = filtered.filter((row) => matchesIncompleteData(row, params.incompleteData!))
  }

  if (params.inactiveConsultation && params.inactiveConsultation !== 'all') {
    filtered = filtered.filter((row) =>
      matchesInactiveConsultation(row, params.inactiveConsultation),
    )
  }

  if (params.dataQuality === 'complete') {
    filtered = filtered.filter((row) => row.dataQuality === 'complete')
  } else if (params.dataQuality === 'incomplete') {
    filtered = filtered.filter((row) => row.dataQuality === 'incomplete')
  }

  return filtered
}

function sortRows(rows: UbtPacienteDto[], sortBy: ListUbtPacientesQuery['sortBy']): UbtPacienteDto[] {
  const sorted = [...rows]
  switch (sortBy) {
    case 'name_desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'))
      break
    case 'registered_asc':
      sorted.sort((a, b) => a.registeredAt.localeCompare(b.registeredAt, 'pt-BR'))
      break
    case 'registered_desc':
      sorted.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt, 'pt-BR'))
      break
    case 'last_appointment_asc':
      sorted.sort((a, b) =>
        parseBrDateToIso(a.lastAppointmentDate)?.localeCompare(
          parseBrDateToIso(b.lastAppointmentDate) ?? '',
        ) ?? 0,
      )
      break
    case 'last_appointment_desc':
      sorted.sort((a, b) =>
        parseBrDateToIso(b.lastAppointmentDate)?.localeCompare(
          parseBrDateToIso(a.lastAppointmentDate) ?? '',
        ) ?? 0,
      )
      break
    case 'total_appointments_asc':
      sorted.sort((a, b) => a.totalAppointments - b.totalAppointments)
      break
    case 'total_appointments_desc':
      sorted.sort((a, b) => b.totalAppointments - a.totalAppointments)
      break
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }
  return sorted
}

export async function listUbtPacientes(
  entidadeId: string,
  params: ListUbtPacientesQuery = {},
): Promise<UbtPacientesListResponse> {
  const { data, error } = await applyDbFilters(buildBaseQuery(entidadeId), params)
  if (error) throw error

  const listRows = (data ?? []) as ListagemRow[]
  const statsMap = await loadConsultationStats(listRows.map((row) => row.id))
  const recentActivityIds = params.recentActivityOnly
    ? await loadRecentActivityPatientIds(entidadeId)
    : undefined

  let mapped = listRows.map((row) =>
    mapAdminPatientToUbtPatient(mapListagemToPatient(row, statsMap.get(row.id))),
  )

  mapped = applyMemoryFilters(mapped, params, recentActivityIds)
  const sorted = sortRows(mapped, params.sortBy)

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

export async function listDistinctBairros(entidadeId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('endereco')
    .eq('entidade_contratante_id', entidadeId)
    .neq('status', 'inativo')

  if (error) throw error

  const bairros = new Set<string>()
  for (const row of data ?? []) {
    const endereco = row.endereco as Record<string, unknown> | null
    const bairro = readEnderecoField(endereco, 'bairro').trim()
    if (bairro) bairros.add(bairro)
  }

  return Array.from(bairros).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export { loadConsultationStats }

export function ageFromListagemRow(row: ListagemRow): number {
  return ageFromBirthDateIso(row.data_nascimento.slice(0, 10))
}

export function contactsCountFromListagemRow(row: ListagemRow): number {
  return readContactsCount(row)
}
