import { BadgeCheck, UserRound } from 'lucide-react'
import { brand } from '../../../config/brand'

export function PatientConsultationFooter() {
  return (
    <footer className="shrink-0 border-t border-gray-200 bg-white py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-xs text-gray-600 sm:text-sm">
          <UserRound className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" strokeWidth={2} />
          <span>
            <span className="font-medium text-gray-500">{brand.operatorFooterLabel}:</span>{' '}
            <span className="font-semibold text-gray-900">{brand.operatorName}</span>
            <span className="text-gray-400"> · </span>
            <span className="text-gray-500">{brand.operatorRole}</span>
          </span>
        </p>

        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <BadgeCheck className="h-4 w-4" strokeWidth={2} />
          Sessão ativa
        </span>
      </div>
    </footer>
  )
}
