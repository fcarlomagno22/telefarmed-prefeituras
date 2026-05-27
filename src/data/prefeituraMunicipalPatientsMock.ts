import { networkUsers, type NetworkUser } from './networkUsersMock'
import { getNetworkUserProfile } from './networkUserProfiles'

export type PrefeituraMunicipalPatient = NetworkUser & {
  /** Identificador único na base municipal (um registro por CPF). */
  municipalRecordId: string
  firstAttendanceUnit: string
  registeredAt: string
  monthsWithoutConsultation: number | null
  dataQuality: 'complete' | 'incomplete'
  missingFields: string[]
}

export type PrefeituraMunicipalPatientsMonthSlice = {
  label: string
  count: number
}

export type PrefeituraMunicipalPatientsNeighborhoodSlice = {
  label: string
  registrations: number
}

export type PrefeituraMunicipalPatientsUnitSlice = {
  label: string
  registrations: number
}

export const prefeituraMunicipalPatientsSummary = {
  totalPatients: 24_580,
  newThisMonth: 1_284,
  incompleteRecords: 892,
  inactiveSixMonths: 3_410,
}

export const prefeituraMunicipalPatientsAbout = {
  newRegistrationsByMonth: [
    { label: 'Dez', count: 980 },
    { label: 'Jan', count: 1042 },
    { label: 'Fev', count: 1118 },
    { label: 'Mar', count: 1196 },
    { label: 'Abr', count: 1241 },
    { label: 'Mai', count: 1284 },
  ] satisfies PrefeituraMunicipalPatientsMonthSlice[],
  registrationsByNeighborhood: [
    { label: 'Centro', registrations: 2140 },
    { label: 'Vila Nova', registrations: 1892 },
    { label: 'Jardim América', registrations: 1654 },
    { label: 'Bela Vista', registrations: 1420 },
    { label: 'Mooca', registrations: 1288 },
  ] satisfies PrefeituraMunicipalPatientsNeighborhoodSlice[],
  registrationsByFirstUnit: [
    { label: 'UBT São Francisco', registrations: 4820 },
    { label: 'UBT Vila Mariana', registrations: 3910 },
    { label: 'UBT Santana', registrations: 3540 },
    { label: 'UBT Pinheiros', registrations: 2980 },
    { label: 'UBT Mooca', registrations: 2650 },
  ] satisfies PrefeituraMunicipalPatientsUnitSlice[],
}

function monthsWithoutConsultationForUser(user: NetworkUser): number | null {
  if (user.totalAppointments === 0) return null

  const campaignDemoMonths: Record<string, number> = {
    '4': 8,
    '5': 7,
    '6': 11,
    '7': 14,
  }
  if (campaignDemoMonths[user.id] !== undefined) {
    return campaignDemoMonths[user.id]
  }

  const relative = user.lastAppointmentRelative.toLowerCase()
  if (relative.includes('hoje')) return 0
  if (relative.includes('ontem')) return 0

  const daysMatch = relative.match(/(\d+)\s*dias/)
  if (daysMatch) return Math.floor(Number(daysMatch[1]) / 30)

  const weeksMatch = relative.match(/(\d+)\s*semana/)
  if (weeksMatch) return Math.floor((Number(weeksMatch[1]) * 7) / 30)
  if (relative.includes('semana')) return 1

  return 2
}

function missingFieldsForUser(user: NetworkUser): string[] {
  const profile = getNetworkUserProfile(user)
  const missing: string[] = []
  if (!user.phone?.trim()) missing.push('telefone')
  if (!profile.email?.trim()) missing.push('e-mail')
  if (!profile.contacts.length) missing.push('contato de emergência')
  if (!profile.zipCode?.trim()) missing.push('CEP')
  return missing
}

export const prefeituraMunicipalPatients: PrefeituraMunicipalPatient[] = networkUsers.map(
  (user) => {
    const profile = getNetworkUserProfile(user)
    const missingFields = missingFieldsForUser(user)

    return {
      ...user,
      municipalRecordId: `MUN-${user.id.padStart(6, '0')}`,
      firstAttendanceUnit: profile.registrationUnit,
      registeredAt: profile.registeredAt,
      monthsWithoutConsultation: monthsWithoutConsultationForUser(user),
      dataQuality: missingFields.length > 0 ? 'incomplete' : 'complete',
      missingFields,
    }
  },
)

export const prefeituraMunicipalPatientsPagination = {
  page: 1,
  pageSize: 7,
  total: prefeituraMunicipalPatientsSummary.totalPatients,
  totalPages: 3508,
}
