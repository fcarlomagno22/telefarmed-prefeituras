import { supabaseAdmin } from '../../db/supabase.js'
import { PublicLiveShareError } from './errors.js'
import type { LiveShareSessionPublicResultDto } from './types.js'

type SessionRow = {
  id: string
  share_token: string
  participant_name: string
  activity_name: string
  is_active: boolean
  started_at: string
  expires_at: string
}

type PointRow = {
  id: string
  latitude: number
  longitude: number
  accuracy_meters: number | null
  recorded_at: string
}

export async function getLiveShareSessionByToken(
  token: string,
): Promise<LiveShareSessionPublicResultDto> {
  const { data: sessionRow, error: sessionError } = await supabaseAdmin
    .from('run_walk_live_sessions')
    .select('id, share_token, participant_name, activity_name, is_active, started_at, expires_at')
    .eq('share_token', token)
    .maybeSingle()

  if (sessionError) throw sessionError
  if (!sessionRow) {
    throw new PublicLiveShareError(
      'Este link de acompanhamento não existe ou expirou.',
      'NOT_FOUND',
      404,
    )
  }

  const row = sessionRow as SessionRow
  const expiresAtMs = new Date(row.expires_at).getTime()
  const isExpired = Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now()

  if (isExpired) {
    throw new PublicLiveShareError(
      'Este link de acompanhamento expirou.',
      'EXPIRED',
      410,
    )
  }

  const { data: pointRows, error: pointsError } = await supabaseAdmin
    .from('run_walk_live_points')
    .select('id, latitude, longitude, accuracy_meters, recorded_at')
    .eq('session_id', row.id)
    .order('recorded_at', { ascending: true })

  if (pointsError) throw pointsError

  const points = ((pointRows ?? []) as PointRow[]).map((point) => ({
    id: point.id,
    latitude: point.latitude,
    longitude: point.longitude,
    accuracyMeters: point.accuracy_meters,
    recordedAt: point.recorded_at,
  }))

  return {
    session: {
      id: row.id,
      shareToken: row.share_token,
      participantName: row.participant_name,
      activityName: row.activity_name,
      isActive: row.is_active && !isExpired,
      startedAt: row.started_at,
      expiresAt: row.expires_at,
      points,
    },
  }
}
