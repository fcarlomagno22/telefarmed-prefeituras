/** Tipos base do módulo Treino Funcional — alinhados à migration vd_functional_training_core. */

export const FUNCTIONAL_TRAINING_MODES = ['single', 'circuit'] as const
export type FunctionalTrainingMode = (typeof FUNCTIONAL_TRAINING_MODES)[number]

/**
 * Catálogo estático do app (functionalExercises.ts).
 * Backend valida slugs contra esta lista; Lottie permanece no bundle do app.
 */
export const FUNCTIONAL_TRAINING_EXERCISE_IDS = [
  'abdominal-reverso',
  'afundo',
  'afundo-com-salto-alternado',
  'agachamento-com-alcance-acima-da-cabeca',
  'agachamento-com-chute',
  'agachamento-com-salto',
  'alongamento-cobra',
  'alongamento-ombros',
  'burpee-com-salto',
  'caminhada-abertura-quadril',
  'caminhada-com-maos',
  'circulos-abdominais-sentado',
  'extensao-pernas-livres',
  'flexao-bracos-abertos',
  'flexao-maos-alternadas',
  'flexao-militar',
  'prancha-toque-pes',
  'prancha-em-t',
  'socos-alternados',
  'subida-na-cadeira',
] as const

export type FunctionalTrainingExerciseId = (typeof FUNCTIONAL_TRAINING_EXERCISE_IDS)[number]

export type VdFunctionalTrainingPacienteScope = {
  pacienteId: string
  entidadeContratanteId: string
  cpf: string
}

export type FunctionalTrainingFavoritoRow = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  exercise_id: string
  criado_em: string
}

export type FunctionalTrainingSessaoRow = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  client_session_id: string
  modo: FunctionalTrainingMode
  duration_sec: number
  total_active_sec: number
  exercise_ids: string[]
  completed_at: string
  deleted_at: string | null
  criado_em: string
  atualizado_em: string
}
