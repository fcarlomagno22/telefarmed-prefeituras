import { formatCpfDisplay } from '../admin-credenciais/formatters.js'
import {
  ageFromBirthDateIso,
  formatIsoDateToBrazilian,
} from '../admin-pacientes/formatters.js'
import type {
  UbtConsultationRecordDto,
  UbtConsultasGenderSliceDto,
  UbtConsultasSpecialtySliceDto,
  UbtConsultasStatusSliceDto,
  UbtConsultasSummaryDto,
} from './types.js'

export type ConsultaOperacionalRow = {
  id: string
  codigo_atendimento: string
  paciente_id: string
  profissional_id: string | null
  especialidade_id: string
  tipo: string
  status: string
  criado_em: string
  iniciada_em: string | null
  finalizada_em: string | null
  duracao_minutos: number | null
  paciente_nome: string
  paciente_cpf: string
  paciente_sexo: string
  paciente_data_nascimento: string
  paciente_bairro: string | null
  profissional_nome: string | null
  profissional_conselho_sigla: string | null
  profissional_conselho_numero: string | null
  profissional_conselho_uf: string | null
  especialidade_nome: string
}

const STATUS_META: Array<
  Pick<UbtConsultasStatusSliceDto, 'key' | 'label' | 'color' | 'gradientFrom' | 'gradientTo'>
> = [
  {
    key: 'concluida',
    label: 'Concluídas',
    color: '#10b981',
    gradientFrom: '#34d399',
    gradientTo: '#059669',
  },
  {
    key: 'cancelada',
    label: 'Canceladas',
    color: '#ef4444',
    gradientFrom: '#fb7185',
    gradientTo: '#dc2626',
  },
  {
    key: 'em_andamento',
    label: 'Em andamento',
    color: '#3b82f6',
    gradientFrom: '#60a5fa',
    gradientTo: '#2563eb',
  },
]

const GENDER_META: Array<
  Pick<UbtConsultasGenderSliceDto, 'key' | 'label' | 'shortLabel' | 'gradientFrom' | 'gradientTo'>
> = [
  {
    key: 'feminino',
    label: 'Feminino',
    shortLabel: 'Fem.',
    gradientFrom: '#f9a8d4',
    gradientTo: '#db2777',
  },
  {
    key: 'masculino',
    label: 'Masculino',
    shortLabel: 'Masc.',
    gradientFrom: '#93c5fd',
    gradientTo: '#2563eb',
  },
]

export function mapDbStatusToUi(status: string): UbtConsultationRecordDto['status'] {
  if (status === 'concluida') return 'concluida'
  if (status === 'cancelada') return 'cancelada'
  return 'em_andamento'
}

export function mapUiStatusToDb(status: UbtConsultationRecordDto['status']): string[] {
  if (status === 'concluida') return ['concluida']
  if (status === 'cancelada') return ['cancelada']
  return ['aguardando_medico', 'em_andamento', 'interrompida']
}

export function mapSexoToGender(sexo: string): 'F' | 'M' {
  if (sexo === 'feminino') return 'F'
  return 'M'
}

export function mapGenderToSexo(gender: 'F' | 'M'): string {
  return gender === 'F' ? 'feminino' : 'masculino'
}

export function formatDoctorCrm(row: ConsultaOperacionalRow): string {
  const sigla = row.profissional_conselho_sigla?.trim()
  const numero = row.profissional_conselho_numero?.trim()
  const uf = row.profissional_conselho_uf?.trim()
  if (!sigla && !numero) return '—'
  const base = [sigla, numero].filter(Boolean).join(' ')
  return uf ? `${base}/${uf}` : base
}

export function computeDurationMinutes(row: ConsultaOperacionalRow): number | null {
  if (typeof row.duracao_minutos === 'number' && row.duracao_minutos >= 0) {
    return row.duracao_minutos
  }

  if (row.status !== 'concluida') return null

  const start = row.iniciada_em ?? row.criado_em
  const end = row.finalizada_em
  if (!start || !end) return null

  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return null

  return Math.max(1, Math.round((endMs - startMs) / 60_000))
}

export function mapConsultaOperacionalRow(row: ConsultaOperacionalRow): UbtConsultationRecordDto {
  const reference = row.finalizada_em ?? row.criado_em
  const dateObj = new Date(reference)
  const birthIso = String(row.paciente_data_nascimento).slice(0, 10)

  return {
    id: String(row.id),
    pacienteId: String(row.paciente_id),
    date: formatIsoDateToBrazilian(reference),
    time: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }),
    patientName: String(row.paciente_nome ?? '—'),
    cpf: formatCpfDisplay(String(row.paciente_cpf ?? '')),
    age: ageFromBirthDateIso(birthIso),
    gender: mapSexoToGender(String(row.paciente_sexo ?? '')),
    specialty: String(row.especialidade_nome ?? '—'),
    specialtyId: String(row.especialidade_id),
    doctorName: String(row.profissional_nome ?? 'Profissional de plantão'),
    doctorCrm: formatDoctorCrm(row),
    neighborhood: String(row.paciente_bairro ?? '—'),
    type: (row.tipo as UbtConsultationRecordDto['type']) ?? 'consulta',
    status: mapDbStatusToUi(String(row.status)),
    durationMinutes: computeDurationMinutes(row),
  }
}

export function buildConsultasSummary(
  records: UbtConsultationRecordDto[],
): UbtConsultasSummaryDto {
  let completed = 0
  let cancelled = 0
  let inProgress = 0

  for (const record of records) {
    if (record.status === 'concluida') completed += 1
    else if (record.status === 'cancelada') cancelled += 1
    else inProgress += 1
  }

  return {
    total: records.length,
    completed,
    cancelled,
    inProgress,
  }
}

export function buildAvgDurationMinutes(records: UbtConsultationRecordDto[]): number | null {
  const durations = records
    .filter((record) => record.status === 'concluida' && record.durationMinutes !== null)
    .map((record) => record.durationMinutes as number)

  if (durations.length === 0) return null
  const total = durations.reduce((sum, value) => sum + value, 0)
  return Math.round(total / durations.length)
}

export function buildStatusDistribution(
  records: UbtConsultationRecordDto[],
): UbtConsultasStatusSliceDto[] {
  const total = records.length
  const counts: Record<UbtConsultasStatusSliceDto['key'], number> = {
    concluida: 0,
    cancelada: 0,
    em_andamento: 0,
  }

  for (const record of records) {
    counts[record.status] += 1
  }

  return STATUS_META.map((meta) => ({
    ...meta,
    count: counts[meta.key],
    percent: total > 0 ? Math.round((counts[meta.key] / total) * 1000) / 10 : 0,
  }))
}

export function buildSpecialtyDistribution(
  records: UbtConsultationRecordDto[],
): UbtConsultasSpecialtySliceDto[] {
  const total = records.length
  const counts = new Map<string, number>()

  for (const record of records) {
    counts.set(record.specialty, (counts.get(record.specialty) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
}

export function buildGenderDistribution(
  records: UbtConsultationRecordDto[],
): UbtConsultasGenderSliceDto[] {
  const total = records.length
  const counts = { F: 0, M: 0 }

  for (const record of records) {
    counts[record.gender] += 1
  }

  return GENDER_META.map((meta) => {
    const count = meta.key === 'feminino' ? counts.F : counts.M
    return {
      ...meta,
      count,
      percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }
  })
}
