import { Bell, Building2, Inbox, Send } from 'lucide-react'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import { brand } from '../config/brand'
import { currentUbtUnit } from '../config/ubtSession'
import type {
  PrefeituraNotification,
  PrefeituraNotificacoesOriginSlice,
} from './prefeituraNotificacoesMock'
import { isPrefeituraNotificationUnread } from '../components/prefeitura/notificacoes/prefeituraNotificacoesUi'

const operatorSender = `${currentUbtUnit.name} · ${brand.operatorName}`

/** Mensagens da gestão municipal ou Telefarmed endereçadas a esta UBT. */
function isInboxForCurrentUbt(notification: PrefeituraNotification) {
  if (notification.direction !== 'inbox') return false

  if (notification.origin === 'telefarmed') {
    return (
      notification.audience === 'ubt_all' ||
      (notification.unitId === currentUbtUnit.id &&
        (notification.audience === 'ubt_responsible' ||
          notification.audience === 'ubt_user'))
    )
  }

  if (notification.origin === 'contract_manager') {
    return (
      notification.audience === 'ubt_all' ||
      notification.unitId === currentUbtUnit.id
    )
  }

  return false
}

function isSentByCurrentUbt(notification: PrefeituraNotification) {
  return (
    notification.direction === 'sent' &&
    notification.origin === 'ubt' &&
    notification.unitId === currentUbtUnit.id
  )
}

export function buildUbtNotificationsSeed(): PrefeituraNotification[] {
  return [
    {
      id: 'ubt-n-001',
      direction: 'inbox',
      origin: 'telefarmed',
      audience: 'ubt_responsible',
      title: 'Atualização de agenda compartilhada — maio/2026',
      body: 'A partir de 22/05, novos slots de clínica geral foram liberados para a UBT Centro no turno da tarde. Confira a agenda antes do primeiro atendimento do dia. Dúvidas operacionais: use Suporte técnico (não responda por este canal).',
      sentAt: '2026-05-21T10:05:00',
      readAt: null,
      unitId: currentUbtUnit.id,
      unitName: currentUbtUnit.name,
      senderLabel: 'Telefarmed · Operações',
      recipientLabel: `Responsável · ${currentUbtUnit.name}`,
      priority: 'important',
    },
    {
      id: 'ubt-n-002',
      direction: 'inbox',
      origin: 'contract_manager',
      audience: 'ubt_responsible',
      title: 'Campanha de vacinação — reforço na triagem',
      body: 'Durante a semana de 19 a 23/05, priorizar identificação de pacientes com sintomas gripais na triagem e registrar observação “campanha gripe” quando aplicável. Material de apoio enviado aos responsáveis por e-mail.',
      sentAt: '2026-05-17T14:00:00',
      readAt: null,
      unitId: currentUbtUnit.id,
      unitName: currentUbtUnit.name,
      senderLabel: 'Gestão municipal',
      recipientLabel: `Responsável · ${currentUbtUnit.name}`,
      priority: 'important',
    },
    {
      id: 'ubt-n-003',
      direction: 'inbox',
      origin: 'telefarmed',
      audience: 'ubt_all',
      title: 'Manutenção programada — domingo 25/05',
      body: 'Haverá janela de manutenção no domingo, das 02h às 05h (horário de Brasília). Durante o período, triagem e fila podem apresentar atraso na atualização. Não é necessária ação adicional na unidade.',
      sentAt: '2026-05-20T16:30:00',
      readAt: '2026-05-20T18:00:00',
      unitId: currentUbtUnit.id,
      unitName: currentUbtUnit.name,
      senderLabel: 'Telefarmed · Infraestrutura',
      recipientLabel: `Todas as UBTs · inclui ${currentUbtUnit.name}`,
      priority: 'normal',
    },
    {
      id: 'ubt-n-004',
      direction: 'inbox',
      origin: 'contract_manager',
      audience: 'ubt_user',
      title: 'Parabenização equipe da recepção',
      body: 'Mensagem da gestão municipal para a equipe da UBT Centro: a unidade liderou o ranking municipal de SLA na última semana. Parabéns pelo trabalho!',
      sentAt: '2026-05-15T17:45:00',
      readAt: '2026-05-16T08:10:00',
      unitId: currentUbtUnit.id,
      unitName: currentUbtUnit.name,
      senderLabel: 'Gestão municipal',
      recipientLabel: `${brand.operatorName} · ${currentUbtUnit.name}`,
      priority: 'normal',
    },
    {
      id: 'ubt-n-005',
      direction: 'inbox',
      origin: 'telefarmed',
      audience: 'ubt_responsible',
      title: 'Boas práticas LGPD — versão 3.2',
      body: 'Material atualizado para operadores de UBT disponível no portal. Recomendamos leitura até 30/05 e registro de ciência na próxima reunião de equipe.',
      sentAt: '2026-05-10T15:00:00',
      readAt: null,
      unitId: currentUbtUnit.id,
      unitName: currentUbtUnit.name,
      senderLabel: 'Telefarmed · Compliance',
      recipientLabel: `Responsável · ${currentUbtUnit.name}`,
      priority: 'normal',
    },
    {
      id: 'ubt-n-006',
      direction: 'sent',
      origin: 'ubt',
      audience: 'contract_manager',
      title: 'Solicitação de ampliação de agenda',
      body: 'Reportamos aumento de 28% na demanda de clínica geral nas últimas duas semanas e solicitamos liberação de mais slots na agenda compartilhada da tarde.',
      sentAt: '2026-05-19T11:15:00',
      readAt: '2026-05-19T11:15:00',
      unitId: currentUbtUnit.id,
      unitName: currentUbtUnit.name,
      senderLabel: operatorSender,
      recipientLabel: 'Gestão do contrato municipal',
      priority: 'normal',
    },
    {
      id: 'ubt-n-007',
      direction: 'sent',
      origin: 'ubt',
      audience: 'contract_manager',
      title: 'Confirmação de treinamento concluído',
      body: 'Equipe da UBT Centro concluiu o treinamento de boas práticas em telemedicina (módulo 2). Certificados arquivados na unidade.',
      sentAt: '2026-05-18T09:40:00',
      readAt: '2026-05-18T09:40:00',
      unitId: currentUbtUnit.id,
      unitName: currentUbtUnit.name,
      senderLabel: operatorSender,
      recipientLabel: 'Gestão do contrato municipal',
      priority: 'normal',
    },
    {
      id: 'ubt-n-008',
      direction: 'inbox',
      origin: 'contract_manager',
      audience: 'ubt_all',
      title: 'Lembrete: fechamento mensal de maio',
      body: 'O fechamento operacional de maio será consolidado no dia 31/05. Tratem pendências de agenda e cadastros incompletos até o dia 28.',
      sentAt: '2026-05-12T08:00:00',
      readAt: '2026-05-12T10:20:00',
      unitId: currentUbtUnit.id,
      unitName: currentUbtUnit.name,
      senderLabel: 'Gestão municipal',
      recipientLabel: `Todas as UBTs · inclui ${currentUbtUnit.name}`,
      priority: 'normal',
    },
  ]
}

export function computeUbtNotificacoesKpiCards(
  notifications: PrefeituraNotification[],
): KpiStatCardItem[] {
  const unread = notifications.filter(isPrefeituraNotificationUnread).length
  const inbox = notifications.filter((n) => n.direction === 'inbox').length
  const sent = notifications.filter(isSentByCurrentUbt).length
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
      suffix: 'nesta unidade',
      icon: Inbox,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
      iconRing: 'ring-blue-100/80',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Enviadas por você',
      value: String(sent),
      suffix: 'para a gestão',
      icon: Send,
      iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
      iconRing: 'ring-violet-100/80',
      topBar: 'from-violet-400 to-purple-500',
    },
    {
      label: 'Da Telefarmed',
      value: String(fromTelefarmed),
      suffix: 'somente leitura',
      icon: Building2,
      iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-green-500',
    },
  ]
}

export function computeUbtNotificacoesOriginSlices(
  notifications: PrefeituraNotification[],
): PrefeituraNotificacoesOriginSlice[] {
  const telefarmed = notifications.filter(
    (n) => n.direction === 'inbox' && n.origin === 'telefarmed',
  )
  const gestao = notifications.filter(
    (n) => n.direction === 'inbox' && n.origin === 'contract_manager',
  )
  const sent = notifications.filter(isSentByCurrentUbt)

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
      key: 'ubt',
      label: 'Enviadas por você',
      count: sent.length,
      unread: 0,
    },
  ]
}

/** Garante que notificações de outras UBTs ou envios à Telefarmed não entrem na lista. */
export function sanitizeUbtNotifications(
  notifications: PrefeituraNotification[],
): PrefeituraNotification[] {
  return notifications.filter(
    (item) => isInboxForCurrentUbt(item) || isSentByCurrentUbt(item),
  )
}

export const ubtCannotNotifyTelefarmedHint =
  'A Telefarmed não recebe mensagens enviadas por unidades. Para falar com a operadora, use Suporte técnico.'
