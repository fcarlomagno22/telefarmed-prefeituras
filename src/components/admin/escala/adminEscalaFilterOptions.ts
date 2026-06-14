import type { AdminEscalaOpenFilters } from '../../../utils/escala/filterAdminEscalaOpenShifts'

export const adminEscalaTurnOptions = [
  { value: 'all', label: 'Todos os turnos' },
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
] as const

export const adminEscalaModalityOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'tele', label: 'Telemedicina' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido' },
] as const

export const adminEscalaAssignmentOptions = [
  { value: 'all', label: 'Todos os modos' },
  { value: 'open', label: 'Aberto (marketplace)' },
  { value: 'assigned', label: 'Médico definido' },
] as const

export const adminEscalaFillOptions = [
  { value: 'all', label: 'Preenchimento: todos' },
  { value: 'aberto', label: 'Aberto' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'lotado', label: 'Lotado' },
] as const

export const adminEscalaStatusOptions = [
  { value: 'all', label: 'Status: todos' },
  { value: 'publicada', label: 'Publicada' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'cancelada', label: 'Cancelada' },
] as const

export const adminEscalaFilterControlClass = [
  'w-full min-w-0 rounded-xl border border-gray-200/80 bg-white text-sm text-gray-800 outline-none transition',
  'focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15',
  'px-3 py-2',
].join(' ')

export const adminEscalaFilterSelectClass =
  'py-2 text-xs rounded-lg focus:ring-1 focus:ring-[var(--brand-primary)]/20'

export type AdminEscalaFilterOption = { value: string; label: string }

export type AdminEscalaFilterPatch = Partial<AdminEscalaOpenFilters>
