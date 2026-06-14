import { CalendarDays, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  formatPrefeituraContratoLineNumber,
  type PrefeituraContratoMonthDetail,
} from '../../../data/prefeituraContratoMonthConsultations'
import {
  exportPrefeituraContratoMonthExcel,
  exportPrefeituraContratoMonthPdf,
} from '../../../utils/prefeitura/prefeituraContratoMonthExport'
import { maskCpfForDisplay } from '../../../utils/lgpdDisplay'
import { LgpdUnlockModal } from '../../users/LgpdUnlockModal'
import { Toast, type ToastVariant } from '../../ui/Toast'
import { ExportFormatMenu } from '../../ui/ExportFormatMenu'
import { PrefeituraConsultasKpiCards } from '../consultas/PrefeituraConsultasKpiCards'
import { buildPrefeituraContratoMonthKpiCards } from './prefeituraContratoUi'

const PAGE_SIZE = 15

type PrefeituraContratoMonthDrawerProps = {
  open: boolean
  closing: boolean
  detail: PrefeituraContratoMonthDetail | null
  isLoading?: boolean
  loadError?: string | null
  onClose: () => void
  onTransitionEnd: () => void
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function PrefeituraContratoMonthDrawer({
  open,
  closing,
  detail,
  isLoading = false,
  loadError = null,
  onClose,
  onTransitionEnd,
}: PrefeituraContratoMonthDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sensitiveDataUnlocked, setSensitiveDataUnlocked] = useState(false)
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const { consultations, monthLabelLong } = detail ?? {
    consultations: [],
    monthLabelLong: 'Carregando…',
  }
  const kpiCards = useMemo(
    () => (detail ? buildPrefeituraContratoMonthKpiCards(detail.kpis) : []),
    [detail],
  )

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const displayCpf = useCallback(
    (cpf: string) => (sensitiveDataUnlocked ? cpf : maskCpfForDisplay(cpf)),
    [sensitiveDataUnlocked],
  )

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    setCurrentPage(1)
    setSensitiveDataUnlocked(false)
    setUnlockModalOpen(false)
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open, detail?.month.key])

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

  const totalFiltered = consultations.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const paginatedRecords = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return consultations.slice(start, start + PAGE_SIZE)
  }, [consultations, safePage])

  const showingFrom = totalFiltered === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(safePage * PAGE_SIZE, totalFiltered)

  const exportContext = useMemo(
    () => (detail ? { detail, sensitiveDataUnlocked } : null),
    [detail, sensitiveDataUnlocked],
  )

  const handleExport = useCallback(
    async (format: 'pdf' | 'excel') => {
      if (!exportContext) return
      if (totalFiltered === 0) {
        showToast('Não há consultas para exportar neste mês.', 'warning')
        return
      }

      showToast('Exportação iniciada', 'warning')

      try {
        if (format === 'excel') {
          exportPrefeituraContratoMonthExcel(exportContext)
          showToast('Planilha gerada com KPIs do mês', 'success')
          return
        }
        await exportPrefeituraContratoMonthPdf(exportContext)
        showToast('PDF gerado com KPIs do mês', 'success')
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível gerar o relatório. Tente novamente.'
        showToast(message, 'error')
      }
    },
    [exportContext, showToast, totalFiltered],
  )

  if (!isActive) return null

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[9998] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-gray-900/45 backdrop-blur-[2px] transition-opacity duration-300 ${
            panelVisible ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Fechar consultas do mês"
          onClick={onClose}
          tabIndex={panelVisible ? 0 : -1}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="pref-contrato-month-drawer-title"
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

          <header className="relative z-20 shrink-0 overflow-visible border-b border-gray-200/80 bg-gradient-to-br from-[var(--brand-primary-light)]/70 via-orange-50/50 to-white px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[#ff8c33] text-white shadow-[0_8px_24px_rgba(255,107,0,0.35)]">
                  <CalendarDays className="h-6 w-6" strokeWidth={1.85} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                    Consultas do pacote
                  </p>
                  <h2
                    id="pref-contrato-month-drawer-title"
                    className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-[1.35rem]"
                  >
                    {monthLabelLong}
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {detail
                      ? `${detail.contractNumber} · ${detail.contractPeriodLabel}`
                      : 'Consultas do pacote mensal'}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {isLoading
                      ? 'Carregando consultas…'
                      : `${formatNumber(totalFiltered)} consulta${totalFiltered === 1 ? '' : 's'} realizadas no mês`}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 overflow-visible">
                <ExportFormatMenu
                  resultCount={totalFiltered}
                  itemSingular="consulta"
                  itemPlural="consultas"
                  resultScopeLabel="neste mês"
                  onSelect={(format) => void handleExport(format)}
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="mt-4">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-100/80"
                    />
                  ))}
                </div>
              ) : detail ? (
                <PrefeituraConsultasKpiCards
                  items={kpiCards}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                />
              ) : null}
            </div>
          </header>

          {loadError ? (
            <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
              {loadError}
            </div>
          ) : null}

          {!isLoading && !loadError ? (
            <>
          <div className="flex shrink-0 items-center justify-end gap-3 border-b border-gray-200 bg-gray-50/60 px-5 py-2 sm:px-6">
            {!sensitiveDataUnlocked ? (
              <>
                <span className="mr-auto text-xs text-gray-500">
                  CPF mascarado conforme a LGPD · desbloqueio registrado na auditoria.
                </span>
                <button
                  type="button"
                  onClick={() => setUnlockModalOpen(true)}
                  className="text-sm font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
                >
                  Ver dados
                </button>
              </>
            ) : (
              <>
                <span className="mr-auto text-xs font-medium text-emerald-600">
                  Dados pessoais visíveis · acesso auditado
                </span>
                <button
                  type="button"
                  onClick={() => setSensitiveDataUnlocked(false)}
                  className="text-sm font-semibold text-gray-600 underline-offset-2 transition hover:text-gray-900 hover:underline"
                >
                  Ocultar dados
                </button>
              </>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 text-center sm:px-5">Nº</th>
                  <th className="px-3 py-3 text-center">Paciente</th>
                  <th className="px-3 py-3 text-center">CPF</th>
                  <th className="px-3 py-3 text-center">Idade</th>
                  <th className="px-3 py-3 text-center">Data e hora</th>
                  <th className="px-3 py-3 text-center">Especialidade</th>
                  <th className="px-3 py-3 text-center sm:px-5">Tempo de atendimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm text-gray-500 sm:px-6"
                    >
                      Nenhuma consulta registrada neste mês.
                    </td>
                  </tr>
                ) : null}
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className="text-sm text-gray-700 hover:bg-gray-50/80">
                    <td className="px-4 py-3 text-center align-middle font-mono text-xs font-bold text-gray-500 sm:px-5">
                      {formatPrefeituraContratoLineNumber(record.lineNumber)}
                    </td>
                    <td className="px-3 py-3 text-center align-middle font-semibold text-gray-900">
                      {record.patientName}
                    </td>
                    <td
                      className={`px-3 py-3 text-center align-middle text-xs tabular-nums ${
                        sensitiveDataUnlocked ? 'text-sky-600' : 'text-gray-500'
                      }`}
                    >
                      {displayCpf(record.cpf)}
                    </td>
                    <td className="px-3 py-3 text-center align-middle tabular-nums">
                      {record.age} anos
                    </td>
                    <td className="px-3 py-3 text-center align-middle">
                      <span className="block font-medium text-gray-900">{record.date}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">{record.time}</span>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-gray-700">
                      {record.specialty}
                    </td>
                    <td className="px-3 py-3 text-center align-middle tabular-nums sm:px-5">
                      {record.durationMinutes} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-gray-500">
              {totalFiltered === 0
                ? 'Nenhum resultado'
                : `Mostrando ${showingFrom} a ${showingTo} de ${formatNumber(totalFiltered)} consulta${totalFiltered === 1 ? '' : 's'}`}
            </p>
            <nav className="flex items-center gap-1" aria-label="Paginação de consultas do mês">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                      pageNumber === safePage
                        ? 'border border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                        : 'border border-transparent text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ),
              )}
              {totalPages > 3 ? (
                <>
                  <span className="px-1 text-sm text-gray-400">…</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                      safePage === totalPages
                        ? 'border border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próximo
              </button>
            </nav>
          </footer>
            </>
          ) : isLoading ? (
            <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-16 text-sm text-gray-500">
              Carregando consultas do mês…
            </div>
          ) : null}
        </aside>
      </div>

      <LgpdUnlockModal
        open={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        onSuccess={() => {
          setSensitiveDataUnlocked(true)
          showToast('Dados liberados. Acesso registrado na auditoria municipal.', 'success')
        }}
      />

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={dismissToast}
      />
    </>,
    document.body,
  )
}
