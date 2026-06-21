import { withCatalogCache } from '../../lib/cache/catalogCache.js'
import { supabaseAdmin } from '../../db/supabase.js'
import {
  isRh3Configured,
  rh3GetScheduleAvailability,
  rh3ListEspecialidades,
} from '../../lib/rh3/index.js'
import {
  formatRh3ProfessionalName,
  formatRh3ScheduleHour,
} from '../../lib/rh3/formatters.js'
import { isRh3ImmediateMtSpecialtyName, isPediatriaSpecialtyName, isClinicaGeralSpecialtyName } from '../../lib/rh3/walkInSpecialty.js'
import type { UbtScope } from '../ubt-pacientes/types.js'
import { UbtRh3Error } from './errors.js'
import { loadAuthorizedSpecialtyOrigemMap } from './origem.service.js'

export type Rh3MtSpecialtyCatalogItem = {
  id: string
  name: string
  availableSlots: number
  available: boolean
  origemAtendimento: 'mt'
  rh3EspecialidadId?: number
}

function normalizeSpecialtyName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function findRh3SpecialtyForLocal(
  localName: string,
  rh3Specialties: Array<{ id_especialidad: number; especialidad: string }>,
): { id_especialidad: number; especialidad: string } | undefined {
  const normalizedLocal = normalizeSpecialtyName(localName)

  const exact = rh3Specialties.find(
    (item) => normalizeSpecialtyName(item.especialidad) === normalizedLocal,
  )
  if (exact) return exact

  if (isPediatriaSpecialtyName(localName)) {
    return rh3Specialties.find(
      (item) => normalizeSpecialtyName(item.especialidad) === 'pediatria',
    )
  }

  if (isClinicaGeralSpecialtyName(localName)) {
    return rh3Specialties.find((item) => {
      const normalizedRh3 = normalizeSpecialtyName(item.especialidad)
      return normalizedRh3 === 'clinica geral' || normalizedRh3 === 'clinico geral'
    })
  }

  return rh3Specialties.find((item) => {
    const normalizedRh3 = normalizeSpecialtyName(item.especialidad)
    return normalizedRh3 === normalizedLocal
  })
}

async function loadAuthorizedMtSpecialtyNames(
  scope: UbtScope,
): Promise<Map<string, { id: string; name: string }>> {
  const origemMap = await loadAuthorizedSpecialtyOrigemMap(scope.entidadeContratanteId)
  const mtIds = [...origemMap.entries()]
    .filter(([, origem]) => origem === 'mt')
    .map(([id]) => id)

  if (mtIds.length === 0) return new Map()

  const { data, error } = await supabaseAdmin
    .from('config_especialidades')
    .select('id, nome')
    .in('id', mtIds)

  if (error) throw error

  const byNormalizedName = new Map<string, { id: string; name: string }>()
  for (const row of data ?? []) {
    const item = { id: String(row.id), name: String(row.nome) }
    byNormalizedName.set(normalizeSpecialtyName(item.name), item)
  }

  return byNormalizedName
}

async function countRh3AvailabilityForDate(
  rh3EspecialidadId: number,
  date: string,
): Promise<number> {
  const response = await rh3GetScheduleAvailability(rh3EspecialidadId, { date, language: 'PT' })
  return response.data.available_appointments.length
}

function ubtSpecialtiesCacheKey(scope: UbtScope, suffix: string): string {
  return `${scope.entidadeContratanteId}:${scope.unidadeUbtId}:${suffix}`
}

export async function listRh3MtSpecialtiesForSchedule(
  scope: UbtScope,
): Promise<Rh3MtSpecialtyCatalogItem[]> {
  return withCatalogCache('ubt-specialties', ubtSpecialtiesCacheKey(scope, 'rh3-schedule'), () =>
    buildRh3MtSpecialtyCatalog(scope),
  )
}

export async function listRh3MtSpecialtiesForUbt(
  scope: UbtScope,
  date: string,
): Promise<Rh3MtSpecialtyCatalogItem[]> {
  return withCatalogCache('ubt-specialties', ubtSpecialtiesCacheKey(scope, `rh3:${date}`), () =>
    buildRh3MtSpecialtyCatalog(scope, date),
  )
}

async function buildRh3MtSpecialtyCatalog(
  scope: UbtScope,
  countSlotsForDate?: string,
): Promise<Rh3MtSpecialtyCatalogItem[]> {
  if (!isRh3Configured()) {
    throw new UbtRh3Error(
      'Integração RH3 não configurada. Defina RH3_API_BASE_URL, RH3_CLIENT_ID e RH3_CLIENT_SECRET.',
      'RH3_NOT_CONFIGURED',
      503,
    )
  }

  const localByName = await loadAuthorizedMtSpecialtyNames(scope)
  if (localByName.size === 0) return []

  const rh3Response = await rh3ListEspecialidades('PT')
  const rh3Specialties = rh3Response.data.especialidades ?? []

  const items: Rh3MtSpecialtyCatalogItem[] = []
  const matchedLocalIds = new Set<string>()

  for (const rh3Item of rh3Specialties) {
    const local = localByName.get(normalizeSpecialtyName(rh3Item.especialidad))
    if (!local) continue

    matchedLocalIds.add(local.id)

    let availableSlots = 0
    let available = true

    if (isRh3ImmediateMtSpecialtyName(local.name)) {
      availableSlots = 1
      available = true
    } else if (countSlotsForDate) {
      try {
        availableSlots = await countRh3AvailabilityForDate(rh3Item.id_especialidad, countSlotsForDate)
      } catch {
        availableSlots = 0
      }
      available = availableSlots > 0
    }

    items.push({
      id: local.id,
      name: local.name,
      availableSlots,
      available,
      origemAtendimento: 'mt',
      rh3EspecialidadId: rh3Item.id_especialidad,
    })
  }

  for (const local of localByName.values()) {
    if (matchedLocalIds.has(local.id)) continue

    const rh3Match = findRh3SpecialtyForLocal(local.name, rh3Specialties)
    const immediate = isRh3ImmediateMtSpecialtyName(local.name)

    items.push({
      id: local.id,
      name: local.name,
      availableSlots: immediate ? (rh3Match ? 1 : 0) : 0,
      available: immediate ? Boolean(rh3Match) : false,
      origemAtendimento: 'mt',
      rh3EspecialidadId: rh3Match?.id_especialidad,
    })
  }

  return items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function getRh3ScheduleAvailabilityForUbt(
  rh3EspecialidadId: number,
  filter: {
    date?: string
    date_from?: string
    language?: string
  },
) {
  if (!isRh3Configured()) {
    throw new UbtRh3Error(
      'Integração RH3 não configurada.',
      'RH3_NOT_CONFIGURED',
      503,
    )
  }

  const response = await rh3GetScheduleAvailability(rh3EspecialidadId, {
    ...filter,
    language: filter.language ?? 'PT',
  })

  return {
    appointments: response.data.available_appointments.map((item) => ({
      idTurno: item.id,
      date: item.date,
      hour: formatRh3ScheduleHour(item.hour),
      length: item.length,
      professionalId: item.professional_id ?? null,
      professionalName: formatRh3ProfessionalName(item.professional),
      specialtyId: item.specialty_id ?? rh3EspecialidadId,
      specialtyName: item.specialty ?? null,
    })),
    timestamp: response.data.timestamp,
  }
}
