import { dashboardPageScrollAreaClass } from '../../layout/dashboardPageLayout'
import type { AttendanceLevel } from '../../../data/prefeituraAgendasMock'
import { CALENDAR_MONTH_LABELS } from '../../../utils/calendar'
import { parseDateKey } from '../../../utils/agendaDate'

export const attendanceLegend = [
  { level: 'low' as const, label: '0% – 40%', dotClass: 'bg-red-500' },
  { level: 'medium' as const, label: '41% – 60%', dotClass: 'bg-amber-400' },
  { level: 'high' as const, label: '61% – 80%', dotClass: 'bg-orange-400' },
  { level: 'excellent' as const, label: '81% – 100%', dotClass: 'bg-emerald-500' },
]

export const attendanceCellStyles: Record<
  AttendanceLevel,
  { bg: string; text: string; subtext: string; ring?: string }
> = {
  low: {
    bg: 'bg-red-50 border-red-100/80',
    text: 'text-red-800',
    subtext: 'text-red-600/90',
    ring: 'ring-2 ring-red-400/60',
  },
  medium: {
    bg: 'bg-amber-50 border-amber-100/80',
    text: 'text-amber-900',
    subtext: 'text-amber-700/90',
    ring: 'ring-2 ring-amber-400/50',
  },
  high: {
    bg: 'bg-orange-50 border-[var(--brand-primary-border)]/80',
    text: 'text-orange-900',
    subtext: 'text-orange-700/90',
    ring: 'ring-2 ring-orange-400/50',
  },
  excellent: {
    bg: 'bg-emerald-50 border-emerald-100/80',
    text: 'text-emerald-800',
    subtext: 'text-emerald-600/90',
    ring: 'ring-2 ring-emerald-400/60',
  },
}

export function formatAgendasWeekRangeLabel(startKey: string, endKey: string) {
  const start = parseDateKey(startKey)
  const end = parseDateKey(endKey)
  const month = CALENDAR_MONTH_LABELS[start.getMonth()]
  const year = start.getFullYear()
  return `${start.getDate()} – ${end.getDate()} de ${month}, ${year}`
}

export function formatAgendasNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

/** Quantidade de linhas (UBTs) visíveis no heatmap antes do scroll vertical. */
export const HEATMAP_VISIBLE_UNIT_ROWS = 7

/** Altura máxima do corpo do heatmap (~7 linhas de unidade). */
export const heatmapUnitsBodyMaxHeightClass = 'max-h-[23.5rem]'

/**
 * Altura dos 3 cards inferiores (Comparecimento, Destaques, Futuros).
 * Referência visual: Unidades em Destaque (4 itens + cabeçalho).
 */
export const prefeituraAgendasBottomCardHeightClass =
  'h-[18.5rem] max-h-[18.5rem] min-h-[18.5rem] shrink-0'

/**
 * Três cards inferiores em telas largas: comparecimento alargado, futuros com 300px
 * (alinhado à coluna da sidebar / Pacote de consultas).
 */
export const prefeituraAgendasBottomCardsGridClass = [
  'grid shrink-0 grid-cols-1 gap-4',
  'lg:grid-cols-3',
  'xl:grid-cols-[minmax(0,2.25fr)_minmax(11rem,1fr)_300px]',
].join(' ')

/** Altura fixa do card Agenda do dia (não encolhe em telas baixas). */
export const prefeituraAgendasDayScheduleHeightClass =
  'h-[32rem] max-h-[32rem] min-h-[32rem] shrink-0'

/** Alias — mesma rolagem vertical das demais páginas do dashboard. */
export const prefeituraAgendasScrollClass = dashboardPageScrollAreaClass

/** Miolo rolável dentro de cards (ex.: tabela da Agenda do dia). */
export const prefeituraAgendasCardBodyScrollClass = [
  'min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-y-contain',
  '[-ms-overflow-style:none] [scrollbar-width:thin]',
  '[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5',
  '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300',
  '[&::-webkit-scrollbar-track]:bg-transparent',
].join(' ')
