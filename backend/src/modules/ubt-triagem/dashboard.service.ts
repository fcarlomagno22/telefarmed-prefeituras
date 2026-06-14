import { supabaseAdmin } from '../../db/supabase.js'
import { isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { slotVisibleToUbt, todayIsoInBrazil } from '../ubt-agenda/slot-utils.js'
import { loadActiveContratoIds } from '../ubt-agenda/ownership.js'
import type { UbtScope } from './types.js'

export type UbtTriagemDashboardDto = {
  unit: {
    id: string
    unitName: string
    stationLabel: string
    regionLabel: string | null
    operationalState: string | null
    activeTerminals: number
    totalTerminals: number
  }
  kpis: Array<{
    id: string
    title: string
    value: string
    subtext: string
    subtextClass: string
    iconTone: 'orange' | 'green' | 'red'
    sparkline?: number[]
    isAlert?: boolean
  }>
  filaResumo: {
    items: Array<{
      label: string
      count: number
      tone: 'orange' | 'green' | 'red'
      progress: number
    }>
    priorityCount: number
    avgWaitMinutes: number
    serverTime: string
  }
  serverTime: string
  consultasHoje: []
}

function startOfTodaySaoPauloIso(): string {
  const today = todayIsoInBrazil()
  return `${today}T03:00:00.000Z`
}

function minutesBetween(fromIso: string, toIso: string): number {
  return Math.max(0, Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 60_000))
}

function progressFromCount(count: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(100, Math.round((count / max) * 100))
}

async function countDoctorsOnShiftToday(scope: UbtScope, date: string): Promise<number> {
  const contratoIds = await loadActiveContratoIds(scope.entidadeContratanteId)
  if (contratoIds.length === 0) return 0

  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select(
      `
      profissional_id,
      escala_slots!inner (
        modalidade,
        escopo_ubt,
        status,
        contrato_entidade_id,
        data
      )
    `,
    )
    .in('status', ['confirmado', 'realizado'])
    .eq('escala_slots.data', date)
    .eq('escala_slots.status', 'publicada')
    .in('escala_slots.contrato_entidade_id', contratoIds)

  if (error) throw error

  const profissionais = new Set<string>()
  for (const row of data ?? []) {
    const slotRaw = row.escala_slots as unknown
    const slot = (Array.isArray(slotRaw) ? slotRaw[0] : slotRaw) as {
      modalidade: string
      escopo_ubt: unknown
    } | null
    if (!slot) continue
    if (!slotVisibleToUbt(slot.escopo_ubt, scope.unidadeUbtId, slot.modalidade)) continue
    profissionais.add(String(row.profissional_id))
  }

  return profissionais.size
}

async function loadConsultasToday(
  scope: UbtScope,
  todayStart: string,
): Promise<Array<{ status: string }>> {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select('status')
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .gte('criado_em', todayStart)

  if (error) {
    if (isMissingSupabaseResource(error, 'consultas')) {
      return []
    }
    throw error
  }

  return data ?? []
}

export async function getTriagemDashboard(
  scope: UbtScope,
  operadorNome: string,
): Promise<UbtTriagemDashboardDto> {
  const serverTime = new Date().toISOString()
  const todayStart = startOfTodaySaoPauloIso()
  const today = todayIsoInBrazil()

  const [
    unitResult,
    filaResult,
    consultasResult,
    doctorsOnShift,
    filaWaitSamples,
    chamadoAntigos,
  ] = await Promise.all([
    supabaseAdmin
      .from('unidades_ubt')
      .select('id, nome, estado_operacional, terminais_total, terminais_manutencao, endereco')
      .eq('id', scope.unidadeUbtId)
      .eq('entidade_contratante_id', scope.entidadeContratanteId)
      .maybeSingle(),
    supabaseAdmin
      .from('fila_espera')
      .select('status, prioridade, chegada_em, chamado_em, hora_agendada')
      .eq('unidade_ubt_id', scope.unidadeUbtId)
      .eq('entidade_contratante_id', scope.entidadeContratanteId)
      .in('status', ['aguardando', 'chamado', 'em_atendimento']),
    loadConsultasToday(scope, todayStart),
    countDoctorsOnShiftToday(scope, today),
    supabaseAdmin
      .from('fila_espera')
      .select('chegada_em, chamado_em')
      .eq('unidade_ubt_id', scope.unidadeUbtId)
      .eq('entidade_contratante_id', scope.entidadeContratanteId)
      .gte('chegada_em', todayStart)
      .not('chamado_em', 'is', null),
    supabaseAdmin
      .from('fila_espera')
      .select('id')
      .eq('unidade_ubt_id', scope.unidadeUbtId)
      .eq('entidade_contratante_id', scope.entidadeContratanteId)
      .eq('status', 'chamado')
      .lt('chamado_em', new Date(Date.now() - 15 * 60_000).toISOString()),
  ])

  if (unitResult.error) throw unitResult.error
  if (filaResult.error) throw filaResult.error
  if (filaWaitSamples.error) throw filaWaitSamples.error
  if (chamadoAntigos.error) throw chamadoAntigos.error

  const unitRow = unitResult.data
  const filaRows = filaResult.data ?? []
  const consultaRows = consultasResult

  const waitingCount = filaRows.filter((row) => row.status === 'aguardando').length
  const calledCount = filaRows.filter((row) => row.status === 'chamado').length
  const inAttendanceCount = filaRows.filter((row) => row.status === 'em_atendimento').length
  const queueActive = waitingCount + calledCount

  const consultasInProgress = consultaRows.filter(
    (row) => row.status === 'em_andamento' || row.status === 'aguardando_medico',
  ).length
  const consultasCompleted = consultaRows.filter((row) => row.status === 'concluida').length

  const waitSamples = (filaWaitSamples.data ?? []).map((row) =>
    minutesBetween(String(row.chegada_em), String(row.chamado_em)),
  )
  const avgWaitMinutes =
    waitSamples.length > 0
      ? Math.round(waitSamples.reduce((sum, value) => sum + value, 0) / waitSamples.length)
      : queueActive > 0
        ? Math.round(
            filaRows
              .filter((row) => row.status === 'aguardando')
              .reduce((sum, row) => sum + minutesBetween(String(row.chegada_em), serverTime), 0) /
              Math.max(1, waitingCount),
          )
        : 0

  const totalTerminals = Number(unitRow?.terminais_total ?? 2)
  const maintenanceCount = Array.isArray(unitRow?.terminais_manutencao)
    ? unitRow.terminais_manutencao.length
    : 0
  const activeTerminals = Math.max(1, totalTerminals - maintenanceCount)

  const endereco = unitRow?.endereco as { bairro?: string; cidade?: string } | null
  const regionLabel =
    endereco?.bairro && endereco?.cidade
      ? `${endereco.bairro} — ${endereco.cidade}`
      : endereco?.cidade ?? null

  const alertsCount = (chamadoAntigos.data ?? []).length

  const maxFlow = Math.max(queueActive, consultasInProgress, consultasCompleted, 1)

  return {
    unit: {
      id: String(unitRow?.id ?? scope.unidadeUbtId),
      unitName: String(unitRow?.nome ?? 'Unidade UBT'),
      stationLabel: operadorNome ? `Terminal — ${operadorNome.split(' ')[0]}` : 'Terminal principal',
      regionLabel,
      operationalState: unitRow?.estado_operacional ? String(unitRow.estado_operacional) : 'ativa',
      activeTerminals,
      totalTerminals,
    },
    kpis: [
      {
        id: 'waiting',
        title: 'Pacientes Aguardando',
        value: String(waitingCount),
        subtext: calledCount > 0 ? `${calledCount} chamado(s) aguardando chegada` : 'Na fila agora',
        subtextClass: 'text-gray-500',
        iconTone: 'orange',
      },
      {
        id: 'in-progress',
        title: 'Consultas em Andamento',
        value: String(Math.max(consultasInProgress, inAttendanceCount)),
        subtext: `${inAttendanceCount} na triagem`,
        subtextClass: 'text-gray-500',
        iconTone: 'orange',
      },
      {
        id: 'doctors',
        title: 'Médicos no Plantão',
        value: String(doctorsOnShift),
        subtext: 'escala de hoje',
        subtextClass: 'text-gray-500',
        iconTone: 'green',
      },
      {
        id: 'wait-time',
        title: 'Tempo Médio de Espera',
        value: `${avgWaitMinutes} min`,
        subtext: 'até a chamada',
        subtextClass: avgWaitMinutes > 30 ? 'text-red-600' : 'text-emerald-600',
        iconTone: 'orange',
      },
      {
        id: 'alerts',
        title: 'Alertas Importantes',
        value: String(alertsCount),
        subtext: alertsCount > 0 ? 'Chamadas pendentes há +15 min' : 'Nenhum alerta',
        subtextClass: alertsCount > 0 ? 'text-[var(--brand-primary)] font-medium' : 'text-gray-500',
        iconTone: 'red',
        isAlert: alertsCount > 0,
      },
    ],
    filaResumo: {
      items: [
        {
          label: 'Aguardando',
          count: waitingCount,
          tone: 'orange',
          progress: progressFromCount(waitingCount, maxFlow),
        },
        {
          label: 'Em andamento',
          count: Math.max(consultasInProgress, inAttendanceCount),
          tone: 'orange',
          progress: progressFromCount(Math.max(consultasInProgress, inAttendanceCount), maxFlow),
        },
        {
          label: 'Concluídas hoje',
          count: consultasCompleted,
          tone: 'green',
          progress: progressFromCount(consultasCompleted, maxFlow),
        },
        {
          label: 'Chamadas pendentes',
          count: calledCount,
          tone: 'red',
          progress: progressFromCount(calledCount, maxFlow),
        },
      ],
      priorityCount: filaRows.filter((row) => row.prioridade > 0).length,
      avgWaitMinutes,
      serverTime,
    },
    serverTime,
    consultasHoje: [],
  }
}
