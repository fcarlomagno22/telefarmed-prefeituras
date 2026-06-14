import type { ConsultationRecord } from '../data/consultasMock'
import { getDefaultConsultasPeriod } from './consultasPeriod'
import { onlyDigits } from './lgpdDisplay'

export type ConsultasFilters = {
  periodStart: string
  periodEnd: string
  specialty: string
  doctor: string
  neighborhood: string
  gender: string
  ageRange: string
  status: string
  unit: string
  generalSearch: string
}

export const defaultConsultasFilters: ConsultasFilters = {
  periodStart: '2026-04-20',
  periodEnd: '2026-05-20',
  specialty: '',
  doctor: '',
  neighborhood: '',
  gender: '',
  ageRange: '',
  status: '',
  unit: '',
  generalSearch: '',
}

const doctorKeyByName: Record<string, string> = {
  'Dr. Carlos Mendes': 'carlos_mendes',
  'Dra. Ana Paula Costa': 'ana_costa',
  'Dr. Roberto Alves': 'roberto_alves',
  'Dra. Juliana Martins': 'juliana_martins',
  'Dr. Paulo Henrique': 'paulo_henrique',
}

const neighborhoodKeyByLabel: Record<string, string> = {
  Centro: 'centro',
  'Jardim América': 'jardim_america',
  'Vila Nova': 'vila_nova',
  'Boa Vista': 'boa_vista',
  'São José': 'sao_jose',
  Industrial: 'industrial',
  'Parque das Flores': 'parque_das_flores',
  'Alto da Serra': 'alto_da_serra',
}

const statusLabels: Record<string, string> = {
  concluida: 'concluída concluida',
  cancelada: 'cancelada',
  em_andamento: 'em andamento',
}

function parseBrDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2]) - 1
  const year = Number(match[3])
  const date = new Date(year, month, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

function parseIsoDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  return new Date(year, month, day)
}

function isWithinPeriod(record: ConsultationRecord, start: string, end: string) {
  if (!start && !end) return true
  const recordDate = parseBrDate(record.date)
  if (!recordDate) return true

  const startDate = start ? parseIsoDate(start) : null
  const endDate = end ? parseIsoDate(end) : null

  if (startDate && recordDate < startDate) return false
  if (endDate) {
    const endInclusive = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
      23,
      59,
      59,
      999,
    )
    if (recordDate > endInclusive) return false
  }
  return true
}

function matchesAgeRange(age: number, range: string) {
  switch (range) {
    case '0-17':
      return age <= 17
    case '18-39':
      return age >= 18 && age <= 39
    case '40-59':
      return age >= 40 && age <= 59
    case '60+':
      return age >= 60
    default:
      return true
  }
}

function buildSearchHaystack(record: ConsultationRecord) {
  const genderLabel = record.gender === 'F' ? 'feminino' : 'masculino'
  const protocol = `CONS-${record.id.padStart(6, '0')}`
  return [
    record.patientName,
    record.cpf,
    onlyDigits(record.cpf),
    record.doctorName,
    record.doctorCrm,
    onlyDigits(record.doctorCrm),
    record.specialty,
    record.neighborhood,
    record.date,
    record.time,
    statusLabels[record.status] ?? record.status,
    genderLabel,
    String(record.age),
    protocol,
    record.id,
  ]
    .join(' ')
    .toLowerCase()
}

export function filterConsultasBySearch(
  query: string,
  records: ConsultationRecord[],
): ConsultationRecord[] {
  const trimmed = query.trim()
  if (!trimmed) return records

  const normalized = trimmed.toLowerCase()
  const queryDigits = onlyDigits(trimmed)
  const isFullCpfSearch = queryDigits.length === 11

  return records.filter((record) => {
    if (isFullCpfSearch) {
      return onlyDigits(record.cpf) === queryDigits
    }

    const haystack = buildSearchHaystack(record)
    if (haystack.includes(normalized)) return true

    if (queryDigits.length > 0) {
      const digitHaystack = `${onlyDigits(record.cpf)} ${onlyDigits(record.doctorCrm)} ${record.id}`
      return digitHaystack.includes(queryDigits)
    }

    return false
  })
}

export function applyConsultasFilters(
  records: ConsultationRecord[],
  filters: ConsultasFilters,
): ConsultationRecord[] {
  let result = filterConsultasBySearch(filters.generalSearch, records)

  result = result.filter((record) => {
    if (!isWithinPeriod(record, filters.periodStart, filters.periodEnd)) return false
    if (filters.specialty && record.specialtyId !== filters.specialty) return false

    if (filters.doctor) {
      const doctorKey = doctorKeyByName[record.doctorName]
      if (doctorKey !== filters.doctor) return false
    }

    if (filters.neighborhood) {
      const neighborhoodKey = neighborhoodKeyByLabel[record.neighborhood]
      if (neighborhoodKey !== filters.neighborhood) return false
    }

    if (filters.gender && record.gender !== filters.gender) return false
    if (filters.ageRange && !matchesAgeRange(record.age, filters.ageRange)) return false
    if (filters.status && record.status !== filters.status) return false

    return true
  })

  return result
}

export function countActiveConsultasFilters(filters: ConsultasFilters): number {
  const defaultPeriod = getDefaultConsultasPeriod()
  let count = 0
  if (filters.periodStart !== defaultPeriod.start) count += 1
  if (filters.periodEnd !== defaultPeriod.end) count += 1
  if (filters.specialty) count += 1
  if (filters.doctor) count += 1
  if (filters.neighborhood) count += 1
  if (filters.gender) count += 1
  if (filters.ageRange) count += 1
  if (filters.status) count += 1
  if (filters.unit) count += 1
  return count
}
