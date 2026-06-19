import type { AgendaDaySummary } from './agendaMock'

export const AGENDA_PIXEL_COUNT = 12

export type AgendaChartSegment = {
  key: string
  label: string
  situation: string
  legendDescription: string
  getValue: (summary: AgendaDaySummary) => number
  valueClass: string
  gradient: string
  glow: string
  empty: string
  printValueColor: string
  printGradient: string
  printGlow: string
  printEmptyColor: string
}

export const agendaChartSegments: AgendaChartSegment[] = [
  {
    key: 'completed',
    label: 'Realizados',
    situation: 'Realizado',
    legendDescription: 'Consultas finalizadas com sucesso',
    getValue: (summary) => summary.completed,
    valueClass: 'text-emerald-600',
    gradient: 'from-emerald-400 via-emerald-500 to-teal-600',
    glow: 'shadow-[0_0_8px_rgba(16,185,129,0.45)]',
    empty: 'bg-gray-100',
    printValueColor: '#059669',
    printGradient: 'linear-gradient(135deg, #34d399, #10b981, #14b8a6)',
    printGlow: '0 0 8px rgba(16, 185, 129, 0.45)',
    printEmptyColor: '#f3f4f6',
  },
  {
    key: 'inProgress',
    label: 'Em atendimento',
    situation: 'Em atendimento',
    legendDescription: 'Paciente em consulta neste momento',
    getValue: (summary) => summary.inProgress,
    valueClass: 'text-sky-600',
    gradient: 'from-sky-400 via-blue-500 to-indigo-500',
    glow: 'shadow-[0_0_8px_rgba(59,130,246,0.45)]',
    empty: 'bg-gray-100',
    printValueColor: '#0284c7',
    printGradient: 'linear-gradient(135deg, #38bdf8, #3b82f6, #6366f1)',
    printGlow: '0 0 8px rgba(59, 130, 246, 0.45)',
    printEmptyColor: '#f3f4f6',
  },
  {
    key: 'waiting',
    label: 'Aguardando',
    situation: 'Aguardando',
    legendDescription: 'Paciente aguardando início do atendimento',
    getValue: (summary) => summary.waiting,
    valueClass: 'text-amber-600',
    gradient: 'from-yellow-300 via-amber-400 to-amber-500',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.45)]',
    empty: 'bg-gray-100',
    printValueColor: '#d97706',
    printGradient: 'linear-gradient(135deg, #fde047, #fbbf24, #f59e0b)',
    printGlow: '0 0 8px rgba(245, 158, 11, 0.45)',
    printEmptyColor: '#f3f4f6',
  },
  {
    key: 'scheduled',
    label: 'Agendados',
    situation: 'Agendado',
    legendDescription: 'Consultas confirmadas ainda não iniciadas',
    getValue: (summary) => summary.scheduled,
    valueClass: 'text-gray-600',
    gradient: 'from-gray-300 via-gray-400 to-slate-500',
    glow: 'shadow-[0_0_6px_rgba(100,116,139,0.25)]',
    empty: 'bg-gray-100',
    printValueColor: '#4b5563',
    printGradient: 'linear-gradient(135deg, #d1d5db, #9ca3af, #64748b)',
    printGlow: '0 0 6px rgba(100, 116, 139, 0.25)',
    printEmptyColor: '#f3f4f6',
  },
  {
    key: 'noShows',
    label: 'Faltas',
    situation: 'Faltou',
    legendDescription: 'Paciente não compareceu ao horário agendado',
    getValue: (summary) => summary.noShows,
    valueClass: 'text-red-600',
    gradient: 'from-rose-400 via-red-500 to-red-700',
    glow: 'shadow-[0_0_8px_rgba(239,68,68,0.4)]',
    empty: 'bg-gray-100',
    printValueColor: '#dc2626',
    printGradient: 'linear-gradient(135deg, #fb7185, #ef4444, #dc2626)',
    printGlow: '0 0 8px rgba(239, 68, 68, 0.4)',
    printEmptyColor: '#f3f4f6',
  },
]

export function filledAgendaPixelCount(value: number, maxSegmentValue: number) {
  if (value <= 0) return 0
  return Math.max(1, Math.round((value / maxSegmentValue) * AGENDA_PIXEL_COUNT))
}

export function maxAgendaChartSegmentValue(summary: AgendaDaySummary) {
  return Math.max(...agendaChartSegments.map((segment) => segment.getValue(summary)), 1)
}
