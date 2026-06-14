import { scheduleDoctors } from './scheduleDoctorsMock'
import { toDateKey } from '../utils/agendaDate'

export type DoctorHourlyAttendance = {
  hour: string
  patientCount: number
}

export type DoctorStarRatingBreakdown = {
  stars: 1 | 2 | 3 | 4 | 5
  count: number
}

export type DoctorRatings = {
  average: number
  totalReviews: number
  byStars: DoctorStarRatingBreakdown[]
}

export type AgendaDoctorShiftRecord = {
  id: string
  name: string
  specialty: string
  avatarUrl: string
  loginAt: string
  logoutAt: string
  hourlyAttendance: DoctorHourlyAttendance[]
  totalPatients: number
  ratings: DoctorRatings
}

function ratings(
  average: number,
  byStars: [five: number, four: number, three: number, two: number, one: number],
): DoctorRatings {
  const breakdown: DoctorStarRatingBreakdown[] = [
    { stars: 5, count: byStars[0] },
    { stars: 4, count: byStars[1] },
    { stars: 3, count: byStars[2] },
    { stars: 2, count: byStars[3] },
    { stars: 1, count: byStars[4] },
  ]
  const totalReviews = breakdown.reduce((sum, item) => sum + item.count, 0)
  return { average, totalReviews, byStars: breakdown }
}

const SHIFT_HOURS = ['08h', '09h', '10h', '11h', '12h', '14h'] as const

const doctorsMay19: AgendaDoctorShiftRecord[] = [
  {
    id: 'dr-1',
    name: 'Dr. Marcos Silva',
    specialty: 'Clínico Geral',
    avatarUrl: 'https://i.pravatar.cc/120?img=12',
    loginAt: '07:52',
    logoutAt: '14:08',
    hourlyAttendance: [
      { hour: '08h', patientCount: 3 },
      { hour: '09h', patientCount: 4 },
      { hour: '10h', patientCount: 5 },
      { hour: '11h', patientCount: 4 },
      { hour: '12h', patientCount: 2 },
      { hour: '14h', patientCount: 1 },
    ],
    totalPatients: 19,
    ratings: ratings(4.8, [12, 5, 1, 0, 0]),
  },
  {
    id: 'dr-2',
    name: 'Dra. Ana Costa',
    specialty: 'Pediatria',
    avatarUrl: 'https://i.pravatar.cc/120?img=5',
    loginAt: '08:05',
    logoutAt: '14:15',
    hourlyAttendance: [
      { hour: '08h', patientCount: 2 },
      { hour: '09h', patientCount: 3 },
      { hour: '10h', patientCount: 4 },
      { hour: '11h', patientCount: 3 },
      { hour: '12h', patientCount: 2 },
      { hour: '14h', patientCount: 2 },
    ],
    totalPatients: 16,
    ratings: ratings(4.9, [14, 2, 0, 0, 0]),
  },
  {
    id: 'dr-3',
    name: 'Dr. Paulo Mendes',
    specialty: 'Cardiologia',
    avatarUrl: 'https://i.pravatar.cc/120?img=33',
    loginAt: '07:58',
    logoutAt: '13:55',
    hourlyAttendance: [
      { hour: '08h', patientCount: 2 },
      { hour: '09h', patientCount: 2 },
      { hour: '10h', patientCount: 3 },
      { hour: '11h', patientCount: 3 },
      { hour: '12h', patientCount: 1 },
      { hour: '14h', patientCount: 0 },
    ],
    totalPatients: 11,
    ratings: ratings(4.5, [6, 3, 1, 1, 0]),
  },
  {
    id: 'dr-4',
    name: 'Dra. Carla Souza',
    specialty: 'Dermatologia',
    avatarUrl: 'https://i.pravatar.cc/120?img=9',
    loginAt: '08:10',
    logoutAt: '14:20',
    hourlyAttendance: [
      { hour: '08h', patientCount: 1 },
      { hour: '09h', patientCount: 2 },
      { hour: '10h', patientCount: 3 },
      { hour: '11h', patientCount: 2 },
      { hour: '12h', patientCount: 2 },
      { hour: '14h', patientCount: 1 },
    ],
    totalPatients: 11,
    ratings: ratings(4.7, [7, 3, 1, 0, 0]),
  },
]

const doctorsMay18: AgendaDoctorShiftRecord[] = [
  {
    id: 'dr-1',
    name: 'Dr. Marcos Silva',
    specialty: 'Clínico Geral',
    avatarUrl: 'https://i.pravatar.cc/120?img=12',
    loginAt: '07:50',
    logoutAt: '14:00',
    hourlyAttendance: SHIFT_HOURS.map((hour, index) => ({
      hour,
      patientCount: [2, 3, 4, 3, 2, 1][index] ?? 0,
    })),
    totalPatients: 15,
    ratings: ratings(4.6, [8, 4, 2, 1, 0]),
  },
  {
    id: 'dr-2',
    name: 'Dra. Beatriz Nunes',
    specialty: 'Psiquiatria',
    avatarUrl: 'https://i.pravatar.cc/120?img=44',
    loginAt: '08:00',
    logoutAt: '14:05',
    hourlyAttendance: SHIFT_HOURS.map((hour, index) => ({
      hour,
      patientCount: [1, 2, 2, 3, 2, 1][index] ?? 0,
    })),
    totalPatients: 11,
    ratings: ratings(5.0, [9, 1, 0, 0, 0]),
  },
]

const shiftsByDateKey: Record<string, AgendaDoctorShiftRecord[]> = {
  [toDateKey(new Date(2026, 4, 19))]: doctorsMay19,
  [toDateKey(new Date(2026, 4, 18))]: doctorsMay18,
  [toDateKey(new Date(2026, 4, 17))]: doctorsMay18,
  [toDateKey(new Date(2026, 4, 16))]: doctorsMay19.slice(0, 3),
  [toDateKey(new Date(2026, 4, 15))]: doctorsMay19.slice(0, 2),
  [toDateKey(new Date(2026, 4, 14))]: doctorsMay19.slice(0, 2),
  [toDateKey(new Date(2026, 4, 20))]: doctorsMay19,
}

function hashSeed(...parts: string[]): number {
  let hash = 0
  for (const part of parts) {
    for (let index = 0; index < part.length; index += 1) {
      hash = (hash * 31 + part.charCodeAt(index)) | 0
    }
  }
  return Math.abs(hash)
}

function buildDynamicDoctorShifts(date: Date): AgendaDoctorShiftRecord[] {
  const dateKey = toDateKey(date)

  return scheduleDoctors.slice(0, 6).map((doctor, doctorIndex) => {
    const hourlyAttendance = SHIFT_HOURS.map((hour, hourIndex) => ({
      hour,
      patientCount: 1 + (hashSeed(dateKey, doctor.id, hour) % 4),
    }))
    const totalPatients = hourlyAttendance.reduce((sum, item) => sum + item.patientCount, 0)
    const average = 4.4 + (hashSeed(dateKey, doctor.id, 'rating') % 6) / 10

    return {
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialtyName,
      avatarUrl: doctor.avatarUrl,
      loginAt: doctorIndex % 2 === 0 ? '07:50' : '08:05',
      logoutAt: doctorIndex % 2 === 0 ? '14:00' : '14:15',
      hourlyAttendance,
      totalPatients,
      ratings: ratings(average, [
        8 + (doctorIndex % 4),
        3 + (doctorIndex % 3),
        1,
        doctorIndex % 2,
        0,
      ]),
    }
  })
}

export function getAgendaDoctorShifts(date: Date): AgendaDoctorShiftRecord[] {
  const dateKey = toDateKey(date)
  return shiftsByDateKey[dateKey] ?? buildDynamicDoctorShifts(date)
}
