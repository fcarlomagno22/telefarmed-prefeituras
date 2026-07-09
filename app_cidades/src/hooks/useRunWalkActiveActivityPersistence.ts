import { useCallback, useEffect, useRef } from 'react'
import { AppState, Platform } from 'react-native'
import {
  clearRunWalkActiveActivity,
  saveRunWalkActiveActivity,
} from '../data/runWalkActiveActivityStorage'
import type { RunWalkActivitySessionRestore } from '../hooks/useRunWalkActivitySession'
import type { ActivityModality } from '../types/auth'

const PERSIST_INTERVAL_MS = 5_000

type UseRunWalkActiveActivityPersistenceOptions = {
  patientCpf?: string
  modality: ActivityModality
  activityName: string
  intensity?: string
  durationMinutes: number
  gpsPreCalibrated: boolean
  enabled: boolean
  isFinished: boolean
  getPersistSnapshot: () => RunWalkActivitySessionRestore
}

export function useRunWalkActiveActivityPersistence({
  patientCpf,
  modality,
  activityName,
  intensity,
  durationMinutes,
  gpsPreCalibrated,
  enabled,
  isFinished,
  getPersistSnapshot,
}: UseRunWalkActiveActivityPersistenceOptions) {
  const getPersistSnapshotRef = useRef(getPersistSnapshot)

  useEffect(() => {
    getPersistSnapshotRef.current = getPersistSnapshot
  }, [getPersistSnapshot])

  const persistActiveActivity = useCallback(
    (options?: { forcePaused?: boolean }) => {
      if (!enabled || isFinished) return

      const snapshot = getPersistSnapshotRef.current()

      void saveRunWalkActiveActivity({
        patientCpf,
        routeParams: {
          modality,
          activityName,
          intensity,
          durationMinutes,
          gpsPreCalibrated,
        },
        session: {
          ...snapshot,
          isPaused: options?.forcePaused ? true : snapshot.isPaused,
        },
      })
    },
    [
      activityName,
      durationMinutes,
      enabled,
      gpsPreCalibrated,
      intensity,
      isFinished,
      modality,
      patientCpf,
    ],
  )

  useEffect(() => {
    if (!enabled || isFinished) return

    persistActiveActivity()

    const timer = setInterval(() => {
      persistActiveActivity()
    }, PERSIST_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [enabled, isFinished, persistActiveActivity])

  useEffect(() => {
    if (!enabled || isFinished) return

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        persistActiveActivity({ forcePaused: true })
      }
    })

    return () => subscription.remove()
  }, [enabled, isFinished, persistActiveActivity])

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || isFinished) return

    const persistOnHide = () => {
      persistActiveActivity({ forcePaused: true })
    }

    window.addEventListener('pagehide', persistOnHide)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        persistOnHide()
      }
    })

    return () => {
      window.removeEventListener('pagehide', persistOnHide)
    }
  }, [enabled, isFinished, persistActiveActivity])

  return { persistActiveActivity, clearActiveActivity: clearRunWalkActiveActivity }
}
