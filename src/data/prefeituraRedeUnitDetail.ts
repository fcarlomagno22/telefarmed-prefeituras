import type { PrefeituraRegionKey, PrefeituraSlaStatus, PrefeituraUbsRow } from './prefeituraDashboardMock'
import { getOperatorsForUnit, type PrefeituraRedeUbtOperator } from './prefeituraRedeBroadcastMock'
import {
  findPrefeituraDashboardRowForRedeUnit,
  type PrefeituraRedeUnit,
  type PrefeituraRedeUnitStatus,
} from './prefeituraRedeMock'
import { prefeituraRedeStatusBadgeConfig } from '../components/prefeitura/rede/prefeituraRedeStatusBadge'
import type { NewUbtFormState } from '../components/prefeitura/rede/newUbt/newUbtFormTypes'
import {
  formatNewUbtAddress,
  getNewUbtUnitTypeLabel,
} from '../components/prefeitura/rede/newUbt/newUbtFormTypes'
import { buildPrefeituraUbsDetail, type PrefeituraUbsDetail } from './prefeituraUbsDetails'
import { specialties } from './specialties'

export type PrefeituraRedeUnitCadastralProfile = {
  unitType: 'Fixa' | 'Móvel'
  responsibleEmail: string
  responsibleCpf: string
  unitLandline: string
  dailyCapacityLabel: string
  specialtyNames: string[]
  address: PrefeituraRedeUnitCadastral['address']
  notes: string
  credentialsConfigured: boolean
}

export type PrefeituraRedeUnitCadastral = {
  unit: PrefeituraRedeUnit
  unitType: 'Fixa' | 'Móvel'
  statusLabel: string
  responsibleEmail: string
  responsibleCpf: string
  unitLandline: string
  dailyCapacityLabel: string
  specialtyNames: string[]
  operators: PrefeituraRedeUbtOperator[]
  address: {
    cep: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
    formatted: string
  }
  notes: string
  credentialsConfigured: boolean
}

export type PrefeituraRedeUnitFullDetail = {
  cadastral: PrefeituraRedeUnitCadastral
  metrics: PrefeituraUbsDetail
}

export function formatPrefeituraRedeUnitLocation(cadastral: PrefeituraRedeUnitCadastral) {
  const { address, unit } = cadastral
  const streetLine = [
    address.street,
    address.number ? `nº ${address.number}` : '',
    address.complement,
  ]
    .filter(Boolean)
    .join(', ')

  const localityLine = [address.neighborhood, `${address.city} - ${address.state}`]
    .filter(Boolean)
    .join(' · ')

  const metaParts = [address.cep, cadastral.unitLandline].filter(Boolean)

  return {
    primary: streetLine || address.formatted || unit.address,
    locality: localityLine,
    meta: metaParts.join(' · '),
    full: [streetLine, localityLine, metaParts.join(' · ')].filter(Boolean).join(' · ') || unit.address,
  }
}

function seedFromId(id: string) {
  return id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

const operatorRoleTemplates = [
  { name: 'Juliana Martins', role: 'Enfermeira' },
  { name: 'Camila Rocha', role: 'Recepcionista' },
  { name: 'Beatriz Alves', role: 'Assistente de triagem' },
  { name: 'Fernanda Oliveira', role: 'Enfermeira' },
  { name: 'Larissa Nunes', role: 'Recepcionista' },
]

function toDashboardRegionKey(regionKey: string): PrefeituraRegionKey {
  if (regionKey === 'norte' || regionKey === 'leste' || regionKey === 'central' || regionKey === 'sul') {
    return regionKey
  }
  return 'central'
}

function mapRedeStatusToSla(status: PrefeituraRedeUnitStatus): PrefeituraSlaStatus {
  if (status === 'ativa') return 'normal'
  if (status === 'manutencao') return 'atencao'
  return 'critico'
}

function buildDashboardRowFromRedeUnit(unit: PrefeituraRedeUnit): PrefeituraUbsRow {
  const seed = seedFromId(unit.id)
  const consultationsToday = 18 + (seed % 35)

  return {
    id: unit.dashboardRowId ?? unit.id,
    name: unit.name,
    region: unit.region,
    regionKey: toDashboardRegionKey(unit.regionKey),
    type: seed % 3 === 0 ? 'Tipo II' : 'Tipo I',
    typeKey: seed % 3 === 0 ? 'tipo2' : 'tipo1',
    consultationsToday,
    queueNow: Math.max(0, Math.round(unit.stationsOnline * (0.4 + (seed % 4) * 0.1))),
    avgWait: `${7 + (seed % 14)} min`,
    absencesToday: Math.max(0, Math.round((unit.stationsTotal - unit.stationsOnline) * 1.5) + (seed % 3)),
    sla: mapRedeStatusToSla(unit.status),
    statusDot: mapRedeStatusToSla(unit.status),
  }
}

function resolveDashboardRow(unit: PrefeituraRedeUnit): PrefeituraUbsRow {
  return findPrefeituraDashboardRowForRedeUnit(unit) ?? buildDashboardRowFromRedeUnit(unit)
}

function buildAddress(unit: PrefeituraRedeUnit) {
  const seed = seedFromId(unit.id)
  const streets = ['Av. das Flores', 'Rua das Palmeiras', 'SQN', 'QN', 'Av. Central']
  const neighborhoods = ['Centro', 'Asa Norte', 'Taguatinga', 'Ceilândia', 'Samambaia']

  return {
    cep: `${String(70000 + (seed % 899)).padStart(5, '0')}-${String(100 + (seed % 899)).padStart(3, '0')}`,
    street: streets[seed % streets.length]!,
    number: String(100 + (seed % 900)),
    complement: seed % 4 === 0 ? 'Bloco B' : '',
    neighborhood: neighborhoods[seed % neighborhoods.length]!,
    city: 'Brasília',
    state: 'DF',
    formatted: unit.address,
  }
}

function pickSpecialtyNames(unit: PrefeituraRedeUnit): string[] {
  const seed = seedFromId(unit.id)
  const sorted = [...specialties].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const count = 6 + (seed % 8)
  const start = seed % Math.max(1, sorted.length - count)

  return sorted.slice(start, start + count).map((item) => item.name)
}

function resolveOperators(unit: PrefeituraRedeUnit): PrefeituraRedeUbtOperator[] {
  const existing = getOperatorsForUnit(unit.id)
  if (existing.length > 0) return existing

  const seed = seedFromId(unit.id)
  const count = 2 + (seed % 2)

  return operatorRoleTemplates.slice(0, count).map((template, index) => ({
    id: `${unit.id}-op-${index}`,
    unitId: unit.id,
    name: template.name,
    role: template.role,
  }))
}

export function buildCadastralProfileFromNewUbtForm(form: NewUbtFormState): PrefeituraRedeUnitCadastralProfile {
  const specialtyNames = specialties
    .filter((item) => form.specialtyIds.has(item.id))
    .map((item) => item.name)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))

  return {
    unitType: getNewUbtUnitTypeLabel(form.unitType) as 'Fixa' | 'Móvel',
    responsibleEmail: form.responsibleEmail.trim(),
    responsibleCpf: form.responsibleCpf.trim(),
    unitLandline: form.unitLandlinePhone.trim(),
    dailyCapacityLabel: form.enableDailyCapacityLimit
      ? `${form.dailyCapacityPerUnit.trim() || '0'} consultas/dia`
      : 'Sem limite por unidade',
    specialtyNames,
    address: {
      cep: form.cep.trim(),
      street: form.street.trim(),
      number: form.number.trim(),
      complement: form.complement.trim(),
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      formatted: formatNewUbtAddress(form),
    },
    notes: form.notes.trim(),
    credentialsConfigured: false,
  }
}

export function buildPrefeituraRedeUnitCadastral(
  unit: PrefeituraRedeUnit,
  profile?: PrefeituraRedeUnitCadastralProfile,
): PrefeituraRedeUnitCadastral {
  const seed = seedFromId(unit.id)
  const unitType: 'Fixa' | 'Móvel' = profile?.unitType ?? (seed % 5 === 0 ? 'Móvel' : 'Fixa')
  const hasLimit = profile ? profile.dailyCapacityLabel !== 'Sem limite por unidade' : seed % 3 !== 0
  const mockAddress = buildAddress(unit)

  return {
    unit,
    unitType,
    statusLabel: prefeituraRedeStatusBadgeConfig[unit.status].label,
    responsibleEmail:
      profile?.responsibleEmail ??
      `${unit.responsibleName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '.')}@ubt.gov.br`,
    responsibleCpf:
      profile?.responsibleCpf ??
      `${String(100 + (seed % 899)).padStart(3, '0')}.${String(100 + ((seed * 3) % 899)).padStart(3, '0')}.${String(100 + ((seed * 7) % 899)).padStart(3, '0')}-${String(10 + (seed % 89)).padStart(2, '0')}`,
    unitLandline:
      profile?.unitLandline ??
      (seed % 2 === 0
        ? `(61) 3${String(300 + (seed % 699)).padStart(3, '0')}-${String(1000 + (seed % 8999)).padStart(4, '0')}`
        : ''),
    dailyCapacityLabel:
      profile?.dailyCapacityLabel ??
      (hasLimit ? `${16 + (seed % 40)} consultas/dia` : 'Sem limite por unidade'),
    specialtyNames: profile?.specialtyNames ?? pickSpecialtyNames(unit),
    operators: resolveOperators(unit),
    address: profile?.address ?? mockAddress,
    notes:
      profile?.notes ??
      (seed % 4 === 0
        ? 'Unidade prioritária para expansão de terminais no próximo trimestre.'
        : ''),
    credentialsConfigured: profile?.credentialsConfigured ?? true,
  }
}

export function buildPrefeituraRedeUnitFullDetail(
  unit: PrefeituraRedeUnit,
  profile?: PrefeituraRedeUnitCadastralProfile,
): PrefeituraRedeUnitFullDetail {
  const dashboardRow = resolveDashboardRow(unit)

  return {
    cadastral: buildPrefeituraRedeUnitCadastral(unit, profile),
    metrics: buildPrefeituraUbsDetail(dashboardRow),
  }
}
