import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock,
  MessageSquare,
  Monitor,
  PieChart,
  Star,
  Stethoscope,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UserX,
  Wifi,
  XCircle,
} from 'lucide-react'
import type { ReportCategoryId } from '../config/reportsCategories'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import { kpiStatStylePresets } from '../components/ui/KpiStatCards'
import type { ReportRowValue } from './relatoriosFilters'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function buildCard(
  label: string,
  value: string,
  suffix: string,
  icon: LucideIcon,
  styleIndex: number,
): KpiStatCardItem {
  const style = kpiStatStylePresets[styleIndex % kpiStatStylePresets.length]
  return {
    label,
    value,
    suffix,
    icon,
    ...style,
  }
}

import type { RelatorioKpi } from '../types/relatorios'

export function mapRelatorioKpisToStatCards(kpis: RelatorioKpi[]): KpiStatCardItem[] {
  const icons = [Monitor, CheckCircle2, UserPlus, Clock, Stethoscope, Users, Star, PieChart]
  return kpis.map((kpi, index) => buildCard(kpi.label, kpi.value, kpi.suffix, icons[index % icons.length], index))
}

export function computeKpisForCategory(
  categoryId: ReportCategoryId,
  rows: Record<string, ReportRowValue>[],
): KpiStatCardItem[] {
  switch (categoryId) {
    case 'posto': {
      const completed = rows.filter((r) => r.status === 'concluido').length
      const avgWait =
        rows.length > 0
          ? Math.round(
              rows.reduce((sum, r) => sum + Number(r.waitMinutes ?? 0), 0) / rows.length,
            )
          : 0
      const novos = rows.filter((r) => r.patientType === 'novo').length
      return [
        buildCard('Atendimentos', formatNumber(rows.length), 'no período', Monitor, 0),
        buildCard('Concluídos', formatNumber(completed), 'finalizados', CheckCircle2, 3),
        buildCard('Novos cadastros', formatNumber(novos), 'primeira vez', UserPlus, 1),
        buildCard('Espera média', `${avgWait} min`, 'até o médico', Clock, 2),
      ]
    }
    case 'agenda': {
      const total = rows.reduce((sum, r) => sum + Number(r.total ?? 0), 0)
      const completed = rows.reduce((sum, r) => sum + Number(r.completed ?? 0), 0)
      const noShows = rows.reduce((sum, r) => sum + Number(r.noShows ?? 0), 0)
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0
      return [
        buildCard('Agendados', formatNumber(total), 'no período', CalendarDays, 0),
        buildCard('Realizados', formatNumber(completed), 'compareceram', CheckCircle2, 3),
        buildCard('Faltas', formatNumber(noShows), 'ausências', UserX, 1),
        buildCard('Comparecimento', `${rate}%`, 'taxa média', Activity, 2),
      ]
    }
    case 'consultas': {
      const completed = rows.filter((r) => r.status === 'concluida').length
      const cancelled = rows.filter((r) => r.status === 'cancelada').length
      const durations = rows
        .map((r) => r.durationMinutes)
        .filter((d): d is number => typeof d === 'number')
      const avgDuration =
        durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0
      return [
        buildCard('Consultas', formatNumber(rows.length), 'no filtro', Stethoscope, 2),
        buildCard('Concluídas', formatNumber(completed), 'realizadas', CheckCircle2, 3),
        buildCard('Canceladas', formatNumber(cancelled), 'não realizadas', XCircle, 1),
        buildCard('Duração média', `${avgDuration} min`, 'por consulta', Clock, 0),
      ]
    }
    case 'usuarios': {
      const ativos = rows.filter((r) => r.status === 'ativo').length
      const inativos = rows.filter((r) => r.status === 'inativo').length
      const incompletos = rows.filter((r) => r.status === 'incompleto').length
      return [
        buildCard('Pacientes', formatNumber(rows.length), 'no filtro', Users, 0),
        buildCard('Ativos', formatNumber(ativos), 'com atendimento', UserCheck, 3),
        buildCard('Inativos', formatNumber(inativos), 'sem retorno', UserMinus, 1),
        buildCard('Cadastro incompleto', formatNumber(incompletos), 'dados pendentes', UserPlus, 2),
      ]
    }
    case 'medicos': {
      const patients = rows.reduce((sum, r) => sum + Number(r.totalPatients ?? 0), 0)
      const ratings = rows
        .map((r) => Number(r.averageRating))
        .filter((n) => !Number.isNaN(n))
      const avgRating =
        ratings.length > 0
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : '0'
      const reviews = rows.reduce((s, r) => s + Number(r.totalReviews ?? 0), 0)
      return [
        buildCard('Médicos', formatNumber(rows.length), 'no plantão', Stethoscope, 2),
        buildCard('Pacientes atendidos', formatNumber(patients), 'no período', Users, 0),
        buildCard('Nota média', avgRating, 'de 5 estrelas', Star, 1),
        buildCard('Avaliações', formatNumber(reviews), 'recebidas', MessageSquare, 3),
      ]
    }
    case 'gestao':
      return [
        buildCard('Indicadores', formatNumber(rows.length), 'monitorados', PieChart, 2),
        buildCard('Pacientes aguardando', '18', 'agora', Clock, 0),
        buildCard('Consultas em andamento', '7', 'neste momento', Activity, 1),
        buildCard('Médicos online', '12', 'disponíveis', Wifi, 3),
      ]
    default:
      return []
  }
}
