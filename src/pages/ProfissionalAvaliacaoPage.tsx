import { useCallback, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ProfissionalAvaliacaoChartsSidebar } from '../components/profissional/avaliacao/ProfissionalAvaliacaoChartsSidebar'
import { ProfissionalAvaliacaoMainPanel } from '../components/profissional/avaliacao/ProfissionalAvaliacaoMainPanel'
import { ProfissionalOnboardingTour } from '../components/profissional/onboarding/ProfissionalOnboardingTour'
import { ProfissionalPageHeader } from '../components/profissional/ProfissionalPageHeader'
import {
  profissionalAtendimentosColumnFillClass,
  profissionalAtendimentosColumnsGridClass,
  profissionalAtendimentosColumnScrollClass,
} from '../components/profissional/atendimentos/profissionalAtendimentosPageLayout'
import {
  dashboardPageFillScrollAreaClass,
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import {
  profissionalAvaliacaoTourFirstVisitBody,
  type ProfissionalAvaliacaoTourStep,
} from '../config/profissionalAvaliacaoTour'
import { findProfissionalNavByPathname } from '../config/profissionalSidebarNav'
import { profissionalAvaliacoesReviews } from '../data/profissionalAvaliacoesMock'
import { useProfissionalAvaliacaoTour } from '../hooks/useProfissionalAvaliacaoTour'
import type { ProfissionalAvaliacoesFilters } from '../types/profissionalAvaliacoes'
import {
  defaultProfissionalAvaliacoesFilters,
  filterProfissionalAvaliacoes,
} from '../utils/profissional/filterProfissionalAvaliacoes'

const fallbackMeta = {
  title: 'Avaliação',
  description:
    'Notas e comentários dos pacientes sobre seus atendimentos e desempenho no plantão.',
}

const LIST_TOUR_STEP_IDS = new Set([
  'welcome',
  'hero',
  'tabs',
  'search',
  'reviews-list',
  'review-card',
])

const SIDEBAR_TOUR_STEP_IDS = new Set([
  'charts-sidebar',
  'star-breakdown',
  'sentiment-donut',
  'weekly-volume',
  'done',
])

function resetAvaliacaoFilters(): ProfissionalAvaliacoesFilters {
  return { ...defaultProfissionalAvaliacoesFilters }
}

export function ProfissionalAvaliacaoPage() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const meta = findProfissionalNavByPathname(pathname) ?? fallbackMeta
  const forceTourStart = searchParams.get('tour') === 'avaliacao'

  const [filters, setFilters] = useState<ProfissionalAvaliacoesFilters>(() =>
    resetAvaliacaoFilters(),
  )

  const filteredReviews = useMemo(
    () => filterProfissionalAvaliacoes(profissionalAvaliacoesReviews, filters),
    [filters],
  )

  const handleTourStepActive = useCallback((step: ProfissionalAvaliacaoTourStep) => {
    if (step.id === 'welcome' || LIST_TOUR_STEP_IDS.has(step.id)) {
      setFilters(resetAvaliacaoFilters())
      return
    }

    if (step.id === 'tab-criticos') {
      setFilters((prev) => ({ ...prev, tab: 'todos', search: '' }))
      return
    }

    if (step.id === 'critical-review') {
      setFilters((prev) => ({ ...prev, tab: 'criticos', search: '' }))
      return
    }

    if (SIDEBAR_TOUR_STEP_IDS.has(step.id)) {
      setFilters(resetAvaliacaoFilters())
    }
  }, [])

  const handleTourBeforeAdvance = useCallback(
    (step: ProfissionalAvaliacaoTourStep, source: 'next' | 'target-click') => {
      if (step.id === 'tab-criticos') {
        setFilters((prev) => ({ ...prev, tab: 'criticos', search: '' }))
      }

      if (step.id === 'critical-review' && source === 'next') {
        setFilters(resetAvaliacaoFilters())
      }
    },
    [],
  )

  const tour = useProfissionalAvaliacaoTour({
    forceStart: forceTourStart,
    onStepActive: handleTourStepActive,
    onBeforeAdvance: handleTourBeforeAdvance,
  })

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
            className={[
              profissionalAtendimentosColumnsGridClass,
              dashboardPageScrollPaddingClass,
              'mt-4 pb-5',
            ].join(' ')}
          >
            <div className={profissionalAtendimentosColumnScrollClass}>
              <div className={profissionalAtendimentosColumnFillClass}>
                <ProfissionalAvaliacaoMainPanel filters={filters} onFiltersChange={setFilters} />
              </div>
            </div>

            <div className={profissionalAtendimentosColumnScrollClass}>
              <div className={profissionalAtendimentosColumnFillClass}>
                <ProfissionalAvaliacaoChartsSidebar reviews={filteredReviews} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfissionalOnboardingTour
        open={tour.active}
        title={tour.step.title}
        body={
          tour.isMandatorySession && tour.step.id === 'welcome'
            ? profissionalAvaliacaoTourFirstVisitBody
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
