import type { MentalHealthCheckInEntry } from '../types/mentalHealth'
import {
  MENTAL_HEALTH_CARE_FOCUS_OPTIONS,
  MENTAL_HEALTH_SPIRITUALITY_OPTIONS,
  MENTAL_HEALTH_TRACKING_FREQUENCY_OPTIONS,
  type MentalHealthOnboardingPreferences,
} from '../types/mentalHealth'
import type { UserClinicalState } from '../types/mentalHealthEngine'
import { getCatalogActivity } from './mentalHealthActivityCatalog'
import { toLocalDateIso } from './runWalkWeeklyChart'

const FEEDBACK_LABELS: Record<string, string> = {
  helpful: 'Ajudou',
  somewhat: 'Ajudou um pouco',
  not_helpful: 'Não ajudou',
  made_worse: 'Piorou',
}

export function formatCareFocusLabels(focusIds: string[]) {
  return focusIds
    .map((id) => MENTAL_HEALTH_CARE_FOCUS_OPTIONS.find((option) => option.id === id)?.label)
    .filter((label): label is string => Boolean(label))
}

export function formatTrackingFrequencyLabel(id: string | null | undefined) {
  if (!id) return 'Não definida'
  return (
    MENTAL_HEALTH_TRACKING_FREQUENCY_OPTIONS.find((option) => option.id === id)?.label ?? id
  )
}

export function formatSpiritualityLabel(id: string | null | undefined) {
  if (!id) return 'Não definida'
  return MENTAL_HEALTH_SPIRITUALITY_OPTIONS.find((option) => option.id === id)?.label ?? id
}

export function summarizePreferences(preferences: MentalHealthOnboardingPreferences) {
  const focus = formatCareFocusLabels(preferences.careFocus)
  return {
    focus,
    frequency: formatTrackingFrequencyLabel(preferences.trackingFrequency),
    spirituality: formatSpiritualityLabel(preferences.spiritualityPreference),
  }
}

export function computeCheckInStreak(entries: MentalHealthCheckInEntry[]) {
  const datesWithCheckIn = new Set(
    entries.map((entry) => toLocalDateIso(new Date(entry.recordedAt))),
  )

  let streak = 0
  const cursor = new Date()

  while (datesWithCheckIn.has(toLocalDateIso(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function getRecentActivitySummaries(
  activityHistory: UserClinicalState['activity_history'],
  limit = 5,
) {
  return [...activityHistory]
    .sort((left, right) => {
      const leftTime = new Date(left.feedback_at ?? left.completed_at ?? left.assigned_at).getTime()
      const rightTime = new Date(
        right.feedback_at ?? right.completed_at ?? right.assigned_at,
      ).getTime()
      return rightTime - leftTime
    })
    .filter((entry) => entry.status === 'completed' || entry.feedback != null)
    .slice(0, limit)
    .map((entry) => {
      const catalog = getCatalogActivity(entry.activity_id)
      return {
        id: `${entry.activity_id}-${entry.plan_date}`,
        activityId: entry.activity_id,
        title: catalog?.title ?? entry.activity_id,
        planDate: formatMentalHealthPlanDate(entry.plan_date),
        feedbackLabel: entry.feedback ? FEEDBACK_LABELS[entry.feedback] ?? entry.feedback : null,
        completedAt: entry.completed_at ?? entry.feedback_at,
      }
    })
}

export function formatAdherencePercent(adherence: number) {
  return `${Math.round(Math.max(0, Math.min(1, adherence)) * 100)}%`
}

export function formatMentalHealthPlanDate(planDate: string) {
  const [year, month, day] = planDate.split('-').map((part) => Number(part))
  if (!year || !month || !day) return planDate

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

export function countCompletedActivities7d(
  activityHistory: UserClinicalState['activity_history'],
) {
  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - 6)
  const cutoffTime = cutoff.getTime()

  return activityHistory.filter((entry) => {
    if (entry.status !== 'completed' && entry.feedback == null) return false
    const timestamp = new Date(
      entry.feedback_at ?? entry.completed_at ?? entry.assigned_at,
    ).getTime()
    return timestamp >= cutoffTime
  }).length
}
