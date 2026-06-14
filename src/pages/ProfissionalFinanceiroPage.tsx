import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import {
  ProfissionalFinanceiroPageContent,
  type ProfissionalFinanceiroPageContentHandle,
} from '../components/profissional/financeiro/ProfissionalFinanceiroPageContent'
import { profissionalFinanceiroBodyClass } from '../components/profissional/financeiro/profissionalFinanceiroPageLayout'
import { ProfissionalOnboardingTour } from '../components/profissional/onboarding/ProfissionalOnboardingTour'
import { ProfissionalTourInviteModal } from '../components/profissional/onboarding/ProfissionalTourInviteModal'
import { ProfissionalPageHeader } from '../components/profissional/ProfissionalPageHeader'
import {
  dashboardPageFillScrollAreaClass,
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import {
  profissionalFinanceiroClosureTourStepIds,
  PROFISSIONAL_FINANCEIRO_TOUR_DEMO_COMPETENCE_KEY,
  type ProfissionalFinanceiroTourStep,
} from '../config/profissionalFinanceiroTour'
import { profissionalTourInviteMeta } from '../config/profissionalTourInvite'
import { findProfissionalNavByPathname } from '../config/profissionalSidebarNav'
import {
  readDefaultProfissionalFinanceiroCompetenceKey,
  useProfissionalFinanceiroPage,
} from '../hooks/useProfissionalFinanceiroPage'
import { useProfissionalFinanceiroTour } from '../hooks/useProfissionalFinanceiroTour'
import {
  resolveProfissionalFinanceiroTourMonthShifts,
  resolveProfissionalFinanceiroTourStats,
} from '../utils/profissional/profissionalTourDemoFallbacks'
import { shouldShowPortalPageLoadingBlock } from '../utils/portal/portalPageLoading'
import { ProfissionalFinanceiroPageSkeleton } from '../components/profissional/skeletons/ProfissionalFinanceiroPageSkeleton'

const fallbackMeta = {
  title: 'Financeiro',
  description:
    'Recebimentos, notas fiscais de prestação de serviços e acompanhamento do seu contrato.',
}

const LIST_TOUR_STEP_IDS = new Set([
  'welcome',
  'month-nav',
  'hero',
  'shifts-panel',
  'closure-btn',
])

const CLOSURE_STEP_BY_TOUR_ID: Partial<
  Record<ProfissionalFinanceiroTourStep['id'], 1 | 2 | 3>
> = {
  'closure-step-1': 1,
  'closure-step-2': 2,
  'closure-step-3': 3,
}

export function ProfissionalFinanceiroPage() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const meta = findProfissionalNavByPathname(pathname) ?? fallbackMeta
  const forceTourStart = searchParams.get('tour') === 'financeiro'
  const contentRef = useRef<ProfissionalFinanceiroPageContentHandle>(null)

  const [competenceKey, setCompetenceKeyState] = useState(
    readDefaultProfissionalFinanceiroCompetenceKey,
  )

  const financeiro = useProfissionalFinanceiroPage(competenceKey)

  useEffect(() => {
    if (!competenceKey && financeiro.defaultCompetenceKey) {
      setCompetenceKeyState(financeiro.defaultCompetenceKey)
    }
  }, [competenceKey, financeiro.defaultCompetenceKey])

  const setCompetenceKey = useCallback(
    (key: string) => {
      const bounds = financeiro.competenceBounds
      if (bounds.length === 0) {
        setCompetenceKeyState(key)
        return
      }
      if (key < bounds[0]) {
        setCompetenceKeyState(bounds[0])
        return
      }
      if (key > bounds[bounds.length - 1]) {
        setCompetenceKeyState(bounds[bounds.length - 1])
        return
      }
      setCompetenceKeyState(key)
    },
    [financeiro.competenceBounds],
  )

  const [tourClosureStepOverride, setTourClosureStepOverride] = useState<1 | 2 | 3 | null>(null)

  const openClosureModal = useCallback(() => {
    contentRef.current?.openClosureModal()
  }, [])

  const closeClosureModal = useCallback(() => {
    contentRef.current?.closeClosureModal()
  }, [])

  const handleTourStepActive = useCallback(
    (step: ProfissionalFinanceiroTourStep) => {
      if (step.id === 'welcome') {
        setCompetenceKey(PROFISSIONAL_FINANCEIRO_TOUR_DEMO_COMPETENCE_KEY)
        closeClosureModal()
        setTourClosureStepOverride(null)
        return
      }

      if (LIST_TOUR_STEP_IDS.has(step.id)) {
        setCompetenceKey(PROFISSIONAL_FINANCEIRO_TOUR_DEMO_COMPETENCE_KEY)
        if (step.id !== 'closure-btn') {
          closeClosureModal()
          setTourClosureStepOverride(null)
        }
        return
      }

      if (profissionalFinanceiroClosureTourStepIds.has(step.id)) {
        setCompetenceKey(PROFISSIONAL_FINANCEIRO_TOUR_DEMO_COMPETENCE_KEY)
        openClosureModal()
        setTourClosureStepOverride(CLOSURE_STEP_BY_TOUR_ID[step.id] ?? 1)
        return
      }

      if (step.id === 'forecast' || step.id === 'history' || step.id === 'done') {
        closeClosureModal()
        setTourClosureStepOverride(null)
      }
    },
    [closeClosureModal, openClosureModal, setCompetenceKey],
  )

  const handleTourBeforeAdvance = useCallback(
    (step: ProfissionalFinanceiroTourStep, source: 'next' | 'target-click') => {
      if (step.id === 'closure-btn') {
        openClosureModal()
        setTourClosureStepOverride(1)
        return
      }

      if (step.id === 'closure-step-1') {
        setTourClosureStepOverride(2)
        return
      }

      if (step.id === 'closure-step-2') {
        setTourClosureStepOverride(3)
        return
      }

      if (step.id === 'closure-step-3' && source === 'next') {
        closeClosureModal()
        setTourClosureStepOverride(null)
      }
    },
    [closeClosureModal, openClosureModal],
  )

  const tour = useProfissionalFinanceiroTour({
    forceStart: forceTourStart,
    onStepActive: handleTourStepActive,
    onBeforeAdvance: handleTourBeforeAdvance,
  })

  useEffect(() => {
    if (tour.active) return
    closeClosureModal()
    setTourClosureStepOverride(null)
  }, [tour.active, closeClosureModal])

  const tourLockClosureClose =
    tour.active && profissionalFinanceiroClosureTourStepIds.has(tour.step.id)

  const displayMonthShifts = useMemo(
    () =>
      resolveProfissionalFinanceiroTourMonthShifts(
        financeiro.monthShifts,
        competenceKey,
        tour.active,
      ),
    [competenceKey, financeiro.monthShifts, tour.active],
  )

  const displayStats = useMemo(
    () => resolveProfissionalFinanceiroTourStats(financeiro.stats, displayMonthShifts, tour.active),
    [displayMonthShifts, financeiro.stats, tour.active],
  )

  const competenceBounds = financeiro.competenceBounds
  const canGoPrevious = competenceBounds.length > 0 && competenceKey !== competenceBounds[0]
  const canGoNext =
    competenceBounds.length > 0 && competenceKey !== competenceBounds[competenceBounds.length - 1]

  const showLoadingBlock = shouldShowPortalPageLoadingBlock(
    financeiro.isLoading,
    financeiro.empresa != null && competenceKey.length > 0,
  )

  return (
    <>
      <div className={dashboardPageShellClass} aria-label={meta.title} aria-busy={showLoadingBlock}>
        <div className={dashboardPageHeaderWrapClass}>
          <ProfissionalPageHeader
            title={meta.title}
            description={meta.description}
            actions={
              !tour.active ? (
                <button
                  type="button"
                  onClick={() => tour.startTour({ replay: true })}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50/80 px-3 py-2 text-xs font-semibold text-[var(--brand-primary)] transition hover:bg-orange-100"
                >
                  Ver tour guiado
                </button>
              ) : null
            }
          />
        </div>

        <div className={dashboardPageFillScrollAreaClass}>
          <div
            className={[profissionalFinanceiroBodyClass, dashboardPageScrollPaddingClass].join(' ')}
          >
            {financeiro.loadError && !financeiro.isLoading ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {financeiro.loadError}
              </div>
            ) : null}

            {showLoadingBlock ? (
              <ProfissionalFinanceiroPageSkeleton />
            ) : (
              <ProfissionalFinanceiroPageContent
                ref={contentRef}
                empresa={financeiro.empresa}
                closures={financeiro.closures}
                competenceKey={competenceKey}
                competenceBounds={competenceBounds}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                monthShifts={displayMonthShifts}
                stats={displayStats}
                summary={financeiro.summary}
                forecastRows={financeiro.forecastRows}
                isDetailLoading={
                  financeiro.isDetailLoading &&
                  !(tour.active && displayMonthShifts.length > 0)
                }
                onCompetenceChange={setCompetenceKey}
                onClosureChange={financeiro.handleClosureChange}
                onSaveDadosPagamento={financeiro.saveDadosPagamento}
                onSubmitFechamento={(payload) =>
                  financeiro.submitFechamento(competenceKey, payload)
                }
                isSavingPagamento={financeiro.isSavingPagamento}
                isSavingFechamento={financeiro.isSavingFechamento}
                tourLockClosureClose={tourLockClosureClose}
                tourClosureStepOverride={tourClosureStepOverride}
                tourClosureActive={tour.active && tourLockClosureClose}
              />
            )}
          </div>
        </div>
      </div>

      <ProfissionalTourInviteModal
        open={tour.inviteOpen}
        {...profissionalTourInviteMeta.financeiro}
        onStart={tour.acceptInvite}
        onDismiss={tour.dismissInvite}
      />

      <ProfissionalOnboardingTour
        open={tour.active}
        title={tour.step.title}
        body={tour.step.body}
        hint={tour.step.hint}
        stepIndex={tour.stepIndex}
        totalSteps={tour.totalSteps}
        placement={tour.step.placement}
        targetRect={tour.targetRect}
        advanceOn={tour.step.advanceOn}
        isLastStep={tour.isLastStep}
        nextLabel={tour.step.nextLabel}
        blockBackground={
          tour.step.advanceOn !== 'target-click' &&
          tour.step.advanceOn !== 'next-or-target-click'
        }
        onNext={tour.goNext}
        onBack={tour.goBack}
      />
    </>
  )
}
