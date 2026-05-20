import { useEffect, useState } from 'react'

/** Simula carregamento da página — útil para testar skeletons. */
export function usePageSkeletonLoading(durationMs = 2000) {
  const [isLoading, setIsLoading] = useState(durationMs > 0)

  useEffect(() => {
    if (durationMs <= 0) {
      setIsLoading(false)
      return
    }

    const timer = window.setTimeout(() => setIsLoading(false), durationMs)
    return () => window.clearTimeout(timer)
  }, [durationMs])

  return isLoading
}
