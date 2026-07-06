import { useEffect, useState } from 'react'
import { getAppNetworkState, subscribeAppNetwork } from '../adapters/appNetwork'

export function useAppNetwork() {
  const [isConnected, setIsConnected] = useState(true)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let active = true

    void getAppNetworkState().then((state) => {
      if (!active) return
      setIsConnected(state.isConnected)
      setIsReady(true)
    })

    const subscription = subscribeAppNetwork((state) => {
      setIsConnected(state.isConnected)
      setIsReady(true)
    })

    return () => {
      active = false
      subscription.remove()
    }
  }, [])

  return {
    isConnected,
    isOffline: isReady && !isConnected,
    isReady,
  }
}
