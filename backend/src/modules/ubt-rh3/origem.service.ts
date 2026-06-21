import { supabaseAdmin } from '../../db/supabase.js'
import type { ContratoOrigemAtendimento } from '../admin-clientes/contratoOrigemAtendimento.js'
import { normalizeContratoOrigemAtendimento } from '../admin-clientes/contratoOrigemAtendimento.js'
import { loadContratosBundleForEntidades } from '../admin-clientes/contratos.service.js'
import { loadActiveContratoIds } from '../ubt-agenda/ownership.js'

type ProfessionRef = {
  id: string
  name: string
  councilAcronym?: string | null
}

function normalizeProfessionName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function isMedicoProfession(profession: ProfessionRef): boolean {
  if (profession.id === 'prof-medicos') return true
  if (profession.councilAcronym?.trim().toUpperCase() === 'CRM') return true

  const normalized = normalizeProfessionName(profession.name)
  return normalized === 'medicos' || normalized === 'medicina' || normalized === 'medico'
}

async function loadProfessionCatalog(): Promise<Map<string, ProfessionRef>> {
  const { data, error } = await supabaseAdmin
    .from('config_profissoes')
    .select('id, nome, conselho_sigla')

  if (error) throw error

  const map = new Map<string, ProfessionRef>()
  for (const row of data ?? []) {
    map.set(String(row.id), {
      id: String(row.id),
      name: String(row.nome),
      councilAcronym: row.conselho_sigla ? String(row.conselho_sigla) : null,
    })
  }
  return map
}

async function loadSpecialtyProfessionMap(): Promise<Map<string, string[]>> {
  const { data, error } = await supabaseAdmin
    .from('config_especialidade_profissao')
    .select('especialidade_id, profissao_id')

  if (error) throw error

  const map = new Map<string, string[]>()
  for (const row of data ?? []) {
    const specialtyId = String(row.especialidade_id)
    const professionId = String(row.profissao_id)
    const current = map.get(specialtyId) ?? []
    if (!current.includes(professionId)) {
      current.push(professionId)
    }
    map.set(specialtyId, current)
  }
  return map
}

function resolveSpecialtyOrigem(
  specialtyId: string,
  origemBySpecialty: Map<string, ContratoOrigemAtendimento>,
  origemByProfession: Map<string, ContratoOrigemAtendimento>,
  specialtyProfessionMap: Map<string, string[]>,
  professionCatalog: Map<string, ProfessionRef>,
): ContratoOrigemAtendimento {
  const direct = origemBySpecialty.get(specialtyId)
  if (direct) return direct

  const professionIds = specialtyProfessionMap.get(specialtyId) ?? []
  for (const professionId of professionIds) {
    const profession = professionCatalog.get(professionId)
    if (profession && isMedicoProfession(profession)) {
      return origemBySpecialty.get(specialtyId) ?? 'mp'
    }

    const professionOrigem = origemByProfession.get(professionId)
    if (professionOrigem) return professionOrigem
  }

  return 'mp'
}

export async function loadAuthorizedSpecialtyOrigemMap(
  entidadeContratanteId: string,
): Promise<Map<string, ContratoOrigemAtendimento>> {
  const contratoIds = await loadActiveContratoIds(entidadeContratanteId)
  if (contratoIds.length === 0) return new Map()

  const [bundle, professionCatalog, specialtyProfessionMap] = await Promise.all([
    loadContratosBundleForEntidades([entidadeContratanteId]),
    loadProfessionCatalog(),
    loadSpecialtyProfessionMap(),
  ])

  const contratos = bundle.contratosByEntidade.get(entidadeContratanteId) ?? []
  const activeContratoIdSet = new Set(contratoIds)

  const origemBySpecialty = new Map<string, ContratoOrigemAtendimento>()
  const origemByProfession = new Map<string, ContratoOrigemAtendimento>()
  const authorizedSpecialtyIds = new Set<string>()

  for (const contrato of contratos) {
    if (!activeContratoIdSet.has(contrato.id)) continue
    const detalhes = contrato.detalhes
    if (!detalhes) continue

    for (const specialtyId of detalhes.especialidadesAutorizadas ?? []) {
      authorizedSpecialtyIds.add(specialtyId)
    }

    for (const item of detalhes.precosPorEspecialidade ?? []) {
      if (item.origemAtendimento === 'mt') {
        origemBySpecialty.set(item.specialtyId, 'mt')
      } else if (!origemBySpecialty.has(item.specialtyId)) {
        origemBySpecialty.set(item.specialtyId, 'mp')
      }
    }

    for (const item of detalhes.precosPorProfissao ?? []) {
      if (item.origemAtendimento === 'mt') {
        origemByProfession.set(item.professionId, 'mt')
      } else if (!origemByProfession.has(item.professionId)) {
        origemByProfession.set(item.professionId, 'mp')
      }
    }
  }

  const resolved = new Map<string, ContratoOrigemAtendimento>()
  for (const specialtyId of authorizedSpecialtyIds) {
    resolved.set(
      specialtyId,
      resolveSpecialtyOrigem(
        specialtyId,
        origemBySpecialty,
        origemByProfession,
        specialtyProfessionMap,
        professionCatalog,
      ),
    )
  }

  return resolved
}

export function pickOrigemAtendimento(
  map: Map<string, ContratoOrigemAtendimento>,
  specialtyId: string,
): ContratoOrigemAtendimento {
  return normalizeContratoOrigemAtendimento(map.get(specialtyId))
}
