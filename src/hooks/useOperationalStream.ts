import { useEffect, useRef } from 'react'
import { API_BASE_URL } from '../lib/api/config'
import { isBackendApiEnabled } from '../lib/api/config'
import type {
  OperationalStreamEvent,
  OperationalStreamScope,
} from '../types/operationalStream'

type UseOperationalStreamOptions = {
  scope: OperationalStreamScope | null
  enabled: boolean
  getAccessToken?: () => string | null
  onEvent: (event: OperationalStreamEvent) => void
  onFallbackPoll: () => void
  fallbackPollMs?: number
}

const DEFAULT_FALLBACK_POLL_MS = 30_000

function buildAdminMonitorStreamUrl(scope: Extract<OperationalStreamScope, { portal: 'admin' }>) {
  const query = new URLSearchParams()
  const entidadeId = scope.entidadeFilterId?.trim()
  const regionKey = scope.regionKey?.trim()

  if (entidadeId && entidadeId !== 'all') query.set('entidadeId', entidadeId)
  if (regionKey && regionKey !== 'todos' && regionKey !== 'all') query.set('regionKey', regionKey)

  const suffix = query.toString()
  return `${API_BASE_URL}/admin/monitor/stream${suffix ? `?${suffix}` : ''}`
}

function buildPrefeituraMonitorStreamUrl(
  scope: Extract<OperationalStreamScope, { portal: 'prefeitura' }>,
) {
  const query = new URLSearchParams()
  const regionKey = scope.regionKey?.trim()

  if (regionKey && regionKey !== 'todas' && regionKey !== 'all') {
    query.set('regionKey', regionKey)
  }

  const suffix = query.toString()
  return `${API_BASE_URL}/prefeitura/monitor/stream${suffix ? `?${suffix}` : ''}`
}

function parseSseChunk(
  buffer: string,
  onData: (payload: unknown) => void,
): string {
  const parts = buffer.split('\n\n')
  const remainder = parts.pop() ?? ''

  for (const part of parts) {
    const lines = part.split('\n')
    const dataLines = lines
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())

    if (dataLines.length === 0) continue

    try {
      onData(JSON.parse(dataLines.join('\n')))
    } catch {
      // ignora frames inválidos
    }
  }

  return remainder
}

function isOperationalStreamEvent(value: unknown): value is OperationalStreamEvent {
  if (!value || typeof value !== 'object') return false
  const event = value as OperationalStreamEvent
  return (
    (event.kind === 'fila.updated' || event.kind === 'consulta.updated') &&
    typeof event.at === 'string' &&
    typeof event.entidadeContratanteId === 'string' &&
    typeof event.unidadeUbtId === 'string'
  )
}

async function consumeMonitorStream(params: {
  url: string
  accessToken: string
  signal: AbortSignal
  onEvent: (event: OperationalStreamEvent) => void
}) {
  const response = await fetch(params.url, {
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      Accept: 'text/event-stream',
    },
    signal: params.signal,
    credentials: 'include',
  })

  if (!response.ok || !response.body) {
    throw new Error(`Monitor stream failed (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (!params.signal.aborted) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    buffer = parseSseChunk(buffer, (payload) => {
      if (isOperationalStreamEvent(payload)) {
        params.onEvent(payload)
      }
    })
  }
}

async function consumeAdminMonitorStream(params: {
  scope: Extract<OperationalStreamScope, { portal: 'admin' }>
  accessToken: string
  signal: AbortSignal
  onEvent: (event: OperationalStreamEvent) => void
}) {
  await consumeMonitorStream({
    url: buildAdminMonitorStreamUrl(params.scope),
    accessToken: params.accessToken,
    signal: params.signal,
    onEvent: params.onEvent,
  })
}

async function consumePrefeituraMonitorStream(params: {
  scope: Extract<OperationalStreamScope, { portal: 'prefeitura' }>
  accessToken: string
  signal: AbortSignal
  onEvent: (event: OperationalStreamEvent) => void
}) {
  await consumeMonitorStream({
    url: buildPrefeituraMonitorStreamUrl(params.scope),
    accessToken: params.accessToken,
    signal: params.signal,
    onEvent: params.onEvent,
  })
}

export function useOperationalStream({
  scope,
  enabled,
  getAccessToken,
  onEvent,
  onFallbackPoll,
  fallbackPollMs = DEFAULT_FALLBACK_POLL_MS,
}: UseOperationalStreamOptions) {
  const onEventRef = useRef(onEvent)
  const onFallbackPollRef = useRef(onFallbackPoll)

  onEventRef.current = onEvent
  onFallbackPollRef.current = onFallbackPoll

  useEffect(() => {
    if (!enabled || !scope) return

    const fallbackTimer = window.setInterval(() => {
      onFallbackPollRef.current()
    }, fallbackPollMs)

    if (!isBackendApiEnabled() || (scope.portal !== 'admin' && scope.portal !== 'prefeitura')) {
      return () => window.clearInterval(fallbackTimer)
    }

    const abortController = new AbortController()
    let reconnectTimer: number | null = null
    let disposed = false

    const connect = async () => {
      const token = getAccessToken?.() ?? null
      if (!token || disposed) return

      try {
        if (scope.portal === 'admin') {
          await consumeAdminMonitorStream({
            scope,
            accessToken: token,
            signal: abortController.signal,
            onEvent: (event) => onEventRef.current(event),
          })
        } else {
          await consumePrefeituraMonitorStream({
            scope,
            accessToken: token,
            signal: abortController.signal,
            onEvent: (event) => onEventRef.current(event),
          })
        }
        if (!disposed && !abortController.signal.aborted) {
          reconnectTimer = window.setTimeout(() => {
            void connect()
          }, 1_000)
        }
      } catch {
        if (disposed || abortController.signal.aborted) return
        onFallbackPollRef.current()
        reconnectTimer = window.setTimeout(() => {
          void connect()
        }, 5_000)
      }
    }

    void connect()

    return () => {
      disposed = true
      if (reconnectTimer != null) window.clearTimeout(reconnectTimer)
      abortController.abort()
      window.clearInterval(fallbackTimer)
    }
  }, [enabled, scope, getAccessToken, fallbackPollMs])
}
