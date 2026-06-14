import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ProfissionalEscalaClaimModal } from '../components/profissional/escala/ProfissionalEscalaClaimModal'
import { ProfissionalEscalaCancelModal } from '../components/profissional/escala/ProfissionalEscalaCancelModal'
import { ProfissionalEscalaFiltersBar } from '../components/profissional/escala/ProfissionalEscalaFiltersBar'
import {
  PROFISSIONAL_ESCALA_FILTERS_TRIGGER_ID,
  ProfissionalEscalaFiltersMegamenu,
} from '../components/profissional/escala/ProfissionalEscalaFiltersMegamenu'
import { ProfissionalEscalaKpiRow } from '../components/profissional/escala/ProfissionalEscalaKpiRow'
import { ProfissionalEscalaShiftsList } from '../components/profissional/escala/ProfissionalEscalaShiftsList'
import { ProfissionalEscalaSidebarPanel } from '../components/profissional/escala/ProfissionalEscalaSidebarPanel'
import {
  profissionalEscalaFiltersSlotClass,
  profissionalEscalaKpiSlotClass,
  profissionalEscalaMainColumnClass,
  profissionalEscalaPageGridClass,
  profissionalEscalaShiftsSlotClass,
  profissionalEscalaSidebarColumnClass,
  profissionalEscalaSidebarPanelSlotClass,
} from '../components/profissional/escala/profissionalEscalaPageLayout'
import { ProfissionalOnboardingTour } from '../components/profissional/onboarding/ProfissionalOnboardingTour'
import { ProfissionalTourInviteModal } from '../components/profissional/onboarding/ProfissionalTourInviteModal'
import { ProfissionalPageHeader } from '../components/profissional/ProfissionalPageHeader'
import {
  dashboardPageFillScrollAreaClass,
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { Toast, type ToastVariant } from '../components/ui/Toast'
import {
  profissionalEscalaClaimTourStepIds,
  PROFISSIONAL_ESCALA_TOUR_DEMO_SHIFT_ID,
  type ProfissionalEscalaTourStep,
} from '../config/profissionalEscalaTour'
import { profissionalTourInviteMeta } from '../config/profissionalTourInvite'
import { findProfissionalNavByPathname } from '../config/profissionalSidebarNav'
import type { ProfissionalEscalaDisponivel } from '../types/profissionalEscalaDisponivel'
import type { ProfissionalEscalaFilters } from '../types/profissionalEscalaDisponivel'
import {
  averageShiftAmountCents,
  countClaimedThisMonth,
  countShiftsThisWeek,
  countShiftsToday,
  countActiveProfissionalEscalaFilters,
  defaultProfissionalEscalaFilters,
  filterProfissionalEscalaShifts,
} from '../utils/profissional/filterProfissionalEscalaDisponivel'
import { formatProfissionalCurrency } from '../utils/profissional/formatProfissionalCurrency'
import { buildProfissionalEscalaKpiCards } from '../utils/profissional/profissionalEscalaKpiCards'
import { useProfissionalEscalaTour } from '../hooks/useProfissionalEscalaTour'
import { useProfissionalEscalaPage } from '../hooks/useProfissionalEscalaPage'
import { resolveProfissionalEscalaTourShifts } from '../utils/profissional/profissionalTourDemoFallbacks'
import { isProfissionalEscalaApiError } from '../lib/services/profissional/escala'
import { ProfissionalEscalaPageSkeleton } from '../components/profissional/skeletons/ProfissionalEscalaPageSkeleton'
import { shouldShowPortalPageLoadingBlock } from '../utils/portal/portalPageLoading'

const fallbackMeta = {
  title: 'Plantões disponíveis',
  description:
    'Plantões abertos compatíveis com a sua especialidade. Filtre, compare valores e reserve o turno.',
}

const LIST_TOUR_STEP_IDS = new Set(['welcome', 'filters', 'shifts-list', 'city-tooltip', 'claim-btn'])

function findTourDemoShift(shifts: ProfissionalEscalaDisponivel[]) {
  return (
    shifts.find(
      (shift) =>
        shift.id === PROFISSIONAL_ESCALA_TOUR_DEMO_SHIFT_ID && shift.status === 'disponivel',
    ) ?? shifts.find((shift) => shift.status === 'disponivel')
  )
}

export function ProfissionalEscalaPage() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const meta = findProfissionalNavByPathname(pathname) ?? fallbackMeta
  const forceTourStart = searchParams.get('tour') === 'escala'
  const tourActiveRef = useRef(false)
  const tourStepIdRef = useRef<string>('')

  const [draftFilters, setDraftFilters] = useState<ProfissionalEscalaFilters>(() =>
    defaultProfissionalEscalaFilters(''),
  )
  const [appliedFilters, setAppliedFilters] = useState<ProfissionalEscalaFilters>(() =>
    defaultProfissionalEscalaFilters(''),
  )
  const escalaDateFilters = useMemo(
    () => ({
      dateFrom: appliedFilters.dateFrom,
      dateTo: appliedFilters.dateTo,
    }),
    [appliedFilters.dateFrom, appliedFilters.dateTo],
  )

  const {
    user,
    profileSpecialty,
    availableShifts,
    reservedShifts,
    allShiftsForKpi,
    summary,
    isLoading,
    loadError,
    isClaiming,
    isCancelling,
    claimShift,
    cancelShift,
  } = useProfissionalEscalaPage(escalaDateFilters)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [claimTarget, setClaimTarget] = useState<ProfissionalEscalaDisponivel | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ProfissionalEscalaDisponivel | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  useEffect(() => {
    if (!profileSpecialty) return
    const defaults = defaultProfissionalEscalaFilters(profileSpecialty)
    setDraftFilters(defaults)
    setAppliedFilters(defaults)
  }, [profileSpecialty])

  const activeFilterCount = useMemo(
    () => countActiveProfissionalEscalaFilters(appliedFilters, profileSpecialty),
    [appliedFilters, profileSpecialty],
  )

  useEffect(() => {
    if (!filtersOpen) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      const trigger = document.getElementById(PROFISSIONAL_ESCALA_FILTERS_TRIGGER_ID)
      const panel = document.getElementById('profissional-escala-filters-megamenu')
      if (trigger?.contains(target) || panel?.contains(target)) return
      setFiltersOpen(false)
      setDraftFilters(appliedFilters)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [appliedFilters, filtersOpen])

  const kpiCards = useMemo(() => {
    const openAll = availableShifts.filter((s) => s.status === 'disponivel')
    const avg = averageShiftAmountCents(openAll)
    const claimedMonth = summary?.claimedThisMonth ?? countClaimedThisMonth(allShiftsForKpi)

    return buildProfissionalEscalaKpiCards({
      todayCount: countShiftsToday(openAll, profileSpecialty),
      weekCount: countShiftsThisWeek(openAll, profileSpecialty),
      avgAmountFormatted: formatProfissionalCurrency(avg),
      claimedMonth,
      specialty: profileSpecialty,
    })
  }, [allShiftsForKpi, availableShifts, profileSpecialty, summary?.claimedThisMonth])

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters(draftFilters)
  }, [draftFilters])

  const handleClear = useCallback(() => {
    const defaults = defaultProfissionalEscalaFilters(profileSpecialty)
    setDraftFilters(defaults)
    setAppliedFilters(defaults)
    setFiltersOpen(false)
  }, [profileSpecialty])

  const openDemoClaimModal = useCallback(() => {
    const source = resolveProfissionalEscalaTourShifts(availableShifts, tourActiveRef.current)
    const demoShift = findTourDemoShift(source)
    if (demoShift) setClaimTarget(demoShift)
  }, [availableShifts])

  const closeClaimModal = useCallback(() => {
    setClaimTarget(null)
  }, [])

  const closeCancelModal = useCallback(() => {
    setCancelTarget(null)
  }, [])

  const handleCancelRequest = useCallback((shift: ProfissionalEscalaDisponivel) => {
    setCancelTarget(shift)
  }, [])

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTarget) return

    try {
      const ok = await cancelShift(cancelTarget)
      setCancelTarget(null)
      if (ok) {
        showToast('Reserva cancelada. O plantão voltou para a escala.')
      }
    } catch (error) {
      setCancelTarget(null)
      const message = isProfissionalEscalaApiError(error)
        ? error.message
        : 'Não foi possível cancelar este plantão.'
      showToast(message, 'error')
    }
  }, [cancelShift, cancelTarget, showToast])

  const handleTourStepActive = useCallback(
    (step: ProfissionalEscalaTourStep) => {
      if (step.id === 'welcome') {
        handleClear()
        closeClaimModal()
        return
      }

      if (step.id === 'claim-modal') {
        openDemoClaimModal()
        return
      }

      if (LIST_TOUR_STEP_IDS.has(step.id)) {
        closeClaimModal()
      }

      if (
        step.id === 'kpis' ||
        step.id === 'sidebar' ||
        step.id === 'how-it-works' ||
        step.id === 'reservations' ||
        step.id === 'status-bar' ||
        step.id === 'done'
      ) {
        closeClaimModal()
      }
    },
    [closeClaimModal, handleClear, openDemoClaimModal],
  )

  const handleTourBeforeAdvance = useCallback(
    (step: ProfissionalEscalaTourStep, source: 'next' | 'target-click') => {
      if (step.id === 'claim-btn') {
        openDemoClaimModal()
      }

      if (step.id === 'claim-modal' && source === 'next') {
        closeClaimModal()
      }

      if (step.id === 'kpis') {
        closeClaimModal()
      }
    },
    [closeClaimModal, openDemoClaimModal],
  )

  const tour = useProfissionalEscalaTour({
    forceStart: forceTourStart,
    onStepActive: handleTourStepActive,
    onBeforeAdvance: handleTourBeforeAdvance,
  })

  tourActiveRef.current = tour.active
  tourStepIdRef.current = tour.step.id

  const displayAvailableShifts = useMemo(
    () => resolveProfissionalEscalaTourShifts(availableShifts, tour.active),
    [availableShifts, tour.active],
  )

  const displayFilteredShifts = useMemo(
    () =>
      filterProfissionalEscalaShifts(displayAvailableShifts, appliedFilters, {
        onlyDisponivel: true,
      }),
    [appliedFilters, displayAvailableShifts],
  )

  useEffect(() => {
    if (tour.active) return
    closeClaimModal()
  }, [tour.active, closeClaimModal])

  const tourLockClaimModal = tour.active && profissionalEscalaClaimTourStepIds.has(tour.step.id)
  const tourHighlightCity = tour.active && tour.step.id === 'city-tooltip'
  const tourSuppressCityTooltip = tour.active && tour.step.id !== 'city-tooltip'

  const handleClaimRequest = useCallback((shift: ProfissionalEscalaDisponivel) => {
    setClaimTarget(shift)
  }, [])

  const handleClaimConfirm = useCallback(async () => {
    if (!claimTarget) return

    if (tourActiveRef.current && tourStepIdRef.current === 'claim-modal') {
      closeClaimModal()
      return
    }

    try {
      const ok = await claimShift(claimTarget.id)
      setClaimTarget(null)
      if (ok) {
        showToast('Plantão reservado com sucesso. Confira na sua Agenda.')
      }
    } catch (error) {
      setClaimTarget(null)
      const message = isProfissionalEscalaApiError(error)
        ? error.message
        : 'Não foi possível reservar este plantão. Tente outro.'
      showToast(message, 'error')
    }
  }, [claimShift, claimTarget, closeClaimModal, showToast])

  const showLoadingBlock = shouldShowPortalPageLoadingBlock(
    isLoading,
    availableShifts.length > 0 || reservedShifts.length > 0,
  )

  return (
    <>
      <div
        className={dashboardPageShellClass}
        aria-label={meta.title}
        aria-busy={showLoadingBlock}
      >
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

        {loadError ? (
          <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        <div className={dashboardPageFillScrollAreaClass}>
          {showLoadingBlock ? (
            <div
              className={[
                profissionalEscalaPageGridClass,
                dashboardPageScrollPaddingClass,
                'mt-4 flex-1 min-h-0 pb-5',
              ].join(' ')}
            >
              <ProfissionalEscalaPageSkeleton
                filtersSlotClass={profissionalEscalaFiltersSlotClass}
                shiftsSlotClass={profissionalEscalaShiftsSlotClass}
                kpiSlotClass={profissionalEscalaKpiSlotClass}
                sidebarPanelSlotClass={profissionalEscalaSidebarPanelSlotClass}
                mainColumnClass={profissionalEscalaMainColumnClass}
                sidebarColumnClass={profissionalEscalaSidebarColumnClass}
                pageGridClass="contents"
              />
            </div>
          ) : (
          <div
            className={[
              profissionalEscalaPageGridClass,
              dashboardPageScrollPaddingClass,
              'mt-4 flex-1 min-h-0 pb-5',
            ].join(' ')}
          >
            <div className={profissionalEscalaMainColumnClass}>
              <div className={profissionalEscalaFiltersSlotClass}>
                {filtersOpen ? (
                  <ProfissionalEscalaFiltersMegamenu
                    open={filtersOpen}
                    filters={draftFilters}
                    onChange={setDraftFilters}
                    onApply={() => {
                      handleSearch()
                      setFiltersOpen(false)
                    }}
                    onCancel={() => {
                      setDraftFilters(appliedFilters)
                      setFiltersOpen(false)
                    }}
                    onClear={handleClear}
                  />
                ) : null}
                <ProfissionalEscalaFiltersBar
                  filtersOpen={filtersOpen}
                  activeFilterCount={activeFilterCount}
                  onToggleFilters={() => setFiltersOpen((open) => !open)}
                  onSearch={handleSearch}
                />
              </div>

              <div className={profissionalEscalaShiftsSlotClass}>
                <ProfissionalEscalaShiftsList
                  shifts={displayFilteredShifts}
                  onClaim={handleClaimRequest}
                  tourHighlightCity={tourHighlightCity}
                  tourSuppressCityTooltip={tourSuppressCityTooltip}
                />
              </div>
            </div>

            <div className={profissionalEscalaSidebarColumnClass}>
              <div className={profissionalEscalaKpiSlotClass}>
                <ProfissionalEscalaKpiRow items={kpiCards} />
              </div>

              <div className={profissionalEscalaSidebarPanelSlotClass}>
                <ProfissionalEscalaSidebarPanel
                  profileSpecialty={profileSpecialty}
                  reservedShifts={reservedShifts}
                  userName={user?.nome ?? ''}
                  summary={summary}
                  onCancelRequest={handleCancelRequest}
                />
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      <ProfissionalEscalaClaimModal
        open={claimTarget !== null}
        shift={claimTarget}
        onConfirm={() => void handleClaimConfirm()}
        onCancel={closeClaimModal}
        tourLockClose={tourLockClaimModal}
        isSubmitting={isClaiming}
      />

      <ProfissionalEscalaCancelModal
        open={cancelTarget !== null}
        shift={cancelTarget}
        onConfirm={() => void handleCancelConfirm()}
        onCancel={closeCancelModal}
        isSubmitting={isCancelling}
      />

      <ProfissionalTourInviteModal
        open={tour.inviteOpen}
        {...profissionalTourInviteMeta.escala}
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

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
    </>
  )
}
