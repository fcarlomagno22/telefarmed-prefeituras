import type { ChangeLogEntry, PatientContactLogEntry } from '../data/networkUserActivity'
import type { UserAnnotation, UserProfileEdits } from '../data/networkUserLocalData'
import { getNetworkUserProfile } from '../data/networkUserProfiles'
import { networkUsersAbout, type NetworkUser } from '../data/networkUsersMock'

export type LastAppointmentFilter =
  | 'all'
  | 'today'
  | '7d'
  | '30d'
  | '90d'
  | 'inactive'
  | 'never'

export type TotalAppointmentsFilter = 'all' | 'inactive' | 'low' | 'frequent'

export type AgeGroupFilter = 'all' | '0-17' | '18-29' | '30-59' | '60+'

export type NewUsersFilter = 'all' | 'this_month' | '30d'

export type GenderFilter = 'all' | 'Feminino' | 'Masculino'

export type IncompleteDataFilter = 'no_phone' | 'no_email' | 'no_emergency_contact'

export type SortOption =
  | 'name_asc'
  | 'name_desc'
  | 'last_appointment_desc'
  | 'last_appointment_asc'
  | 'total_appointments_desc'
  | 'total_appointments_asc'

export type NetworkUsersFilters = {
  neighborhoods: string[]
  lastAppointment: LastAppointmentFilter
  totalAppointments: TotalAppointmentsFilter
  ageGroup: AgeGroupFilter
  newUsers: NewUsersFilter
  gender: GenderFilter
  registrationUnits: string[]
  incompleteData: IncompleteDataFilter[]
  recentActivityOnly: boolean
  sortBy: SortOption
}

export type NetworkUserFilterContext = {
  userEditsMap: Record<string, UserProfileEdits>
  annotationsMap: Record<string, UserAnnotation[]>
  lastReviewedMap: Record<string, string>
  contactLogsMap: Record<string, PatientContactLogEntry[]>
  changeLogsMap: Record<string, ChangeLogEntry[]>
}

export const defaultNetworkUsersFilters: NetworkUsersFilters = {
  neighborhoods: [],
  lastAppointment: 'all',
  totalAppointments: 'all',
  ageGroup: 'all',
  newUsers: 'all',
  gender: 'all',
  registrationUnits: [],
  incompleteData: [],
  recentActivityOnly: false,
  sortBy: 'name_asc',
}

const RECENT_ACTIVITY_DAYS = 7

function parseBrDate(value: string): Date | null {
  if (!value || value === '—') return null
  const parts = value.split('/').map((part) => Number(part))
  if (parts.length !== 3) return null
  const [day, month, year] = parts
  if (!day || !month || !year) return null
  return new Date(year, month - 1, day)
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function daysBetween(from: Date, to: Date) {
  const msPerDay = 86_400_000
  return Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay)
}

export function neighborhoodForUser(user: NetworkUser, ctx: NetworkUserFilterContext) {
  return ctx.userEditsMap[user.id]?.neighborhood ?? user.bairro
}

export function phoneForUser(user: NetworkUser, ctx: NetworkUserFilterContext) {
  return ctx.userEditsMap[user.id]?.phone ?? user.phone
}

export function emailForUser(user: NetworkUser, ctx: NetworkUserFilterContext) {
  const edits = ctx.userEditsMap[user.id]?.email
  if (edits !== undefined) return edits
  return getNetworkUserProfile(user).email
}

export function contactsForUser(user: NetworkUser, ctx: NetworkUserFilterContext) {
  const edits = ctx.userEditsMap[user.id]?.contacts
  if (edits !== undefined) return edits
  return getNetworkUserProfile(user).contacts
}

export function registrationUnitForUser(user: NetworkUser) {
  return getNetworkUserProfile(user).registrationUnit
}

export function genderForUser(user: NetworkUser) {
  return getNetworkUserProfile(user).genderLabel
}

export function registeredAtForUser(user: NetworkUser) {
  return getNetworkUserProfile(user).registeredAt
}

export function daysSinceLastAppointment(user: NetworkUser): number | null {
  if (user.totalAppointments === 0) return null

  const relative = user.lastAppointmentRelative.toLowerCase()
  if (relative.includes('hoje')) return 0
  if (relative.includes('ontem')) return 1

  const daysMatch = relative.match(/(\d+)\s*dias/)
  if (daysMatch) return Number(daysMatch[1])

  const weeksMatch = relative.match(/(\d+)\s*semana/)
  if (weeksMatch) return Number(weeksMatch[1]) * 7
  if (relative.includes('semana')) return 7

  const parsed = parseBrDate(user.lastAppointmentDate)
  if (!parsed) return null
  return Math.max(0, daysBetween(parsed, new Date()))
}

function matchesAgeGroup(user: NetworkUser, ageGroup: AgeGroupFilter) {
  if (ageGroup === 'all') return true
  if (ageGroup === '0-17') return user.age <= 17
  if (ageGroup === '18-29') return user.age >= 18 && user.age <= 29
  if (ageGroup === '30-59') return user.age >= 30 && user.age <= 59
  return user.age >= 60
}

function matchesLastAppointment(user: NetworkUser, filter: LastAppointmentFilter) {
  if (filter === 'all') return true
  if (filter === 'never') return user.totalAppointments === 0

  const days = daysSinceLastAppointment(user)
  if (days === null) return false

  if (filter === 'today') return days === 0
  if (filter === '7d') return days <= 7
  if (filter === '30d') return days <= 30
  if (filter === '90d') return days <= 90
  return days > 90
}

function matchesTotalAppointments(user: NetworkUser, filter: TotalAppointmentsFilter) {
  if (filter === 'all') return true
  if (filter === 'inactive') return user.totalAppointments === 0
  if (filter === 'low') return user.totalAppointments >= 1 && user.totalAppointments <= 5
  return user.totalAppointments >= 6
}

function matchesNewUsers(user: NetworkUser, filter: NewUsersFilter) {
  if (filter === 'all') return true
  const registeredAt = parseBrDate(registeredAtForUser(user))
  if (!registeredAt) return false

  const now = new Date()
  if (filter === 'this_month') {
    return (
      registeredAt.getMonth() === now.getMonth() &&
      registeredAt.getFullYear() === now.getFullYear()
    )
  }

  return daysBetween(registeredAt, now) <= 30
}

function matchesGender(user: NetworkUser, filter: GenderFilter) {
  if (filter === 'all') return true
  return genderForUser(user) === filter
}

function matchesIncompleteData(
  user: NetworkUser,
  filters: IncompleteDataFilter[],
  ctx: NetworkUserFilterContext,
) {
  if (!filters.length) return true

  return filters.some((filter) => {
    if (filter === 'no_phone') {
      const phone = phoneForUser(user, ctx).trim()
      return !phone || phone === '—'
    }
    if (filter === 'no_email') {
      const email = emailForUser(user, ctx).trim()
      return !email || email === '—'
    }
    return contactsForUser(user, ctx).length === 0
  })
}

function isRecentActivity(
  user: NetworkUser,
  ctx: NetworkUserFilterContext,
  referenceDate = new Date(),
) {
  const cutoffMs = referenceDate.getTime() - RECENT_ACTIVITY_DAYS * 86_400_000

  const hasRecentAnnotation = (ctx.annotationsMap[user.id] ?? []).some(
    (item) => new Date(item.createdAt).getTime() >= cutoffMs,
  )
  if (hasRecentAnnotation) return true

  const lastReviewed = ctx.lastReviewedMap[user.id]
  if (lastReviewed && new Date(lastReviewed).getTime() >= cutoffMs) return true

  const hasRecentContact = (ctx.contactLogsMap[user.id] ?? []).some(
    (item) => new Date(item.at).getTime() >= cutoffMs,
  )
  if (hasRecentContact) return true

  return (ctx.changeLogsMap[user.id] ?? []).some(
    (item) => new Date(item.at).getTime() >= cutoffMs,
  )
}

function compareUsers(a: NetworkUser, b: NetworkUser, sortBy: SortOption) {
  switch (sortBy) {
    case 'name_desc':
      return b.name.localeCompare(a.name, 'pt-BR')
    case 'last_appointment_desc': {
      const daysA = daysSinceLastAppointment(a)
      const daysB = daysSinceLastAppointment(b)
      if (daysA === null && daysB === null) return 0
      if (daysA === null) return 1
      if (daysB === null) return -1
      return daysA - daysB
    }
    case 'last_appointment_asc': {
      const daysA = daysSinceLastAppointment(a)
      const daysB = daysSinceLastAppointment(b)
      if (daysA === null && daysB === null) return 0
      if (daysA === null) return -1
      if (daysB === null) return 1
      return daysB - daysA
    }
    case 'total_appointments_desc':
      return b.totalAppointments - a.totalAppointments
    case 'total_appointments_asc':
      return a.totalAppointments - b.totalAppointments
    case 'name_asc':
    default:
      return a.name.localeCompare(b.name, 'pt-BR')
  }
}

export function applyNetworkUsersFilters(
  users: NetworkUser[],
  filters: NetworkUsersFilters,
  ctx: NetworkUserFilterContext,
) {
  const filtered = users.filter((user) => {
    if (
      filters.neighborhoods.length > 0 &&
      !filters.neighborhoods.includes(neighborhoodForUser(user, ctx))
    ) {
      return false
    }

    if (
      filters.registrationUnits.length > 0 &&
      !filters.registrationUnits.includes(registrationUnitForUser(user))
    ) {
      return false
    }

    if (!matchesLastAppointment(user, filters.lastAppointment)) return false
    if (!matchesTotalAppointments(user, filters.totalAppointments)) return false
    if (!matchesAgeGroup(user, filters.ageGroup)) return false
    if (!matchesNewUsers(user, filters.newUsers)) return false
    if (!matchesGender(user, filters.gender)) return false
    if (!matchesIncompleteData(user, filters.incompleteData, ctx)) return false
    if (filters.recentActivityOnly && !isRecentActivity(user, ctx)) return false

    return true
  })

  return [...filtered].sort((a, b) => compareUsers(a, b, filters.sortBy))
}

export function countActiveNetworkUserFilters(filters: NetworkUsersFilters) {
  let count = 0
  if (filters.neighborhoods.length > 0) count += 1
  if (filters.registrationUnits.length > 0) count += 1
  if (filters.lastAppointment !== 'all') count += 1
  if (filters.totalAppointments !== 'all') count += 1
  if (filters.ageGroup !== 'all') count += 1
  if (filters.newUsers !== 'all') count += 1
  if (filters.gender !== 'all') count += 1
  if (filters.incompleteData.length > 0) count += 1
  if (filters.recentActivityOnly) count += 1
  if (filters.sortBy !== defaultNetworkUsersFilters.sortBy) count += 1
  return count
}

export function getAvailableNeighborhoods(users: NetworkUser[]) {
  const fromUsers = users.map((user) => user.bairro)
  const fromChart = networkUsersAbout.topNeighborhoodsByAppointments.map((item) => item.label)
  return [...new Set([...fromUsers, ...fromChart])].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function getAvailableRegistrationUnits(users: NetworkUser[]) {
  return [...new Set(users.map((user) => registrationUnitForUser(user)))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )
}
