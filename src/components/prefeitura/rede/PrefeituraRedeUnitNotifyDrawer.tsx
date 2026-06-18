import { Loader2, Send, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePrefeituraAuth } from '../../../contexts/PrefeituraAuthContext'
import type { PrefeituraRedeUnit } from '../../../data/prefeituraRedeMock'
import {
  isPrefeituraRedeApiError,
  notifyPrefeituraRedeUnit,
} from '../../../lib/services/prefeitura/rede'
import { broadcastRecipientScopeOptions } from '../../../data/prefeituraRedeBroadcastMock'
import { CustomSelect } from '../../ui/CustomSelect'

const panelShell =
  'flex min-h-0 w-full flex-col rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]'

type PrefeituraRedeUnitNotifyDrawerProps = {
  unit: PrefeituraRedeUnit | null
  open: boolean
  closing: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onSuccess?: (message: string) => void
}

export function PrefeituraRedeUnitNotifyDrawer({
  unit,
  open,
  closing,
  onClose,
  onTransitionEnd,
  onSuccess,
}: PrefeituraRedeUnitNotifyDrawerProps) {
  const { getAccessToken } = usePrefeituraAuth()
  const [entered, setEntered] = useState(false)
  const [message, setMessage] = useState('')
  const [recipientScope, setRecipientScope] = useState<'ubt' | 'responsible' | 'operators'>('ubt')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    setMessage('')
    setRecipientScope('ubt')
    setError(null)
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open, unit?.id])

  if (!open || !unit) return null

  async function handleSubmit() {
    const token = getAccessToken()
    if (!token || !message.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await notifyPrefeituraRedeUnit(token, unit!.id, {
        message: message.trim(),
        recipientScope,
      })
      onSuccess?.(result.message)
      onClose()
    } catch (submitError) {
      setError(
        isPrefeituraRedeApiError(submitError)
          ? submitError.message
          : 'Não foi possível enviar o comunicado.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      className={[
        'fixed inset-0 z-[10040] flex items-end justify-center bg-black/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-4',
        entered && !closing ? 'opacity-100' : 'opacity-0',
        'transition-opacity duration-300',
      ].join(' ')}
      onClick={onClose}
    >
      <div
        className={[
          'flex max-h-[92vh] w-full max-w-xl flex-col sm:max-h-[85vh]',
          entered && !closing ? 'translate-y-0 sm:scale-100' : 'translate-y-8 sm:scale-95',
          'transition duration-300 ease-out',
        ].join(' ')}
        onClick={(event) => event.stopPropagation()}
        onTransitionEnd={onTransitionEnd}
      >
        <div className={[panelShell, 'max-h-[92vh]'].join(' ')}>
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-primary)]">
                Comunicado
              </p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">Notificar UBT</h2>
              <p className="mt-1 text-sm text-gray-500">{unit.name}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-800">Destinatários</span>
              <CustomSelect
                value={recipientScope}
                onChange={(value) => setRecipientScope(value as typeof recipientScope)}
                options={broadcastRecipientScopeOptions.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-semibold text-gray-800">Mensagem</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={6}
                placeholder="Escreva o comunicado para a unidade..."
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)]/40 focus:shadow-[var(--brand-primary-focus-ring)]"
              />
            </label>

            {error ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
          </div>

          <footer className="flex shrink-0 flex-col gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting || !message.trim()}
              onClick={() => void handleSubmit()}
              className="btn-brand-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" strokeWidth={2.5} />
              )}
              Enviar comunicado
            </button>
          </footer>
        </div>
      </div>
    </div>,
    document.body,
  )
}
