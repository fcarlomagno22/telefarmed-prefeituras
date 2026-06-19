import {
  slotAuthorizedForClienteContratos,
  type ContratoSpecialtyIndex,
} from '../../lib/escalaContratoScope.js'
import { loadContratosBundleForEntidades } from '../admin-clientes/contratos.service.js'
import { loadActiveContratoIds } from './ownership.js'

export type { ContratoSpecialtyIndex }

export async function loadContratoSpecialtyContext(entidadeId: string): Promise<{
  contratoIds: string[]
  index: ContratoSpecialtyIndex
}> {
  const contratoIds = await loadActiveContratoIds(entidadeId)
  if (contratoIds.length === 0) {
    return { contratoIds: [], index: new Map() }
  }

  const bundle = await loadContratosBundleForEntidades([entidadeId])
  const contratos = bundle.contratosByEntidade.get(entidadeId) ?? []
  const activeContratoIdSet = new Set(contratoIds)
  const index: ContratoSpecialtyIndex = new Map()

  for (const contrato of contratos) {
    if (!activeContratoIdSet.has(contrato.id)) continue
    index.set(
      contrato.id,
      new Set(contrato.detalhes?.especialidadesAutorizadas ?? []),
    )
  }

  return { contratoIds, index }
}

export { slotAuthorizedForClienteContratos as slotAuthorizedForCliente }
