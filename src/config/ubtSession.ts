import { useOptionalUbtAuth } from '../contexts/UbtAuthContext'

/** Unidade operadora logada no painel UBT (fallback mock quando fora do provider). */
export const currentUbtUnitFallback = {
  id: 'ubt_centro',
  name: 'UBT Centro',
} as const

/** @deprecated Use `useCurrentUbtUnit()` dentro do portal autenticado. */
export const currentUbtUnit = currentUbtUnitFallback

export function useCurrentUbtUnit() {
  const auth = useOptionalUbtAuth()
  if (auth?.user) {
    return {
      id: auth.user.unidadeUbtId,
      name: auth.user.unidadeUbtNome,
      entidadeContratanteId: auth.user.entidadeContratanteId,
      municipio: auth.user.municipio,
      uf: auth.user.uf,
    }
  }
  return currentUbtUnitFallback
}
