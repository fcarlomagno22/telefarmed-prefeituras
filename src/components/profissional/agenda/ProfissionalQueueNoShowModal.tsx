import { AlertTriangle, PhoneOff, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ProfissionalQueuePatient } from '../../../types/profissionalAgenda'

type ProfissionalQueueNoShowModalProps = {
  open: boolean
  patient: ProfissionalQueuePatient | null
  onClose: () => void
  onConfirm: () => void
}

export function ProfissionalQueueNoShowModal({
  open,
  patient,
  onClose,
  onConfirm,
}: ProfissionalQueueNoShowModalProps) {
  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open || !patient) return null

  const scheduleLabel = patient.scheduledTime
    ? `Horário ${patient.scheduledTime}`
    : 'Encaixe sem horário agendado'

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/45 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prof-queue-no-show-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-red-50 via-orange-50/60 to-white px-6 pb-5 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white/90 text-gray-500 shadow-sm transition hover:border-gray-200 hover:bg-white hover:text-gray-800"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>

          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-600 shadow-[0_4px_16px_rgba(239,68,68,0.15)] ring-1 ring-red-100">
            <PhoneOff className="h-6 w-6" strokeWidth={2} />
          </span>

          <h2 id="prof-queue-no-show-title" className="mt-4 pr-10 text-xl font-bold text-gray-900">
            Registrar que o paciente não veio?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            O paciente sairá da fila de chamada com situação{' '}
            <strong className="font-semibold text-gray-800">Não compareceu</strong>.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3.5">
            <p className="text-sm font-semibold text-gray-900">{patient.patientName}</p>
            <p className="mt-1 text-xs text-gray-500">{scheduleLabel}</p>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-3">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
              strokeWidth={2}
              aria-hidden
            />
            <p className="text-xs leading-relaxed text-amber-900/90">
              Confirme apenas se o paciente não entrou na sala de espera após a chamada ou não
              respondeu no horário previsto.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(220,38,38,0.3)] transition hover:from-red-700 hover:to-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 sm:min-w-[10rem]"
            >
              Confirmar não compareceu
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
