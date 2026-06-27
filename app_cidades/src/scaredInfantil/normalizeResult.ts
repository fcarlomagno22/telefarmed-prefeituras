import type { ScaredEngineResult } from './types'

export function normalizeScaredEngineResult(
  result: ScaredEngineResult | null | undefined,
): ScaredEngineResult | null {
  if (!result) return null

  return {
    ...result,
    subscaleScores: Array.isArray(result.subscaleScores) ? result.subscaleScores : [],
    elevatedSubscaleLabels: Array.isArray(result.elevatedSubscaleLabels)
      ? result.elevatedSubscaleLabels
      : [],
    nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps : [],
    referrals: Array.isArray(result.referrals) ? result.referrals : [],
    redFlags: Array.isArray(result.redFlags) ? result.redFlags : [],
    differentialFlags: Array.isArray(result.differentialFlags) ? result.differentialFlags : [],
    appliedRules: Array.isArray(result.appliedRules) ? result.appliedRules : [],
    headline: result.headline ?? '',
    familySummary: result.familySummary ?? '',
    safeResultPhrase: result.safeResultPhrase ?? '',
    disclaimer: result.disclaimer ?? '',
    reassurance: result.reassurance ?? '',
    classificationLabel: result.classificationLabel ?? '',
    functionalImpairmentLabel: result.functionalImpairmentLabel ?? '',
  }
}
