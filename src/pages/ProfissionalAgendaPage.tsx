import { useCallback, useEffect, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ProfissionalAgendaEmptyDay } from '../components/profissional/agenda/ProfissionalAgendaEmptyDay'
import { ProfissionalAgendaMonthCalendar } from '../components/profissional/agenda/ProfissionalAgendaMonthCalendar'
import { ProfissionalAgendaSidebar } from '../components/profissional/agenda/ProfissionalAgendaSidebar'
import { ProfissionalAgendaTabs } from '../components/profissional/agenda/ProfissionalAgendaTabs'
import { ProfissionalQueuePanel } from '../components/profissional/agenda/ProfissionalQueuePanel'
import { ProfissionalShiftCard } from '../components/profissional/agenda/ProfissionalShiftCard'
import { ProfissionalOnboardingTour } from '../components/profissional/onboarding/ProfissionalOnboardingTour'
import { profissionalAgendaTourFirstVisitBody } from '../config/profissionalAgendaTour'
import { ProfissionalPageHeader } from '../components/profissional/ProfissionalPageHeader'
import {
  dashboardPageFillScrollAreaClass,
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
  profissionalAgendaBodyClass,
} from '../components/layout/dashboardPageLayout'
import {
  profissionalAgendaColumnScrollClass,
  profissionalAgendaColumnsGridClass,
  profissionalAgendaMainColumnFillClass,
  profissionalAgendaSidebarColumnFillClass,
} from '../components/profissional/agenda/profissionalAgendaPageLayout'
import { findProfissionalNavByPathname } from '../config/profissionalSidebarNav'
import {
  useProfissionalAgendaState,
  type ProfissionalAgendaTab,
} from '../hooks/useProfissionalAgendaState'
import { useProfissionalAgendaTour } from '../hooks/useProfissionalAgendaTour'
import { parseDateKey, toDateKey } from '../utils/agendaDate'

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
    activeShift,
    activeSession,
    notices,
    shiftCountByDate,
    monthShiftCount,
    monthTitularCount,
    monthReservaCount,
    monthWeekDistribution,
    monthSummaryLabel,
    calendarViewMonth,
    setCalendarViewMonth,
    goToPreviousCalendarMonth,
    goToNextCalendarMonth,
    goToTodayInCalendar,
    upcomingShifts,
    selectedDateLabel,
    todayShifts,
    handleEnterShift,
    refresh,
  } = useProfissionalAgendaState()

  const shiftSessionActive = Boolean(
    activeShift && activeSession && !activeSession.endedAt,
  )

  const filaShift = useMemo(() => {
    if (activeShift) return activeShift
    const inProgress = todayShifts.find((shift) => shift.lifecycle === 'em_andamento')
    if (inProgress) return inProgress
    return todayShifts[0]
  }, [activeShift, todayShifts])

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

  const queueWaitingCount = filaShift?.stats.naFila ?? 0

  const filaSessionEnteredAt =
    shiftSessionActive && activeSession && filaShift?.id === activeSession.shiftId
      ? activeSession.enteredAt
      : (filaShift?.startAt ?? new Date().toISOString())

  const tourEnterShiftId = useMemo(
    () =>
      selectedShifts.find(
        (shift) =>
          shift.lifecycle === 'aguardando_inicio' || shift.lifecycle === 'em_andamento',
      )?.id,
    [selectedShifts],
  )

  const handleTourBeforeAdvance = useCallback(
    (step: { id: string }, source: 'next' | 'target-click') => {
      if (step.id !== 'enter-shift' || source !== 'next') return
      if (tourEnterShiftId) {
        handleEnterShift(tourEnterShiftId)
        return
      }
      setAgendaTab('fila')
    },
    [handleEnterShift, setAgendaTab, tourEnterShiftId],
  )

  const tour = useProfissionalAgendaTour({
    agendaTab,
    setAgendaTab,
    forceStart: forceTourStart,
    onBeforeAdvance: handleTourBeforeAdvance,
  })

  return (
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
          className={[dashboardPageScrollPaddingClass, profissionalAgendaBodyClass].join(' ')}
        >
          <ProfissionalAgendaTabs
            activeTab={agendaTab}
            onTabChange={setAgendaTab}
            queueWaitingCount={queueWaitingCount}
            shiftSessionActive={shiftSessionActive}
          />

          {agendaTab === 'fila' ? (
            filaShift ? (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <ProfissionalQueuePanel
                  shift={filaShift}
                  sessionEnteredAt={filaSessionEnteredAt}
                  shiftSessionActive={shiftSessionActive}
                  onEnterShift={() => handleEnterShift(filaShift.id)}
                  onShiftEnded={handleShiftEnded}
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
            <div className={profissionalAgendaColumnsGridClass}>
              <div className={profissionalAgendaColumnScrollClass}>
                <div className={profissionalAgendaMainColumnFillClass}>
                  <ProfissionalAgendaMonthCalendar
                    viewMonth={calendarViewMonth}
                    selectedDateKey={selectedDateKey}
                    shiftCountByDate={shiftCountByDate}
                    onSelectDate={(dateKey) => {
                      setSelectedDateKey(dateKey)
                      setAgendaTab('dia')
                    }}
                    onPreviousMonth={goToPreviousCalendarMonth}
                    onNextMonth={goToNextCalendarMonth}
                    onGoToToday={goToTodayInCalendar}
                  />

                  <section className="space-y-3" data-tour="agenda-day-shifts">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="text-sm font-bold text-gray-900">{selectedDayHeading}</h2>
                      {selectedShifts.length > 0 ? (
                        <p className="text-xs font-medium text-gray-500">
                          {selectedShifts.length === 1
                            ? '1 plantão neste dia'
                            : `${selectedShifts.length} plantões neste dia`}
                        </p>
                      ) : null}
                    </div>
                    {selectedShifts.length === 0 ? (
                      <ProfissionalAgendaEmptyDay dateLabel={selectedDateLabel} />
                    ) : (
                      selectedShifts.map((shift) => (
                        <ProfissionalShiftCard
                          key={shift.id}
                          shift={shift}
                          highlight={shift.lifecycle === 'em_andamento'}
                          tourHighlightEnterShift={shift.id === tourEnterShiftId}
                          onEnterShift={handleEnterShift}
                        />
                      ))
                    )}
                  </section>
                </div>
              </div>

              <div className={profissionalAgendaColumnScrollClass}>
                <div className={profissionalAgendaSidebarColumnFillClass}>
                  <ProfissionalAgendaSidebar
                    notices={notices}
                    upcomingShifts={upcomingShifts}
                    monthSummaryLabel={monthSummaryLabel}
                    monthShiftCount={monthShiftCount}
                    monthTitularCount={monthTitularCount}
                    monthReservaCount={monthReservaCount}
                    monthWeekDistribution={monthWeekDistribution}
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

      <ProfissionalOnboardingTour
        open={tour.active}
        title={tour.step.title}
        body={
          tour.isMandatorySession && tour.step.id === 'welcome'
            ? profissionalAgendaTourFirstVisitBody
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
    </div>
  )
}
