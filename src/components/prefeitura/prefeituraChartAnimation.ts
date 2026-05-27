import { useEffect, useState } from 'react'

export const PREF_CHART_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

/** Reinicia animação de preenchimento quando `resetKey` muda (ex.: filtros do dashboard). */
export function usePrefeituraChartAnimation(delayMs = 140, resetKey?: string) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    setAnimate(false)

    const raf = requestAnimationFrame(() => {
      timer = window.setTimeout(() => {
        if (!cancelled) setAnimate(true)
      }, delayMs)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [delayMs, resetKey])

  return animate
}

export function chartStaggerDelay(index: number, stepMs = 0.12) {
  return `${index * stepMs}s`
}
