export const profissionalAtendimentosPanelClass =
  'rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]'

export const profissionalAtendimentosStatusConfig = {
  concluido: {
    label: 'Concluído',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  interrompido: {
    label: 'Interrompido',
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.5)]',
  },
} as const
