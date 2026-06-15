import {
  ScheduleDoctor,
  ScheduleSpecialty,
  ScheduleTimeSlot,
} from '../types/scheduleAppointment'
import {
  addDays,
  getScheduleStartDate,
  SCHEDULE_DAY_COUNT,
  toDateKey,
} from '../utils/scheduleDate'

const SLOT_TIMES = [
  '08:00', '08:20', '08:40', '09:00', '09:20', '09:40',
  '10:00', '10:20', '10:40', '11:00', '11:20', '11:40',
  '12:00', '14:00', '14:20', '14:40',
] as const

export const scheduleDoctors: ScheduleDoctor[] = [
  {
    id: 'sch-dr-1',
    name: 'Dr. Marcos Silva',
    specialtyId: '4',
    specialtyName: 'Clínica Geral',
    avatarUrl: 'https://i.pravatar.cc/120?img=12',
    crm: 'CRM-SP 145872',
    rating: 4.8,
    reviewCount: 128,
  },
  {
    id: 'sch-dr-2',
    name: 'Dra. Ana Costa',
    specialtyId: '3',
    specialtyName: 'Pediatria',
    avatarUrl: 'https://i.pravatar.cc/120?img=5',
    crm: 'CRM-SP 982341',
    rating: 4.9,
    reviewCount: 96,
  },
  {
    id: 'sch-dr-3',
    name: 'Dr. Paulo Mendes',
    specialtyId: '7',
    specialtyName: 'Cardiologia',
    avatarUrl: 'https://i.pravatar.cc/120?img=33',
    crm: 'CRM-SP 771204',
    rating: 4.5,
    reviewCount: 74,
  },
  {
    id: 'sch-dr-4',
    name: 'Dra. Carla Souza',
    specialtyId: '14',
    specialtyName: 'Dermatologia',
    avatarUrl: 'https://i.pravatar.cc/120?img=9',
    crm: 'CRM-SP 556901',
    rating: 4.7,
    reviewCount: 61,
  },
  {
    id: 'sch-dr-5',
    name: 'Dr. Lucas Ferreira',
    specialtyId: '16',
    specialtyName: 'Gastroenterologia',
    avatarUrl: 'https://i.pravatar.cc/120?img=15',
    crm: 'CRM-SP 334118',
    rating: 4.6,
    reviewCount: 42,
  },
  {
    id: 'sch-dr-6',
    name: 'Dra. Helena Rocha',
    specialtyId: '18',
    specialtyName: 'Geriatria',
    avatarUrl: 'https://i.pravatar.cc/120?img=23',
    crm: 'CRM-SP 889012',
    rating: 4.9,
    reviewCount: 88,
  },
  {
    id: 'sch-dr-7',
    name: 'Dra. Júlia Martins',
    specialtyId: '19',
    specialtyName: 'Ginecologia',
    avatarUrl: 'https://i.pravatar.cc/120?img=32',
    crm: 'CRM-SP 221445',
    rating: 4.8,
    reviewCount: 103,
  },
  {
    id: 'sch-dr-8',
    name: 'Dr. Ricardo Alves',
    specialtyId: '26',
    specialtyName: 'Neurologia',
    avatarUrl: 'https://i.pravatar.cc/120?img=52',
    crm: 'CRM-SP 667823',
    rating: 4.4,
    reviewCount: 55,
  },
  {
    id: 'sch-dr-9',
    name: 'Dra. Patrícia Lima',
    specialtyId: '337',
    specialtyName: 'Nutrologia Adulto',
    avatarUrl: 'https://i.pravatar.cc/120?img=47',
    crm: 'CRM-SP 112903',
    rating: 4.7,
    reviewCount: 39,
  },
  {
    id: 'sch-dr-10',
    name: 'Dr. Gustavo Nery',
    specialtyId: '132',
    specialtyName: 'Ortopedia e Traumatologia',
    avatarUrl: 'https://i.pravatar.cc/120?img=68',
    crm: 'CRM-SP 445601',
    rating: 4.5,
    reviewCount: 67,
  },
  {
    id: 'sch-dr-11',
    name: 'Dr. Felipe Brandão',
    specialtyId: '29',
    specialtyName: 'Otorrinolaringologia',
    avatarUrl: 'https://i.pravatar.cc/120?img=59',
    crm: 'CRM-SP 778234',
    rating: 4.6,
    reviewCount: 48,
  },
  {
    id: 'sch-dr-12',
    name: 'Dra. Marina Dias',
    specialtyId: '33',
    specialtyName: 'Psicologia',
    avatarUrl: 'https://i.pravatar.cc/120?img=26',
    crm: 'CRP-SP 06/88421',
    rating: 4.9,
    reviewCount: 112,
  },
  {
    id: 'sch-dr-13',
    name: 'Dr. André Campos',
    specialtyId: '38',
    specialtyName: 'Urologia',
    avatarUrl: 'https://i.pravatar.cc/120?img=11',
    crm: 'CRM-SP 903441',
    rating: 4.5,
    reviewCount: 53,
  },
  {
    id: 'sch-dr-14',
    name: 'Dra. Fernanda Prado',
    specialtyId: '179',
    specialtyName: 'Medicina da Família',
    avatarUrl: 'https://i.pravatar.cc/120?img=48',
    crm: 'CRM-SP 551902',
    rating: 4.8,
    reviewCount: 91,
  },
  {
    id: 'sch-dr-15',
    name: 'Dr. Eduardo Viana',
    specialtyId: '4',
    specialtyName: 'Clínica Geral',
    avatarUrl: 'https://i.pravatar.cc/120?img=60',
    crm: 'CRM-SP 228771',
    rating: 4.6,
    reviewCount: 44,
  },
]

function hashSeed(...parts: string[]): number {
  let hash = 0
  for (const part of parts) {
    for (let i = 0; i < part.length; i++) {
      hash = (hash * 31 + part.charCodeAt(i)) | 0
    }
  }
  return Math.abs(hash)
}

function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getNextScheduleDays(count: number, fromDate: Date): Date[] {
  return Array.from({ length: count }, (_, index) => addDays(fromDate, index))
}

export function getDoctorsForSpecialty(specialtyId: string): ScheduleDoctor[] {
  return scheduleDoctors.filter((doctor) => doctor.specialtyId === specialtyId)
}

export function searchScheduleDoctors(query: string, specialtyId?: string): ScheduleDoctor[] {
  const normalized = query.trim().toLowerCase()
  let list = specialtyId ? getDoctorsForSpecialty(specialtyId) : scheduleDoctors

  if (!normalized) return list

  return list.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(normalized) ||
      doctor.specialtyName.toLowerCase().includes(normalized) ||
      doctor.crm.toLowerCase().includes(normalized),
  )
}

export function getDoctorAvailableSlots(doctorId: string, date: Date): ScheduleTimeSlot[] {
  const dateKey = toDateKey(date)

  return SLOT_TIMES.map((time) => {
    const seed = hashSeed(doctorId, dateKey, time)
    const blocked = seed % 7 === 0

    return {
      time,
      available: !blocked,
      bookedReason: blocked ? 'Consulta já reservada' : undefined,
    }
  })
}

export function countAvailableSlots(doctorId: string, date: Date): number {
  return getDoctorAvailableSlots(doctorId, date).filter((slot) => slot.available).length
}

export function getDoctorsAvailableOnDay(specialtyId: string, date: Date): ScheduleDoctor[] {
  return getDoctorsForSpecialty(specialtyId).filter(
    (doctor) => countAvailableSlots(doctor.id, date) > 0,
  )
}

export function countSpecialtyAvailableSlotsOnDay(specialtyId: string, date: Date): number {
  return getDoctorsAvailableOnDay(specialtyId, date).reduce(
    (sum, doctor) => sum + countAvailableSlots(doctor.id, date),
    0,
  )
}

export type DoctorDayAvailability = {
  date: Date
  worksThisDay: boolean
  availableSlots: number
}

export function getDoctorScheduleOverview(
  doctorId: string,
  fromDate: Date,
  dayCount: number,
): DoctorDayAvailability[] {
  return getNextScheduleDays(dayCount, fromDate).map((date) => ({
    date,
    worksThisDay: true,
    availableSlots: countAvailableSlots(doctorId, date),
  }))
}

export function countTotalAvailableSlots(
  doctorId: string,
  fromDate: Date,
  dayCount: number,
): number {
  return getDoctorScheduleOverview(doctorId, fromDate, dayCount).reduce(
    (sum, day) => sum + day.availableSlots,
    0,
  )
}

export async function fetchScheduleSpecialties(): Promise<ScheduleSpecialty[]> {
  await delay()

  const specialtyMap = new Map<string, string>()
  for (const doctor of scheduleDoctors) {
    specialtyMap.set(doctor.specialtyId, doctor.specialtyName)
  }

  const start = getScheduleStartDate()

  return Array.from(specialtyMap.entries())
    .map(([id, name]) => {
      let totalSlots = 0
      for (let i = 0; i < SCHEDULE_DAY_COUNT; i++) {
        totalSlots += countSpecialtyAvailableSlotsOnDay(id, addDays(start, i))
      }
      return { id, name, availableSlots: totalSlots }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function fetchDoctorsForSpecialty(
  specialtyId: string,
  date: Date,
): Promise<ScheduleDoctor[]> {
  await delay()
  return getDoctorsForSpecialty(specialtyId)
}

export async function fetchDoctorsAvailableOnDay(
  specialtyId: string,
  date: Date,
): Promise<ScheduleDoctor[]> {
  await delay()
  return getDoctorsAvailableOnDay(specialtyId, date)
}

export async function fetchDoctorSlots(doctorId: string, date: Date): Promise<ScheduleTimeSlot[]> {
  await delay(120)
  return getDoctorAvailableSlots(doctorId, date)
}

export async function fetchSpecialtyDaySlotCounts(
  specialtyId: string,
  days: Date[],
): Promise<Map<string, number>> {
  await delay()
  const entries = days.map((date) => [
    toDateKey(date),
    countSpecialtyAvailableSlotsOnDay(specialtyId, date),
  ] as const)
  return new Map(entries)
}

export async function fetchDoctorScheduleOverview(
  doctorId: string,
  fromDate: Date,
  dayCount: number,
): Promise<DoctorDayAvailability[]> {
  await delay()
  return getDoctorScheduleOverview(doctorId, fromDate, dayCount)
}

export async function fetchDoctorTotalUpcoming(
  doctorId: string,
  fromDate: Date,
  dayCount: number,
): Promise<number> {
  await delay(80)
  return countTotalAvailableSlots(doctorId, fromDate, dayCount)
}

export async function submitScheduleAppointment(_payload: {
  pacienteId: string
  profissionalId: string
  especialidadeId: string
  data: string
  hora: string
  telefoneContato?: string
}): Promise<void> {
  await delay(600)
}
