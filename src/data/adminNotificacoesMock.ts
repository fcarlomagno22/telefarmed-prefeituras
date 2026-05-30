import { Bell, Building2, Landmark, Send } from 'lucide-react'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import { brand } from '../config/brand'

export type AdminNotificationPriority = 'normal' | 'important'

export type AdminNotificationTargetChannel = 'prefeitura' | 'ubt'

export type AdminNotificationSelectionMode = 'all' | 'selected'

export type AdminNotificationTargetSnapshot = {
  channel: AdminNotificationTargetChannel
  mode: AdminNotificationSelectionMode
  recipientIds: string[]
  recipientLabels: string[]
  count: number
}

export type AdminBroadcast = {
  id: string
  title: string
  body: string
  sentAt: string
  priority: AdminNotificationPriority
  sentBy: string
  targets: AdminNotificationTargetSnapshot[]
  recipientCount: number
  recipientSummary: string
}

export const adminNotificacoesKpiCards: KpiStatCardItem[] = [
  {
    label: 'Envios no mês',
    value: '14',
    suffix: 'comunicados disparados',
    icon: Send,
    iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
    iconRing: 'ring-violet-100/80',
    topBar: 'from-violet-400 to-purple-500',
  },
  {
    label: 'Prefeituras alcançadas',
    value: '4',
    suffix: 'no último envio em massa',
    icon: Landmark,
    iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
    iconRing: 'ring-orange-100/80',
    topBar: 'from-orange-400 to-amber-500',
  },
  {
    label: 'UBTs alcançadas',
    value: '24',
    suffix: 'último comunicado à rede',
    icon: Building2,
    iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
    iconRing: 'ring-blue-100/80',
    topBar: 'from-sky-400 to-blue-500',
  },
  {
    label: 'Com prioridade alta',
    value: '3',
    suffix: 'aguardando leitura',
    icon: Bell,
    iconGradient: 'from-rose-500 via-red-500 to-red-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
    iconRing: 'ring-red-100/80',
    topBar: 'from-rose-400 to-red-500',
  },
]

export const adminBroadcastsInitial: AdminBroadcast[] = [
  {
    id: 'adm-n-001',
    title: 'Manutenção programada — domingo 25/05',
    body: 'Informamos manutenção no ambiente Telefarmed no domingo, das 02h às 06h. Triagem e agenda podem ficar indisponíveis nesse intervalo.',
    sentAt: '2026-05-20T14:30:00',
    priority: 'important',
    sentBy: brand.adminOperatorName,
    targets: [
      {
        channel: 'prefeitura',
        mode: 'all',
        recipientIds: [],
        recipientLabels: ['Todas as prefeituras ativas'],
        count: 4,
      },
      {
        channel: 'ubt',
        mode: 'all',
        recipientIds: [],
        recipientLabels: ['Todas as UBTs'],
        count: 24,
      },
    ],
    recipientCount: 28,
    recipientSummary: '4 prefeituras · 24 UBTs',
  },
  {
    id: 'adm-n-002',
    title: 'Novo relatório de utilização do contrato',
    body: 'Liberamos no painel municipal o relatório consolidado de utilização do pacote contratado, com exportação em PDF e Excel.',
    sentAt: '2026-05-18T10:15:00',
    priority: 'normal',
    sentBy: brand.adminOperatorName,
    targets: [
      {
        channel: 'prefeitura',
        mode: 'selected',
        recipientIds: ['cli-bsb', 'cli-campinas'],
        recipientLabels: ['Brasília', 'Campinas'],
        count: 2,
      },
    ],
    recipientCount: 2,
    recipientSummary: '2 prefeituras',
  },
  {
    id: 'adm-n-003',
    title: 'Atualização de credenciais de operadores',
    body: 'Reforce com as unidades a necessidade de redefinir senhas provisórias no primeiro acesso após o cadastro de novos operadores.',
    sentAt: '2026-05-17T16:40:00',
    priority: 'normal',
    sentBy: brand.adminOperatorName,
    targets: [
      {
        channel: 'ubt',
        mode: 'selected',
        recipientIds: ['ubt-centro', 'ubt-norte', 'ubt-taguatinga'],
        recipientLabels: ['UBT Centro Histórico', 'UBT Norte I', 'UBT Taguatinga'],
        count: 3,
      },
    ],
    recipientCount: 3,
    recipientSummary: '3 UBTs',
  },
  {
    id: 'adm-n-004',
    title: 'Campanha de vacinação — comunicado às unidades',
    body: 'Divulguem nas recepções o calendário municipal de vacinação disponível no portal da secretaria.',
    sentAt: '2026-05-15T09:00:00',
    priority: 'important',
    sentBy: brand.adminOperatorName,
    targets: [
      {
        channel: 'ubt',
        mode: 'all',
        recipientIds: [],
        recipientLabels: ['Todas as UBTs'],
        count: 24,
      },
    ],
    recipientCount: 24,
    recipientSummary: '24 UBTs',
  },
  {
    id: 'adm-n-005',
    title: 'Boas-vindas — implantação Anápolis',
    body: 'Equipe Telefarmed à disposição para o go-live da prefeitura de Anápolis. Canal de suporte liberado no painel municipal.',
    sentAt: '2026-05-12T11:20:00',
    priority: 'normal',
    sentBy: brand.adminOperatorName,
    targets: [
      {
        channel: 'prefeitura',
        mode: 'selected',
        recipientIds: ['cli-anapolis'],
        recipientLabels: ['Anápolis'],
        count: 1,
      },
    ],
    recipientCount: 1,
    recipientSummary: '1 prefeitura',
  },
]

export function buildRecipientSummary(targets: AdminNotificationTargetSnapshot[]) {
  const parts = targets
    .filter((target) => target.count > 0)
    .map((target) => {
      const label = target.channel === 'prefeitura' ? 'prefeitura' : 'UBT'
      return `${target.count} ${label}${target.count === 1 ? '' : 's'}`
    })
  return parts.join(' · ') || '—'
}
