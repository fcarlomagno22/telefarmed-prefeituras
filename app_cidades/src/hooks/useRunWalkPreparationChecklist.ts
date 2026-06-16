import { useMemo } from 'react'
import type { GpsQuality } from './useRunWalkLocation'

export type PreparationChecklistItemId =
  | 'gps'
  | 'battery'
  | 'audio'
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
  audioConfigured: boolean
  liveShareConfigured: boolean
}

export function useRunWalkPreparationChecklist({
  gpsQuality,
  gpsLocated,
  batteryOk,
  batteryDetail,
  audioConfigured,
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
        id: 'audio',
        label: 'Áudio configurado',
        ok: audioConfigured,
        detail: audioConfigured ? 'Pronto para reproduzir' : 'Selecione um app de música',
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
    audioConfigured,
    batteryDetail,
    batteryOk,
    gpsLocated,
    gpsQuality,
    liveShareConfigured,
  ])

  const requiredItemsOk = items
    .filter((item) => !item.optional)
    .every((item) => item.ok || item.id === 'audio')

  const canStart = gpsLocated && batteryOk

  return { items, canStart, requiredItemsOk }
}
