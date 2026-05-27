import type { DayAppointment } from '../data/agendaMock'

export type AttendanceBreakdown = {
  attended: number
  noShows: number
  attendancePercent: number
}

/** Comparecimento = compareceram ÷ (compareceram + faltas), apenas consultas já resolvidas. */
export function computeAttendanceBreakdown(
  appointments: DayAppointment[],
): AttendanceBreakdown {
  const attended = appointments.filter((item) =>
    ['realizado', 'em_atendimento', 'aguardando'].includes(item.status),
  ).length
  const noShows = appointments.filter((item) => item.status === 'faltou').length
  const resolved = attended + noShows
  const attendancePercent =
    resolved > 0 ? Math.round((attended / resolved) * 100) : 0

  return { attended, noShows, attendancePercent }
}
