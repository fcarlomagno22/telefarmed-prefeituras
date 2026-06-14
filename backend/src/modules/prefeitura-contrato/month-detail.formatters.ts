import { formatCpfDisplay } from '../admin-credenciais/formatters.js'

export type ConsultaOperacionalRow = {
  id: string
  paciente_nome: string
  paciente_cpf: string
  paciente_data_nascimento: string | null
  finalizada_em: string | null
  especialidade_nome: string
  duracao_minutos: number | null
  iniciada_em: string | null
  criado_em: string
}

export type MonthConsultationDto = {
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

function computeAge(dataNascimento: string | null, reference: Date): number {
  if (!dataNascimento) return 0
  const birth = new Date(`${dataNascimento}T12:00:00`)
  if (Number.isNaN(birth.getTime())) return 0
  let age = reference.getFullYear() - birth.getFullYear()
  const monthDiff = reference.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
    age -= 1
  }
  return Math.max(0, age)
}

function formatSpDateTime(isoTimestamp: string): { date: string; time: string } {
  const date = new Date(isoTimestamp)
  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const time = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
  return { date: dateLabel, time }
}

function computeDurationMinutes(row: ConsultaOperacionalRow): number {
  if (typeof row.duracao_minutos === 'number' && row.duracao_minutos >= 0) {
    return row.duracao_minutos
  }
  const start = row.iniciada_em ?? row.criado_em
  const end = row.finalizada_em
  if (!start || !end) return 0
  const minutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000)
  return Math.max(0, minutes)
}

export function monthLabelLong(year: number, month: number): string {
  const date = new Date(year, month - 1, 1)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function mapMonthConsultations(rows: ConsultaOperacionalRow[]): MonthConsultationDto[] {
  const reference = new Date()

  return rows.map((row, index) => {
    const finalized = row.finalizada_em ?? row.criado_em
    const { date, time } = formatSpDateTime(finalized)

    return {
      id: row.id,
      lineNumber: index + 1,
      patientName: row.paciente_nome,
      cpf: formatCpfDisplay(String(row.paciente_cpf)),
      age: computeAge(row.paciente_data_nascimento, reference),
      date,
      time,
      specialty: row.especialidade_nome,
      durationMinutes: computeDurationMinutes(row),
    }
  })
}

