import { renderPlanConclusion, renderPlanIntro } from './renderCopyEngine'
import { engineContent } from './content/loadEngineContent'
import { evaluateConditions } from './evaluateConditions'
import type { SelectedActivityCandidate } from './selectDailyActivities'
import type { DailyMicroPlan } from '../types/mentalHealthEngine'

function renderTemplate(text: string, vars: Record<string, string | number>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ''))
}

function resolveWelcomeTemplate(ctx: Record<string, unknown>, activityCount: number, firstTitle: string) {
  const sorted = [...(engineContent.planTemplates.template_selection_rules ?? [])].sort(
    (left, right) => (right.priority ?? 0) - (left.priority ?? 0),
  )

  for (const rule of sorted) {
    if (!evaluateConditions(rule.when as Record<string, unknown>, ctx)) continue
    const templateId = (rule.then as { welcome_template_id?: string } | undefined)?.welcome_template_id
    if (!templateId) continue
    const template = (engineContent.planTemplates.welcome_messages as Record<string, {
      id?: string
      title?: string
      body?: string
    }>)[templateId]
    if (template) return { template_id: templateId, ...template }
  }

  const fallback = engineContent.planTemplates.welcome_messages?.welcome_standard
  return {
    template_id: 'welcome_standard',
    title: fallback?.title ?? 'Seu plano de hoje',
    body: fallback?.body ?? 'Separamos cuidados leves para hoje.',
  }
}

function resolveCompletionTemplate(activityCount: number, completedCount = 0) {
  if (completedCount > 0 && completedCount < activityCount) {
    const template = engineContent.planTemplates.completion_messages?.completion_partial
    return {
      template_id: 'completion_partial',
      title: template?.title ?? 'O que você fez já vale',
      body: template?.body ?? 'Não precisa completar tudo.',
    }
  }

  const template = engineContent.planTemplates.completion_messages?.completion_standard
  return {
    template_id: 'completion_standard',
    title: template?.title ?? 'Você cuidou de você hoje',
    body: template?.body ?? 'Cada pequeno passo importa.',
  }
}

export function assembleDailyPlan(input: {
  planDate: string
  ctx: Record<string, unknown>
  selected: SelectedActivityCandidate[]
  blocked: boolean
  blockReason: 'red_flag' | 'insufficient_data' | null
  rulesFired: string[]
  primaryTrackId: string | null
}): DailyMicroPlan {
  if (input.blocked) {
    const blockedState = engineContent.planTemplates.blocked_plan_states?.red_flag_active
    return {
      plan_date: input.planDate,
      generated_at: new Date().toISOString(),
      blocked: true,
      block_reason: input.blockReason,
      welcome: {
        template_id: 'blocked_red_flag',
        title: blockedState?.title ?? 'Seu bem-estar vem primeiro',
        body:
          blockedState?.body ??
          'O melhor próximo passo agora é falar com alguém. Preparamos opções de apoio.',
      },
      activities: [],
      completion: null,
      internal: {
        primary_track_id: input.primaryTrackId,
        rules_fired: input.rulesFired,
        assembly_rule_id: 'assemble_blocked_red_flag',
      },
    }
  }

  const catalog = engineContent.activityCatalog.activities
  const activities = input.selected.map((item, index) => {
    const definition = catalog.find((activity) => activity.id === item.activity_id)
    return {
      activity_id: item.activity_id,
      slot: item.slot,
      order: index + 1,
      title: definition?.title ?? item.activity_id,
      subtitle_user: definition?.subtitle_user ?? null,
      duration_min: definition?.duration_min ?? 5,
      objective_user: definition?.objective_user ?? 'Cuidado leve para hoje',
      why_user_moment: item.why_user_moment,
      matched_rule_id: item.matched_rule_id,
      pool_id: item.pool_id,
    }
  })

  const firstTitle = activities[0]?.title ?? 'sua primeira atividade'
  const copyCtx = {
    ...input.ctx,
    activity_count: activities.length,
    first_activity_title: firstTitle,
    day_period: 'hoje',
    completed_count: 0,
    total_count: activities.length,
    plan_blocked: input.blocked,
    is_first_plan: input.ctx.is_first_plan ?? false,
  }
  const planIntro = renderPlanIntro(copyCtx)
  const completionCopy = renderPlanConclusion(copyCtx)

  return {
    plan_date: input.planDate,
    generated_at: new Date().toISOString(),
    blocked: false,
    block_reason: null,
    welcome: {
      template_id: planIntro.template_id,
      title: planIntro.title,
      body: planIntro.body,
    },
    activities,
    completion: {
      template_id: completionCopy.template_id,
      title: completionCopy.title,
      body: completionCopy.body,
    },
    internal: {
      primary_track_id: input.primaryTrackId,
      rules_fired: input.rulesFired,
      assembly_rule_id: 'assemble_standard',
    },
  }
}

// Re-export type used internally
export type { SelectedActivityCandidate } from './selectDailyActivities'
