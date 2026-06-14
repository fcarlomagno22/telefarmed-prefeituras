import { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import {
  fetchAdminRecipientPrefeituraUsers,
  fetchAdminRecipientPrefeituras,
  fetchAdminRecipientProfissionais,
  fetchAdminRecipientUbtUsers,
  fetchAdminRecipientUbts,
  isAdminNotificacoesApiError,
  type AdminRecipientPrefeitura,
  type AdminRecipientPrefeituraUser,
  type AdminRecipientProfissional,
  type AdminRecipientUbt,
  type AdminRecipientUbtUser,
} from '../lib/services/admin/notificacoes'

export function useAdminNotificacoesRecipients(enabled: boolean) {
  const { getAccessToken } = useAdminAuth()
  const [prefeituras, setPrefeituras] = useState<AdminRecipientPrefeitura[]>([])
  const [ubts, setUbts] = useState<AdminRecipientUbt[]>([])
  const [prefeituraUsers, setPrefeituraUsers] = useState<AdminRecipientPrefeituraUser[]>([])
  const [ubtUsers, setUbtUsers] = useState<AdminRecipientUbtUser[]>([])
  const [profissionais, setProfissionais] = useState<AdminRecipientProfissional[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setIsLoading(true)
    setLoadError(null)

    try {
      const [prefeiturasData, ubtsData, prefeituraUsersData, ubtUsersData, profissionaisData] =
        await Promise.all([
          fetchAdminRecipientPrefeituras(token),
          fetchAdminRecipientUbts(token),
          fetchAdminRecipientPrefeituraUsers(token),
          fetchAdminRecipientUbtUsers(token),
          fetchAdminRecipientProfissionais(token),
        ])
      setPrefeituras(prefeiturasData)
      setUbts(ubtsData)
      setPrefeituraUsers(prefeituraUsersData)
      setUbtUsers(ubtUsersData)
      setProfissionais(profissionaisData)
    } catch (error) {
      const message = isAdminNotificacoesApiError(error)
        ? error.message
        : 'Não foi possível carregar os destinatários.'
      setLoadError(message)
      setPrefeituras([])
      setUbts([])
      setPrefeituraUsers([])
      setUbtUsers([])
      setProfissionais([])
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    if (!enabled) return
    void reload()
  }, [enabled, reload])

  return { prefeituras, ubts, prefeituraUsers, ubtUsers, profissionais, isLoading, loadError, reload }
}
