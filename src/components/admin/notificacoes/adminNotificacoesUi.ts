import type { AdminBroadcast, AdminNotificationPriority } from '../../../data/adminNotificacoesMock'
import { supportSourceBadgeConfig } from '../../suporte/supportSourceBadgeConfig'
import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'

export function formatAdminNotificationDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function formatAdminNotificationDateCompact(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date(iso))
    .replace(',', '')
}

export function buildAdminNotificationPriorityBadge(
  priority: AdminNotificationPriority,
): SituationStatusBadgeStyle {
  if (priority === 'important') {
    return {
      label: 'Importante',
      text: 'text-amber-800',
      accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-[#ff6b00]',
      lineGlow: 'shadow-[0_2px_10px_rgba(255,107,0,0.55)]',
    }
  }
  return {
    label: 'Normal',
    text: 'text-gray-600',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(100,116,139,0.35)]',
  }
}

export type AdminBroadcastTargetFilter = 'all' | 'prefeitura' | 'ubt' | 'ambos'

export function getBroadcastTargetKinds(broadcast: AdminBroadcast): AdminBroadcastTargetFilter {
  const channels = new Set(broadcast.targets.map((t) => t.channel))
  if (channels.has('prefeitura') && channels.has('ubt')) return 'ambos'
  if (channels.has('prefeitura')) return 'prefeitura'
  if (channels.has('ubt')) return 'ubt'
  return 'all'
}

export function buildAdminTargetChannelBadge(
  kind: 'prefeitura' | 'ubt',
): SituationStatusBadgeStyle {
  return supportSourceBadgeConfig[kind]
}
