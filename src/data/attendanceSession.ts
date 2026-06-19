import type { ConsultationDocumentItem } from '../components/attendance/ConsultationDocumentsPanel'
import type { WaitingRoomSession } from './waitingRoomSession'

export type AttendanceSession = {
  id: string
  patientName: string
  patientBirthDateIso: string
  patientAddress: string
  patientCity: string
  patientCpfMasked: string
  patientPhotoUrl: string
  doctorName: string
  doctorSpecialty: string
  doctorCrm: string
  doctorPhotoUrl: string
  doctorVideoPosterUrl: string
  unitName: string
  insuranceLabel: string
  appointmentDateLabel: string
  appointmentTimeLabel: string
  startedAtIso: string
  quickNotes: string
  specialty: string
  consultationDocuments: ConsultationDocumentItem[]
}

export const ATTENDANCE_SESSION_STORAGE_PREFIX = 'telefarmed:attendance-session:'

export function attendanceSessionStorageKey(id: string) {
  return `${ATTENDANCE_SESSION_STORAGE_PREFIX}${id}`
}

export function writeAttendanceSession(session: AttendanceSession) {
  try {
    sessionStorage.setItem(attendanceSessionStorageKey(session.id), JSON.stringify(session))
  } catch {
    // sessionStorage indisponível
  }
}

export function readAttendanceSession(id: string): AttendanceSession | null {
  try {
    const raw = sessionStorage.getItem(attendanceSessionStorageKey(id))
    if (!raw) return null
    const parsed = JSON.parse(raw) as AttendanceSession
    return {
      ...parsed,
      patientAddress: parsed.patientAddress ?? parsed.patientCity ?? '',
      consultationDocuments: parsed.consultationDocuments ?? [],
    }
  } catch {
    return null
  }
}

const DOCTOR_PHOTO =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80'
const PATIENT_PHOTO =
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80'

export function buildAttendanceSessionFromWaitingRoom(
  waiting: WaitingRoomSession | null,
  id: string,
): AttendanceSession {
  const now = new Date()
  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now)
  const timeLabel = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)

  const patientName = waiting?.patientName?.trim() || 'Ana Paula Oliveira'
  const specialty = waiting?.specialty?.trim() || 'Pediatria'

  return {
    id,
    patientName,
    patientBirthDateIso: '1998-03-15',
    patientAddress: 'Rua das Flores, 120 · Centro · Campinas, SP · CEP 13010-000',
    patientCity: 'Campinas, SP',
    patientCpfMasked: '123.456.789-**',
    patientPhotoUrl: PATIENT_PHOTO,
    doctorName: waiting?.professional?.trim() || 'Dr. João Pedro Santos',
    doctorSpecialty: specialty,
    doctorCrm: '123.456/SP',
    doctorPhotoUrl: DOCTOR_PHOTO,
    doctorVideoPosterUrl: DOCTOR_PHOTO,
    unitName: waiting?.unitName?.trim() || 'UBS Centro',
    insuranceLabel: 'SUS - Público',
    appointmentDateLabel: dateLabel,
    appointmentTimeLabel: timeLabel,
    startedAtIso: now.toISOString(),
    quickNotes:
      'Paciente relata dor de cabeça leve desde ontem, sem febre no momento.',
    specialty,
    consultationDocuments: [],
  }
}

export function appendConsultationDocument(
  session: AttendanceSession,
  document: ConsultationDocumentItem,
): AttendanceSession {
  if (session.consultationDocuments.some((item) => item.id === document.id)) {
    return session
  }

  const updated: AttendanceSession = {
    ...session,
    consultationDocuments: [...session.consultationDocuments, document],
  }

  writeAttendanceSession(updated)
  return updated
}

export function removeConsultationDocument(
  session: AttendanceSession,
  documentId: string,
): AttendanceSession {
  const updated: AttendanceSession = {
    ...session,
    consultationDocuments: session.consultationDocuments.filter(
      (item) => item.id !== documentId,
    ),
  }

  writeAttendanceSession(updated)
  return updated
}
