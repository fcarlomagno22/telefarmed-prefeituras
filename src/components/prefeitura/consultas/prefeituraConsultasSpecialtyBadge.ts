import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'
import type { PrefeituraConsultasSpecialtyItem } from '../../../data/prefeituraConsultasMock'

const specialtyShareBadgePresets: SituationStatusBadgeStyle[] = [
  {
    label: '',
    text: 'text-blue-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.45)]',
  },
  {
    label: '',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.45)]',
  },
  {
    label: '',
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
  },
  {
    label: '',
    text: 'text-violet-700',
    accent: 'bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(139,92,246,0.45)]',
  },
  {
    label: '',
    text: 'text-pink-700',
    accent: 'bg-gradient-to-r from-pink-400 via-rose-500 to-pink-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(236,72,153,0.45)]',
  },
  {
    label: '',
    text: 'text-slate-700',
    accent: 'bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(100,116,139,0.45)]',
  },
]

export function buildPrefeituraConsultasSpecialtyBadgeConfig(
  item: PrefeituraConsultasSpecialtyItem,
  index: number,
): SituationStatusBadgeStyle {
  const preset = specialtyShareBadgePresets[index % specialtyShareBadgePresets.length]
  return {
    ...preset,
    label: `${item.sharePercent}%`,
  }
}
