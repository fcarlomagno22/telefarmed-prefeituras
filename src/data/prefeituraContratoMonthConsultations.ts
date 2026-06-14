import { consultasRecords } from './consultasMock'
import type { PrefeituraContratoMonthlyRow } from '../types/prefeituraContrato'
import { specialties } from './specialties'

export type PrefeituraContratoMonthConsultation = {
  id: string
  lineNumber: number
  patientName: string
  cpf: string
  age: number
  date: string
  time: string
  specialty: string
  durationMinutes: number
}

export type PrefeituraContratoMonthKpis = {
  contracted: number
  performed: number
  usagePercent: number
  avulsoCount: number
}

export type PrefeituraContratoMonthContractMeta = {
  contractNumber: string
  periodLabel: string
  municipalityName: string
  startsAt: string
  endsAt: string
}

export type PrefeituraContratoMonthDetail = {
  month: PrefeituraContratoMonthlyRow
  monthLabelLong: string
  contractNumber: string
  contractPeriodLabel: string
  municipalityName: string
  contractStartsAtLabel: string
  contractEndsAtLabel: string
  kpis: PrefeituraContratoMonthKpis
  consultations: PrefeituraContratoMonthConsultation[]
}

function formatContractDateLabel(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
}

const MOCK_CONSULTATION_LIST_CAP = 400

const PATIENT_TEMPLATES = consultasRecords.map((record) => ({
  patientName: record.patientName,
  cpf: record.cpf,
  age: record.age,
  specialty: record.specialty,
}))

const EXTRA_NAMES = [
  'Beatriz Alencar Prado',
  'Thiago Nascimento Lopes',
  'Camila Duarte Freitas',
  'Rodrigo Pacheco Melo',
  'Larissa Moura Campos',
  'Gabriel Teixeira Ribeiro',
  'Isabela Cardoso Nunes',
  'Bruno Henrique Sales',
  'Amanda Cristina Viana',
  'Felipe Augusto Cunha',
]

const SPECIALTY_NAMES = specialties
  .filter((item) => item.available)
  .map((item) => item.name)

function monthLabelLong(year: number, month: number) {
  const date = new Date(year, month - 1, 1)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function createSeededRandom(seed: number) {
  let state = seed % 2147483646 || 1
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

function formatLineNumber(index: number) {
  return String(index + 1).padStart(4, '0')
}

function formatCpfFromSeed(random: () => number) {
  const chunk = () =>
    String(Math.floor(random() * 1000)).padStart(3, '0').slice(-3)
  const d1 = chunk()
  const d2 = chunk()
  const d3 = chunk()
  const d4 = String(Math.floor(random() * 100)).padStart(2, '0')
  return `${d1}.${d2}.${d3}-${d4}`
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export function buildPrefeituraContratoMonthKpis(
  month: PrefeituraContratoMonthlyRow,
): PrefeituraContratoMonthKpis {
  const usagePercent = Math.min(100, Math.round((month.performed / month.contracted) * 100))
  return {
    contracted: month.contracted,
    performed: month.performed,
    usagePercent,
    avulsoCount: month.avulsoCount,
  }
}

export function buildPrefeituraContratoMonthDetail(
  month: PrefeituraContratoMonthlyRow,
  contractMeta?: PrefeituraContratoMonthContractMeta,
): PrefeituraContratoMonthDetail {
  const random = createSeededRandom(month.year * 100 + month.month)
  const totalDays = daysInMonth(month.year, month.month)
  const count = Math.min(month.performed, MOCK_CONSULTATION_LIST_CAP)
  const consultations: PrefeituraContratoMonthConsultation[] = []

  for (let index = 0; index < count; index += 1) {
    const template =
      PATIENT_TEMPLATES[index % PATIENT_TEMPLATES.length] ??
      PATIENT_TEMPLATES[0]
    const nameVariant =
      index < PATIENT_TEMPLATES.length
        ? template.patientName
        : `${EXTRA_NAMES[index % EXTRA_NAMES.length]} ${String((index % 90) + 10)}`

    const day = 1 + Math.floor(random() * totalDays)
    const hour = 7 + Math.floor(random() * 12)
    const minute = [0, 15, 30, 45][Math.floor(random() * 4)]
    const specialty =
      template.specialty ??
      SPECIALTY_NAMES[Math.floor(random() * SPECIALTY_NAMES.length)] ??
      'Clínica Geral'

    consultations.push({
      id: `${month.key}-${index + 1}`,
      lineNumber: index + 1,
      patientName: nameVariant,
      cpf:
        index < PATIENT_TEMPLATES.length
          ? template.cpf
          : formatCpfFromSeed(random),
      age: Math.max(1, template.age + ((index % 5) - 2)),
      date: `${String(day).padStart(2, '0')}/${String(month.month).padStart(2, '0')}/${month.year}`,
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      specialty,
      durationMinutes: 8 + Math.floor(random() * 28),
    })
  }

  consultations.sort((a, b) => {
    const [dayA, monthA, yearA] = a.date.split('/').map(Number)
    const [dayB, monthB, yearB] = b.date.split('/').map(Number)
    const dateA = new Date(yearA, monthA - 1, dayA).getTime()
    const dateB = new Date(yearB, monthB - 1, dayB).getTime()
    if (dateA !== dateB) return dateA - dateB
    return a.time.localeCompare(b.time)
  })

  consultations.forEach((item, index) => {
    item.lineNumber = index + 1
  })

  return {
    month,
    monthLabelLong: monthLabelLong(month.year, month.month),
    contractNumber: contractMeta?.contractNumber ?? '—',
    contractPeriodLabel: contractMeta?.periodLabel ?? '—',
    municipalityName: contractMeta?.municipalityName ?? '—',
    contractStartsAtLabel: contractMeta
      ? formatContractDateLabel(contractMeta.startsAt)
      : '—',
    contractEndsAtLabel: contractMeta ? formatContractDateLabel(contractMeta.endsAt) : '—',
    kpis: buildPrefeituraContratoMonthKpis(month),
    consultations,
  }
}

export function formatPrefeituraContratoLineNumber(lineNumber: number) {
  return formatLineNumber(lineNumber - 1)
}
