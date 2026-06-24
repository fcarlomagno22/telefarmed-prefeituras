import { engineContent } from '../mentalHealthEngine/content/loadEngineContent'
import { shouldBlockMicroPlan } from '../mentalHealthEngine/runRedFlags'
import type { MentalHealthMoodLevelId } from '../types/mentalHealth'
import { isCrisisCheckInMood } from '../types/mentalHealth'
import type { ActiveRedFlag, AnamnesisAnswerRecord } from '../types/mentalHealthEngine'

type RedFlagDefinition = (typeof engineContent.redFlags.red_flags)[number]
type ResponseRoute = (typeof engineContent.redFlags.response_routes)[number]

export type CrisisRouteKind = 'phone' | 'emergency_contacts' | 'info'

export type CrisisRouteAction = {
  id: string
  label: string
  description: string
  kind: CrisisRouteKind
  phone?: string
  enabled: boolean
}

export type CrisisPresentation = {
  title: string
  message: string
  disclaimer: string
  routes: CrisisRouteAction[]
  allowAcknowledge: boolean
  leadingRedFlagId: string | null
}

const SEVERITY_RANK: Record<string, number> = {
  S3: 4,
  S2: 3,
  S1: 2,
  S0: 1,
}

const DEFAULT_MESSAGING = engineContent.redFlags.user_messaging as {
  crisis_screen_default?: { title?: string; message?: string; disclaimer?: string }
  emergency_disclaimer_pt_br?: string
}

function getRedFlagDefinition(redFlagId: string): RedFlagDefinition | undefined {
  return engineContent.redFlags.red_flags?.find((item) => item.id === redFlagId)
}

function getResponseRoute(routeId: string): ResponseRoute | undefined {
  return engineContent.redFlags.response_routes?.find((item) => item.id === routeId)
}

export function getOpenRedFlags(activeRedFlags: ActiveRedFlag[] = []) {
  return activeRedFlags.filter((flag) => flag.status === 'open')
}

export function getCrisisAnamnesisQuestionIds(): string[] {
  const ids = new Set<string>()

  for (const question of engineContent.anamnesisModules.questions) {
    for (const branch of question.branching ?? []) {
      if (branch.action !== 'trigger_red_flag') continue
      ids.add(question.id)
    }
  }

  return [...ids]
}

export type CrisisRecoveryMode = 'standard' | 'guarded'

export function resolveCrisisRecoveryMode(activeRedFlags: ActiveRedFlag[] = []): CrisisRecoveryMode {
  const open = getOpenRedFlags(activeRedFlags)
  if (!open.length) return 'standard'

  const requiresGuardedConfirmation = open.some((flag) => {
    const definition = getRedFlagDefinition(flag.red_flag_id)
    return definition?.actions?.allow_user_to_continue_after_acknowledgment !== true
  })

  return requiresGuardedConfirmation ? 'guarded' : 'standard'
}

export function detectAnamnesisCrisisRedFlagIds(
  answers: Record<string, AnamnesisAnswerRecord>,
): string[] {
  const ids = new Set<string>()

  for (const question of engineContent.anamnesisModules.questions) {
    const answer = answers[question.id]
    if (!answer || answer.skipped) continue

    for (const branch of question.branching ?? []) {
      if (branch.action !== 'trigger_red_flag') continue
      const when = branch.when as { answer_in?: string[] } | undefined
      const redFlagId = (branch as { red_flag_id?: string }).red_flag_id
      if (!redFlagId || !when?.answer_in?.includes(String(answer.value))) continue
      ids.add(redFlagId)
    }
  }

  return [...ids]
}

export function hasAnamnesisCrisisSignal(answers: Record<string, AnamnesisAnswerRecord>) {
  return detectAnamnesisCrisisRedFlagIds(answers).length > 0
}

function rankRedFlagDefinition(left: RedFlagDefinition, right: RedFlagDefinition) {
  const severityDelta =
    (SEVERITY_RANK[right.severity] ?? 0) - (SEVERITY_RANK[left.severity] ?? 0)
  if (severityDelta !== 0) return severityDelta
  return (right.priority ?? 0) - (left.priority ?? 0)
}

function pickLeadingRedFlagDefinition(flagIds: string[]) {
  const definitions = flagIds
    .map((id) => getRedFlagDefinition(id))
    .filter((item): item is RedFlagDefinition => Boolean(item))

  if (!definitions.length) return null
  return [...definitions].sort(rankRedFlagDefinition)[0]
}

function pickLeadingRedFlagFromState(activeRedFlags: ActiveRedFlag[]) {
  const open = getOpenRedFlags(activeRedFlags)
  const definitions = open
    .map((flag) => getRedFlagDefinition(flag.red_flag_id))
    .filter((item): item is RedFlagDefinition => Boolean(item))

  if (!definitions.length) return null
  return [...definitions].sort(rankRedFlagDefinition)[0]
}

function shouldSurfaceCrisisForDefinition(definition: RedFlagDefinition) {
  return (
    definition.actions?.show_crisis_screen === true ||
    definition.actions?.block_micro_activity_plan === true
  )
}

export function shouldShowCrisisFlow(activeRedFlags: ActiveRedFlag[] = []) {
  const open = getOpenRedFlags(activeRedFlags)
  return open.some((flag) => {
    const definition = getRedFlagDefinition(flag.red_flag_id)
    return definition ? shouldSurfaceCrisisForDefinition(definition) : false
  })
}

export function shouldBlockMentalHealthPlan(activeRedFlags: ActiveRedFlag[] = []) {
  return shouldBlockMicroPlan(activeRedFlags)
}

function shouldApplyClinicalCrisisForCheckIn(
  hasClinicalCrisisSignal: boolean,
  latestMood: MentalHealthMoodLevelId | null,
  hasCheckInToday: boolean,
) {
  if (!hasClinicalCrisisSignal) return false
  if (!hasCheckInToday || latestMood == null) return true
  return isCrisisCheckInMood(latestMood)
}

export function shouldBlockPlanConsideringCheckIn(
  activeRedFlags: ActiveRedFlag[] = [],
  latestMood: MentalHealthMoodLevelId | null = null,
  hasCheckInToday = false,
) {
  return shouldApplyClinicalCrisisForCheckIn(
    shouldBlockMentalHealthPlan(activeRedFlags),
    latestMood,
    hasCheckInToday,
  )
}

export function shouldShowCrisisFlowConsideringCheckIn(
  activeRedFlags: ActiveRedFlag[] = [],
  latestMood: MentalHealthMoodLevelId | null = null,
  hasCheckInToday = false,
) {
  return shouldApplyClinicalCrisisForCheckIn(
    shouldShowCrisisFlow(activeRedFlags),
    latestMood,
    hasCheckInToday,
  )
}

export function shouldSurfaceCrisisConsideringCheckIn(
  activeRedFlags: ActiveRedFlag[] = [],
  latestMood: MentalHealthMoodLevelId | null = null,
  hasCheckInToday = false,
) {
  return (
    shouldBlockPlanConsideringCheckIn(activeRedFlags, latestMood, hasCheckInToday) ||
    shouldShowCrisisFlowConsideringCheckIn(activeRedFlags, latestMood, hasCheckInToday)
  )
}

const SKIPPED_CRISIS_ROUTE_IDS = new Set([
  'route_human_clinical',
  'route_pause_self_guided',
  'route_crisis_chat',
])

function buildRouteAction(route: ResponseRoute): CrisisRouteAction {
  if (route.id === 'route_emergency_contacts') {
    return {
      id: route.id,
      label: 'Falar com um contato de emergência',
      description: 'Veja seus contatos salvos ou cadastre alguém de confiança para ligar agora.',
      kind: 'emergency_contacts',
      enabled: true,
    }
  }

  if (route.type === 'external_helpline' || route.type === 'emergency_service') {
    return {
      id: route.id,
      label: route.user_label,
      description: route.user_description,
      kind: 'phone',
      phone: route.phone,
      enabled: route.enabled !== false,
    }
  }

  return {
    id: route.id,
    label: route.user_label,
    description: route.user_description,
    kind: 'info',
    enabled: route.enabled !== false,
  }
}

function collectRoutesForDefinition(definition: RedFlagDefinition): CrisisRouteAction[] {
  const routeIds = new Set<string>()
  const actions = definition.actions

  if (actions?.route_primary) routeIds.add(actions.route_primary)
  for (const routeId of actions?.routes_secondary ?? []) {
    routeIds.add(routeId)
  }

  routeIds.add('route_emergency_contacts')

  const routes: CrisisRouteAction[] = []

  for (const routeId of routeIds) {
    if (SKIPPED_CRISIS_ROUTE_IDS.has(routeId)) continue
    const route = getResponseRoute(routeId)
    if (!route || route.enabled === false) continue
    routes.push(buildRouteAction(route))
  }

  if (!routes.some((route) => route.id === 'route_cvv')) {
    const cvv = getResponseRoute('route_cvv')
    if (cvv) routes.unshift(buildRouteAction(cvv))
  }

  const seen = new Set<string>()
  return routes.filter((route) => {
    if (seen.has(route.id)) return false
    seen.add(route.id)
    return true
  })
}

function buildPresentation(definition: RedFlagDefinition | null): CrisisPresentation {
  const fallback = DEFAULT_MESSAGING.crisis_screen_default
  const userFacing = definition?.user_facing

  const title = userFacing?.screen_title ?? fallback?.title ?? 'Estamos aqui com você'
  const message =
    userFacing?.screen_message ??
    fallback?.message ??
    'Algumas respostas sugerem que falar com alguém agora é o melhor próximo passo.'
  const disclaimer =
    fallback?.disclaimer ??
    DEFAULT_MESSAGING.emergency_disclaimer_pt_br ??
    'Este app não substitui atendimento de emergência.'

  const fallbackRoutes = ['route_cvv', 'route_emergency_contacts']
    .map((routeId) => getResponseRoute(routeId))
    .filter((route): route is ResponseRoute => Boolean(route))
    .map((route) => buildRouteAction(route))

  const routes = definition ? collectRoutesForDefinition(definition) : fallbackRoutes

  return {
    title,
    message,
    disclaimer,
    routes,
    allowAcknowledge: definition?.actions?.allow_user_to_continue_after_acknowledgment === true,
    leadingRedFlagId: definition?.id ?? null,
  }
}

export function resolveCrisisPresentationFromFlagIds(flagIds: string[]): CrisisPresentation {
  const leading = pickLeadingRedFlagDefinition(flagIds)
  if (!leading) {
    return buildPresentation(null)
  }
  return buildPresentation(leading)
}

export function resolveCrisisPresentationFromState(
  activeRedFlags: ActiveRedFlag[] = [],
): CrisisPresentation | null {
  if (!shouldShowCrisisFlow(activeRedFlags) && !shouldBlockMentalHealthPlan(activeRedFlags)) {
    return null
  }

  const leading = pickLeadingRedFlagFromState(activeRedFlags)
  return buildPresentation(leading)
}
