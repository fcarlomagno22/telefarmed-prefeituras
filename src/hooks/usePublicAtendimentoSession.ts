import { useCallback, useEffect, useState } from 'react'
import type {
  ConsultationChatAttachment,
  ConsultationChatMessage,
} from '../components/attendance/consultationChatTypes'
import type { AttendanceSession } from '../data/attendanceSession'
import {
  fetchPublicAtendimentoSessao,
  fetchPublicFilaStatus,
  fetchPublicMensagens,
  isPublicAtendimentoApiError,
  mapPublicMensagensToChat,
  mapPublicSessaoToAttendanceSession,
  sendPublicMensagemPaciente,
  type PublicAtendimentoSessao,
  type PublicFilaStatus,
} from '../lib/services/public/atendimento'
import { useConsultationChatPolling } from './useConsultationChatPolling'

type UsePublicAtendimentoSessionOptions = {
  enabled?: boolean
  polling?: boolean
  pollingIntervalMs?: number
}

export function usePublicAtendimentoSession(
  token: string | undefined,
  options: UsePublicAtendimentoSessionOptions = {},
) {
  const { enabled = true, polling = true, pollingIntervalMs = 4000 } = options
  const [sessao, setSessao] = useState<PublicAtendimentoSessao | null>(null)
  const [attendanceSession, setAttendanceSession] = useState<AttendanceSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!token || !enabled) return
    try {
      const next = await fetchPublicAtendimentoSessao(token)
      setSessao(next)
      setAttendanceSession(mapPublicSessaoToAttendanceSession(next))
      setError(null)
    } catch (err) {
      if (isPublicAtendimentoApiError(err) && err.status === 404) {
        setError('Sessão de atendimento não encontrada.')
      } else {
        setError('Não foi possível carregar o atendimento.')
      }
    } finally {
      setLoading(false)
    }
  }, [token, enabled])

  useEffect(() => {
    if (!token || !enabled) {
      setLoading(false)
      return
    }

    setLoading(true)
    void refresh()
  }, [token, enabled, refresh])

  useEffect(() => {
    if (!token || !enabled || !polling) return

    const id = window.setInterval(() => {
      void refresh()
    }, pollingIntervalMs)

    return () => window.clearInterval(id)
  }, [token, enabled, polling, pollingIntervalMs, refresh])

  return { sessao, attendanceSession, loading, error, refresh }
}

export function usePublicFilaStatus(
  token: string | undefined,
  options?: { polling?: boolean; pollingIntervalMs?: number },
) {
  const pollingEnabled = options?.polling ?? true
  const pollingIntervalMs = options?.pollingIntervalMs ?? 4000
  const [fila, setFila] = useState<PublicFilaStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!token) return
    try {
      const next = await fetchPublicFilaStatus(token)
      setFila(next)
      setError(null)
    } catch {
      setError('Não foi possível atualizar a fila.')
    }
  }, [token])

  useEffect(() => {
    if (!token) return

    let cancelled = false

    async function load() {
      try {
        const next = await fetchPublicFilaStatus(token!)
        if (!cancelled) {
          setFila(next)
          setError(null)
        }
      } catch {
        if (!cancelled) setError('Não foi possível atualizar a fila.')
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!token || !pollingEnabled) return

    const id = window.setInterval(() => {
      void refresh()
    }, pollingIntervalMs)

    return () => window.clearInterval(id)
  }, [token, pollingEnabled, pollingIntervalMs, refresh])

  return { fila, error, refresh }
}

export function usePublicMensagens(token: string | undefined, options?: { polling?: boolean }) {
  const [messages, setMessages] = useState<ConsultationChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const pollingEnabled = options?.polling ?? true

  const reload = useCallback(async () => {
    if (!token) {
      setMessages([])
      return
    }

    const raw = await fetchPublicMensagens(token)
    setMessages(mapPublicMensagensToChat(raw))
  }, [token])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setMessages([])
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        await reload()
      } catch {
        if (!cancelled) setMessages([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [token, reload])

  useConsultationChatPolling(reload, { enabled: Boolean(token) && pollingEnabled })

  const sendMessage = useCallback(
    async (text: string) => {
      if (!token) return
      await sendPublicMensagemPaciente(token, { text })
      await reload()
    },
    [token, reload],
  )

  const sendAttachment = useCallback(
    async (attachment: ConsultationChatAttachment) => {
      if (!token) return
      const response = await fetch(attachment.url)
      const blob = await response.blob()
      const file = new File([blob], attachment.name, {
        type: attachment.type === 'pdf' ? 'application/pdf' : blob.type || 'image/jpeg',
      })
      await sendPublicMensagemPaciente(token, { file })
      await reload()
    },
    [token, reload],
  )

  const sendAttachmentFile = useCallback(
    async (file: File) => {
      if (!token) return
      await sendPublicMensagemPaciente(token, { file })
      await reload()
    },
    [token, reload],
  )

  return { messages, loading, reload, sendMessage, sendAttachment, sendAttachmentFile }
}
