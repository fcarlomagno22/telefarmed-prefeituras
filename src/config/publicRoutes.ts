export const PLANTAO_ACEITE_DEMO_TOKEN = 'demo'
export const PLANTAO_ACEITE_DEMO_ESGOTADO_TOKEN = 'demo-esgotado'

export const publicRoutes = {
  plantaoAceitar: (token: string) =>
    `/plantao/aceitar/${encodeURIComponent(token)}`,
  get plantaoAceitarDemo() {
    return `/plantao/aceitar/${PLANTAO_ACEITE_DEMO_TOKEN}`
  },
  get plantaoAceitarDemoEsgotado() {
    return `/plantao/aceitar/${PLANTAO_ACEITE_DEMO_ESGOTADO_TOKEN}`
  },
} as const
