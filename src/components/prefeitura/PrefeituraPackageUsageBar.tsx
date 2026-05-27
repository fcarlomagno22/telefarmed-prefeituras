import { useLayoutEffect, useRef } from 'react'
import { PREF_CHART_EASE } from './prefeituraChartAnimation'

type PrefeituraPackageUsageBarProps = {
  percent: number
  barClassName: string
  resetKey: string
  trackClassName?: string
  durationMs?: number
}

export function PrefeituraPackageUsageBar({
  percent,
  barClassName,
  resetKey,
  trackClassName = 'h-2.5',
  durationMs = 850,
}: PrefeituraPackageUsageBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const targetWidth = Math.min(100, Math.max(0, percent))

  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return

    bar.style.transition = 'none'
    bar.style.width = '0%'

    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        bar.style.transition = `width ${durationMs}ms ${PREF_CHART_EASE}`
        bar.style.width = `${targetWidth}%`
      })
    })

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [resetKey, targetWidth, durationMs])

  return (
    <div className={`overflow-hidden rounded-full bg-gray-100 ${trackClassName}`}>
      <div ref={barRef} className={`h-full w-0 rounded-full ${barClassName}`} />
    </div>
  )
}
