import { scheduleDoctors } from './mockScheduleCatalog'
import { scheduleUbts } from './mockScheduleUbts'
import {
  loadAppointments,
  saveAppointmentsForPatient,
  updateAppointment,
  upsertAppointment,
} from './appointmentsStorage'
import {
  CreateAppointmentPayload,
  StoredAppointment,
} from '../types/myAppointments'
import { addDays, toDateKey } from '../utils/scheduleDate'
import { generateAppointmentProtocol } from '../utils/myAppointments'

const MOCK_DELAY_MS = 380

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function buildAppointment(
  patientCpf: string,
  index: number,
  data: Omit<StoredAppointment, 'id' | 'patientCpf' | 'createdAt'>,
): StoredAppointment {
  return {
    id: `apt-seed-${patientCpf}-${index}`,
    patientCpf,
    createdAt: new Date().toISOString(),
    ...data,
  }
}

export function createSeedAppointments(patientCpf: string): StoredAppointment[] {
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  const [ubt1, ubt2, ubt3, ubt4, ubt5] = scheduleUbts
  const [dr1, dr2, dr3, dr4, dr5, dr6, dr7] = scheduleDoctors

  return [
    buildAppointment(patientCpf, 1, {
      protocol: 'TF-2026-48291',
      status: 'confirmed',
      specialtyId: dr1.specialtyId,
      specialtyName: dr1.specialtyName,
      selectedUbtId: ubt1.id,
      selectedUbtName: ubt1.name,
      selectedUbtAddress: `${ubt1.address} · ${ubt1.neighborhood}`,
      selectedDate: toDateKey(addDays(today, 1)),
      selectedDoctorId: dr1.id,
      selectedDoctorName: dr1.name,
      selectedTime: '09:20',
    }),
    buildAppointment(patientCpf, 2, {
      protocol: 'TF-2026-51703',
      status: 'pending',
      specialtyId: dr2.specialtyId,
      specialtyName: dr2.specialtyName,
      selectedUbtId: ubt2.id,
      selectedUbtName: ubt2.name,
      selectedUbtAddress: `${ubt2.address} · ${ubt2.neighborhood}`,
      selectedDate: toDateKey(addDays(today, 4)),
      selectedDoctorId: dr2.id,
      selectedDoctorName: dr2.name,
      selectedTime: '14:40',
    }),
    buildAppointment(patientCpf, 3, {
      protocol: 'TF-2026-60418',
      status: 'confirmed',
      specialtyId: dr4.specialtyId,
      specialtyName: dr4.specialtyName,
      selectedUbtId: ubt3.id,
      selectedUbtName: ubt3.name,
      selectedUbtAddress: `${ubt3.address} · ${ubt3.neighborhood}`,
      selectedDate: toDateKey(addDays(today, 8)),
      selectedDoctorId: dr4.id,
      selectedDoctorName: dr4.name,
      selectedTime: '10:00',
    }),
    buildAppointment(patientCpf, 4, {
      protocol: 'TF-2026-73102',
      status: 'confirmed',
      specialtyId: dr7.specialtyId,
      specialtyName: dr7.specialtyName,
      selectedUbtId: ubt4.id,
      selectedUbtName: ubt4.name,
      selectedUbtAddress: `${ubt4.address} · ${ubt4.neighborhood}`,
      selectedDate: toDateKey(addDays(today, 12)),
      selectedDoctorId: dr7.id,
      selectedDoctorName: dr7.name,
      selectedTime: '08:40',
    }),
    buildAppointment(patientCpf, 5, {
      protocol: 'TF-2026-33812',
      status: 'completed',
      specialtyId: dr3.specialtyId,
      specialtyName: dr3.specialtyName,
      selectedUbtId: ubt3.id,
      selectedUbtName: ubt3.name,
      selectedUbtAddress: `${ubt3.address} · ${ubt3.neighborhood}`,
      selectedDate: toDateKey(addDays(today, -6)),
      selectedDoctorId: dr3.id,
      selectedDoctorName: dr3.name,
      selectedTime: '10:00',
      durationMinutes: 32,
    }),
    buildAppointment(patientCpf, 6, {
      protocol: 'TF-2026-29177',
      status: 'completed',
      specialtyId: dr5.specialtyId,
      specialtyName: dr5.specialtyName,
      selectedUbtId: ubt5.id,
      selectedUbtName: ubt5.name,
      selectedUbtAddress: `${ubt5.address} · ${ubt5.neighborhood}`,
      selectedDate: toDateKey(addDays(today, -32)),
      selectedDoctorId: dr5.id,
      selectedDoctorName: dr5.name,
      selectedTime: '11:20',
      durationMinutes: 28,
    }),
    buildAppointment(patientCpf, 7, {
      protocol: 'TF-2026-18403',
      status: 'completed',
      specialtyId: dr6.specialtyId,
      specialtyName: dr6.specialtyName,
      selectedUbtId: ubt2.id,
      selectedUbtName: ubt2.name,
      selectedUbtAddress: `${ubt2.address} · ${ubt2.neighborhood}`,
      selectedDate: toDateKey(addDays(today, -45)),
      selectedDoctorId: dr6.id,
      selectedDoctorName: dr6.name,
      selectedTime: '14:20',
      durationMinutes: 35,
    }),
    buildAppointment(patientCpf, 8, {
      protocol: 'TF-2026-29044',
      status: 'cancelled',
      specialtyId: dr1.specialtyId,
      specialtyName: dr1.specialtyName,
      selectedUbtId: ubt1.id,
      selectedUbtName: ubt1.name,
      selectedUbtAddress: `${ubt1.address} · ${ubt1.neighborhood}`,
      selectedDate: toDateKey(addDays(today, -6)),
      selectedDoctorId: dr1.id,
      selectedDoctorName: dr1.name,
      selectedTime: '08:40',
      cancelledAt: new Date().toISOString(),
      cancelReason: 'Conflito de horário',
    }),
    buildAppointment(patientCpf, 9, {
      protocol: 'TF-2026-11856',
      status: 'cancelled',
      specialtyId: dr2.specialtyId,
      specialtyName: dr2.specialtyName,
      selectedUbtId: ubt4.id,
      selectedUbtName: ubt4.name,
      selectedUbtAddress: `${ubt4.address} · ${ubt4.neighborhood}`,
      selectedDate: toDateKey(addDays(today, -22)),
      selectedDoctorId: dr2.id,
      selectedDoctorName: dr2.name,
      selectedTime: '09:00',
      cancelledAt: new Date().toISOString(),
      cancelReason: 'Viagem imprevista',
    }),
  ]
}

function isSeedAppointment(appointment: StoredAppointment, patientCpf: string) {
  return appointment.id.startsWith(`apt-seed-${patientCpf}-`)
}

export async function fetchMyAppointments(patientCpf: string): Promise<StoredAppointment[]> {
  await delay(MOCK_DELAY_MS)

  const stored = await loadAppointments(patientCpf)
  const userAppointments = stored.filter((item) => !isSeedAppointment(item, patientCpf))
  const storedSeeds = stored.filter((item) => isSeedAppointment(item, patientCpf))
  const freshSeeds = createSeedAppointments(patientCpf)

  const seedById = new Map(freshSeeds.map((item) => [item.id, item]))
  for (const storedSeed of storedSeeds) {
    seedById.set(storedSeed.id, storedSeed)
  }

  const merged = [...userAppointments, ...Array.from(seedById.values())]

  await saveAppointmentsForPatient(patientCpf, merged)
  return merged
}

export async function createAppointmentFromDraft(
  patientCpf: string,
  payload: CreateAppointmentPayload,
): Promise<StoredAppointment> {
  await delay(MOCK_DELAY_MS)

  const appointment: StoredAppointment = {
    id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    protocol: generateAppointmentProtocol(),
    patientCpf,
    status: 'confirmed',
    ...payload,
    createdAt: new Date().toISOString(),
  }

  await upsertAppointment(appointment)
  return appointment
}

export async function cancelMyAppointment(
  patientCpf: string,
  appointmentId: string,
  cancelReason?: string,
): Promise<StoredAppointment | null> {
  await delay(MOCK_DELAY_MS)

  return updateAppointment(patientCpf, appointmentId, {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
    cancelReason: cancelReason?.trim() || undefined,
  })
}
