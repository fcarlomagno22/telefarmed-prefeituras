import { useCallback, useEffect, useState, type RefObject } from 'react'

const SCROLL_THRESHOLD_PX = 24

export function useScrollMoreHint(
  scrollRef: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
): boolean {
  const [showHint, setShowHint] = useState(false)

  const evaluate = useCallback(() => {
    const element = scrollRef.current
    if (!element) {
      setShowHint(false)
      return
    }

    const hasOverflow = element.scrollHeight > element.clientHeight + SCROLL_THRESHOLD_PX
    const atBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - SCROLL_THRESHOLD_PX

    setShowHint(hasOverflow && !atBottom)
  }, [scrollRef])

  useEffect(() => {
    evaluate()

    const element = scrollRef.current
    if (!element) return undefined

    element.addEventListener('scroll', evaluate, { passive: true })
    window.addEventListener('resize', evaluate)

    const resizeObserver = new ResizeObserver(evaluate)
    resizeObserver.observe(element)
    const content = element.firstElementChild
    if (content) resizeObserver.observe(content)

    const timers = [120, 350, 700].map((delay) => window.setTimeout(evaluate, delay))
    const frame = window.requestAnimationFrame(evaluate)

    return () => {
      element.removeEventListener('scroll', evaluate)
      window.removeEventListener('resize', evaluate)
      resizeObserver.disconnect()
      timers.forEach((timer) => window.clearTimeout(timer))
      window.cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reavalia ao mudar etapa/conteúdo
  }, [evaluate, scrollRef, ...deps])

  return showHint
}
