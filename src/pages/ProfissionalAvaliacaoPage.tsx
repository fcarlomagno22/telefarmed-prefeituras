import { useCallback, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ProfissionalAvaliacaoChartsSidebar } from '../components/profissional/avaliacao/ProfissionalAvaliacaoChartsSidebar'
import { ProfissionalAvaliacaoMainPanel } from '../components/profissional/avaliacao/ProfissionalAvaliacaoMainPanel'
import { ProfissionalOnboardingTour } from '../components/profissional/onboarding/ProfissionalOnboardingTour'
import { ProfissionalTourInviteModal } from '../components/profissional/onboarding/ProfissionalTourInviteModal'
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
  type ProfissionalAvaliacaoTourStep,
} from '../config/profissionalAvaliacaoTour'
import { profissionalTourInviteMeta } from '../config/profissionalTourInvite'
import { findProfissionalNavByPathname } from '../config/profissionalSidebarNav'
import { useProfissionalAvaliacaoPage } from '../hooks/useProfissionalAvaliacaoPage'
import { useProfissionalAvaliacaoTour } from '../hooks/useProfissionalAvaliacaoTour'
import type { ProfissionalAvaliacoesFilters } from '../types/profissionalAvaliacoes'
import { defaultProfissionalAvaliacoesFilters } from '../utils/profissional/filterProfissionalAvaliacoes'
import { computeProfissionalAvaliacoesStats } from '../utils/profissional/computeProfissionalAvaliacoesStats'
import { shouldShowPortalPageLoadingBlock } from '../utils/portal/portalPageLoading'
import { ProfissionalAvaliacaoMainPanelSkeleton } from '../components/profissional/skeletons/ProfissionalAvaliacaoMainPanelSkeleton'
import { ProfissionalAvaliacaoChartsSidebarSkeleton } from '../components/profissional/skeletons/ProfissionalAvaliacaoChartsSidebarSkeleton'
import {
  resolveProfissionalAvaliacaoTourReviews,
  resolveProfissionalAvaliacaoTourSummary,
} from '../utils/profissional/profissionalTourDemoFallbacks'
import { profissionalAvaliacoesReviews } from '../data/profissionalAvaliacoesMock'

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

  const avaliacoes = useProfissionalAvaliacaoPage(filters)

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

  const displayReviews = useMemo(
    () => resolveProfissionalAvaliacaoTourReviews(avaliacoes.reviews, filters, tour.active),
    [avaliacoes.reviews, filters, tour.active],
  )

  const displaySummary = useMemo(
    () => resolveProfissionalAvaliacaoTourSummary(avaliacoes.summary, tour.active),
    [avaliacoes.summary, tour.active],
  )

  const displayStats = useMemo(() => {
    if (tour.active && !avaliacoes.summary) {
      return computeProfissionalAvaliacoesStats(profissionalAvaliacoesReviews)
    }
    return avaliacoes.stats
  }, [avaliacoes.stats, avaliacoes.summary, tour.active])

  const showLoadingBlock = shouldShowPortalPageLoadingBlock(
    avaliacoes.isLoading,
    avaliacoes.reviews.length > 0 || avaliacoes.summary != null,
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
            className={[
              profissionalAtendimentosColumnsGridClass,
              dashboardPageScrollPaddingClass,
              'mt-4 pb-5',
            ].join(' ')}
          >
            {avaliacoes.loadError && !avaliacoes.isLoading ? (
              <div className="col-span-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {avaliacoes.loadError}
              </div>
            ) : null}

            <div className={profissionalAtendimentosColumnScrollClass}>
              <div className={profissionalAtendimentosColumnFillClass}>
                {showLoadingBlock ? (
                  <ProfissionalAvaliacaoMainPanelSkeleton />
                ) : (
                  <ProfissionalAvaliacaoMainPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    reviews={displayReviews}
                    summary={displaySummary}
                  />
                )}
              </div>
            </div>

            <div className={profissionalAtendimentosColumnScrollClass}>
              <div className={profissionalAtendimentosColumnFillClass}>
                {showLoadingBlock ? (
                  <ProfissionalAvaliacaoChartsSidebarSkeleton />
                ) : (
                  <ProfissionalAvaliacaoChartsSidebar stats={displayStats} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfissionalTourInviteModal
        open={tour.inviteOpen}
        {...profissionalTourInviteMeta.avaliacao}
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
