import { Building2, Video } from 'lucide-react'
import type {
  ProfissionalEscalaDisponivel,
  ProfissionalEscalaModality,
} from '../../../types/profissionalEscalaDisponivel'
import { shiftDurationHours } from '../../../utils/profissional/filterProfissionalEscalaDisponivel'

export const profissionalEscalaPanelClass =
  'rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]'

export const profissionalEscalaShiftsPanelClass = [
  profissionalEscalaPanelClass,
  'flex h-full min-h-0 flex-1 flex-col overflow-hidden',
  'max-xl:min-h-[28rem] xl:min-h-0',
].join(' ')

export function formatProfissionalEscalaCardDate(iso: string) {
  const date = new Date(iso)
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit' })
  const month = date
    .toLocaleDateString('pt-BR', { month: 'short' })
    .replace('.', '')
    .toUpperCase()
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' })
  return { day, month, weekday }
}

export function formatProfissionalEscalaTimeRange(startAt: string, endAt: string) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${formatter.format(new Date(startAt))} – ${formatter.format(new Date(endAt))}`
}

export function formatProfissionalEscalaDurationLabel(shift: ProfissionalEscalaDisponivel) {
  const hours = shiftDurationHours(shift)
  return `${hours}h de duração`
}

export function modalityIcon(modality: ProfissionalEscalaModality) {
  return modality === 'tele' ? Video : Building2
}
