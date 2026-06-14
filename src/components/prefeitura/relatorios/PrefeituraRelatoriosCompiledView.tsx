import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { brand } from '../../../config/brand'
import { usePrefeituraAuth } from '../../../contexts/PrefeituraAuthContext'
import {
  findPrefeituraRelatorioCatalogMeta,
  findPrefeituraRelatorioCategoryMeta,
  parsePrefeituraRelatorioIdsParam,
  prefeituraRelatoriosCompiledRegistry,
} from '../../../lib/prefeitura/prefeituraRelatoriosCompiledRegistry'
import { isPrefeituraRelatoriosApiError } from '../../../lib/services/prefeitura/relatorios'
import type { PrefeituraRelatorioId } from '../../../types/prefeituraRelatorios'
import { formatDatePtBr } from '../../../utils/calendar'
import { exportPrefeituraRelatoriosCompiledPdf } from '../../../utils/prefeitura/prefeituraRelatoriosCompiledExport'
import { PrefeituraRelatoriosCompiledOverview } from './PrefeituraRelatoriosCompiledOverview'

type LoadedCompiledReport = {
  id: PrefeituraRelatorioId
  title: string
  description: string
  generatedAt: string
  generatedBy: string
  entidadeRazaoSocial: string
  periodLabel: string
  report: unknown
}

function formatGeneratedAt(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function PrefeituraRelatoriosCompiledView() {
  const { getAccessToken } = usePrefeituraAuth()
  const [searchParams] = useSearchParams()
  const rootRef = useRef<HTMLDivElement>(null)
  const [reports, setReports] = useState<LoadedCompiledReport[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  const periodStart = searchParams.get('periodStart') ?? ''
  const periodEnd = searchParams.get('periodEnd') ?? ''
  const categoryId = searchParams.get('category') ?? ''
  const reportIds = useMemo(
    () => parsePrefeituraRelatorioIdsParam(searchParams.get('reports')),
    [searchParams],
  )

  const categoryMeta = findPrefeituraRelatorioCategoryMeta(categoryId || null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const token = getAccessToken()
      if (!token || !periodStart || !periodEnd || reportIds.length === 0) {
        if (!cancelled) {
          setError('Período, seleção ou sessão inválidos para gerar o compilado.')
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const loaded = await Promise.all(
          reportIds.map(async (reportId) => {
            const registry = prefeituraRelatoriosCompiledRegistry[reportId]
            const report = await registry.fetch(token, { periodStart, periodEnd })
            const catalog = findPrefeituraRelatorioCatalogMeta(reportId)

            return {
              id: reportId,
              title: catalog?.reportName ?? reportId,
              description: catalog?.reportDescription ?? '',
              generatedAt: String((report as { generatedAt: string }).generatedAt),
              generatedBy: String((report as { generatedBy: string }).generatedBy),
              entidadeRazaoSocial: String((report as { entidadeRazaoSocial: string }).entidadeRazaoSocial),
              periodLabel: String((report as { periodLabel: string }).periodLabel),
              report,
            }
          }),
        )

        if (!cancelled) setReports(loaded)
      } catch (loadError) {
        if (!cancelled) {
          setError(
            isPrefeituraRelatoriosApiError(loadError)
              ? loadError.message
              : 'Não foi possível carregar o compilado de relatórios.',
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [getAccessToken, periodEnd, periodStart, reportIds])

  const overviewEntries = useMemo(
    () =>
      reports.map((entry) => {
        const registry = prefeituraRelatoriosCompiledRegistry[entry.id]
        return {
          id: entry.id,
          title: entry.title,
          description: entry.description,
          highlights: registry.getHighlights(entry.report as never),
        }
      }),
    [reports],
  )

  const firstReport = reports[0]
  const generatedAtLabel = firstReport ? formatGeneratedAt(firstReport.generatedAt) : '—'

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleDownloadPdf = useCallback(async () => {
    if (!rootRef.current || reports.length === 0) return

    setIsDownloadingPdf(true)
    try {
      await exportPrefeituraRelatoriosCompiledPdf({
        periodLabel: firstReport.periodLabel,
        entidadeRazaoSocial: firstReport.entidadeRazaoSocial,
        generatedBy: firstReport.generatedBy,
        generatedAtLabel,
        categoryTitle: categoryMeta?.categoryTitle,
        categoryDescription: categoryMeta?.categoryDescription,
        overviewEntries,
        reports: reports.map((entry) => ({
          id: entry.id,
          report: entry.report,
          generatedAtLabel: formatGeneratedAt(entry.generatedAt),
        })),
      })
    } catch (downloadError) {
      const message =
        downloadError instanceof Error
          ? downloadError.message
          : 'Não foi possível gerar o PDF do compilado.'
      window.alert(message)
    } finally {
      setIsDownloadingPdf(false)
    }
  }, [categoryMeta?.categoryDescription, categoryMeta?.categoryTitle, firstReport, generatedAtLabel, overviewEntries, reports])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 text-sm text-gray-500">
        Carregando compilado de relatórios…
      </div>
    )
  }

  if (error || reports.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
        <p className="text-sm font-medium text-gray-800">{error ?? 'Compilado indisponível.'}</p>
        <button
          type="button"
          onClick={() => window.close()}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Fechar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="no-print sticky top-0 z-20 border-b border-orange-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">
              {categoryMeta?.categoryTitle
                ? `${categoryMeta.categoryTitle} — Compilado`
                : 'Compilado de relatórios'}
            </p>
            <p className="text-xs text-gray-500">
              {formatDatePtBr(periodStart)} – {formatDatePtBr(periodEnd)} ·{' '}
              {firstReport.entidadeRazaoSocial} · {reports.length} relatório
              {reports.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.close()}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Imprimir
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={isDownloadingPdf}
              className="btn-brand-gradient rounded-xl px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-60"
            >
              {isDownloadingPdf ? 'Gerando PDF…' : 'Baixar PDF'}
            </button>
          </div>
        </div>
      </div>

      <div ref={rootRef} className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="compiled-report-section compiled-report-overview rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
          <PrefeituraRelatoriosCompiledOverview
            categoryTitle={categoryMeta?.categoryTitle}
            categoryDescription={categoryMeta?.categoryDescription}
            entidadeRazaoSocial={firstReport.entidadeRazaoSocial}
            brandName={brand.appName}
            logoUrl={brand.logoUrl}
            periodLabel={firstReport.periodLabel}
            generatedAtLabel={generatedAtLabel}
            generatedBy={firstReport.generatedBy}
            entries={overviewEntries}
          />
        </div>

        {reports.map((entry) => {
          const registry = prefeituraRelatoriosCompiledRegistry[entry.id]
          const Document = registry.Document

          return (
            <div
              key={entry.id}
              data-compiled-report-id={entry.id}
              className="compiled-report-section compiled-report-item mt-8 rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
            >
              <Document
                report={entry.report as never}
                brandName={brand.appName}
                logoUrl={brand.logoUrl}
                generatedAtLabel={formatGeneratedAt(entry.generatedAt)}
              />
            </div>
          )
        })}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          @page { margin: 12mm; }
          .compiled-report-item {
            break-before: page;
            page-break-before: always;
            box-shadow: none !important;
            border: 0 !important;
            margin-top: 0 !important;
          }
          .compiled-report-overview {
            box-shadow: none !important;
            border: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
