export type AppBatterySnapshot = {
  available: boolean
  levelPercent: number | null
  isCharging: boolean
}

export type AppBatterySubscription = {
  remove: () => void
}

export const APP_BATTERY_WEB_LIMITATIONS = {
  unavailable:
    'Nível de bateria não está disponível neste navegador; o item é tratado como opcional.',
  partial:
    'Quando disponível, a API de bateria do navegador pode não reportar carregamento.',
} as const

export function mapBatteryLevelToPercent(level: number): number | null {
  if (!Number.isFinite(level) || level < 0) return null
  if (level > 1) return null
  return Math.round(level * 100)
}
