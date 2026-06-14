import { useEffect } from 'react'

const DEFAULT_INTERVAL_MS = 4_000

type UseConsultationChatPollingOptions = {
  enabled?: boolean
  intervalMs?: number
}

export function useConsultationChatPolling(
  reload: () => void | Promise<void>,
  options: UseConsultationChatPollingOptions = {},
) {
  const { enabled = true, intervalMs = DEFAULT_INTERVAL_MS } = options

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const tick = () => {
      if (cancelled) return
      void Promise.resolve(reload()).catch(() => {
        // Falhas de polling são ignoradas — a próxima tentativa tenta de novo.
      })
    }

    const id = window.setInterval(tick, intervalMs)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [enabled, intervalMs, reload])
}
