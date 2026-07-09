import type { VdFunctionalTrainingPacienteScope } from './types.js'

export type FunctionalTrainingFavoritosDto = {
  exerciseIds: string[]
}

export function buildFavoritosDto(exerciseIds: string[]): FunctionalTrainingFavoritosDto {
  return { exerciseIds }
}

export function mapFavoritoRowsToExerciseIds(
  rows: Array<{ exercise_id: string; criado_em: string }>,
): string[] {
  return [...rows]
    .sort((left, right) => right.criado_em.localeCompare(left.criado_em))
    .map((row) => row.exercise_id)
}

export type InsertFavoritoRow = {
  paciente_id: string
  entidade_contratante_id: string
  exercise_id: string
}

export function mapInsertFavoritoRow(
  scope: VdFunctionalTrainingPacienteScope,
  exerciseId: string,
): InsertFavoritoRow {
  return {
    paciente_id: scope.pacienteId,
    entidade_contratante_id: scope.entidadeContratanteId,
    exercise_id: exerciseId,
  }
}
