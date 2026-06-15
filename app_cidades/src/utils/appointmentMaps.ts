import { Linking, Platform } from 'react-native'
import { scheduleUbts } from '../data/mockScheduleUbts'

export async function openAppointmentDirections(ubtId: string): Promise<void> {
  const ubt = scheduleUbts.find((item) => item.id === ubtId)
  if (!ubt) return

  const label = encodeURIComponent(ubt.name)
  const addressQuery = encodeURIComponent(
    `${ubt.address}, ${ubt.neighborhood}, ${ubt.city} - ${ubt.state}`,
  )

  const url = Platform.select({
    ios: `maps:0,0?q=${addressQuery}`,
    android: `geo:${ubt.latitude},${ubt.longitude}?q=${ubt.latitude},${ubt.longitude}(${label})`,
    default: `https://www.google.com/maps/search/?api=1&query=${ubt.latitude},${ubt.longitude}`,
  })

  if (url) {
    await Linking.openURL(url)
  }
}
