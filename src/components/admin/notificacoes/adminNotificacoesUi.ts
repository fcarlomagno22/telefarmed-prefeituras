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

export type AdminBroadcastTargetFilter = 'all' | 'prefeitura' | 'ubt' | 'medico' | 'ambos'

export function getBroadcastTargetKinds(broadcast: AdminBroadcast): AdminBroadcastTargetFilter {
  const channels = new Set(broadcast.targets.map((t) => t.channel))
  if (channels.size > 1) return 'ambos'
  if (channels.has('prefeitura')) return 'prefeitura'
  if (channels.has('ubt')) return 'ubt'
  if (channels.has('medico')) return 'medico'
  return 'all'
}

export type AdminBroadcastChannelKind = 'prefeitura' | 'ubt' | 'medico'

const BROADCAST_CHANNEL_ORDER: AdminBroadcastChannelKind[] = ['prefeitura', 'ubt', 'medico']

export function getBroadcastUniqueChannels(broadcast: AdminBroadcast): AdminBroadcastChannelKind[] {
  const set = new Set(broadcast.targets.map((target) => target.channel))
  return BROADCAST_CHANNEL_ORDER.filter((channel) => set.has(channel))
}

export function adminTargetChannelWidthClass(kind: AdminBroadcastChannelKind): string {
  if (kind === 'medico') return 'w-[5.5rem]'
  if (kind === 'prefeitura') return 'w-[5rem]'
  return 'w-[3.5rem]'
}

export function buildAdminTargetChannelBadge(
  kind: AdminBroadcastChannelKind,
): SituationStatusBadgeStyle {
  if (kind === 'medico') {
    return {
      label: 'Profissionais',
      text: 'text-emerald-800',
      accent: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600',
      lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.45)]',
    }
  }
  return supportSourceBadgeConfig[kind]
}
