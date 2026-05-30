import {
  adminNotificacaoPrefeituras,
  type AdminNotificacaoPrefeitura,
  type AdminNotificacaoUbt,
} from './adminNotificacoesRecipients'
import { prefeituraRedeUnits } from './prefeituraRedeMock'

export type { AdminNotificacaoPrefeitura as AdminEscalaPrefeitura }
export type { AdminNotificacaoUbt as AdminEscalaUbt }

export const adminEscalaPrefeituras = adminNotificacaoPrefeituras

const brasiliaUbts: AdminNotificacaoUbt[] = prefeituraRedeUnits.map((unit) => ({
  id: unit.id,
  name: unit.name,
  municipalityId: 'cli-bsb',
  municipalityName: 'Brasília',
  region: unit.region,
  regionKey: unit.regionKey,
  status: unit.status,
}))

const campinasUbts: AdminNotificacaoUbt[] = [
  {
    id: 'ubt-sul',
    name: 'UBT Sul',
    municipalityId: 'cli-campinas',
    municipalityName: 'Campinas',
    region: 'Sul',
    regionKey: 'sul',
    status: 'ativa',
  },
  {
    id: 'ubt-campinas-centro',
    name: 'UBT Centro Campinas',
    municipalityId: 'cli-campinas',
    municipalityName: 'Campinas',
    region: 'Centro',
    regionKey: 'centro',
    status: 'ativa',
  },
]

export const adminEscalaUbts: AdminNotificacaoUbt[] = [...brasiliaUbts, ...campinasUbts]

export function getUbtsForPrefeituraIds(prefeituraIds: string[]): AdminNotificacaoUbt[] {
  if (prefeituraIds.length === 0) return adminEscalaUbts
  const set = new Set(prefeituraIds)
  return adminEscalaUbts.filter((ubt) => set.has(ubt.municipalityId))
}

export function getPrefeituraById(id: string) {
  return adminEscalaPrefeituras.find((p) => p.id === id)
}

export function getUbtById(id: string) {
  return adminEscalaUbts.find((u) => u.id === id)
}
