import type { AccessLevelId } from '../../config/accessCredentials'
import type { AccessLogOutcome } from '../../data/accessLogsMock'
import type { CredentialUserStatus } from '../../data/accessCredentialsMock'
import {
  SituationStatusBadge,
  type SituationStatusBadgeStyle,
} from '../ui/SituationStatusBadge'

const BADGE_WIDTH = 'w-[9rem]'

export const accessLevelBadgeConfig: Record<AccessLevelId, SituationStatusBadgeStyle> = {
  administrador: {
    label: 'Administrador',
    text: 'text-[var(--brand-primary)]',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-[#ff6b00]',
    lineGlow: 'shadow-[0_2px_10px_rgba(255,107,0,0.55)]',
  },
  operador: {
    label: 'Operador',
    text: 'text-sky-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.55)]',
  },
  editor: {
    label: 'Editor',
    text: 'text-violet-700',
    accent: 'bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(139,92,246,0.55)]',
  },
  visualizador: {
    label: 'Visualizador',
    text: 'text-gray-600',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  },
}

export const credentialStatusBadgeConfig: Record<
  CredentialUserStatus,
  SituationStatusBadgeStyle
> = {
  ativo: {
    label: 'Ativo',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  inativo: {
    label: 'Bloqueado',
    text: 'text-red-600',
    accent: 'bg-gradient-to-r from-rose-400 via-red-500 to-red-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.5)]',
  },
}

export function AccessLevelBadge({ level }: { level: AccessLevelId }) {
  return (
    <SituationStatusBadge config={accessLevelBadgeConfig[level]} widthClass={BADGE_WIDTH} />
  )
}

export function CredentialStatusBadge({ status }: { status: CredentialUserStatus }) {
  return (
    <SituationStatusBadge config={credentialStatusBadgeConfig[status]} widthClass={BADGE_WIDTH} />
  )
}

export const accessLogOutcomeBadgeConfig: Record<AccessLogOutcome, SituationStatusBadgeStyle> = {
  success: {
    label: 'Liberado',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  failure: {
    label: 'Negado',
    text: 'text-red-600',
    accent: 'bg-gradient-to-r from-rose-400 via-red-500 to-red-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.5)]',
  },
}

const ACCESS_LOG_OUTCOME_WIDTH = 'w-[5.5rem]'

export function AccessLogOutcomeBadge({ outcome }: { outcome: AccessLogOutcome }) {
  return (
    <SituationStatusBadge
      config={accessLogOutcomeBadgeConfig[outcome]}
      widthClass={ACCESS_LOG_OUTCOME_WIDTH}
    />
  )
}
