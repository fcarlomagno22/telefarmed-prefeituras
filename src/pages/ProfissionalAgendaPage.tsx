import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ProfissionalAgendaEmptyDay } from '../components/profissional/agenda/ProfissionalAgendaEmptyDay'
import { ProfissionalAgendaMonthCalendar } from '../components/profissional/agenda/ProfissionalAgendaMonthCalendar'
import { ProfissionalAgendaSidebar } from '../components/profissional/agenda/ProfissionalAgendaSidebar'
import { ProfissionalAgendaTabs } from '../components/profissional/agenda/ProfissionalAgendaTabs'
import { ProfissionalQueuePanel } from '../components/profissional/agenda/ProfissionalQueuePanel'
import { ProfissionalShiftCard } from '../components/profissional/agenda/ProfissionalShiftCard'
import { ProfissionalOnboardingTour } from '../components/profissional/onboarding/ProfissionalOnboardingTour'
import { ProfissionalTourInviteModal } from '../components/profissional/onboarding/ProfissionalTourInviteModal'
import {
  PROFISSIONAL_AGENDA_TOUR_DEMO_SHIFT_ID,
} from '../config/profissionalAgendaTour'
import { profissionalTourInviteMeta } from '../config/profissionalTourInvite'
import {
  buildProfissionalAgendaTourDemoShifts,
  isProfissionalAgendaTourDemoShiftId,
} from '../data/profissionalAgendaTourMock'
import {
  ensureProfissionalQueueSeeded,
  enterProfissionalShift,
  getProfissionalQueue,
  readActiveShiftSession,
  writeActiveShiftSession,
} from '../data/profissionalQueueStore'
import { ProfissionalPageHeader } from '../components/profissional/ProfissionalPageHeader'
import {
  dashboardPageFillScrollAreaClass,
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
  profissionalAgendaBodyClass,
} from '../components/layout/dashboardPageLayout'
import {
  profissionalAgendaColumnsGridClass,
  profissionalAgendaMainColumnFillClass,
  profissionalAgendaMainColumnScrollClass,
  profissionalAgendaSidebarColumnFillClass,
  profissionalAgendaSidebarColumnScrollClass,
} from '../components/profissional/agenda/profissionalAgendaPageLayout'
import { findProfissionalNavByPathname } from '../config/profissionalSidebarNav'
import {
  useProfissionalAgendaState,
  type ProfissionalAgendaTab,
} from '../hooks/useProfissionalAgendaState'
import { useProfissionalAgendaTour } from '../hooks/useProfissionalAgendaTour'
import { parseDateKey, toDateKey } from '../utils/agendaDate'
import { shouldShowPortalPageLoadingBlock } from '../utils/portal/portalPageLoading'
import { ProfissionalAgendaPageSkeleton } from '../components/profissional/skeletons/ProfissionalAgendaPageSkeleton'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import { unlockProfissionalWaitingRoomAlertAudio } from '../utils/profissional/profissionalWaitingRoomAlertAudio'
import { isSameCalendarMonth } from '../utils/calendar'
import {
  mergeProfissionalAgendaTourDemoShifts,
  mergeProfissionalAgendaTourShiftCountByDate,
} from '../utils/profissional/mergeProfissionalAgendaTourDemo'

const fallbackMeta = {
  title: 'Agenda',
  description:
    'Plantões designados, fila de pacientes e início dos atendimentos por teleconsulta.',
}

export function ProfissionalAgendaPage() {
  const { pathname, state: locationState } = useLocation()
  const [searchParams] = useSearchParams()
  const meta = findProfissionalNavByPathname(pathname) ?? fallbackMeta
  const forceTourStart = searchParams.get('tour') === 'agenda'

  const {
    selectedDateKey,
    setSelectedDateKey,
    agendaTab,
    setAgendaTab,
    selectedShifts,
    shifts,
    activeShift,
    activeSession,
    notices,
    shiftCountByDate,
    monthSummaryLabel,
    calendarViewMonth,
    setCalendarViewMonth,
    goToPreviousCalendarMonth,
    goToNextCalendarMonth,
    goToTodayInCalendar,
    selectedDateLabel,
    handleEnterShift,
    refresh,
    reload,
    isLoading,
    loadError,
  } = useProfissionalAgendaState()

  const { user: profissionalUser } = useProfissionalAuth()

  const handleDisplayEnterShiftRef = useRef<(shiftId: string) => void>(() => {})

  const handleTourBeforeAdvance = useCallback(
    (step: { id: string }, source: 'next' | 'target-click') => {
      if (step.id !== 'enter-shift' || source !== 'next') return
      handleDisplayEnterShiftRef.current(PROFISSIONAL_AGENDA_TOUR_DEMO_SHIFT_ID)
    },
    [],
  )

  const tour = useProfissionalAgendaTour({
    agendaTab,
    setAgendaTab,
    forceStart: forceTourStart,
    onBeforeAdvance: handleTourBeforeAdvance,
  })

  const displayShifts = useMemo(
    () => mergeProfissionalAgendaTourDemoShifts(shifts, tour.active),
    [shifts, tour.active],
  )

  const displayShiftCountByDate = useMemo(
    () => mergeProfissionalAgendaTourShiftCountByDate(shiftCountByDate, displayShifts, tour.active),
    [displayShifts, shiftCountByDate, tour.active],
  )

  const displaySelectedShifts = useMemo(
    () => displayShifts.filter((shift) => shift.dateKey === selectedDateKey),
    [displayShifts, selectedDateKey],
  )

  const displayTodayShifts = useMemo(() => {
    const todayKey = toDateKey(new Date())
    return displayShifts.filter((shift) => shift.dateKey === todayKey)
  }, [displayShifts])

  const displayUpcomingShifts = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    return displayShifts
      .filter((shift) => parseDateKey(shift.dateKey) >= startOfToday)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 6)
  }, [displayShifts])

  const displayMonthShifts = useMemo(
    () =>
      displayShifts.filter((shift) =>
        isSameCalendarMonth(parseDateKey(shift.dateKey), calendarViewMonth),
      ),
    [calendarViewMonth, displayShifts],
  )

  const displayMonthShiftCount = displayMonthShifts.length
  const displayMonthTitularCount = displayMonthShifts.filter((shift) => shift.role === 'titular').length
  const displayMonthReservaCount = displayMonthShifts.filter((shift) => shift.role === 'reserva').length

  const displayMonthWeekDistribution = useMemo(() => {
    const weeks = [0, 0, 0, 0, 0, 0]
    for (const shift of displayMonthShifts) {
      const day = parseDateKey(shift.dateKey).getDate()
      const weekIndex = Math.min(5, Math.floor((day - 1) / 7))
      weeks[weekIndex] += 1
    }
    return weeks
  }, [displayMonthShifts])

  const handleDisplayEnterShift = useCallback(
    (shiftId: string) => {
      unlockProfissionalWaitingRoomAlertAudio(profissionalUser?.sexo ?? 'nao_informado')
      const shift = displayShifts.find((item) => item.id === shiftId)
      if (shift) {
        ensureProfissionalQueueSeeded(shift)
      }
      if (shift && isProfissionalAgendaTourDemoShiftId(shiftId)) {
        enterProfissionalShift(shiftId)
        setSelectedDateKey(shift.dateKey)
        setAgendaTab('fila')
        refresh()
        return
      }
      handleEnterShift(shiftId)
    },
    [displayShifts, handleEnterShift, profissionalUser?.sexo, refresh, setAgendaTab, setSelectedDateKey],
  )

  handleDisplayEnterShiftRef.current = handleDisplayEnterShift

  const tourEnterShiftId = useMemo(() => {
    if (tour.active) return PROFISSIONAL_AGENDA_TOUR_DEMO_SHIFT_ID
    return selectedShifts.find(
      (shift) =>
        shift.lifecycle === 'aguardando_inicio' || shift.lifecycle === 'em_andamento',
    )?.id
  }, [selectedShifts, tour.active])

  useEffect(() => {
    const tab = (locationState as { agendaTab?: ProfissionalAgendaTab } | null)?.agendaTab
    if (tab === 'fila') {
      setAgendaTab('fila')
    }
  }, [locationState, setAgendaTab])

  function handleShiftEnded() {
    setAgendaTab('dia')
    refresh()
  }

  const selectedDayHeading = useMemo(() => {
    if (selectedDateKey === toDateKey(new Date())) return 'Hoje'
    return selectedDateLabel
  }, [selectedDateKey, selectedDateLabel])

  const showLoadingBlock = shouldShowPortalPageLoadingBlock(isLoading, shifts.length > 0)

  const displayActiveShift = useMemo(() => {
    if (!activeSession?.endedAt && activeSession?.shiftId) {
      return displayShifts.find((shift) => shift.id === activeSession.shiftId)
    }
    return activeShift
      ? displayShifts.find((shift) => shift.id === activeShift.id) ?? activeShift
      : undefined
  }, [activeSession, activeShift, displayShifts])

  const displayFilaShift = useMemo(() => {
    if (displayActiveShift) return displayActiveShift
    const inProgress = displayTodayShifts.find((shift) => shift.lifecycle === 'em_andamento')
    if (inProgress) return inProgress
    return displayTodayShifts[0]
  }, [displayActiveShift, displayTodayShifts])

  const displayQueueWaitingCount = useMemo(() => {
    if (!displayFilaShift) return 0
    const includeDemo =
      tour.active && isProfissionalAgendaTourDemoShiftId(displayFilaShift.id)
    const queue = getProfissionalQueue(displayFilaShift.id, { includeDemo })
    if (queue.length > 0) {
      return queue.filter(
        (patient) =>
          patient.status === 'aguardando' ||
          patient.status === 'chamado' ||
          patient.status === 'em_atendimento',
      ).length
    }
    return displayFilaShift.stats.naFila
  }, [displayFilaShift, tour.active])

  const displayShiftSessionActive = Boolean(
    displayActiveShift && activeSession && !activeSession.endedAt,
  )

  const displayFilaSessionEnteredAt =
    displayShiftSessionActive && activeSession && displayFilaShift?.id === activeSession.shiftId
      ? activeSession.enteredAt
      : (displayFilaShift?.startAt ?? new Date().toISOString())

  useEffect(() => {
    if (!tour.active) return
    goToTodayInCalendar()
    for (const demoShift of buildProfissionalAgendaTourDemoShifts()) {
      ensureProfissionalQueueSeeded(demoShift)
    }
  }, [goToTodayInCalendar, tour.active])

  useEffect(() => {
    if (!tour.active) return
    const filaTourSteps = new Set([
      'tab-fila',
      'queue-panel',
      'queue-search',
      'queue-list-tabs',
      'queue-consult-btn',
    ])
    if (!filaTourSteps.has(tour.step.id)) return
    const demoShift = displayFilaShift
    if (!demoShift || !isProfissionalAgendaTourDemoShiftId(demoShift.id)) return
    ensureProfissionalQueueSeeded(demoShift)
    if (
      !activeSession ||
      activeSession.shiftId !== demoShift.id ||
      activeSession.endedAt
    ) {
      enterProfissionalShift(demoShift.id)
      refresh()
    }
  }, [activeSession, displayFilaShift, refresh, tour.active, tour.step.id])

  useEffect(() => {
    if (tour.active) return
    const session = readActiveShiftSession()
    if (session?.shiftId && isProfissionalAgendaTourDemoShiftId(session.shiftId)) {
      writeActiveShiftSession(null)
      refresh()
    }
  }, [refresh, tour.active])

  return (
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
          className={[dashboardPageScrollPaddingClass, profissionalAgendaBodyClass].join(' ')}
        >
          {loadError ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {loadError}
              <button
                type="button"
                onClick={() => void reload()}
                className="ml-3 font-semibold underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : null}

          <ProfissionalAgendaTabs
            activeTab={agendaTab}
            onTabChange={setAgendaTab}
            queueWaitingCount={displayQueueWaitingCount}
            shiftSessionActive={displayShiftSessionActive}
          />

          {showLoadingBlock ? (
            <ProfissionalAgendaPageSkeleton />
          ) : agendaTab === 'fila' ? (
            displayFilaShift ? (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <ProfissionalQueuePanel
                  shift={displayFilaShift}
                  sessionEnteredAt={displayFilaSessionEnteredAt}
                  shiftSessionActive={displayShiftSessionActive}
                  onEnterShift={() => handleDisplayEnterShift(displayFilaShift.id)}
                  onShiftEnded={handleShiftEnded}
                  tourUseLocalQueue={
                    tour.active && isProfissionalAgendaTourDemoShiftId(displayFilaShift.id)
                  }
                />
              </div>
            ) : (
              <div
                className={[
                  'flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200',
                  'bg-white/80 px-6 py-16 text-center',
                ].join(' ')}
              >
                <p className="text-sm font-semibold text-gray-900">Nenhum plantão hoje</p>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  A fila de atendimento aparece nos dias em que você tem plantão designado.
                </p>
                <button
                  type="button"
                  onClick={() => setAgendaTab('dia')}
                  className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Ver calendário
                </button>
              </div>
            )
          ) : (
            <div className={[profissionalAgendaColumnsGridClass, 'min-h-0 flex-1'].join(' ')}>
              <div className={profissionalAgendaMainColumnScrollClass}>
                <div className={profissionalAgendaMainColumnFillClass}>
                  <ProfissionalAgendaMonthCalendar
                    viewMonth={calendarViewMonth}
                    selectedDateKey={selectedDateKey}
                    shiftCountByDate={displayShiftCountByDate}
                    onSelectDate={(dateKey) => {
                      setSelectedDateKey(dateKey)
                      setAgendaTab('dia')
                    }}
                    onPreviousMonth={goToPreviousCalendarMonth}
                    onNextMonth={goToNextCalendarMonth}
                    onGoToToday={goToTodayInCalendar}
                  />

                  <section
                    className="flex min-h-0 flex-1 flex-col max-xl:min-h-[12rem] xl:h-full xl:min-h-0"
                    data-tour="agenda-day-shifts"
                  >
                    <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-2 pb-3">
                      <h2 className="text-sm font-bold text-gray-900">{selectedDayHeading}</h2>
                      {displaySelectedShifts.length > 0 ? (
                        <p className="text-xs font-medium text-gray-500">
                          {displaySelectedShifts.length === 1
                            ? '1 plantão neste dia'
                            : `${displaySelectedShifts.length} plantões neste dia`}
                        </p>
                      ) : null}
                    </div>
                    <div
                      className={[
                        'min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain pr-0.5',
                        '[-ms-overflow-style:none] [scrollbar-width:thin]',
                        '[&::-webkit-scrollbar]:w-1.5',
                        '[&::-webkit-scrollbar-thumb]:rounded-full',
                        '[&::-webkit-scrollbar-thumb]:bg-gray-300',
                        '[&::-webkit-scrollbar-track]:bg-transparent',
                      ].join(' ')}
                    >
                      {displaySelectedShifts.length === 0 ? (
                        <ProfissionalAgendaEmptyDay dateLabel={selectedDateLabel} />
                      ) : (
                        displaySelectedShifts.map((shift) => (
                          <ProfissionalShiftCard
                            key={shift.id}
                            shift={shift}
                            highlight={shift.lifecycle === 'em_andamento'}
                            tourHighlightEnterShift={shift.id === tourEnterShiftId}
                            onEnterShift={handleDisplayEnterShift}
                          />
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </div>

              <div className={profissionalAgendaSidebarColumnScrollClass}>
                <div className={profissionalAgendaSidebarColumnFillClass}>
                  <ProfissionalAgendaSidebar
                    notices={notices}
                    upcomingShifts={displayUpcomingShifts}
                    monthSummaryLabel={monthSummaryLabel}
                    monthShiftCount={displayMonthShiftCount}
                    monthTitularCount={displayMonthTitularCount}
                    monthReservaCount={displayMonthReservaCount}
                    monthWeekDistribution={displayMonthWeekDistribution}
                    selectedDateKey={selectedDateKey}
                    onSelectDate={(dateKey) => {
                      setSelectedDateKey(dateKey)
                      const date = parseDateKey(dateKey)
                      setCalendarViewMonth(
                        new Date(date.getFullYear(), date.getMonth(), 1),
                      )
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProfissionalTourInviteModal
        open={tour.inviteOpen}
        {...profissionalTourInviteMeta.agenda}
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
    </div>
  )
}
