import { Building2, Key, Landmark, UserCheck } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import type { AdminInternoCredentialUser } from '../config/adminCredenciaisConfig'
import type { PrefeituraCredentialUser } from '../config/prefeituraCredenciaisConfig'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import type { AdminOperatorRow } from '../data/adminOperadoresMock'
import type { PrefeituraCredentialUbtOption } from '../data/prefeituraAccessCredentialsMock'
import {
  fetchContractingEntities,
  fetchCredenciaisKpis,
  fetchInternoCredentials,
  fetchPortalCredentials,
  fetchPrefeituraCredentials,
  fetchUbtOptions,
  isCredenciaisApiError,
  type CredenciaisKpis,
} from '../lib/services/admin/credenciais'

function formatKpiNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function buildKpiCards(kpis: CredenciaisKpis): KpiStatCardItem[] {
  return [
    {
      label: 'Admin Telefarmed',
      value: formatKpiNumber(kpis.internosTotal),
      suffix: 'acessos internos',
      icon: Key,
      iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
      iconRing: 'ring-violet-100/80',
      topBar: 'from-violet-400 to-purple-500',
    },
    {
      label: 'Entidade',
      value: formatKpiNumber(kpis.prefeituraTotal),
      suffix: 'gestores da entidade',
      icon: Landmark,
      iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
      iconRing: 'ring-orange-100/80',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'UBT',
      value: formatKpiNumber(kpis.ubtTotal),
      suffix: 'operadores de unidade',
      icon: Building2,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
      iconRing: 'ring-blue-100/80',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Ativos na rede',
      value: formatKpiNumber(kpis.ativosRedeTotal),
      suffix: 'com login liberado',
      icon: UserCheck,
      iconGradient: 'from-emerald-500 via-teal-500 to-emerald-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-teal-500',
    },
  ]
}

export function useAdminCredenciaisPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()
  const getAccessTokenRef = useRef(getAccessToken)
  getAccessTokenRef.current = getAccessToken

  const [internoRows, setInternoRows] = useState<AdminInternoCredentialUser[]>([])
  const [prefeituraRows, setPrefeituraRows] = useState<PrefeituraCredentialUser[]>([])
  const [operatorRows, setOperatorRows] = useState<AdminOperatorRow[]>([])
  const [ubtOptions, setUbtOptions] = useState<PrefeituraCredentialUbtOption[]>([])
  const [contractingEntityOptions, setContractingEntityOptions] = useState<
    Array<{ value: string; label: string }>
  >([])
  const [kpiCards, setKpiCards] = useState<KpiStatCardItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  const reload = useCallback(async (options?: { showLoading?: boolean }) => {
    const token = getAccessTokenRef.current()
    if (!token) return

    const showLoading = options?.showLoading ?? !hasLoadedRef.current
    if (showLoading) {
      setIsLoading(true)
    }
    setLoadError(null)

    try {
      const [kpis, internos, prefeitura, ubt, ubts, entities] = await Promise.all([
        fetchCredenciaisKpis(token),
        fetchInternoCredentials(token),
        fetchPrefeituraCredentials(token),
        fetchPortalCredentials(token, 'UBT'),
        fetchUbtOptions(token),
        fetchContractingEntities(token),
      ])

      setInternoRows(internos)
      setPrefeituraRows(prefeitura)
      setOperatorRows(ubt)
      setUbtOptions(ubts)
      setContractingEntityOptions(
        entities.map((entity) => ({ value: entity.id, label: entity.label })),
      )
      setKpiCards(buildKpiCards(kpis))
      hasLoadedRef.current = true
    } catch (error) {
      const message = isCredenciaisApiError(error)
        ? error.message
        : 'Não foi possível carregar as credenciais.'
      setLoadError(message)
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      hasLoadedRef.current = false
      setIsLoading(false)
      return
    }
    void reload({ showLoading: true })
  }, [isAuthenticated, isBootstrapping, reload])

  const refreshKpis = useCallback(async () => {
    const token = getAccessTokenRef.current()
    if (!token) return
    try {
      const kpis = await fetchCredenciaisKpis(token)
      setKpiCards(buildKpiCards(kpis))
    } catch {
      // KPIs secundários — falha silenciosa
    }
  }, [])

  const afterMutation = useCallback(async () => {
    await reload({ showLoading: false })
  }, [reload])

  return useMemo(
    () => ({
      internoRows,
      setInternoRows,
      prefeituraRows,
      setPrefeituraRows,
      operatorRows,
      setOperatorRows,
      ubtOptions,
      contractingEntityOptions,
      kpiCards,
      isLoading: isLoading || isBootstrapping,
      loadError,
      reload,
      refreshKpis,
      afterMutation,
      getAccessToken,
    }),
    [
      internoRows,
      prefeituraRows,
      operatorRows,
      ubtOptions,
      contractingEntityOptions,
      kpiCards,
      isLoading,
      isBootstrapping,
      loadError,
      reload,
      refreshKpis,
      afterMutation,
      getAccessToken,
    ],
  )
}
