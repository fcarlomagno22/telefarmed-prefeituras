import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  listHealthIntegrations as fetchHealthIntegrations,
  updateHealthIntegration,
} from '../lib/api/vd/metricas'
import { IntegrationConnectionState } from '../types/healthIntegrations'
import {
  connectionStateToUpdateInput,
  mapIntegracaoDtoToConnectionState,
  mapIntegracoesDtoToConnectionState,
  mergeConnectionState,
} from '../utils/healthIntegrationsApi'

const STORAGE_KEY = '@telefarmed/health-integrations'

type HealthIntegrationsStore = Record<string, Record<string, IntegrationConnectionState>>

async function readStore(): Promise<HealthIntegrationsStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    return parsed as HealthIntegrationsStore
  } catch {
    return {}
  }
}

async function writeStore(store: HealthIntegrationsStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadCachedHealthConnections(
  patientCpf: string,
): Promise<Record<string, IntegrationConnectionState>> {
  const store = await readStore()
  const connections = store[patientCpf]
  return connections && typeof connections === 'object' ? { ...connections } : {}
}

export async function cacheHealthConnections(
  patientCpf: string,
  connections: Record<string, IntegrationConnectionState>,
) {
  const store = await readStore()
  store[patientCpf] = { ...connections }
  await writeStore(store)
}

/** Carrega integrações do backend; em falha usa cache local por CPF. */
export async function loadHealthConnections(
  patientCpf: string,
): Promise<Record<string, IntegrationConnectionState>> {
  if (patientCpf === 'guest') {
    return loadCachedHealthConnections(patientCpf)
  }

  try {
    const result = await fetchHealthIntegrations()
    const connections = mapIntegracoesDtoToConnectionState(result.integrations)
    await cacheHealthConnections(patientCpf, connections)
    return connections
  } catch {
    return loadCachedHealthConnections(patientCpf)
  }
}

/** Persiste uma integração no backend e atualiza cache local. */
export async function saveHealthConnection(
  patientCpf: string,
  integrationId: string,
  connection: IntegrationConnectionState,
  connections?: Record<string, IntegrationConnectionState>,
): Promise<Record<string, IntegrationConnectionState>> {
  const base = connections ?? (await loadCachedHealthConnections(patientCpf))
  const optimistic = mergeConnectionState(base, integrationId, connection)

  if (patientCpf === 'guest') {
    await cacheHealthConnections(patientCpf, optimistic)
    return optimistic
  }

  try {
    const result = await updateHealthIntegration(
      integrationId,
      connectionStateToUpdateInput(connection),
    )
    const saved = mapIntegracaoDtoToConnectionState(result.integration)
    const next = mergeConnectionState(base, integrationId, saved)
    await cacheHealthConnections(patientCpf, next)
    return next
  } catch {
    await cacheHealthConnections(patientCpf, optimistic)
    return optimistic
  }
}
