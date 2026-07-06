import { useEffect, useState } from 'react'

function readVisualViewportHeight(): number {
  if (typeof window === 'undefined') return 0
  return Math.round(window.visualViewport?.height ?? window.innerHeight)
}

/** Altura visível real do PWA (visualViewport), usada em bottom sheets na web. */
export function useWebViewportHeight(): number {
  const [height, setHeight] = useState(readVisualViewportHeight)

  useEffect(() => {
    const refresh = () => setHeight(readVisualViewportHeight())

    refresh()
    window.visualViewport?.addEventListener('resize', refresh)
    window.visualViewport?.addEventListener('scroll', refresh)
    window.addEventListener('resize', refresh)

    return () => {
      window.visualViewport?.removeEventListener('resize', refresh)
      window.visualViewport?.removeEventListener('scroll', refresh)
      window.removeEventListener('resize', refresh)
    }
  }, [])

  return height
}
