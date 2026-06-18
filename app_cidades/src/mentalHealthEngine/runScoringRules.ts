import { engineContent } from './content/loadEngineContent'
import { evaluateConditions, evaluateUnless } from './evaluateConditions'
import type { EvidenceLogEntry } from '../types/mentalHealthEngine'

type ScoringRule = (typeof engineContent.scoringRules.rules)[number]

export function runScoringRules(ctx: Record<string, unknown>) {
  const trackScores: Record<string, number> = {}
  const evidenceTags = new Set<string>()
  const evidenceLog: EvidenceLogEntry[] = []
  const redFlagIds = new Set<string>()

  for (const track of engineContent.disorderTracks) {
    trackScores[track.id] = 0
  }

  const sortedRules = [...engineContent.scoringRules.rules]
    .filter((rule) => rule.enabled !== false)
    .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))

  for (const rule of sortedRules) {
    if (!evaluateConditions(rule.when as Record<string, unknown>, ctx)) continue
    if (evaluateUnless(rule.unless as Record<string, unknown>[] | undefined, ctx)) continue

    const then = rule.then as Record<string, unknown> | undefined
    if (!then) continue

    if (then.add_track_score && typeof then.add_track_score === 'object') {
      const payload = then.add_track_score as { track?: string; points?: number }
      if (payload.track && typeof payload.points === 'number') {
        trackScores[payload.track] = Math.min(
          100,
          (trackScores[payload.track] ?? 0) + payload.points,
        )
      }
    }

    if (then.subtract_track_score && typeof then.subtract_track_score === 'object') {
      const payload = then.subtract_track_score as { track?: string; points?: number }
      if (payload.track && typeof payload.points === 'number') {
        trackScores[payload.track] = Math.max(0, (trackScores[payload.track] ?? 0) - payload.points)
      }
    }

    if (then.multiply_track_score && typeof then.multiply_track_score === 'object') {
      const payload = then.multiply_track_score as { track?: string; factor?: number }
      if (payload.track && typeof payload.factor === 'number') {
        trackScores[payload.track] = Math.min(
          100,
          Math.round((trackScores[payload.track] ?? 0) * payload.factor),
        )
      }
    }

    if (typeof then.add_evidence === 'string') {
      if (!evidenceTags.has(then.add_evidence)) {
        evidenceTags.add(then.add_evidence)
        evidenceLog.push({
          evidence_tag: then.add_evidence,
          rule_id: rule.id,
          track:
            typeof (then.add_track_score as { track?: string } | undefined)?.track === 'string'
              ? (then.add_track_score as { track: string }).track
              : undefined,
          points:
            typeof (then.add_track_score as { points?: number } | undefined)?.points === 'number'
              ? (then.add_track_score as { points: number }).points
              : undefined,
          fired_at: new Date().toISOString(),
        })
      }
    }

    if (typeof then.add_red_flag === 'string') {
      redFlagIds.add(then.add_red_flag)
    }
  }

  const scoreCaps =
    ((engineContent.scoringRules as { score_caps?: Record<string, number> }).score_caps) ?? {}
  for (const track of Object.keys(trackScores)) {
    const cap = scoreCaps[track] ?? 100
    trackScores[track] = Math.min(trackScores[track], cap)
  }

  return {
    trackScores,
    evidenceTags: [...evidenceTags],
    evidenceLog,
    redFlagIds: [...redFlagIds],
  }
}

export type ScoringRulesResult = ReturnType<typeof runScoringRules>
