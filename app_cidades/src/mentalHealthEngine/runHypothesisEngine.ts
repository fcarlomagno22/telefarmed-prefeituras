import { engineContent } from './content/loadEngineContent'
import { evaluateConditions } from './evaluateConditions'
import type {
  ActiveHypothesis,
  HypothesisConfidence,
  HypothesisStatus,
  HypothesisTier,
} from '../types/mentalHealthEngine'

function resolveTier(trackId: string, score: number, dataComplete: boolean): HypothesisTier {
  if (!dataComplete || score <= 0) return 'insufficient_data'

  const byTrack = engineContent.hypothesisEngine.tier_bands.by_track as Record<
    string,
    { bands: Array<{ tier: string; min_score: number; max_score: number }> }
  >
  const override = byTrack[trackId]
  const bands = override?.bands ?? engineContent.hypothesisEngine.tier_bands.default

  for (const band of bands) {
    if (band.tier === 'insufficient_data') continue
    if (score >= band.min_score && score <= band.max_score) {
      return band.tier as HypothesisTier
    }
  }

  return score > 0 ? 'low_signal' : 'insufficient_data'
}

function resolveConfidence(
  trackId: string,
  tier: HypothesisTier,
  ctx: Record<string, unknown>,
): HypothesisConfidence {
  const rules = [...(engineContent.hypothesisEngine.confidence_rules ?? [])].sort(
    (left, right) => (right.priority ?? 0) - (left.priority ?? 0),
  )

  for (const rule of rules) {
    const when = rule.when as Record<string, unknown> | undefined
    if (when?.track && when.track !== trackId) continue
    if (when?.track_tier && when.track !== trackId) continue
    if (!evaluateConditions(when ?? {}, ctx)) continue
    const then = rule.then as { set_confidence?: HypothesisConfidence } | undefined
    if (then?.set_confidence) return then.set_confidence
  }

  if (tier === 'high_signal') return 'medium'
  if (tier === 'moderate_signal') return 'medium'
  return 'low'
}

function resolveStatus(tier: HypothesisTier): HypothesisStatus {
  const defaults = engineContent.hypothesisEngine.global_settings.status_default_by_tier as
    | Record<string, HypothesisStatus>
    | undefined
  return defaults?.[tier] ?? (tier === 'insufficient_data' ? 'insufficient_data' : 'monitoring')
}

function buildEvidenceSummary(trackId: string, evidenceTags: string[]) {
  const rules = engineContent.hypothesisEngine.evidence_summary_rules ?? []
  return evidenceTags
    .map((tag) => rules.find((rule) => rule.evidence_tag === tag))
    .filter((rule) => rule && (rule.maps_to_tracks ?? []).includes(trackId))
    .sort(
      (left, right) =>
        (right?.weight_in_summary ?? 0) - (left?.weight_in_summary ?? 0),
    )
    .slice(0, engineContent.hypothesisEngine.evidence_summary_assembly?.max_items_per_track ?? 8)
    .map((rule) => rule?.summary_internal)
    .filter((value): value is string => Boolean(value))
}

export function runHypothesisEngine(input: {
  trackScores: Record<string, number>
  evidenceTags: string[]
  dataComplete: boolean
  ctx: Record<string, unknown>
}) {
  const trackTier: Record<string, HypothesisTier> = {}
  const hypotheses: ActiveHypothesis[] = []

  for (const track of engineContent.disorderTracks) {
    const score = input.trackScores[track.id] ?? 0
    const tier = resolveTier(track.id, score, input.dataComplete)
    trackTier[track.id] = tier

    if (tier === 'insufficient_data' && score <= 0) continue

    const trackEvidence = input.evidenceTags.filter((tag) => {
      const mapping = engineContent.hypothesisEngine.evidence_summary_rules?.find(
        (rule) => rule.evidence_tag === tag,
      )
      return mapping ? mapping.maps_to_tracks?.includes(track.id) : true
    })

    const hypothesisCtx = {
      ...input.ctx,
      track_tier: trackTier,
      track_scores_raw: input.trackScores,
      evidence_count: trackEvidence.length,
      track,
    }

    hypotheses.push({
      track: track.id,
      score,
      tier,
      status: resolveStatus(tier),
      confidence: resolveConfidence(track.id, tier, hypothesisCtx),
      evidence_summary: buildEvidenceSummary(track.id, trackEvidence),
      evidence_tags: trackEvidence,
      evidence_count: trackEvidence.length,
      is_primary: false,
      is_secondary: false,
      last_updated_at: new Date().toISOString(),
      engine_version: engineContent.hypothesisEngine.version,
    })
  }

  hypotheses.sort((left, right) => right.score - left.score)

  const weights = engineContent.hypothesisEngine.primary_track_rules?.weights
  const ranked = [...hypotheses].sort((left, right) => {
    const leftTrack = engineContent.disorderTracks.find((track) => track.id === left.track)
    const rightTrack = engineContent.disorderTracks.find((track) => track.id === right.track)
    const tierWeight =
      (weights?.tier as Record<string, number> | undefined)?.[left.tier] ?? 1
    const tierWeightRight =
      (weights?.tier as Record<string, number> | undefined)?.[right.tier] ?? 1
    const leftScore = left.score * tierWeight * (leftTrack?.priority_weight ?? 1)
    const rightScore = right.score * tierWeightRight * (rightTrack?.priority_weight ?? 1)
    return rightScore - leftScore
  })

  const primary = ranked.find((item) => item.tier !== 'insufficient_data') ?? null
  const secondary = ranked
    .filter((item) => item.track !== primary?.track && item.tier !== 'insufficient_data')
    .slice(0, engineContent.hypothesisEngine.primary_track_rules?.max_secondary_tracks ?? 2)

  for (const hypothesis of hypotheses) {
    hypothesis.is_primary = hypothesis.track === primary?.track
    hypothesis.is_secondary = secondary.some((item) => item.track === hypothesis.track)
  }

  return {
    hypotheses,
    primaryTrackId: primary?.track ?? null,
    secondaryTrackIds: secondary.map((item) => item.track),
    trackTier,
  }
}
