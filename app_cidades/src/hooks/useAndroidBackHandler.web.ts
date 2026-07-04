import { useEffect, useRef } from 'react'
import { ensureWebNavigationHistoryListener } from '../adapters/webNavigationHistory'
import { pushBackHandler, removeBackHandler } from './backHandlerStack'

export function useAndroidBackHandler(handler: () => boolean, enabled = true) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return

    ensureWebNavigationHistoryListener()

    const wrapped = () => handlerRef.current()
    pushBackHandler(wrapped)

    return () => {
      removeBackHandler(wrapped)
    }
  }, [enabled])
}
