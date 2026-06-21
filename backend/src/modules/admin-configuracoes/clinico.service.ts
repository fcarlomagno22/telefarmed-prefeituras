import { invalidateClinicoCatalogCache, withCatalogCache } from '../../lib/cache/catalogCache.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { ConfiguracoesError } from './errors.js'
import type {
  ClinicoCatalogDto,
  ClinicoProfessionDto,
  ClinicoSpecialtyDto,
  SaveClinicoCatalogInput,
} from './types.js'

type ProfessionRow = {
  id: string
  nome: string
  conselho_rotulo: string
  conselho_sigla: string
  ativo: boolean
  ordem: number
}

type SpecialtyViewRow = {
  id: string
  nome: string
  ativo: boolean
  ordem: number
  profissao_ids: string[] | null
}

type LinkRow = {
  especialidade_id: string
  profissao_id: string
}

function buildSpecialtyIdsByProfession(links: LinkRow[]): Map<string, string[]> {
  const map = new Map<string, string[]>()

  for (const link of links) {
    const current = map.get(link.profissao_id) ?? []
    current.push(link.especialidade_id)
    map.set(link.profissao_id, current)
  }

  for (const [professionId, specialtyIds] of map) {
    map.set(
      professionId,
      [...new Set(specialtyIds)].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    )
  }

  return map
}

function mapProfessionRow(
  row: ProfessionRow,
  specialtyIdsByProfession: Map<string, string[]>,
): ClinicoProfessionDto {
  return {
    id: row.id,
    name: row.nome,
    councilLabel: row.conselho_rotulo,
    councilAcronym: row.conselho_sigla,
    active: row.ativo,
    sortOrder: row.ordem,
    specialtyIds: specialtyIdsByProfession.get(row.id) ?? [],
  }
}

function mapSpecialtyRow(row: SpecialtyViewRow): ClinicoSpecialtyDto {
  return {
    id: row.id,
    name: row.nome,
    active: row.ativo,
    professionIds: row.profissao_ids ?? [],
    sortOrder: row.ordem,
  }
}

async function loadClinicoCatalogFromDb(options?: {
  activeOnly?: boolean
}): Promise<ClinicoCatalogDto> {
  let professionsQuery = supabaseAdmin
    .from('config_profissoes')
    .select('id, nome, conselho_rotulo, conselho_sigla, ativo, ordem')
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true })

  let specialtiesQuery = supabaseAdmin
    .from('vw_config_especialidades_com_profissoes')
    .select('id, nome, ativo, ordem, profissao_ids')
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true })

  if (options?.activeOnly) {
    professionsQuery = professionsQuery.eq('ativo', true)
    specialtiesQuery = specialtiesQuery.eq('ativo', true)
  }

  const [professionsResult, specialtiesResult] = await Promise.all([
    professionsQuery,
    specialtiesQuery,
  ])

  if (professionsResult.error) throw professionsResult.error
  if (specialtiesResult.error) throw specialtiesResult.error

  const professionIds = ((professionsResult.data ?? []) as ProfessionRow[]).map((row) => row.id)

  let linksQuery = supabaseAdmin
    .from('config_especialidade_profissao')
    .select('especialidade_id, profissao_id')

  if (options?.activeOnly && professionIds.length > 0) {
    linksQuery = linksQuery.in('profissao_id', professionIds)
  } else if (options?.activeOnly) {
    const specialtyIdsByProfession = new Map<string, string[]>()
    const professions = ((professionsResult.data ?? []) as ProfessionRow[]).map((row) =>
      mapProfessionRow(row, specialtyIdsByProfession),
    )
    const specialties = ((specialtiesResult.data ?? []) as SpecialtyViewRow[]).map(mapSpecialtyRow)
    return { professions, specialties }
  }

  const linksResult = await linksQuery
  if (linksResult.error) throw linksResult.error

  const specialtyIdsByProfession = buildSpecialtyIdsByProfession(
    (linksResult.data ?? []) as LinkRow[],
  )

  const professions = ((professionsResult.data ?? []) as ProfessionRow[]).map((row) =>
    mapProfessionRow(row, specialtyIdsByProfession),
  )

  const specialties = ((specialtiesResult.data ?? []) as SpecialtyViewRow[]).map(mapSpecialtyRow)

  return { professions, specialties }
}

export async function getClinicoCatalog(options?: {
  activeOnly?: boolean
}): Promise<ClinicoCatalogDto> {
  const cacheKey = options?.activeOnly ? 'active' : 'all'
  return withCatalogCache('clinico', cacheKey, () => loadClinicoCatalogFromDb(options))
}

export async function saveClinicoCatalog(input: SaveClinicoCatalogInput): Promise<ClinicoCatalogDto> {
  const payload = {
    professions: input.professions.map((row) => ({
      id: row.id,
      name: row.name,
      councilLabel: row.councilLabel,
      councilAcronym: row.councilAcronym,
      active: row.active,
      sortOrder: row.sortOrder,
    })),
    specialties: input.specialties.map((row) => ({
      id: row.id,
      name: row.name,
      active: row.active,
      professionIds: row.professionIds,
      sortOrder: row.sortOrder,
    })),
  }

  const { error } = await supabaseAdmin.rpc('salvar_config_clinico', {
    p_payload: payload,
  })

  if (error) {
    if (error.code === '23505') {
      throw new ConfiguracoesError(
        'Já existe uma profissão ou especialidade com este nome.',
        'DUPLICATE_NAME',
        409,
      )
    }
    throw error
  }

  invalidateClinicoCatalogCache()
  return getClinicoCatalog()
}
