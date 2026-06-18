import { useEffect } from 'react'
import { brand } from '../config/brand'
import { applyBrandCssVariables } from '../utils/brandColor'

export function useBrandTheme(primaryColor?: string | null) {
  const resolved = primaryColor?.trim() || brand.primaryColor

  useEffect(() => {
    applyBrandCssVariables(resolved)
  }, [resolved])
}
