import { supabaseAdmin } from '../../db/supabase.js'
import {
  ageFromBirthDateIso,
  formatIsoDateToBrazilian,
  genderToSexo,
  sexoToGenderLabel,
} from '../admin-pacientes/formatters.js'
import { VdMetricasError } from './errors.js'
import {
  calculateImcFromValues,
  formatAgeLabel,
  formatHeightMeters,
  formatWeightKg,
  getImcZoneLabel,
} from './formatters.js'
import type { MetricasPerfilDto } from './types.js'
import type { PacienteMetricasPerfilRow, VdMetricasPacienteScope } from './types.js'

type PacienteDemographicsRow = {
  sexo: string | null
  data_nascimento: string | null
}

export type PacienteDemographics = {
  sexo: string | null
  birthDateIso: string | null
}

async function loadPacienteDemographics(pacienteId: string): Promise<PacienteDemographics> {
  const { data, error } = await supabaseAdmin
    .from('pacientes')
    .select('sexo, data_nascimento')
    .eq('id', pacienteId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new VdMetricasError('Paciente não encontrado.', 'NOT_FOUND', 404)
  }

  const row = data as PacienteDemographicsRow
  const birthDateIso = row.data_nascimento?.trim()?.slice(0, 10) ?? null

  return {
    sexo: row.sexo?.trim() || null,
    birthDateIso: birthDateIso && birthDateIso.length === 10 ? birthDateIso : null,
  }
}

export async function loadMetricasPerfilRow(pacienteId: string): Promise<PacienteMetricasPerfilRow | null> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_perfil')
    .select('id, paciente_id, entidade_contratante_id, altura_metros, peso_kg, criado_em, atualizado_em')
    .eq('paciente_id', pacienteId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as PacienteMetricasPerfilRow
  return {
    ...row,
    altura_metros: row.altura_metros == null ? null : Number(row.altura_metros),
    peso_kg: row.peso_kg == null ? null : Number(row.peso_kg),
  }
}

export function buildMetricasPerfilDto(
  perfil: PacienteMetricasPerfilRow | null,
  demographics: PacienteDemographics,
): MetricasPerfilDto {
  const heightMeters = perfil?.altura_metros ?? null
  const weightKg = perfil?.peso_kg ?? null
  const ageYears =
    demographics.birthDateIso != null ? ageFromBirthDateIso(demographics.birthDateIso) : null
  const hasAge = ageYears != null && ageYears > 0

  let imc: number | null = null
  let imcZone: string | null = null
  if (heightMeters != null && weightKg != null && heightMeters > 0) {
    imc = calculateImcFromValues(heightMeters, weightKg)
    imcZone = getImcZoneLabel(imc)
  }

  return {
    height: formatHeightMeters(heightMeters),
    weight: formatWeightKg(weightKg),
    birthDate: demographics.birthDateIso
      ? formatIsoDateToBrazilian(demographics.birthDateIso)
      : null,
    genderLabel: demographics.sexo ? sexoToGenderLabel(demographics.sexo) : null,
    ageYears: hasAge ? ageYears : null,
    ageLabel: hasAge ? formatAgeLabel(ageYears) : null,
    imc,
    imcZone,
  }
}

export async function fetchMetricasPerfil(scope: VdMetricasPacienteScope): Promise<MetricasPerfilDto> {
  const [perfil, demographics] = await Promise.all([
    loadMetricasPerfilRow(scope.pacienteId),
    loadPacienteDemographics(scope.pacienteId),
  ])

  return buildMetricasPerfilDto(perfil, demographics)
}

export async function persistMetricasPerfil(
  scope: VdMetricasPacienteScope,
  input: {
    heightMeters?: number
    weightKg?: number
    birthDate?: string
    gender?: 'masculino' | 'feminino' | 'outros' | 'prefiro_nao_informar'
  },
): Promise<MetricasPerfilDto> {
  const [existingPerfil, demographics] = await Promise.all([
    loadMetricasPerfilRow(scope.pacienteId),
    loadPacienteDemographics(scope.pacienteId),
  ])

  const pacientePatch: Record<string, unknown> = {}

  if (input.gender !== undefined) {
    pacientePatch.sexo = genderToSexo(input.gender)
    demographics.sexo = pacientePatch.sexo as string
  }

  if (input.birthDate !== undefined) {
    pacientePatch.data_nascimento = input.birthDate
    demographics.birthDateIso = input.birthDate
  }

  if (Object.keys(pacientePatch).length > 0) {
    const { error } = await supabaseAdmin
      .from('pacientes')
      .update(pacientePatch)
      .eq('id', scope.pacienteId)

    if (error) throw error
  }

  const shouldUpdatePerfil =
    input.heightMeters !== undefined || input.weightKg !== undefined

  let nextPerfil = existingPerfil

  if (shouldUpdatePerfil) {
    const alturaMetros = input.heightMeters ?? existingPerfil?.altura_metros ?? null
    const pesoKg = input.weightKg ?? existingPerfil?.peso_kg ?? null

    const { data, error } = await supabaseAdmin
      .from('paciente_metricas_perfil')
      .upsert(
        {
          paciente_id: scope.pacienteId,
          entidade_contratante_id: scope.entidadeContratanteId,
          altura_metros: alturaMetros,
          peso_kg: pesoKg,
        },
        { onConflict: 'paciente_id' },
      )
      .select('id, paciente_id, entidade_contratante_id, altura_metros, peso_kg, criado_em, atualizado_em')
      .single()

    if (error) throw error

    const row = data as PacienteMetricasPerfilRow
    nextPerfil = {
      ...row,
      altura_metros: row.altura_metros == null ? null : Number(row.altura_metros),
      peso_kg: row.peso_kg == null ? null : Number(row.peso_kg),
    }
  }

  return buildMetricasPerfilDto(nextPerfil, demographics)
}

export function isMetricasProfileComplete(perfil: PacienteMetricasPerfilRow | null): boolean {
  return perfil?.altura_metros != null && perfil?.peso_kg != null
}
