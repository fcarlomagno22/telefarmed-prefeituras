/** URL WebSocket pública do LiveKit Cloud (sem segredos). */
export function getLiveKitServerUrl(): string {
  const url = import.meta.env.VITE_LIVEKIT_URL?.trim()
  if (!url) {
    throw new Error('VITE_LIVEKIT_URL não configurado.')
  }
  return url
}
