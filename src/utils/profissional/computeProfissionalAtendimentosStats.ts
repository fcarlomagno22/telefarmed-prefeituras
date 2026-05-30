import type { ProfissionalAttendanceRecord } from '../../types/profissionalAtendimentos'

export type ProfissionalAtendimentosStats = {
  total: number
  completed: number
  interrupted: number
  averageDurationMin: number
  documentsIssued: number
  patientUploads: number
  weeklyTrend: { label: string; count: number }[]
  documentsFlow: { key: string; label: string; count: number; percent: number; gradientFrom: string; gradientTo: string }[]
  specialtyBars: { label: string; count: number }[]
  ageBands: { label: string; count: number }[]
  weekdayBars: { label: string; count: number }[]
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function formatWeekLabel(weekStart: Date) {
  const day = weekStart.getDate()
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(weekStart)
    .replace('.', '')
  return `${day} ${month}`
}

export function computeProfissionalAtendimentosStats(
  records: ProfissionalAttendanceRecord[],
): ProfissionalAtendimentosStats {
  const total = records.length
  const completed = records.filter((r) => r.status === 'concluido').length
  const interrupted = records.filter((r) => r.status === 'interrompido').length
  const durationSum = records.reduce((sum, r) => sum + r.durationMinutes, 0)
  const averageDurationMin = total > 0 ? Math.round(durationSum / total) : 0
  const documentsIssued = records.reduce((sum, r) => sum + r.issuedDocuments.length, 0)
  const patientUploads = records.reduce((sum, r) => sum + r.patientUploads.length, 0)

  const now = records.length > 0 ? new Date(records[0].dateTimeIso) : new Date()
  const weekBuckets = new Map<string, { label: string; count: number; sortKey: number }>()

  for (let index = 3; index >= 0; index -= 1) {
    const weekStart = startOfWeek(new Date(now))
    weekStart.setDate(weekStart.getDate() - index * 7)
    const key = weekStart.toISOString().slice(0, 10)
    weekBuckets.set(key, {
      label: formatWeekLabel(weekStart),
      count: 0,
      sortKey: weekStart.getTime(),
    })
  }

  records.forEach((record) => {
    const weekStart = startOfWeek(new Date(record.dateTimeIso))
    const key = weekStart.toISOString().slice(0, 10)
    const bucket = weekBuckets.get(key)
    if (bucket) bucket.count += 1
  })

  const weeklyTrend = [...weekBuckets.values()]
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ label, count }) => ({ label, count }))

  const flowTotal = documentsIssued + patientUploads || 1
  const documentsFlow = [
    {
      key: 'sent',
      label: 'Enviados',
      count: documentsIssued,
      percent: Math.round((documentsIssued / flowTotal) * 100),
      gradientFrom: '#ff6b00',
      gradientTo: '#ffb347',
    },
    {
      key: 'received',
      label: 'Recebidos',
      count: patientUploads,
      percent: Math.round((patientUploads / flowTotal) * 100),
      gradientFrom: '#0ea5e9',
      gradientTo: '#38bdf8',
    },
  ].filter((slice) => slice.count > 0)

  const specialtyMap = new Map<string, number>()
  records.forEach((record) => {
    specialtyMap.set(record.specialty, (specialtyMap.get(record.specialty) ?? 0) + 1)
  })
  const specialtyBars = [...specialtyMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))

  const ageBandDefs = [
    { label: '0–12', min: 0, max: 12 },
    { label: '13–17', min: 13, max: 17 },
    { label: '18–39', min: 18, max: 39 },
    { label: '40–59', min: 40, max: 59 },
    { label: '60+', min: 60, max: 200 },
  ]
  const ageBands = ageBandDefs.map((band) => ({
    label: band.label,
    count: records.filter((r) => r.age >= band.min && r.age <= band.max).length,
  }))

  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]
  records.forEach((record) => {
    weekdayCounts[new Date(record.dateTimeIso).getDay()] += 1
  })
  const weekdayBars = weekdayCounts.map((count, index) => ({
    label: WEEKDAY_LABELS[index],
    count,
  }))

  return {
    total,
    completed,
    interrupted,
    averageDurationMin,
    documentsIssued,
    patientUploads,
    weeklyTrend,
    documentsFlow,
    specialtyBars,
    ageBands,
    weekdayBars,
  }
}
