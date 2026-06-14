import type { EscalaRepasseModalidade } from '../../types/adminEscala'
import type {
  AdminPlantaoElegibilidade,
  AdminRepasseProfissionalStatus,
} from '../../types/adminProfissionalRepasse'
import { repasseModalidadeLabel } from '../../../utils/adminEscala/repasseRule'
import type { SituationStatusBadgeStyle } from '../ui/SituationStatusBadge'

export const ADMIN_REPASSE_MODALIDADE_BADGE_WIDTH = 'w-[7.5rem]'
export const ADMIN_REPASSE_ELEGIBILIDADE_BADGE_WIDTH = 'w-[8.5rem]'
export const ADMIN_REPASSE_STATUS_BADGE_WIDTH = 'w-[11rem]'

export const adminRepasseModalidadeBadgeConfig: Record<
  EscalaRepasseModalidade,
  SituationStatusBadgeStyle
> = {
  plantao_fixo: {
    label: 'Fixo',
    text: 'text-indigo-700',
    accent: 'bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(99,102,241,0.45)]',
  },
  por_consulta: {
    label: 'Consulta',
    text: 'text-sky-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(14,165,233,0.45)]',
  },
  hibrido: {
    label: 'Híbrido',
    text: 'text-violet-700',
    accent: 'bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(139,92,246,0.45)]',
  },
}

export const adminRepasseElegibilidadeLabel: Record<AdminPlantaoElegibilidade, string> = {
  elegivel: 'Elegível',
  parcial: 'Parcial',
  indeferido: 'Indeferido',
  pendente: 'Pendente',
}

export const adminRepasseElegibilidadeBadgeConfig: Record<
  AdminPlantaoElegibilidade,
  SituationStatusBadgeStyle
> = {
  elegivel: {
    label: adminRepasseElegibilidadeLabel.elegivel,
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.5)]',
  },
  parcial: {
    label: adminRepasseElegibilidadeLabel.parcial,
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
  },
  indeferido: {
    label: adminRepasseElegibilidadeLabel.indeferido,
    text: 'text-red-700',
    accent: 'bg-gradient-to-r from-rose-400 via-red-500 to-red-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.5)]',
  },
  pendente: {
    label: adminRepasseElegibilidadeLabel.pendente,
    text: 'text-gray-600',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  },
}

export const adminRepasseStatusLabel: Record<AdminRepasseProfissionalStatus, string> = {
  pendente_conferencia: 'Pendente conferência',
  aprovado: 'Aprovado',
  pago: 'Pago',
  rejeitado: 'Rejeitado',
}

export const adminRepasseStatusBadgeConfig: Record<
  AdminRepasseProfissionalStatus,
  SituationStatusBadgeStyle
> = {
  pendente_conferencia: {
    label: adminRepasseStatusLabel.pendente_conferencia,
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-orange-400 via-amber-500 to-orange-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(249,115,22,0.55)]',
  },
  aprovado: {
    label: adminRepasseStatusLabel.aprovado,
    text: 'text-blue-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.55)]',
  },
  pago: {
    label: adminRepasseStatusLabel.pago,
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  rejeitado: {
    label: adminRepasseStatusLabel.rejeitado,
    text: 'text-red-700',
    accent: 'bg-gradient-to-r from-rose-400 via-red-500 to-red-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.5)]',
  },
}

export function adminRepasseModalidadeFilterLabel(modalidade: EscalaRepasseModalidade): string {
  return repasseModalidadeLabel(modalidade)
}

export function formatAdminRepasseCurrency(centavos: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100)
}
