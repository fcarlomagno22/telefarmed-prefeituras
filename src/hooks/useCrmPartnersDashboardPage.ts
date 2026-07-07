import { useMemo, useState } from 'react'
import {
  buildCrmPartnersDashboardMock,
  getCurrentCrmPartnersMonthKey,
  isCrmPartnersMonthRangeValid,
  type CrmPartnersMonthKey,
  type CrmPartnersMonthRange,
} from '../data/crmPartnersDashboardMock'

function normalizeRange(startMonth: CrmPartnersMonthKey, endMonth: CrmPartnersMonthKey): CrmPartnersMonthRange {
  if (!isCrmPartnersMonthRangeValid({ startMonth, endMonth })) {
    return { startMonth: endMonth, endMonth: startMonth }
  }
  return { startMonth, endMonth }
}

export function useCrmPartnersDashboardPage() {
  const currentMonth = getCurrentCrmPartnersMonthKey()
  const [startMonth, setStartMonth] = useState<CrmPartnersMonthKey>(currentMonth)
  const [endMonth, setEndMonth] = useState<CrmPartnersMonthKey>(currentMonth)

  const range = useMemo(
    () => normalizeRange(startMonth, endMonth),
    [startMonth, endMonth],
  )

  const dashboard = useMemo(() => buildCrmPartnersDashboardMock(range), [range])

  function setStartMonthSafe(value: CrmPartnersMonthKey) {
    setStartMonth(value)
    if (!isCrmPartnersMonthRangeValid({ startMonth: value, endMonth })) {
      setEndMonth(value)
    }
  }

  function setEndMonthSafe(value: CrmPartnersMonthKey) {
    setEndMonth(value)
    if (!isCrmPartnersMonthRangeValid({ startMonth, endMonth: value })) {
      setStartMonth(value)
    }
  }

  function resetRange() {
    setStartMonth(currentMonth)
    setEndMonth(currentMonth)
  }

  return {
    startMonth: range.startMonth,
    endMonth: range.endMonth,
    setStartMonth: setStartMonthSafe,
    setEndMonth: setEndMonthSafe,
    resetRange,
    dashboard,
  }
}
