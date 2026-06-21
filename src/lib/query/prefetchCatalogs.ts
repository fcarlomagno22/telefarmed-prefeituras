import type { QueryClient } from '@tanstack/react-query'
import {
  fetchClientesClinicoCatalog,
  fetchClientesContratoCatalog,
} from '../services/admin/clientes'
import { fetchUbtOptions } from '../services/admin/credenciais'
import { fetchPrefeituraActiveContratoEspecialidadeIds } from '../services/prefeitura/contrato'
import { fetchPrefeituraUbtOptions } from '../services/prefeitura/credenciais'
import {
  fetchPrefeituraRedeOverview,
  fetchPrefeituraRedeUnits,
} from '../services/prefeitura/rede'
import { fetchPublicClinicoCatalog } from '../services/configuracoes'
import { fetchProfissionalPerfil } from '../services/profissional/perfil'
import { queryKeys } from './keys'
import { CATALOG_GC_MS, CATALOG_STALE_MS, PORTAL_PAGE_GC_MS, PORTAL_PAGE_STALE_MS, UNITS_GC_MS, UNITS_STALE_MS } from './timings'

function clinicoCatalogPrefetch(activeOnly = true) {
  return {
    queryKey: queryKeys.clinicoCatalog(activeOnly),
    queryFn: () => fetchPublicClinicoCatalog(activeOnly),
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  } as const
}

function adminClinicoCatalogPrefetch(token: string, activeOnly = true) {
  return {
    queryKey: queryKeys.adminClinicoCatalog(activeOnly),
    queryFn: () => fetchClientesClinicoCatalog(token, activeOnly),
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  } as const
}

function contratoCatalogPrefetch(token: string) {
  return {
    queryKey: queryKeys.contratoCatalog(),
    queryFn: () => fetchClientesContratoCatalog(token),
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  } as const
}

function prefeituraUnitsPrefetch(token: string) {
  return {
    queryKey: queryKeys.prefeituraUnits(),
    queryFn: () => fetchPrefeituraRedeUnits(token),
    staleTime: UNITS_STALE_MS,
    gcTime: UNITS_GC_MS,
  } as const
}

function prefeituraRedeOverviewPrefetch(token: string) {
  return {
    queryKey: queryKeys.prefeituraRedeOverview(),
    queryFn: () => fetchPrefeituraRedeOverview(token),
    staleTime: UNITS_STALE_MS,
    gcTime: UNITS_GC_MS,
  } as const
}

function prefeituraUbtOptionsPrefetch(token: string) {
  return {
    queryKey: queryKeys.prefeituraUbtOptions(),
    queryFn: () => fetchPrefeituraUbtOptions(token),
    staleTime: UNITS_STALE_MS,
    gcTime: UNITS_GC_MS,
  } as const
}

function adminUbtOptionsPrefetch(token: string) {
  return {
    queryKey: queryKeys.adminUbtOptions(),
    queryFn: () => fetchUbtOptions(token),
    staleTime: UNITS_STALE_MS,
    gcTime: UNITS_GC_MS,
  } as const
}

function prefeituraContratoSpecialtyIdsPrefetch(token: string) {
  return {
    queryKey: queryKeys.prefeituraContratoSpecialtyIds(),
    queryFn: () => fetchPrefeituraActiveContratoEspecialidadeIds(token),
    staleTime: UNITS_STALE_MS,
    gcTime: UNITS_GC_MS,
  } as const
}

export async function prefetchAdminCatalogs(queryClient: QueryClient, token: string) {
  await Promise.all([
    queryClient.prefetchQuery(adminClinicoCatalogPrefetch(token)),
    queryClient.prefetchQuery(contratoCatalogPrefetch(token)),
    queryClient.prefetchQuery(adminUbtOptionsPrefetch(token)),
  ])
}

export async function prefetchPrefeituraCatalogs(queryClient: QueryClient, token: string) {
  await Promise.all([
    queryClient.prefetchQuery(clinicoCatalogPrefetch(true)),
    queryClient.prefetchQuery(prefeituraUnitsPrefetch(token)),
    queryClient.prefetchQuery(prefeituraUbtOptionsPrefetch(token)),
    queryClient.prefetchQuery(prefeituraContratoSpecialtyIdsPrefetch(token)),
  ])
}

export async function prefetchPrefeituraRedePageCatalogs(queryClient: QueryClient, token: string) {
  await Promise.all([
    queryClient.prefetchQuery(prefeituraRedeOverviewPrefetch(token)),
    queryClient.prefetchQuery(prefeituraUnitsPrefetch(token)),
  ])
}

export async function prefetchUbtCatalogs(queryClient: QueryClient) {
  await queryClient.prefetchQuery(clinicoCatalogPrefetch(true))
}

export async function prefetchProfissionalCatalogs(queryClient: QueryClient, token: string) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.profissionalPerfil(),
    queryFn: () => fetchProfissionalPerfil(token),
    staleTime: PORTAL_PAGE_STALE_MS,
    gcTime: PORTAL_PAGE_GC_MS,
  })
}

export function invalidatePrefeituraUnits(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.prefeituraUnits() })
  void queryClient.invalidateQueries({ queryKey: queryKeys.prefeituraRedeOverview() })
  void queryClient.invalidateQueries({ queryKey: queryKeys.prefeituraUbtOptions() })
}

export function invalidateClinicoCatalogs(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['clinico-catalog'] })
  void queryClient.invalidateQueries({ queryKey: ['admin-clinico-catalog'] })
}

export function invalidateContratoCatalog(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.contratoCatalog() })
}
