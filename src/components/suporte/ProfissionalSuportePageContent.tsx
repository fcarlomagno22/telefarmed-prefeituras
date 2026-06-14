import { MessageSquarePlus } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { findProfissionalNavByPathname } from '../../config/profissionalSidebarNav'
import {
  profissionalSuporteNewTicketTourStepIds,
  profissionalSuporteTicketDrawerTourStepIds,
  type ProfissionalSuporteTourStep,
} from '../../config/profissionalSuporteTour'
import { profissionalTourInviteMeta } from '../../config/profissionalTourInvite'
import { useProfissionalSuporteTour } from '../../hooks/useProfissionalSuporteTour'
import { ProfissionalPageHeader } from '../profissional/ProfissionalPageHeader'
import { ProfissionalPageHeaderSkeleton } from '../profissional/ProfissionalPageHeaderSkeleton'
import { ProfissionalOnboardingTour } from '../profissional/onboarding/ProfissionalOnboardingTour'
import { ProfissionalTourInviteModal } from '../profissional/onboarding/ProfissionalTourInviteModal'
import {
  PortalSuportePageShell,
  type PortalSuportePageShellHandle,
} from './PortalSuportePageShell'
import { useProfissionalAuth } from '../../contexts/ProfissionalAuthContext'

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
  'table',
  'pagination',
])

export function ProfissionalSuportePageContent() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const { getAccessToken, isBootstrapping } = useProfissionalAuth()
  const meta = findProfissionalNavByPathname(pathname) ?? fallbackMeta
  const forceTourStart = searchParams.get('tour') === 'suporte'
  const shellRef = useRef<PortalSuportePageShellHandle>(null)

  const handleTourStepActive = useCallback((step: ProfissionalSuporteTourStep) => {
    if (step.id === 'welcome') {
      shellRef.current?.resetFilters()
      shellRef.current?.closeNewTicketDrawer()
      shellRef.current?.closeTicketDrawer()
      return
    }

    if (LIST_TOUR_STEP_IDS.has(step.id)) {
      shellRef.current?.closeNewTicketDrawer()
      shellRef.current?.closeTicketDrawer()
      return
    }

    if (step.id === 'new-ticket-drawer') {
      shellRef.current?.openNewTicketDrawer()
      return
    }

    if (profissionalSuporteTicketDrawerTourStepIds.has(step.id)) {
      shellRef.current?.openDemoTicket()
    }
  }, [])

  const handleTourBeforeAdvance = useCallback(
    (step: ProfissionalSuporteTourStep, source: 'next' | 'target-click') => {
      if (step.id === 'new-ticket-btn') {
        shellRef.current?.openNewTicketDrawer()
        return
      }

      if (step.id === 'view-ticket') {
        shellRef.current?.openDemoTicket()
        return
      }

      if (step.id === 'new-ticket-drawer' && source === 'next') {
        shellRef.current?.closeNewTicketDrawer()
      }
    },
    [],
  )

  const tour = useProfissionalSuporteTour({
    forceStart: forceTourStart,
    disabled: isBootstrapping,
    onStepActive: handleTourStepActive,
    onBeforeAdvance: handleTourBeforeAdvance,
  })

  const tourLockNewTicketDrawer =
    tour.active && profissionalSuporteNewTicketTourStepIds.has(tour.step.id)
  const tourLockTicketDrawer =
    tour.active && profissionalSuporteTicketDrawerTourStepIds.has(tour.step.id)

  const newTicketButton = useCallback(
    (openDrawer: () => void) => (
      <button
        type="button"
        data-tour="suporte-new-ticket-btn"
        onClick={openDrawer}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-[var(--brand-primary)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brand-primary)] shadow-sm transition hover:bg-[var(--brand-primary-light)]"
      >
        <MessageSquarePlus className="h-4 w-4" strokeWidth={2} />
        Abrir novo chamado
      </button>
    ),
    [],
  )

  return (
    <>
      <PortalSuportePageShell
        ref={shellRef}
        variant="profissional"
        getAccessToken={getAccessToken}
        summaryTitle="Seus chamados"
        tourActive={tour.active}
        tourLockDrawerClose={tourLockTicketDrawer}
        newTicketTourLockClose={tourLockNewTicketDrawer}
        shellLoadingDelayMs={0}
        headerSkeleton={<ProfissionalPageHeaderSkeleton />}
        headerSlot={
          isBootstrapping ? undefined : (
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
          )
        }
        renderToolbarActions={(openNewTicket) => newTicketButton(openNewTicket)}
      />

      {!isBootstrapping ? (
        <>
          <ProfissionalTourInviteModal
            open={tour.inviteOpen}
            {...profissionalTourInviteMeta.suporte}
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
      ) : null}
    </>
  )
}
