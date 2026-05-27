import { AlertTriangle } from 'lucide-react'
import type { AdminClienteContratoAction } from './adminClienteContratoActions'

type AdminClienteContratoConfirmModalProps = {
  open: boolean
  action: AdminClienteContratoAction | null
  prefeitura: string
  contratoLabel: string
  onCancel: () => void
  onConfirm: () => void
}

const actionCopy: Record<
  AdminClienteContratoAction,
  { title: string; description: string; confirmLabel: string; danger?: boolean }
> = {
  suspender: {
    title: 'Suspender contrato?',
    description:
      'O contrato ficará suspenso e novas consultas vinculadas a ele poderão ser bloqueadas até reativação.',
    confirmLabel: 'Suspender contrato',
    danger: true,
  },
  reativar: {
    title: 'Reativar contrato?',
    description:
      'O contrato voltará ao status ativo e a operação poderá utilizar novamente os limites configurados.',
    confirmLabel: 'Reativar contrato',
  },
  encerrar: {
    title: 'Encerrar contrato?',
    description:
      'Esta ação encerra o contrato de forma definitiva. Revise os dados antes de confirmar.',
    confirmLabel: 'Encerrar contrato',
    danger: true,
  },
}

export function AdminClienteContratoConfirmModal({
  open,
  action,
  prefeitura,
  contratoLabel,
  onCancel,
  onConfirm,
}: AdminClienteContratoConfirmModalProps) {
  if (!open || !action) return null

  const copy = actionCopy[action]

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/25 px-4 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="admin-contrato-confirm-title"
      aria-describedby="admin-contrato-confirm-description"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.18)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <span
          className={[
            'flex h-12 w-12 items-center justify-center rounded-full',
            copy.danger ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600',
          ].join(' ')}
        >
          <AlertTriangle className="h-6 w-6" strokeWidth={2} />
        </span>

        <h2 id="admin-contrato-confirm-title" className="mt-4 text-lg font-bold text-gray-900">
          {copy.title}
        </h2>
        <p
          id="admin-contrato-confirm-description"
          className="mt-3 text-sm leading-relaxed text-gray-600"
        >
          {copy.description}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{prefeitura}</span>
          <span className="text-gray-400"> · </span>
          {contratoLabel}
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className={[
              'w-full rounded-xl px-6 py-3 text-sm font-semibold sm:flex-1',
              copy.danger
                ? 'btn-danger-gradient'
                : 'bg-[var(--brand-primary)] text-white transition hover:bg-[var(--brand-primary-hover)]',
            ].join(' ')}
          >
            {copy.confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:flex-1"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
