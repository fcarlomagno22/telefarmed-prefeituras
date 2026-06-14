import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Percent,
  UserX,
} from 'lucide-react'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import type { PrefeituraAgendasFuturePeriodId } from '../data/prefeituraAgendasMock'
import { getDefaultAgendasWeek } from '../data/prefeituraAgendasScheduleMock'
import {
  fetchPrefeituraAgendaCatalog,
  fetchPrefeituraAgendaDay,
  fetchPrefeituraAgendaFuture,
  fetchPrefeituraAgendaWeek,
  isPrefeituraAgendasApiError,
  type PrefeituraAgendaCatalogApi,
  type PrefeituraAgendaDayApi,
  type PrefeituraAgendaFutureApi,
  type PrefeituraAgendaUnitApi,
  type PrefeituraAgendaWeekApi,
} from '../lib/services/prefeitura/agendas'
import type { PrefeituraAgendasHeatmapSelection } from '../components/prefeitura/agendas/PrefeituraAgendasHeatmap'
import { fetchPrefeituraUtilizacaoCiclo } from '../lib/services/prefeitura/contrato'
import type { PrefeituraPackageUsageView } from '../utils/prefeituraConsultationPackage'
import { addDays } from '../utils/agendaDate'
import { parseIsoDate, toIsoDate } from '../utils/calendar'
import { formatAgendasNumber } from '../components/prefeitura/agendas/prefeituraAgendasUi'

const defaultWeek = getDefaultAgendasWeek(new Date())
const todayKey = toIsoDate(new Date())

function formatWeeklySummaryValue(value: number, suffix: 'number' | 'percent') {
  if (suffix === 'percent') return `${value}%`
  return formatAgendasNumber(value)
}

export function usePrefeituraAgendasPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = usePrefeituraAuth()

  const [catalog, setCatalog] = useState<PrefeituraAgendaCatalogApi | null>(null)
  const [weekStart, setWeekStart] = useState(defaultWeek.start)
  const [weekEnd, setWeekEnd] = useState(defaultWeek.end)
  const [dayKeys, setDayKeys] = useState<string[]>(defaultWeek.dayKeys)
  const [unitFilter, setUnitFilter] = useState('todas')
  const [selection, setSelection] = useState<PrefeituraAgendasHeatmapSelection>({
    unitId: '',
    dateKey: todayKey,
  })
  const [weekData, setWeekData] = useState<PrefeituraAgendaWeekApi | null>(null)
  const [dayData, setDayData] = useState<PrefeituraAgendaDayApi | null>(null)
  const [futurePeriod, setFuturePeriod] = useState<PrefeituraAgendasFuturePeriodId>('7d')
  const [futureData, setFutureData] = useState<PrefeituraAgendaFutureApi | null>(null)
  const [packageUsage, setPackageUsage] = useState<PrefeituraPackageUsageView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reloadCatalog = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return null

    const nextCatalog = await fetchPrefeituraAgendaCatalog(token)
    setCatalog(nextCatalog)
    setSelection((current) => {
      if (current.unitId && nextCatalog.units.some((unit) => unit.id === current.unitId)) {
        return current
      }
      const firstUnitId = nextCatalog.units[0]?.id ?? ''
      return { ...current, unitId: firstUnitId }
    })
    return nextCatalog
  }, [getAccessToken])

  const reloadWeek = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    const week = await fetchPrefeituraAgendaWeek(token, {
      weekStart,
      weekEnd,
      unidadeUbtId: unitFilter !== 'todas' ? unitFilter : undefined,
    })
    setWeekData(week)
  }, [getAccessToken, weekEnd, weekStart, unitFilter])

  const reloadDay = useCallback(async () => {
    const token = getAccessToken()
    if (!token || !selection.unitId) return

    const day = await fetchPrefeituraAgendaDay(token, {
      date: selection.dateKey,
      unidadeUbtId: selection.unitId,
    })
    setDayData(day)
  }, [getAccessToken, selection.dateKey, selection.unitId])

  const reloadFuture = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    const future = await fetchPrefeituraAgendaFuture(token, {
      period: futurePeriod,
      unidadeUbtId: unitFilter !== 'todas' ? unitFilter : undefined,
    })
    setFutureData(future)
  }, [futurePeriod, getAccessToken, unitFilter])

  const reloadPackageUsage = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    const usage = await fetchPrefeituraUtilizacaoCiclo(token)
    setPackageUsage(usage)
  }, [getAccessToken])

  const reloadAll = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      await reloadCatalog()
      await Promise.all([reloadWeek(), reloadFuture(), reloadPackageUsage()])
    } catch (error) {
      const message = isPrefeituraAgendasApiError(error)
        ? error.message
        : 'Não foi possível carregar as agendas.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [reloadCatalog, reloadFuture, reloadPackageUsage, reloadWeek])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reloadAll()
  }, [isAuthenticated, isBootstrapping, reloadAll])

  useEffect(() => {
    if (!isAuthenticated || isBootstrapping || isLoading) return
    void reloadWeek().catch(() => undefined)
  }, [isAuthenticated, isBootstrapping, isLoading, reloadWeek])

  useEffect(() => {
    if (!isAuthenticated || isBootstrapping || isLoading || !selection.unitId) return
    void reloadDay().catch(() => undefined)
  }, [isAuthenticated, isBootstrapping, isLoading, reloadDay, selection.unitId, selection.dateKey])

  useEffect(() => {
    if (!isAuthenticated || isBootstrapping || isLoading) return
    void reloadFuture().catch(() => undefined)
  }, [futurePeriod, isAuthenticated, isBootstrapping, isLoading, reloadFuture, unitFilter])

  const weeklySummaryCards = useMemo(() => {
    const summary = weekData?.weeklySummary
    if (!summary) return []

    return [
      {
        label: 'Agendamentos',
        value: formatWeeklySummaryValue(summary.totalAppointments, 'number'),
        suffix: 'agendamentos na rede',
        icon: CalendarDays,
        iconClass: 'from-orange-500 via-amber-500 to-orange-600',
        ringClass: 'ring-orange-100/80',
        shadowClass: 'shadow-[0_6px_16px_rgba(249,115,22,0.3)]',
      },
      {
        label: 'Comparecimentos',
        value: formatWeeklySummaryValue(summary.attended, 'number'),
        suffix: 'consultas com presença confirmada',
        icon: CheckCircle2,
        iconClass: 'from-emerald-500 via-green-500 to-teal-600',
        ringClass: 'ring-emerald-100/80',
        shadowClass: 'shadow-[0_6px_16px_rgba(16,185,129,0.3)]',
      },
      {
        label: 'Taxa comparecimento',
        value: formatWeeklySummaryValue(summary.attendanceRatePercent, 'percent'),
        suffix: 'média entre as UBTs',
        icon: Percent,
        iconClass: 'from-sky-500 via-blue-500 to-indigo-600',
        ringClass: 'ring-blue-100/80',
        shadowClass: 'shadow-[0_6px_16px_rgba(59,130,246,0.3)]',
      },
      {
        label: 'Faltas',
        value: formatWeeklySummaryValue(summary.noShows, 'number'),
        suffix: 'pacientes não compareceram',
        icon: UserX,
        iconClass: 'from-rose-500 via-red-500 to-red-600',
        ringClass: 'ring-red-100/80',
        shadowClass: 'shadow-[0_6px_16px_rgba(239,68,68,0.3)]',
      },
    ] as const
  }, [weekData])

  const goToTodayWeek = useCallback(() => {
    const week = getDefaultAgendasWeek(new Date())
    setWeekStart(week.start)
    setWeekEnd(week.end)
    setDayKeys(week.dayKeys)
    setSelection((current) => ({ ...current, dateKey: todayKey }))
  }, [])

  const shiftWeek = useCallback(
    (direction: -1 | 1) => {
      const start = parseIsoDate(weekStart)
      const end = parseIsoDate(weekEnd)
      if (!start || !end) return

      const nextStart = addDays(start, direction * 7)
      const nextEnd = addDays(end, direction * 7)
      const keys = Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(nextStart, index)))

      setWeekStart(toIsoDate(nextStart))
      setWeekEnd(toIsoDate(nextEnd))
      setDayKeys(keys)

      setSelection((current) => ({
        ...current,
        dateKey: keys.includes(current.dateKey) ? current.dateKey : (keys[0] ?? current.dateKey),
      }))
    },
    [weekEnd, weekStart],
  )

  const handleUnitFilterChange = useCallback((value: string) => {
    setUnitFilter(value)
    if (value !== 'todas') {
      setSelection((current) => ({ ...current, unitId: value }))
    }
  }, [])

  const goToWeekContainingDate = useCallback((dateKey: string) => {
    const date = parseIsoDate(dateKey)
    if (!date) return
    const week = getDefaultAgendasWeek(date)
    setWeekStart(week.start)
    setWeekEnd(week.end)
    setDayKeys(week.dayKeys)
    setSelection((current) => ({ ...current, dateKey }))
  }, [])

  const findUnit = useCallback(
    (unitId: string): PrefeituraAgendaUnitApi | undefined =>
      catalog?.units.find((unit) => unit.id === unitId),
    [catalog],
  )

  const getUnitOptionsForRegion = useCallback(
    (regionKey: string) => {
      const units =
        regionKey === 'todas'
          ? (catalog?.units ?? [])
          : (catalog?.units ?? []).filter((unit) => unit.regionKey === regionKey)
      return units.map((unit) => ({ value: unit.id, label: unit.name }))
    },
    [catalog],
  )

  const isViewingCurrentWeek = weekStart === defaultWeek.start

  return {
    catalog,
    weekStart,
    weekEnd,
    dayKeys,
    unitFilter,
    selection,
    setSelection,
    weekData,
    dayData,
    futurePeriod,
    setFuturePeriod,
    futureData,
    packageUsage,
    weeklySummaryCards,
    isLoading,
    loadError,
    reloadAll,
    goToTodayWeek,
    goToWeekContainingDate,
    shiftWeek,
    handleUnitFilterChange,
    findUnit,
    getUnitOptionsForRegion,
    isViewingCurrentWeek,
    todayKey,
  }
}
