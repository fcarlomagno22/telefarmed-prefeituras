import AsyncStorage from '@react-native-async-storage/async-storage'
import { StoredAppointment } from '../types/myAppointments'

const APPOINTMENTS_KEY = '@telefarmed/appointments'

export async function loadAppointments(patientCpf: string): Promise<StoredAppointment[]> {
  try {
    const raw = await AsyncStorage.getItem(APPOINTMENTS_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as StoredAppointment[]
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item) => item.patientCpf === patientCpf)
  } catch {
    return []
  }
}

export async function saveAppointmentsForPatient(
  patientCpf: string,
  patientAppointments: StoredAppointment[],
) {
  const raw = await AsyncStorage.getItem(APPOINTMENTS_KEY)
  let all: StoredAppointment[] = []

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as StoredAppointment[]
      if (Array.isArray(parsed)) {
        all = parsed.filter((item) => item.patientCpf !== patientCpf)
      }
    } catch {
      all = []
    }
  }

  all.push(...patientAppointments)
  await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all))
}

export async function upsertAppointment(appointment: StoredAppointment) {
  const existing = await loadAppointments(appointment.patientCpf)
  const next = existing.some((item) => item.id === appointment.id)
    ? existing.map((item) => (item.id === appointment.id ? appointment : item))
    : [appointment, ...existing]

  await saveAppointmentsForPatient(appointment.patientCpf, next)
}

export async function updateAppointment(
  patientCpf: string,
  appointmentId: string,
  patch: Partial<StoredAppointment>,
): Promise<StoredAppointment | null> {
  const existing = await loadAppointments(patientCpf)
  let updated: StoredAppointment | null = null

  const next = existing.map((item) => {
    if (item.id !== appointmentId) return item
    updated = { ...item, ...patch }
    return updated
  })

  if (!updated) return null

  await saveAppointmentsForPatient(patientCpf, next)
  return updated
}
