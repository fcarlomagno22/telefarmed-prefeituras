import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { adminKpiDrillTitles, type AdminKpiDrillKind } from '../../../data/adminDashboardMock'

export type AdminKpiDrillRow = {
  label: string
  value: string
  detail?: string
}

type AdminKpiDrillDrawerProps = {
  open: boolean
  closing: boolean
  kind: AdminKpiDrillKind | null
  rows: AdminKpiDrillRow[]
  onClose: () => void
  onTransitionEnd: () => void
}

export function AdminKpiDrillDrawer({
  open,
  closing,
  kind,
  rows,
  onClose,
  onTransitionEnd,
}: AdminKpiDrillDrawerProps) {
  const [entered, setEntered] = useState(false)
  const isActive = open || closing
  const panelVisible = isActive && entered && !closing
  const title = kind ? adminKpiDrillTitles[kind] : ''

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

  if (!isActive || !kind) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9996] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/30 transition-opacity ${
          panelVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Fechar detalhamento"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-kpi-drill-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-[-12px_0_40px_rgba(0,0,0,0.1)] transition-transform duration-300 ${
          panelVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 id="admin-kpi-drill-title" className="text-lg font-bold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-semibold uppercase text-gray-500">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="py-3 pr-3">
                    <p className="font-semibold text-gray-900">{row.label}</p>
                    {row.detail ? (
                      <p className="mt-0.5 text-xs text-gray-500">{row.detail}</p>
                    ) : null}
                  </td>
                  <td className="py-3 text-right font-bold tabular-nums text-gray-900">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </aside>
    </div>,
    document.body,
  )
}
