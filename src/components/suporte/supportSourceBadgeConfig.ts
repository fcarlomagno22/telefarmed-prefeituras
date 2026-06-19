import type { SupportTicketSource } from '../../data/suporteMock'
import type { SituationStatusBadgeStyle } from '../ui/SituationStatusBadge'

/** Tags de origem (UBT / Prefeitura) — mesmo visual das demais tags com linha colorida. */
export const supportSourceBadgeConfig: Record<SupportTicketSource, SituationStatusBadgeStyle> = {
  ubt: {
    label: 'UBT',
    text: 'text-blue-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.55)]',
  },
  prefeitura: {
    label: 'Prefeitura',
    text: 'text-violet-700',
    accent: 'bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(139,92,246,0.55)]',
  },
  profissional: {
    label: 'Profissional',
    text: 'text-[var(--brand-primary)]',
    accent: 'bg-gradient-to-r from-orange-400 via-[var(--brand-primary)] to-amber-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(255,107,0,0.55)]',
  },
}

export const SUPPORT_SOURCE_BADGE_WIDTH = 'w-[5.75rem]'
