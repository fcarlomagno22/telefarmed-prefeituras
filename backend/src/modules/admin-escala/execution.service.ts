import { supabaseAdmin } from '../../db/supabase.js'
import { EscalaError } from './errors.js'
import type {
  AdminEscalaPlantaoExecutionDto,
  AdminEscalaShiftExecutionDetailDto,
  AdminEscalaShiftExecutionSummaryDto,
} from './types.js'

type PlantaoRow = {
  id: string
  slot_id: string
  profissional_id: string
  status: string
  confirmado_em: string
  usuarios_profissionais: { nome: string } | { nome: string }[] | null
}

type SessaoRow = {
  id: string
  plantao_id: string
  profissional_id: string
  entered_at: string
  ended_at: string | null
  summary: unknown
}

function parseProfissionalNome(raw: PlantaoRow['usuarios_profissionais']): string {
  if (!raw) return 'Profissional'
  const row = Array.isArray(raw) ? raw[0] : raw
  return String(row?.nome ?? 'Profissional')
}

function parseSessaoSummary(summary: unknown): {
  consultasAgendadas: number
  encaixes: number
  atendidos: number
  naoCompareceu: number
  desistiu: number
  tempoMedioMin: number | null
  duracaoPlantaoMin: number | null
  percentualOnline: number | null
  encerramentoFormal: boolean
} {
  const obj =
    summary && typeof summary === 'object' && !Array.isArray(summary)
      ? (summary as Record<string, unknown>)
      : {}

  return {
    consultasAgendadas: Number(obj.consultasAgendadas ?? obj.consultas_agendadas ?? 0),
    encaixes: Number(obj.encaixes ?? 0),
    atendidos: Number(obj.atendidos ?? obj.consultasConcluidas ?? 0),
    naoCompareceu: Number(obj.naoCompareceu ?? 0),
    desistiu: Number(obj.desistiu ?? 0),
    tempoMedioMin:
      obj.tempoMedioMin != null
        ? Number(obj.tempoMedioMin)
        : obj.tempo_medio_min != null
          ? Number(obj.tempo_medio_min)
          : null,
    duracaoPlantaoMin:
      obj.duracaoPlantaoMin != null
        ? Number(obj.duracaoPlantaoMin)
        : obj.duracao_plantao_min != null
          ? Number(obj.duracao_plantao_min)
          : null,
    percentualOnline:
      obj.percentualOnline != null
        ? Number(obj.percentualOnline)
        : obj.percentual_online != null
          ? Number(obj.percentual_online)
          : null,
    encerramentoFormal: Boolean(obj.encerramentoFormal ?? obj.encerramento_formal ?? false),
  }
}

export function computeSlotExecutionStatus(input: {
  slotStatus: string
  endAt: string
  assignmentMode: 'assigned' | 'open'
  hasTitular: boolean
  plantoes: Array<{ status: string }>
  sessions: Array<{ ended_at: string | null }>
}): AdminEscalaShiftExecutionSummaryDto['executionStatus'] {
  if (input.slotStatus === 'cancelada' || input.slotStatus === 'rascunho') {
    return 'na'
  }

  const activePlantoes = input.plantoes.filter((row) =>
    ['confirmado', 'realizado'].includes(row.status),
  )
  const realizadoCount = input.plantoes.filter((row) => row.status === 'realizado').length
  const hasActiveSession = input.sessions.some((row) => !row.ended_at)

  if (hasActiveSession) return 'em_andamento'

  if (realizadoCount > 0) {
    if (activePlantoes.length === 0 || realizadoCount >= activePlantoes.length) {
      return 'realizado'
    }
    return 'parcial'
  }

  const endMs = new Date(input.endAt).getTime()
  const hasLinkedDoctor =
    activePlantoes.length > 0 || (input.assignmentMode === 'assigned' && input.hasTitular)

  if (Number.isFinite(endMs) && endMs < Date.now() && hasLinkedDoctor) {
    return 'expirado'
  }

  if (hasLinkedDoctor) return 'agendado'
  return 'na'
}

function mapPlantaoExecution(
  plantao: PlantaoRow,
  sessao: SessaoRow | undefined,
): AdminEscalaPlantaoExecutionDto {
  const metrics = parseSessaoSummary(sessao?.summary)
  const plantaoEncerrado = plantao.status === 'realizado' || Boolean(sessao?.ended_at)

  return {
    plantaoId: plantao.id,
    profissionalId: plantao.profissional_id,
    profissionalNome: parseProfissionalNome(plantao.usuarios_profissionais),
    plantaoStatus: plantao.status as AdminEscalaPlantaoExecutionDto['plantaoStatus'],
    confirmadoEm: plantao.confirmado_em,
    enteredAt: sessao?.entered_at ?? null,
    endedAt: sessao?.ended_at ?? null,
    sessaoAtiva: Boolean(sessao && !sessao.ended_at),
    plantaoEncerrado,
    ...metrics,
  }
}

async function loadPlantoesBySlotIds(slotIds: string[]): Promise<Map<string, PlantaoRow[]>> {
  if (slotIds.length === 0) return new Map()

  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select(
      'id, slot_id, profissional_id, status, confirmado_em, usuarios_profissionais!inner(nome)',
    )
    .in('slot_id', slotIds)
    .in('status', ['confirmado', 'realizado', 'cancelado', 'falta_profissional'])

  if (error) throw error

  const map = new Map<string, PlantaoRow[]>()
  for (const row of data ?? []) {
    const slotId = String(row.slot_id)
    const current = map.get(slotId) ?? []
    current.push(row as PlantaoRow)
    map.set(slotId, current)
  }
  return map
}

async function loadSessoesBySlotIds(slotIds: string[]): Promise<Map<string, SessaoRow[]>> {
  if (slotIds.length === 0) return new Map()

  const { data, error } = await supabaseAdmin
    .from('profissional_plantao_sessoes')
    .select('id, plantao_id, profissional_id, entered_at, ended_at, summary, slot_id')
    .in('slot_id', slotIds)

  if (error) throw error

  const map = new Map<string, SessaoRow[]>()
  for (const row of data ?? []) {
    const slotId = String((row as SessaoRow & { slot_id: string }).slot_id)
    const current = map.get(slotId) ?? []
    current.push(row as SessaoRow)
    map.set(slotId, current)
  }
  return map
}

export async function loadExecutionSummariesForSlots(
  rows: Array<{
    id: string
    status: string
    fim_em: string
    modo_atribuicao: 'assigned' | 'open'
    profissional_titular_id: string | null
  }>,
): Promise<Map<string, AdminEscalaShiftExecutionSummaryDto>> {
  const slotIds = rows.map((row) => row.id)
  const [plantoesBySlot, sessoesBySlot] = await Promise.all([
    loadPlantoesBySlotIds(slotIds),
    loadSessoesBySlotIds(slotIds),
  ])

  const map = new Map<string, AdminEscalaShiftExecutionSummaryDto>()

  for (const row of rows) {
    const plantoes = plantoesBySlot.get(row.id) ?? []
    const sessions = sessoesBySlot.get(row.id) ?? []
    const realizadoCount = plantoes.filter((item) => item.status === 'realizado').length
    const confirmadoCount = plantoes.filter((item) => item.status === 'confirmado').length

    map.set(row.id, {
      executionStatus: computeSlotExecutionStatus({
        slotStatus: row.status,
        endAt: row.fim_em,
        assignmentMode: row.modo_atribuicao,
        hasTitular: Boolean(row.profissional_titular_id),
        plantoes,
        sessions,
      }),
      realizadoCount,
      confirmadoCount,
      totalPlantoes: plantoes.length,
    })
  }

  return map
}

const LOCKED_EXECUTION_STATUSES = new Set<AdminEscalaShiftExecutionSummaryDto['executionStatus']>([
  'em_andamento',
  'realizado',
])

export function isSlotExecutionLockedForAdminMutation(
  executionStatus: AdminEscalaShiftExecutionSummaryDto['executionStatus'],
): boolean {
  return LOCKED_EXECUTION_STATUSES.has(executionStatus)
}

export async function assertSlotsMutableForAdmin(shiftIds: string[]): Promise<void> {
  const uniqueIds = [...new Set(shiftIds.filter(Boolean))]
  if (uniqueIds.length === 0) return

  const { data, error } = await supabaseAdmin
    .from('vw_admin_escala_slots_listagem')
    .select('id, status, fim_em, modo_atribuicao, profissional_titular_id')
    .in('id', uniqueIds)

  if (error) throw error

  const rows = (data ?? []) as Array<{
    id: string
    status: string
    fim_em: string
    modo_atribuicao: 'assigned' | 'open'
    profissional_titular_id: string | null
  }>

  const executionBySlot = await loadExecutionSummariesForSlots(rows)

  for (const row of rows) {
    const summary = executionBySlot.get(String(row.id))
    if (summary && isSlotExecutionLockedForAdminMutation(summary.executionStatus)) {
      throw new EscalaError(
        'Plantões em andamento ou já realizados não podem ser editados, suspensos nem excluídos.',
        'CONFLICT',
        409,
      )
    }
  }
}

export async function getEscalaShiftExecution(
  slotId: string,
): Promise<AdminEscalaShiftExecutionDetailDto> {
  const { data: slot, error: slotError } = await supabaseAdmin
    .from('vw_admin_escala_slots_listagem')
    .select('id, status, inicio_em, fim_em, modo_atribuicao, profissional_titular_id')
    .eq('id', slotId)
    .maybeSingle()

  if (slotError) throw slotError
  if (!slot) {
    throw new EscalaError('Plantão não encontrado.', 'NOT_FOUND', 404)
  }

  const [plantoesBySlot, sessoesBySlot] = await Promise.all([
    loadPlantoesBySlotIds([slotId]),
    loadSessoesBySlotIds([slotId]),
  ])

  const plantoes = plantoesBySlot.get(slotId) ?? []
  const sessions = sessoesBySlot.get(slotId) ?? []
  const sessaoByPlantao = new Map(sessions.map((item) => [item.plantao_id, item]))

  const executionStatus = computeSlotExecutionStatus({
    slotStatus: String(slot.status),
    endAt: String(slot.fim_em),
    assignmentMode: slot.modo_atribuicao as 'assigned' | 'open',
    hasTitular: Boolean(slot.profissional_titular_id),
    plantoes,
    sessions,
  })

  return {
    slotId,
    scheduledStartAt: String(slot.inicio_em),
    scheduledEndAt: String(slot.fim_em),
    executionStatus,
    realizadoCount: plantoes.filter((item) => item.status === 'realizado').length,
    confirmadoCount: plantoes.filter((item) => item.status === 'confirmado').length,
    totalPlantoes: plantoes.length,
    plantoes: plantoes.map((plantao) => mapPlantaoExecution(plantao, sessaoByPlantao.get(plantao.id))),
  }
}
