import { useLayoutEffect } from 'react'
import { brand } from '../config/brand'
import { useOptionalEntidadeBranding } from '../contexts/EntidadeBrandingContext'
import { applyBrandCssVariables } from '../utils/brandColor'

export function useBrandTheme(primaryColor?: string | null) {
  const entidadeBranding = useOptionalEntidadeBranding()
  const resolved =
    primaryColor?.trim() ||
    entidadeBranding?.corPrimaria ||
    brand.primaryColor

  useLayoutEffect(() => {
    applyBrandCssVariables(resolved)
  }, [resolved])
}
