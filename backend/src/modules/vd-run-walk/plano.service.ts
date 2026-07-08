import { resolveTodayDateKeyInAppTz } from './disposicao.formatters.js'
import { VdRunWalkError } from './errors.js'
import {
  buildPlanoHojeDto,
  buildUpsertPlanoFromMenuAction,
  buildUpsertPlanoFromPutInput,
  resolvePlanoActionNotice,
  type RunWalkPlanoAcaoResultDto,
  type RunWalkPlanoHojeDto,
  type UpsertPlanoHojeInput,
} from './plano.formatters.js'
import { findPlanoDiarioByDate, upsertPlanoDiario } from './plano.repository.js'
import type { RunWalkActivityMenuAction, VdRunWalkPacienteScope } from './types.js'

export type PlanoServiceDeps = {
  resolveTodayDateKey: typeof resolveTodayDateKeyInAppTz
  findPlanoByDate: typeof findPlanoDiarioByDate
  upsertPlano: typeof upsertPlanoDiario
}

const defaultDeps: PlanoServiceDeps = {
  resolveTodayDateKey: resolveTodayDateKeyInAppTz,
  findPlanoByDate: findPlanoDiarioByDate,
  upsertPlano: upsertPlanoDiario,
}

export async function getRunWalkPlanoHoje(
  scope: VdRunWalkPacienteScope,
  now = new Date(),
  deps: PlanoServiceDeps = defaultDeps,
): Promise<RunWalkPlanoHojeDto> {
  const planoDate = deps.resolveTodayDateKey(now)
  const row = await deps.findPlanoByDate(scope, planoDate)
  return buildPlanoHojeDto(row)
}

export async function putRunWalkPlanoHoje(
  scope: VdRunWalkPacienteScope,
  input: UpsertPlanoHojeInput,
  now = new Date(),
  deps: PlanoServiceDeps = defaultDeps,
): Promise<RunWalkPlanoHojeDto> {
  const planoDate = deps.resolveTodayDateKey(now)
  const existing = await deps.findPlanoByDate(scope, planoDate)

  let payload
  try {
    payload = buildUpsertPlanoFromPutInput(existing, input)
  } catch (error) {
    if (error instanceof VdRunWalkError) throw error
    throw new VdRunWalkError('Não foi possível atualizar o plano de hoje.', 'INVALID_DATA')
  }

  const row = await deps.upsertPlano(scope, planoDate, payload)
  return buildPlanoHojeDto(row)
}

export async function postRunWalkPlanoHojeAcao(
  scope: VdRunWalkPacienteScope,
  action: RunWalkActivityMenuAction,
  now = new Date(),
  deps: PlanoServiceDeps = defaultDeps,
): Promise<RunWalkPlanoAcaoResultDto> {
  const planoDate = deps.resolveTodayDateKey(now)
  const existing = await deps.findPlanoByDate(scope, planoDate)

  if (!existing) {
    throw new VdRunWalkError('Nenhum plano de hoje encontrado.', 'NOT_FOUND', 404)
  }

  const payload = buildUpsertPlanoFromMenuAction(existing, action, now.toISOString())
  const row = await deps.upsertPlano(scope, planoDate, payload)

  return {
    ...buildPlanoHojeDto(row),
    notice: resolvePlanoActionNotice(action),
  }
}
