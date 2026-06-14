import { ArrowRightLeft } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { PrefeituraRedeUnitStatus } from '../../../data/prefeituraRedeMock'
import { prefeituraRedeStatusBadgeConfig } from './prefeituraRedeStatusBadge'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'

export type PrefeituraRedeUnitOperationalAction = 'maintenance' | 'suspend' | 'reactivate'

const actionCopy: Record<
  PrefeituraRedeUnitOperationalAction,
  { title: string; description: string; confirmLabel: string; nextStatus: PrefeituraRedeUnitStatus }
> = {
  maintenance: {
    title: 'Colocar em manutenção',
    description: 'Todos os terminais desta UBT ficarão indisponíveis até a reativação.',
    confirmLabel: 'Confirmar manutenção',
    nextStatus: 'manutencao',
  },
  suspend: {
    title: 'Suspender UBT',
    description: 'A unidade ficará inativa e não receberá novos atendimentos.',
    confirmLabel: 'Confirmar suspensão',
    nextStatus: 'inativa',
  },
  reactivate: {
    title: 'Reativar UBT',
    description: 'A unidade voltará ao status ativo com todos os terminais disponíveis.',
    confirmLabel: 'Confirmar reativação',
    nextStatus: 'ativa',
  },
}

type PrefeituraRedeUnitOperationalModalProps = {
  open: boolean
  unitName: string
  currentStatus: PrefeituraRedeUnitStatus
  action: PrefeituraRedeUnitOperationalAction | null
  isSubmitting?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function PrefeituraRedeUnitOperationalModal({
  open,
  unitName,
  currentStatus,
  action,
  isSubmitting = false,
  onCancel,
  onConfirm,
}: PrefeituraRedeUnitOperationalModalProps) {
  if (!open || !action) return null

  const copy = actionCopy[action]
  const nextConfig = prefeituraRedeStatusBadgeConfig[copy.nextStatus]

  return createPortal(
    <div
      className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/25 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.18)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
          <ArrowRightLeft className="h-6 w-6" strokeWidth={2} />
        </span>

        <h2 className="mt-4 text-lg font-bold text-gray-900">{copy.title}</h2>
        <p className="mt-2 text-sm text-gray-600">{copy.description}</p>
        <p className="mt-1 text-sm font-semibold text-gray-800">{unitName}</p>

        <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-slate-50/70 p-4">
          <SituationStatusBadge
            config={prefeituraRedeStatusBadgeConfig[currentStatus]}
            widthClass="w-[7rem]"
          />
          <span className="text-gray-400">→</span>
          <SituationStatusBadge config={nextConfig} widthClass="w-[7rem]" />
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="w-full rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
          >
            {isSubmitting ? 'Salvando...' : copy.confirmLabel}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 sm:flex-1"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
