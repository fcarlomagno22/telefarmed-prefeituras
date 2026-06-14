import { listProfissionaisForUbt } from '../comunicados/profissionais-scope.service.js'
import type { UbtProfissionaisCatalogQuery } from './schemas.js'

export async function listUbtProfissionaisCatalog(
  entidadeId: string,
  unitId: string,
  query: UbtProfissionaisCatalogQuery,
) {
  const profissionais = await listProfissionaisForUbt(entidadeId, unitId, {
    search: query.search,
  })

  return profissionais.map((item) => ({
    id: item.id,
    name: item.nome,
    specialty: item.especialidade,
  }))
}
