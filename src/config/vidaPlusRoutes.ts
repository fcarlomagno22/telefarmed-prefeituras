const ROOT_DOMAIN =
  (import.meta.env.VITE_PUBLIC_ROOT_DOMAIN as string | undefined)?.trim() || 'telefarmed.com.br'

export const vidaPlusRoutes = {
  home: '/vida',
} as const

export const vidaPlusBrand = {
  name: 'Vida+',
  tagline: 'App de vida saudável do município',
  description:
    'Hábitos saudáveis, desafios e acompanhamento do seu bem-estar na rede municipal.',
} as const

/** URL pública do app cidadão (Expo web). */
export function resolveVidaPlusAppUrl(): string {
  const override = (import.meta.env.VITE_VIDA_PLUS_URL as string | undefined)?.trim()
  if (override) return override

  if (import.meta.env.DEV) {
    return 'http://vd.localhost:8081'
  }

  return `https://vd.${ROOT_DOMAIN}`
}
