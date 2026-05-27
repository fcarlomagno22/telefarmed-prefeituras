import { useLayoutEffect, type RefObject } from 'react'

type UseMatchElementHeightOptions = {
  /** Largura mínima (px) para aplicar a sincronização — padrão 1280 (Tailwind `xl`). */
  minWidth?: number
  enabled?: boolean
}

/**
 * Define a altura do alvo igual à do elemento fonte (ex.: coluna principal = sidebar).
 */
export function useMatchElementHeight(
  sourceRef: RefObject<HTMLElement | null>,
  targetRef: RefObject<HTMLElement | null>,
  { minWidth = 1280, enabled = true }: UseMatchElementHeightOptions = {},
) {
  useLayoutEffect(() => {
    if (!enabled) return

    const source = sourceRef.current
    const target = targetRef.current
    if (!source || !target) return

    const mediaQuery = window.matchMedia(`(min-width: ${minWidth}px)`)

    function syncHeight() {
      if (!targetRef.current || !sourceRef.current) return

      if (!mediaQuery.matches) {
        targetRef.current.style.height = ''
        return
      }

      targetRef.current.style.height = `${sourceRef.current.offsetHeight}px`
    }

    syncHeight()

    const observer = new ResizeObserver(syncHeight)
    observer.observe(source)
    mediaQuery.addEventListener('change', syncHeight)
    window.addEventListener('resize', syncHeight)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', syncHeight)
      window.removeEventListener('resize', syncHeight)
      if (targetRef.current) targetRef.current.style.height = ''
    }
  }, [enabled, minWidth, sourceRef, targetRef])
}
