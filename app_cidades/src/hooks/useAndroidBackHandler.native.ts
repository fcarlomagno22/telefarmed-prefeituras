import { useEffect, useRef } from 'react'
import { BackHandler, Platform } from 'react-native'
import { hasBackHandlers, pushBackHandler, removeBackHandler, runBackHandlers } from './backHandlerStack'

let subscription: ReturnType<typeof BackHandler.addEventListener> | null = null

function ensureGlobalListener() {
  if (subscription || Platform.OS !== 'android') return

  subscription = BackHandler.addEventListener('hardwareBackPress', () => runBackHandlers())
}

function removeGlobalListenerIfEmpty(hasHandlers: boolean) {
  if (!hasHandlers && subscription) {
    subscription.remove()
    subscription = null
  }
}

export function useAndroidBackHandler(handler: () => boolean, enabled = true) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) return

    const wrapped = () => handlerRef.current()
    pushBackHandler(wrapped)
    ensureGlobalListener()

    return () => {
      removeBackHandler(wrapped)
      removeGlobalListenerIfEmpty(hasBackHandlers())
    }
  }, [enabled])
}
