import { VdFunctionalTrainingError } from './errors.js'
import {
  FUNCTIONAL_TRAINING_EXERCISE_IDS,
  type FunctionalTrainingExerciseId,
} from './types.js'

const EXERCISE_ID_SET = new Set<string>(FUNCTIONAL_TRAINING_EXERCISE_IDS)

export function isFunctionalTrainingExerciseId(
  exerciseId: string,
): exerciseId is FunctionalTrainingExerciseId {
  return EXERCISE_ID_SET.has(exerciseId)
}

export function assertFunctionalTrainingExerciseId(exerciseId: string): FunctionalTrainingExerciseId {
  const normalized = exerciseId.trim()
  if (!isFunctionalTrainingExerciseId(normalized)) {
    throw new VdFunctionalTrainingError(
      'Exercício inválido ou não disponível no catálogo.',
      'INVALID_DATA',
      400,
    )
  }

  return normalized
}

export function assertFunctionalTrainingExerciseIds(exerciseIds: string[]): FunctionalTrainingExerciseId[] {
  if (exerciseIds.length === 0) {
    throw new VdFunctionalTrainingError(
      'Informe ao menos um exercício válido.',
      'INVALID_DATA',
      400,
    )
  }

  return exerciseIds.map((exerciseId) => assertFunctionalTrainingExerciseId(exerciseId))
}
