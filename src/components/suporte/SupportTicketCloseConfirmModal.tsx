import { AlertTriangle } from 'lucide-react'

type SupportTicketCloseConfirmModalProps = {
  open: boolean
  ticketNumber: string
  onCancel: () => void
  onConfirm: () => void
}

export function SupportTicketCloseConfirmModal({
  open,
  ticketNumber,
  onCancel,
  onConfirm,
}: SupportTicketCloseConfirmModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/25 px-4 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="support-close-confirm-title"
      aria-describedby="support-close-confirm-description"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 id="support-close-confirm-title" className="text-lg font-bold text-gray-900">
              Encerrar chamado?
            </h2>
            <p id="support-close-confirm-description" className="mt-2 text-sm text-gray-600">
              O chamado <span className="font-semibold text-gray-800">{ticketNumber}</span> será
              marcado como encerrado e não aceitará novas respostas. A unidade poderá abrir um novo
              chamado se precisar.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Encerrar chamado
          </button>
        </div>
      </div>
    </div>
  )
}
