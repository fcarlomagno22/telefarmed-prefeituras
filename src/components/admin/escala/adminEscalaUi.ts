import {
  getAdminEscalaDoctorOptions,
  getAdminEscalaPrefeituras,
  getAdminEscalaUbts,
  getPrefeituraById,
  getUbtById,
} from '../../../data/adminEscalaCatalog'
import type {
  AdminEscalaFillStatus,
  AdminEscalaShift,
  AdminEscalaShiftStatus,
} from '../../../types/adminEscala'
import { computeAdminEscalaFillStatus } from '../../../utils/escala/escalaShiftMeta'

export function getAdminEscalaDoctorLabel(doctorId: string) {
  return getAdminEscalaDoctorOptions().find((d) => d.value === doctorId)?.label ?? 'Médico'
}

export function formatAdminEscalaDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatAdminEscalaPeriod(startAt: string, endAt: string) {
  const start = new Date(startAt)
  const end = new Date(endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startAt} – ${endAt}`
  }
  const sameDay = start.toDateString() === end.toDateString()
  const dayFmt: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }
  const timeFmt: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
  if (sameDay) {
    return `${start.toLocaleDateString('pt-BR', dayFmt)} · ${start.toLocaleTimeString('pt-BR', timeFmt)} – ${end.toLocaleTimeString('pt-BR', timeFmt)}`
  }
  return `${formatAdminEscalaDateTime(startAt)} – ${formatAdminEscalaDateTime(endAt)}`
}

export function formatAdminEscalaScopeSummary(shift: AdminEscalaShift): string {
  const parts: string[] = []

  if (shift.prefeituraScope.mode === 'all') {
    parts.push('Todas as prefeituras')
  } else {
    const names = shift.prefeituraScope.prefeituraIds
      .map((id) => getPrefeituraById(id)?.name ?? id)
      .slice(0, 2)
    const extra = shift.prefeituraScope.prefeituraIds.length - names.length
    const label =
      names.length === 0
        ? 'Prefeituras (nenhuma)'
        : extra > 0
          ? `${names.join(', ')} +${extra}`
          : names.join(', ')
    parts.push(label)
  }

  if (shift.ubtScope.mode === 'tele_only') {
    parts.push('Só tele')
  } else if (shift.ubtScope.mode === 'all') {
    const scoped =
      shift.prefeituraScope.mode === 'selected'
        ? getAdminEscalaUbts().filter((u) =>
            shift.prefeituraScope.prefeituraIds.includes(u.municipalityId),
          )
        : getAdminEscalaUbts()
    parts.push(`Todas as UBTs (${scoped.length})`)
  } else {
    const names = shift.ubtScope.ubtIds
      .map((id) => getUbtById(id)?.name ?? id)
      .slice(0, 2)
    const extra = shift.ubtScope.ubtIds.length - names.length
    parts.push(
      names.length === 0
        ? 'UBTs (nenhuma)'
        : extra > 0
          ? `${names.join(', ')} +${extra} UBT`
          : names.join(', '),
    )
  }

  return parts.join(' · ')
}

const statusLabels: Record<AdminEscalaShiftStatus, string> = {
  rascunho: 'Rascunho',
  publicada: 'Publicada',
  cancelada: 'Cancelada',
}

const statusClasses: Record<AdminEscalaShiftStatus, string> = {
  rascunho: 'bg-amber-50 text-amber-800 ring-amber-200',
  publicada: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  cancelada: 'bg-gray-100 text-gray-600 ring-gray-200',
}

export function buildAdminEscalaStatusBadge(status: AdminEscalaShiftStatus) {
  return {
    label: statusLabels[status],
    className: statusClasses[status],
  }
}

const modalityLabels = {
  tele: 'Telemedicina',
  hibrido: 'Híbrido',
  presencial_ubt: 'Presencial UBT',
} as const

export function formatAdminEscalaModality(modality: AdminEscalaShift['modality']) {
  return modalityLabels[modality]
}

const fillStatusLabels: Record<AdminEscalaFillStatus, string> = {
  na: 'Atribuído',
  aberto: 'Aberto',
  parcial: 'Parcial',
  lotado: 'Lotado',
}

const fillStatusClasses: Record<AdminEscalaFillStatus, string> = {
  na: 'bg-slate-100 text-slate-700 ring-slate-200',
  aberto: 'bg-sky-50 text-sky-800 ring-sky-200',
  parcial: 'bg-amber-50 text-amber-800 ring-amber-200',
  lotado: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
}

export function buildAdminEscalaFillStatusBadge(shift: AdminEscalaShift) {
  const key = computeAdminEscalaFillStatus(shift)
  return {
    label: fillStatusLabels[key],
    className: fillStatusClasses[key],
  }
}

export function shiftsOverlap(a: AdminEscalaShift, b: AdminEscalaShift) {
  if (a.id === b.id) return false
  const aStart = new Date(a.startAt).getTime()
  const aEnd = new Date(a.endAt).getTime()
  const bStart = new Date(b.startAt).getTime()
  const bEnd = new Date(b.endAt).getTime()
  if (Number.isNaN(aStart) || Number.isNaN(aEnd) || Number.isNaN(bStart) || Number.isNaN(bEnd)) {
    return false
  }
  return aStart < bEnd && bStart < aEnd
}

export type AdminEscalaTableRow =
  | { kind: 'single'; shift: AdminEscalaShift }
  | { kind: 'closed'; batchId: string; shifts: AdminEscalaShift[] }

export function groupEscalaShiftsForTable(shifts: AdminEscalaShift[]): AdminEscalaTableRow[] {
  const singles: AdminEscalaShift[] = []
  const batchMap = new Map<string, AdminEscalaShift[]>()

  for (const shift of shifts) {
    if (shift.batchId) {
      const list = batchMap.get(shift.batchId) ?? []
      list.push(shift)
      batchMap.set(shift.batchId, list)
    } else {
      singles.push(shift)
    }
  }

  const rows: AdminEscalaTableRow[] = [
    ...singles.map((shift) => ({ kind: 'single' as const, shift })),
    ...[...batchMap.entries()].map(([batchId, batchShifts]) => ({
      kind: 'closed' as const,
      batchId,
      shifts: [...batchShifts].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    })),
  ]

  return rows.sort((a, b) => {
    const aStart =
      a.kind === 'single'
        ? new Date(a.shift.startAt).getTime()
        : new Date(a.shifts[0]?.startAt ?? 0).getTime()
    const bStart =
      b.kind === 'single'
        ? new Date(b.shift.startAt).getTime()
        : new Date(b.shifts[0]?.startAt ?? 0).getTime()
    return aStart - bStart
  })
}

export function formatBatchSpecialtiesLabel(shifts: AdminEscalaShift[]) {
  const names = [...new Set(shifts.map((s) => s.specialty))]
  if (names.length === 0) return '—'
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
}

export function formatClosedSchedulePeriod(shifts: AdminEscalaShift[]) {
  if (shifts.length === 0) return '—'
  const sorted = [...shifts].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  )
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const startDay = new Date(first.startAt)
  const endDay = new Date(last.startAt)
  const dayFmt: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' }
  const timeFmt: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
  const hours = `${startDay.toLocaleTimeString('pt-BR', timeFmt)} – ${new Date(first.endAt).toLocaleTimeString('pt-BR', timeFmt)}`
  const range = `${startDay.toLocaleDateString('pt-BR', dayFmt)} – ${endDay.toLocaleDateString('pt-BR', dayFmt)}`
  const uniqueDays = new Set(sorted.map((s) => s.startAt.slice(0, 10))).size
  const uniqueSpecs = new Set(sorted.map((s) => s.specialty)).size
  return `${range} · ${hours} · ${uniqueDays} dia${uniqueDays === 1 ? '' : 's'} · ${uniqueSpecs} esp.`
}

export function rowIntersectsWeek(row: AdminEscalaTableRow, weekStart: Date) {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const weekStartMs = weekStart.getTime()
  const weekEndMs = weekEnd.getTime()

  const shifts = row.kind === 'single' ? [row.shift] : row.shifts
  return shifts.some((shift) => {
    const start = new Date(shift.startAt).getTime()
    const end = new Date(shift.endAt).getTime()
    return start < weekEndMs && end >= weekStartMs
  })
}

export function getRowStatus(row: AdminEscalaTableRow): AdminEscalaShiftStatus {
  if (row.kind === 'single') return row.shift.status
  if (row.shifts.every((s) => s.status === 'cancelada')) return 'cancelada'
  if (row.shifts.every((s) => s.status === 'publicada')) return 'publicada'
  if (row.shifts.some((s) => s.status === 'publicada')) return 'publicada'
  return 'rascunho'
}

export function findDoctorScheduleConflicts(
  shifts: AdminEscalaShift[],
  candidate: AdminEscalaShift,
  doctorIds: string[],
  options?: { excludeBatchId?: string },
): string[] {
  const conflicts: string[] = []
  const active = shifts.filter((s) => {
    if (s.status === 'cancelada') return false
    if (s.id === candidate.id) return false
    if (options?.excludeBatchId && s.batchId === options.excludeBatchId) return false
    return shiftsOverlap(s, candidate)
  })

  for (const doctorId of doctorIds) {
    for (const other of active) {
      const involved = [
        other.primaryDoctorId,
        ...other.backupDoctorIds,
      ].includes(doctorId)
      if (!involved) continue
      const name = getAdminEscalaDoctorLabel(doctorId)
      conflicts.push(
        `${name} já está no plantão ${other.id.toUpperCase()} (${formatAdminEscalaPeriod(other.startAt, other.endAt)})`,
      )
    }
  }

  return conflicts
}

export function findDoctorScheduleConflictsForShifts(
  existing: AdminEscalaShift[],
  candidates: AdminEscalaShift[],
  doctorIds: string[],
  options?: { excludeBatchId?: string },
): string[] {
  for (const candidate of candidates) {
    const hit = findDoctorScheduleConflicts(existing, candidate, doctorIds, options)
    if (hit.length > 0) return hit
    const inner = candidates.filter((s) => s.id !== candidate.id)
    for (const other of inner) {
      if (!shiftsOverlap(candidate, other)) continue
      for (const doctorId of doctorIds) {
        const involved = [other.primaryDoctorId, ...other.backupDoctorIds].includes(doctorId)
        if (involved) {
          return [
            `${getAdminEscalaDoctorLabel(doctorId)} tem sobreposição entre dias gerados da agenda fechada.`,
          ]
        }
      }
    }
  }
  return []
}

export function countActivePrefeituras() {
  return getAdminEscalaPrefeituras().length
}
