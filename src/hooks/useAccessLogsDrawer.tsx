import { useCallback, useEffect, useState } from 'react'
import { AccessLogsDrawer } from '../components/credenciais/AccessLogsDrawer'
import type { AccessLogEntry } from '../data/accessLogsMock'
import type { CredenciaisAccessLogUser } from '../utils/mapCredenciaisAccessLogs'

export type UseAccessLogsDrawerOptions = {
  getAccessToken?: () => string | null
  users?: CredenciaisAccessLogUser[]
  loadLogs?: (accessToken: string) => Promise<AccessLogEntry[]>
}

export function useAccessLogsDrawer(options?: UseAccessLogsDrawerOptions) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [logs, setLogs] = useState<AccessLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadLogs = options?.loadLogs
  const getAccessToken = options?.getAccessToken

  const fetchLogs = useCallback(async () => {
    if (!loadLogs || !getAccessToken) return

    const token = getAccessToken()
    if (!token) {
      setLoadError('Sessão expirada. Faça login novamente.')
      return
    }

    setIsLoading(true)
    setLoadError(null)

    try {
      const entries = await loadLogs(token)
      setLogs(entries)
    } catch {
      setLoadError('Não foi possível carregar o histórico de acessos.')
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken, loadLogs])

  const openDrawer = useCallback(() => {
    setClosing(false)
    setOpen(true)
  }, [])

  useEffect(() => {
    if (!open || !loadLogs) return
    void fetchLogs()
  }, [open, loadLogs, fetchLogs])

  const requestClose = useCallback(() => {
    setClosing(true)
  }, [])

  const handleTransitionEnd = useCallback(() => {
    if (closing) {
      setOpen(false)
      setClosing(false)
    }
  }, [closing])

  const drawerElement = (
    <AccessLogsDrawer
      open={open}
      closing={closing}
      logs={logs}
      users={options?.users ?? []}
      isLoading={isLoading}
      loadError={loadError}
      onRetry={loadLogs ? () => void fetchLogs() : undefined}
      onClose={requestClose}
      onTransitionEnd={handleTransitionEnd}
    />
  )

  return {
    openDrawer,
    drawerElement,
  }
}
