import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useEntidadeReportPresentation } from '../../../contexts/EntidadeBrandingContext'
import { usePrefeituraAuth } from '../../../contexts/PrefeituraAuthContext'
import {
  fetchPrefeituraPerfilTerritorialReport,
  isPrefeituraRelatoriosApiError,
  type PerfilTerritorialReportApi,
} from '../../../lib/services/prefeitura/relatorios'
import { exportPrefeituraPerfilTerritorialReportPdf } from '../../../utils/prefeitura/prefeituraPerfilTerritorialReportExport'
import { formatDatePtBr } from '../../../utils/calendar'
import { PrefeituraPerfilTerritorialReportDocument } from './PrefeituraPerfilTerritorialReportDocument'

function formatGeneratedAt(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function PrefeituraPerfilTerritorialReportView() {
  const { brandName, logoUrl } = useEntidadeReportPresentation()
  const { getAccessToken } = usePrefeituraAuth()
  const [searchParams] = useSearchParams()
  const [report, setReport] = useState<PerfilTerritorialReportApi | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  const periodStart = searchParams.get('periodStart') ?? ''
  const periodEnd = searchParams.get('periodEnd') ?? ''

  useEffect(() => {
    let cancelled = false
    async function load() {
      const token = getAccessToken()
      if (!token || !periodStart || !periodEnd) {
        if (!cancelled) {
          setError('Período ou sessão inválidos para gerar o relatório.')
          setIsLoading(false)
        }
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchPrefeituraPerfilTerritorialReport(token, { periodStart, periodEnd })
        if (!cancelled) setReport(data)
      } catch (loadError) {
        if (!cancelled) {
          setError(
            isPrefeituraRelatoriosApiError(loadError)
              ? loadError.message
              : 'Não foi possível carregar o relatório.',
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
  }, [getAccessToken, periodEnd, periodStart])

  const handlePrint = useCallback(() => window.print(), [])
  const handleDownloadPdf = useCallback(async () => {
    if (!report) return
    setIsDownloadingPdf(true)
    try {
      await exportPrefeituraPerfilTerritorialReportPdf({
        report,
        generatedAtLabel: formatGeneratedAt(report.generatedAt),
      })
    } catch (downloadError) {
      const message =
        downloadError instanceof Error
          ? downloadError.message
          : 'Não foi possível gerar o PDF do relatório.'
      window.alert(message)
    } finally {
      setIsDownloadingPdf(false)
    }
  }, [report])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 text-sm text-gray-500">
        Carregando relatório…
      </div>
    )
  }
  if (error || !report) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
        <p className="text-sm font-medium text-gray-800">{error ?? 'Relatório indisponível.'}</p>
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
      <div className="no-print sticky top-0 z-20 border-b border-[var(--brand-primary-border)] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">{report.title}</p>
            <p className="text-xs text-gray-500">
              {formatDatePtBr(report.periodStart)} – {formatDatePtBr(report.periodEnd)} ·{' '}
              {report.entidadeRazaoSocial}
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

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
          <PrefeituraPerfilTerritorialReportDocument
            report={report}
            brandName={brandName}
            logoUrl={logoUrl}
            generatedAtLabel={formatGeneratedAt(report.generatedAt)}
          />
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          @page { margin: 12mm; }
        }
      `}</style>
    </div>
  )
}
