export type IntegrationPlatform = 'ios' | 'android' | 'all'

export type IntegrationId = 'apple-health' | 'health-connect' | 'devices'

export type IntegrationConnectionStatus = 'disconnected' | 'connected' | 'denied'

export type IntegrationConnectionState = {
  status: IntegrationConnectionStatus
  lastSyncedAt?: number
  enabledPermissions?: string[]
  connectedDeviceName?: string
}

export type HealthIntegrationConfig = {
  id: IntegrationId
  title: string
  description: string
  iconFamily: 'material' | 'ionicons'
  icon: string
  gradient: readonly [string, string, string]
  accentColor: string
  platform: IntegrationPlatform
}

export type HealthPermissionId = 'steps' | 'distance' | 'heart-rate' | 'body'

export type HealthPermissionConfig = {
  id: HealthPermissionId
  label: string
  icon: string
}

export type MockBluetoothDevice = {
  id: string
  name: string
  signal: 1 | 2 | 3 | 4
  icon: string
}
