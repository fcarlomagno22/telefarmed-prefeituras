import { useMemo, useState } from 'react'
import {
  agendaToday,
  getAgendaDayData,
  getAgendaHistoryBefore,
  type AgendaDayData,
} from '../data/agendaMock'
import {
  addDays,
  formatAgendaDayLabel,
  isSameDay,
  parseDateKey,
  toDateInputValue,
} from '../utils/agendaDate'

export function useAgendaDateNavigation() {
  const [selectedDate, setSelectedDate] = useState(() => new Date(agendaToday))

  const dayData: AgendaDayData = useMemo(
    () => getAgendaDayData(selectedDate),
    [selectedDate],
  )

  const dayLabel = useMemo(() => formatAgendaDayLabel(selectedDate), [selectedDate])

  const history = useMemo(() => getAgendaHistoryBefore(selectedDate), [selectedDate])

  const isToday = isSameDay(selectedDate, agendaToday)

  function goToToday() {
    setSelectedDate(new Date(agendaToday))
  }

  function goToPreviousDay() {
    setSelectedDate((current) => addDays(current, -1))
  }

  function goToNextDay() {
    setSelectedDate((current) => addDays(current, 1))
  }

  function goToDate(date: Date) {
    setSelectedDate(date)
  }

  function goToDateKey(key: string) {
    if (!key) return
    setSelectedDate(parseDateKey(key))
  }

  return {
    selectedDate,
    dayData,
    dayLabel,
    history,
    isToday,
    goToToday,
    goToPreviousDay,
    goToNextDay,
    goToDate,
    goToDateKey,
    dateInputValue: toDateInputValue(selectedDate),
  }
}
