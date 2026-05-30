import {
  buildAttendanceSessionFromWaitingRoom,
  writeAttendanceSession,
} from '../../data/attendanceSession'
import type { ProfissionalQueuePatient, ProfissionalShift } from '../../types/profissionalAgenda'
import { writeWaitingRoomSession } from '../../data/waitingRoomSession'
import { brand } from '../../config/brand'
import { PROFISSIONAL_SESSION_UNIT_LABEL } from '../../config/profissionalConfig'
import { generateAttendanceId } from '../generateAttendanceId'

export function startProfissionalAttendanceFromQueue(
  patient: ProfissionalQueuePatient,
  shift: ProfissionalShift,
): string {
  const attendanceId = generateAttendanceId()

  writeWaitingRoomSession({
    patientName: patient.patientName,
    specialty: patient.specialty,
    unitName: PROFISSIONAL_SESSION_UNIT_LABEL,
    scheduledAt: patient.scheduledTime
      ? `Hoje, ${patient.scheduledTime}`
      : 'Hoje',
    professional: brand.profissionalOperatorName,
    estimatedMinutes: 15,
    queuePosition: 1,
    queueTotal: 1,
  })

  const session = buildAttendanceSessionFromWaitingRoom(
    {
      patientName: patient.patientName,
      specialty: patient.specialty,
      unitName: PROFISSIONAL_SESSION_UNIT_LABEL,
      scheduledAt: patient.scheduledTime ?? 'Hoje',
      professional: brand.profissionalOperatorName,
      estimatedMinutes: 15,
      queuePosition: 1,
      queueTotal: 1,
    },
    attendanceId,
  )

  writeAttendanceSession({
    ...session,
    doctorName: brand.profissionalOperatorName,
    doctorSpecialty: shift.specialty,
    specialty: patient.specialty,
    quickNotes: patient.triageReason,
  })

  return attendanceId
}
