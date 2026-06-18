import { Building2, ExternalLink, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ubtPublicUrl } from '../../config/tenantHost'
import type { PrefeituraRedeUnitCadastral } from '../../data/prefeituraRedeUnitDetail'
import type { PrefeituraUbsDetail } from '../../data/prefeituraUbsDetails'
import { prefeituraRedeStatusBadgeConfig } from './rede/prefeituraRedeStatusBadge'
import { PrefeituraRedeUnitCadastralSections } from './rede/PrefeituraRedeUnitCadastralSections'
import { PrefeituraUbsMetricsSections } from './PrefeituraUbsMetricsSections'
import {
  exportPrefeituraUbsDetailExcel,
  exportPrefeituraUbsDetailPdf,
} from '../../utils/prefeitura/prefeituraUbsDetailExport'
import { ExportFormatMenu, type ExportFormat } from '../ui/ExportFormatMenu'
import { Toast, type ToastVariant } from '../ui/Toast'
import { SituationStatusBadge } from '../ui/SituationStatusBadge'
import { prefeituraSlaBadgeConfig, prefeituraSlaDotClass } from './prefeituraDashboardUi'

type PrefeituraUbsDetailDrawerProps = {
  open: boolean
  closing: boolean
  detail: PrefeituraUbsDetail
  cadastral?: PrefeituraRedeUnitCadastral | null
  filterSummaryLines?: string[]
  onClose: () => void
  onTransitionEnd: () => void
}

export function PrefeituraUbsDetailDrawer({
  open,
  closing,
  detail,
  cadastral = null,
  filterSummaryLines,
  onClose,
  onTransitionEnd,
}: PrefeituraUbsDetailDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const { unit } = detail

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      const context = { detail, cadastral, filterSummaryLines }
      showToast('Exportação iniciada', 'warning')

      try {
        if (format === 'pdf') {
          await exportPrefeituraUbsDetailPdf(context)
        } else {
          exportPrefeituraUbsDetailExcel(context)
        }
        showToast('Relatório gerado', 'success')
      } catch {
        showToast('Não foi possível gerar o relatório. Tente novamente.', 'error')
      }
    },
    [detail, cadastral, filterSummaryLines, showToast],
  )

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing
  const sla = prefeituraSlaBadgeConfig[unit.sla]
  const displayName = cadastral?.unit.name ?? unit.name
  const displayRegion = cadastral?.unit.region ?? unit.region
  const displayType = cadastral ? `${cadastral.unitType} · CNES ${cadastral.unit.cnes}` : unit.type
  const portalUrl = useMemo(() => {
    const fromApi = cadastral?.unit.publicUrl?.trim()
    if (fromApi) return fromApi
    const slug = cadastral?.unit.slug?.trim()
    return slug ? ubtPublicUrl(slug) : ''
  }, [cadastral?.unit.publicUrl, cadastral?.unit.slug])

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
      className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar detalhes da UBT"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefeitura-ubs-detail-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[94vh] max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/35 to-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <Building2 className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <h2 id="prefeitura-ubs-detail-title" className="text-lg font-bold text-gray-900">
                  {displayName}
                </h2>
                <p className="mt-0.5 text-sm text-gray-600">
                  {displayRegion} · {displayType}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {cadastral ? (
                    <SituationStatusBadge
                      config={prefeituraRedeStatusBadgeConfig[cadastral.unit.status]}
                      widthClass="w-[7.5rem]"
                    />
                  ) : (
                    <SituationStatusBadge config={sla} widthClass="w-[5.5rem]" />
                  )}
                  {cadastral ? (
                    <SituationStatusBadge config={sla} widthClass="w-[5.5rem]" />
                  ) : null}
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                    <span className={`h-2 w-2 rounded-full ${prefeituraSlaDotClass[unit.sla]}`} />
                    Espera {unit.avgWait}
                  </span>
                </div>
                {cadastral ? (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                      Cadastro completo
                    </span>
                    {portalUrl ? (
                      <a
                        href={portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={portalUrl}
                        className="inline-flex max-w-[min(100%,22rem)] items-center gap-1.5 truncate rounded-lg border border-[var(--brand-primary)]/25 bg-[var(--brand-primary-light)]/60 px-2.5 py-1 font-mono text-[10px] font-semibold text-[var(--brand-primary)] transition hover:border-[var(--brand-primary)]/40 hover:bg-[var(--brand-primary-light)]"
                      >
                        <span className="truncate">{portalUrl}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-80" strokeWidth={2} />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ExportFormatMenu
                resultCount={1}
                itemSingular="relatório"
                itemPlural="relatórios"
                triggerLabel="Exportar"
                onSelect={handleExport}
              />
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
          {cadastral ? <PrefeituraRedeUnitCadastralSections cadastral={cadastral} /> : null}

          {cadastral ? (
            <h3 className="mb-3 text-sm font-bold text-gray-900">Métricas operacionais</h3>
          ) : null}

          <PrefeituraUbsMetricsSections detail={detail} />
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 sm:px-6">
          <p className="text-center text-xs text-gray-500">
            {cadastral
              ? 'Cadastro da UBT e métricas operacionais · dados simulados para demonstração'
              : 'Painel detalhado da unidade · dados simulados conforme recorte do dashboard'}
          </p>
        </footer>
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
