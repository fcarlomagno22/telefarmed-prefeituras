import type { PrefeituraMunicipalPatient } from '../data/prefeituraMunicipalPatientsMock'
import {
  applyNetworkUsersFilters,
  countActiveNetworkUserFilters,
  defaultNetworkUsersFilters,
  getAvailableNeighborhoods,
  getAvailableRegistrationUnits,
  type NetworkUserFilterContext,
  type NetworkUsersFilters,
} from './networkUsersFilters'

export type InactiveConsultationFilter = 'all' | '6m' | '12m' | 'never'

export type PrefeituraMunicipalPatientsFilters = NetworkUsersFilters & {
  inactiveConsultation: InactiveConsultationFilter
  firstAttendanceUnits: string[]
}

export const defaultPrefeituraMunicipalPatientsFilters: PrefeituraMunicipalPatientsFilters = {
  ...defaultNetworkUsersFilters,
  inactiveConsultation: 'all',
  firstAttendanceUnits: [],
}

function matchesInactiveConsultation(
  patient: PrefeituraMunicipalPatient,
  filter: InactiveConsultationFilter,
) {
  if (filter === 'all') return true
  if (filter === 'never') return patient.totalAppointments === 0

  const months = patient.monthsWithoutConsultation
  if (months === null) return filter === 'never'

  if (filter === '6m') return months >= 6
  return months >= 12
}

export function applyPrefeituraMunicipalPatientsFilters(
  patients: PrefeituraMunicipalPatient[],
  filters: PrefeituraMunicipalPatientsFilters,
  ctx: NetworkUserFilterContext,
) {
  const networkFilters: NetworkUsersFilters = {
    ...filters,
    registrationUnits:
      filters.firstAttendanceUnits.length > 0
        ? filters.firstAttendanceUnits
        : filters.registrationUnits,
  }

  const baseFiltered = applyNetworkUsersFilters(patients, networkFilters, ctx)

  return baseFiltered.filter((patient) =>
    matchesInactiveConsultation(patient, filters.inactiveConsultation),
  )
}

export function countActivePrefeituraMunicipalPatientFilters(
  filters: PrefeituraMunicipalPatientsFilters,
) {
  let count = countActiveNetworkUserFilters(filters)
  if (filters.inactiveConsultation !== 'all') count += 1
  if (
    filters.firstAttendanceUnits.length > 0 &&
    filters.registrationUnits.length === 0
  ) {
    count += 1
  }
  return count
}

export function getAvailableFirstAttendanceUnits(patients: PrefeituraMunicipalPatient[]) {
  return getAvailableRegistrationUnits(patients)
}

export { getAvailableNeighborhoods }
