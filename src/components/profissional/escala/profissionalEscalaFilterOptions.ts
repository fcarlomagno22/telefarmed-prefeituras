import type { ProfissionalEscalaFilters } from '../../../types/profissionalEscalaDisponivel'

export const profissionalEscalaTurnOptions = [
  { value: 'all', label: 'Todos os turnos' },
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
] as const

export const profissionalEscalaModalityOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'tele', label: 'Telemedicina' },
  { value: 'presencial', label: 'Presencial' },
] as const

export const profissionalEscalaFilterControlClass = [
  'w-full min-w-0 rounded-xl border border-gray-200/80 bg-white text-sm text-gray-800 outline-none transition',
  'focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15',
  'px-3 py-2',
].join(' ')

export const profissionalEscalaFilterSelectClass =
  'py-2 text-xs rounded-lg focus:ring-1 focus:ring-[var(--brand-primary)]/20'

export type ProfissionalEscalaFilterPatch = Partial<ProfissionalEscalaFilters>
