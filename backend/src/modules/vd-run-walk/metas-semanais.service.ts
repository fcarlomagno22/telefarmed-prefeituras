import {
  buildEmptyMetasSemanaisDto,
  mapMetasSemanalRowToDto,
  resolveCurrentWeekStartDateKey,
  type RunWalkMetasSemanaisDto,
  type UpsertMetasSemanaisInput,
} from './metas-semanais.formatters.js'
import {
  findMetasSemanaisBySemana,
  upsertMetasSemanais,
} from './metas-semanais.repository.js'
import type { VdRunWalkPacienteScope } from './types.js'

export type MetasSemanaisServiceDeps = {
  findBySemana: typeof findMetasSemanaisBySemana
  upsert: typeof upsertMetasSemanais
  resolveWeekStart: typeof resolveCurrentWeekStartDateKey
}

const defaultDeps: MetasSemanaisServiceDeps = {
  findBySemana: findMetasSemanaisBySemana,
  upsert: upsertMetasSemanais,
  resolveWeekStart: resolveCurrentWeekStartDateKey,
}

export async function getRunWalkMetasSemanais(
  scope: VdRunWalkPacienteScope,
  now = new Date(),
  deps: MetasSemanaisServiceDeps = defaultDeps,
): Promise<RunWalkMetasSemanaisDto> {
  const weekStartDate = deps.resolveWeekStart(now)
  const row = await deps.findBySemana(scope, weekStartDate)

  if (!row) {
    return buildEmptyMetasSemanaisDto(weekStartDate)
  }

  return mapMetasSemanalRowToDto(row)
}

export async function putRunWalkMetasSemanais(
  scope: VdRunWalkPacienteScope,
  input: UpsertMetasSemanaisInput,
  now = new Date(),
  deps: MetasSemanaisServiceDeps = defaultDeps,
): Promise<RunWalkMetasSemanaisDto> {
  const weekStartDate = deps.resolveWeekStart(now)
  const row = await deps.upsert(scope, weekStartDate, input)
  return mapMetasSemanalRowToDto(row)
}
