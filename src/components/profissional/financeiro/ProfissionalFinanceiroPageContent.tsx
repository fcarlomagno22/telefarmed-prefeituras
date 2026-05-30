import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import type {
  ProfissionalCompetenceClosure,
  ProfissionalPrestadorEmpresa,
} from '../../../types/profissionalFinanceiro'
import {
  buildProfissionalBillingShifts,
  filterBillingShiftsByCompetence,
} from '../../../utils/profissional/buildProfissionalBillingShifts'
import { computeProfissionalFinanceiroStats } from '../../../utils/profissional/computeProfissionalFinanceiroStats'
import {
  addCompetenceMonths,
  formatCompetenceLabel,
  isCurrentCompetence,
} from '../../../utils/profissional/profissionalCompetence'
import { profissionalFinanceiroAvailableCompetences } from '../../../data/profissionalFinanceiroMock'
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

type ProfissionalFinanceiroPageContentProps = {
  empresa: ProfissionalPrestadorEmpresa
  closures: ProfissionalCompetenceClosure[]
  competenceKey: string
  onCompetenceChange: (key: string) => void
  onClosureChange: (closure: ProfissionalCompetenceClosure) => void
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
    onCompetenceChange,
    onClosureChange,
    tourLockClosureClose = false,
    tourClosureStepOverride = null,
    tourClosureActive = false,
  },
  ref,
) {
  const allShifts = useMemo(() => buildProfissionalBillingShifts(), [])
  const competenceBounds = profissionalFinanceiroAvailableCompetences

  const [closureModalOpen, setClosureModalOpen] = useState(false)

  const monthShifts = useMemo(
    () => filterBillingShiftsByCompetence(allShifts, competenceKey),
    [allShifts, competenceKey],
  )

  const stats = useMemo(
    () => computeProfissionalFinanceiroStats(monthShifts),
    [monthShifts],
  )

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
  const canGoPrevious = competenceKey !== competenceBounds[0]
  const canGoNext = competenceKey !== competenceBounds[competenceBounds.length - 1]

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

  function handleSubmitClosure(payload: {
    invoiceFileName: string
    pixKey: string
  }) {
    if (tourLockClosureClose) return

    onClosureChange({
      ...closure,
      status: 'em_analise',
      submittedAt: new Date().toISOString(),
      invoiceFileName: payload.invoiceFileName,
      pixKeyUsed: payload.pixKey,
      rejectionReason: undefined,
    })
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
            isCurrentMonth={isCurrentMonth}
          />
          <div className={profissionalFinanceiroShiftsCellClass}>
            <ProfissionalFinanceiroShiftsPanel
              shifts={monthShifts}
              closureButtonLabel={closureButtonLabel}
              onOpenClosure={handleOpenClosure}
              tourHighlightClosureBtn={highlightClosureBtn}
            />
          </div>
        </div>

        <div className={profissionalFinanceiroSidebarColumnClass}>
          <ProfissionalFinanceiroForecastSection />
          <div className={profissionalFinanceiroHistoryCellClass}>
            <ProfissionalFinanceiroHistorySection
              activeCompetenceKey={competenceKey}
              closures={closures}
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
        onClose={handleCloseClosureModal}
        onSubmit={handleSubmitClosure}
        tourLockClose={tourLockClosureClose}
        tourStepOverride={tourClosureStepOverride}
        tourActive={tourClosureActive}
      />
    </>
  )
})
