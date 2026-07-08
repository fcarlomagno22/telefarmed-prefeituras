import { supabaseAdmin } from '../../db/supabase.js'
import type { RunningRouteSpotVote } from './types.js'
import type { VdRunWalkPacienteScope } from './types.js'

const VOTO_SELECT =
  'id, spot_id, paciente_id, entidade_contratante_id, vote, criado_em, atualizado_em'

const COMENTARIO_SELECT =
  'id, spot_id, paciente_id, entidade_contratante_id, author_name, text, deleted_at, criado_em, atualizado_em'

export type RunningRouteSpotVotoRow = {
  id: string
  spot_id: string
  paciente_id: string
  entidade_contratante_id: string
  vote: RunningRouteSpotVote
  criado_em: string
  atualizado_em: string
}

export type RunningRouteSpotComentarioRow = {
  id: string
  spot_id: string
  paciente_id: string
  entidade_contratante_id: string
  author_name: string
  text: string
  deleted_at: string | null
  criado_em: string
  atualizado_em: string
}

export async function findRunningRouteSpotVoto(
  scope: VdRunWalkPacienteScope,
  spotId: string,
): Promise<RunningRouteSpotVotoRow | null> {
  const { data, error } = await supabaseAdmin
    .from('running_route_spot_votos')
    .select(VOTO_SELECT)
    .eq('spot_id', spotId)
    .eq('paciente_id', scope.pacienteId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return data as RunningRouteSpotVotoRow
}

export async function upsertRunningRouteSpotVoto(
  scope: VdRunWalkPacienteScope,
  spotId: string,
  vote: RunningRouteSpotVote,
): Promise<RunningRouteSpotVotoRow> {
  const { data, error } = await supabaseAdmin
    .from('running_route_spot_votos')
    .upsert(
      {
        spot_id: spotId,
        paciente_id: scope.pacienteId,
        entidade_contratante_id: scope.entidadeContratanteId,
        vote,
      },
      { onConflict: 'spot_id,paciente_id' },
    )
    .select(VOTO_SELECT)
    .single()

  if (error) throw error

  return data as RunningRouteSpotVotoRow
}

export async function deleteRunningRouteSpotVoto(
  scope: VdRunWalkPacienteScope,
  spotId: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('running_route_spot_votos')
    .delete()
    .eq('spot_id', spotId)
    .eq('paciente_id', scope.pacienteId)

  if (error) throw error
}

export type ListComentariosRepositoryQuery = {
  spotId: string
  page: number
  pageSize: number
}

export async function listRunningRouteSpotComentarios(
  query: ListComentariosRepositoryQuery,
): Promise<{ rows: RunningRouteSpotComentarioRow[]; totalCount: number }> {
  const offset = (query.page - 1) * query.pageSize
  const limit = offset + query.pageSize - 1

  const { data, error, count } = await supabaseAdmin
    .from('running_route_spot_comentarios')
    .select(COMENTARIO_SELECT, { count: 'exact' })
    .eq('spot_id', query.spotId)
    .is('deleted_at', null)
    .order('criado_em', { ascending: false })
    .range(offset, limit)

  if (error) throw error

  return {
    rows: (data ?? []) as RunningRouteSpotComentarioRow[],
    totalCount: count ?? 0,
  }
}

export async function insertRunningRouteSpotComentario(
  scope: VdRunWalkPacienteScope,
  spotId: string,
  authorName: string,
  text: string,
): Promise<RunningRouteSpotComentarioRow> {
  const { data, error } = await supabaseAdmin
    .from('running_route_spot_comentarios')
    .insert({
      spot_id: spotId,
      paciente_id: scope.pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      author_name: authorName,
      text,
    })
    .select(COMENTARIO_SELECT)
    .single()

  if (error) throw error

  return data as RunningRouteSpotComentarioRow
}
