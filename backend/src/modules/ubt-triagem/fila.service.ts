import { supabaseAdmin } from '../../db/supabase.js'
import { getUbtTriagemSpecialtyCatalog } from '../ubt-agenda/catalog.service.js'
import { assertConsultaBelongsToUnit } from '../ubt-agenda/ownership.js'
import { todayIsoInBrazil } from '../ubt-agenda/slot-utils.js'
import { UbtTriagemError } from './errors.js'
import { formatFilaEntryFromView } from './formatters.js'
import { assertFilaBelongsToUnit } from './ownership.js'
import type {
  FilaLiveResponseDto,
  FilaStatusUpdateDto,
  UbtScope,
  WaitingQueueEntryDto,
} from './types.js'

export { getUbtTriagemSpecialtyCatalog as getTriagemEspecialidadeCatalog }

const ACTIVE_FILA_STATUSES = ['aguardando', 'chamado', 'em_atendimento'] as const
const PRIORITY_WINDOW_MINUTES = 20
const INACTIVE_AGENDA_STATUSES = new Set(['cancelado', 'faltou'])

async function excludeFilaWithInactiveAgenda(
  entries: WaitingQueueEntryDto[],
): Promise<WaitingQueueEntryDto[]> {
  const appointmentIds = [
    ...new Set(entries.map((entry) => entry.appointmentId).filter(Boolean) as string[]),
  ]
  if (appointmentIds.length === 0) return entries

  const { data, error } = await supabaseAdmin
    .from('agenda_consultas')
    .select('id, status')
    .in('id', appointmentIds)

  if (error) throw error

  const inactiveAgendaIds = new Set(
    (data ?? [])
      .filter((row) => INACTIVE_AGENDA_STATUSES.has(String(row.status)))
      .map((row) => String(row.id)),
  )

  if (inactiveAgendaIds.size === 0) return entries

  return entries.filter(
    (entry) => !entry.appointmentId || !inactiveAgendaIds.has(entry.appointmentId),
  )
}

function parseAppointmentTimeToday(time: string, referenceDate: Date): Date {
  const [hours, minutes] = time.split(':').map((part) => Number(part))
  const slot = new Date(referenceDate)
  slot.setHours(hours, minutes, 0, 0)
  return slot
}

function minutesFromScheduledSlot(time: string, now: Date): number {
  const slot = parseAppointmentTimeToday(time, now)
  return Math.round((now.getTime() - slot.getTime()) / 60_000)
}

function isAppointmentSlotPriority(time: string, now: Date): boolean {
  const delta = minutesFromScheduledSlot(time, now)
  return delta >= -PRIORITY_WINDOW_MINUTES && delta <= PRIORITY_WINDOW_MINUTES
}

function prioritySortKey(entry: WaitingQueueEntryDto, now: Date): number {
  if (!entry.scheduledTime) return Number.POSITIVE_INFINITY
  const slotMs = parseAppointmentTimeToday(entry.scheduledTime, now).getTime()
  const lateMs = now.getTime() - slotMs
  if (lateMs > 0) return lateMs
  return slotMs + 1_000_000_000
}

function sortWaitingQueue(entries: WaitingQueueEntryDto[], now: Date): WaitingQueueEntryDto[] {
  return [...entries].sort((a, b) => {
    const aPriority = a.scheduledTime ? isAppointmentSlotPriority(a.scheduledTime, now) : false
    const bPriority = b.scheduledTime ? isAppointmentSlotPriority(b.scheduledTime, now) : false

    if (aPriority !== bPriority) {
      return aPriority ? -1 : 1
    }

    if (aPriority && bPriority) {
      return prioritySortKey(a, now) - prioritySortKey(b, now)
    }

    return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime()
  })
}

function computePriorityCount(entries: WaitingQueueEntryDto[], now: Date): number {
  return entries.filter(
    (entry) =>
      entry.status === 'aguardando' &&
      entry.scheduledTime &&
      isAppointmentSlotPriority(entry.scheduledTime, now),
  ).length
}

async function findActiveFilaForConsulta(agendaConsultaId: string) {
  const { data, error } = await supabaseAdmin
    .from('fila_espera')
    .select('id, status')
    .eq('agenda_consulta_id', agendaConsultaId)
    .in('status', [...ACTIVE_FILA_STATUSES])
    .maybeSingle()

  if (error) throw error
  return data as { id: string; status: string } | null
}

async function closeActiveFilaForConsulta(
  agendaConsultaId: string,
  unidadeUbtId: string,
): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('fila_espera')
    .update({
      status: 'desistiu',
      encerrado_em: now,
      atualizado_em: now,
    })
    .eq('agenda_consulta_id', agendaConsultaId)
    .eq('unidade_ubt_id', unidadeUbtId)
    .in('status', ['aguardando', 'chamado', 'em_atendimento'])

  if (error) throw error
}

/** Garante entrada na fila para consultas do dia já marcadas como aguardando na agenda. */
async function ensureFilaForAguardandoConsultas(scope: UbtScope): Promise<void> {
  const today = todayIsoInBrazil()

  const { data: consultas, error } = await supabaseAdmin
    .from('agenda_consultas')
    .select('id')
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('data', today)
    .eq('status', 'aguardando')

  if (error) throw error

  for (const consulta of consultas ?? []) {
    const consultaId = String(consulta.id)
    const activeFila = await findActiveFilaForConsulta(consultaId)
    if (activeFila) continue

    try {
      await checkInUbtFila(scope, consultaId)
    } catch (error) {
      if (error instanceof UbtTriagemError && error.code === 'PACIENTE_JA_NA_FILA') {
        continue
      }
      throw error
    }
  }
}

export async function syncFilaWithAgendaStatus(
  scope: UbtScope,
  agendaConsultaId: string,
  agendaStatus: string,
): Promise<void> {
  const activeFila = await findActiveFilaForConsulta(agendaConsultaId)

  if (agendaStatus === 'aguardando') {
    if (activeFila) {
      if (activeFila.status === 'chamado' || activeFila.status === 'em_atendimento') {
        const now = new Date().toISOString()
        const { error } = await supabaseAdmin
          .from('fila_espera')
          .update({
            status: 'aguardando',
            chamado_em: null,
            chamado_por_usuario_ubt_id: null,
            atendimento_inicio_em: null,
            atualizado_em: now,
          })
          .eq('id', activeFila.id)
          .eq('unidade_ubt_id', scope.unidadeUbtId)

        if (error) throw error
      }
      return
    }

    try {
      await checkInUbtFila(scope, agendaConsultaId)
    } catch (error) {
      if (!(error instanceof UbtTriagemError && error.code === 'PACIENTE_JA_NA_FILA')) {
        throw error
      }
    }
    return
  }

  if (!activeFila) {
    if (agendaStatus === 'em_atendimento') {
      const entry = await checkInUbtFila(scope, agendaConsultaId)
      await updateFilaStatus(scope, entry.id, 'em_atendimento')
    }
    return
  }

  if (agendaStatus === 'em_atendimento') {
    if (activeFila.status !== 'em_atendimento') {
      await updateFilaStatus(scope, activeFila.id, 'em_atendimento')
    }
    return
  }

  if (agendaStatus === 'realizado') {
    await updateFilaStatus(scope, activeFila.id, 'finalizado')
    return
  }

  if (agendaStatus === 'faltou' || agendaStatus === 'cancelado') {
    await updateFilaStatus(scope, activeFila.id, 'desistiu')
    return
  }

  if (agendaStatus === 'agendado') {
    await closeActiveFilaForConsulta(agendaConsultaId, scope.unidadeUbtId)
  }
}

export async function getFilaLive(scope: UbtScope): Promise<FilaLiveResponseDto> {
  await ensureFilaForAguardandoConsultas(scope)

  const serverTime = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('vw_ubt_fila_espera')
    .select('*')
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .in('status', [...ACTIVE_FILA_STATUSES])
    .order('chegada_em', { ascending: true })

  if (error) throw error

  const now = new Date(serverTime)
  let entries = (data ?? []).map((row) => formatFilaEntryFromView(row as Record<string, unknown>))
  entries = await excludeFilaWithInactiveAgenda(entries)

  return {
    entries,
    priorityCount: computePriorityCount(entries, now),
    serverTime,
  }
}

export async function checkInUbtFila(scope: UbtScope, agendaConsultaId: string) {
  const consulta = await assertConsultaBelongsToUnit(scope, agendaConsultaId)

  if (consulta.status !== 'aguardando' && consulta.status !== 'agendado') {
    throw new UbtTriagemError(
      'Consulta não elegível para check-in na fila.',
      'INVALID_STATUS',
      409,
    )
  }

  const { data: consultaRow, error: consultaError } = await supabaseAdmin
    .from('vw_ubt_agenda_consultas')
    .select('*')
    .eq('id', agendaConsultaId)
    .maybeSingle()

  if (consultaError) throw consultaError
  if (!consultaRow) {
    throw new UbtTriagemError('Consulta não encontrada.', 'NOT_FOUND', 404)
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('fila_espera')
    .select('*')
    .eq('agenda_consulta_id', agendaConsultaId)
    .in('status', [...ACTIVE_FILA_STATUSES])
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) {
    const { data: viewRow } = await supabaseAdmin
      .from('vw_ubt_fila_espera')
      .select('*')
      .eq('id', existing.id)
      .maybeSingle()

    return formatFilaEntryFromView(
      (viewRow ?? existing) as Record<string, unknown>,
      consultaRow as Record<string, unknown>,
    )
  }

  const { data: activeForPatient, error: activeForPatientError } = await supabaseAdmin
    .from('fila_espera')
    .select('id, agenda_consulta_id')
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('paciente_id', consultaRow.paciente_id)
    .in('status', [...ACTIVE_FILA_STATUSES])
    .maybeSingle()

  if (activeForPatientError) throw activeForPatientError
  if (activeForPatient) {
    throw new UbtTriagemError(
      'Paciente já está na fila de espera.',
      'PACIENTE_JA_NA_FILA',
      409,
    )
  }

  const origem = String(consultaRow.origem) === 'espontaneo' ? 'espontaneo' : 'agendado'

  const { data: inserted, error } = await supabaseAdmin
    .from('fila_espera')
    .insert({
      entidade_contratante_id: scope.entidadeContratanteId,
      unidade_ubt_id: scope.unidadeUbtId,
      paciente_id: consultaRow.paciente_id,
      agenda_consulta_id: agendaConsultaId,
      origem,
      status: 'aguardando',
      hora_agendada: consultaRow.hora,
      especialidade_id: consultaRow.especialidade_id,
      especialidade_nome: consultaRow.especialidade_nome,
      telefone_contato: consultaRow.telefone_contato || consultaRow.paciente_telefone || '',
      criado_por_usuario_ubt_id: scope.operadorId,
    })
    .select('*')
    .single()

  if (error) throw error
  if (!inserted) {
    throw new UbtTriagemError('Falha ao registrar check-in.', 'CREATE_FAILED', 500)
  }

  return formatFilaEntryFromView(
    inserted as Record<string, unknown>,
    consultaRow as Record<string, unknown>,
  )
}

async function reloadFilaEntry(filaId: string): Promise<WaitingQueueEntryDto> {
  const { data, error } = await supabaseAdmin
    .from('vw_ubt_fila_espera')
    .select('*')
    .eq('id', filaId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new UbtTriagemError('Entrada de fila não encontrada.', 'NOT_FOUND', 404)
  }

  return formatFilaEntryFromView(data as Record<string, unknown>)
}

async function demoteOtherCalledEntries(scope: UbtScope, exceptFilaId: string): Promise<void> {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('fila_espera')
    .update({
      status: 'aguardando',
      chamado_em: null,
      chamado_por_usuario_ubt_id: null,
      atualizado_em: now,
    })
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('status', 'chamado')
    .neq('id', exceptFilaId)

  if (error) throw error
}

export async function chamarFilaPaciente(
  scope: UbtScope,
  filaId: string,
): Promise<WaitingQueueEntryDto> {
  const row = await assertFilaBelongsToUnit(scope, filaId)
  const status = String(row.status)

  if (status === 'chamado' || status === 'em_atendimento') {
    return reloadFilaEntry(filaId)
  }

  if (status !== 'aguardando') {
    throw new UbtTriagemError(
      'Somente pacientes aguardando podem ser chamados.',
      'INVALID_STATUS',
      409,
    )
  }

  await demoteOtherCalledEntries(scope, filaId)

  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('fila_espera')
    .update({
      status: 'chamado',
      chamado_em: now,
      chamado_por_usuario_ubt_id: scope.operadorId,
      atualizado_em: now,
    })
    .eq('id', filaId)
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('status', 'aguardando')

  if (error) throw error

  return reloadFilaEntry(filaId)
}

export async function chamarFilaProximo(scope: UbtScope): Promise<WaitingQueueEntryDto> {
  const live = await getFilaLive(scope)
  const waiting = sortWaitingQueue(
    live.entries.filter((entry) => entry.status === 'aguardando'),
    new Date(live.serverTime),
  )

  const next = waiting[0]
  if (!next) {
    throw new UbtTriagemError('Não há pacientes aguardando na fila.', 'FILA_EMPTY', 409)
  }

  return chamarFilaPaciente(scope, next.id)
}

async function syncAgendaOnFilaStatus(
  agendaConsultaId: string | null | undefined,
  filaStatus: FilaStatusUpdateDto,
): Promise<void> {
  if (!agendaConsultaId) return

  let agendaStatus: string | null = null
  if (filaStatus === 'em_atendimento') {
    agendaStatus = 'em_atendimento'
  } else if (filaStatus === 'desistiu') {
    agendaStatus = 'cancelado'
  } else if (filaStatus === 'finalizado') {
    agendaStatus = 'realizado'
  }

  if (!agendaStatus) return

  await supabaseAdmin
    .from('agenda_consultas')
    .update({ status: agendaStatus })
    .eq('id', agendaConsultaId)
}

export async function updateFilaStatus(
  scope: UbtScope,
  filaId: string,
  status: FilaStatusUpdateDto,
): Promise<WaitingQueueEntryDto> {
  const row = await assertFilaBelongsToUnit(scope, filaId)
  const currentStatus = String(row.status)

  if (status === 'em_atendimento') {
    if (!ACTIVE_FILA_STATUSES.includes(currentStatus as (typeof ACTIVE_FILA_STATUSES)[number])) {
      throw new UbtTriagemError('Transição de status inválida.', 'INVALID_STATUS', 409)
    }
  } else if (currentStatus === 'finalizado' || currentStatus === 'desistiu') {
    throw new UbtTriagemError('Entrada de fila já encerrada.', 'INVALID_STATUS', 409)
  }

  const now = new Date().toISOString()
  const patch: Record<string, unknown> = {
    status,
    atualizado_em: now,
  }

  if (status === 'em_atendimento' && !row.atendimento_inicio_em) {
    patch.atendimento_inicio_em = now
  }

  if (status === 'finalizado' || status === 'desistiu') {
    patch.encerrado_em = now
  }

  const { error } = await supabaseAdmin
    .from('fila_espera')
    .update(patch)
    .eq('id', filaId)
    .eq('unidade_ubt_id', scope.unidadeUbtId)

  if (error) throw error

  await syncAgendaOnFilaStatus(
    row.agenda_consulta_id ? String(row.agenda_consulta_id) : null,
    status,
  )

  return reloadFilaEntry(filaId)
}
