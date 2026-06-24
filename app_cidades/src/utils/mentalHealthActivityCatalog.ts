import { engineContent } from '../mentalHealthEngine/content/loadEngineContent'
import type { ActiveRedFlag } from '../types/mentalHealthEngine'

export type CatalogActivityStep = {
  order: number
  instruction_user: string
  duration_sec?: number
  optional?: boolean
}

export type CatalogModality = {
  id: string
  label: string
  description: string
}

export type CatalogLibraryActivity = {
  id: string
  title: string
  subtitle_user?: string
  duration_min?: number
  objective_user?: string
  modalities: string[]
  modality_labels: string[]
  why_may_help: string
  steps_count: number
}

export type CatalogActivity = {
  id: string
  title: string
  subtitle_user?: string
  duration_min?: number
  objective_user?: string
  modalities: string[]
  modality_labels: string[]
  why_may_help: string
  steps: CatalogActivityStep[]
  reflection_prompt_optional?: string | null
  feedback_question?: string | null
}

const MODALITY_USER_LABELS: Record<string, string> = {
  breathing: 'Respiração',
  grounding: 'Ancoragem',
  journaling: 'Escrita guiada',
  behavioral_activation: 'Pequenas ações',
  gradual_exposure: 'Aproximação gradual',
  sleep_hygiene: 'Sono',
  emotion_regulation: 'Emoções',
  mindfulness: 'Atenção plena',
  social_micro_step: 'Conexão',
  cognitive_reframe: 'Pensamentos',
  self_compassion: 'Autocompaixão',
  body_scan: 'Corpo',
  movement_micro: 'Movimento',
  routine_building: 'Rotina',
  trigger_mapping: 'Gatilhos',
  substance_harm_reduction: 'Segurança',
  crisis_grounding: 'Ancoragem de apoio',
}

function getModalityLabel(modalityId: string) {
  const registry = engineContent.activityCatalog.modalities_registry?.find(
    (item) => item.id === modalityId,
  )
  return MODALITY_USER_LABELS[modalityId] ?? registry?.label_internal ?? modalityId
}

function getModalityDescription(modalityId: string) {
  const registry = engineContent.activityCatalog.modalities_registry?.find(
    (item) => item.id === modalityId,
  )
  return registry?.description_internal ?? ''
}

function buildWhyMayHelp(input: {
  objective_user?: string
  subtitle_user?: string
  modalities: string[]
}) {
  const parts: string[] = []
  if (input.objective_user) parts.push(input.objective_user)
  if (input.subtitle_user && input.subtitle_user !== input.objective_user) {
    parts.push(input.subtitle_user)
  }
  const primaryModality = input.modalities[0]
  if (primaryModality) {
    const description = getModalityDescription(primaryModality)
    if (description && !parts.some((part) => part.includes(description.slice(0, 24)))) {
      parts.push(description)
    }
  }
  return parts.join(' ') || 'Um cuidado breve para o seu momento.'
}

export function getActiveRedFlagIds(activeRedFlags: ActiveRedFlag[]) {
  return activeRedFlags.map((flag) => flag.red_flag_id)
}

export function isCatalogActivityBlocked(
  activityId: string,
  activeRedFlagIds: string[],
  notHelpfulIds: string[] = [],
) {
  if (notHelpfulIds.includes(activityId)) return true

  const activity = engineContent.activityCatalog.activities.find((item) => item.id === activityId)
  if (!activity || activity.enabled === false) return true

  return (activity.avoid_when_red_flags ?? []).some((flagId) => activeRedFlagIds.includes(flagId))
}

export function getNotHelpfulActivityIds(
  activityHistory: { activity_id: string; feedback: string | null }[],
) {
  return activityHistory
    .filter((entry) => entry.feedback === 'not_helpful' || entry.feedback === 'made_worse')
    .map((entry) => entry.activity_id)
}

export function getCatalogModalities(activeRedFlagIds: string[] = [], notHelpfulIds: string[] = []) {
  const activities = listCatalogActivities({ activeRedFlagIds, notHelpfulIds })
  const modalityIds = new Set<string>()

  for (const activity of activities) {
    for (const modalityId of activity.modalities) {
      modalityIds.add(modalityId)
    }
  }

  return [...modalityIds]
    .map((id) => ({
      id,
      label: getModalityLabel(id),
      description: getModalityDescription(id),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'))
}

export function listCatalogActivities(input?: {
  modalityId?: string | null
  activeRedFlagIds?: string[]
  notHelpfulIds?: string[]
  limit?: number
  offset?: number
}): CatalogLibraryActivity[] {
  const activeRedFlagIds = input?.activeRedFlagIds ?? []
  const notHelpfulIds = input?.notHelpfulIds ?? []
  const modalityId = input?.modalityId ?? null

  const sorted = engineContent.activityCatalog.activities
    .filter((activity) => activity.enabled !== false)
    .filter((activity) => !isCatalogActivityBlocked(activity.id, activeRedFlagIds, notHelpfulIds))
    .filter((activity) => {
      if (!modalityId) return true
      return (activity.modalities ?? []).includes(modalityId)
    })
    .map((activity) => {
      const modalities = activity.modalities ?? []
      return {
        id: activity.id,
        title: activity.title,
        subtitle_user: activity.subtitle_user,
        duration_min: activity.duration_min,
        objective_user: activity.objective_user,
        modalities,
        modality_labels: modalities.map(getModalityLabel),
        why_may_help: buildWhyMayHelp({
          objective_user: activity.objective_user,
          subtitle_user: activity.subtitle_user,
          modalities,
        }),
        steps_count: activity.steps?.length ?? 0,
      }
    })
    .sort((left, right) => left.title.localeCompare(right.title, 'pt-BR'))

  if (input?.limit == null) return sorted

  const offset = input.offset ?? 0
  return sorted.slice(offset, offset + input.limit)
}

export function getCatalogActivity(activityId: string): CatalogActivity | null {
  const activity = engineContent.activityCatalog.activities.find(
    (item) => item.id === activityId && item.enabled !== false,
  )
  if (!activity) return null

  const steps = [...(activity.steps ?? [])].sort((left, right) => left.order - right.order)
  const modalities = activity.modalities ?? []

  return {
    id: activity.id,
    title: activity.title,
    subtitle_user: activity.subtitle_user,
    duration_min: activity.duration_min,
    objective_user: activity.objective_user,
    modalities,
    modality_labels: modalities.map(getModalityLabel),
    why_may_help: buildWhyMayHelp({
      objective_user: activity.objective_user,
      subtitle_user: activity.subtitle_user,
      modalities,
    }),
    steps,
    reflection_prompt_optional: activity.reflection_prompt_optional ?? null,
    feedback_question: activity.feedback_question ?? null,
  }
}

export function formatActivityTimer(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds))
  const minutes = Math.floor(safe / 60)
  const remainder = safe % 60
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

export function getRecentCatalogActivityIds(
  activityHistory: {
    activity_id: string
    status: string
    feedback: string | null
    completed_at: string | null
    feedback_at: string | null
  }[],
  limit = 6,
) {
  const seen = new Set<string>()
  const sorted = [...activityHistory].sort((left, right) => {
    const leftTime = new Date(left.feedback_at ?? left.completed_at ?? 0).getTime()
    const rightTime = new Date(right.feedback_at ?? right.completed_at ?? 0).getTime()
    return rightTime - leftTime
  })

  const ids: string[] = []
  for (const entry of sorted) {
    if (entry.status !== 'completed' && entry.feedback == null) continue
    if (seen.has(entry.activity_id)) continue
    if (!getCatalogActivity(entry.activity_id)) continue
    seen.add(entry.activity_id)
    ids.push(entry.activity_id)
    if (ids.length >= limit) break
  }

  return ids
}
