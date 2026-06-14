import { supabaseAdmin } from '../../db/supabase.js'
import { loadContratosBundleForEntidades } from '../admin-clientes/contratos.service.js'
import {
  formatScheduleDoctor,
  buildAgendaDaySummary,
  buildAgendaOperationalClimate,
  formatAgendaConsultaRow,
  formatAgendaConsultaRows,
  formatWeekdayLabel,
} from './formatters.js'
import { UbtAgendaError } from './errors.js'
import { loadActiveContratoIds } from './ownership.js'
import {
  addDaysIso,
  generateSlotTimes,
  isTimeBlocked,
  slotVisibleToUbt,
} from './slot-utils.js'
import type {
  AgendaDayDataDto,
  AgendaHistoryDayDto,
  DoctorOverviewDayDto,
  EscalaSlotCatalogRow,
  ScheduleDoctorDto,
  ScheduleTimeSlotDto,
  SpecialtyAvailabilityDto,
  UbtScope,
} from './types.js'

const ACTIVE_STATUSES = ['agendado', 'aguardando', 'em_atendimento', 'realizado'] as const

async function loadAuthorizedSpecialtyIds(scope: UbtScope): Promise<Map<string, string>> {
  const bundle = await loadContratosBundleForEntidades([scope.entidadeContratanteId])
  const contratos = bundle.contratosByEntidade.get(scope.entidadeContratanteId) ?? []
  const activeContratos = contratos.filter((c) => c.status === 'ativo' || c.status === 'implantacao')

  const specialtyMap = new Map<string, string>()
  for (const contrato of activeContratos) {
    for (const espId of contrato.detalhes?.especialidadesAutorizadas ?? []) {
      if (!specialtyMap.has(espId)) {
        specialtyMap.set(espId, espId)
      }
    }
  }

  if (specialtyMap.size === 0) return specialtyMap

  const ids = [...specialtyMap.keys()]
  const { data, error } = await supabaseAdmin
    .from('config_especialidades')
    .select('id, nome')
    .in('id', ids)

  if (error) throw error

  const named = new Map<string, string>()
  for (const row of data ?? []) {
    named.set(String(row.id), String(row.nome))
  }
  return named
}

async function loadEscalaRows(
  scope: UbtScope,
  dateFrom: string,
  dateTo: string,
  specialtyId?: string,
  profissionalId?: string,
): Promise<EscalaSlotCatalogRow[]> {
  const contratoIds = await loadActiveContratoIds(scope.entidadeContratanteId)
  if (contratoIds.length === 0) return []

  let query = supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select(
      `
      id,
      profissional_id,
      usuarios_profissionais!inner ( id, nome ),
      escala_slots!inner (
        id,
        data,
        hora_inicio,
        hora_fim,
        especialidade_id,
        modalidade,
        escopo_ubt,
        status,
        contrato_entidade_id,
        config_especialidades!inner ( id, nome )
      )
    `,
    )
    .in('status', ['confirmado', 'realizado'])
    .gte('escala_slots.data', dateFrom)
    .lte('escala_slots.data', dateTo)
    .eq('escala_slots.status', 'publicada')
    .in('escala_slots.contrato_entidade_id', contratoIds)

  if (specialtyId) {
    query = query.eq('escala_slots.especialidade_id', specialtyId)
  }

  if (profissionalId) {
    query = query.eq('profissional_id', profissionalId)
  }

  const { data, error } = await query
  if (error) throw error

  const rows: EscalaSlotCatalogRow[] = []

  for (const item of data ?? []) {
    const slotRaw = item.escala_slots as unknown
    const slot = Array.isArray(slotRaw) ? slotRaw[0] : slotRaw
    if (!slot || typeof slot !== 'object') continue

    const slotObj = slot as {
      id: string
      data: string
      hora_inicio: string
      hora_fim: string
      especialidade_id: string
      modalidade: string
      escopo_ubt: unknown
      config_especialidades?: { id: string; nome: string } | { id: string; nome: string }[] | null
    }

    if (
      !slotVisibleToUbt(slotObj.escopo_ubt, scope.unidadeUbtId, String(slotObj.modalidade ?? 'tele'))
    ) {
      continue
    }

    const profRaw = item.usuarios_profissionais as unknown
    const prof = Array.isArray(profRaw) ? profRaw[0] : profRaw
    const espRaw = slotObj.config_especialidades
    const esp = Array.isArray(espRaw) ? espRaw[0] : espRaw

    rows.push({
      slotId: String(slotObj.id),
      data: String(slotObj.data),
      hora_inicio: String(slotObj.hora_inicio),
      hora_fim: String(slotObj.hora_fim),
      especialidade_id: String(slotObj.especialidade_id),
      especialidade_nome: String(esp?.nome ?? ''),
      modalidade: String(slotObj.modalidade ?? 'tele'),
      escopo_ubt: slotObj.escopo_ubt,
      profissional_id: String(item.profissional_id),
      profissional_nome: String((prof as { nome?: string })?.nome ?? 'Profissional'),
    })
  }

  return rows
}

async function loadBookedTimes(
  scope: UbtScope,
  profissionalId: string,
  data: string,
  excludeConsultaId?: string,
): Promise<Set<string>> {
  const { data: rows, error } = await supabaseAdmin
    .from('agenda_consultas')
    .select('id, hora')
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('profissional_id', profissionalId)
    .eq('data', data)
    .in('status', [...ACTIVE_STATUSES])

  if (error) throw error

  const booked = new Set<string>()
  for (const row of rows ?? []) {
    if (excludeConsultaId && String(row.id) === excludeConsultaId) continue
    const match = /^(\d{2}:\d{2})/.exec(String(row.hora))
    if (match) booked.add(match[1]!)
  }
  return booked
}

async function loadBlocks(
  scope: UbtScope,
  profissionalId: string,
  data: string,
): Promise<Array<{ hora_inicio: string; hora_fim: string }>> {
  const { data: rows, error } = await supabaseAdmin
    .from('agenda_bloqueios')
    .select('hora_inicio, hora_fim')
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('data', data)
    .or(`profissional_id.eq.${profissionalId},profissional_id.is.null`)

  if (error) throw error
  return (rows ?? []) as Array<{ hora_inicio: string; hora_fim: string }>
}

function countAvailableSlotsForRows(
  rows: EscalaSlotCatalogRow[],
  scope: UbtScope,
  bookedByProfDate: Map<string, Set<string>>,
  blocksByProfDate: Map<string, Array<{ hora_inicio: string; hora_fim: string }>>,
): number {
  let total = 0

  for (const row of rows) {
    const key = `${row.profissional_id}|${row.data}`
    const booked = bookedByProfDate.get(key) ?? new Set<string>()
    const blocks = blocksByProfDate.get(key) ?? []
    const times = generateSlotTimes(row.hora_inicio, row.hora_fim)

    for (const time of times) {
      if (booked.has(time)) continue
      if (isTimeBlocked(time, blocks)) continue
      total += 1
    }
  }

  void scope
  return total
}

async function preloadAvailabilityMaps(
  scope: UbtScope,
  rows: EscalaSlotCatalogRow[],
): Promise<{
  bookedByProfDate: Map<string, Set<string>>
  blocksByProfDate: Map<string, Array<{ hora_inicio: string; hora_fim: string }>>
}> {
  const bookedByProfDate = new Map<string, Set<string>>()
  const blocksByProfDate = new Map<string, Array<{ hora_inicio: string; hora_fim: string }>>()

  const uniqueKeys = new Set(rows.map((row) => `${row.profissional_id}|${row.data}`))

  await Promise.all(
    [...uniqueKeys].map(async (key) => {
      const [profissionalId, data] = key.split('|')
      if (!profissionalId || !data) return
      const [booked, blocks] = await Promise.all([
        loadBookedTimes(scope, profissionalId, data),
        loadBlocks(scope, profissionalId, data),
      ])
      bookedByProfDate.set(key, booked)
      blocksByProfDate.set(key, blocks)
    }),
  )

  return { bookedByProfDate, blocksByProfDate }
}

export async function getUbtAgendaDay(scope: UbtScope, date: string): Promise<AgendaDayDataDto> {
  const { data, error } = await supabaseAdmin
    .from('vw_ubt_agenda_consultas')
    .select('*')
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('data', date)
    .neq('status', 'cancelado')
    .order('hora', { ascending: true })

  if (error) throw error

  const appointments = await formatAgendaConsultaRows(
    (data ?? []) as Parameters<typeof formatAgendaConsultaRow>[0][],
  )

  return {
    appointments,
    summary: buildAgendaDaySummary(appointments),
    operationalClimate: buildAgendaOperationalClimate(appointments),
  }
}

export async function getUbtAgendaWeek(
  scope: UbtScope,
  from: string,
  to: string,
): Promise<Record<string, AgendaDayDataDto>> {
  const week: Record<string, AgendaDayDataDto> = {}
  let cursor = from

  while (cursor <= to) {
    week[cursor] = await getUbtAgendaDay(scope, cursor)
    cursor = addDaysIso(cursor, 1)
  }

  return week
}

export async function getUbtAgendaMonthIndicators(
  scope: UbtScope,
  year: number,
  month: number,
): Promise<string[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabaseAdmin
    .from('agenda_consultas')
    .select('data')
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .gte('data', start)
    .lte('data', end)
    .neq('status', 'cancelado')

  if (error) throw error

  return [...new Set((data ?? []).map((row) => String(row.data)))].sort()
}

export async function getUbtAgendaHistory(
  scope: UbtScope,
  date: string,
  count: number,
): Promise<AgendaHistoryDayDto[]> {
  const history: AgendaHistoryDayDto[] = []

  for (let index = 1; index <= count; index += 1) {
    const historyDate = addDaysIso(date, -index)
    const day = await getUbtAgendaDay(scope, historyDate)
    history.push({
      id: historyDate,
      weekdayLabel: formatWeekdayLabel(historyDate),
      total: day.summary.total,
      completed: day.summary.completed,
      noShows: day.summary.noShows,
    })
  }

  return history
}

export async function listUbtAgendaMedicos(
  scope: UbtScope,
  params: { specialtyId?: string; date?: string },
): Promise<ScheduleDoctorDto[]> {
  const date = params.date ?? addDaysIso(new Date().toISOString().slice(0, 10), 0)
  const rows = await loadEscalaRows(scope, date, date, params.specialtyId)

  const byProf = new Map<string, ScheduleDoctorDto>()
  for (const row of rows) {
    if (!byProf.has(row.profissional_id)) {
      byProf.set(
        row.profissional_id,
        formatScheduleDoctor({
          id: row.profissional_id,
          nome: row.profissional_nome,
          specialtyId: row.especialidade_id,
          specialtyName: row.especialidade_nome,
        }),
      )
    }
  }

  return [...byProf.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function listUbtAgendaDoctorSlots(
  scope: UbtScope,
  profissionalId: string,
  date: string,
  excludeConsultaId?: string,
): Promise<ScheduleTimeSlotDto[]> {
  const rows = await loadEscalaRows(scope, date, date, undefined, profissionalId)
  if (rows.length === 0) return []

  const booked = await loadBookedTimes(scope, profissionalId, date, excludeConsultaId)
  const blocks = await loadBlocks(scope, profissionalId, date)

  const slots: ScheduleTimeSlotDto[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    for (const time of generateSlotTimes(row.hora_inicio, row.hora_fim)) {
      if (seen.has(time)) continue
      seen.add(time)

      const unavailable = booked.has(time) || isTimeBlocked(time, blocks)
      slots.push({
        time,
        available: !unavailable,
        bookedReason: unavailable ? (booked.has(time) ? 'Horário ocupado' : 'Bloqueado') : undefined,
      })
    }
  }

  return slots.sort((a, b) => a.time.localeCompare(b.time, 'pt-BR'))
}

export async function getUbtAgendaDoctorOverview(
  scope: UbtScope,
  profissionalId: string,
  from: string,
  days: number,
): Promise<DoctorOverviewDayDto[]> {
  const to = addDaysIso(from, days - 1)
  const rows = await loadEscalaRows(scope, from, to, undefined, profissionalId)
  const { bookedByProfDate, blocksByProfDate } = await preloadAvailabilityMaps(scope, rows)

  const overview: DoctorOverviewDayDto[] = []
  let cursor = from

  while (cursor <= to) {
    const dayRows = rows.filter((row) => row.data === cursor)
    const availableSlots = countAvailableSlotsForRows(
      dayRows,
      scope,
      bookedByProfDate,
      blocksByProfDate,
    )

    overview.push({
      date: cursor,
      worksThisDay: dayRows.length > 0,
      availableSlots,
    })

    cursor = addDaysIso(cursor, 1)
  }

  return overview
}

export async function countUbtAgendaSpecialtySlots(
  scope: UbtScope,
  specialtyId: string,
  date: string,
): Promise<number> {
  const rows = await loadEscalaRows(scope, date, date, specialtyId)
  const { bookedByProfDate, blocksByProfDate } = await preloadAvailabilityMaps(scope, rows)
  return countAvailableSlotsForRows(rows, scope, bookedByProfDate, blocksByProfDate)
}

export async function listUbtAgendaSpecialtyAvailability(
  scope: UbtScope,
  date: string,
): Promise<SpecialtyAvailabilityDto[]> {
  const authorized = await loadAuthorizedSpecialtyIds(scope)
  const rows = await loadEscalaRows(scope, date, date)
  const { bookedByProfDate, blocksByProfDate } = await preloadAvailabilityMaps(scope, rows)

  const bySpecialty = new Map<string, SpecialtyAvailabilityDto>()

  for (const [id, name] of authorized.entries()) {
    const specialtyRows = rows.filter((row) => row.especialidade_id === id)
    bySpecialty.set(id, {
      id,
      name,
      availableSlots: countAvailableSlotsForRows(
        specialtyRows,
        scope,
        bookedByProfDate,
        blocksByProfDate,
      ),
    })
  }

  for (const row of rows) {
    if (!bySpecialty.has(row.especialidade_id)) {
      bySpecialty.set(row.especialidade_id, {
        id: row.especialidade_id,
        name: row.especialidade_nome,
        availableSlots: countAvailableSlotsForRows(
          rows.filter((item) => item.especialidade_id === row.especialidade_id),
          scope,
          bookedByProfDate,
          blocksByProfDate,
        ),
      })
    }
  }

  return [...bySpecialty.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function assertSlotAvailable(
  scope: UbtScope,
  profissionalId: string,
  data: string,
  hora: string,
  excludeConsultaId?: string,
): Promise<void> {
  const slots = await listUbtAgendaDoctorSlots(scope, profissionalId, data, excludeConsultaId)
  const match = slots.find((slot) => slot.time === hora)
  if (!match?.available) {
    throw new UbtAgendaError('Horário indisponível para agendamento.', 'SLOT_UNAVAILABLE', 409)
  }
}

export async function getUbtTriagemSpecialtyCatalog(
  scope: UbtScope,
  date: string,
): Promise<{
  contratoId: string | null
  date: string
  specialties: Array<{
    id: string
    name: string
    availableSlots: number
    available: boolean
  }>
}> {
  const contratoIds = await loadActiveContratoIds(scope.entidadeContratanteId)
  const availability = await listUbtAgendaSpecialtyAvailability(scope, date)

  return {
    contratoId: contratoIds[0] ?? null,
    date,
    specialties: availability.map((item) => ({
      id: item.id,
      name: item.name,
      availableSlots: item.availableSlots,
      available: item.availableSlots > 0,
    })),
  }
}
