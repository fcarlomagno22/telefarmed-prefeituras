import { useCallback, useEffect, useState } from 'react'
import {
  fetchPublicAvaliacaoSessao,
  isPublicAtendimentoApiError,
  type PublicAvaliacaoSessao,
} from '../lib/services/public/atendimento'

export function usePublicAvaliacaoSession(token: string | undefined) {
  const [sessao, setSessao] = useState<PublicAvaliacaoSessao | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!token) return
    try {
      const next = await fetchPublicAvaliacaoSessao(token)
      setSessao(next)
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
  }, [token])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)
    void refresh()
  }, [token, refresh])

  return { sessao, loading, error, refresh }
}
