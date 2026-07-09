import { useCallback, useEffect, useRef } from 'react'
import { AppState, Platform } from 'react-native'
import {
  requestBackgroundLocationPermissionsAsync,
  startRunWalkBackgroundLocationUpdatesAsync,
  stopRunWalkBackgroundLocationUpdatesAsync,
} from '../adapters/appBackgroundLocation'
import { drainRunWalkBackgroundGpsFixes } from '../data/runWalkBackgroundGpsQueue'
import type { RunWalkGpsFix } from './runWalkLiveGpsFeed'

type UseRunWalkBackgroundLocationOptions = {
  enabled: boolean
  isPaused: boolean
  isFinished: boolean
  onBackgroundFixes: (fixes: RunWalkGpsFix[]) => void
}

export function useRunWalkBackgroundLocation({
  enabled,
  isPaused,
  isFinished,
  onBackgroundFixes,
}: UseRunWalkBackgroundLocationOptions) {
  const onBackgroundFixesRef = useRef(onBackgroundFixes)

  useEffect(() => {
    onBackgroundFixesRef.current = onBackgroundFixes
  }, [onBackgroundFixes])

  const flushBackgroundQueue = useCallback(async () => {
    const fixes = await drainRunWalkBackgroundGpsFixes()
    if (fixes.length > 0) {
      onBackgroundFixesRef.current(fixes)
    }
  }, [])

  useEffect(() => {
    if (!enabled || isFinished) {
      void stopRunWalkBackgroundLocationUpdatesAsync()
      return
    }

    if (Platform.OS === 'web') {
      void flushBackgroundQueue()
      return
    }

    let cancelled = false

    void (async () => {
      const permission = await requestBackgroundLocationPermissionsAsync()
      if (cancelled || !permission.granted) return

      if (isPaused) {
        await stopRunWalkBackgroundLocationUpdatesAsync()
        return
      }

      await startRunWalkBackgroundLocationUpdatesAsync()
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, flushBackgroundQueue, isFinished, isPaused])

  useEffect(() => {
    if (!enabled || isFinished) return

    void flushBackgroundQueue()

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void flushBackgroundQueue()
      }
    })

    return () => subscription.remove()
  }, [enabled, flushBackgroundQueue, isFinished])

  useEffect(() => {
    if (!enabled || isFinished) {
      void stopRunWalkBackgroundLocationUpdatesAsync()
    }
  }, [enabled, isFinished])
}
