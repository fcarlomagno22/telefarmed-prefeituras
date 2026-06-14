import { supabaseAdmin } from '../../db/supabase.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import { loadActiveContratoIds } from '../ubt-agenda/ownership.js'
import { parseTimeToMinutes, slotVisibleToUbt, todayIsoInBrazil } from '../ubt-agenda/slot-utils.js'

type ProfissionalPlantaoRow = {
  status: string
  status_plantao: string
  online_ate: string | null
}

type EscalaSlotRow = {
  data: string
  hora_inicio: string
  hora_fim: string
  status: string
  contrato_entidade_id: string
  escopo_ubt: unknown
  modalidade: string
}

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? String((error as { code: unknown }).code) : ''
  const message = 'message' in error ? String((error as { message: unknown }).message) : ''
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /relation .* does not exist/i.test(message) ||
    /Could not find the table/i.test(message)
  )
}

function throwUnlessMissingRelation(error: unknown): void {
  if (!error) return
  if (!isMissingRelationError(error)) throw error
}

function currentMinutesInBrazil(now = new Date()): number {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)

  return parseTimeToMinutes(time)
}

function isWithinShift(horaInicio: string, horaFim: string, nowMinutes: number): boolean {
  const start = parseTimeToMinutes(horaInicio)
  const end = parseTimeToMinutes(horaFim)
  return nowMinutes >= start && nowMinutes < end
}

function slotMatchesScope(
  escopoUbt: unknown,
  modalidade: string,
  scopedUnitIds: Set<string>,
  singleUnitId?: string,
): boolean {
  if (singleUnitId) {
    return slotVisibleToUbt(escopoUbt, singleUnitId, modalidade)
  }

  const normalizedModalidade = modalidade.trim().toLowerCase()
  if (normalizedModalidade === 'tele' || normalizedModalidade === 'telemedicina') {
    return true
  }

  const scope =
    escopoUbt && typeof escopoUbt === 'object' && !Array.isArray(escopoUbt)
      ? (escopoUbt as { mode?: string; ubtIds?: string[]; unitIds?: string[] })
      : { mode: 'all' }

  if (scope.mode !== 'selected') return true

  const unitIds = [...(scope.ubtIds ?? scope.unitIds ?? [])].map(String)
  if (unitIds.length === 0) return true

  return unitIds.some((unitId) => scopedUnitIds.has(unitId))
}

function isHealthProfessionalOnline(
  profissional: ProfissionalPlantaoRow,
  hasActivePlantaoSession: boolean,
): boolean {
  if (profissional.status !== 'ativo') return false
  if (hasActivePlantaoSession) return true
  if (
    profissional.status_plantao === 'disponivel' ||
    profissional.status_plantao === 'em_atendimento'
  ) {
    return true
  }
  if (profissional.online_ate && Date.parse(profissional.online_ate) > Date.now()) {
    return true
  }
  return false
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

/**
 * Profissionais de saúde (médicos, fonos, enfermeiros etc.) em plantão e online
 * para a prefeitura — nunca operadores/recepcionistas de UBT.
 */
export async function countOnlineHealthProfessionals(
  entidadeId: string,
  visibleUnits: RedeUnitApi[],
  params: { unidadeUbtId?: string },
): Promise<number> {
  const scopedUnitIds = new Set(visibleUnits.map((unit) => unit.id))
  if (params.unidadeUbtId) {
    scopedUnitIds.clear()
    scopedUnitIds.add(params.unidadeUbtId)
  }

  const onlineIds = new Set<string>()
  const nowMinutes = currentMinutesInBrazil()
  const today = todayIsoInBrazil()

  let consultasQuery = supabaseAdmin
    .from('consultas')
    .select('profissional_id')
    .eq('entidade_contratante_id', entidadeId)
    .in('status', ['em_andamento', 'aguardando_medico'])
    .not('profissional_id', 'is', null)

  if (params.unidadeUbtId) {
    consultasQuery = consultasQuery.eq('unidade_ubt_id', params.unidadeUbtId)
  } else if (scopedUnitIds.size > 0) {
    consultasQuery = consultasQuery.in('unidade_ubt_id', [...scopedUnitIds])
  }

  const contratoIds = await loadActiveContratoIds(entidadeId)

  const [consultasResult, activeSessionsResult, plantoesResult] = await Promise.all([
    consultasQuery,
    supabaseAdmin
      .from('profissional_plantao_sessoes')
      .select('profissional_id, plantao_id')
      .is('ended_at', null),
    contratoIds.length > 0
      ? supabaseAdmin
          .from('escala_plantoes_confirmados')
          .select(
            `
            id,
            profissional_id,
            usuarios_profissionais!inner (
              id,
              status,
              status_plantao,
              online_ate
            ),
            escala_slots!inner (
              data,
              hora_inicio,
              hora_fim,
              status,
              contrato_entidade_id,
              escopo_ubt,
              modalidade
            )
          `,
          )
          .eq('status', 'confirmado')
          .eq('escala_slots.data', today)
          .eq('escala_slots.status', 'publicada')
          .in('escala_slots.contrato_entidade_id', contratoIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  throwUnlessMissingRelation(consultasResult.error)
  throwUnlessMissingRelation(activeSessionsResult.error)
  throwUnlessMissingRelation(plantoesResult.error)

  for (const row of consultasResult.data ?? []) {
    if (row.profissional_id) onlineIds.add(String(row.profissional_id))
  }

  const activeSessionByPlantao = new Map<string, string>()
  for (const row of activeSessionsResult.data ?? []) {
    activeSessionByPlantao.set(String(row.plantao_id), String(row.profissional_id))
  }

  for (const row of plantoesResult.data ?? []) {
    const plantaoId = String(row.id)
    const profissionalId = String(row.profissional_id)
    const slot = unwrapRelation(row.escala_slots as EscalaSlotRow | EscalaSlotRow[] | null)
    const profissional = unwrapRelation(
      row.usuarios_profissionais as ProfissionalPlantaoRow | ProfissionalPlantaoRow[] | null,
    )

    if (!slot || !profissional) continue
    if (!isWithinShift(String(slot.hora_inicio), String(slot.hora_fim), nowMinutes)) continue
    if (
      !slotMatchesScope(
        slot.escopo_ubt,
        String(slot.modalidade ?? 'tele'),
        scopedUnitIds,
        params.unidadeUbtId,
      )
    ) {
      continue
    }

    const hasActiveSession = activeSessionByPlantao.get(plantaoId) === profissionalId
    if (isHealthProfessionalOnline(profissional, hasActiveSession)) {
      onlineIds.add(profissionalId)
    }
  }

  return onlineIds.size
}
