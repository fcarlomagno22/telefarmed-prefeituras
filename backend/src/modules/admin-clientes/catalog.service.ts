import { getClinicoCatalog } from '../admin-configuracoes/clinico.service.js'
import { getContratosCatalog } from '../admin-configuracoes/contratos.service.js'
import { resolveContratoModalidade } from './contratoModalidade.js'
import type {
  ClinicoCatalogDto,
  ClienteContratoCatalogDto,
} from './types.js'

export async function getClientesClinicoCatalog(options?: {
  activeOnly?: boolean
}): Promise<ClinicoCatalogDto> {
  const catalog = await getClinicoCatalog(options)

  return {
    professions: catalog.professions.map((item) => ({
      id: item.id,
      name: item.name,
      councilLabel: item.councilLabel,
      councilAcronym: item.councilAcronym,
      active: item.active,
      specialtyIds: item.specialtyIds,
    })),
    specialties: catalog.specialties.map((item) => ({
      id: item.id,
      name: item.name,
      active: item.active,
      professionIds: item.professionIds,
    })),
  }
}

export async function getClientesContratoCatalog(): Promise<ClienteContratoCatalogDto> {
  const catalog = await getContratosCatalog({ activeOnly: true })

  return {
    contractTypes: catalog.contractTypes.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      modalidade: resolveContratoModalidade(item.id, item.label),
    })),
    defaultAllowExceedPackage: catalog.commercialRules.defaultAllowExceedPackage,
    defaultAvulsoUnitValueBrl: catalog.commercialRules.defaultAvulsoUnitValueBrl,
  }
}
