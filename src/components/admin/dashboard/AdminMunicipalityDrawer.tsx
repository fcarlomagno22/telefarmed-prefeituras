import { Building2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AdminMunicipalityRow } from '../../../types/adminDashboard'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { prefeituraSlaBadgeConfig } from '../../prefeitura/prefeituraDashboardUi'
import {
  adminHealthDotClass,
  adminHealthLabels,
  formatAdminCurrency,
  formatAdminNumber,
} from './adminDashboardUi'

type AdminMunicipalityDrawerProps = {
  open: boolean
  closing: boolean
  row: AdminMunicipalityRow | null
  onClose: () => void
  onTransitionEnd: () => void
}

export function AdminMunicipalityDrawer({
  open,
  closing,
  row,
  onClose,
  onTransitionEnd,
}: AdminMunicipalityDrawerProps) {
  const [entered, setEntered] = useState(false)
  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
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

  if (!isActive || !row) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Fechar detalhes do município"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-municipality-drawer-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-[-16px_0_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${
          panelVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div>
            <span className="inline-flex items-center gap-2">
              <span
                className={['h-2.5 w-2.5 rounded-full', adminHealthDotClass[row.health]].join(' ')}
              />
              <span className="text-xs font-semibold text-gray-600">
                {adminHealthLabels[row.health]}
              </span>
            </span>
            <h2
              id="admin-municipality-drawer-title"
              className="mt-1 flex items-center gap-2 text-lg font-bold text-gray-900"
            >
              <Building2 className="h-5 w-5 text-gray-400" strokeWidth={1.75} />
              {row.name}
            </h2>
            <p className="text-sm text-gray-500">{row.state} · Contrato {row.contractStatus}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
              <dt className="text-[10px] font-bold uppercase text-gray-500">Consultas hoje</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">
                {formatAdminNumber(row.consultationsToday)}
              </dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
              <dt className="text-[10px] font-bold uppercase text-gray-500">Consultas no mês</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">
                {formatAdminNumber(row.consultationsMonth)}
              </dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
              <dt className="text-[10px] font-bold uppercase text-gray-500">Uso de pacote</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">{row.packageUsagePercent}%</dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-slate-50/80 p-3">
              <dt className="text-[10px] font-bold uppercase text-gray-500">Incidentes abertos</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-red-600">
                {row.openNocCount}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-100 px-3 py-3">
            <span className="text-xs font-semibold text-gray-600">SLA municipal</span>
            <SituationStatusBadge
              config={prefeituraSlaBadgeConfig[row.sla]}
              widthClass="w-[5.5rem]"
            />
          </div>

          <div className="mt-4 rounded-xl border border-gray-100 p-3">
            <p className="text-[10px] font-bold uppercase text-gray-500">Terminais</p>
            <p className="mt-2 text-sm text-gray-700">
              <span className="font-bold text-emerald-700">{row.terminalsOnline}</span> online ·{' '}
              <span className="font-bold text-red-600">{row.terminalsOffline}</span> offline ·{' '}
              <span className="font-bold text-amber-700">{row.terminalsMaintenance}</span> em
              manutenção
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
              <p className="text-[10px] font-bold uppercase text-emerald-700">Receita pacote</p>
              <p className="mt-1 font-bold text-gray-900">
                {formatAdminCurrency(row.revenuePackage)}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
              <p className="text-[10px] font-bold uppercase text-amber-700">Receita avulso</p>
              <p className="mt-1 font-bold text-gray-900">
                {formatAdminCurrency(row.revenueAvulso)}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  )
}
