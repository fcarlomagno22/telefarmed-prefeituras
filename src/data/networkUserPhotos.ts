/** Retratos públicos (Random User) — apenas para mock/demonstração. */
export const NETWORK_USER_PHOTOS: Record<string, string> = {
  '1': 'https://randomuser.me/api/portraits/women/44.jpg',
  '2': 'https://randomuser.me/api/portraits/men/32.jpg',
  '3': 'https://randomuser.me/api/portraits/women/68.jpg',
  '4': 'https://randomuser.me/api/portraits/men/71.jpg',
  '5': 'https://randomuser.me/api/portraits/women/25.jpg',
  '6': 'https://randomuser.me/api/portraits/men/52.jpg',
  '7': 'https://randomuser.me/api/portraits/women/12.jpg',
}

export function photoUrlForNetworkUser(userId: string, genderLabel?: string): string {
  const stored = NETWORK_USER_PHOTOS[userId]
  if (stored) return stored

  const isFemale = genderLabel?.toLowerCase().includes('femin')
  const category = isFemale ? 'women' : 'men'
  const numericId = Number.parseInt(userId, 10) || 1
  const index = (numericId * 11) % 90 + 1
  return `https://randomuser.me/api/portraits/${category}/${index}.jpg`
}
