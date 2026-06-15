import { fetchConsultationDocuments } from './appointmentDocuments'
import { scheduleDoctors } from '../data/mockScheduleCatalog'
import { fetchMyAppointments } from '../data/mockMyAppointments'
import type { ConsultationDocumentKind, ConsultationDocumentPdf } from '../types/appointmentDocuments'
import type {
  ConsultationDocumentsEntry,
  DocumentKindCounts,
  FlatDocumentEntry,
  PatientProviderFilter,
  PatientProviderOption,
} from '../types/myDocuments'
import type { PeriodSelection } from '../types/metrics'
import { getAppointmentDateTime } from './myAppointments'
import { formatDateKey } from './metricsPeriod'

const MOCK_DELAY_MS = 320

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function countDocumentsByKind(documents: ConsultationDocumentPdf[]): DocumentKindCounts {
  return {
    prescription: documents.filter((item) => item.kind === 'prescription').length,
    exam: documents.filter((item) => item.kind === 'exam').length,
    certificate: documents.filter((item) => item.kind === 'certificate').length,
    total: documents.length,
  }
}

export function formatDocumentCountsLabel(counts: DocumentKindCounts): string {
  const parts: string[] = []

  if (counts.prescription > 0) {
    parts.push(
      `${counts.prescription} receita${counts.prescription > 1 ? 's' : ''}`,
    )
  }

  if (counts.exam > 0) {
    parts.push(`${counts.exam} exame${counts.exam > 1 ? 's' : ''}`)
  }

  if (counts.certificate > 0) {
    parts.push(
      `${counts.certificate} atestado${counts.certificate > 1 ? 's' : ''}`,
    )
  }

  return parts.join(' · ')
}

export function getDocumentKindLabel(kind: ConsultationDocumentKind, plural = false) {
  if (kind === 'prescription') return plural ? 'Receitas' : 'Receita'
  if (kind === 'exam') return plural ? 'Exames' : 'Exame'
  return plural ? 'Atestados' : 'Atestado'
}

export async function fetchPatientDocumentConsultations(
  patientCpf: string,
): Promise<ConsultationDocumentsEntry[]> {
  await delay(MOCK_DELAY_MS)

  const appointments = await fetchMyAppointments(patientCpf)
  const completed = appointments.filter((item) => item.status === 'completed')

  const entries = completed
    .map((appointment) => {
      const bundle = fetchConsultationDocuments(appointment)
      const documents = bundle.documents
      return {
        appointment,
        documents,
        counts: countDocumentsByKind(documents),
      }
    })
    .filter((entry) => entry.counts.total > 0)

  return entries.sort(
    (a, b) =>
      getAppointmentDateTime(b.appointment).getTime() -
      getAppointmentDateTime(a.appointment).getTime(),
  )
}

export function flattenDocumentEntries(
  entries: ConsultationDocumentsEntry[],
): FlatDocumentEntry[] {
  return entries.flatMap((entry) =>
    entry.documents.map((document) => ({
      document,
      appointment: entry.appointment,
    })),
  )
}

export function filterConsultationEntriesByPeriod(
  entries: ConsultationDocumentsEntry[],
  period: PeriodSelection | null,
) {
  if (!period) return entries

  const startTime = period.start.getTime()
  const endTime = period.end.getTime()

  return entries.filter((entry) => {
    const time = getAppointmentDateTime(entry.appointment).getTime()
    return time >= startTime && time <= endTime
  })
}

export function filterFlatDocumentsByKind(
  items: FlatDocumentEntry[],
  kindFilter: 'all' | ConsultationDocumentKind,
) {
  if (kindFilter === 'all') return items
  return items.filter((item) => item.document.kind === kindFilter)
}

export function getConsultationDateKeys(entries: ConsultationDocumentsEntry[]) {
  return new Set(
    entries.map((entry) => formatDateKey(getAppointmentDateTime(entry.appointment))),
  )
}

export function getLatestDocumentEntry(entries: ConsultationDocumentsEntry[]) {
  return entries[0] ?? null
}

function getAppointmentDoctorId(appointment: ConsultationDocumentsEntry['appointment']) {
  return appointment.selectedDoctorId || appointment.selectedDoctorName
}

export function getPatientProviderOptions(
  entries: ConsultationDocumentsEntry[],
): PatientProviderOption[] {
  const map = new Map<string, PatientProviderOption>()

  for (const entry of entries) {
    const { appointment } = entry
    const doctorId = getAppointmentDoctorId(appointment)
    const doctor = scheduleDoctors.find((item) => item.id === appointment.selectedDoctorId)
    const existing = map.get(doctorId)

    if (existing) {
      existing.consultationCount += 1
      existing.documentCount += entry.counts.total
      continue
    }

    map.set(doctorId, {
      doctorId,
      doctorName: appointment.selectedDoctorName,
      specialtyName: appointment.specialtyName,
      avatarUrl: doctor?.avatarUrl,
      consultationCount: 1,
      documentCount: entry.counts.total,
    })
  }

  return Array.from(map.values()).sort((a, b) =>
    a.doctorName.localeCompare(b.doctorName, 'pt-BR'),
  )
}

export function filterProviderOptionsByQuery(
  options: PatientProviderOption[],
  query: string,
) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return options

  return options.filter(
    (option) =>
      option.doctorName.toLowerCase().includes(normalized) ||
      option.specialtyName.toLowerCase().includes(normalized),
  )
}

export function filterConsultationEntriesByProvider(
  entries: ConsultationDocumentsEntry[],
  providerFilter: PatientProviderFilter | null,
) {
  if (!providerFilter) return entries

  return entries.filter(
    (entry) => getAppointmentDoctorId(entry.appointment) === providerFilter.doctorId,
  )
}

export function formatProviderFilterLabel(filter: PatientProviderFilter) {
  return `${filter.doctorName} · ${filter.specialtyName}`
}
