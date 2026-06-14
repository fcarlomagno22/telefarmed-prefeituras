import type { LucideIcon } from 'lucide-react'
import {
  CalendarDays,
  Monitor,
  PieChart,
  Stethoscope,
  Star,
  UserPlus,
} from 'lucide-react'

export type ReportCategoryId =
  | 'posto'
  | 'agenda'
  | 'consultas'
  | 'usuarios'
  | 'medicos'
  | 'gestao'

export type ReportCategoryConfig = {
  id: ReportCategoryId
  title: string
  description: string
  icon: LucideIcon
  pageSubtitle: string
}

export const reportCategories: ReportCategoryConfig[] = [
  {
    id: 'posto',
    title: 'Operacionais do Terminal',
    description:
      'Atendimentos, fluxo, tempo de espera, operadores e uso dos computadores.',
    icon: Monitor,
    pageSubtitle: 'Produção do Terminal de teleatendimento e fluxo operacional',
  },
  {
    id: 'agenda',
    title: 'Agenda',
    description:
      'Agendamentos, comparecimento, faltas, clima operacional e capacidade.',
    icon: CalendarDays,
    pageSubtitle: 'Comparecimento, faltas e capacidade da agenda',
  },
  {
    id: 'consultas',
    title: 'Consultas',
    description:
      'Consultas realizadas, especialidades, médicos, duração e cancelamentos.',
    icon: Stethoscope,
    pageSubtitle: 'Histórico e indicadores de consultas realizadas',
  },
  {
    id: 'usuarios',
    title: 'Usuários / Rede de pacientes',
    description:
      'Cadastros, novos usuários, inativos, dados incompletos e perfil demográfico.',
    icon: UserPlus,
    pageSubtitle: 'Base cadastral e engajamento da rede de pacientes',
  },
  {
    id: 'medicos',
    title: 'Médicos e satisfação',
    description:
      'Plantões, produtividade, avaliações, comentários e médicos online.',
    icon: Star,
    pageSubtitle: 'Produtividade médica e avaliações de satisfação',
  },
  {
    id: 'gestao',
    title: 'Gestão da unidade',
    description:
      'Painel diário, indicadores, capacidade, alertas e desempenho geral.',
    icon: PieChart,
    pageSubtitle: 'Indicadores consolidados da unidade de saúde',
  },
]

export function getReportCategory(id: string | undefined): ReportCategoryConfig | undefined {
  return reportCategories.find((category) => category.id === id)
}

export function getReportCategoryIcon(id: ReportCategoryId): LucideIcon {
  return getReportCategory(id)?.icon ?? PieChart
}
