import { ArrowRight, ArrowRightLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AdminClienteStatus } from '../../../types/adminClientes'
import { CustomSelect } from '../../ui/CustomSelect'
import { AdminClienteStatusBadge } from './AdminClienteStatusBadge'
import { adminEntidadeStatusEditOptions } from './cadastro/adminEntidadeCadastroTypes'

type AdminClienteEntidadeStatusModalProps = {
  open: boolean
  entidadeNome: string
  currentStatus: AdminClienteStatus
  onCancel: () => void
  onConfirm: (nextStatus: AdminClienteStatus) => void
}

export function AdminClienteEntidadeStatusModal({
  open,
  entidadeNome,
  currentStatus,
  onCancel,
  onConfirm,
}: AdminClienteEntidadeStatusModalProps) {
  const [nextStatus, setNextStatus] = useState<AdminClienteStatus>(currentStatus)

  useEffect(() => {
    if (!open) return
    setNextStatus(currentStatus)
  }, [open, currentStatus])

  if (!open) return null

  const hasChange = nextStatus !== currentStatus

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/25 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-entidade-status-modal-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.18)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
          <ArrowRightLeft className="h-6 w-6" strokeWidth={2} />
        </span>

        <h2 id="admin-entidade-status-modal-title" className="mt-4 text-lg font-bold text-gray-900">
          Alterar status
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Revise a transição de status antes de confirmar a alteração.
        </p>
        <p className="mt-1 text-sm font-semibold text-gray-800">{entidadeNome}</p>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Status atual
              </p>
              <AdminClienteStatusBadge status={currentStatus} />
            </div>

            <div className="hidden justify-center sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500">
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </span>
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Novo status
              </p>
              <CustomSelect
                value={nextStatus}
                onChange={(value) => setNextStatus(value as AdminClienteStatus)}
                options={adminEntidadeStatusEditOptions}
                size="compact"
                className="w-full max-w-[280px]"
                menuMinWidthPx={240}
              />
              {hasChange ? (
                <AdminClienteStatusBadge status={nextStatus} />
              ) : (
                <p className="text-xs text-gray-500">Selecione um status diferente</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
          <button
            type="button"
            disabled={!hasChange}
            onClick={() => onConfirm(nextStatus)}
            className="w-full rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            Confirmar alteração
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
    </div>
  )
}
