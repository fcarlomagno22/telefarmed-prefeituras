import { Building2, Download, MapPin, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PrefeituraConsultasUnitDetail } from '../../../data/prefeituraConsultasUnitDetail'
import {
  exportPrefeituraConsultasUnitDetailExcel,
  exportPrefeituraConsultasUnitDetailPdf,
} from '../../../utils/prefeitura/prefeituraConsultasUnitDetailExport'
import { Toast, type ToastVariant } from '../../ui/Toast'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { prefeituraSlaBadgeConfig } from '../prefeituraDashboardUi'
import { PrefeituraConsultasUnitDetailBody } from './PrefeituraConsultasUnitDetailBody'

type PrefeituraConsultasUnitDetailDrawerProps = {
  open: boolean
  closing: boolean
  detail: PrefeituraConsultasUnitDetail
  onClose: () => void
  onTransitionEnd: () => void
}

export function PrefeituraConsultasUnitDetailDrawer({
  open,
  closing,
  detail,
  onClose,
  onTransitionEnd,
}: PrefeituraConsultasUnitDetailDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const { unit } = detail
  const statusBadge = prefeituraSlaBadgeConfig[unit.status]

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const handleExport = useCallback(async () => {
    showToast('Exportação iniciada', 'warning')
    try {
      exportPrefeituraConsultasUnitDetailExcel(detail)
      await exportPrefeituraConsultasUnitDetailPdf(detail)
      showToast('Relatórios gerados (Excel e PDF)', 'success')
    } catch {
      showToast('Não foi possível gerar o relatório. Tente novamente.', 'error')
    }
  }, [detail, showToast])

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

  if (!isActive) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9998] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Fechar detalhes da unidade"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="pref-consultas-unit-detail-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 z-10 flex h-[94vh] max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[1.35rem] border-t border-gray-200/90 bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div
          className="pointer-events-none absolute inset-x-8 top-2 z-20 h-1 w-12 rounded-full bg-gray-300/90"
          aria-hidden
        />

        <div
          className="h-0 min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent"
          onWheel={(event) => event.stopPropagation()}
        >
        <header className="sticky top-0 z-10 shrink-0 overflow-hidden border-b border-gray-200/80 bg-white/95 backdrop-blur-sm">
          <div
            className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary-light)]/70 via-orange-50/50 to-white"
            aria-hidden
          />
          <div
            className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[var(--brand-primary)]/10 blur-2xl"
            aria-hidden
          />
          <div className="relative px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[#ff8c33] text-white shadow-[0_8px_24px_rgba(255,107,0,0.35)]">
                  <Building2 className="h-6 w-6" strokeWidth={1.85} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                    Detalhes operacionais da unidade
                  </p>
                  <h2
                    id="pref-consultas-unit-detail-title"
                    className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-[1.35rem]"
                  >
                    {unit.name}
                  </h2>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-gray-600">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                    <span>
                      {unit.address} · {unit.region}
                    </span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <SituationStatusBadge config={statusBadge} widthClass="w-[5.5rem]" />
                    <span className="rounded-full border border-gray-200/90 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm">
                      {detail.periodLabel}
                    </span>
                    {detail.cnes ? (
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-800">
                        CNES {detail.cnes}
                      </span>
                    ) : null}
                    {detail.responsibleName ? (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                        {detail.responsibleName}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200/90 bg-white/95 px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-white"
                >
                  <Download className="h-4 w-4 text-gray-500" strokeWidth={2} />
                  Exportar
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200/90 bg-white/95 text-gray-500 shadow-sm transition hover:bg-white hover:text-gray-800"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="bg-slate-50/50 px-5 py-5 sm:px-6">
          <PrefeituraConsultasUnitDetailBody detail={detail} />
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 sm:px-6">
          <p className="text-center text-xs text-gray-500">
            Gestão de consultas · recorte municipal e indicadores da unidade
          </p>
        </footer>
        </div>
      </aside>

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={dismissToast}
        anchored
      />
    </div>,
    document.body,
  )
}
