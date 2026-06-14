export const prefeituraRoutes = {
  relatorios: '/prefeitura/relatorios',
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

