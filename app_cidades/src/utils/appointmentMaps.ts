import { Linking, Platform } from 'react-native'
import { scheduleUbts } from '../data/mockScheduleUbts'

export type NavigationTarget = {
  ubtId: string
  name: string
  address: string
  fullAddress: string
  latitude: number
  longitude: number
}

export type NavigationApp = 'google-maps' | 'waze'

function buildFullAddress(parts: {
  address: string
  neighborhood: string
  city: string
  state: string
}): string {
  return `${parts.address}, ${parts.neighborhood}, ${parts.city} - ${parts.state}`
}

export function getAppointmentNavigationTarget(ubtId: string): NavigationTarget | null {
  const ubt = scheduleUbts.find((item) => item.id === ubtId)
  if (!ubt) return null

  return {
    ubtId: ubt.id,
    name: ubt.name,
    address: ubt.address,
    fullAddress: buildFullAddress(ubt),
    latitude: ubt.latitude,
    longitude: ubt.longitude,
  }
}

async function openFirstAvailableUrl(urls: string[]): Promise<void> {
  for (const url of urls) {
    try {
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) {
        await Linking.openURL(url)
        return
      }
    } catch {
      // Try next fallback.
    }
  }

  const fallback = urls[urls.length - 1]
  if (fallback) {
    await Linking.openURL(fallback)
  }
}

export async function openGoogleMapsDirections(target: NavigationTarget): Promise<void> {
  const label = encodeURIComponent(target.name)
  const addressQuery = encodeURIComponent(target.fullAddress)
  const coords = `${target.latitude},${target.longitude}`

  const urls = Platform.select({
    ios: [
      `comgooglemaps://?daddr=${coords}&directionsmode=driving`,
      `maps://?daddr=${coords}`,
      `https://www.google.com/maps/dir/?api=1&destination=${coords}&destination_place_id=${label}`,
    ],
    android: [
      `google.navigation:q=${coords}`,
      `geo:${target.latitude},${target.longitude}?q=${target.latitude},${target.longitude}(${label})`,
      `https://www.google.com/maps/dir/?api=1&destination=${coords}`,
    ],
    default: [`https://www.google.com/maps/dir/?api=1&destination=${coords}`],
  }) ?? [`https://www.google.com/maps/search/?api=1&query=${addressQuery}`]

  await openFirstAvailableUrl(urls)
}

export async function openWazeDirections(target: NavigationTarget): Promise<void> {
  const addressQuery = encodeURIComponent(target.fullAddress)
  const coords = `${target.latitude},${target.longitude}`

  const urls = [
    `waze://?ll=${coords}&navigate=yes`,
    `waze://?q=${addressQuery}&navigate=yes`,
    `https://waze.com/ul?ll=${coords}&navigate=yes`,
    `https://waze.com/ul?q=${addressQuery}&navigate=yes`,
  ]

  await openFirstAvailableUrl(urls)
}

export async function openAppointmentDirections(
  ubtId: string,
  app: NavigationApp = 'google-maps',
): Promise<void> {
  const target = getAppointmentNavigationTarget(ubtId)
  if (!target) return

  if (app === 'waze') {
    await openWazeDirections(target)
    return
  }

  await openGoogleMapsDirections(target)
}
