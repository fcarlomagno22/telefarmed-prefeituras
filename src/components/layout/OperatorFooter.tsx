import { BadgeCheck, UserRound } from 'lucide-react'
import { brand } from '../../config/brand'

export type OperatorFooterProps = {
  label?: string
  name?: string
  role?: string
}

export function OperatorFooter({
  label = brand.operatorFooterLabel,
  name = brand.operatorName,
  role = brand.operatorRole,
}: OperatorFooterProps = {}) {
  return (
    <footer className="absolute bottom-0 left-0 right-0 z-50 rounded-xl border border-gray-200/90 bg-white/95 shadow-[0_4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm">
      <div className="flex h-11 w-full items-center gap-3 px-4 sm:px-5">
        <UserRound
          className="h-4 w-4 shrink-0 text-[var(--brand-primary)]"
          strokeWidth={2}
        />

        <p className="min-w-0 flex-1 truncate text-xs text-gray-600 sm:text-sm">
          <span className="font-medium text-gray-500">{label}:</span>{' '}
          <span className="font-semibold text-gray-900">{name}</span>
          <span className="hidden text-gray-400 sm:inline"> · </span>
          <span className="hidden text-gray-500 sm:inline">{role}</span>
        </p>

        <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
          <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">Sessão ativa</span>
        </span>
      </div>
    </footer>
  )
}
