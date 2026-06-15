import {
  FUNCTIONAL_EXERCISES,
  QUICK_WORKOUT_EXERCISE_IDS,
  getExerciseById,
} from '../data/functionalExercises'
import type {
  ExerciseFilterCategory,
  ExerciseFilterDifficulty,
  FunctionalExercise,
  FunctionalTrainingTab,
} from '../types/functionalTraining'
import { CIRCUIT_REST_SEC, CIRCUIT_WORK_SEC } from '../types/functionalTraining'

export function getDifficultyLabel(difficulty: FunctionalExercise['difficulty']) {
  switch (difficulty) {
    case 'iniciante':
      return 'Iniciante'
    case 'intermediario':
      return 'Intermediário'
    case 'avancado':
      return 'Avançado'
  }
}

export function getCategoryLabel(category: FunctionalExercise['categories'][number]) {
  switch (category) {
    case 'forca':
      return 'Força'
    case 'pernas':
      return 'Pernas'
    case 'core':
      return 'Core'
    case 'mobilidade':
      return 'Mobilidade'
    case 'cardio':
      return 'Cardio'
  }
}

export function getEquipmentLabel(equipment: FunctionalExercise['equipment']) {
  return equipment === 'chair' ? 'Cadeira' : 'Sem equipamento'
}

export function formatDurationLabel(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`
}

export function formatTimerDisplay(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function filterExercises(options: {
  query: string
  category: ExerciseFilterCategory
  difficulty: ExerciseFilterDifficulty
  tab: FunctionalTrainingTab
  favoriteIds: string[]
}): FunctionalExercise[] {
  const normalizedQuery = options.query.trim().toLowerCase()

  return FUNCTIONAL_EXERCISES.filter((exercise) => {
    if (options.tab === 'favorites' && !options.favoriteIds.includes(exercise.id)) {
      return false
    }

    if (
      options.category !== 'all' &&
      !exercise.categories.includes(options.category)
    ) {
      return false
    }

    if (options.difficulty !== 'all' && exercise.difficulty !== options.difficulty) {
      return false
    }

    if (!normalizedQuery) return true

    const haystack = [
      exercise.name,
      exercise.description,
      ...exercise.benefits,
      ...exercise.muscles,
      ...exercise.categories.map(getCategoryLabel),
      getDifficultyLabel(exercise.difficulty),
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })
}

export function getCategoryCounts(exercises: FunctionalExercise[]) {
  return {
    all: exercises.length,
    forca: exercises.filter((e) => e.categories.includes('forca')).length,
    pernas: exercises.filter((e) => e.categories.includes('pernas')).length,
    core: exercises.filter((e) => e.categories.includes('core')).length,
    mobilidade: exercises.filter((e) => e.categories.includes('mobilidade')).length,
    cardio: exercises.filter((e) => e.categories.includes('cardio')).length,
  }
}

export function buildQuickWorkoutExercises() {
  return QUICK_WORKOUT_EXERCISE_IDS.map((id) => getExerciseById(id)).filter(
    (exercise): exercise is FunctionalExercise => Boolean(exercise),
  )
}

export function getNextExerciseId(currentId: string, exerciseIds?: string[]) {
  const list = exerciseIds ?? FUNCTIONAL_EXERCISES.map((e) => e.id)
  const index = list.indexOf(currentId)
  if (index < 0 || index >= list.length - 1) return null
  return list[index + 1]
}

export function estimateCircuitDurationSec(exerciseCount: number) {
  if (exerciseCount <= 0) return 0
  const restBlocks = Math.max(exerciseCount - 1, 0)
  return exerciseCount * CIRCUIT_WORK_SEC + restBlocks * CIRCUIT_REST_SEC
}
