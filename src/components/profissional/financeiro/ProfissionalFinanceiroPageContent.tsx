import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import type {
  ProfissionalBillingShift,
  ProfissionalCompetenceClosure,
  ProfissionalPrestadorEmpresa,
} from '../../../types/profissionalFinanceiro'
import type {
  ProfissionalFinanceiroSummary,
  UpdateProfissionalFinanceiroDadosPagamentoInput,
} from '../../../types/profissionalFinanceiroApi'
import {
  addCompetenceMonths,
  formatCompetenceLabel,
  isCurrentCompetence,
} from '../../../utils/profissional/profissionalCompetence'
import type { ProfissionalFinanceiroStats } from '../../../utils/profissional/computeProfissionalFinanceiroStats'
import { PROFISSIONAL_FINANCEIRO_TOUR_DEMO_COMPETENCE_KEY } from '../../../config/profissionalFinanceiroTour'
import { ProfissionalFinanceiroClosureModal } from './ProfissionalFinanceiroClosureModal'
import { ProfissionalFinanceiroForecastSection } from './ProfissionalFinanceiroForecastSection'
import { ProfissionalFinanceiroHistorySection } from './ProfissionalFinanceiroSidebar'
import { ProfissionalFinanceiroHeroCard } from './ProfissionalFinanceiroHeroCard'
import { ProfissionalFinanceiroMonthNav } from './ProfissionalFinanceiroMonthNav'
import {
  profissionalFinanceiroGridClass,
  profissionalFinanceiroHistoryCellClass,
  profissionalFinanceiroMainColumnClass,
  profissionalFinanceiroShiftsCellClass,
  profissionalFinanceiroSidebarColumnClass,
} from './profissionalFinanceiroPageLayout'
import { ProfissionalFinanceiroShiftsPanel } from './ProfissionalFinanceiroShiftsPanel'

type ClosureTourStep = 1 | 2 | 3

export type ProfissionalFinanceiroPageContentHandle = {
  openClosureModal: () => void
  closeClosureModal: () => void
  setClosureTourStep: (step: ClosureTourStep) => void
}

type ForecastRow = {
  key: string
  realizados: number
  previstos: number
  total: number
  qtdConsultas: number
}

type ProfissionalFinanceiroPageContentProps = {
  empresa: ProfissionalPrestadorEmpresa
  closures: ProfissionalCompetenceClosure[]
  competenceKey: string
  competenceBounds: string[]
  canGoPrevious: boolean
  canGoNext: boolean
  monthShifts: ProfissionalBillingShift[]
  stats: ProfissionalFinanceiroStats
  summary: ProfissionalFinanceiroSummary | null
  forecastRows: ForecastRow[]
  isDetailLoading?: boolean
  onCompetenceChange: (key: string) => void
  onClosureChange: (closure: ProfissionalCompetenceClosure) => void
  onSaveDadosPagamento: (
    payload: UpdateProfissionalFinanceiroDadosPagamentoInput,
  ) => Promise<unknown>
  onSubmitFechamento: (
    payload: {
      invoiceFile: File
      invoiceFileName: string
      pixKey: string
      pixKeyType: string
      onUploadProgress?: (percent: number) => void
    },
  ) => Promise<void>
  isSavingPagamento?: boolean
  isSavingFechamento?: boolean
  tourLockClosureClose?: boolean
  tourClosureStepOverride?: ClosureTourStep | null
  tourClosureActive?: boolean
}

export const ProfissionalFinanceiroPageContent = forwardRef<
  ProfissionalFinanceiroPageContentHandle,
  ProfissionalFinanceiroPageContentProps
>(function ProfissionalFinanceiroPageContent(
  {
    empresa,
    closures,
    competenceKey,
    canGoPrevious,
    canGoNext,
    monthShifts,
    stats,
    summary,
    forecastRows,
    isDetailLoading = false,
    onCompetenceChange,
    onClosureChange,
    onSaveDadosPagamento,
    onSubmitFechamento,
    isSavingPagamento = false,
    isSavingFechamento = false,
    tourLockClosureClose = false,
    tourClosureStepOverride = null,
    tourClosureActive = false,
  },
  ref,
) {
  const [closureModalOpen, setClosureModalOpen] = useState(false)

  const closure = useMemo(
    () =>
      closures.find((c) => c.competenceKey === competenceKey) ?? {
        competenceKey,
        status: 'aberto' as const,
      },
    [closures, competenceKey],
  )

  const competenceLabel = formatCompetenceLabel(competenceKey)
  const isCurrentMonth = isCurrentCompetence(competenceKey)

  const isClosureLocked =
    closure.status === 'em_analise' ||
    closure.status === 'aprovado' ||
    closure.status === 'pago'

  const closureButtonLabel = isClosureLocked ? 'Ver fechamento' : 'Fazer fechamento'

  useImperativeHandle(
    ref,
    () => ({
      openClosureModal: () => setClosureModalOpen(true),
      closeClosureModal: () => setClosureModalOpen(false),
      setClosureTourStep: () => setClosureModalOpen(true),
    }),
    [],
  )

  async function handleSubmitClosure(payload: {
    invoiceFile: File
    invoiceFileName: string
    pixKey: string
    pixKeyType: string
    onUploadProgress?: (percent: number) => void
  }) {
    if (tourClosureActive || tourLockClosureClose) {
      await onSaveDadosPagamento({
        pixTipo: payload.pixKeyType,
        pixChave: payload.pixKey,
      })

      onClosureChange({
        ...closure,
        status: 'em_analise',
        submittedAt: new Date().toISOString(),
        invoiceFileName: payload.invoiceFileName,
        pixKeyUsed: payload.pixKey,
        rejectionReason: undefined,
      })
      return
    }

    await onSubmitFechamento(payload)
  }

  function handleCloseClosureModal() {
    if (tourLockClosureClose) return
    setClosureModalOpen(false)
  }

  function handleOpenClosure() {
    setClosureModalOpen(true)
  }

  const highlightClosureBtn = competenceKey === PROFISSIONAL_FINANCEIRO_TOUR_DEMO_COMPETENCE_KEY

  return (
    <>
      <div className={profissionalFinanceiroGridClass}>
        <div className={profissionalFinanceiroMainColumnClass}>
          <ProfissionalFinanceiroMonthNav
            label={competenceLabel}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onPrevious={() => onCompetenceChange(addCompetenceMonths(competenceKey, -1))}
            onNext={() => onCompetenceChange(addCompetenceMonths(competenceKey, 1))}
          />
          <ProfissionalFinanceiroHeroCard
            competenceLabel={competenceLabel}
            stats={stats}
            summary={summary}
            isCurrentMonth={isCurrentMonth}
          />
          <div className={profissionalFinanceiroShiftsCellClass}>
            <ProfissionalFinanceiroShiftsPanel
              shifts={monthShifts}
              isLoading={isDetailLoading}
              closureButtonLabel={closureButtonLabel}
              onOpenClosure={handleOpenClosure}
              tourHighlightClosureBtn={highlightClosureBtn}
            />
          </div>
        </div>

        <div className={profissionalFinanceiroSidebarColumnClass}>
          <ProfissionalFinanceiroForecastSection rows={forecastRows} />
          <div className={profissionalFinanceiroHistoryCellClass}>
            <ProfissionalFinanceiroHistorySection
              activeCompetenceKey={competenceKey}
              closures={closures}
              forecastRows={forecastRows}
              onSelectCompetence={onCompetenceChange}
            />
          </div>
        </div>
      </div>

      <ProfissionalFinanceiroClosureModal
        open={closureModalOpen}
        competenceKey={competenceKey}
        closure={closure}
        empresa={empresa}
        stats={stats}
        canSubmit={!isClosureLocked}
        isSaving={isSavingPagamento || isSavingFechamento}
        onClose={handleCloseClosureModal}
        onSubmit={handleSubmitClosure}
        tourLockClose={tourLockClosureClose}
        tourStepOverride={tourClosureStepOverride}
        tourActive={tourClosureActive}
      />
    </>
  )
})
