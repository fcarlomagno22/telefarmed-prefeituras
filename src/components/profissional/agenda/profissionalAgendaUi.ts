import type { ProfissionalShiftLifecycle } from '../../../types/profissionalAgenda'

export {
  PROFISSIONAL_SESSION_UNIT_LABEL,
  PROFISSIONAL_TELEMEDICINE_LABEL,
} from '../../../config/profissionalConfig'

export const profissionalAgendaPanelClass =
  'rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]'

export const profissionalLifecycleLabels: Record<ProfissionalShiftLifecycle, string> = {
  aguardando_inicio: 'Aguardando início',
  em_andamento: 'Em andamento',
  encerrado: 'Encerrado',
}

export const profissionalLifecycleStyles: Record<
  ProfissionalShiftLifecycle,
  string
> = {
  aguardando_inicio: 'bg-amber-50 text-amber-800 ring-amber-100',
  em_andamento: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  encerrado: 'bg-gray-100 text-gray-600 ring-gray-200',
}

export const profissionalRoleLabels = {
  titular: 'Titular do plantão',
  reserva: 'Médico reserva',
} as const

export const profissionalLifecycleHeaderStyles: Record<
  ProfissionalShiftLifecycle,
  string
> = {
  aguardando_inicio: 'from-[#e85d00] via-[#ff6b00] to-[#ffb347]',
  em_andamento: 'from-[#d95400] via-[#ff6b00] to-[#ffc266]',
  encerrado: 'from-orange-400 to-orange-300',
}
