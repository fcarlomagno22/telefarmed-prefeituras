import { useMemo } from 'react'
import { isGpsReadyForActivity, type GpsQuality } from './useRunWalkLocation'

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
  batteryOk: boolean
  batteryDetail: string
  batteryAvailable?: boolean
  liveShareConfigured: boolean
}

export function useRunWalkPreparationChecklist({
  gpsQuality,
  gpsLocated,
  batteryOk,
  batteryDetail,
  batteryAvailable = true,
  liveShareConfigured,
}: UseRunWalkPreparationChecklistOptions) {
  const gpsReady = isGpsReadyForActivity(gpsLocated)

  const items = useMemo<PreparationChecklistItem[]>(() => {
    const gpsDetail = !gpsLocated
      ? 'Aguardando localização'
      : gpsQuality === 'poor'
        ? 'Sinal ativo — precisão baixa'
        : 'Sinal de localização ativo'

    return [
      {
        id: 'gps',
        label: 'GPS localizado',
        ok: gpsReady,
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
    gpsQuality,
    gpsReady,
    liveShareConfigured,
  ])

  const requiredItemsOk = items.filter((item) => !item.optional).every((item) => item.ok)

  const canStart = requiredItemsOk

  return { items, canStart, requiredItemsOk }
}
