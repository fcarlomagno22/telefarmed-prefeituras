import { AlertCircle, Send, Sparkles, Stethoscope, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  buildUbtCannotNotifyTelefarmedHint,
  ubtProfissionaisRecipientHint,
} from '../../../constants/ubtNotificacoesCopy'
import { useUbtAuth } from '../../../contexts/UbtAuthContext'
import { usePlatformOperatorLabel } from '../../../hooks/useEntidadeCopy'
import {
  fetchUbtProfissionaisCatalog,
  type CreateUbtBroadcastPayload,
  type UbtProfissionalRecipient,
} from '../../../lib/services/ubt/notificacoes'
import { CustomSelect } from '../../ui/CustomSelect'

type UbtNotificacoesComposeDrawerProps = {
  open: boolean
  closing: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onSend: (payload: CreateUbtBroadcastPayload) => void | Promise<void>
}

const priorityOptions = [
  { value: 'normal', label: 'Prioridade normal' },
  { value: 'important', label: 'Prioridade importante' },
]

const recipientModeOptions = [
  { value: 'all', label: 'Todos os profissionais da unidade' },
  { value: 'selected', label: 'Profissionais selecionados' },
]

export function UbtNotificacoesComposeDrawer({
  open,
  closing,
  onClose,
  onTransitionEnd,
  onSend,
}: UbtNotificacoesComposeDrawerProps) {
  const { user, getAccessToken } = useUbtAuth()
  const platformOperatorLabel = usePlatformOperatorLabel()
  const unitName = user?.unidadeUbtNome ?? 'Unidade UBT'
  const operatorName = user?.nome ?? 'Operador'
  const [entered, setEntered] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'normal' | 'important'>('normal')
  const [recipientMode, setRecipientMode] = useState<'all' | 'selected'>('all')
  const [profissionais, setProfissionais] = useState<UbtProfissionalRecipient[]>([])
  const [selectedProfissionalIds, setSelectedProfissionalIds] = useState<Set<string>>(new Set())
  const [profissionalSearch, setProfissionalSearch] = useState('')

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
    setRecipientMode('all')
    setSelectedProfissionalIds(new Set())
    setProfissionalSearch('')

    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadProfissionais() {
      const token = getAccessToken()
      if (!token) return

      try {
        const result = await fetchUbtProfissionaisCatalog(token, {
          search: profissionalSearch.trim() || undefined,
        })
        if (!cancelled) setProfissionais(result.profissionais)
      } catch {
        if (!cancelled) setProfissionais([])
      }
    }

    void loadProfissionais()
    return () => {
      cancelled = true
    }
  }, [open, getAccessToken, profissionalSearch])

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

  const recipientCount =
    recipientMode === 'all' ? profissionais.length : selectedProfissionalIds.size

  const canSend =
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    (recipientMode === 'all' ? profissionais.length > 0 : selectedProfissionalIds.size > 0)

  const missingRequirements = useMemo(() => {
    const items: string[] = []
    if (!title.trim()) items.push('título')
    if (!message.trim()) items.push('mensagem')
    if (recipientMode === 'all' && profissionais.length === 0) {
      items.push('profissionais vinculados à unidade')
    }
    if (recipientMode === 'selected' && selectedProfissionalIds.size === 0) {
      items.push('seleção de profissionais')
    }
    return items
  }, [title, message, recipientMode, profissionais.length, selectedProfissionalIds.size])

  function toggleProfissional(id: string) {
    setSelectedProfissionalIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllProfissionais() {
    setSelectedProfissionalIds(new Set(profissionais.map((item) => item.id)))
  }

  function clearProfissionais() {
    setSelectedProfissionalIds(new Set())
  }

  async function handleSend() {
    if (!canSend) return
    try {
      await onSend({
        title: title.trim(),
        body: message.trim(),
        priority,
        mode: recipientMode,
        profissionalIds:
          recipientMode === 'selected' ? [...selectedProfissionalIds] : undefined,
      })
      onClose()
    } catch {
      // Erro tratado pelo pai (toast)
    }
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
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary-border)]">
                <Sparkles className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                  Comunicação com profissionais
                </p>
                <h2
                  id="ubt-notificacoes-compose-title"
                  className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-[1.35rem]"
                >
                  Nova notificação para profissionais da unidade
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-500">
                  {ubtProfissionaisRecipientHint}
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
            <p className="leading-relaxed">
              {buildUbtCannotNotifyTelefarmedHint(platformOperatorLabel)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-slate-50/60 px-4 py-3 text-sm text-gray-700">
            <p>
              <span className="font-semibold text-gray-900">De:</span> {unitName} · {operatorName}
            </p>
            <p className="mt-1">
              <span className="font-semibold text-gray-900">Para:</span>{' '}
              {recipientMode === 'all'
                ? `Todos os profissionais (${recipientCount})`
                : `${recipientCount} profissional${recipientCount === 1 ? '' : 'is'} selecionado${recipientCount === 1 ? '' : 's'}`}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Prioridade</label>
              <CustomSelect
                value={priority}
                onChange={(value) => setPriority(value as 'normal' | 'important')}
                options={priorityOptions}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Destinatários</label>
              <CustomSelect
                value={recipientMode}
                onChange={(value) => setRecipientMode(value as 'all' | 'selected')}
                options={recipientModeOptions}
              />
            </div>
          </div>

          {recipientMode === 'selected' ? (
            <section className="rounded-2xl border border-gray-200 bg-white">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
                  <p className="text-sm font-bold text-gray-900">Profissionais da unidade</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllProfissionais}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Marcar todos
                  </button>
                  <button
                    type="button"
                    onClick={clearProfissionais}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Limpar
                  </button>
                </div>
              </header>
              <div className="border-b border-gray-100 px-4 py-2">
                <input
                  type="search"
                  value={profissionalSearch}
                  onChange={(event) => setProfissionalSearch(event.target.value)}
                  placeholder="Buscar por nome ou especialidade"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]/40"
                />
              </div>
              <ul className="max-h-48 space-y-1 overflow-y-auto p-3">
                {profissionais.map((item) => (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selectedProfissionalIds.has(item.id)}
                        onChange={() => toggleProfissional(item.id)}
                        className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-gray-900">{item.name}</span>
                        <span className="text-xs text-gray-500">{item.specialty}</span>
                      </span>
                    </label>
                  </li>
                ))}
                {profissionais.length === 0 ? (
                  <li className="px-2 py-4 text-center text-sm text-gray-500">
                    Nenhum profissional vinculado a esta unidade.
                  </li>
                ) : null}
              </ul>
            </section>
          ) : profissionais.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-gray-600">
              <Users className="h-4 w-4 shrink-0" strokeWidth={2} />
              Nenhum profissional vinculado a esta unidade no momento.
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--brand-primary-border)]/80 bg-white shadow-[var(--brand-primary-shadow-sm)]">
            <div className="shrink-0 border-b border-gray-100 px-5 py-4">
              <label className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Título da notificação
              </label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Atualização de protocolo na unidade"
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
                placeholder="Descreva o comunicado para os profissionais da unidade."
                className="mt-2 min-h-[10rem] w-full flex-1 resize-none border-0 bg-transparent p-0 text-base leading-relaxed text-gray-800 placeholder:text-gray-400 outline-none focus:ring-0"
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
                  className="btn-brand-gradient inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-base font-bold tracking-tight shadow-[var(--brand-primary-shadow-lg)] transition hover:shadow-[var(--brand-primary-shadow-lg)] disabled:shadow-none"
                >
                  <Send className="h-5 w-5" strokeWidth={2.25} />
                  Enviar para {recipientCount} profissional{recipientCount === 1 ? '' : 'is'}
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
