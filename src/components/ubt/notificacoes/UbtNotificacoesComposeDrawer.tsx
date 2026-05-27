import { AlertCircle, Send, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { brand } from '../../../config/brand'
import { currentUbtUnit } from '../../../config/ubtSession'
import { ubtCannotNotifyTelefarmedHint } from '../../../data/ubtNotificacoesMock'
import { CustomSelect } from '../../ui/CustomSelect'

type UbtNotificacoesComposeDrawerProps = {
  open: boolean
  closing: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onSend: (payload: {
    title: string
    body: string
    priority: 'normal' | 'important'
  }) => void
}

const priorityOptions = [
  { value: 'normal', label: 'Prioridade normal' },
  { value: 'important', label: 'Prioridade importante' },
]

export function UbtNotificacoesComposeDrawer({
  open,
  closing,
  onClose,
  onTransitionEnd,
  onSend,
}: UbtNotificacoesComposeDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'normal' | 'important'>('normal')

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    setTitle('')
    setMessage('')
    setPriority('normal')

    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  const canSend = title.trim().length > 0 && message.trim().length > 0

  const missingRequirements = useMemo(() => {
    const items: string[] = []
    if (!title.trim()) items.push('título')
    if (!message.trim()) items.push('mensagem')
    return items
  }, [title, message])

  function handleSend() {
    if (!canSend) return
    onSend({
      title: title.trim(),
      body: message.trim(),
      priority,
    })
    onClose()
  }

  if (!isActive) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar envio de notificação"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="ubt-notificacoes-compose-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[94vh] max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="relative shrink-0 overflow-hidden border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/50 to-white px-5 py-4 sm:px-8">
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] ring-2 ring-orange-100">
                <Sparkles className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                  Comunicação com a gestão
                </p>
                <h2
                  id="ubt-notificacoes-compose-title"
                  className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-[1.35rem]"
                >
                  Nova notificação para a gestão municipal
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-500">
                  Destinatário fixo: administração do contrato municipal ({currentUbtUnit.name}).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-8">
          <div className="flex gap-3 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" strokeWidth={2} />
            <p className="leading-relaxed">{ubtCannotNotifyTelefarmedHint}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-slate-50/60 px-4 py-3 text-sm text-gray-700">
            <p>
              <span className="font-semibold text-gray-900">De:</span> {currentUbtUnit.name} ·{' '}
              {brand.operatorName}
            </p>
            <p className="mt-1">
              <span className="font-semibold text-gray-900">Para:</span> Gestão do contrato
              municipal
            </p>
          </div>

          <div className="max-w-xl">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Prioridade</label>
            <CustomSelect
              value={priority}
              onChange={(value) => setPriority(value as 'normal' | 'important')}
              options={priorityOptions}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-orange-100/80 bg-white shadow-[0_4px_24px_rgba(255,107,0,0.08)]">
            <div className="shrink-0 border-b border-gray-100 px-5 py-4">
              <label className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Título da notificação
              </label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Solicitação de material na unidade"
                className="mt-2 w-full border-0 bg-transparent p-0 text-lg font-bold tracking-tight text-gray-900 placeholder:font-normal placeholder:text-gray-400 outline-none focus:ring-0"
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
              <label className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Mensagem
              </label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Descreva o assunto, a ação esperada da gestão e prazos, se houver."
                className="mt-2 min-h-[12rem] w-full flex-1 resize-none border-0 bg-transparent p-0 text-base leading-relaxed text-gray-800 placeholder:text-gray-400 outline-none focus:ring-0"
              />
              <p className="mt-2 shrink-0 text-right text-[11px] tabular-nums text-gray-400">
                {message.length} caracteres
              </p>
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-slate-50/80 px-5 py-4">
              {!canSend && missingRequirements.length > 0 ? (
                <p className="mb-3 text-right text-[11px] text-gray-500">
                  Preencha: {missingRequirements.join(', ')}
                </p>
              ) : null}

              <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className="btn-brand-gradient inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-base font-bold tracking-tight shadow-[0_12px_32px_rgba(255,107,0,0.35)] transition hover:shadow-[0_14px_36px_rgba(255,107,0,0.42)] disabled:shadow-none"
              >
                <Send className="h-5 w-5" strokeWidth={2.25} />
                Enviar para a gestão municipal
              </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  )
}
