import { useEntidadeBranding } from '../contexts/EntidadeBrandingContext'
import { useBrandTheme } from './useBrandTheme'

/** Aplica a cor primária da entidade logada (fallback: env). */
export function useEntidadeBrandTheme() {
  const { corPrimaria } = useEntidadeBranding()
  useBrandTheme(corPrimaria)
}
