import { portalPath } from './portalHost'

export const prefeituraRoutes = {
  get login() {
    return portalPath('prefeitura', '/login')
  },
  get entrando() {
    return portalPath('prefeitura', '/entrando')
  },
  get dashboard() {
    return portalPath('prefeitura', '/dashboard')
  },
  get rede() {
    return portalPath('prefeitura', '/rede')
  },
  get monitor() {
    return portalPath('prefeitura', '/monitor')
  },
  get consultas() {
    return portalPath('prefeitura', '/consultas')
  },
  get agendas() {
    return portalPath('prefeitura', '/agendas')
  },
  get usuarios() {
    return portalPath('prefeitura', '/usuarios')
  },
  get contrato() {
    return portalPath('prefeitura', '/contrato')
  },
  get relatorios() {
    return portalPath('prefeitura', '/relatorios')
  },
  get notificacoes() {
    return portalPath('prefeitura', '/notificacoes')
  },
  get suporte() {
    return portalPath('prefeitura', '/suporte')
  },
  get credenciais() {
    return portalPath('prefeitura', '/credenciais')
  },
  get auditoria() {
    return portalPath('prefeitura', '/auditoria')
  },
} as const

export function prefeituraRelatoriosCategoryPath(categoryId: string) {
  return `${prefeituraRoutes.relatorios}/${categoryId}`
}

export function prefeituraRelatorioGeneratePath(reportId: string) {
  return `${prefeituraRoutes.relatorios}/gerar/${reportId}`
}

export function prefeituraRelatoriosCompiledPath() {
  return `${prefeituraRoutes.relatorios}/compilado`
}

export function buildPrefeituraRelatorioGenerateUrl(
  reportId: string,
  params: { periodStart: string; periodEnd: string },
) {
  const query = new URLSearchParams({
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
  })
  return `${prefeituraRelatorioGeneratePath(reportId)}?${query.toString()}`
}

export function buildPrefeituraRelatoriosCompiledUrl(params: {
  reportIds: string[]
  periodStart: string
  periodEnd: string
  categoryId?: string
}) {
  const query = new URLSearchParams({
    reports: params.reportIds.join(','),
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
  })
  if (params.categoryId) query.set('category', params.categoryId)
  return `${prefeituraRelatoriosCompiledPath()}?${query.toString()}`
}
