import { MessageSquarePlus } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ProfissionalPageHeader } from '../profissional/ProfissionalPageHeader'
import { ProfissionalPageHeaderSkeleton } from '../profissional/ProfissionalPageHeaderSkeleton'
import { ProfissionalOnboardingTour } from '../profissional/onboarding/ProfissionalOnboardingTour'
import {
  profissionalSuporteNewTicketTourStepIds,
  profissionalSuporteTicketDrawerTourStepIds,
  profissionalSuporteTourFirstVisitBody,
  type ProfissionalSuporteTourStep,
} from '../../config/profissionalSuporteTour'
import {
  profissionalSupportMonthlyTrend,
  profissionalSupportPriorityDistribution,
  profissionalSupportStatusSummary,
  profissionalSupportTickets,
} from '../../data/profissionalSuporteMock'
import { findProfissionalNavByPathname } from '../../config/profissionalSidebarNav'
import { useNewSupportTicketDrawer } from '../../hooks/useNewSupportTicketDrawer'
import { usePageSkeletonLoading } from '../../hooks/usePageSkeletonLoading'
import { useProfissionalSuporteTour } from '../../hooks/useProfissionalSuporteTour'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../layout/dashboardPageLayout'
import { SuporteMainPanel, type SuporteMainPanelHandle } from './SuporteMainPanel'
import { SuporteMainPanelSkeleton } from './SuporteMainPanelSkeleton'
import { SuporteSidebarPanel } from './SuporteSidebarPanel'
import { SuporteSidebarPanelSkeleton } from './SuporteSidebarPanelSkeleton'
import {
  suporteColumnFillClass,
  suporteColumnScrollClass,
  suporteColumnsGridClass,
} from './suportePageLayout'

const fallbackMeta = {
  title: 'Suporte',
  description:
    'Abra chamados sobre escala, pagamentos, sistema ou dúvidas do painel profissional.',
}

const LIST_TOUR_STEP_IDS = new Set([
  'welcome',
  'main-panel',
  'search',
  'status-filter',
  'new-ticket-btn',
  'table',
  'view-ticket',
  'pagination',
])

const SIDEBAR_TOUR_STEP_IDS = new Set(['sidebar', 'status-summary', 'priority-chart', 'done'])

export function ProfissionalSuportePageContent() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const meta = findProfissionalNavByPathname(pathname) ?? fallbackMeta
  const isLoading = usePageSkeletonLoading(1200)
  const forceTourStart = searchParams.get('tour') === 'suporte'
  const mainPanelRef = useRef<SuporteMainPanelHandle>(null)
  const newTicketDrawerRef = useRef<ReturnType<typeof useNewSupportTicketDrawer> | null>(null)

  const closeAllOverlays = useCallback(() => {
    newTicketDrawerRef.current?.requestClose()
    mainPanelRef.current?.closeTicketDrawer()
  }, [])

  const handleTourStepActive = useCallback(
    (step: ProfissionalSuporteTourStep) => {
      const newTicketDrawer = newTicketDrawerRef.current
      if (!newTicketDrawer) return

      if (step.id === 'new-ticket-drawer') {
        mainPanelRef.current?.closeTicketDrawer()
        newTicketDrawer.openDrawer()
        return
      }

      if (step.id === 'ticket-drawer' || step.id === 'ticket-drawer-chat') {
        newTicketDrawer.requestClose()
        mainPanelRef.current?.openDemoTicket()
        return
      }

      if (LIST_TOUR_STEP_IDS.has(step.id)) {
        closeAllOverlays()
        if (step.id === 'welcome' || step.id === 'main-panel') {
          mainPanelRef.current?.resetFilters()
        }
        return
      }

      if (SIDEBAR_TOUR_STEP_IDS.has(step.id)) {
        closeAllOverlays()
        mainPanelRef.current?.resetFilters()
      }
    },
    [closeAllOverlays],
  )

  const handleTourBeforeAdvance = useCallback(
    (step: ProfissionalSuporteTourStep, source: 'next' | 'target-click') => {
      const newTicketDrawer = newTicketDrawerRef.current
      if (!newTicketDrawer) return

      if (step.id === 'new-ticket-btn') {
        mainPanelRef.current?.closeTicketDrawer()
        newTicketDrawer.openDrawer()
      }

      if (step.id === 'new-ticket-drawer' && source === 'next') {
        newTicketDrawer.requestClose()
      }

      if (step.id === 'view-ticket') {
        newTicketDrawer.requestClose()
        mainPanelRef.current?.openDemoTicket()
      }

      if (step.id === 'ticket-drawer-chat' && source === 'next') {
        mainPanelRef.current?.closeTicketDrawer()
      }

      if (step.id === 'pagination') {
        closeAllOverlays()
      }
    },
    [closeAllOverlays],
  )

  const tour = useProfissionalSuporteTour({
    forceStart: forceTourStart,
    disabled: isLoading,
    onStepActive: handleTourStepActive,
    onBeforeAdvance: handleTourBeforeAdvance,
  })

  const tourLockNewTicketDrawer =
    tour.active && profissionalSuporteNewTicketTourStepIds.has(tour.step.id)
  const tourLockTicketDrawer =
    tour.active && profissionalSuporteTicketDrawerTourStepIds.has(tour.step.id)

  const newTicketDrawer = useNewSupportTicketDrawer({
    tourLockClose: tourLockNewTicketDrawer,
  })
  newTicketDrawerRef.current = newTicketDrawer

  useEffect(() => {
    if (tour.active) return
    closeAllOverlays()
  }, [tour.active, closeAllOverlays])

  const newTicketButton = (
    <button
      type="button"
      data-tour="suporte-new-ticket-btn"
      onClick={() => newTicketDrawer.openDrawer()}
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-[var(--brand-primary)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brand-primary)] shadow-sm transition hover:bg-[var(--brand-primary-light)]"
    >
      <MessageSquarePlus className="h-4 w-4" strokeWidth={2} />
      Abrir novo chamado
    </button>
  )

  return (
    <>
      <div className={dashboardPageShellClass} aria-busy={isLoading} aria-label={meta.title}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoading ? (
            <ProfissionalPageHeaderSkeleton />
          ) : (
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
          )}
        </div>

        <div
          className={[
            suporteColumnsGridClass,
            dashboardPageScrollPaddingClass,
            'mt-4 pb-5',
          ].join(' ')}
        >
          <div className={suporteColumnScrollClass}>
            <div className={suporteColumnFillClass}>
              {isLoading ? (
                <SuporteMainPanelSkeleton showToolbarAction />
              ) : (
                <SuporteMainPanel
                  ref={mainPanelRef}
                  tickets={profissionalSupportTickets}
                  pageSize={10}
                  toolbarActions={newTicketButton}
                  tourLockDrawerClose={tourLockTicketDrawer}
                />
              )}
            </div>
          </div>

          <div className={suporteColumnScrollClass}>
            <div className={suporteColumnFillClass}>
              {isLoading ? (
                <SuporteSidebarPanelSkeleton />
              ) : (
                <SuporteSidebarPanel
                  statusSummary={profissionalSupportStatusSummary}
                  priorityDistribution={profissionalSupportPriorityDistribution}
                  monthlyTrend={profissionalSupportMonthlyTrend}
                  monthlyTotal={profissionalSupportTickets.length}
                  summaryTitle="Seus chamados"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {!isLoading ? newTicketDrawer.drawerElement : null}

      {!isLoading ? (
        <ProfissionalOnboardingTour
          open={tour.active}
          title={tour.step.title}
          body={
            tour.isMandatorySession && tour.step.id === 'welcome'
              ? profissionalSuporteTourFirstVisitBody
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
      ) : null}
    </>
  )
}
