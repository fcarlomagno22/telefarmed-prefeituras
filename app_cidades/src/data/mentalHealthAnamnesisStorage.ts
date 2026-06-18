import { engineContent } from '../mentalHealthEngine/content/loadEngineContent'
import type { AnamnesisAnswerRecord } from '../types/mentalHealthEngine'
import {
  loadMentalHealthClinicalState,
  mergeAnamnesisAnswersIntoClinicalState,
} from './mentalHealthClinicalStateStorage'
import { computeAnamnesisCompletion } from '../mentalHealthEngine/anamnesisScoring'

const MOCK_ANAMNESIS_FLAG_KEY = '@telefarmed/mental-health-mock-anamnesis-seeded'

function defaultAnswerForQuestion(question: (typeof engineContent.anamnesisModules.questions)[number]) {
  const now = new Date().toISOString()

  if (question.type === 'yes_no') {
    const isCrisis = question.clinical_sensitivity === 'crisis' && question.id.includes('suicide')
    return {
      value: isCrisis ? 'no' : 'no',
      answered_at: now,
      source: 'seed' as const,
      skipped: false,
    }
  }

  if (question.type === 'scale') {
    const isMood = (question.maps_to ?? []).some((token) =>
      ['low_mood', 'excessive_worry', 'emotional_distress', 'anhedonia'].includes(token),
    )
    return {
      value: isMood ? 2 : 1,
      answered_at: now,
      source: 'seed' as const,
      skipped: false,
    }
  }

  if (question.type === 'duration') {
    return {
      value: 21,
      answered_at: now,
      source: 'seed' as const,
      skipped: false,
    }
  }

  if (question.type === 'single') {
    const moderate = question.options?.find((option) =>
      ['moderate', 'often', 'mild', 'sometimes', 'yes'].includes(String(option.value)),
    )
    return {
      value: moderate?.value ?? question.options?.[0]?.value ?? 'none',
      answered_at: now,
      source: 'seed' as const,
      skipped: false,
    }
  }

  if (question.type === 'multi') {
    return {
      value: question.options?.[0]?.value ? [question.options[0].value] : [],
      answered_at: now,
      source: 'seed' as const,
      skipped: false,
    }
  }

  return {
    value: null,
    answered_at: now,
    source: 'seed' as const,
    skipped: true,
  }
}

export function buildMockAnamnesisAnswersIndex(): Record<string, AnamnesisAnswerRecord> {
  const answers: Record<string, AnamnesisAnswerRecord> = {}

  for (const question of engineContent.anamnesisModules.questions) {
    answers[question.id] = defaultAnswerForQuestion(question)
  }

  // Perfil moderado ansiedade + humor baixo para plano útil em dev.
  answers.q_core_01 = { value: 'moderate', answered_at: new Date().toISOString(), source: 'seed', skipped: false }
  answers.q_core_09 = { value: 2, answered_at: new Date().toISOString(), source: 'seed', skipped: false }
  answers.q_core_10 = { value: 2, answered_at: new Date().toISOString(), source: 'seed', skipped: false }
  answers.q_func_06 = { value: 2, answered_at: new Date().toISOString(), source: 'seed', skipped: false }
  answers.q_core_02 = { value: 'no', answered_at: new Date().toISOString(), source: 'seed', skipped: false }
  answers.q_core_03 = { value: 'no', answered_at: new Date().toISOString(), source: 'seed', skipped: false }
  answers.q_core_06 = { value: 'no', answered_at: new Date().toISOString(), source: 'seed', skipped: false }
  answers.q_core_07 = { value: 'no', answered_at: new Date().toISOString(), source: 'seed', skipped: false }

  return answers
}

export async function ensureMockAnamnesisForEngine(patientCpf: string) {
  const existing = await loadMentalHealthClinicalState(patientCpf)
  if (existing?.anamnesis.answers_index && Object.keys(existing.anamnesis.answers_index).length > 20) {
    return existing
  }

  const answersIndex = buildMockAnamnesisAnswersIndex()
  const completion = computeAnamnesisCompletion(answersIndex)

  return mergeAnamnesisAnswersIntoClinicalState(
    patientCpf,
    answersIndex,
    completion.completion_ratio,
    completion.completed_module_ids,
  )
}

export const MOCK_ANAMNESIS_STORAGE_KEY = MOCK_ANAMNESIS_FLAG_KEY
