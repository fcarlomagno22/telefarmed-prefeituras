import { supabaseAdmin } from '../../db/supabase.js'
import type { RunWalkContatoConfiancaRow } from './contatos-confianca.formatters.js'
import type { VdRunWalkPacienteScope } from './types.js'

const CONTATO_CONFIANCA_SELECT =
  'id, paciente_id, entidade_contratante_id, client_contact_id, name, phone, live_share_enabled, is_active_sos, sort_order, deleted_at, criado_em, atualizado_em'

function scopeFilters(scope: VdRunWalkPacienteScope) {
  return {
    paciente_id: scope.pacienteId,
    entidade_contratante_id: scope.entidadeContratanteId,
  }
}

export async function listContatosConfianca(
  scope: VdRunWalkPacienteScope,
): Promise<RunWalkContatoConfiancaRow[]> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_contatos_confianca')
    .select(CONTATO_CONFIANCA_SELECT)
    .match(scopeFilters(scope))
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('criado_em', { ascending: true })

  if (error) throw error

  return (data ?? []) as RunWalkContatoConfiancaRow[]
}

export async function countContatosConfianca(scope: VdRunWalkPacienteScope): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('run_walk_contatos_confianca')
    .select('id', { count: 'exact', head: true })
    .match(scopeFilters(scope))
    .is('deleted_at', null)

  if (error) throw error

  return count ?? 0
}

export async function findContatoConfiancaById(
  scope: VdRunWalkPacienteScope,
  id: string,
): Promise<RunWalkContatoConfiancaRow | null> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_contatos_confianca')
    .select(CONTATO_CONFIANCA_SELECT)
    .match(scopeFilters(scope))
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return data as RunWalkContatoConfiancaRow
}

export async function findContatoConfiancaByClientId(
  scope: VdRunWalkPacienteScope,
  clientContactId: string,
): Promise<RunWalkContatoConfiancaRow | null> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_contatos_confianca')
    .select(CONTATO_CONFIANCA_SELECT)
    .match(scopeFilters(scope))
    .eq('client_contact_id', clientContactId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return data as RunWalkContatoConfiancaRow
}

export async function resolveNextContatoSortOrder(scope: VdRunWalkPacienteScope): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_contatos_confianca')
    .select('sort_order')
    .match(scopeFilters(scope))
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  if (!data) return 0

  return Number((data as { sort_order: number }).sort_order) + 1
}

export type InsertContatoConfiancaInput = {
  clientContactId: string
  name: string
  phoneDigits: string
  liveShareEnabled: boolean
  isActiveSos: boolean
  sortOrder: number
}

export async function insertContatoConfianca(
  scope: VdRunWalkPacienteScope,
  input: InsertContatoConfiancaInput,
): Promise<RunWalkContatoConfiancaRow> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_contatos_confianca')
    .insert({
      paciente_id: scope.pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      client_contact_id: input.clientContactId,
      name: input.name,
      phone: input.phoneDigits,
      live_share_enabled: input.liveShareEnabled,
      is_active_sos: input.isActiveSos,
      sort_order: input.sortOrder,
      deleted_at: null,
    })
    .select(CONTATO_CONFIANCA_SELECT)
    .single()

  if (error) throw error

  return data as RunWalkContatoConfiancaRow
}

export type UpdateContatoConfiancaPatch = {
  name?: string
  phoneDigits?: string
  liveShareEnabled?: boolean
  isActiveSos?: boolean
  sortOrder?: number
  restore?: boolean
}

export async function updateContatoConfianca(
  scope: VdRunWalkPacienteScope,
  id: string,
  patch: UpdateContatoConfiancaPatch,
): Promise<RunWalkContatoConfiancaRow> {
  const updatePayload: Record<string, unknown> = {}

  if (patch.name !== undefined) updatePayload.name = patch.name
  if (patch.phoneDigits !== undefined) updatePayload.phone = patch.phoneDigits
  if (patch.liveShareEnabled !== undefined) {
    updatePayload.live_share_enabled = patch.liveShareEnabled
  }
  if (patch.isActiveSos !== undefined) updatePayload.is_active_sos = patch.isActiveSos
  if (patch.sortOrder !== undefined) updatePayload.sort_order = patch.sortOrder
  if (patch.restore) updatePayload.deleted_at = null

  const { data, error } = await supabaseAdmin
    .from('run_walk_contatos_confianca')
    .update(updatePayload)
    .match(scopeFilters(scope))
    .eq('id', id)
    .select(CONTATO_CONFIANCA_SELECT)
    .single()

  if (error) throw error

  return data as RunWalkContatoConfiancaRow
}

export async function clearActiveSosContatos(scope: VdRunWalkPacienteScope): Promise<void> {
  const { error } = await supabaseAdmin
    .from('run_walk_contatos_confianca')
    .update({ is_active_sos: false })
    .match(scopeFilters(scope))
    .is('deleted_at', null)

  if (error) throw error
}

export async function setActiveSosContato(
  scope: VdRunWalkPacienteScope,
  id: string,
): Promise<RunWalkContatoConfiancaRow> {
  await clearActiveSosContatos(scope)

  const { data, error } = await supabaseAdmin
    .from('run_walk_contatos_confianca')
    .update({ is_active_sos: true })
    .match(scopeFilters(scope))
    .eq('id', id)
    .is('deleted_at', null)
    .select(CONTATO_CONFIANCA_SELECT)
    .single()

  if (error) throw error

  return data as RunWalkContatoConfiancaRow
}

export async function softDeleteContatoConfianca(
  scope: VdRunWalkPacienteScope,
  id: string,
): Promise<RunWalkContatoConfiancaRow> {
  const deletedAt = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('run_walk_contatos_confianca')
    .update({
      deleted_at: deletedAt,
      is_active_sos: false,
    })
    .match(scopeFilters(scope))
    .eq('id', id)
    .is('deleted_at', null)
    .select(CONTATO_CONFIANCA_SELECT)
    .single()

  if (error) throw error

  return data as RunWalkContatoConfiancaRow
}
