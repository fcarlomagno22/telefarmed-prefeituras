import { Check, Clock, X } from 'lucide-react'
import { useState } from 'react'
import type { EscalaInscricaoApi } from '../../../lib/mockServices/admin/escala'
import { profissionalEscalaShiftsPanelClass } from '../../profissional/escala/profissionalEscalaUi'

type AdminEscalaPendingInscriptionsPanelProps = {
  rows: EscalaInscricaoApi[]
  isLoading?: boolean
  canEdit?: boolean
  onAccept: (inscricaoId: string) => void | Promise<void>
  onReject: (inscricaoId: string, motivo: string) => void | Promise<void>
}

function formatInscritoEm(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminEscalaPendingInscriptionsPanel({
  rows,
  isLoading = false,
  canEdit = false,
  onAccept,
  onReject,
}: AdminEscalaPendingInscriptionsPanelProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleAccept(id: string) {
    setBusyId(id)
    try {
      await onAccept(id)
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(id: string) {
    const motivo = rejectReason.trim()
    if (motivo.length < 3) return
    setBusyId(id)
    try {
      await onReject(id, motivo)
      setRejectingId(null)
      setRejectReason('')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section
      className={profissionalEscalaShiftsPanelClass}
      aria-label="Inscrições pendentes"
    >
      <header className="shrink-0 border-b border-gray-100 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <div>
            <h2 className="text-sm font-bold text-gray-900">Inscrições pendentes</h2>
            <p className="mt-0.5 text-xs text-gray-500">Aguardando análise do admin</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {isLoading ? (
          <p className="text-xs text-gray-500">Carregando inscrições…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-gray-500">Nenhuma inscrição pendente no momento.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-3 py-2.5 text-[11px]"
              >
                <p className="font-semibold text-gray-900">{row.profissionalNome}</p>
                <p className="mt-0.5 text-gray-600">Inscrito em {formatInscritoEm(row.inscritoEm)}</p>

                {canEdit ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void handleAccept(row.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      Aceitar
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => {
                        setRejectingId(row.id)
                        setRejectReason('')
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-red-700 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      Rejeitar
                    </button>
                  </div>
                ) : null}

                {rejectingId === row.id ? (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Motivo da rejeição"
                      className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] outline-none focus:border-[var(--brand-primary)]"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === row.id || rejectReason.trim().length < 3}
                        onClick={() => void handleReject(row.id)}
                        className="rounded-lg bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                      >
                        Confirmar rejeição
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(null)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-[10px] font-semibold text-gray-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
