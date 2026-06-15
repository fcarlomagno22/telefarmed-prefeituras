import { useEffect, useRef } from 'react'
import { BackHandler, Platform } from 'react-native'

type BackHandlerFn = () => boolean

const handlerStack: BackHandlerFn[] = []
let subscription: ReturnType<typeof BackHandler.addEventListener> | null = null

function ensureGlobalListener() {
  if (subscription || Platform.OS !== 'android') return

  subscription = BackHandler.addEventListener('hardwareBackPress', () => {
    for (let index = handlerStack.length - 1; index >= 0; index -= 1) {
      if (handlerStack[index]()) return true
    }
    return false
  })
}

function removeGlobalListenerIfEmpty() {
  if (handlerStack.length === 0 && subscription) {
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
    handlerStack.push(wrapped)
    ensureGlobalListener()

    return () => {
      const index = handlerStack.lastIndexOf(wrapped)
      if (index >= 0) handlerStack.splice(index, 1)
      removeGlobalListenerIfEmpty()
    }
  }, [enabled])
}
