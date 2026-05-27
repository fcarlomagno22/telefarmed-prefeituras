import { CircleHelp } from 'lucide-react'

type PatientConsultationEndConfirmModalProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function PatientConsultationEndConfirmModal({
  open,
  onCancel,
  onConfirm,
}: PatientConsultationEndConfirmModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/25 px-4 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="consultation-end-title"
      aria-describedby="consultation-end-description"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.18)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-[var(--brand-primary)]">
          <CircleHelp className="h-6 w-6" strokeWidth={2} />
        </span>

        <h2 id="consultation-end-title" className="mt-4 text-lg font-bold text-gray-900">
          Encerrar consulta?
        </h2>
        <p id="consultation-end-description" className="mt-3 text-sm leading-relaxed text-gray-600">
          Confirme apenas se você já concluiu o atendimento com o profissional.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="btn-danger-gradient w-full rounded-xl px-6 py-3 text-sm font-semibold sm:flex-1"
          >
            Encerrar Consulta
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 sm:flex-1"
          >
            Continuar Consulta
          </button>
        </div>
      </div>
    </div>
  )
}
