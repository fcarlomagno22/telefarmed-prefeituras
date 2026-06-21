import { useMemo } from 'react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import type { AdminClienteContratoTipo } from '../types/adminClientes'
import {
  getAdminContratoCatalogErrorMessage,
  useAdminContratoCatalogQuery,
} from '../lib/query/adminCatalogQueries'

export type ClienteContratoTipoOption = {
  id: string
  label: string
  description: string
  modalidade: AdminClienteContratoTipo
}

export function useAdminClientesContratoCatalog() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()

  const query = useAdminContratoCatalogQuery(getAccessToken, isAuthenticated && !isBootstrapping)

  const contractTypes = query.data?.contractTypes ?? []

  const labelById = useMemo(
    () => Object.fromEntries(contractTypes.map((item) => [item.id, item.label])),
    [contractTypes],
  )

  return {
    contractTypes,
    labelById,
    isLoading: query.isPending || isBootstrapping,
    error: query.isError ? getAdminContratoCatalogErrorMessage(query.error) : null,
    reload: async () => {
      await query.refetch()
    },
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
