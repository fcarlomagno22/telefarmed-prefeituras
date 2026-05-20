import { useEffect } from 'react'
import { brand } from '../config/brand'

function shadeHex(hex: string, percent: number): string {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return hex

  const num = parseInt(normalized, 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent))
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent))

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function useBrandTheme() {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--brand-primary', brand.primaryColor)
    root.style.setProperty('--brand-primary-hover', shadeHex(brand.primaryColor, -20))
    root.style.setProperty('--brand-primary-light', `${brand.primaryColor}1a`)
  }, [])
}
