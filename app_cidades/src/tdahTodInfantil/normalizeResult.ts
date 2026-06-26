import type { TdahTodEngineResult } from './types'

/** Garante arrays/strings mínimos ao reabrir sessões salvas ou renderizar resultado parcial. */
export function normalizeTdahTodEngineResult(
  result: TdahTodEngineResult | null | undefined,
): TdahTodEngineResult | null {
  if (!result) return null

  return {
    ...result,
    profilePhrases: Array.isArray(result.profilePhrases) ? result.profilePhrases : [],
    profileLabels: Array.isArray(result.profileLabels) ? result.profileLabels : [],
    domainScores: Array.isArray(result.domainScores) ? result.domainScores : [],
    nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps : [],
    referrals: Array.isArray(result.referrals) ? result.referrals : [],
    redFlags: Array.isArray(result.redFlags) ? result.redFlags : [],
    differentialFlags: Array.isArray(result.differentialFlags) ? result.differentialFlags : [],
    appliedRules: Array.isArray(result.appliedRules) ? result.appliedRules : [],
    availableRespondents: Array.isArray(result.availableRespondents)
      ? result.availableRespondents
      : [],
    headline: result.headline ?? '',
    familySummary: result.familySummary ?? '',
    safeResultPhrase: result.safeResultPhrase ?? '',
    disclaimer: result.disclaimer ?? '',
    reassurance: result.reassurance ?? '',
    classificationLabel: result.classificationLabel ?? '',
    functionalImpairmentLabel: result.functionalImpairmentLabel ?? '',
  }
}
