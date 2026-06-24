import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RemoteCareRequest } from '../types/remoteCareRequest'
import { generateAppointmentProtocol } from '../utils/myAppointments'

const STORAGE_KEY = '@telefarmed/remote-care-requests'
const MOCK_DELAY_MS = 320

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function buildSeedRequest(
  patientCpf: string,
  index: number,
  data: Omit<RemoteCareRequest, 'id' | 'patientCpf' | 'createdAt'>,
  createdAt: string,
): RemoteCareRequest {
  return {
    id: `remote-seed-${patientCpf}-${index}`,
    patientCpf,
    createdAt,
    ...data,
  }
}

export function createSeedRemoteCareRequests(patientCpf: string): RemoteCareRequest[] {
  const now = Date.now()
  const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()
  const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString()

  return [
    buildSeedRequest(
      patientCpf,
      1,
      {
        protocol: 'TF-2026-88421',
        reason: 'Estou acamado(a) ou com mobilidade muito reduzida',
        status: 'under_review',
      },
      twoDaysAgo,
    ),
    buildSeedRequest(
      patientCpf,
      2,
      {
        protocol: 'TF-2026-77109',
        reason: 'Uso cadeira de rodas e não consigo me deslocar até o posto',
        status: 'approved',
        reviewedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        teleconsultationLink: 'https://telefarmed.app/consulta/demo-sala',
        teleconsultationLabel: 'Entrar na teleconsulta',
      },
      fiveDaysAgo,
    ),
  ]
}

function isSeedRequest(request: RemoteCareRequest, patientCpf: string) {
  return request.id.startsWith(`remote-seed-${patientCpf}-`)
}

async function loadAllRequests(): Promise<RemoteCareRequest[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as RemoteCareRequest[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveRequestsForPatient(patientCpf: string, patientRequests: RemoteCareRequest[]) {
  const all = await loadAllRequests()
  const others = all.filter((item) => item.patientCpf !== patientCpf)
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...others, ...patientRequests]))
}

export async function fetchRemoteCareRequests(patientCpf: string): Promise<RemoteCareRequest[]> {
  await delay(MOCK_DELAY_MS)

  const stored = (await loadAllRequests()).filter((item) => item.patientCpf === patientCpf)
  const userRequests = stored.filter((item) => !isSeedRequest(item, patientCpf))
  const storedSeeds = stored.filter((item) => isSeedRequest(item, patientCpf))
  const freshSeeds = createSeedRemoteCareRequests(patientCpf)

  const seedById = new Map(freshSeeds.map((item) => [item.id, item]))
  for (const storedSeed of storedSeeds) {
    seedById.set(storedSeed.id, storedSeed)
  }

  const merged = [...userRequests, ...Array.from(seedById.values())].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  await saveRequestsForPatient(patientCpf, merged)
  return merged
}

export async function createRemoteCareRequest(
  patientCpf: string,
  reason: string,
): Promise<RemoteCareRequest> {
  await delay(MOCK_DELAY_MS)

  const request: RemoteCareRequest = {
    id: `remote-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    patientCpf,
    protocol: generateAppointmentProtocol(),
    reason: reason.trim(),
    status: 'under_review',
    createdAt: new Date().toISOString(),
  }

  const existing = (await loadAllRequests()).filter((item) => item.patientCpf === patientCpf)
  await saveRequestsForPatient(patientCpf, [request, ...existing])

  return request
}

export function getActiveRemoteCareRequests(requests: RemoteCareRequest[]): RemoteCareRequest[] {
  const statusOrder = {
    under_review: 0,
    approved: 1,
    rejected: 2,
  } as const

  return requests
    .filter((item) => item.status === 'under_review' || item.status === 'approved')
    .sort((a, b) => {
      const statusDelta = statusOrder[a.status] - statusOrder[b.status]
      if (statusDelta !== 0) return statusDelta
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}
