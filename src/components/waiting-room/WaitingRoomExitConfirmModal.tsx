import { AlertTriangle } from 'lucide-react'

type WaitingRoomExitConfirmModalProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function WaitingRoomExitConfirmModal({
  open,
  onCancel,
  onConfirm,
}: WaitingRoomExitConfirmModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/25 px-4 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="waiting-room-exit-title"
      aria-describedby="waiting-room-exit-description"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.18)] sm:max-w-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-6 w-6" strokeWidth={2} />
        </span>

        <h2 id="waiting-room-exit-title" className="mt-4 text-lg font-bold text-gray-900">
          Deseja sair da sala de espera?
        </h2>
        <p
          id="waiting-room-exit-description"
          className="mt-3 text-sm leading-relaxed text-gray-600"
        >
          Ao encerrar esta sessão, sua posição na fila de atendimento será{' '}
          <strong className="font-semibold text-gray-800">cancelada automaticamente</strong> e o
          horário reservado deixará de estar garantido.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Para um novo atendimento, será necessário realizar um novo agendamento na unidade ou
          solicitar encaixe, conforme a disponibilidade da agenda.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-hover)] sm:flex-1"
          >
            Continuar aguardando
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-danger-gradient w-full rounded-xl px-6 py-3 text-sm font-semibold sm:flex-1"
          >
            Sair da sala de espera
          </button>
        </div>
      </div>
    </div>
  )
}
