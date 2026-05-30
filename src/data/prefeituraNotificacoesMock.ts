import { Bell, Building2, Inbox, Send } from 'lucide-react'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'

export type PrefeituraNotificationDirection = 'inbox' | 'sent'

/** Quem originou a mensagem no fluxo municipal. */
export type PrefeituraNotificationOrigin =
  | 'telefarmed'
  | 'ubt'
  | 'contract_manager'
  | 'profissional'

/** Para quem a notificação foi endereçada. */
export type PrefeituraNotificationAudience =
  | 'contract_manager'
  | 'ubt_all'
  | 'ubt_responsible'
  | 'ubt_user'
  | 'medico_all'
  | 'medico_plantao'
  | 'medico_especialidade'

export type PrefeituraNotificationPriority = 'normal' | 'important'

export type PrefeituraNotification = {
  id: string
  direction: PrefeituraNotificationDirection
  origin: PrefeituraNotificationOrigin
  audience: PrefeituraNotificationAudience
  title: string
  body: string
  sentAt: string
  readAt: string | null
  unitId?: string
  unitName?: string
  senderLabel: string
  recipientLabel: string
  priority: PrefeituraNotificationPriority
  /** Destinatário direto (portal profissional). */
  professionalId?: string
  /** Remetente profissional (envios do corpo clínico). */
  senderProfessionalId?: string
  /** Filtro de especialidade quando audience é medico_especialidade. */
  specialtyFilter?: string
}

export type PrefeituraNotificacoesOriginSlice = {
  key: PrefeituraNotificationOrigin
  label: string
  count: number
  unread: number
}

export const prefeituraNotificacoesKpiCards: KpiStatCardItem[] = [
  {
    label: 'Não lidas',
    value: '5',
    suffix: 'na caixa de entrada',
    icon: Bell,
    iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
    iconRing: 'ring-orange-100/80',
    topBar: 'from-orange-400 to-amber-500',
  },
  {
    label: 'Recebidas',
    value: '18',
    suffix: 'últimos 7 dias',
    icon: Inbox,
    iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
    iconRing: 'ring-blue-100/80',
    topBar: 'from-sky-400 to-blue-500',
  },
  {
    label: 'Enviadas por você',
    value: '6',
    suffix: 'neste mês',
    icon: Send,
    iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
    iconRing: 'ring-violet-100/80',
    topBar: 'from-violet-400 to-purple-500',
  },
  {
    label: 'UBTs alcançadas',
    value: '12',
    suffix: 'no último envio em massa',
    icon: Building2,
    iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
    iconRing: 'ring-emerald-100/80',
    topBar: 'from-emerald-400 to-green-500',
  },
]

export const prefeituraNotificacoesOriginSlices: PrefeituraNotificacoesOriginSlice[] = [
  { key: 'telefarmed', label: 'Telefarmed', count: 9, unread: 2 },
  { key: 'ubt', label: 'Unidades (UBT)', count: 11, unread: 3 },
  { key: 'contract_manager', label: 'Enviadas por você', count: 6, unread: 0 },
]

export const prefeituraNotificacoes: PrefeituraNotification[] = [
  {
    id: 'n-001',
    direction: 'inbox',
    origin: 'telefarmed',
    audience: 'contract_manager',
    title: 'Atualização do pacote de consultas — maio/2026',
    body: 'Prezado(a) gestor(a), informamos que o pacote contratado para maio foi reajustado conforme aditivo assinado em abril. O novo saldo disponível já está refletido no painel de Gestão de Contrato. Em caso de dúvidas sobre faturamento, utilize o canal de Suporte com a tag “Contrato”.',
    sentAt: '2026-05-21T09:15:00',
    readAt: null,
    senderLabel: 'Telefarmed · Operações',
    recipientLabel: 'Gestão do contrato municipal',
    priority: 'important',
  },
  {
    id: 'n-002',
    direction: 'inbox',
    origin: 'ubt',
    audience: 'contract_manager',
    title: 'UBT Norte — solicitação de ampliação de agenda',
    body: 'A responsável pela UBT Norte reporta aumento de 34% na demanda de clínica geral nas últimas duas semanas e solicita liberação de mais slots na agenda compartilhada. Anexo no sistema: justificativa com indicadores locais.',
    sentAt: '2026-05-21T08:40:00',
    readAt: null,
    unitId: 'ubt_norte',
    unitName: 'UBT Norte',
    senderLabel: 'UBT Norte · Fernanda Oliveira',
    recipientLabel: 'Gestão do contrato municipal',
    priority: 'normal',
  },
  {
    id: 'n-003',
    direction: 'inbox',
    origin: 'telefarmed',
    audience: 'contract_manager',
    title: 'Manutenção programada — domingo 25/05',
    body: 'Haverá janela de manutenção no domingo, das 02h às 05h (horário de Brasília), para atualização de infraestrutura. Durante o período, triagem e monitoramento municipal podem apresentar atraso na atualização em tempo real. Não é necessária ação nas UBTs.',
    sentAt: '2026-05-20T16:30:00',
    readAt: '2026-05-20T17:05:00',
    senderLabel: 'Telefarmed · Infraestrutura',
    recipientLabel: 'Gestão do contrato municipal',
    priority: 'normal',
  },
  {
    id: 'n-004',
    direction: 'inbox',
    origin: 'ubt',
    audience: 'contract_manager',
    title: 'UBT Centro — confirmação de treinamento concluído',
    body: 'Equipe da UBT Centro concluiu o treinamento de boas práticas em telemedicina (módulo 2). Certificados disponíveis na área da unidade. Nenhuma pendência operacional identificada.',
    sentAt: '2026-05-20T11:20:00',
    readAt: '2026-05-20T14:00:00',
    unitId: 'ubt_centro',
    unitName: 'UBT Centro',
    senderLabel: 'UBT Centro · Juliana Martins',
    recipientLabel: 'Gestão do contrato municipal',
    priority: 'normal',
  },
  {
    id: 'n-005',
    direction: 'inbox',
    origin: 'ubt',
    audience: 'contract_manager',
    title: 'UBT Sul — terminal offline há 2 horas',
    body: 'A recepcionista da UBT Sul sinalizou que o terminal da sala 2 permanece offline desde 09h10. Já foi reiniciado localmente sem sucesso. Solicita verificação remota ou envio de técnico, se aplicável ao contrato.',
    sentAt: '2026-05-19T09:25:00',
    readAt: null,
    unitId: 'ubt_sul',
    unitName: 'UBT Sul',
    senderLabel: 'UBT Sul · Patrícia Lima',
    recipientLabel: 'Gestão do contrato municipal',
    priority: 'important',
  },
  {
    id: 'n-006',
    direction: 'inbox',
    origin: 'telefarmed',
    audience: 'contract_manager',
    title: 'Novo relatório executivo disponível',
    body: 'O relatório consolidado de abril/2026 (consultas, SLA e utilização por região) já pode ser exportado em Relatórios. O módulo municipal completo será liberado em breve; por ora, use o atalho no e-mail de boas-vindas ou solicite via Suporte.',
    sentAt: '2026-05-18T10:00:00',
    readAt: '2026-05-18T15:30:00',
    senderLabel: 'Telefarmed · Customer Success',
    recipientLabel: 'Gestão do contrato municipal',
    priority: 'normal',
  },
  {
    id: 'n-007',
    direction: 'sent',
    origin: 'contract_manager',
    audience: 'ubt_all',
    title: 'Campanha de vacinação — reforço na triagem',
    body: 'Durante a semana de 19 a 23/05, priorizar identificação de pacientes com sintomas gripais na triagem e registrar observação “campanha gripe” quando aplicável. Material de apoio enviado aos responsáveis por e-mail.',
    sentAt: '2026-05-17T14:00:00',
    readAt: '2026-05-17T14:00:00',
    senderLabel: 'Gestão municipal',
    recipientLabel: 'Todas as UBTs da rede (24 unidades)',
    priority: 'important',
  },
  {
    id: 'n-008',
    direction: 'sent',
    origin: 'contract_manager',
    audience: 'ubt_responsible',
    title: 'UBT Leste — prazo para envio de indicadores',
    body: 'Gentileza enviar até sexta-feira (23/05) os indicadores locais de maio (fila, absenteísmo e satisfação). Planilha padrão disponível no drive compartilhado do contrato.',
    sentAt: '2026-05-16T09:30:00',
    readAt: '2026-05-16T09:30:00',
    unitId: 'ubt_leste',
    unitName: 'UBT Leste',
    senderLabel: 'Gestão municipal',
    recipientLabel: 'Responsável · UBT Leste',
    priority: 'normal',
  },
  {
    id: 'n-009',
    direction: 'sent',
    origin: 'contract_manager',
    audience: 'ubt_user',
    title: 'UBT Oeste — parabenização equipe',
    body: 'Mensagem direta para Mariana Costa e equipe da recepção: a unidade liderou o ranking municipal de SLA na última semana. Parabéns pelo trabalho!',
    sentAt: '2026-05-15T17:45:00',
    readAt: '2026-05-15T17:45:00',
    unitId: 'ubt_oeste',
    unitName: 'UBT Oeste',
    senderLabel: 'Gestão municipal',
    recipientLabel: 'Mariana Costa · UBT Oeste',
    priority: 'normal',
  },
  {
    id: 'n-010',
    direction: 'inbox',
    origin: 'ubt',
    audience: 'contract_manager',
    title: 'UBT Oeste — dúvida sobre credenciais',
    body: 'Nova operadora cadastrada na unidade não consegue acessar o painel de triagem. CPF e e-mail conferidos. Solicita revisão da credencial ou reenvio de convite.',
    sentAt: '2026-05-14T13:10:00',
    readAt: null,
    unitId: 'ubt_oeste',
    unitName: 'UBT Oeste',
    senderLabel: 'UBT Oeste · Carla Teixeira',
    recipientLabel: 'Gestão do contrato municipal',
    priority: 'normal',
  },
  {
    id: 'n-011',
    direction: 'sent',
    origin: 'contract_manager',
    audience: 'ubt_all',
    title: 'Lembrete: fechamento mensal de maio',
    body: 'O fechamento operacional de maio será consolidado no dia 31/05. Garantam que pendências de agenda e cadastros incompletos sejam tratados até o dia 28.',
    sentAt: '2026-05-12T08:00:00',
    readAt: '2026-05-12T08:00:00',
    senderLabel: 'Gestão municipal',
    recipientLabel: 'Todas as UBTs da rede (24 unidades)',
    priority: 'normal',
  },
  {
    id: 'n-012',
    direction: 'inbox',
    origin: 'telefarmed',
    audience: 'contract_manager',
    title: 'Boas práticas LGPD — material atualizado',
    body: 'Publicamos a versão 3.2 do guia LGPD para operadores municipais. Recomendamos compartilhar com as responsáveis das UBTs no próximo encontro de rede.',
    sentAt: '2026-05-10T15:00:00',
    readAt: '2026-05-11T09:00:00',
    senderLabel: 'Telefarmed · Compliance',
    recipientLabel: 'Gestão do contrato municipal',
    priority: 'normal',
  },
]
