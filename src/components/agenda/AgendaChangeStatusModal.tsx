import { RefreshCw, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppointmentStatus, DayAppointment } from '../../data/agendaMock'
import { CustomSelect } from '../ui/CustomSelect'

const statusOptions: Array<{ value: AppointmentStatus; label: string }> = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'aguardando', label: 'Aguardando' },
  { value: 'em_atendimento', label: 'Em atendimento' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'faltou', label: 'Faltou' },
]

type AgendaChangeStatusModalProps = {
  open: boolean
  appointment: DayAppointment | null
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: (status: AppointmentStatus) => void
}

export function AgendaChangeStatusModal({
  open,
  appointment,
  isSubmitting = false,
  onClose,
  onConfirm,
}: AgendaChangeStatusModalProps) {
  const [nextStatus, setNextStatus] = useState<AppointmentStatus>('aguardando')

  useEffect(() => {
    if (!open || !appointment) return
    setNextStatus(appointment.status)
  }, [appointment, open])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSubmitting, onClose, open])

  const selectOptions = useMemo(
    () => statusOptions.map((option) => ({ value: option.value, label: option.label })),
    [],
  )

  if (!open || !appointment) return null

  const unchanged = nextStatus === appointment.status

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/45 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={isSubmitting ? undefined : onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agenda-change-status-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[var(--brand-primary-light)] via-white to-white px-6 pb-5 pt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white/90 text-gray-500 shadow-sm transition hover:border-gray-200 hover:bg-white hover:text-gray-800 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>

          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--brand-primary)] shadow-[var(--brand-primary-shadow-sm)] ring-1 ring-[var(--brand-primary-border)]">
            <RefreshCw className="h-6 w-6" strokeWidth={2} />
          </span>

          <h2 id="agenda-change-status-title" className="mt-4 pr-10 text-xl font-bold text-gray-900">
            Alterar situação
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Ajuste manual da situação na agenda. Ao marcar como{' '}
            <strong className="font-semibold text-amber-700">Aguardando</strong>, o paciente entra
            automaticamente na fila de triagem.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3.5">
            <p className="text-sm font-semibold text-gray-900">{appointment.patientName}</p>
            <p className="mt-1 text-xs text-gray-500">
              {appointment.time} · {appointment.serviceType}
            </p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-700">Nova situação</span>
            <CustomSelect
              value={nextStatus}
              onChange={(value) => setNextStatus(value as AppointmentStatus)}
              options={selectOptions}
              placeholder="Selecione"
              disabled={isSubmitting}
            />
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(nextStatus)}
              disabled={isSubmitting || unchanged}
              className="rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--brand-primary-shadow-sm)] transition hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando…' : 'Salvar situação'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
