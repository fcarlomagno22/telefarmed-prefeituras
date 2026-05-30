import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import {
  ProfissionalFinanceiroPageContent,
  type ProfissionalFinanceiroPageContentHandle,
} from '../components/profissional/financeiro/ProfissionalFinanceiroPageContent'
import { profissionalFinanceiroBodyClass } from '../components/profissional/financeiro/profissionalFinanceiroPageLayout'
import { ProfissionalOnboardingTour } from '../components/profissional/onboarding/ProfissionalOnboardingTour'
import { ProfissionalPageHeader } from '../components/profissional/ProfissionalPageHeader'
import {
  dashboardPageFillScrollAreaClass,
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import {
  profissionalFinanceiroClosureTourStepIds,
  profissionalFinanceiroTourFirstVisitBody,
  PROFISSIONAL_FINANCEIRO_TOUR_DEMO_COMPETENCE_KEY,
  type ProfissionalFinanceiroTourStep,
} from '../config/profissionalFinanceiroTour'
import { findProfissionalNavByPathname } from '../config/profissionalSidebarNav'
import {
  profissionalFinanceiroAvailableCompetences,
  profissionalFinanceiroClosuresInitial,
  profissionalPrestadorEmpresa,
} from '../data/profissionalFinanceiroMock'
import { useProfissionalFinanceiroTour } from '../hooks/useProfissionalFinanceiroTour'
import type { ProfissionalCompetenceClosure } from '../types/profissionalFinanceiro'
import { competenceKeyFromDate } from '../utils/profissional/profissionalCompetence'

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

  const [competenceKey, setCompetenceKeyState] = useState(() => {
    const current = competenceKeyFromDate(new Date())
    const bounds = profissionalFinanceiroAvailableCompetences
    if (current < bounds[0]) return bounds[0]
    if (current > bounds[bounds.length - 1]) return bounds[bounds.length - 1]
    return current
  })

  const setCompetenceKey = useCallback((key: string) => {
    const bounds = profissionalFinanceiroAvailableCompetences
    if (key < bounds[0]) {
      setCompetenceKeyState(bounds[0])
      return
    }
    if (key > bounds[bounds.length - 1]) {
      setCompetenceKeyState(bounds[bounds.length - 1])
      return
    }
    setCompetenceKeyState(key)
  }, [])

  const [closures, setClosures] = useState<ProfissionalCompetenceClosure[]>(
    profissionalFinanceiroClosuresInitial,
  )

  const [tourClosureStepOverride, setTourClosureStepOverride] = useState<1 | 2 | 3 | null>(null)

  const handleClosureChange = useCallback((updated: ProfissionalCompetenceClosure) => {
    setClosures((prev) => {
      const index = prev.findIndex((c) => c.competenceKey === updated.competenceKey)
      if (index === -1) return [...prev, updated]
      const next = [...prev]
      next[index] = updated
      return next
    })
  }, [])

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

  return (
    <>
      <div className={dashboardPageShellClass} aria-label={meta.title}>
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
            <ProfissionalFinanceiroPageContent
              ref={contentRef}
              empresa={profissionalPrestadorEmpresa}
              closures={closures}
              competenceKey={competenceKey}
              onCompetenceChange={setCompetenceKey}
              onClosureChange={handleClosureChange}
              tourLockClosureClose={tourLockClosureClose}
              tourClosureStepOverride={tourClosureStepOverride}
              tourClosureActive={tour.active && tourLockClosureClose}
            />
          </div>
        </div>
      </div>

      <ProfissionalOnboardingTour
        open={tour.active}
        title={tour.step.title}
        body={
          tour.isMandatorySession && tour.step.id === 'welcome'
            ? profissionalFinanceiroTourFirstVisitBody
            : tour.step.body
        }
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
