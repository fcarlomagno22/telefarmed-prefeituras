import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ActivityModality, RunWalkRouteParams } from '../types/auth'
import type { ActivityTrailPoint } from '../utils/runWalkActivityStats'

const STORAGE_KEY = '@telefarmed/run-walk/active-activity'
const MAX_AGE_MS = 24 * 60 * 60 * 1000

export type RunWalkActiveActivitySessionSnapshot = {
  sessionStartedAtIso: string
  elapsedSeconds: number
  isPaused: boolean
  distanceKm: number
  averageSpeedKmh: number
  trail: ActivityTrailPoint[]
}

export type RunWalkActiveActivityRecord = {
  patientCpf: string
  routeParams: {
    modality: ActivityModality
    activityName: string
    intensity?: string
    durationMinutes: number
    gpsPreCalibrated?: boolean
  }
  session: RunWalkActiveActivitySessionSnapshot
  updatedAtIso: string
}

function normalizePatientCpf(patientCpf?: string) {
  return patientCpf && patientCpf !== 'guest' ? patientCpf : 'guest'
}

function isRecordStale(record: RunWalkActiveActivityRecord) {
  const updatedAt = Date.parse(record.updatedAtIso)
  if (Number.isNaN(updatedAt)) return true
  return Date.now() - updatedAt > MAX_AGE_MS
}

export function adjustSessionSnapshotForRestore(
  session: RunWalkActiveActivitySessionSnapshot,
  updatedAtIso: string,
): RunWalkActiveActivitySessionSnapshot {
  if (session.isPaused) return session

  const updatedAt = Date.parse(updatedAtIso)
  if (Number.isNaN(updatedAt)) return session

  const gapSeconds = Math.max(0, Math.floor((Date.now() - updatedAt) / 1000))
  if (gapSeconds <= 0) return session

  return {
    ...session,
    elapsedSeconds: session.elapsedSeconds + gapSeconds,
  }
}

export async function loadRunWalkActiveActivity(
  patientCpf?: string,
): Promise<RunWalkActiveActivityRecord | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const record = JSON.parse(raw) as RunWalkActiveActivityRecord
    if (!record?.patientCpf || !record.routeParams || !record.session) return null
    if (normalizePatientCpf(patientCpf) !== record.patientCpf) return null
    if (isRecordStale(record)) {
      await AsyncStorage.removeItem(STORAGE_KEY)
      return null
    }

    return {
      ...record,
      session: adjustSessionSnapshotForRestore(record.session, record.updatedAtIso),
    }
  } catch {
    return null
  }
}

export async function saveRunWalkActiveActivity(
  record: Omit<RunWalkActiveActivityRecord, 'updatedAtIso'>,
): Promise<void> {
  const payload: RunWalkActiveActivityRecord = {
    ...record,
    patientCpf: normalizePatientCpf(record.patientCpf),
    updatedAtIso: new Date().toISOString(),
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export async function clearRunWalkActiveActivity(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY)
}

export function buildRunWalkActiveActivityRouteParams(
  record: RunWalkActiveActivityRecord,
): RunWalkRouteParams {
  return {
    modality: record.routeParams.modality,
    activityName: record.routeParams.activityName,
    intensity: record.routeParams.intensity,
    durationMinutes: record.routeParams.durationMinutes,
    gpsPreCalibrated: record.routeParams.gpsPreCalibrated ?? true,
  }
}
