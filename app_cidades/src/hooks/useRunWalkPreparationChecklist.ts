import { useMemo } from 'react'
import type { GpsQuality } from './useRunWalkLocation'

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
  liveShareConfigured: boolean
}

export function useRunWalkPreparationChecklist({
  gpsQuality,
  gpsLocated,
  batteryOk,
  batteryDetail,
  liveShareConfigured,
}: UseRunWalkPreparationChecklistOptions) {
  const items = useMemo<PreparationChecklistItem[]>(() => {
    return [
      {
        id: 'gps',
        label: 'GPS localizado',
        ok: gpsLocated && gpsQuality !== 'unavailable' && gpsQuality !== 'poor',
        detail: gpsLocated ? 'Sinal de localização ativo' : 'Aguardando localização',
      },
      {
        id: 'battery',
        label: 'Bateria suficiente',
        ok: batteryOk,
        detail: batteryDetail,
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
    batteryDetail,
    batteryOk,
    gpsLocated,
    gpsQuality,
    liveShareConfigured,
  ])

  const requiredItemsOk = items.filter((item) => !item.optional).every((item) => item.ok)

  const canStart = gpsLocated && batteryOk

  return { items, canStart, requiredItemsOk }
}
