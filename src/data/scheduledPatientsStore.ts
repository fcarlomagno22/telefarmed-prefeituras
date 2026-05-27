import { cpfDigits } from '../utils/cpf'
import { normalizePatientRegistration, type PatientRegistration } from './unitDashboardMock'

export type PendingFirstVisitEntry = {
  patient: PatientRegistration
  specialtyId: string
  specialtyName: string
  scheduledAt: string
}

const STORAGE_KEY = 'telefarmed_pending_first_visit_v1'

function clonePatient(patient: PatientRegistration): PatientRegistration {
  return {
    ...normalizePatientRegistration(patient),
    contacts: (patient.contacts ?? []).map((contact) => ({ ...contact })),
  }
}

function loadStore(): Record<string, PendingFirstVisitEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, PendingFirstVisitEntry>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveStore(store: Record<string, PendingFirstVisitEntry>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

/** Paciente novo agendado pelo drawer — cadastro incompleto até a primeira visita na triagem. */
export function registerScheduledFirstVisitPatient(
  patient: PatientRegistration,
  specialtyId: string,
  specialtyName: string,
) {
  const key = cpfDigits(patient.cpf)
  if (!key) return

  const store = loadStore()
  store[key] = {
    patient: clonePatient({ ...patient, photoDataUrl: '' }),
    specialtyId,
    specialtyName,
    scheduledAt: new Date().toISOString(),
  }
  saveStore(store)
}

export function getPendingFirstVisitByCpf(cpf: string): PendingFirstVisitEntry | null {
  const key = cpfDigits(cpf)
  if (!key) return null
  const entry = loadStore()[key]
  if (!entry) return null
  return {
    ...entry,
    patient: clonePatient(entry.patient),
  }
}

export function hasPendingFirstVisit(cpf: string): boolean {
  return getPendingFirstVisitByCpf(cpf) !== null
}

export function clearPendingFirstVisit(cpf: string) {
  const key = cpfDigits(cpf)
  if (!key) return
  const store = loadStore()
  if (!store[key]) return
  delete store[key]
  saveStore(store)
}
