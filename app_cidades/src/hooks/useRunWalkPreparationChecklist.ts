import { useMemo } from 'react'
import { isGpsPermissionReadyForActivity, type GpsQuality } from './useRunWalkLocation'

export type PreparationChecklistItemId =
  | 'gps'
  | 'battery'
  | 'device'
  | 'live-location'

export type PreparationChecklistItem = {
  id: PreparationChecklistItemId
  label: string
  ok: boolean
  detail: string
  optional?: boolean
}

type UseRunWalkPreparationChecklistOptions = {
  gpsQuality: GpsQuality
  gpsLocated: boolean
  gpsPermissionGranted: boolean
  gpsPermissionDenied: boolean
  batteryOk: boolean
  batteryDetail: string
  batteryAvailable?: boolean
  liveShareConfigured: boolean
}

export function useRunWalkPreparationChecklist({
  gpsQuality,
  gpsLocated,
  gpsPermissionGranted,
  gpsPermissionDenied,
  batteryOk,
  batteryDetail,
  batteryAvailable = true,
  liveShareConfigured,
}: UseRunWalkPreparationChecklistOptions) {
  const gpsPermissionReady = isGpsPermissionReadyForActivity(
    gpsPermissionGranted,
    gpsPermissionDenied,
  )

  const items = useMemo<PreparationChecklistItem[]>(() => {
    const gpsDetail = gpsPermissionDenied
      ? 'Permita o acesso à localização'
      : !gpsLocated
        ? 'Aguardando localização — você já pode começar'
        : gpsQuality === 'poor' || gpsQuality === 'fair'
          ? 'Sinal fraco — distância calibra durante o treino'
          : 'Sinal de localização ativo'

    return [
      {
        id: 'gps',
        label: 'GPS habilitado',
        ok: gpsPermissionReady,
        detail: gpsDetail,
      },
      {
        id: 'battery',
        label: 'Bateria suficiente',
        ok: batteryOk,
        detail: batteryDetail,
        optional: !batteryAvailable,
      },
      {
        id: 'device',
        label: 'Dispositivo conectado',
        ok: true,
        detail: 'Smartphone pronto para registrar',
        optional: true,
      },
      {
        id: 'live-location',
        label: 'Localização ao vivo configurada',
        ok: liveShareConfigured,
        detail: liveShareConfigured
          ? 'Link de acompanhamento pronto'
          : 'Opcional — compartilhe antes de começar',
        optional: true,
      },
    ]
  }, [
    batteryAvailable,
    batteryDetail,
    batteryOk,
    gpsLocated,
    gpsPermissionDenied,
    gpsPermissionGranted,
    gpsQuality,
    gpsPermissionReady,
    liveShareConfigured,
  ])

  const requiredItemsOk = items.filter((item) => !item.optional).every((item) => item.ok)

  const canStart = requiredItemsOk

  return { items, canStart, requiredItemsOk }
}
