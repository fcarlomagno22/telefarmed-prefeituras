import { useEffect, useState } from 'react'

const DEFAULT_SKELETON_MS = 1000

/** Mantém skeleton visível por pelo menos `minMs`, além de qualquer loading externo. */
export function useSimulatedPageSkeleton(
  externalLoading = false,
  minMs = DEFAULT_SKELETON_MS,
) {
  const [minDurationDone, setMinDurationDone] = useState(false)

  useEffect(() => {
    setMinDurationDone(false)
    const timer = setTimeout(() => setMinDurationDone(true), minMs)
    return () => clearTimeout(timer)
  }, [minMs])

  return externalLoading || !minDurationDone
}
