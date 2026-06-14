import { supabaseAdmin } from '../../db/supabase.js'

export type EspecialidadeRegistrada = {
  name: string
  rqe?: string
}

type CandidaturaEspecialidadeRow = {
  candidatura_id: string
  especialidade_id: string
  ordem: number
  rqe: string
}

function mapRowsToItems(
  rows: Array<{ ordem: number; rqe: string; name: string }>,
): EspecialidadeRegistrada[] {
  return rows
    .sort((a, b) => a.ordem - b.ordem)
    .map((row) => ({
      name: row.name,
      ...(row.rqe ? { rqe: row.rqe } : {}),
    }))
}

async function loadEspecialidadeNames(ids: string[]): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(ids))
  const result = new Map<string, string>()
  if (uniqueIds.length === 0) return result

  const { data, error } = await supabaseAdmin
    .from('config_especialidades')
    .select('id, nome')
    .in('id', uniqueIds)

  if (error) throw error

  for (const row of data ?? []) {
    result.set(String(row.id), String(row.nome))
  }

  return result
}

export async function loadCandidaturaEspecialidadesMap(
  candidaturaIds: string[],
): Promise<Map<string, EspecialidadeRegistrada[]>> {
  const result = new Map<string, EspecialidadeRegistrada[]>()
  if (candidaturaIds.length === 0) return result

  const { data, error } = await supabaseAdmin
    .from('candidatura_especialidades')
    .select('candidatura_id, especialidade_id, ordem, rqe')
    .in('candidatura_id', candidaturaIds)
    .order('ordem', { ascending: true })

  if (error) throw error

  const rows = (data ?? []) as CandidaturaEspecialidadeRow[]
  if (rows.length === 0) return result

  const namesById = await loadEspecialidadeNames(rows.map((row) => row.especialidade_id))
  const grouped = new Map<string, Array<{ ordem: number; rqe: string; name: string }>>()

  for (const row of rows) {
    const name = namesById.get(row.especialidade_id)
    if (!name) continue

    const candidaturaId = String(row.candidatura_id)
    const bucket = grouped.get(candidaturaId) ?? []
    bucket.push({ ordem: row.ordem, rqe: row.rqe, name })
    grouped.set(candidaturaId, bucket)
  }

  for (const [candidaturaId, bucket] of grouped) {
    result.set(candidaturaId, mapRowsToItems(bucket))
  }

  return result
}

export async function loadProfissionalEspecialidadesMap(
  profissionalIds: string[],
): Promise<Map<string, EspecialidadeRegistrada[]>> {
  const result = new Map<string, EspecialidadeRegistrada[]>()
  if (profissionalIds.length === 0) return result

  const { data: candidaturas, error: candidaturasError } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .select('id, profissional_id')
    .in('profissional_id', profissionalIds)
    .not('profissional_id', 'is', null)

  if (candidaturasError) throw candidaturasError

  const candidaturaByProfissional = new Map<string, string>()
  for (const row of candidaturas ?? []) {
    if (!row.profissional_id) continue
    candidaturaByProfissional.set(String(row.profissional_id), String(row.id))
  }

  const candidaturaIds = Array.from(new Set(candidaturaByProfissional.values()))
  const candidaturaMap = await loadCandidaturaEspecialidadesMap(candidaturaIds)

  for (const [profissionalId, candidaturaId] of candidaturaByProfissional) {
    const items = candidaturaMap.get(candidaturaId)
    if (items && items.length > 0) {
      result.set(profissionalId, items)
    }
  }

  return result
}

export function resolvePrimarySpecialty(
  fallbackName: string,
  items?: EspecialidadeRegistrada[],
): { specialty: string; specialties: EspecialidadeRegistrada[] } {
  const specialties =
    items && items.length > 0
      ? items
      : fallbackName.trim()
        ? [{ name: fallbackName.trim() }]
        : []

  return {
    specialty: specialties[0]?.name ?? fallbackName,
    specialties,
  }
}
