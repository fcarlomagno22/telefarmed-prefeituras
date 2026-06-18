import type {
  MentalHealthCheckInCardData,
  MentalHealthCheckInEntry,
  MentalHealthInfluenceValence,
  MentalHealthMoodLevelId,
} from '../types/mentalHealth'
import {
  MENTAL_HEALTH_CHECKIN_EMOTIONS,
  MENTAL_HEALTH_CHECKIN_MOOD_LABELS,
  MENTAL_HEALTH_EMOTION_INTENSITY_OPTIONS,
  MENTAL_HEALTH_INFLUENCE_VALENCE_OPTIONS,
  MENTAL_HEALTH_MOOD_OPTIONS,
} from '../types/mentalHealth'
import { hasMentalHealthMoodLottie } from '../data/mentalHealthMoodAssets'

import { renderCheckInCopy } from '../mentalHealthEngine/renderCopyEngine'

export function getMentalHealthCheckInMoodLabel(mood: MentalHealthMoodLevelId) {
  return MENTAL_HEALTH_CHECKIN_MOOD_LABELS[mood]
}

export function getMentalHealthMoodLabel(mood: MentalHealthMoodLevelId) {
  return MENTAL_HEALTH_MOOD_OPTIONS.find((option) => option.id === mood)?.label ?? mood
}

export function getMentalHealthMoodEmoji(mood: MentalHealthMoodLevelId) {
  return MENTAL_HEALTH_MOOD_OPTIONS.find((option) => option.id === mood)?.emoji ?? ''
}

export function formatMentalHealthMoodDisplay(mood: MentalHealthMoodLevelId) {
  const label = getMentalHealthMoodLabel(mood)
  if (hasMentalHealthMoodLottie(mood)) return label

  const emoji = getMentalHealthMoodEmoji(mood)
  return emoji ? `${emoji} ${label}` : label
}

const EMOTION_EMOJI_MAP = Object.fromEntries(
  MENTAL_HEALTH_CHECKIN_EMOTIONS.map((label) => [label, '']),
) as Record<string, string>

export function formatMentalHealthEmotionIntensity(intensity: number | null | undefined) {
  if (intensity == null) return '—'
  return MENTAL_HEALTH_EMOTION_INTENSITY_OPTIONS.find((item) => item.value === intensity)?.label ?? '—'
}

export function formatMentalHealthInfluenceValence(
  valence: MentalHealthInfluenceValence | null | undefined,
) {
  if (!valence) return '—'
  return MENTAL_HEALTH_INFLUENCE_VALENCE_OPTIONS.find((item) => item.id === valence)?.label ?? '—'
}

export function formatMentalHealthReactions(reactions: string[] | undefined) {
  if (!reactions || reactions.length === 0) return '—'
  if (reactions.length === 1) return reactions[0]
  if (reactions.length === 2) return `${reactions[0]} e ${reactions[1]}`
  return `${reactions.slice(0, -1).join(', ')} e ${reactions[reactions.length - 1]}`
}

export function formatMentalHealthEmotionDisplay(label: string) {
  const emoji = EMOTION_EMOJI_MAP[label]
  return emoji ? `${emoji} ${label}` : label
}

export function formatMentalHealthCheckInTime(iso: string) {
  const date = new Date(iso)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}h${minutes}`
}

export function formatMentalHealthEmotions(emotions: string[]) {
  if (emotions.length === 0) return '—'
  const formatted = emotions.map((emotion) => formatMentalHealthEmotionDisplay(emotion))
  if (formatted.length === 1) return formatted[0]
  if (formatted.length === 2) return `${formatted[0]} e ${formatted[1]}`
  return `${formatted.slice(0, -1).join(', ')} e ${formatted[formatted.length - 1]}`
}

export function buildCheckInSummarySentence(entry: MentalHealthCheckInEntry) {
  return renderCheckInCopy(entry, [entry]).summarySentence
}

export function buildCheckInSupportMessage(entry: MentalHealthCheckInEntry) {
  return renderCheckInCopy(entry, [entry]).supportMessage
}

export function detectRelevantCheckInChange(
  latestEntry: MentalHealthCheckInEntry,
  recentEntries: MentalHealthCheckInEntry[],
): string | null {
  return renderCheckInCopy(latestEntry, recentEntries).relevantChangeMessage
}

export function resolveCheckInCardState(
  latestEntry: MentalHealthCheckInEntry | null,
  recentEntries: MentalHealthCheckInEntry[],
): MentalHealthCheckInCardData {
  if (!latestEntry) {
    return {
      state: 'pending',
      latestEntry: null,
      relevantChangeMessage: null,
    }
  }

  const relevantChangeMessage = detectRelevantCheckInChange(latestEntry, recentEntries)

  if (relevantChangeMessage) {
    return {
      state: 'relevant-change',
      latestEntry,
      relevantChangeMessage,
    }
  }

  return {
    state: 'completed',
    latestEntry,
    relevantChangeMessage: null,
  }
}
