import { AlertTriangle, Bell, Inbox, Stethoscope } from 'lucide-react'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import { isPrefeituraNotificationUnread } from '../components/prefeitura/notificacoes/prefeituraNotificacoesUi'
import { profissionalLoggedProfile } from './profissionalPerfilMock'
import type {
  PrefeituraNotification,
  PrefeituraNotificacoesOriginSlice,
} from './prefeituraNotificacoesMock'

const logged = profissionalLoggedProfile

function isMedicoAudience(notification: PrefeituraNotification) {
  return (
    notification.audience === 'medico_all' ||
    notification.audience === 'medico_plantao' ||
    notification.audience === 'medico_especialidade'
  )
}

function matchesSpecialtyFilter(notification: PrefeituraNotification) {
  if (notification.audience !== 'medico_especialidade') return true
  if (!notification.specialtyFilter) return true
  return notification.specialtyFilter === logged.specialty
}

/** Mensagens recebidas pelo profissional logado. */
export function isInboxForLoggedProfissional(notification: PrefeituraNotification) {
  if (notification.direction !== 'inbox') return false

  if (notification.professionalId && notification.professionalId !== logged.id) {
    return false
  }

  if (notification.origin === 'telefarmed' || notification.origin === 'contract_manager') {
    return isMedicoAudience(notification) && matchesSpecialtyFilter(notification)
  }

  if (notification.origin === 'profissional') {
    return (
      notification.professionalId === logged.id ||
      (isMedicoAudience(notification) && matchesSpecialtyFilter(notification))
    )
  }

  return false
}

export function buildProfissionalNotificationsSeed(): PrefeituraNotification[] {
  return [
    {
      id: 'prof-n-001',
      direction: 'inbox',
      origin: 'telefarmed',
      audience: 'medico_all',
      title: 'Atualização de protocolo — teleconsulta pediátrica',
      body: 'Novo fluxo de encaminhamento para pediatria em plantão noturno. Revise o material na central de ajuda antes do próximo turno.',
      sentAt: '2026-05-22T09:10:00',
      readAt: null,
      senderLabel: 'Telefarmed · Operações clínicas',
      recipientLabel: 'Todos os médicos da rede',
      priority: 'important',
    },
    {
      id: 'prof-n-002',
      direction: 'inbox',
      origin: 'contract_manager',
      audience: 'medico_plantao',
      title: 'Meta de TMA — reforço no plantão de hoje',
      body: 'Gestão municipal solicita atenção ao tempo médio de atendimento nas próximas 6 horas. Priorize fila com espera acima de 12 minutos.',
      sentAt: '2026-05-22T07:45:00',
      readAt: null,
      senderLabel: 'Gestão municipal',
      recipientLabel: 'Médicos no plantão atual',
      priority: 'important',
    },
    {
      id: 'prof-n-003',
      direction: 'inbox',
      origin: 'telefarmed',
      audience: 'medico_especialidade',
      specialtyFilter: 'Clínica Médica',
      title: 'Webinar CFM — prescrição digital',
      body: 'Transmissão ao vivo na quinta-feira, 19h, sobre receitas controladas em telemedicina. Inscrição pelo portal do CFM.',
      sentAt: '2026-05-20T14:00:00',
      readAt: '2026-05-21T08:30:00',
      senderLabel: 'Telefarmed · Educação',
      recipientLabel: `Médicos · ${logged.specialty}`,
      priority: 'normal',
    },
    {
      id: 'prof-n-004',
      direction: 'inbox',
      origin: 'profissional',
      audience: 'medico_plantao',
      title: 'Passagem de plantão — fila prioritária',
      body: 'Deixo dois casos em acompanhamento na fila: gestante 32 sem (queixa dispneia) e idoso com PA limítrofe. Ambos com triagem laranja.',
      sentAt: '2026-05-21T22:15:00',
      readAt: null,
      senderLabel: 'CRM-RJ 445566 · Dr. Ricardo Alves',
      recipientLabel: 'Médicos no plantão atual',
      priority: 'important',
      senderProfessionalId: 'coord-02',
    },
    {
      id: 'prof-n-007',
      direction: 'inbox',
      origin: 'contract_manager',
      audience: 'medico_all',
      title: 'Pesquisa de satisfação — maio/2026',
      body: 'Responda a pesquisa rápida (3 min) sobre experiência no painel profissional. Link enviado por e-mail institucional.',
      sentAt: '2026-05-15T10:00:00',
      readAt: '2026-05-16T09:00:00',
      senderLabel: 'Gestão municipal',
      recipientLabel: 'Todos os médicos da rede',
      priority: 'normal',
    },
  ]
}

export function computeProfissionalNotificacoesKpiCards(
  notifications: PrefeituraNotification[],
): KpiStatCardItem[] {
  const unread = notifications.filter(isPrefeituraNotificationUnread).length
  const inbox = notifications.filter((n) => n.direction === 'inbox').length
  const important = notifications.filter(
    (n) => n.direction === 'inbox' && n.priority === 'important',
  ).length
  const fromTelefarmed = notifications.filter(
    (n) => n.direction === 'inbox' && n.origin === 'telefarmed',
  ).length

  return [
    {
      label: 'Não lidas',
      value: String(unread),
      suffix: 'na caixa de entrada',
      icon: Bell,
      iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
      iconRing: 'ring-orange-100/80',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Recebidas',
      value: String(inbox),
      suffix: 'endereçadas a você',
      icon: Inbox,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
      iconRing: 'ring-blue-100/80',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Importantes',
      value: String(important),
      suffix: 'prioridade alta',
      icon: AlertTriangle,
      iconGradient: 'from-amber-500 via-orange-500 to-amber-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.35)]',
      iconRing: 'ring-amber-100/80',
      topBar: 'from-amber-400 to-orange-500',
    },
    {
      label: 'Da Telefarmed',
      value: String(fromTelefarmed),
      suffix: 'somente leitura',
      icon: Stethoscope,
      iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-green-500',
    },
  ]
}

export function computeProfissionalNotificacoesOriginSlices(
  notifications: PrefeituraNotification[],
): PrefeituraNotificacoesOriginSlice[] {
  const telefarmed = notifications.filter(
    (n) => n.direction === 'inbox' && n.origin === 'telefarmed',
  )
  const gestao = notifications.filter(
    (n) => n.direction === 'inbox' && n.origin === 'contract_manager',
  )
  const corpoClinico = notifications.filter(
    (n) => n.direction === 'inbox' && n.origin === 'profissional',
  )
  return [
    {
      key: 'telefarmed',
      label: 'Telefarmed',
      count: telefarmed.length,
      unread: telefarmed.filter(isPrefeituraNotificationUnread).length,
    },
    {
      key: 'contract_manager',
      label: 'Gestão municipal',
      count: gestao.length,
      unread: gestao.filter(isPrefeituraNotificationUnread).length,
    },
    {
      key: 'profissional',
      label: 'Corpo clínico',
      count: corpoClinico.length,
      unread: corpoClinico.filter(isPrefeituraNotificationUnread).length,
    },
  ]
}

export function sanitizeProfissionalNotifications(
  notifications: PrefeituraNotification[],
): PrefeituraNotification[] {
  return notifications.filter(isInboxForLoggedProfissional)
}
