import type {
  ProfissionalBillingShiftStatus,
  ProfissionalCompetenceClosureStatus,
} from '../../../types/profissionalFinanceiro'
import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'

/** Largura fixa das tags de fechamento (histórico e cabeçalho). */
export const PROFISSIONAL_CLOSURE_STATUS_BADGE_WIDTH = 'w-[8.5rem]'

export const profissionalFinanceiroPanelClass =
  'rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]'

/** Painéis da linha inferior (plantões + histórico) — mesma altura no grid xl. */
export const profissionalFinanceiroAlignedPanelClass = [
  profissionalFinanceiroPanelClass,
  'flex h-full min-h-0 flex-col',
  'max-xl:min-h-[28rem]',
].join(' ')

export const profissionalBillingStatusConfig: Record<
  ProfissionalBillingShiftStatus,
  { label: string; text: string; accent: string; lineGlow: string }
> = {
  realizado: {
    label: 'Realizado',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  previsto: {
    label: 'Previsto',
    text: 'text-sky-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.45)]',
  },
  cancelado: {
    label: 'Cancelado',
    text: 'text-gray-500',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-400',
    lineGlow: 'shadow-none',
  },
}

/** Mesmo visual das tags de Situação (fundo claro + faixa colorida). */
export const profissionalClosureStatusBadgeConfig: Record<
  ProfissionalCompetenceClosureStatus,
  SituationStatusBadgeStyle
> = {
  aberto: {
    label: 'Em aberto',
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-[#ff6b00]',
    lineGlow: 'shadow-[0_2px_10px_rgba(255,107,0,0.55)]',
  },
  em_analise: {
    label: 'Em análise',
    text: 'text-sky-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.55)]',
  },
  aprovado: {
    label: 'Aprovado',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  pago: {
    label: 'Pago',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  rejeitado: {
    label: 'Rejeitado',
    text: 'text-red-700',
    accent: 'bg-gradient-to-r from-red-400 via-red-500 to-rose-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.5)]',
  },
}
