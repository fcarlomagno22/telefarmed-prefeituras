import { supabaseAdmin } from '../../db/supabase.js'
import {
  resolveBoundingBox,
  type RunningRouteSpotRow,
} from './locais.formatters.js'
import type { VdRunWalkPacienteScope } from './types.js'
import type { CreateRunningRouteLocalInput } from './locais.formatters.js'

const LOCAIS_SELECT =
  'id, name, description, type, latitude, longitude, address_label, location_source, cover_photo_url, submitted_by_cpf, submitted_by_name, recommend_count, not_recommend_count, entidade_contratante_id, paciente_id, created_at'

export type ListLocaisRepositoryQuery = {
  latitude: number
  longitude: number
  radiusKm: number
}

export async function listRunningRouteSpotsInBounds(
  _scope: VdRunWalkPacienteScope,
  query: ListLocaisRepositoryQuery,
): Promise<RunningRouteSpotRow[]> {
  const bounds = resolveBoundingBox(query.latitude, query.longitude, query.radiusKm)

  const { data, error } = await supabaseAdmin
    .from('running_route_spots')
    .select(LOCAIS_SELECT)
    .gte('latitude', bounds.minLat)
    .lte('latitude', bounds.maxLat)
    .gte('longitude', bounds.minLng)
    .lte('longitude', bounds.maxLng)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []) as RunningRouteSpotRow[]
}

export async function insertRunningRouteSpot(
  scope: VdRunWalkPacienteScope,
  input: CreateRunningRouteLocalInput & {
    coverPhotoReference: string | null
    submittedByName: string
  },
): Promise<RunningRouteSpotRow> {
  const { data, error } = await supabaseAdmin
    .from('running_route_spots')
    .insert({
      name: input.name,
      description: input.description,
      type: input.type,
      latitude: input.latitude,
      longitude: input.longitude,
      address_label: input.addressLabel,
      location_source: input.locationSource,
      cover_photo_url: input.coverPhotoReference,
      submitted_by_cpf: scope.cpf,
      submitted_by_name: input.submittedByName,
      entidade_contratante_id: scope.entidadeContratanteId,
      paciente_id: scope.pacienteId,
    })
    .select(LOCAIS_SELECT)
    .single()

  if (error) throw error

  return data as RunningRouteSpotRow
}

export async function findRunningRouteSpotById(
  _scope: VdRunWalkPacienteScope,
  id: string,
): Promise<RunningRouteSpotRow | null> {
  const { data, error } = await supabaseAdmin
    .from('running_route_spots')
    .select(LOCAIS_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return data as RunningRouteSpotRow
}

export async function updateRunningRouteSpotCounters(
  spotId: string,
  recommendCount: number,
  notRecommendCount: number,
): Promise<RunningRouteSpotRow> {
  const { data, error } = await supabaseAdmin
    .from('running_route_spots')
    .update({
      recommend_count: Math.max(0, recommendCount),
      not_recommend_count: Math.max(0, notRecommendCount),
    })
    .eq('id', spotId)
    .select(LOCAIS_SELECT)
    .single()

  if (error) throw error

  return data as RunningRouteSpotRow
}
