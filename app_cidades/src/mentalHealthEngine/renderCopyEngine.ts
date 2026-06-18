import type { MentalHealthCheckInEntry, MentalHealthMoodLevelId } from '../types/mentalHealth'
import {
  MENTAL_HEALTH_EMOTION_INTENSITY_OPTIONS,
  MENTAL_HEALTH_INFLUENCE_VALENCE_OPTIONS,
} from '../types/mentalHealth'
import { engineContent } from './content/loadEngineContent'
import { evaluateConditions } from './evaluateConditions'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

const MOOD_SCORE: Record<MentalHealthMoodLevelId, number> = {
  'very-good': 5,
  good: 4,
  neutral: 3,
  bad: 2,
  'very-bad': 1,
}

const MOOD_LABELS: Record<MentalHealthMoodLevelId, string> = {
  'very-good': 'muito bem',
  good: 'bem',
  neutral: 'neutro',
  bad: 'mal',
  'very-bad': 'muito mal',
}

export type ActivityFeedbackKey = 'helpful' | 'somewhat' | 'not_helpful' | 'made_worse'

const FEEDBACK_TO_COPY_KEY: Record<ActivityFeedbackKey, string> = {
  helpful: 'yes',
  somewhat: 'somewhat',
  not_helpful: 'no',
  made_worse: 'made_worse',
}

function stableHash(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function listLowercase(items: string[]) {
  if (items.length === 0) return ''
  const lower = items.map((item) => item.toLowerCase())
  if (lower.length === 1) return lower[0]
  if (lower.length === 2) return `${lower[0]} e ${lower[1]}`
  return `${lower.slice(0, -1).join(', ')} e ${lower[lower.length - 1]}`
}

function influencePhrase(valence: string | null | undefined, influence: string | null | undefined) {
  if (!influence) return ''
  const main = influence.toLowerCase()
  if (valence === 'positive') return `depois de algo positivo envolvendo ${main}`
  if (valence === 'negative') return `depois de algo difícil envolvendo ${main}`
  if (valence === 'mixed') return `depois de uma situação com lados diferentes envolvendo ${main}`
  return `depois de algo envolvendo ${main}`
}

function resolvePlaceholder(key: string, ctx: Record<string, unknown>) {
  const registry = engineContent.copyTemplates.placeholder_registry as Record<
    string,
    { mapping?: Record<string, string>; fallback?: string; source?: string }
  >

  if (key === 'mood_label') {
    const mood = ctx.mood as MentalHealthMoodLevelId | undefined
    return mood ? (MOOD_LABELS[mood] ?? registry.mood_label?.fallback ?? '') : ''
  }
  if (key === 'emotions_inline') {
    const emotions = ctx.emotions as string[] | undefined
    return emotions?.length ? listLowercase(emotions) : (registry.emotions_inline?.fallback ?? '')
  }
  if (key === 'emotion_intensity_label') {
    const intensity = ctx.emotion_intensity as number | null | undefined
    if (intensity == null) return ''
    return (
      MENTAL_HEALTH_EMOTION_INTENSITY_OPTIONS.find((item) => item.value === intensity)?.label.toLowerCase() ??
      ''
    )
  }
  if (key === 'main_influence') {
    return String(ctx.main_influence ?? '').toLowerCase()
  }
  if (key === 'influence_phrase') {
    return influencePhrase(
      ctx.influence_valence as string | null | undefined,
      ctx.main_influence as string | null | undefined,
    )
  }
  if (key === 'activity_count') return String(ctx.activity_count ?? 0)
  if (key === 'first_activity_title') return String(ctx.first_activity_title ?? 'sua primeira atividade')
  if (key === 'day_period') return String(ctx.day_period ?? 'hoje')
  if (key === 'completed_count') return String(ctx.completed_count ?? 0)
  if (key === 'total_count') return String(ctx.total_count ?? 0)

  const spec = registry[key]
  if (spec?.mapping && ctx.mood) {
    return spec.mapping[String(ctx.mood)] ?? spec.fallback ?? ''
  }
  return spec?.fallback ?? ''
}

export function renderTemplateText(template: string, ctx: Record<string, unknown>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => resolvePlaceholder(key, ctx))
}

function computeMoodScoreDelta(entry: MentalHealthCheckInEntry, recentEntries: MentalHealthCheckInEntry[]) {
  const previous = recentEntries.filter((item) => item.id !== entry.id).slice(0, 5)
  if (previous.length === 0) return 0
  const latestScore = MOOD_SCORE[entry.mood]
  const avg =
    previous.reduce((total, item) => total + MOOD_SCORE[item.mood], 0) / previous.length
  return Math.round(latestScore - avg)
}

export function buildCheckInCopyContext(
  entry: MentalHealthCheckInEntry,
  recentEntries: MentalHealthCheckInEntry[],
) {
  const uniqueDays = new Set(
    recentEntries.map((item) => toLocalDateIso(new Date(item.recordedAt))),
  ).size

  return {
    mood: entry.mood,
    latest_mood: entry.mood,
    emotions: entry.emotions,
    emotions_count: entry.emotions.length,
    emotion_intensity: entry.emotionIntensity ?? null,
    main_influence: entry.mainInfluence ?? null,
    influences: entry.mainInfluence ? [entry.mainInfluence] : [],
    influence_valence: entry.influenceValence ?? null,
    reactions: entry.reactions ?? [],
    mood_score_delta: computeMoodScoreDelta(entry, recentEntries),
    history_days_count: uniqueDays,
    local_date: toLocalDateIso(new Date(entry.recordedAt)),
  }
}

function pickSelectionRule(target: string, ctx: Record<string, unknown>) {
  const rules = [...(engineContent.copyTemplates.selection_rules ?? [])]
    .filter((rule) => rule.target === target)
    .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))

  return rules.find((rule) => evaluateConditions(rule.when as Record<string, unknown>, ctx)) ?? null
}

function resolveSupportText(rule: Record<string, unknown>, ctx: Record<string, unknown>) {
  const then = rule.then as Record<string, unknown> | undefined
  if (!then) return null

  const support = engineContent.copyTemplates.moment_support as {
    by_mood?: Record<string, { variants: Array<{ id: string; text: string }> }>
    by_emotion?: Array<{ id: string; text: string }>
  }

  if (typeof then.template_id === 'string') {
    const emotionMatch = support.by_emotion?.find((item) => item.id === then.template_id)
    if (emotionMatch) return emotionMatch.text

    for (const moodGroup of Object.values(support.by_mood ?? {})) {
      const variant = moodGroup.variants.find((item) => item.id === then.template_id)
      if (variant) return variant.text
    }
  }

  const mood = ctx.mood as MentalHealthMoodLevelId | undefined
  const moodKey =
    typeof then.template_group === 'string'
      ? then.template_group.replace('by_mood.', '')
      : then.template_group_from_mood
        ? mood
        : mood

  if (moodKey && support.by_mood?.[moodKey]?.variants?.length) {
    const seed = `${moodKey}-${(ctx.emotions as string[] | undefined)?.join(',') ?? ''}-${ctx.local_date ?? ''}`
    const idx = stableHash(seed) % support.by_mood[moodKey].variants.length
    return support.by_mood[moodKey].variants[idx]?.text ?? null
  }

  return null
}

function composeMomentSummary(ctx: Record<string, unknown>) {
  const summary = engineContent.copyTemplates.moment_summary as {
    templates?: Array<{
      id: string
      template: string
      conditions?: Record<string, unknown>
      priority?: number
      block?: string
    }>
    assembly?: { order?: string[] }
  }

  const order = summary.assembly?.order ?? ['mood', 'emotions', 'influence', 'reaction']
  const templates = summary.templates ?? []
  const parts: string[] = []

  for (const block of order) {
    const candidates = templates
      .filter((item) => item.block === block)
      .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))

    for (const candidate of candidates) {
      if (!evaluateConditions(candidate.conditions, ctx)) continue
      parts.push(renderTemplateText(candidate.template, ctx))
      break
    }
  }

  if (parts.length === 0) {
    const fallbackId = (engineContent.copyTemplates.fallbacks as Record<string, string | null>)
      ?.moment_summary
    const fallback = templates.find((item) => item.id === fallbackId)
    if (fallback) return renderTemplateText(fallback.template, ctx)
    return 'Você registrou como está se sentindo hoje.'
  }

  let text = parts.join('')
  if (!text.endsWith('.')) text += '.'
  return text
}

function resolveRelevantChangeMessage(ctx: Record<string, unknown>) {
  if ((ctx.history_days_count as number) < 3) return null
  if ((ctx.mood_score_delta as number) >= 0) return null

  const rule = pickSelectionRule('relevant_change', ctx)
  const templateId = (rule?.then as { template_id?: string } | undefined)?.template_id
  if (!templateId || templateId === 'change_stable') return null

  const templates = (engineContent.copyTemplates.relevant_change as {
    templates?: Array<{ id: string; template: string }>
  }).templates
  const template = templates?.find((item) => item.id === templateId)
  return template?.template ?? null
}

export function renderMomentSummary(entry: MentalHealthCheckInEntry, recentEntries: MentalHealthCheckInEntry[]) {
  const ctx = buildCheckInCopyContext(entry, recentEntries)
  return composeMomentSummary(ctx)
}

export function renderMomentSupport(entry: MentalHealthCheckInEntry, recentEntries: MentalHealthCheckInEntry[]) {
  const ctx = buildCheckInCopyContext(entry, recentEntries)
  const rule = pickSelectionRule('moment_support', ctx)
  const fromRule = rule ? resolveSupportText(rule as Record<string, unknown>, ctx) : null
  if (fromRule) return fromRule

  const mood = entry.mood
  const support = engineContent.copyTemplates.moment_support as {
    by_mood?: Record<string, { variants: Array<{ text: string }> }>
  }
  const variants = support.by_mood?.[mood]?.variants
  if (variants?.length) {
    const idx = stableHash(`${mood}-${entry.id}`) % variants.length
    return variants[idx]?.text ?? variants[0].text
  }

  return 'Obrigado por registrar como você está.'
}

export function renderRelevantChange(entry: MentalHealthCheckInEntry, recentEntries: MentalHealthCheckInEntry[]) {
  const ctx = buildCheckInCopyContext(entry, recentEntries)
  return resolveRelevantChangeMessage(ctx)
}

export function renderCheckInCopy(entry: MentalHealthCheckInEntry, recentEntries: MentalHealthCheckInEntry[]) {
  const relevantChange = renderRelevantChange(entry, recentEntries)
  return {
    summarySentence: renderMomentSummary(entry, recentEntries),
    supportMessage: renderMomentSupport(entry, recentEntries),
    relevantChangeMessage: relevantChange,
  }
}

export function renderPlanIntro(ctx: Record<string, unknown>) {
  const templates = (engineContent.copyTemplates.plan_intro as {
    templates?: Array<{
      id: string
      title: string
      body: string
      conditions?: Record<string, unknown>
      priority?: number
    }>
  }).templates

  const sorted = [...(templates ?? [])].sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))
  const match = sorted.find((item) => evaluateConditions(item.conditions, ctx))
  if (match) {
    return {
      template_id: match.id,
      title: renderTemplateText(match.title, ctx),
      body: renderTemplateText(match.body, ctx),
    }
  }

  const fallbackId = (engineContent.copyTemplates.fallbacks as Record<string, string | null>)?.plan_intro
  const fallback = templates?.find((item) => item.id === fallbackId)
  return {
    template_id: fallback?.id ?? 'plan_intro_standard_01',
    title: fallback ? renderTemplateText(fallback.title, ctx) : 'Seu plano de hoje',
    body: fallback
      ? renderTemplateText(fallback.body, ctx)
      : 'Separamos cuidados leves para hoje.',
  }
}

export function renderPlanConclusion(ctx: Record<string, unknown>) {
  const templates = (engineContent.copyTemplates.plan_conclusion as {
    templates?: Array<{
      id: string
      title: string
      body: string
      conditions?: Record<string, unknown>
      priority?: number
    }>
  }).templates

  const sorted = [...(templates ?? [])].sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))
  const match = sorted.find((item) => evaluateConditions(item.conditions, ctx))
  if (match) {
    return {
      template_id: match.id,
      title: renderTemplateText(match.title, ctx),
      body: renderTemplateText(match.body, ctx),
    }
  }

  return {
    template_id: 'conclusion_default',
    title: 'Você cuidou de você hoje',
    body: 'Cada pequeno passo importa.',
  }
}

export function getFeedbackPrompt(activityId: string, planDate: string) {
  const prompts = engineContent.copyTemplates.feedback_prompts as {
    after_activity?: Array<{ id: string; text: string }>
    rotation_method?: string
  }
  const list = prompts.after_activity ?? []
  if (!list.length) return 'Isso ajudou um pouco agora?'
  const idx = stableHash(`${activityId}-${planDate}`) % list.length
  return list[idx]?.text ?? list[0].text
}

export function renderFeedbackThankYou(feedback: ActivityFeedbackKey, activityId: string, planDate: string) {
  const copyKey = FEEDBACK_TO_COPY_KEY[feedback]
  const answers = (engineContent.copyTemplates.feedback_prompts as {
    answers?: Record<string, string[]>
  }).answers
  const variants = answers?.[copyKey] ?? []
  if (!variants.length) return 'Obrigado pelo retorno.'
  const idx = stableHash(`${activityId}-${planDate}-${copyKey}`) % variants.length
  return variants[idx] ?? variants[0]
}

export function getCtaLabel(key: string, fallback: string) {
  const labels = engineContent.copyTemplates.cta_labels as Record<string, string> | undefined
  return labels?.[key] ?? fallback
}

export function getTransitionCopy(key: string) {
  const transitions = engineContent.copyTemplates.transition_copy as Record<
    string,
    { title?: string; body?: string }
  >
  return transitions[key] ?? null
}
