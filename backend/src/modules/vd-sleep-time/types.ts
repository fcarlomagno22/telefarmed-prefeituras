/** Tipos base do módulo Hora de Dormir — alinhados à migration vd_sleep_time_core. */

export const SLEEP_QUALITY_SCORES = [1, 2, 3, 4, 5] as const
export type SleepQualityScore = (typeof SLEEP_QUALITY_SCORES)[number]

export type VdSleepTimePacienteScope = {
  pacienteId: string
  entidadeContratanteId: string
  cpf: string
}

/**
 * Formato local do app — espelha `SleepLogEntry` em app_cidades/src/types/sleepLog.ts.
 * Usado pelos helpers de mapeamento DTO ↔ app.
 */
export type AppSleepLogEntry = {
  id: string
  bedDateIso: string
  bedTimeMinutes: number
  wakeDateIso: string
  wakeTimeMinutes: number
  durationMinutes: number
  quality: SleepQualityScore
  wakeCount: number
  notes?: string
  createdAt: string
}

export type SleepTimeRegistroRow = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  client_log_id: string
  bed_at: string
  wake_at: string
  duration_minutes: number
  quality: SleepQualityScore
  wake_count: number
  notes: string | null
  deleted_at: string | null
  criado_em: string
  atualizado_em: string
}
