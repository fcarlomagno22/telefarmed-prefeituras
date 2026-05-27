import { ArrowRightLeft, Building2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AccessCredentialUser } from '../../data/accessCredentialsMock'
import type { PrefeituraCredentialUbtOption } from '../../data/prefeituraAccessCredentialsMock'
import { CustomSelect } from '../ui/CustomSelect'

type TransferCredentialUbtModalProps = {
  open: boolean
  user: AccessCredentialUser | null
  ubtOptions: PrefeituraCredentialUbtOption[]
  onClose: () => void
  onConfirm: (targetUbtId: string, targetUbtName: string) => void
}

export function TransferCredentialUbtModal({
  open,
  user,
  ubtOptions,
  onClose,
  onConfirm,
}: TransferCredentialUbtModalProps) {
  const [targetUbtId, setTargetUbtId] = useState('')

  const currentUbtId = user?.ubtId ?? ''
  const currentUbtName = useMemo(() => {
    if (!user) return ''
    if (user.ubtName) return user.ubtName
    return ubtOptions.find((option) => option.value === user.ubtId)?.label ?? '—'
  }, [user, ubtOptions])

  const destinationOptions = useMemo(
    () =>
      ubtOptions
        .filter((option) => option.value !== currentUbtId)
        .map((option) => ({ value: option.value, label: option.label })),
    [ubtOptions, currentUbtId],
  )

  useEffect(() => {
    if (!open) {
      setTargetUbtId('')
      return
    }
    setTargetUbtId(destinationOptions[0]?.value ?? '')
  }, [open, user?.id, destinationOptions])

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

  if (!open || !user) return null

  const targetOption = ubtOptions.find((option) => option.value === targetUbtId)
  const canConfirm = Boolean(targetUbtId && targetOption && targetUbtId !== currentUbtId)

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
        aria-labelledby="transfer-credential-ubt-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-white px-6 pb-5 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white/90 text-gray-500 shadow-sm transition hover:border-gray-200 hover:bg-white hover:text-gray-800"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>

          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--brand-primary)] shadow-[0_4px_16px_rgba(14,165,233,0.15)] ring-1 ring-sky-100">
            <ArrowRightLeft className="h-6 w-6" strokeWidth={2} />
          </span>

          <h2 id="transfer-credential-ubt-title" className="mt-4 pr-10 text-xl font-bold text-gray-900">
            Alterar UBT do usuário
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Transfira o acesso de <span className="font-semibold text-gray-800">{user.name}</span> para
            outra unidade da rede. Após confirmar, será solicitada a senha de 6 dígitos do responsável.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">UBT atual</label>
            <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
              <Building2 className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
              <span className="font-medium text-gray-900">{currentUbtName}</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              Nova UBT <span className="text-red-500">*</span>
            </label>
            {destinationOptions.length === 0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Não há outra UBT disponível para transferência.
              </p>
            ) : (
              <CustomSelect
                value={targetUbtId}
                onChange={setTargetUbtId}
                options={destinationOptions}
                className="w-full py-2.5 text-sm"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              if (!targetOption) return
              onConfirm(targetOption.value, targetOption.ubtName)
            }}
            className="rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirmar transferência
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
