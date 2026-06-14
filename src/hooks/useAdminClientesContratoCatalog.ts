import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import type { AdminClienteContratoTipo } from '../types/adminClientes'
import {
  fetchClientesContratoCatalog,
  isAdminClientesApiError,
} from '../lib/services/admin/clientes'

export type ClienteContratoTipoOption = {
  id: string
  label: string
  description: string
  modalidade: AdminClienteContratoTipo
}

export function useAdminClientesContratoCatalog() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()
  const [contractTypes, setContractTypes] = useState<ClienteContratoTipoOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchClientesContratoCatalog(token)
      setContractTypes(data.contractTypes)
    } catch (err) {
      const message = isAdminClientesApiError(err)
        ? err.message
        : 'Não foi possível carregar os tipos de contrato.'
      setError(message)
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

  const labelById = useMemo(
    () => Object.fromEntries(contractTypes.map((item) => [item.id, item.label])),
    [contractTypes],
  )

  return {
    contractTypes,
    labelById,
    isLoading: isLoading || isBootstrapping,
    error,
    reload,
  }
}

export function resolveClienteContratoTipoLabel(
  labelById: Record<string, string>,
  tipoId: string,
) {
  return labelById[tipoId] ?? tipoId
}

export function getClienteContratoTipoOption(
  contractTypes: ClienteContratoTipoOption[],
  id: string,
) {
  return contractTypes.find((item) => item.id === id)
}
