import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'
import type { PrefeituraRedeUnitStatus } from '../../../data/prefeituraRedeMock'

export const prefeituraRedeStatusBadgeConfig: Record<
  PrefeituraRedeUnitStatus,
  SituationStatusBadgeStyle
> = {
  ativa: {
    label: 'Ativa',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.45)]',
  },
  manutencao: {
    label: 'Manutenção',
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
  },
  inativa: {
    label: 'Inativa',
    text: 'text-red-600',
    accent: 'bg-gradient-to-r from-red-400 via-red-500 to-rose-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.45)]',
  },
}
