import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import { buildCatalogFromUnits } from './formatters.js'
import type { PrefeituraAgendaCatalogDto } from './types.js'

export async function getPrefeituraAgendaCatalog(
  entidadeId: string,
): Promise<PrefeituraAgendaCatalogDto> {
  const units = await listRedeUnits(entidadeId)
  return buildCatalogFromUnits(units)
}
