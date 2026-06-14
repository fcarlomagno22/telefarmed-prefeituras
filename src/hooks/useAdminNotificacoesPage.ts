import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, Building2, Landmark, Send } from 'lucide-react'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import type { AdminBroadcast } from '../data/adminNotificacoesMock'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import {
  createAdminBroadcast,
  fetchAdminBroadcasts,
  fetchAdminNotificationKpis,
  fetchAdminRecipientProfissionaisStats,
  isAdminNotificacoesApiError,
  type AdminNotificationKpisResponse,
  type AdminRecipientProfissionaisStats,
  type CreateAdminBroadcastPayload,
} from '../lib/services/admin/notificacoes'

function mapKpisToCards(kpis: AdminNotificationKpisResponse | null): KpiStatCardItem[] {
  if (!kpis) return []

  return [
    {
      label: 'Envios no mês',
      value: String(kpis.monthlySendCount),
      suffix: 'comunicados disparados',
      icon: Send,
      iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
      iconRing: 'ring-violet-100/80',
      topBar: 'from-violet-400 to-purple-500',
    },
    {
      label: 'Prefeituras alcançadas',
      value: String(kpis.lastBroadcastPrefeituraCount),
      suffix: 'no último envio em massa',
      icon: Landmark,
      iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
      iconRing: 'ring-orange-100/80',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'UBTs alcançadas',
      value: String(kpis.lastBroadcastUbtCount),
      suffix: 'último comunicado à rede',
      icon: Building2,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
      iconRing: 'ring-blue-100/80',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Com prioridade alta',
      value: String(kpis.importantUnreadCount),
      suffix: 'aguardando leitura',
      icon: Bell,
      iconGradient: 'from-rose-500 via-red-500 to-red-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
      iconRing: 'ring-red-100/80',
      topBar: 'from-rose-400 to-red-500',
    },
  ]
}

export function useAdminNotificacoesPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()
  const [broadcasts, setBroadcasts] = useState<AdminBroadcast[]>([])
  const [kpis, setKpis] = useState<AdminNotificationKpisResponse | null>(null)
  const [profissionaisStats, setProfissionaisStats] =
    useState<AdminRecipientProfissionaisStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setIsLoading(true)
    setLoadError(null)

    try {
      const [kpisData, listData, statsData] = await Promise.all([
        fetchAdminNotificationKpis(token),
        fetchAdminBroadcasts(token, { pageSize: 50 }),
        fetchAdminRecipientProfissionaisStats(token),
      ])
      setKpis(kpisData)
      setBroadcasts(listData.broadcasts)
      setProfissionaisStats(statsData)
    } catch (error) {
      const message = isAdminNotificacoesApiError(error)
        ? error.message
        : 'Não foi possível carregar as notificações.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const sendBroadcast = useCallback(
    async (payload: CreateAdminBroadcastPayload) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      const broadcast = await createAdminBroadcast(token, payload)
      setBroadcasts((current) => [broadcast, ...current])
      void reload()
      return broadcast
    },
    [getAccessToken, reload],
  )

  const kpiCards = useMemo(() => mapKpisToCards(kpis), [kpis])

  return {
    broadcasts,
    kpiCards,
    profissionaisStats,
    isLoading,
    loadError,
    reload,
    sendBroadcast,
  }
}
