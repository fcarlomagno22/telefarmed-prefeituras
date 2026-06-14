import { AccessToken } from 'livekit-server-sdk'
import { env } from '../../config/env.js'

export type ConsultaVideoTokenResult = {
  token: string
  roomName: string
  serverUrl: string
}

export type CreateConsultaVideoTokenParams = {
  consultaId: string
  participantIdentity: string
  participantName: string
}

/** TTL alinhado a uma teleconsulta — LiveKit default é 6h; usamos margem menor. */
const CONSULTA_VIDEO_TOKEN_TTL = '4h'

export function buildConsultaRoomName(consultaId: string): string {
  const id = consultaId.trim()
  if (!id) {
    throw new Error('consultaId é obrigatório para nome da sala LiveKit.')
  }
  return `consulta-${id}`
}

export async function createConsultaVideoToken(
  params: CreateConsultaVideoTokenParams,
): Promise<ConsultaVideoTokenResult> {
  const consultaId = params.consultaId.trim()
  const participantIdentity = params.participantIdentity.trim()
  const participantName = params.participantName.trim()

  if (!consultaId) {
    throw new Error('consultaId é obrigatório.')
  }
  if (!participantIdentity) {
    throw new Error('participantIdentity é obrigatório.')
  }
  if (!participantName) {
    throw new Error('participantName é obrigatório.')
  }

  const roomName = buildConsultaRoomName(consultaId)

  const accessToken = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
    ttl: CONSULTA_VIDEO_TOKEN_TTL,
  })

  accessToken.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  })

  const token = await accessToken.toJwt()

  return {
    token,
    roomName,
    serverUrl: env.LIVEKIT_URL,
  }
}
