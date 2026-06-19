export const PLANTAO_ACEITE_DEMO_TOKEN = 'demo'
export const PLANTAO_ACEITE_DEMO_ESGOTADO_TOKEN = 'demo-esgotado'
export const PLANTAO_ACEITE_DIGEST_DEMO_TOKEN = 'demo-disponiveis'
export const LIVE_SHARE_DEMO_TOKEN = 'demo'

export const publicRoutes = {
  plantaoAceitar: (token: string) =>
    `/plantao/aceitar/${encodeURIComponent(token)}`,
  plantaoDisponiveis: (token: string) =>
    `/plantao/disponiveis/${encodeURIComponent(token)}`,
  get plantaoAceitarDemo() {
    return `/plantao/aceitar/${PLANTAO_ACEITE_DEMO_TOKEN}`
  },
  get plantaoAceitarDemoEsgotado() {
    return `/plantao/aceitar/${PLANTAO_ACEITE_DEMO_ESGOTADO_TOKEN}`
  },
  get plantaoDisponiveisDemo() {
    return `/plantao/disponiveis/${PLANTAO_ACEITE_DIGEST_DEMO_TOKEN}`
  },
  liveShare: (token: string) => `/${encodeURIComponent(token)}`,
  get liveShareDemo() {
    return `/${LIVE_SHARE_DEMO_TOKEN}`
  },
  /** @deprecated Links antigos em prefeitura.telefarmed.com.br/acompanhar/… */
  liveShareLegacyAcompanhar: (token: string) =>
    `/acompanhar/${encodeURIComponent(token)}`,
} as const
