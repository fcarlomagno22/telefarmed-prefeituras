import { adminEscalaShiftsInitial } from '../../data/adminEscalaMock'
import { profissionalAtendimentosRecords } from '../../data/profissionalAtendimentosMock'
import { profissionalAvaliacoesReviews } from '../../data/profissionalAvaliacoesMock'
import { PROFISSIONAL_ESCALA_TOUR_DEMO_SHIFT_ID } from '../../config/profissionalEscalaTour'
import { PROFISSIONAL_FINANCEIRO_TOUR_DEMO_COMPETENCE_KEY } from '../../config/profissionalFinanceiroTour'
import { profissionalFinanceiroTourDemoShifts } from '../../data/profissionalFinanceiroTourMock'
import type { ProfissionalAttendanceRecord } from '../../types/profissionalAtendimentos'
import type { ProfissionalPatientReview } from '../../types/profissionalAvaliacoes'
import type { ProfissionalAvaliacoesApiSummary } from '../../types/profissionalAvaliacoesApi'
import type { ProfissionalBillingShift } from '../../types/profissionalFinanceiro'
import type { ProfissionalFinanceiroStats } from './computeProfissionalFinanceiroStats'
import { computeProfissionalFinanceiroStats } from './computeProfissionalFinanceiroStats'
import type { ProfissionalEscalaDisponivel } from '../../types/profissionalEscalaDisponivel'
import { computeProfissionalAvaliacoesStats } from './computeProfissionalAvaliacoesStats'
import { formatShiftTimeRange } from './profissionalEscalaDisplay'
import { filterProfissionalAvaliacoes } from './filterProfissionalAvaliacoes'
import type { ProfissionalAvaliacoesFilters } from '../../types/profissionalAvaliacoes'
import type { SupportTicket, SupportTicketStatus } from '../../data/suporteMock'
import {
  profissionalSupportMonthlyTrend,
  profissionalSupportPriorityDistribution,
  profissionalSupportStatusSummary,
  profissionalSupportTickets,
} from '../../data/profissionalSuporteMock'

function mapAdminShiftToDisponivel(
  shift: (typeof adminEscalaShiftsInitial)[number],
): ProfissionalEscalaDisponivel {
  const { turnLabel } = formatShiftTimeRange(shift.startAt, shift.endAt)
  const startHour = new Date(shift.startAt).getHours()
  const turn =
    startHour >= 18 ? 'noite' : startHour >= 12 ? 'tarde' : ('manha' as const)

  return {
    id: shift.id,
    specialty: shift.specialty,
    startAt: shift.startAt,
    endAt: shift.endAt,
    turn,
    turnLabel,
    modality: shift.modality === 'tele' ? 'tele' : 'presencial',
    modalityLabel: shift.modality === 'tele' ? 'Teleatendimento' : 'Presencial na UBT',
    unitName: shift.unitName,
    municipalityName: shift.cityUf.split(' / ')[0] ?? shift.city,
    city: shift.city,
    cityUf: shift.cityUf,
    fullAddress: shift.fullAddress,
    distanceKm: shift.modality === 'tele' ? null : 12,
    amountCents: shift.amountCents,
    vacancies: shift.vacancies,
    repasseRule: shift.repasseRule,
    status: 'disponivel',
    notes: shift.notes,
  }
}

const escalaTourDemoShifts = adminEscalaShiftsInitial
  .filter(
    (shift) =>
      shift.assignmentMode === 'open' &&
      shift.status === 'publicada' &&
      (shift.id === PROFISSIONAL_ESCALA_TOUR_DEMO_SHIFT_ID || shift.vacancies > 0),
  )
  .slice(0, 4)
  .map(mapAdminShiftToDisponivel)

export function resolveProfissionalAtendimentosTourRecords(
  records: ProfissionalAttendanceRecord[],
  tourActive: boolean,
): ProfissionalAttendanceRecord[] {
  if (!tourActive || records.length > 0) return records
  return profissionalAtendimentosRecords
}

export function resolveProfissionalAvaliacaoTourReviews(
  reviews: ProfissionalPatientReview[],
  filters: ProfissionalAvaliacoesFilters,
  tourActive: boolean,
): ProfissionalPatientReview[] {
  if (!tourActive || reviews.length > 0) return reviews
  return filterProfissionalAvaliacoes(profissionalAvaliacoesReviews, filters)
}

export function resolveProfissionalAvaliacaoTourSummary(
  summary: ProfissionalAvaliacoesApiSummary | null,
  tourActive: boolean,
): ProfissionalAvaliacoesApiSummary | null {
  if (!tourActive || summary) return summary

  const stats = computeProfissionalAvaliacoesStats(profissionalAvaliacoesReviews)
  return {
    averageRating: stats.averageRating,
    totalReviews: stats.total,
    criticalCount: stats.criticalCount,
    positiveCount: stats.positiveCount,
    positivePercent: stats.positivePercent,
    withCommentCount: stats.withCommentCount,
    withCommentPercent: stats.withCommentPercent,
    fiveStarCount: stats.starBars.find((bar) => bar.stars === 5)?.count ?? 0,
    fourStarCount: stats.starBars.find((bar) => bar.stars === 4)?.count ?? 0,
    starBars: stats.starBars,
    weeklyTrend: stats.weeklyReviewCounts.map((row, index) => ({
      label: row.label,
      count: row.count,
      averageRating: stats.weeklyAverageRatings[index]?.average ?? stats.averageRating,
    })),
    monthlyCounts: stats.monthlyCounts,
  }
}

export function resolveProfissionalEscalaTourShifts(
  shifts: ProfissionalEscalaDisponivel[],
  tourActive: boolean,
): ProfissionalEscalaDisponivel[] {
  if (!tourActive || shifts.length > 0) return shifts

  const merged = new Map<string, ProfissionalEscalaDisponivel>()
  for (const shift of escalaTourDemoShifts) {
    merged.set(shift.id, shift)
  }
  return Array.from(merged.values()).sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  )
}

export function resolveProfissionalFinanceiroTourMonthShifts(
  monthShifts: ProfissionalBillingShift[],
  competenceKey: string,
  tourActive: boolean,
): ProfissionalBillingShift[] {
  if (
    !tourActive ||
    monthShifts.length > 0 ||
    competenceKey !== PROFISSIONAL_FINANCEIRO_TOUR_DEMO_COMPETENCE_KEY
  ) {
    return monthShifts
  }

  return profissionalFinanceiroTourDemoShifts.filter((shift) => shift.competenceKey === competenceKey)
}

export function resolveProfissionalFinanceiroTourStats(
  stats: ProfissionalFinanceiroStats,
  monthShifts: ProfissionalBillingShift[],
  tourActive: boolean,
): ProfissionalFinanceiroStats {
  if (!tourActive || monthShifts.length === 0) return stats
  return computeProfissionalFinanceiroStats(monthShifts)
}

export type ProfissionalSuporteTourSidebarData = {
  statusSummary: typeof profissionalSupportStatusSummary
  priorityDistribution: typeof profissionalSupportPriorityDistribution
  monthlyTrend: typeof profissionalSupportMonthlyTrend
  monthlyTotal: number
  awaitingCount: number
}

export function filterProfissionalSuporteTourTickets(
  tickets: SupportTicket[],
  query: string,
  status: SupportTicketStatus | '',
  openOnly: boolean,
): SupportTicket[] {
  const normalized = query.trim().toLowerCase()
  return tickets.filter((ticket) => {
    if (openOnly && ticket.status === 'encerrado') return false
    if (status && ticket.status !== status) return false
    if (!normalized) return true
    const haystack = [
      ticket.number,
      ticket.subject,
      ticket.category,
      ticket.ubtName ?? '',
      ticket.openedByName ?? '',
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalized)
  })
}

export function resolveProfissionalSuporteTourTickets(
  tickets: SupportTicket[],
  tourActive: boolean,
): SupportTicket[] {
  if (!tourActive || tickets.length > 0) return tickets
  return profissionalSupportTickets
}

export function resolveProfissionalSuporteTourSidebar(
  sidebarData: ProfissionalSuporteTourSidebarData,
  tourActive: boolean,
): ProfissionalSuporteTourSidebarData {
  if (!tourActive || sidebarData.monthlyTotal > 0) return sidebarData

  return {
    statusSummary: profissionalSupportStatusSummary,
    priorityDistribution: profissionalSupportPriorityDistribution,
    monthlyTrend: profissionalSupportMonthlyTrend,
    monthlyTotal: profissionalSupportTickets.length,
    awaitingCount: profissionalSupportTickets.filter(
      (ticket) => ticket.status === 'aguardando_resposta',
    ).length,
  }
}
