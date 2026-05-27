import {
  ClipboardList,
  Clock,
  Monitor,
  UserRound,
  Users,
  UserX,
} from 'lucide-react'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'

export type PrefeituraSlaStatus = 'normal' | 'atencao' | 'critico'

export type PrefeituraRegionKey = 'norte' | 'leste' | 'central' | 'sul'
export type PrefeituraUbsTypeKey = 'tipo1' | 'tipo2'

export type PrefeituraUbsRow = {
  id: string
  name: string
  region: string
  regionKey: PrefeituraRegionKey
  type: string
  typeKey: PrefeituraUbsTypeKey
  consultationsToday: number
  queueNow: number
  avgWait: string
  absencesToday: number
  sla: PrefeituraSlaStatus
  statusDot: PrefeituraSlaStatus
}

export type PrefeituraAlertStatus = 'open' | 'acknowledged' | 'in_progress'

export type PrefeituraAlert = {
  id: string
  title: string
  unit: string
  timeAgo: string
  severity: 'critical' | 'warning'
  /** Alerta em nível de RA (ex.: pico na região). */
  regionKey?: PrefeituraRegionKey
  category: string
  description: string
  impact: string
  recommendedAction: string
  detectedAt: string
  status: PrefeituraAlertStatus
}

export const prefeituraFilterOptions = {
  period: [
    { value: 'hoje', label: 'Hoje' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
  ],
  region: [
    { value: 'todas', label: 'Todas' },
    { value: 'norte', label: 'RA Norte' },
    { value: 'leste', label: 'RA Leste' },
    { value: 'central', label: 'RA Central' },
    { value: 'sul', label: 'RA Sul' },
  ],
} as const

export function getPrefeituraDashboardUbtFilterOptions(region: string = 'todas') {
  const rows =
    region === 'todas'
      ? prefeituraUbsRows
      : prefeituraUbsRows.filter((row) => row.regionKey === region)

  return [
    { value: 'todas', label: 'Todas as UBTs' },
    ...rows.map((row) => ({ value: row.id, label: row.name })),
  ]
}

export const prefeituraDashboardKpiCards: KpiStatCardItem[] = [
  {
    label: 'Consultas hoje',
    value: '2.348',
    suffix: '+12% vs ontem',
    icon: ClipboardList,
    iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
    iconRing: 'ring-emerald-100/80',
    topBar: 'from-emerald-400 to-green-500',
  },
  {
    label: 'Fila agregada',
    value: '143',
    suffix: '+8% vs ontem',
    icon: Users,
    iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
    iconRing: 'ring-orange-100/80',
    topBar: 'from-orange-400 to-amber-500',
  },
  {
    label: 'Médicos online',
    value: '68',
    suffix: '+5% vs ontem',
    icon: UserRound,
    iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
    iconRing: 'ring-blue-100/80',
    topBar: 'from-sky-400 to-blue-500',
  },
  {
    label: 'Terminais ativos',
    value: '86',
    suffix: 'Inativos: 7',
    icon: Monitor,
    iconGradient: 'from-teal-500 via-cyan-500 to-sky-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(20,184,166,0.35)]',
    iconRing: 'ring-teal-100/80',
    topBar: 'from-teal-400 to-cyan-500',
  },
  {
    label: 'Faltas hoje',
    value: '87',
    suffix: '+15% vs ontem',
    icon: UserX,
    iconGradient: 'from-rose-500 via-red-500 to-red-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
    iconRing: 'ring-red-100/80',
    topBar: 'from-rose-400 to-red-500',
  },
  {
    label: 'Tempo médio de espera',
    value: '18 min',
    suffix: '-6 min vs ontem',
    icon: Clock,
    iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
    iconRing: 'ring-violet-100/80',
    topBar: 'from-violet-400 to-purple-500',
  },
]

export const prefeituraHourlyConsultations = [
  { hour: '06h', value: 42 },
  { hour: '08h', value: 118 },
  { hour: '10h', value: 186 },
  { hour: '12h', value: 224 },
  { hour: '14h', value: 268 },
  { hour: '16h', value: 312 },
  { hour: '18h', value: 278 },
  { hour: '20h', value: 164 },
  { hour: '22h', value: 72 },
]

/** Tons de azul (degradê por região) — volume maior = azul mais intenso. */
export const prefeituraRegionVolumes = [
  {
    key: 'norte',
    label: 'RA Norte',
    value: 842,
    gradientFrom: '#93c5fd',
    gradientTo: '#1e3a8a',
  },
  {
    key: 'leste',
    label: 'RA Leste',
    value: 612,
    gradientFrom: '#7dd3fc',
    gradientTo: '#1d4ed8',
  },
  {
    key: 'central',
    label: 'RA Central',
    value: 486,
    gradientFrom: '#60a5fa',
    gradientTo: '#2563eb',
  },
  {
    key: 'sul',
    label: 'RA Sul',
    value: 408,
    gradientFrom: '#bae6fd',
    gradientTo: '#0284c7',
  },
]

export const prefeituraSlaByUnit = [
  { unit: 'UBT Jardim das Flores', wait: '42 min', status: 'critico' as const },
  { unit: 'UBT Morro Alto', wait: '39 min', status: 'critico' as const },
  { unit: 'UBT São José', wait: '35 min', status: 'atencao' as const },
  { unit: 'UBT Vila Esperança', wait: '28 min', status: 'atencao' as const },
  { unit: 'UBT Rio Branco', wait: '18 min', status: 'normal' as const },
]

export const prefeituraUbsRows: PrefeituraUbsRow[] = [
  {
    id: '1',
    name: 'UBT Centro',
    region: 'RA Central',
    regionKey: 'central',
    type: 'Tipo I',
    typeKey: 'tipo1',
    consultationsToday: 132,
    queueNow: 14,
    avgWait: '12 min',
    absencesToday: 2,
    sla: 'normal',
    statusDot: 'normal',
  },
  {
    id: '2',
    name: 'UBT Jardim das Flores',
    region: 'RA Norte',
    regionKey: 'norte',
    type: 'Tipo II',
    typeKey: 'tipo2',
    consultationsToday: 118,
    queueNow: 38,
    avgWait: '42 min',
    absencesToday: 11,
    sla: 'critico',
    statusDot: 'critico',
  },
  {
    id: '3',
    name: 'UBT Vila Esperança',
    region: 'RA Leste',
    regionKey: 'leste',
    type: 'Tipo I',
    typeKey: 'tipo1',
    consultationsToday: 96,
    queueNow: 22,
    avgWait: '28 min',
    absencesToday: 5,
    sla: 'atencao',
    statusDot: 'atencao',
  },
  {
    id: '4',
    name: 'UBT Rio Branco',
    region: 'RA Sul',
    regionKey: 'sul',
    type: 'Tipo I',
    typeKey: 'tipo1',
    consultationsToday: 84,
    queueNow: 9,
    avgWait: '18 min',
    absencesToday: 3,
    sla: 'normal',
    statusDot: 'normal',
  },
  {
    id: '5',
    name: 'UBT São José',
    region: 'RA Norte',
    regionKey: 'norte',
    type: 'Tipo II',
    typeKey: 'tipo2',
    consultationsToday: 76,
    queueNow: 31,
    avgWait: '35 min',
    absencesToday: 8,
    sla: 'atencao',
    statusDot: 'atencao',
  },
  {
    id: '6',
    name: 'UBT Parque Verde',
    region: 'RA Leste',
    regionKey: 'leste',
    type: 'Tipo I',
    typeKey: 'tipo1',
    consultationsToday: 68,
    queueNow: 6,
    avgWait: '14 min',
    absencesToday: 1,
    sla: 'normal',
    statusDot: 'normal',
  },
  {
    id: '7',
    name: 'UBT Morro Alto',
    region: 'RA Sul',
    regionKey: 'sul',
    type: 'Tipo I',
    typeKey: 'tipo1',
    consultationsToday: 52,
    queueNow: 23,
    avgWait: '39 min',
    absencesToday: 6,
    sla: 'critico',
    statusDot: 'critico',
  },
]

export const prefeituraAlerts: PrefeituraAlert[] = [
  {
    id: '1',
    title: 'UBT sem operador',
    unit: 'UBT Jardim das Flores',
    timeAgo: 'há 18 min',
    severity: 'critical',
    category: 'Operação',
    description:
      'Nenhum operador autenticado na estação de triagem desde o início do turno da tarde.',
    impact: 'Pacientes não conseguem iniciar atendimento presencial na unidade.',
    recommendedAction: 'Acionar supervisor local e redirecionar fila para teleatendimento.',
    detectedAt: 'Hoje, 14:22',
    status: 'open',
  },
  {
    id: '2',
    title: 'Fila acima de 30 min',
    unit: 'UBT São José',
    timeAgo: 'há 12 min',
    severity: 'warning',
    category: 'Fila',
    description: 'Tempo médio de espera ultrapassou o limite configurado de 30 minutos.',
    impact: 'Risco de absenteísmo e queda na satisfação do usuário.',
    recommendedAction: 'Abrir terminal auxiliar ou redistribuir demanda entre médicos online.',
    detectedAt: 'Hoje, 14:28',
    status: 'in_progress',
  },
  {
    id: '3',
    title: 'Pico de fila na rede',
    unit: 'RA Norte',
    timeAgo: 'há 6 min',
    severity: 'warning',
    regionKey: 'norte',
    category: 'Rede',
    description: 'Concentração de 68 pacientes aguardando atendimento nas UBT da região norte.',
    impact: 'Pressão simultânea em Jardim das Flores e São José.',
    recommendedAction: 'Monitorar SLA regional e considerar reforço de plantão.',
    detectedAt: 'Hoje, 14:34',
    status: 'open',
  },
  {
    id: '4',
    title: 'Tempo de espera elevado',
    unit: 'UBT Morro Alto',
    timeAgo: 'há 24 min',
    severity: 'critical',
    category: 'SLA',
    description: 'Média de espera em 39 min, acima do patamar crítico de 35 min.',
    impact: 'Unidade classificada como crítica no painel municipal.',
    recommendedAction: 'Priorizar desfecho das consultas em andamento e revisar escala.',
    detectedAt: 'Hoje, 14:16',
    status: 'acknowledged',
  },
  {
    id: '5',
    title: 'Queda de conectividade',
    unit: 'UBT Vila Esperança',
    timeAgo: 'há 32 min',
    severity: 'warning',
    category: 'Infraestrutura',
    description: 'Instabilidade na rede local intermitente nos últimos 40 minutos.',
    impact: 'Chamadas de vídeo com queda de qualidade e reconexões frequentes.',
    recommendedAction: 'Validar link com provedor e ativar roteador de contingência.',
    detectedAt: 'Hoje, 14:08',
    status: 'in_progress',
  },
  {
    id: '6',
    title: 'Meta de faltas ultrapassada',
    unit: 'UBT Jardim das Flores',
    timeAgo: 'há 45 min',
    severity: 'warning',
    category: 'Absenteísmo',
    description: '11 faltas registradas hoje; limite diário da unidade é 8.',
    impact: 'Perda de vagas e aumento da fila para quem aguarda presencial.',
    recommendedAction: 'Disparar lembrete automático e revisar confirmação de agenda.',
    detectedAt: 'Hoje, 13:55',
    status: 'open',
  },
  {
    id: '7',
    title: 'Operador inativo na estação',
    unit: 'UBT Centro',
    timeAgo: 'há 1 h',
    severity: 'critical',
    category: 'Operação',
    description: 'Sessão expirada há 52 minutos sem novo login na estação principal.',
    impact: 'Atendimentos presenciais centralizados estão paralisados.',
    recommendedAction: 'Contactar coordenação da UBT Centro imediatamente.',
    detectedAt: 'Hoje, 13:40',
    status: 'open',
  },
  {
    id: '8',
    title: 'Capacidade de fila no limite',
    unit: 'UBT Rio Branco',
    timeAgo: 'há 1 h 10 min',
    severity: 'warning',
    category: 'Fila',
    description: 'Fila atual com 9 pacientes e apenas 2 médicos disponíveis no turno.',
    impact: 'Tempo de espera tende a subir nas próximas duas horas.',
    recommendedAction: 'Avaliar remanejamento de um médico da RA Sul.',
    detectedAt: 'Hoje, 13:30',
    status: 'acknowledged',
  },
  {
    id: '9',
    title: 'Pico de consultas na região leste',
    unit: 'RA Leste',
    timeAgo: 'há 1 h 25 min',
    severity: 'warning',
    regionKey: 'leste',
    category: 'Rede',
    description: 'Volume 28% acima da média das últimas 4 semanas no mesmo horário.',
    impact: 'Vila Esperança e Parque Verde com aumento simultâneo de demanda.',
    recommendedAction: 'Acompanhar evolução horária e preparar mensagem à população.',
    detectedAt: 'Hoje, 13:15',
    status: 'open',
  },
  {
    id: '10',
    title: 'SLA em atenção',
    unit: 'UBT Vila Esperança',
    timeAgo: 'há 1 h 40 min',
    severity: 'warning',
    category: 'SLA',
    description: 'Tempo médio em 28 min, próximo ao limite de atenção de 30 min.',
    impact: 'Unidade pode migrar para status crítico se a tendência continuar.',
    recommendedAction: 'Revisar fila clínica e priorizar casos de menor complexidade.',
    detectedAt: 'Hoje, 13:00',
    status: 'in_progress',
  },
]
