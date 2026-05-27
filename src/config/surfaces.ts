/**
 * Bordas e sombras de painéis brancos sobre fundo #f5f6f8.
 * gray-200 + sombra um pouco mais forte: legível em monitores e TVs (alto brilho).
 */
export const panelBorderClass = 'border-gray-200'

export const panelShadowClass =
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]'

export const panelShadowSoftClass =
  'shadow-[0_1px_2px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)]'

/** Card/painel branco padrão (rounded-2xl + borda + sombra). */
export const panelSurfaceClass = `rounded-2xl border ${panelBorderClass} bg-white ${panelShadowClass}`

/** Borda + sombra sem radius (o componente define o arredondamento). */
export const panelSurfaceBorderShadowClass = `border ${panelBorderClass} bg-white ${panelShadowClass}`
