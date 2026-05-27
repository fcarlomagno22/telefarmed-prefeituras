import { useEffect, useState } from 'react'

function formatElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((part) => String(part).padStart(2, '0')).join(':')
}

export function useConsultationElapsed(startedAtIso: string) {
  const [elapsed, setElapsed] = useState(() => {
    const start = new Date(startedAtIso).getTime()
    const diff = Math.max(0, Math.floor((Date.now() - start) / 1000))
    return formatElapsed(diff)
  })

  useEffect(() => {
    const start = new Date(startedAtIso).getTime()

    function tick() {
      const diff = Math.max(0, Math.floor((Date.now() - start) / 1000))
      setElapsed(formatElapsed(diff))
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [startedAtIso])

  return elapsed
}
