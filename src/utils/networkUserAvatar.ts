import type { NetworkUser } from '../data/networkUsersMock'
import { getNetworkUserProfile } from '../data/networkUserProfiles'

export function resolveNetworkUserAvatarUrl(user: NetworkUser): string | undefined {
  const fromRow = user.avatarUrl?.trim()
  if (fromRow) return fromRow

  const fromProfile = getNetworkUserProfile(user).photoDataUrl?.trim()
  return fromProfile || undefined
}
