import { useCallback } from 'react'
import {
  loadMentalHealthClinicalState,
  mergeAnamnesisAnswersIntoClinicalState,
  mergeAnamnesisModuleAnswers,
  persistPartialAnamnesisAnswers,
} from '../data/mentalHealthClinicalStateStorage'
import { recalculateClinicalEngine } from '../mentalHealthEngine'
import type { AnamnesisAnswerRecord, UserClinicalState } from '../types/mentalHealthEngine'

export function useMentalHealthAnamnesisActions(patientCpf: string) {
  const loadInitialAnswers = useCallback(async () => {
    const state = await loadMentalHealthClinicalState(patientCpf)
    return state?.anamnesis.answers_index ?? {}
  }, [patientCpf])

  /** Salva resposta parcial — recálculo clínico só ao fechar módulo ou concluir anamnese. */
  const persistAnswers = useCallback(
    async (answers: Record<string, AnamnesisAnswerRecord>) => {
      await persistPartialAnamnesisAnswers(patientCpf, answers)
    },
    [patientCpf],
  )

  const completeModule = useCallback(
    async (
      moduleAnswers: Record<string, AnamnesisAnswerRecord>,
      completionRatio: number,
      completedModuleIds: string[],
    ) => {
      await mergeAnamnesisModuleAnswers(
        patientCpf,
        moduleAnswers,
        completionRatio,
        completedModuleIds,
      )
      await recalculateClinicalEngine(patientCpf, 'anamnesis')
    },
    [patientCpf],
  )

  const completeAnamnesis = useCallback(
    async (
      allAnswers: Record<string, AnamnesisAnswerRecord>,
      completionRatio: number,
      completedModuleIds: string[],
    ) => {
      await mergeAnamnesisAnswersIntoClinicalState(
        patientCpf,
        allAnswers,
        completionRatio,
        completedModuleIds,
      )
      const result = await recalculateClinicalEngine(patientCpf, 'anamnesis')
      return result.state
    },
    [patientCpf],
  )

  return {
    loadInitialAnswers,
    persistAnswers,
    completeModule,
    completeAnamnesis,
  }
}
