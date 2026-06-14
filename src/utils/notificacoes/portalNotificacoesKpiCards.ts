import { AlertTriangle, Bell, Building2, Inbox, Send, Stethoscope } from 'lucide-react'
import type { KpiStatCardItem } from '../../components/ui/KpiStatCards'
import type { PrefeituraNotification } from '../../data/prefeituraNotificacoesMock'
import type { ProfissionalNotificationKpisResponse } from '../../lib/services/profissional/notificacoes'
import type { PortalNotificationKpisResponse } from '../../lib/services/prefeitura/notificacoes'
import type { UbtNotificationKpisResponse } from '../../lib/services/ubt/notificacoes'

export function buildPrefeituraNotificacoesKpiCards(
  kpis: PortalNotificationKpisResponse,
): KpiStatCardItem[] {
  return [
    {
      label: 'Não lidas',
      value: String(kpis.unreadCount),
      suffix: 'na caixa de entrada',
      icon: Bell,
      iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
      iconRing: 'ring-orange-100/80',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Recebidas',
      value: String(kpis.inboxCount),
      suffix: 'últimos 7 dias',
      icon: Inbox,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
      iconRing: 'ring-blue-100/80',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Enviadas por você',
      value: String(kpis.sentCount),
      suffix: 'neste mês',
      icon: Send,
      iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
      iconRing: 'ring-violet-100/80',
      topBar: 'from-violet-400 to-purple-500',
    },
    {
      label: 'UBTs alcançadas',
      value: String(kpis.lastBroadcastUbtCount),
      suffix: 'no último envio em massa',
      icon: Building2,
      iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-green-500',
    },
  ]
}

export function buildUbtNotificacoesKpiCards(kpis: UbtNotificationKpisResponse): KpiStatCardItem[] {
  return [
    {
      label: 'Não lidas',
      value: String(kpis.unreadCount),
      suffix: 'na caixa de entrada',
      icon: Bell,
      iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
      iconRing: 'ring-orange-100/80',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Recebidas',
      value: String(kpis.inboxCount),
      suffix: 'nesta unidade',
      icon: Inbox,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
      iconRing: 'ring-blue-100/80',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Enviadas por você',
      value: String(kpis.sentCount),
      suffix: 'para a gestão',
      icon: Send,
      iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
      iconRing: 'ring-violet-100/80',
      topBar: 'from-violet-400 to-purple-500',
    },
    {
      label: 'Da Telefarmed',
      value: String(kpis.telefarmedInboxCount),
      suffix: 'últimos 7 dias',
      icon: Building2,
      iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-green-500',
    },
  ]
}

export function buildProfissionalNotificacoesKpiCards(
  kpis: ProfissionalNotificationKpisResponse,
  notifications: PrefeituraNotification[] = [],
): KpiStatCardItem[] {
  const importantCount = notifications.filter(
    (item) => item.direction === 'inbox' && item.priority === 'important',
  ).length

  return [
    {
      label: 'Não lidas',
      value: String(kpis.unreadCount),
      suffix: 'na caixa de entrada',
      icon: Bell,
      iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
      iconRing: 'ring-orange-100/80',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Recebidas',
      value: String(kpis.inboxCount),
      suffix: 'endereçadas a você',
      icon: Inbox,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
      iconRing: 'ring-blue-100/80',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Importantes',
      value: String(importantCount),
      suffix: 'prioridade alta',
      icon: AlertTriangle,
      iconGradient: 'from-amber-500 via-orange-500 to-amber-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.35)]',
      iconRing: 'ring-amber-100/80',
      topBar: 'from-amber-400 to-orange-500',
    },
    {
      label: 'Da Telefarmed',
      value: String(kpis.telefarmedInboxCount),
      suffix: 'somente leitura',
      icon: Stethoscope,
      iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-green-500',
    },
  ]
}

export const emptyPortalNotificationKpis = {
  unreadCount: 0,
  inboxCount: 0,
  sentCount: 0,
  telefarmedInboxCount: 0,
  lastBroadcastUbtCount: 0,
} as const
