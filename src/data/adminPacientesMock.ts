import {
  prefeituraMunicipalPatients,
  type PrefeituraMunicipalPatient,
} from './prefeituraMunicipalPatientsMock'
import { adminClientesRows, type AdminClienteRow } from './adminClientesMock'

export type AdminContractStatus = 'ativo' | 'encerrado'

export type AdminPatientContractingEntity = {
  id: string
  razaoSocial: string
  municipality: string
  uf: string
  contractStatus: AdminContractStatus
}

export type AdminMunicipalPatient = PrefeituraMunicipalPatient & {
  municipality: string
  contractStatus: AdminContractStatus
  registrationMonthLabel: 'Dez' | 'Jan' | 'Fev' | 'Mar' | 'Abr' | 'Mai'
  contractingEntityId: string
  contractingEntityRazaoSocial: string
}

export const adminMunicipalityCatalog = [
  'São José dos Campos',
  'Taubaté',
  'Pindamonhangaba',
  'Jacareí',
  'Guaratinguetá',
  'Caçapava',
  'Lorena',
  'Cruzeiro',
  'Aparecida',
  'Campos do Jordão',
] as const

const contractByMunicipality: Record<(typeof adminMunicipalityCatalog)[number], AdminContractStatus> = {
  'São José dos Campos': 'ativo',
  Taubaté: 'ativo',
  Pindamonhangaba: 'encerrado',
  Jacareí: 'ativo',
  Guaratinguetá: 'encerrado',
  Caçapava: 'ativo',
  Lorena: 'encerrado',
  Cruzeiro: 'ativo',
  Aparecida: 'encerrado',
  'Campos do Jordão': 'ativo',
}

const monthCycle: AdminMunicipalPatient['registrationMonthLabel'][] = [
  'Dez',
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
]

export const adminMunicipalPatients: AdminMunicipalPatient[] = prefeituraMunicipalPatients.map(
  (patient, index) => {
    const municipality = adminMunicipalityCatalog[index % adminMunicipalityCatalog.length]
    const contractingEntity = buildCatalogContractingEntity(municipality)
    return {
      ...patient,
      municipality,
      contractStatus: contractByMunicipality[municipality],
      registrationMonthLabel: monthCycle[index % monthCycle.length],
      contractingEntityId: contractingEntity.id,
      contractingEntityRazaoSocial: contractingEntity.razaoSocial,
    }
  },
)

export function getAdminMunicipalityOptions(patients: AdminMunicipalPatient[]) {
  void patients
  return [...adminMunicipalityCatalog].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function getAdminContractStatusForMunicipality(
  municipality: string,
): AdminContractStatus {
  return contractByMunicipality[municipality as (typeof adminMunicipalityCatalog)[number]] ?? 'ativo'
}

function buildCatalogContractingEntity(
  municipality: (typeof adminMunicipalityCatalog)[number],
): AdminPatientContractingEntity {
  return {
    id: `ent-${municipality.toLowerCase().replace(/\s+/g, '-')}`,
    razaoSocial: `Prefeitura Municipal de ${municipality}`,
    municipality,
    uf: 'SP',
    contractStatus: contractByMunicipality[municipality],
  }
}

function mapClienteRowToContractingEntity(row: AdminClienteRow): AdminPatientContractingEntity {
  const hasActiveContract = row.contratos.some((contract) => contract.status === 'ativo')
  return {
    id: row.id,
    razaoSocial: row.razaoSocial,
    municipality: row.municipio,
    uf: row.uf,
    contractStatus: hasActiveContract ? 'ativo' : 'encerrado',
  }
}

export function getAdminPatientContractingEntities(): AdminPatientContractingEntity[] {
  const catalogEntities = adminMunicipalityCatalog.map(buildCatalogContractingEntity)
  const clienteEntities = adminClientesRows
    .filter((row) => row.status === 'ativa' || row.status === 'implantacao')
    .map(mapClienteRowToContractingEntity)

  const merged = new Map<string, AdminPatientContractingEntity>()
  for (const entity of [...catalogEntities, ...clienteEntities]) {
    merged.set(entity.id, entity)
  }

  return Array.from(merged.values()).sort((a, b) =>
    a.razaoSocial.localeCompare(b.razaoSocial, 'pt-BR'),
  )
}

export function findAdminPatientContractingEntity(
  entityId: string,
): AdminPatientContractingEntity | undefined {
  return getAdminPatientContractingEntities().find((entity) => entity.id === entityId)
}
