import type { EntidadeCopy } from '../../../lib/entidadeBranding/copy'
import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'
import type {
  PrefeituraNotification,
  PrefeituraNotificationAudience,
  PrefeituraNotificationOrigin,
} from '../../../data/prefeituraNotificacoesMock'

const originLabels: Record<PrefeituraNotificationOrigin, string> = {
  telefarmed: 'Telefarmed',
  ubt: 'UBT',
  contract_manager: 'Gestão municipal',
  profissional: 'Corpo clínico',
}

const audienceLabels: Record<PrefeituraNotificationAudience, string> = {
  contract_manager: 'Gestor do contrato',
  ubt_all: 'UBT inteira',
  ubt_responsible: 'Responsável',
  ubt_user: 'Usuário específico',
  medico_all: 'Todos os médicos',
  medico_plantao: 'Plantão atual',
  medico_especialidade: 'Por especialidade',
}

export function getPrefeituraNotificationOriginLabel(
  origin: PrefeituraNotificationOrigin,
  copy?: Pick<EntidadeCopy, 'gestaoLabel'> & { platformOperatorLabel?: string },
) {
  if (origin === 'contract_manager' && copy) return copy.gestaoLabel
  if (origin === 'telefarmed' && copy?.platformOperatorLabel) return copy.platformOperatorLabel
  return originLabels[origin]
}

export function getPrefeituraNotificationAudienceLabel(audience: PrefeituraNotificationAudience) {
  return audienceLabels[audience]
}

export function formatPrefeituraNotificationDate(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

/** Data compacta para colunas da tabela (sem scroll horizontal). */
export function formatPrefeituraNotificationDateCompact(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatPrefeituraNotificationRelative(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d`
  return formatPrefeituraNotificationDate(iso)
}

export function buildPrefeituraNotificationOriginBadge(
  origin: PrefeituraNotificationOrigin,
): SituationStatusBadgeStyle {
  if (origin === 'telefarmed') {
    return {
      label: 'Telefarmed',
      text: 'text-orange-700',
      accent: 'bg-[var(--brand-primary)]',
      lineGlow: 'shadow-[0_0_8px_rgba(249,115,22,0.45)]',
    }
  }
  if (origin === 'ubt') {
    return {
      label: 'UBT',
      text: 'text-blue-700',
      accent: 'bg-blue-500',
      lineGlow: 'shadow-[0_0_8px_rgba(59,130,246,0.45)]',
    }
  }
  if (origin === 'profissional') {
    return {
      label: 'Corpo clínico',
      text: 'text-violet-700',
      accent: 'bg-violet-500',
      lineGlow: 'shadow-[0_0_8px_rgba(139,92,246,0.45)]',
    }
  }
  return {
    label: 'Enviada',
    text: 'text-emerald-700',
    accent: 'bg-emerald-500',
    lineGlow: 'shadow-[0_0_8px_rgba(16,185,129,0.45)]',
  }
}

export function buildPrefeituraNotificationPriorityBadge(
  priority: PrefeituraNotification['priority'],
): SituationStatusBadgeStyle {
  if (priority === 'important') {
    return {
      label: 'Importante',
      text: 'text-amber-800',
      accent: 'bg-amber-500',
      lineGlow: 'shadow-[0_0_8px_rgba(245,158,11,0.45)]',
    }
  }
  return {
    label: 'Normal',
    text: 'text-gray-600',
    accent: 'bg-gray-400',
    lineGlow: 'shadow-[0_0_6px_rgba(156,163,175,0.35)]',
  }
}

export function isPrefeituraNotificationUnread(notification: PrefeituraNotification) {
  return notification.readAt === null && notification.direction === 'inbox'
}
