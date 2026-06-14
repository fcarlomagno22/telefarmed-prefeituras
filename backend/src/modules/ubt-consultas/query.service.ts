import { supabaseAdmin } from '../../db/supabase.js'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import {
  mapGenderToSexo,
  mapUiStatusToDb,
  type ConsultaOperacionalRow,
} from './formatters.js'
import type { UbtConsultasListQuery, UbtConsultasScope } from './types.js'

const LIST_SELECT = `
  id,
  codigo_atendimento,
  paciente_id,
  profissional_id,
  especialidade_id,
  tipo,
  status,
  criado_em,
  iniciada_em,
  finalizada_em,
  duracao_minutos,
  paciente_nome,
  paciente_cpf,
  paciente_sexo,
  paciente_data_nascimento,
  paciente_bairro,
  profissional_nome,
  profissional_conselho_sigla,
  profissional_conselho_numero,
  profissional_conselho_uf,
  especialidade_nome
`

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function periodBounds(periodStart: string, periodEnd: string) {
  return {
    startIso: `${periodStart}T00:00:00.000-03:00`,
    endIso: `${periodEnd}T23:59:59.999-03:00`,
  }
}

function birthDateBoundsForAgeRange(ageRange: UbtConsultasListQuery['ageRange']) {
  if (!ageRange) return null

  const today = new Date()
  const toIso = (date: Date) => date.toISOString().slice(0, 10)

  const yearsAgo = (years: number) => {
    const copy = new Date(today)
    copy.setFullYear(copy.getFullYear() - years)
    return copy
  }

  switch (ageRange) {
    case '0-17':
      return { minBirthDateExclusive: toIso(yearsAgo(18)) }
    case '18-39':
      return { minBirthDate: toIso(yearsAgo(39)), maxBirthDate: toIso(yearsAgo(18)) }
    case '40-59':
      return { minBirthDate: toIso(yearsAgo(59)), maxBirthDate: toIso(yearsAgo(40)) }
    case '60+':
      return { maxBirthDate: toIso(yearsAgo(60)) }
    default:
      return null
  }
}

function applyCommonFilters(
  query: PostgrestFilterBuilder<any, any, any, any, any>,
  scope: UbtConsultasScope,
  params: UbtConsultasListQuery,
): PostgrestFilterBuilder<any, any, any, any, any> {
  const { startIso, endIso } = periodBounds(params.periodStart, params.periodEnd)

  let next = query
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .gte('criado_em', startIso)
    .lte('criado_em', endIso)

  if (params.specialty) {
    next = next.eq('especialidade_id', params.specialty)
  }

  if (params.doctor) {
    next = next.eq('profissional_id', params.doctor)
  }

  if (params.neighborhood) {
    next = next.eq('paciente_bairro', params.neighborhood)
  }

  if (params.gender) {
    next = next.eq('paciente_sexo', mapGenderToSexo(params.gender))
  }

  if (params.status) {
    next = next.in('status', mapUiStatusToDb(params.status))
  }

  const birthBounds = birthDateBoundsForAgeRange(params.ageRange)
  if (birthBounds) {
    if (birthBounds.minBirthDateExclusive) {
      next = next.gt('paciente_data_nascimento', birthBounds.minBirthDateExclusive)
    }
    if (birthBounds.minBirthDate) {
      next = next.gte('paciente_data_nascimento', birthBounds.minBirthDate)
    }
    if (birthBounds.maxBirthDate) {
      next = next.lte('paciente_data_nascimento', birthBounds.maxBirthDate)
    }
  }

  const search = params.generalSearch?.trim()
  if (search) {
    const digits = onlyDigits(search)
    if (digits.length === 11) {
      next = next.eq('paciente_cpf', digits)
    } else {
      const escaped = search.replace(/[%_,]/g, '')
      const term = `%${escaped}%`
      next = next.or(
        [
          `paciente_nome.ilike.${term}`,
          `profissional_nome.ilike.${term}`,
          `especialidade_nome.ilike.${term}`,
          `codigo_atendimento.ilike.${term}`,
          `paciente_bairro.ilike.${term}`,
        ].join(','),
      )
    }
  }

  return next
}

export async function fetchConsultasOperacionais(
  scope: UbtConsultasScope,
  params: UbtConsultasListQuery,
  options?: { paginate?: boolean },
): Promise<{ rows: ConsultaOperacionalRow[]; total: number }> {
  const paginate = options?.paginate ?? true
  const page = params.page
  const pageSize = params.pageSize
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabaseAdmin.from('vw_consultas_operacional').select(LIST_SELECT, { count: 'exact' })

  query = applyCommonFilters(query, scope, params)
  query = query.order('criado_em', { ascending: false })

  if (paginate) {
    query = query.range(from, to)
  }

  const { data, error, count } = await query

  if (error) {
    if (error.code === 'PGRST205') {
      return { rows: [], total: 0 }
    }
    throw error
  }

  return {
    rows: (data ?? []) as ConsultaOperacionalRow[],
    total: count ?? (data?.length ?? 0),
  }
}

export async function fetchConsultasFilterOptions(scope: UbtConsultasScope) {
  const { data, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select(
      'especialidade_id, especialidade_nome, profissional_id, profissional_nome, paciente_bairro',
    )
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .order('criado_em', { ascending: false })
    .limit(5000)

  if (error) {
    if (error.code === 'PGRST205') {
      return {
        specialties: [],
        doctors: [],
        neighborhoods: [],
      }
    }
    throw error
  }

  const specialties = new Map<string, string>()
  const doctors = new Map<string, string>()
  const neighborhoods = new Map<string, string>()

  for (const row of data ?? []) {
    const specialtyId = String(row.especialidade_id ?? '')
    const specialtyName = String(row.especialidade_nome ?? '')
    if (specialtyId && specialtyName) {
      specialties.set(specialtyId, specialtyName)
    }

    const profId = row.profissional_id ? String(row.profissional_id) : ''
    const profName = String(row.profissional_nome ?? '').trim()
    if (profId && profName) {
      doctors.set(profId, profName)
    }

    const bairro = String(row.paciente_bairro ?? '').trim()
    if (bairro && bairro !== '—') {
      neighborhoods.set(bairro, bairro)
    }
  }

  const sortByLabel = (entries: Array<[string, string]>) =>
    entries
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))

  return {
    specialties: sortByLabel([...specialties.entries()]),
    doctors: sortByLabel([...doctors.entries()]),
    neighborhoods: sortByLabel([...neighborhoods.entries()]),
  }
}
