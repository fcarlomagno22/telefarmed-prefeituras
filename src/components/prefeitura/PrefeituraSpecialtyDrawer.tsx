import { Stethoscope, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PrefeituraSpecialtyStat } from '../../data/prefeituraSpecialtyStats'
import { formatPrefeituraNumber } from './prefeituraDashboardUi'

type PrefeituraSpecialtyDrawerProps = {
  open: boolean
  closing: boolean
  specialties: PrefeituraSpecialtyStat[]
  total: number
  onClose: () => void
  onTransitionEnd: () => void
}

type SpecialtyFilter = 'all' | 'with_volume' | 'available' | 'unavailable'

export function PrefeituraSpecialtyDrawer({
  open,
  closing,
  specialties,
  total,
  onClose,
  onTransitionEnd,
}: PrefeituraSpecialtyDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [filter, setFilter] = useState<SpecialtyFilter>('all')

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    setFilter('all')
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

  const withVolumeCount = specialties.filter((s) => s.count > 0).length
  const availableCount = specialties.filter((s) => s.available).length
  const unavailableCount = specialties.length - availableCount

  const filteredList = useMemo(() => {
    let list = [...specialties]

    if (filter === 'with_volume') list = list.filter((s) => s.count > 0)
    if (filter === 'available') list = list.filter((s) => s.available)
    if (filter === 'unavailable') list = list.filter((s) => !s.available)

    return list.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
  }, [specialties, filter])

  const maxCount = Math.max(...specialties.map((s) => s.count), 1)
  const leader = [...specialties].sort((a, b) => b.count - a.count)[0]

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
        aria-label="Fechar especialidades"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefeitura-specialty-drawer-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/35 to-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="prefeitura-specialty-drawer-title" className="text-lg font-bold text-gray-900">
                Consultas por especialidade
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {formatPrefeituraNumber(total)} consultas no recorte · {specialties.length}{' '}
                especialidades · {withVolumeCount} com volume
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="shrink-0 border-b border-gray-200 bg-gray-50/70 px-5 py-3 sm:px-6">
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Total</p>
              <p className="text-base font-bold tabular-nums text-gray-900">
                {formatPrefeituraNumber(total)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Líder
              </p>
              <p className="truncate text-xs font-bold text-[var(--brand-primary)]">
                {leader?.label ?? '—'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Na triagem
              </p>
              <p className="text-base font-bold tabular-nums text-emerald-700">{availableCount}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Indisponíveis
              </p>
              <p className="text-base font-bold tabular-nums text-gray-600">{unavailableCount}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'all' as const, label: `Todas (${specialties.length})` },
                { id: 'with_volume' as const, label: `Com volume (${withVolumeCount})` },
                { id: 'available' as const, label: `Na triagem (${availableCount})` },
                { id: 'unavailable' as const, label: `Indisponíveis (${unavailableCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={[
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  filter === tab.id
                    ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
          {filteredList.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">
              Nenhuma especialidade para o filtro selecionado
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredList.map((item, index) => {
                const sharePercent = total > 0 ? Math.round((item.count / total) * 100) : 0
                const barPercent = maxCount > 0 ? Math.max(6, (item.count / maxCount) * 100) : 0
                const rank = index + 1

                return (
                  <li
                    key={item.key}
                    className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                  >
                    <div className="flex items-start gap-3 border-b border-gray-100 bg-slate-50/60 px-4 py-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{
                          background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)`,
                        }}
                      >
                        {rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-gray-900">{item.label}</h3>
                          <span className="text-lg font-bold tabular-nums text-gray-900">
                            {formatPrefeituraNumber(item.count)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              'rounded-md px-2 py-0.5 text-[10px] font-bold ring-1',
                              item.available
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/80'
                                : 'bg-gray-100 text-gray-600 ring-gray-200/80',
                            ].join(' ')}
                          >
                            {item.available ? 'Disponível na triagem' : 'Indisponível na triagem'}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-500">
                            ID {item.key}
                          </span>
                          <span className="text-[10px] font-bold text-[var(--brand-primary)]">
                            {sharePercent}% do total
                          </span>
                        </div>
                      </div>
                      <Stethoscope
                        className="h-5 w-5 shrink-0 text-gray-300"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </div>

                    <div className="space-y-2 px-4 py-3">
                      <div className="relative h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            width: `${barPercent}%`,
                            background: `linear-gradient(90deg, ${item.color}aa, ${item.color})`,
                            opacity: item.available ? 1 : 0.45,
                          }}
                        />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg border border-gray-100 bg-slate-50/80 px-2.5 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Participação
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-gray-800">
                            {sharePercent}% do volume do recorte
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-slate-50/80 px-2.5 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Vs. líder
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-gray-800">
                            {leader && leader.count > 0
                              ? `${Math.round((item.count / leader.count) * 100)}% de ${leader.label}`
                              : '—'}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-slate-50/80 px-2.5 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Fluxo de triagem
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-gray-800">
                            {item.available
                              ? 'Especialidade ativa para encaminhamento'
                              : 'Fora do catálogo operacional atual'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 sm:px-6">
          <p className="text-center text-xs text-gray-500">
            Mesmas especialidades do fluxo de triagem · dados conforme filtros do painel
          </p>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
