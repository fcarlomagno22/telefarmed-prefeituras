import { supabaseAdmin } from '../../db/supabase.js'
import {
  ageFromBirthDateIso,
  readEnderecoField,
} from '../admin-pacientes/formatters.js'
import type { UbtPacientesAboutDto, UbtPacientesSummaryDto } from './types.js'

type PatientRow = {
  id: string
  data_nascimento: string
  sexo: string
  endereco: Record<string, unknown> | null
  criado_em: string
}

const GENDER_GRADIENTS = {
  Feminino: { gradientFrom: '#c4b5fd', gradientTo: '#7c3aed' },
  Masculino: { gradientFrom: '#fdba74', gradientTo: '#ea580c' },
} as const

function ageBucket(age: number): string {
  if (age <= 17) return '0–17 anos'
  if (age <= 29) return '18–29 anos'
  if (age <= 59) return '30–59 anos'
  return '60+ anos'
}

function toPercent(count: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

export async function getUbtPacientesSummary(
  entidadeId: string,
): Promise<{ summary: UbtPacientesSummaryDto; about: UbtPacientesAboutDto }> {
  const { data: patients, error: patientsError } = await supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('id, data_nascimento, sexo, endereco, criado_em')
    .eq('entidade_contratante_id', entidadeId)
    .neq('status', 'inativo')

  if (patientsError) throw patientsError

  const rows = (patients ?? []) as PatientRow[]
  const patientIds = rows.map((row) => row.id)
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const newUsers = rows.filter((row) => {
    const created = new Date(row.criado_em)
    return created.getMonth() === currentMonth && created.getFullYear() === currentYear
  }).length

  let totalAppointments = 0
  let attendedThisMonth = 0
  const neighborhoodAppointments = new Map<string, number>()

  if (patientIds.length > 0) {
    const { data: consultas, error: consultasError } = await supabaseAdmin
      .from('consultas')
      .select('id, paciente_id, criado_em, finalizada_em, status')
      .in('paciente_id', patientIds)

    if (consultasError && consultasError.code !== 'PGRST205') throw consultasError

    const patientBairro = new Map<string, string>()
    for (const row of rows) {
      const bairro = readEnderecoField(row.endereco, 'bairro').trim() || 'Não informado'
      patientBairro.set(row.id, bairro)
    }

    for (const consulta of consultas ?? []) {
      totalAppointments += 1
      const reference = String(consulta.finalizada_em ?? consulta.criado_em)
      const date = new Date(reference)
      if (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        consulta.status === 'concluida'
      ) {
        attendedThisMonth += 1
      }

      const bairro = patientBairro.get(String(consulta.paciente_id)) ?? 'Não informado'
      neighborhoodAppointments.set(bairro, (neighborhoodAppointments.get(bairro) ?? 0) + 1)
    }
  }

  const ageBuckets = new Map<string, number>([
    ['0–17 anos', 0],
    ['18–29 anos', 0],
    ['30–59 anos', 0],
    ['60+ anos', 0],
  ])
  const genderBuckets = new Map<string, number>([
    ['Feminino', 0],
    ['Masculino', 0],
  ])

  for (const row of rows) {
    const age = ageFromBirthDateIso(row.data_nascimento.slice(0, 10))
    ageBuckets.set(ageBucket(age), (ageBuckets.get(ageBucket(age)) ?? 0) + 1)

    if (row.sexo === 'feminino') {
      genderBuckets.set('Feminino', (genderBuckets.get('Feminino') ?? 0) + 1)
    } else if (row.sexo === 'masculino') {
      genderBuckets.set('Masculino', (genderBuckets.get('Masculino') ?? 0) + 1)
    }
  }

  const totalPatients = rows.length

  return {
    summary: {
      totalUsers: totalPatients,
      newUsers,
      totalAppointments,
      attendedThisMonth,
    },
    about: {
      ageDistribution: Array.from(ageBuckets.entries()).map(([label, count]) => ({
        label,
        percent: toPercent(count, totalPatients),
      })),
      genderDistribution: Array.from(genderBuckets.entries()).map(([label, count]) => ({
        label,
        percent: toPercent(count, totalPatients),
        gradientFrom: GENDER_GRADIENTS[label as keyof typeof GENDER_GRADIENTS]?.gradientFrom ?? '#d1d5db',
        gradientTo: GENDER_GRADIENTS[label as keyof typeof GENDER_GRADIENTS]?.gradientTo ?? '#9ca3af',
      })),
      topNeighborhoodsByAppointments: Array.from(neighborhoodAppointments.entries())
        .map(([label, appointments]) => ({ label, appointments }))
        .sort((a, b) => b.appointments - a.appointments)
        .slice(0, 5),
    },
  }
}
