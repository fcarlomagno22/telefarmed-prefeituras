import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'

const nfEmitidaBadgeConfig: Record<'sim' | 'nao', SituationStatusBadgeStyle> = {
  sim: {
    label: 'Emitida',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  nao: {
    label: 'Não emitida',
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
  },
}

type CrmPartnersIndicadorNfEmitidaBadgeProps = {
  emitida: boolean
}

export function CrmPartnersIndicadorNfEmitidaBadge({ emitida }: CrmPartnersIndicadorNfEmitidaBadgeProps) {
  return (
    <SituationStatusBadge
      config={nfEmitidaBadgeConfig[emitida ? 'sim' : 'nao']}
      widthClass="w-[6.75rem]"
    />
  )
}
