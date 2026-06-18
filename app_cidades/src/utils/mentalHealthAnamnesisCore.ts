import { engineContent } from '../mentalHealthEngine/content/loadEngineContent'
import type { AnamnesisAnswerRecord } from '../types/mentalHealthEngine'

/** Bloco inicial obrigatório — 11 perguntas (~3 min). */
export const INITIAL_ANAMNESIS_QUESTION_IDS = [
  'q_core_01',
  'q_core_02',
  'q_core_03',
  'q_core_09',
  'q_core_10',
  'q_core_11',
  'q_core_12',
  'q_func_06',
  'q_sleep_01',
  'q_sleep_02',
  'q_core_15',
] as const

export type AnamnesisDrawerMode = 'initial' | 'extended'

const initialIdSet = new Set<string>(INITIAL_ANAMNESIS_QUESTION_IDS)

function isAnswered(questionId: string, answersIndex: Record<string, AnamnesisAnswerRecord>) {
  const question = engineContent.anamnesisModules.questions.find((item) => item.id === questionId)
  if (!question) return false

  const answer = answersIndex[questionId]
  if (!answer || answer.skipped || answer.value == null) return false
  if (question.type === 'multi') return Array.isArray(answer.value) && answer.value.length > 0
  return true
}

export function isInitialAnamnesisComplete(answersIndex: Record<string, AnamnesisAnswerRecord>) {
  return INITIAL_ANAMNESIS_QUESTION_IDS.every((id) => isAnswered(id, answersIndex))
}

export function computeInitialAnamnesisProgress(answersIndex: Record<string, AnamnesisAnswerRecord>) {
  const answered = INITIAL_ANAMNESIS_QUESTION_IDS.filter((id) => isAnswered(id, answersIndex)).length
  const total = INITIAL_ANAMNESIS_QUESTION_IDS.length
  return {
    answered,
    total,
    ratio: total ? answered / total : 0,
    percent: total ? Math.round((answered / total) * 100) : 0,
  }
}

export function getExtendedQuestionIds() {
  return engineContent.anamnesisModules.questions
    .filter((question) => question.enabled !== false && !initialIdSet.has(question.id))
    .map((question) => question.id)
}

export function computeExtendedAnamnesisProgress(answersIndex: Record<string, AnamnesisAnswerRecord>) {
  const ids = getExtendedQuestionIds()
  const answered = ids.filter((id) => isAnswered(id, answersIndex)).length
  const total = ids.length
  return {
    answered,
    total,
    ratio: total ? answered / total : 0,
    percent: total ? Math.round((answered / total) * 100) : 0,
    isComplete: total > 0 && answered >= total,
  }
}

export function filterQuestionsForMode(mode: AnamnesisDrawerMode) {
  const modules = [...engineContent.anamnesisModules.modules]
    .filter((module) => module.enabled !== false)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))

  const flat: Array<
    (typeof engineContent.anamnesisModules.questions)[number] & {
      moduleId: string
      moduleTitle: string
    }
  > = []

  for (const module of modules) {
    const questions = engineContent.anamnesisModules.questions
      .filter((question) => question.module_id === module.id && question.enabled !== false)
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))

    for (const question of questions) {
      const inInitial = initialIdSet.has(question.id)
      if (mode === 'initial' && !inInitial) continue
      if (mode === 'extended' && inInitial) continue

      flat.push({
        ...question,
        moduleId: module.id,
        moduleTitle: module.title_user,
      })
    }
  }

  if (mode === 'initial') {
    const orderMap = new Map<string, number>(
      INITIAL_ANAMNESIS_QUESTION_IDS.map((id, index) => [id, index]),
    )
    flat.sort((left, right) => (orderMap.get(left.id) ?? 0) - (orderMap.get(right.id) ?? 0))
  }

  return flat
}
