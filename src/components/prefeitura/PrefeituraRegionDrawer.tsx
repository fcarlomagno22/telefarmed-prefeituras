import { ArrowLeft, Building2, ChevronRight, MapPin, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PrefeituraUbsRow } from '../../data/prefeituraDashboardMock'
import type { PrefeituraRegionVolume } from '../../utils/prefeituraDashboardFilters'
import { SituationStatusBadge } from '../ui/SituationStatusBadge'
import {
  formatPrefeituraNumber,
  prefeituraSlaBadgeConfig,
  prefeituraSlaDotClass,
} from './prefeituraDashboardUi'

type PrefeituraRegionDrawerProps = {
  open: boolean
  closing: boolean
  regions: PrefeituraRegionVolume[]
  ubsRows: PrefeituraUbsRow[]
  onClose: () => void
  onTransitionEnd: () => void
}

type DrawerView = 'regions' | 'units'

export function PrefeituraRegionDrawer({
  open,
  closing,
  regions,
  ubsRows,
  onClose,
  onTransitionEnd,
}: PrefeituraRegionDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [view, setView] = useState<DrawerView>('regions')
  const [selectedRegion, setSelectedRegion] = useState<PrefeituraRegionVolume | null>(null)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    setView('regions')
    setSelectedRegion(null)
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (view === 'units') {
          setView('regions')
          setSelectedRegion(null)
          return
        }
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose, view])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  const sortedRegions = useMemo(
    () => [...regions].sort((a, b) => b.value - a.value),
    [regions],
  )

  const total = sortedRegions.reduce((sum, r) => sum + r.value, 0)
  const max = Math.max(...sortedRegions.map((r) => r.value), 1)
  const leader = sortedRegions[0]

  const regionUnits = useMemo(() => {
    if (!selectedRegion) return []
    return [...ubsRows]
      .filter((row) => row.regionKey === selectedRegion.key)
      .sort((a, b) => b.consultationsToday - a.consultationsToday)
  }, [ubsRows, selectedRegion])

  const regionUnitsTotals = useMemo(() => {
    return regionUnits.reduce(
      (acc, row) => ({
        consultations: acc.consultations + row.consultationsToday,
        queue: acc.queue + row.queueNow,
        absences: acc.absences + row.absencesToday,
      }),
      { consultations: 0, queue: 0, absences: 0 },
    )
  }, [regionUnits])

  function openRegionUnits(region: PrefeituraRegionVolume) {
    setSelectedRegion(region)
    setView('units')
  }

  function backToRegions() {
    setView('regions')
    setSelectedRegion(null)
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
        aria-label="Fechar consultas por região"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefeitura-region-drawer-title"
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
            <div className="min-w-0 flex-1">
              {view === 'units' && selectedRegion ? (
                <button
                  type="button"
                  onClick={backToRegions}
                  className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)] transition hover:text-[var(--brand-primary-hover)]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Voltar às regiões
                </button>
              ) : null}
              <h2 id="prefeitura-region-drawer-title" className="text-lg font-bold text-gray-900">
                {view === 'units' && selectedRegion
                  ? `UBT · ${selectedRegion.label}`
                  : 'Consultas por região'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {view === 'units' && selectedRegion
                  ? `${regionUnits.length} unidade${regionUnits.length === 1 ? '' : 's'} na região · ${formatPrefeituraNumber(regionUnitsTotals.consultations)} consultas`
                  : `${formatPrefeituraNumber(total)} consultas no recorte · ${sortedRegions.length} região${sortedRegions.length === 1 ? '' : 'ões'}`}
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

        {view === 'regions' ? (
          <>
            <div className="shrink-0 border-b border-gray-200 bg-gray-50/70 px-5 py-3 sm:px-6">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-100 bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Volume total
                  </p>
                  <p className="text-base font-bold tabular-nums text-gray-900">
                    {formatPrefeituraNumber(total)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Maior RA
                  </p>
                  <p className="truncate text-xs font-bold text-[var(--brand-primary)]">
                    {leader?.label ?? '—'}
                  </p>
                </div>
                <div className="col-span-2 rounded-xl border border-gray-100 bg-white px-3 py-2 sm:col-span-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    UBT no recorte
                  </p>
                  <p className="text-base font-bold tabular-nums text-gray-900">{ubsRows.length}</p>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
              {sortedRegions.length === 0 ? (
                <p className="py-16 text-center text-sm text-gray-500">
                  Nenhuma região com volume no recorte
                </p>
              ) : (
                <ul className="space-y-3">
                  {sortedRegions.map((region, index) => {
                    const sharePercent = total > 0 ? Math.round((region.value / total) * 100) : 0
                    const barPercent = max > 0 ? Math.max(8, (region.value / max) * 100) : 0
                    const unitsInRegion = ubsRows.filter((u) => u.regionKey === region.key).length

                    return (
                      <li
                        key={region.key}
                        className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                      >
                        <div className="border-b border-gray-100 bg-slate-50/60 px-4 py-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                                style={{
                                  background: `linear-gradient(135deg, ${region.gradientFrom}, ${region.gradientTo})`,
                                }}
                              >
                                {index + 1}
                              </span>
                              <div>
                                <h3 className="text-sm font-bold text-gray-900">{region.label}</h3>
                                <p className="text-[10px] font-medium text-gray-500">
                                  {unitsInRegion} UBT · {sharePercent}% do recorte
                                </p>
                              </div>
                            </div>
                            <span className="text-lg font-bold tabular-nums text-gray-900">
                              {formatPrefeituraNumber(region.value)}
                            </span>
                          </div>
                          <div className="relative mt-2.5 h-3 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{
                                width: `${barPercent}%`,
                                background: `linear-gradient(90deg, ${region.gradientFrom}, ${region.gradientTo})`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <p className="text-xs text-gray-600">
                            Consultas agregadas das unidades desta região administrativa.
                          </p>
                          <button
                            type="button"
                            onClick={() => openRegionUnits(region)}
                            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[var(--brand-primary)] transition hover:text-[var(--brand-primary-hover)]"
                          >
                            Ver mais
                            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-gray-100 bg-slate-50/90 px-3 py-2 text-center">
                <p className="text-[10px] font-semibold text-gray-500">Consultas</p>
                <p className="text-sm font-bold tabular-nums text-gray-900">
                  {formatPrefeituraNumber(regionUnitsTotals.consultations)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-slate-50/90 px-3 py-2 text-center">
                <p className="text-[10px] font-semibold text-gray-500">Fila</p>
                <p className="text-sm font-bold tabular-nums text-gray-900">
                  {formatPrefeituraNumber(regionUnitsTotals.queue)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-slate-50/90 px-3 py-2 text-center">
                <p className="text-[10px] font-semibold text-gray-500">Faltas</p>
                <p className="text-sm font-bold tabular-nums text-gray-900">
                  {formatPrefeituraNumber(regionUnitsTotals.absences)}
                </p>
              </div>
            </div>

            {regionUnits.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">
                Nenhuma UBT nesta região para o recorte atual
              </p>
            ) : (
              <ul className="space-y-3">
                {regionUnits.map((unit) => {
                  const sla = prefeituraSlaBadgeConfig[unit.sla]

                  return (
                    <li
                      key={unit.id}
                      className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                    >
                      <div className="flex items-start gap-3 border-b border-gray-100 px-4 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                          <Building2 className="h-5 w-5" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-gray-900">{unit.name}</h3>
                            <SituationStatusBadge
                              config={sla}
                              widthClass="w-[5.5rem]"
                            />
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            {unit.region} · {unit.type}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-4">
                        <div className="rounded-lg border border-gray-100 bg-slate-50/80 px-2.5 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Consultas
                          </p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
                            {formatPrefeituraNumber(unit.consultationsToday)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-slate-50/80 px-2.5 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Fila atual
                          </p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
                            {unit.queueNow}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-slate-50/80 px-2.5 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Espera média
                          </p>
                          <p className="mt-0.5 text-sm font-bold text-gray-900">{unit.avgWait}</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-slate-50/80 px-2.5 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Faltas hoje
                          </p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
                            {unit.absencesToday}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50/50 px-4 py-2">
                        <span
                          className={`h-2 w-2 rounded-full ${prefeituraSlaDotClass[unit.sla]}`}
                          aria-hidden
                        />
                        <p className="text-[11px] text-gray-600">
                          Indicador operacional: <span className="font-semibold">{sla.label}</span>
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 sm:px-6">
          <p className="text-center text-xs text-gray-500">
            Dados conforme filtros do painel municipal
          </p>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
