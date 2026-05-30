import { adminEscalaShiftsInitial } from './adminEscalaMock'
import type { AdminEscalaShift } from '../types/adminEscala'
import { normalizeAdminEscalaShifts } from '../utils/escala/normalizeAdminEscalaShift'
import { profissionalLoggedProfile } from './profissionalPerfilMock'

type Listener = () => void

let shifts = normalizeAdminEscalaShifts(adminEscalaShiftsInitial)
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function subscribeEscalaShifts(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getEscalaShifts(): AdminEscalaShift[] {
  return shifts
}

export function setEscalaShifts(next: AdminEscalaShift[]) {
  shifts = normalizeAdminEscalaShifts(next)
  emit()
}

export function updateEscalaShifts(
  updater: (current: AdminEscalaShift[]) => AdminEscalaShift[],
) {
  setEscalaShifts(updater(shifts))
}

export function claimEscalaShift(
  shiftId: string,
  doctor?: { id: string; name: string },
): boolean {
  const profile = doctor ?? {
    id: profissionalLoggedProfile.id,
    name: profissionalLoggedProfile.fullName,
  }

  let claimed = false
  updateEscalaShifts((current) =>
    current.map((shift) => {
      if (shift.id !== shiftId) return shift
      if (shift.assignmentMode !== 'open' || shift.status !== 'publicada') return shift
      if (shift.vacancies <= 0) return shift
      if (shift.claimedCaptures.some((c) => c.doctorId === profile.id)) return shift

      claimed = true
      const vacancies = Math.max(0, shift.vacancies - 1)
      const capture = {
        doctorId: profile.id,
        doctorName: profile.name,
        claimedAt: new Date().toISOString(),
      }
      return {
        ...shift,
        vacancies,
        primaryDoctorId: shift.primaryDoctorId || profile.id,
        claimedCaptures: [...shift.claimedCaptures, capture],
        updatedAt: new Date().toISOString(),
      }
    }),
  )
  return claimed
}

export function resetEscalaShiftsToMock() {
  setEscalaShifts(adminEscalaShiftsInitial)
}
