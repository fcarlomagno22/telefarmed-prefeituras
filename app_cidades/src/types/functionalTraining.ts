import type { AnimationObject } from 'lottie-react-native'

export type ExerciseDifficulty = 'iniciante' | 'intermediario' | 'avancado'

export type ExerciseCategory = 'forca' | 'pernas' | 'core' | 'mobilidade' | 'cardio'

export type FunctionalTrainingTab = 'all' | 'favorites'

export type ExerciseFilterCategory = ExerciseCategory | 'all'

export type ExerciseFilterDifficulty = ExerciseDifficulty | 'all'

export type FunctionalExercise = {
  id: string
  name: string
  lottie: AnimationObject
  difficulty: ExerciseDifficulty
  categories: ExerciseCategory[]
  durationDefaultSec: number
  description: string
  benefits: string[]
  steps: string[]
  tips: string[]
  muscles: string[]
  equipment: 'none' | 'chair'
}

export type TimerPhase = 'idle' | 'countdown' | 'work' | 'rest' | 'completed'

export type WorkoutMode = 'single' | 'circuit'

export type WorkoutSessionRecord = {
  id: string
  patientCpf: string
  exerciseIds: string[]
  mode: WorkoutMode
  durationSec: number
  completedAtIso: string
  totalActiveSec: number
}

export type WeeklyTrainingStats = {
  sessionsCount: number
  totalActiveMinutes: number
  uniqueExercises: number
}

export const FUNCTIONAL_DURATION_OPTIONS = [15, 30, 45, 60] as const
export type FunctionalDurationSec = (typeof FUNCTIONAL_DURATION_OPTIONS)[number]

export const CIRCUIT_WORK_SEC = 30
export const CIRCUIT_REST_SEC = 10
export const CIRCUIT_EXERCISE_COUNT = 5
