import { AlertTriangle } from 'lucide-react'
import { createPortal } from 'react-dom'

type AdminClienteEntidadeDeleteConfirmModalProps = {
  open: boolean
  prefeitura: string
  onCancel: () => void
  onConfirm: () => void
}

export function AdminClienteEntidadeDeleteConfirmModal({
  open,
  prefeitura,
  onCancel,
  onConfirm,
}: AdminClienteEntidadeDeleteConfirmModalProps) {
  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/25 px-4 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="admin-entidade-delete-title"
      aria-describedby="admin-entidade-delete-description"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.18)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-6 w-6" strokeWidth={2} />
        </span>

        <h2 id="admin-entidade-delete-title" className="mt-4 text-lg font-bold text-gray-900">
          Excluir entidade?
        </h2>
        <p
          id="admin-entidade-delete-description"
          className="mt-3 text-sm leading-relaxed text-gray-600"
        >
          A entidade <span className="font-semibold text-gray-900">{prefeitura}</span>, seus
          contratos, unidades UBT e credenciais de portal vinculadas serão removidos
          permanentemente. Esta ação exige login como administrador autorizado e confirmação com PIN.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="btn-danger-gradient w-full rounded-xl px-6 py-3 text-sm font-semibold sm:flex-1"
          >
            Continuar com PIN
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
    </div>,
    document.body,
  )
}
