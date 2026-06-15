export type AdminDashboardTriageBarItem = {
  key: string
  label: string
  count: number
  percent: number
}

export type AdminDashboardTriageChartsView = {
  totalTriages: number
  chronicShare: {
    withChronicCount: number
    withoutChronicCount: number
    withChronicPercent: number
  }
  chronicConditions: AdminDashboardTriageBarItem[]
  comorbidities: AdminDashboardTriageBarItem[]
  chiefComplaints: AdminDashboardTriageBarItem[]
  associatedSymptoms: AdminDashboardTriageBarItem[]
}

export const EMPTY_ADMIN_DASHBOARD_TRIAGE_CHARTS: AdminDashboardTriageChartsView = {
  totalTriages: 0,
  chronicShare: {
    withChronicCount: 0,
    withoutChronicCount: 0,
    withChronicPercent: 0,
  },
  chronicConditions: [],
  comorbidities: [],
  chiefComplaints: [],
  associatedSymptoms: [],
}
