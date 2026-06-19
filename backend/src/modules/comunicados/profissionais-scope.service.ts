import { supabaseAdmin } from '../../db/supabase.js'
import { applyNestedEscalaSlotContratoOverlapFilter } from '../../lib/escalaContratoScope.js'
import { ComunicadosError } from './errors.js'
import type { DestinatarioInsert } from './types.js'

export type ProfissionalRecipientRow = {
  id: string
  nome: string
  especialidade: string
}

async function loadProfissionaisByIds(ids: string[]): Promise<ProfissionalRecipientRow[]> {
  if (ids.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, nome, especialidade')
    .eq('status', 'ativo')
    .in('id', ids)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: String(row.id),
    nome: String(row.nome),
    especialidade: String(row.especialidade ?? ''),
  }))
}

async function loadContratoIdsForEntidade(entidadeId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('contratos_entidade')
    .select('id')
    .eq('entidade_contratante_id', entidadeId)
    .in('status', ['ativo', 'suspensa'])

  if (error) throw error
  return (data ?? []).map((row) => String(row.id))
}

/** Profissionais vinculados à prefeitura (credenciais / atuação no contrato municipal). */
export async function listProfissionaisForEntidade(
  entidadeId: string,
  filters?: { search?: string; specialtyFilter?: string },
): Promise<ProfissionalRecipientRow[]> {
  const [linkedRows, consultaRows, contratoIds] = await Promise.all([
    supabaseAdmin
      .from('usuarios_profissionais')
      .select('id, nome, especialidade')
      .eq('status', 'ativo')
      .eq('entidade_contratante_id', entidadeId),
    supabaseAdmin
      .from('consultas')
      .select('profissional_id')
      .eq('entidade_contratante_id', entidadeId)
      .not('profissional_id', 'is', null),
    loadContratoIdsForEntidade(entidadeId),
  ])

  if (linkedRows.error) throw linkedRows.error
  if (consultaRows.error) throw consultaRows.error

  const ids = new Set<string>()
  const byId = new Map<string, ProfissionalRecipientRow>()

  for (const row of linkedRows.data ?? []) {
    const id = String(row.id)
    ids.add(id)
    byId.set(id, {
      id,
      nome: String(row.nome),
      especialidade: String(row.especialidade ?? ''),
    })
  }

  for (const row of consultaRows.data ?? []) {
    if (row.profissional_id) ids.add(String(row.profissional_id))
  }

  if (contratoIds.length > 0) {
    let plantaoQuery = supabaseAdmin
      .from('escala_plantoes_confirmados')
      .select('profissional_id, escala_slots!inner(contrato_entidade_id)')
      .in('status', ['confirmado', 'realizado'])

    plantaoQuery = applyNestedEscalaSlotContratoOverlapFilter(plantaoQuery, contratoIds)

    const { data: plantaoRows, error: plantaoError } = await plantaoQuery

    if (plantaoError) throw plantaoError
    for (const row of plantaoRows ?? []) {
      if (row.profissional_id) ids.add(String(row.profissional_id))
    }
  }

  const missingIds = [...ids].filter((id) => !byId.has(id))
  if (missingIds.length > 0) {
    const extras = await loadProfissionaisByIds(missingIds)
    for (const item of extras) byId.set(item.id, item)
  }

  let result = [...byId.values()]

  const search = filters?.search?.trim().toLowerCase()
  if (search) {
    result = result.filter((item) =>
      [item.nome, item.especialidade].join(' ').toLowerCase().includes(search),
    )
  }

  if (filters?.specialtyFilter?.trim()) {
    const needle = filters.specialtyFilter.trim().toLowerCase()
    result = result.filter((item) => item.especialidade.toLowerCase().includes(needle))
  }

  return result.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

/** Profissionais vinculados à UBT (atendimentos / agenda / plantões na unidade). */
export async function listProfissionaisForUbt(
  entidadeId: string,
  unitId: string,
  filters?: { search?: string },
): Promise<ProfissionalRecipientRow[]> {
  const { data: unit, error: unitError } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id')
    .eq('id', unitId)
    .eq('entidade_contratante_id', entidadeId)
    .eq('status', 'ativo')
    .maybeSingle()

  if (unitError) throw unitError
  if (!unit) {
    throw new ComunicadosError('Unidade UBT inválida para esta entidade.', 'INVALID_DATA', 400)
  }

  const [consultaRows, agendaRows, contratoIds] = await Promise.all([
    supabaseAdmin
      .from('consultas')
      .select('profissional_id')
      .eq('unidade_ubt_id', unitId)
      .not('profissional_id', 'is', null),
    supabaseAdmin
      .from('agenda_consultas')
      .select('profissional_id')
      .eq('unidade_ubt_id', unitId)
      .not('profissional_id', 'is', null),
    loadContratoIdsForEntidade(entidadeId),
  ])

  if (consultaRows.error) throw consultaRows.error
  if (agendaRows.error) throw agendaRows.error

  const ids = new Set<string>()
  for (const row of consultaRows.data ?? []) {
    if (row.profissional_id) ids.add(String(row.profissional_id))
  }
  for (const row of agendaRows.data ?? []) {
    if (row.profissional_id) ids.add(String(row.profissional_id))
  }

  if (contratoIds.length > 0) {
    let plantaoQuery = supabaseAdmin
      .from('escala_plantoes_confirmados')
      .select('profissional_id, escala_slots!inner(contrato_entidade_id, escopo_ubt, modalidade)')
      .in('status', ['confirmado', 'realizado'])

    plantaoQuery = applyNestedEscalaSlotContratoOverlapFilter(plantaoQuery, contratoIds)

    const { data: plantaoRows, error: plantaoError } = await plantaoQuery

    if (plantaoError) throw plantaoError

    for (const row of plantaoRows ?? []) {
      const slotRaw = row.escala_slots
      const slot = (Array.isArray(slotRaw) ? slotRaw[0] : slotRaw) as {
        escopo_ubt?: unknown
        modalidade?: string
      } | null

      if (!row.profissional_id || !slot) continue

      const escopo = slot.escopo_ubt
      if (escopo && typeof escopo === 'object' && escopo !== null) {
        const scopeObj = escopo as { unitIds?: string[]; mode?: string }
        const unitIds = Array.isArray(scopeObj.unitIds) ? scopeObj.unitIds.map(String) : []
        if (scopeObj.mode === 'selected' && unitIds.length > 0 && !unitIds.includes(unitId)) {
          continue
        }
      }

      ids.add(String(row.profissional_id))
    }
  }

  let result = await loadProfissionaisByIds([...ids])

  const search = filters?.search?.trim().toLowerCase()
  if (search) {
    result = result.filter((item) =>
      [item.nome, item.especialidade].join(' ').toLowerCase().includes(search),
    )
  }

  return result.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export function mapProfissionaisToDestinatarios(
  profissionais: ProfissionalRecipientRow[],
): DestinatarioInsert[] {
  return profissionais.map((item) => ({
    tipo: 'profissional',
    profissionalId: item.id,
    rotuloDestinatario: item.nome,
  }))
}

export async function resolvePrefeituraProfissionaisRecipients(input: {
  entidadeId: string
  mode: 'all' | 'selected'
  profissionalIds?: string[]
}): Promise<{ destinatarios: DestinatarioInsert[]; summary: string }> {
  const scoped = await listProfissionaisForEntidade(input.entidadeId)
  if (scoped.length === 0) {
    throw new ComunicadosError(
      'Nenhum profissional vinculado a esta prefeitura.',
      'NO_RECIPIENTS',
      400,
    )
  }

  let selected = scoped
  if (input.mode === 'selected') {
    const allowed = new Set(scoped.map((item) => item.id))
    selected = scoped.filter((item) => input.profissionalIds?.includes(item.id) && allowed.has(item.id))
    if (selected.length === 0) {
      throw new ComunicadosError('Selecione ao menos um profissional válido.', 'NO_RECIPIENTS', 400)
    }
  }

  return {
    destinatarios: mapProfissionaisToDestinatarios(selected),
    summary: `${selected.length} profissional${selected.length === 1 ? '' : 'is'}`,
  }
}

export async function resolveUbtProfissionaisRecipients(input: {
  entidadeId: string
  unitId: string
  mode: 'all' | 'selected'
  profissionalIds?: string[]
}): Promise<{ destinatarios: DestinatarioInsert[]; summary: string }> {
  const scoped = await listProfissionaisForUbt(input.entidadeId, input.unitId)
  if (scoped.length === 0) {
    throw new ComunicadosError(
      'Nenhum profissional vinculado a esta UBT.',
      'NO_RECIPIENTS',
      400,
    )
  }

  let selected = scoped
  if (input.mode === 'selected') {
    const allowed = new Set(scoped.map((item) => item.id))
    selected = scoped.filter((item) => input.profissionalIds?.includes(item.id) && allowed.has(item.id))
    if (selected.length === 0) {
      throw new ComunicadosError('Selecione ao menos um profissional válido.', 'NO_RECIPIENTS', 400)
    }
  }

  return {
    destinatarios: mapProfissionaisToDestinatarios(selected),
    summary: `${selected.length} profissional${selected.length === 1 ? '' : 'is'}`,
  }
}
