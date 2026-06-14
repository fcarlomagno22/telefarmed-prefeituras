/** Re-exporta tipos compartilhados do dashboard admin (sem dados mock). */
export {
  type AdminContractFilterKey,
  type AdminKpiDrillKind,
  type AdminMunicipalityHealth,
  type AdminMunicipalityRow,
  type AdminNocCategory,
  type AdminNocHistoryEntry,
  type AdminNocIncident,
  type AdminNocPriority,
  type AdminNocStatus,
  type AdminStateKey,
  adminDashboardFilterOptions,
  adminKpiDrillTitles,
  adminNocCategoryLabels,
  adminNocTeams,
  getAdminMunicipalityStateFilterOptions,
} from '../types/adminDashboard'

import type { AdminNocIncident } from '../types/adminDashboard'

export const adminNocIncidents: AdminNocIncident[] = []

export const adminPlatformHourlyBase = [
  { hour: '07h', value: 0 },
  { hour: '08h', value: 0 },
  { hour: '09h', value: 0 },
  { hour: '10h', value: 0 },
  { hour: '11h', value: 0 },
  { hour: '12h', value: 0 },
]
