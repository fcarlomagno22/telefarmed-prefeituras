import {
  CalendarClock,
  CheckCircle2,
  DoorOpen,
  ListOrdered,
  MapPin,
  Phone,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DayAppointment } from '../../../data/agendaMock'
import type { PatientRegistration } from '../../../data/unitDashboardMock'
import { buildReceptionRegistrationFromAppointment } from '../../../utils/agenda/buildReceptionDraftFromAppointment'

type AgendaReceptionModalProps = {
  open: boolean
  appointment: DayAppointment | null
  onClose: () => void
  onReceived: (appointment: DayAppointment, registration: PatientRegistration) => void
}

export function AgendaReceptionModal({
  open,
  appointment,
  onClose,
  onReceived,
}: AgendaReceptionModalProps) {
  const [step, setStep] = useState<'confirm' | 'success'>('confirm')

  useEffect(() => {
    if (open) setStep('confirm')
  }, [open, appointment?.id])

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

  if (!open || !appointment) return null

  function confirmArrival() {
    if (!appointment) return
    const registration = buildReceptionRegistrationFromAppointment(appointment)
    onReceived(appointment, registration)
    setStep('success')
  }

  function handleClose() {
    setStep('confirm')
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/45 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agenda-reception-title"
        className="relative flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
      >
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-orange-50 via-[var(--brand-primary-light)]/80 to-white px-6 pb-5 pt-6">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white/90 text-gray-500 shadow-sm transition hover:border-gray-200 hover:bg-white hover:text-gray-800"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>

          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--brand-primary)] shadow-[0_4px_16px_rgba(255,107,0,0.22)] ring-1 ring-orange-100">
            {step === 'success' ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500" strokeWidth={2} />
            ) : (
              <DoorOpen className="h-6 w-6" strokeWidth={2} />
            )}
          </span>

          <h2 id="agenda-reception-title" className="mt-4 pr-10 text-xl font-bold text-gray-900">
            {step === 'success' ? 'Chegada confirmada' : 'Recepcionar no Terminal'}
          </h2>
          {step === 'confirm' ? (
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Consulta agendada por telefone — confirme a chegada e envie para a fila da
              triagem. O cadastro completo será feito no Terminal de atendimento.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              <strong className="font-semibold text-gray-800">{appointment.patientName}</strong>{' '}
              está na fila da triagem e como <strong className="text-orange-700">Aguardando</strong>{' '}
              na agenda.
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {step === 'confirm' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--brand-primary)] ring-1 ring-orange-100">
                    <UserRound className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {appointment.patientName}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">{appointment.patientCpf}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-700 ring-1 ring-gray-200">
                        <CalendarClock className="h-3 w-3 text-[var(--brand-primary)]" />
                        {appointment.time} · {appointment.serviceType}
                      </span>
                      {appointment.patientPhone ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-600 ring-1 ring-gray-200">
                          <Phone className="h-3 w-3" />
                          {appointment.patientPhone}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-orange-200/90 bg-orange-50/90 px-3.5 py-3">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]"
                  strokeWidth={2}
                  aria-hidden
                />
                <p className="text-xs leading-relaxed text-orange-900/90">
                  O paciente já foi identificado no agendamento telefônico. A recepção apenas
                  registra a presença na unidade e coloca na{' '}
                  <strong className="font-semibold">fila de espera da triagem</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-sky-200/90 bg-sky-50/90 px-3.5 py-3">
                <ListOrdered
                  className="mt-0.5 h-4 w-4 shrink-0 text-sky-700"
                  strokeWidth={2}
                  aria-hidden
                />
                <p className="text-xs leading-relaxed text-sky-900/90">
                  Na triagem o operador conduz cadastro complementar, foto e chamada — sem
                  repetir o formulário aqui.
                </p>
              </div>

              <button
                type="button"
                onClick={confirmArrival}
                className="w-full rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[#ff8c33] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(255,107,0,0.38)] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
              >
                Confirmar chegada na unidade
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/30 to-white px-4 py-3.5 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                  Próximo passo
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {appointment.serviceType} às {appointment.time}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Chamar o paciente pelo painel de fila em Triagem.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-xl bg-[var(--brand-primary)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
