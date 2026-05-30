import { PhoneOff } from 'lucide-react'

type DoctorConsultationEndConfirmModalProps = {
  open: boolean
  patientName?: string
  onCancel: () => void
  onConfirm: () => void
}

export function DoctorConsultationEndConfirmModal({
  open,
  patientName,
  onCancel,
  onConfirm,
}: DoctorConsultationEndConfirmModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/25 px-4 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="doctor-consultation-end-title"
      aria-describedby="doctor-consultation-end-description"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.18)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <PhoneOff className="h-6 w-6" strokeWidth={2} />
        </span>

        <h2 id="doctor-consultation-end-title" className="mt-4 text-lg font-bold text-gray-900">
          Finalizar consulta?
        </h2>
        <p
          id="doctor-consultation-end-description"
          className="mt-3 text-sm leading-relaxed text-gray-600"
        >
          {patientName ? (
            <>
              Confirme o encerramento do atendimento de{' '}
              <strong className="font-semibold text-gray-800">{patientName}</strong>. O paciente
              voltará para a fila do plantão como <strong className="font-semibold">Atendido</strong>.
            </>
          ) : (
            <>
              Confirme o encerramento desta teleconsulta. O paciente voltará para a fila do plantão
              como <strong className="font-semibold">Atendido</strong>.
            </>
          )}
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="btn-danger-gradient w-full rounded-xl px-6 py-3 text-sm font-semibold sm:flex-1"
          >
            Finalizar consulta
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 sm:flex-1"
          >
            Continuar atendimento
          </button>
        </div>
      </div>
    </div>
  )
}
