import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ProfissionalEscalaClaimModal } from '../components/profissional/escala/ProfissionalEscalaClaimModal'
import { ProfissionalEscalaFiltersBar } from '../components/profissional/escala/ProfissionalEscalaFiltersBar'
import { ProfissionalEscalaKpiRow } from '../components/profissional/escala/ProfissionalEscalaKpiRow'
import { ProfissionalEscalaShiftsList } from '../components/profissional/escala/ProfissionalEscalaShiftsList'
import { ProfissionalEscalaSidebarPanel } from '../components/profissional/escala/ProfissionalEscalaSidebarPanel'
import { ProfissionalEscalaStatusBar } from '../components/profissional/escala/ProfissionalEscalaStatusBar'
import {
  profissionalEscalaFiltersSlotClass,
  profissionalEscalaKpiSlotClass,
  profissionalEscalaMainColumnClass,
  profissionalEscalaPageGridClass,
  profissionalEscalaShiftsSlotClass,
  profissionalEscalaSidebarColumnClass,
  profissionalEscalaSidebarPanelSlotClass,
  profissionalEscalaStatusSlotClass,
} from '../components/profissional/escala/profissionalEscalaPageLayout'
import { ProfissionalOnboardingTour } from '../components/profissional/onboarding/ProfissionalOnboardingTour'
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
  profissionalEscalaTourFirstVisitBody,
  PROFISSIONAL_ESCALA_TOUR_DEMO_SHIFT_ID,
  type ProfissionalEscalaTourStep,
} from '../config/profissionalEscalaTour'
import { findProfissionalNavByPathname } from '../config/profissionalSidebarNav'
import {
  getProfissionalEscalaDisponivelInitial,
  profissionalEscalaLoggedSpecialty,
  profissionalEscalaMonthlyStats,
} from '../data/profissionalEscalaDisponivelMock'
import { claimEscalaShift, subscribeEscalaShifts, getEscalaShifts } from '../data/escalaSharedStore'
import type { ProfissionalEscalaDisponivel } from '../types/profissionalEscalaDisponivel'
import { profissionalLoggedProfile } from '../data/profissionalPerfilMock'
import { adminShiftToProfissionalDisponivel } from '../utils/escala/adminEscalaToProfissional'
import type { ProfissionalEscalaFilters } from '../types/profissionalEscalaDisponivel'
import {
  averageShiftAmountCents,
  countClaimedThisMonth,
  countShiftsThisWeek,
  countShiftsToday,
  defaultProfissionalEscalaFilters,
  filterProfissionalEscalaShifts,
} from '../utils/profissional/filterProfissionalEscalaDisponivel'
import { formatProfissionalCurrency } from '../utils/profissional/formatProfissionalCurrency'
import { buildProfissionalEscalaKpiCards } from '../utils/profissional/profissionalEscalaKpiCards'
import { useProfissionalEscalaTour } from '../hooks/useProfissionalEscalaTour'

const fallbackMeta = {
  title: 'Plantões disponíveis',
  description:
    'Plantões abertos compatíveis com a sua especialidade. Filtre, compare valores e reserve o turno.',
}

const LIST_TOUR_STEP_IDS = new Set(['welcome', 'filters', 'shifts-list', 'city-tooltip', 'claim-btn'])

function findTourDemoShift(shifts: ProfissionalEscalaDisponivel[]) {
  return shifts.find(
    (shift) => shift.id === PROFISSIONAL_ESCALA_TOUR_DEMO_SHIFT_ID && shift.status === 'disponivel',
  )
}

export function ProfissionalEscalaPage() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const meta = findProfissionalNavByPathname(pathname) ?? fallbackMeta
  const forceTourStart = searchParams.get('tour') === 'escala'
  const tourActiveRef = useRef(false)
  const tourStepIdRef = useRef<string>('')

  const [shifts, setShifts] = useState<ProfissionalEscalaDisponivel[]>(() =>
    getProfissionalEscalaDisponivelInitial(),
  )

  useEffect(() => {
    const unsubscribe = subscribeEscalaShifts(() => {
      setShifts(getProfissionalEscalaDisponivelInitial())
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const [draftFilters, setDraftFilters] = useState<ProfissionalEscalaFilters>(() =>
    defaultProfissionalEscalaFilters(profissionalEscalaLoggedSpecialty),
  )
  const [appliedFilters, setAppliedFilters] = useState<ProfissionalEscalaFilters>(() =>
    defaultProfissionalEscalaFilters(profissionalEscalaLoggedSpecialty),
  )
  const [claimTarget, setClaimTarget] = useState<ProfissionalEscalaDisponivel | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const filteredShifts = useMemo(
    () =>
      filterProfissionalEscalaShifts(shifts, appliedFilters, {
        onlyDisponivel: true,
      }),
    [shifts, appliedFilters],
  )

  const reservedShifts = useMemo(() => {
    return getEscalaShifts()
      .map((adminShift) =>
        adminShiftToProfissionalDisponivel(adminShift, {
          forDoctorId: profissionalLoggedProfile.id,
        }),
      )
      .filter(
        (shift): shift is ProfissionalEscalaDisponivel =>
          shift !== null && shift.status === 'reservado_mim',
      )
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }, [shifts])

  const kpiCards = useMemo(() => {
    const openAll = shifts.filter((s) => s.status === 'disponivel')
    const avg = averageShiftAmountCents(openAll)
    const claimedMonth =
      countClaimedThisMonth(shifts) + profissionalEscalaMonthlyStats.claimedCount

    return buildProfissionalEscalaKpiCards({
      todayCount: countShiftsToday(openAll, profissionalEscalaLoggedSpecialty),
      weekCount: countShiftsThisWeek(openAll, profissionalEscalaLoggedSpecialty),
      avgAmountFormatted: formatProfissionalCurrency(avg),
      claimedMonth,
      specialty: profissionalEscalaLoggedSpecialty,
    })
  }, [shifts])

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters(draftFilters)
  }, [draftFilters])

  const handleClear = useCallback(() => {
    const defaults = defaultProfissionalEscalaFilters(profissionalEscalaLoggedSpecialty)
    setDraftFilters(defaults)
    setAppliedFilters(defaults)
  }, [])

  const openDemoClaimModal = useCallback(() => {
    const demoShift = findTourDemoShift(shifts)
    if (demoShift) setClaimTarget(demoShift)
  }, [shifts])

  const closeClaimModal = useCallback(() => {
    setClaimTarget(null)
  }, [])

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
        step.id === 'quick-links' ||
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

  const handleClaimConfirm = useCallback(() => {
    if (!claimTarget) return

    if (tourActiveRef.current && tourStepIdRef.current === 'claim-modal') {
      closeClaimModal()
      return
    }

    const ok = claimEscalaShift(claimTarget.id)
    setClaimTarget(null)
    if (ok) {
      showToast('Plantão reservado com sucesso. Confira na sua Agenda.')
    } else {
      showToast('Não foi possível reservar este plantão. Tente outro.', 'error')
    }
  }, [claimTarget, closeClaimModal, showToast])

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
              profissionalEscalaPageGridClass,
              dashboardPageScrollPaddingClass,
              'mt-4 flex-1 min-h-0 pb-5',
            ].join(' ')}
          >
            <div className={profissionalEscalaMainColumnClass}>
              <div className={profissionalEscalaFiltersSlotClass}>
                <ProfissionalEscalaFiltersBar
                  draft={draftFilters}
                  onDraftChange={setDraftFilters}
                  onSearch={handleSearch}
                  onClear={handleClear}
                />
              </div>

              <div className={profissionalEscalaShiftsSlotClass}>
                <ProfissionalEscalaShiftsList
                  shifts={filteredShifts}
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
                  profileSpecialty={profissionalEscalaLoggedSpecialty}
                  reservedShifts={reservedShifts}
                />
              </div>
            </div>

            <div className={profissionalEscalaStatusSlotClass}>
              <ProfissionalEscalaStatusBar />
            </div>
          </div>
        </div>
      </div>

      <ProfissionalEscalaClaimModal
        open={claimTarget !== null}
        shift={claimTarget}
        onConfirm={handleClaimConfirm}
        onCancel={closeClaimModal}
        tourLockClose={tourLockClaimModal}
      />

      <ProfissionalOnboardingTour
        open={tour.active}
        title={tour.step.title}
        body={
          tour.isMandatorySession && tour.step.id === 'welcome'
            ? profissionalEscalaTourFirstVisitBody
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

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
    </>
  )
}
