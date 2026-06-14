import { ArrowRight, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

type WaitingRoomPanelProps = {
  onAccessWaitingRoom: () => void
  onCancel: () => void
  loading?: boolean
  error?: string | null
}

export function WaitingRoomPanel({
  onAccessWaitingRoom,
  onCancel,
  loading = false,
  error = null,
}: WaitingRoomPanelProps) {
  const [isPreparing, setIsPreparing] = useState(true)

  useEffect(() => {
    const id = setTimeout(() => setIsPreparing(false), 1600)
    return () => clearTimeout(id)
  }, [])

  return (
    <article className="relative z-10 mt-6 flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-6 py-8 text-center sm:mt-8 sm:px-10 sm:py-10">
      {isPreparing ? (
        <span className="flex flex-col items-center gap-4">
          <Loader2
            className="h-10 w-10 animate-spin text-[var(--brand-primary)]"
            strokeWidth={2}
          />
          <p className="text-sm font-medium text-gray-600">Preparando sala de espera...</p>
        </span>
      ) : (
        <span className="flex w-full max-w-md flex-col items-center">
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <ArrowRight className="h-6 w-6" strokeWidth={2} />
          </span>
          <h3 className="text-lg font-bold text-gray-900">Sala de espera pronta</h3>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            O paciente será direcionado para a sala de espera virtual neste navegador. Mantenha o
            equipamento disponível até o médico entrar.
          </p>
          {error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onAccessWaitingRoom}
            disabled={loading}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            )}
            {loading ? 'Abrindo sala…' : 'Acessar sala de espera'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 text-sm font-medium text-gray-500 transition hover:text-gray-700"
          >
            Cancelar atendimento
          </button>
        </span>
      )}
    </article>
  )
}
