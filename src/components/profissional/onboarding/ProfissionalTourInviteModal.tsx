import { Compass, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { PROFISSIONAL_TOUR_Z_INDEX } from '../../../config/profissionalAgendaTour'
import type { ProfissionalTourInviteMeta } from '../../../config/profissionalTourInvite'

type ProfissionalTourInviteModalProps = ProfissionalTourInviteMeta & {
  open: boolean
  onStart: () => void
  onDismiss: () => void
}

export function ProfissionalTourInviteModal({
  open,
  areaLabel,
  title,
  description,
  highlights,
  onStart,
  onDismiss,
}: ProfissionalTourInviteModalProps) {
  const [visible, setVisible] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (!open) {
      setEntered(false)
      const timer = window.setTimeout(() => setVisible(false), 220)
      return () => window.clearTimeout(timer)
    }

    setVisible(true)
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onDismiss()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onDismiss])

  if (!visible) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
      style={{ zIndex: PROFISSIONAL_TOUR_Z_INDEX + 10 }}
      role="presentation"
    >
      <button
        type="button"
        className={[
          'absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity duration-300',
          entered ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        aria-label="Fechar convite do tour"
        onClick={onDismiss}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profissional-tour-invite-title"
        aria-describedby="profissional-tour-invite-description"
        className={[
          'relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.38),0_10px_30px_rgba(255,107,0,0.14)] transition-all duration-300 ease-out',
          entered ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.98] opacity-0',
        ].join(' ')}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[var(--brand-primary)] via-[#ff8c33] to-[#ffb347] px-6 pb-10 pt-6 text-white sm:px-8">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-1/4 h-28 w-28 rounded-full bg-white/10 blur-xl"
            aria-hidden
          />

          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-4 top-4 rounded-xl p-2 text-white/85 transition hover:bg-white/15 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>

          <div className="relative flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-sm">
              <Compass className="h-7 w-7" strokeWidth={2} />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
                Primeira visita · {areaLabel}
              </p>
              <h2
                id="profissional-tour-invite-title"
                className="mt-1 text-2xl font-bold leading-tight tracking-tight"
              >
                {title}
              </h2>
            </div>
          </div>
        </div>

        <div className="relative -mt-5 rounded-t-3xl bg-white px-6 pb-6 pt-7 sm:px-8">
          <p
            id="profissional-tour-invite-description"
            className="text-[15px] leading-relaxed text-gray-600"
          >
            {description}
          </p>

          <ul className="mt-5 space-y-2.5">
            {highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-orange-100/80 bg-gradient-to-r from-orange-50/80 to-[var(--brand-primary-light)]/30 px-3.5 py-3"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--brand-primary)] shadow-sm ring-1 ring-orange-100">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                <span className="text-sm font-medium leading-snug text-gray-800">{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-sm text-gray-500">
            Se preferir explorar sozinho, tudo bem — você pode iniciar o tour depois pelo botão{' '}
            <span className="font-semibold text-gray-700">Ver tour guiado</span> no topo da página.
          </p>

          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Agora não
            </button>
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
            >
              <Compass className="h-4 w-4" strokeWidth={2.25} />
              Ver tour guiado
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
