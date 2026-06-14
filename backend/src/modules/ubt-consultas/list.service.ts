import { mapConsultaOperacionalRow } from './formatters.js'
import { fetchConsultasOperacionais } from './query.service.js'
import type { UbtConsultasListQuery, UbtConsultasListResultDto, UbtConsultasScope } from './types.js'

export async function listUbtConsultas(
  scope: UbtConsultasScope,
  params: UbtConsultasListQuery,
): Promise<UbtConsultasListResultDto> {
  const page = params.page
  const pageSize = params.pageSize
  const { rows, total } = await fetchConsultasOperacionais(scope, params, { paginate: true })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    records: rows.map(mapConsultaOperacionalRow),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  }
}
