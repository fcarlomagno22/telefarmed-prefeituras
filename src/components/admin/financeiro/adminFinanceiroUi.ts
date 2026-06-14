import {
  adminFechamentoCompetenciaStatusLabel,
  type AdminFechamentoCompetenciaStatus,
} from '../../../types/adminFinanceiro'
import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'

export const ADMIN_FECHAMENTO_STATUS_BADGE_WIDTH = 'w-[9rem]'

export const adminFechamentoCompetenciaStatusBadgeConfig: Record<
  AdminFechamentoCompetenciaStatus,
  SituationStatusBadgeStyle
> = {
  aberto: {
    label: adminFechamentoCompetenciaStatusLabel.aberto,
    text: 'text-gray-600',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  },
  em_apuracao: {
    label: adminFechamentoCompetenciaStatusLabel.em_apuracao,
    text: 'text-blue-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.55)]',
  },
  pre_fechado: {
    label: adminFechamentoCompetenciaStatusLabel.pre_fechado,
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-orange-400 via-amber-500 to-orange-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(249,115,22,0.55)]',
  },
  fechado: {
    label: adminFechamentoCompetenciaStatusLabel.fechado,
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  reaberto: {
    label: adminFechamentoCompetenciaStatusLabel.reaberto,
    text: 'text-violet-700',
    accent: 'bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(139,92,246,0.55)]',
  },
}
