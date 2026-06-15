export type Rpm2dCamera = 'portrait' | 'fullbody' | 'fit'
export type Rpm2dPose = 'standing' | 'relaxed' | 'power-stance' | 'thumbs-up'

export type Rpm2dRenderOptions = {
  camera?: Rpm2dCamera
  pose?: Rpm2dPose
  size?: number
  quality?: number
  background?: string
  expression?: string
}

export type RpmAvatarExportedEvent = {
  eventName: 'v1.avatar.exported'
  source: string
  data: {
    url: string
    userId?: string
  }
}

const AVATAR_ID_PATTERN = /\/([a-f0-9]{24})\.(glb|png|jpg)(?:\?|$)/i

export function extractRpmAvatarId(avatarUrl: string): string | null {
  const match = avatarUrl.trim().match(AVATAR_ID_PATTERN)
  return match?.[1] ?? null
}

export function buildRpmAvatar2dUrl(
  avatarGlbUrl: string,
  options: Rpm2dRenderOptions = {},
): string | null {
  const avatarId = extractRpmAvatarId(avatarGlbUrl)
  if (!avatarId) return null

  const params = new URLSearchParams()
  params.set('camera', options.camera ?? 'fullbody')
  params.set('pose', options.pose ?? 'relaxed')
  params.set('size', String(options.size ?? 512))
  params.set('quality', String(options.quality ?? 90))

  if (options.background) {
    params.set('background', options.background.replace(/^#/, ''))
  }

  if (options.expression) {
    params.set('expression', options.expression)
  }

  return `https://models.readyplayer.me/${avatarId}.png?${params.toString()}`
}

export function isRpmAvatarExportedEvent(
  payload: unknown,
): payload is RpmAvatarExportedEvent {
  if (!payload || typeof payload !== 'object') return false

  const event = payload as Partial<RpmAvatarExportedEvent>
  return (
    event.eventName === 'v1.avatar.exported' &&
    typeof event.data?.url === 'string' &&
    event.data.url.length > 0
  )
}

export function parseRpmWebViewMessage(rawData: string): unknown {
  try {
    return JSON.parse(rawData) as unknown
  } catch {
    return null
  }
}
