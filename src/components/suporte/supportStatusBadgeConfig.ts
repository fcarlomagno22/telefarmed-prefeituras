import type { SituationStatusBadgeStyle } from '../ui/SituationStatusBadge'
import type { SupportTicketStatus } from '../../data/suporteMock'

/** Mesmo visual das tags de Situação da agenda. */
export const supportTicketStatusBadgeConfig: Record<
  SupportTicketStatus,
  SituationStatusBadgeStyle
> = {
  em_andamento: {
    label: 'Em andamento',
    text: 'text-sky-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.55)]',
  },
  aguardando_resposta: {
    label: 'Aguardando resposta',
    text: 'text-[var(--brand-primary)]',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-[#ff6b00]',
    lineGlow: 'shadow-[0_2px_10px_rgba(255,107,0,0.55)]',
  },
  respondido: {
    label: 'Respondido',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  encerrado: {
    label: 'Encerrado',
    text: 'text-gray-600',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  },
}

export const SUPPORT_STATUS_BADGE_WIDTH = 'w-[11rem]'
