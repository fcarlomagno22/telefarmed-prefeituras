import { useMemo, useState } from 'react'
import type { AgendaHistoryDay } from '../data/agendaMock'
import {
  addDays,
  formatAgendaDayLabel,
  isSameDay,
  parseDateKey,
  toDateInputValue,
} from '../utils/agendaDate'

type UseAgendaDateNavigationOptions = {
  history?: AgendaHistoryDay[]
}

export function useAgendaDateNavigation(options: UseAgendaDateNavigationOptions = {}) {
  const referenceToday = useMemo(() => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    return today
  }, [])

  const [selectedDate, setSelectedDate] = useState(() => new Date(referenceToday))

  const dayLabel = useMemo(() => formatAgendaDayLabel(selectedDate), [selectedDate])

  const history = options.history ?? []

  const isToday = isSameDay(selectedDate, referenceToday)

  function goToToday() {
    setSelectedDate(new Date(referenceToday))
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
    dayLabel,
    history,
    isToday,
    referenceToday,
    goToToday,
    goToPreviousDay,
    goToNextDay,
    goToDate,
    goToDateKey,
    dateInputValue: toDateInputValue(selectedDate),
  }
}
