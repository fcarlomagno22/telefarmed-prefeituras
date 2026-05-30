import { adminClientesRows, type AdminClienteStatus } from './adminClientesMock'
import { prefeituraRedeUnits } from './prefeituraRedeMock'

export type AdminNotificacaoPrefeitura = {
  id: string
  name: string
  municipio: string
  uf: string
  status: AdminClienteStatus
}

export type AdminNotificacaoUbt = {
  id: string
  name: string
  municipalityId: string
  municipalityName: string
  region: string
  regionKey: string
  status: 'ativa' | 'manutencao' | 'inativa'
}

const prefeituraStatusesForNotify: AdminClienteStatus[] = ['ativa', 'implantacao']

export const adminNotificacaoPrefeituras: AdminNotificacaoPrefeitura[] = adminClientesRows
  .filter((row) => prefeituraStatusesForNotify.includes(row.status))
  .map((row) => ({
    id: row.id,
    name: row.prefeitura,
    municipio: row.municipio,
    uf: row.uf,
    status: row.status,
  }))

/** UBTs da rede — vinculadas à prefeitura principal do mock (Brasília). */
export const adminNotificacaoUbts: AdminNotificacaoUbt[] = prefeituraRedeUnits.map((unit) => ({
  id: unit.id,
  name: unit.name,
  municipalityId: 'cli-bsb',
  municipalityName: 'Brasília',
  region: unit.region,
  regionKey: unit.regionKey,
  status: unit.status,
}))

export const adminNotificacaoUfFilterOptions = [
  { value: 'all', label: 'UF: Todas' },
  ...Array.from(new Set(adminNotificacaoPrefeituras.map((p) => p.uf)))
    .sort()
    .map((uf) => ({ value: uf, label: uf })),
]

export const adminNotificacaoMunicipalityFilterOptions = [
  { value: 'all', label: 'Prefeitura: Todas' },
  ...adminNotificacaoPrefeituras.map((p) => ({
    value: p.id,
    label: `${p.name} · ${p.uf}`,
  })),
]

export const adminNotificacaoRegionFilterOptions = [
  { value: 'all', label: 'Região: Todas' },
  { value: 'centro', label: 'Centro' },
  { value: 'norte', label: 'Norte' },
  { value: 'sul', label: 'Sul' },
  { value: 'leste', label: 'Leste' },
  { value: 'oeste', label: 'Oeste' },
]
