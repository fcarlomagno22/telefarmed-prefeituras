import { Building2, Monitor, Users, Wifi } from 'lucide-react'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import type { DonutSlice } from '../components/credenciais/CredentialDonutChart'
import type { PrefeituraUbsRow } from './prefeituraDashboardMock'
import { prefeituraUbsRows } from './prefeituraDashboardMock'

export type PrefeituraRedeUnitStatus = 'ativa' | 'manutencao' | 'inativa'

export type PrefeituraRedeUnit = {
  id: string
  name: string
  address: string
  cnes: string
  region: string
  regionKey: string
  responsibleName: string
  responsiblePhone: string
  stationsTotal: number
  stationsOnline: number
  status: PrefeituraRedeUnitStatus
  maintenanceTerminalIndexes?: number[]
  /** Vínculo com linha do dashboard para abrir detalhes. */
  dashboardRowId?: string
}

export const prefeituraRedeKpiCards: KpiStatCardItem[] = [
  {
    label: 'Unidades ativas',
    value: '24',
    suffix: 'de 28 unidades',
    icon: Building2,
    iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
    iconRing: 'ring-emerald-100/80',
    topBar: 'from-emerald-400 to-green-500',
  },
  {
    label: 'Terminais de atendimento',
    value: '86',
    suffix: 'computadores',
    icon: Monitor,
    iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
    iconRing: 'ring-blue-100/80',
    topBar: 'from-sky-400 to-blue-500',
  },
  {
    label: 'Capacidade diária',
    value: '512',
    suffix: 'atendimentos',
    icon: Users,
    iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
    iconRing: 'ring-orange-100/80',
    topBar: 'from-orange-400 to-amber-500',
  },
  {
    label: 'Taxa de disponibilidade',
    value: '98%',
    suffix: 'dos terminais online',
    icon: Wifi,
    iconGradient: 'from-teal-500 via-cyan-500 to-sky-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(20,184,166,0.35)]',
    iconRing: 'ring-teal-100/80',
    topBar: 'from-teal-400 to-cyan-500',
  },
]

export const prefeituraRedeRegionFilterOptions = [
  { value: 'todas', label: 'Todas as regiões' },
  { value: 'centro', label: 'Centro' },
  { value: 'norte', label: 'Norte' },
  { value: 'sul', label: 'Sul' },
  { value: 'leste', label: 'Leste' },
  { value: 'oeste', label: 'Oeste' },
] as const

export const prefeituraRedeStatusFilterOptions = [
  { value: 'todas', label: 'Status: Todas' },
  { value: 'ativa', label: 'Ativa' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'inativa', label: 'Inativa' },
] as const

const extraRedeUnits: PrefeituraRedeUnit[] = [
  {
    id: 'rede-8',
    name: 'UBT Asa Norte',
    address: 'SQN 302 Bloco A',
    cnes: '7890123',
    region: 'Norte',
    regionKey: 'norte',
    responsibleName: 'Ana Paula Ribeiro',
    responsiblePhone: '(61) 3344-1200',
    stationsTotal: 5,
    stationsOnline: 5,
    status: 'ativa',
  },
  {
    id: 'rede-9',
    name: 'UBT Taguatinga',
    address: 'CNB 12 Lote 5',
    cnes: '8901234',
    region: 'Oeste',
    regionKey: 'oeste',
    responsibleName: 'Marcos Teixeira',
    responsiblePhone: '(61) 3355-2200',
    stationsTotal: 4,
    stationsOnline: 4,
    status: 'ativa',
  },
  {
    id: 'rede-10',
    name: 'UBT Ceilândia',
    address: 'QNM 18 Conj. O',
    cnes: '9012345',
    region: 'Oeste',
    regionKey: 'oeste',
    responsibleName: 'Patrícia Nunes',
    responsiblePhone: '(61) 3366-3300',
    stationsTotal: 4,
    stationsOnline: 3,
    status: 'ativa',
  },
  {
    id: 'rede-11',
    name: 'UBT Samambaia',
    address: 'QR 210 Conj. 8',
    cnes: '0123456',
    region: 'Oeste',
    regionKey: 'oeste',
    responsibleName: 'Ricardo Mendes',
    responsiblePhone: '(61) 3377-4400',
    stationsTotal: 3,
    stationsOnline: 3,
    status: 'ativa',
  },
  {
    id: 'rede-12',
    name: 'UBT Planaltina',
    address: 'Av. Independência, 890',
    cnes: '1234560',
    region: 'Norte',
    regionKey: 'norte',
    responsibleName: 'Helena Costa',
    responsiblePhone: '(61) 3388-5500',
    stationsTotal: 3,
    stationsOnline: 2,
    status: 'ativa',
  },
  {
    id: 'rede-13',
    name: 'UBT Gama',
    address: 'Setor Central, 45',
    cnes: '2345601',
    region: 'Leste',
    regionKey: 'leste',
    responsibleName: 'João Pedro Alves',
    responsiblePhone: '(61) 3399-6600',
    stationsTotal: 4,
    stationsOnline: 4,
    status: 'ativa',
  },
  {
    id: 'rede-14',
    name: 'UBT Sobradinho',
    address: 'Quadra 6 Lote 12',
    cnes: '3456012',
    region: 'Norte',
    regionKey: 'norte',
    responsibleName: 'Luciana Freitas',
    responsiblePhone: '(61) 3400-7700',
    stationsTotal: 3,
    stationsOnline: 3,
    status: 'ativa',
  },
  {
    id: 'rede-15',
    name: 'UBT Recanto das Emas',
    address: 'QRE 02 Área Especial',
    cnes: '4560123',
    region: 'Sul',
    regionKey: 'sul',
    responsibleName: 'Bruno Carvalho',
    responsiblePhone: '(61) 3411-8800',
    stationsTotal: 4,
    stationsOnline: 4,
    status: 'ativa',
  },
  {
    id: 'rede-16',
    name: 'UBT Santa Maria',
    address: 'QR 210 Conj. 1',
    cnes: '5601234',
    region: 'Sul',
    regionKey: 'sul',
    responsibleName: 'Camila Duarte',
    responsiblePhone: '(61) 3422-9900',
    stationsTotal: 3,
    stationsOnline: 3,
    status: 'ativa',
  },
  {
    id: 'rede-17',
    name: 'UBT Brazlândia',
    address: 'Setor Norte, 200',
    cnes: '6012345',
    region: 'Norte',
    regionKey: 'norte',
    responsibleName: 'Felipe Araújo',
    responsiblePhone: '(61) 3433-1010',
    stationsTotal: 2,
    stationsOnline: 2,
    status: 'ativa',
  },
  {
    id: 'rede-18',
    name: 'UBT Paranoá',
    address: 'Quadra 12 Conj. B',
    cnes: '7123456',
    region: 'Leste',
    regionKey: 'leste',
    responsibleName: 'Mariana Souza',
    responsiblePhone: '(61) 3444-2020',
    stationsTotal: 3,
    stationsOnline: 2,
    status: 'ativa',
  },
  {
    id: 'rede-19',
    name: 'UBT Núcleo Bandeirante',
    address: 'EQ 1/5 Lote 8',
    cnes: '8234567',
    region: 'Sul',
    regionKey: 'sul',
    responsibleName: 'Thiago Rocha',
    responsiblePhone: '(61) 3455-3030',
    stationsTotal: 2,
    stationsOnline: 2,
    status: 'ativa',
  },
  {
    id: 'rede-20',
    name: 'UBT Riacho Fundo',
    address: 'QN 15 Conj. 3',
    cnes: '9345678',
    region: 'Oeste',
    regionKey: 'oeste',
    responsibleName: 'Vanessa Lopes',
    responsiblePhone: '(61) 3466-4040',
    stationsTotal: 3,
    stationsOnline: 2,
    status: 'ativa',
  },
  {
    id: 'rede-21',
    name: 'UBT Candangolândia',
    address: 'Área Especial 2',
    cnes: '0456789',
    region: 'Sul',
    regionKey: 'sul',
    responsibleName: 'Gustavo Pires',
    responsiblePhone: '(61) 3477-5050',
    stationsTotal: 2,
    stationsOnline: 1,
    status: 'manutencao',
  },
  {
    id: 'rede-22',
    name: 'UBT Cruzeiro',
    address: 'SQS 116 Bloco K',
    cnes: '1567890',
    region: 'Centro',
    regionKey: 'centro',
    responsibleName: 'Isabela Martins',
    responsiblePhone: '(61) 3488-6060',
    stationsTotal: 4,
    stationsOnline: 4,
    status: 'ativa',
  },
  {
    id: 'rede-23',
    name: 'UBT Guará',
    address: 'QI 9 Bloco A',
    cnes: '2678901',
    region: 'Sul',
    regionKey: 'sul',
    responsibleName: 'Rodrigo Campos',
    responsiblePhone: '(61) 3499-7070',
    stationsTotal: 3,
    stationsOnline: 0,
    status: 'inativa',
  },
  {
    id: 'rede-24',
    name: 'UBT Vicente Pires',
    address: 'Rua 4 Chácara 85',
    cnes: '3789012',
    region: 'Norte',
    regionKey: 'norte',
    responsibleName: 'Aline Borges',
    responsiblePhone: '(61) 3500-8080',
    stationsTotal: 3,
    stationsOnline: 0,
    status: 'inativa',
  },
]

const primaryRedeUnits: PrefeituraRedeUnit[] = [
  {
    id: 'rede-1',
    name: 'UBT Centro',
    address: 'Av. República, 123',
    cnes: '2345678',
    region: 'Centro',
    regionKey: 'centro',
    responsibleName: 'Maria Oliveira',
    responsiblePhone: '(61) 3214-5678',
    stationsTotal: 6,
    stationsOnline: 6,
    status: 'ativa',
    dashboardRowId: '1',
  },
  {
    id: 'rede-2',
    name: 'UBT Norte',
    address: 'Quadra 12, Lote 5',
    cnes: '3456789',
    region: 'Norte',
    regionKey: 'norte',
    responsibleName: 'Carlos Lima',
    responsiblePhone: '(61) 3225-6789',
    stationsTotal: 5,
    stationsOnline: 5,
    status: 'ativa',
    dashboardRowId: '2',
  },
  {
    id: 'rede-3',
    name: 'UBT Sul',
    address: 'R. das Palmeiras, 456',
    cnes: '4567890',
    region: 'Sul',
    regionKey: 'sul',
    responsibleName: 'Fernanda Alves',
    responsiblePhone: '(61) 3236-7890',
    stationsTotal: 4,
    stationsOnline: 4,
    status: 'ativa',
    dashboardRowId: '4',
  },
  {
    id: 'rede-4',
    name: 'UBT Leste',
    address: 'Av. Leste, 789',
    cnes: '5678901',
    region: 'Leste',
    regionKey: 'leste',
    responsibleName: 'Roberto Santos',
    responsiblePhone: '(61) 3247-8901',
    stationsTotal: 6,
    stationsOnline: 5,
    status: 'ativa',
    dashboardRowId: '3',
  },
  {
    id: 'rede-5',
    name: 'UBT Oeste',
    address: 'Setor Oeste, 321',
    cnes: '6789012',
    region: 'Oeste',
    regionKey: 'oeste',
    responsibleName: 'Juliana Ferreira',
    responsiblePhone: '(61) 3258-9012',
    stationsTotal: 3,
    stationsOnline: 0,
    status: 'manutencao',
    dashboardRowId: '5',
  },
  {
    id: 'rede-6',
    name: 'UBT Jardim das Flores',
    address: 'R. das Acácias, 88',
    cnes: '7890134',
    region: 'Norte',
    regionKey: 'norte',
    responsibleName: 'Paulo Henrique',
    responsiblePhone: '(61) 3269-0123',
    stationsTotal: 5,
    stationsOnline: 4,
    status: 'ativa',
    dashboardRowId: '2',
  },
  {
    id: 'rede-7',
    name: 'UBT Vila Esperança',
    address: 'Av. Esperança, 210',
    cnes: '8901245',
    region: 'Leste',
    regionKey: 'leste',
    responsibleName: 'Sandra Mota',
    responsiblePhone: '(61) 3270-1234',
    stationsTotal: 4,
    stationsOnline: 4,
    status: 'ativa',
    dashboardRowId: '3',
  },
]

export const prefeituraRedeUnits: PrefeituraRedeUnit[] = [
  ...primaryRedeUnits,
  ...extraRedeUnits,
]

export function prefeituraRedeTerminalKey(unitId: string, terminalIndex: number) {
  return `${unitId}:t${terminalIndex}`
}

export function countPrefeituraRedeTerminalsInMaintenance(
  unit: PrefeituraRedeUnit,
  maintenanceKeys: Set<string>,
) {
  let count = 0
  for (let i = 0; i < unit.stationsTotal; i++) {
    if (maintenanceKeys.has(prefeituraRedeTerminalKey(unit.id, i))) count++
  }
  return count
}

export function isPrefeituraRedeUnitFullyInMaintenance(
  unit: PrefeituraRedeUnit,
  maintenanceKeys: Set<string>,
) {
  return (
    unit.stationsTotal > 0 &&
    countPrefeituraRedeTerminalsInMaintenance(unit, maintenanceKeys) === unit.stationsTotal
  )
}

export function buildInitialPrefeituraRedeTerminalMaintenanceKeys(
  units: PrefeituraRedeUnit[] = prefeituraRedeUnits,
) {
  const keys = new Set<string>()
  for (const unit of units) {
    if (unit.status !== 'manutencao') continue
    for (let i = 0; i < unit.stationsTotal; i++) {
      keys.add(prefeituraRedeTerminalKey(unit.id, i))
    }
  }
  return keys
}

export const prefeituraRedeRegionSlices: DonutSlice[] = [
  {
    key: 'centro',
    label: 'Centro',
    count: 8,
    gradientFrom: '#3b82f6',
    gradientTo: '#6366f1',
  },
  {
    key: 'norte',
    label: 'Norte',
    count: 6,
    gradientFrom: '#10b981',
    gradientTo: '#14b8a6',
  },
  {
    key: 'sul',
    label: 'Sul',
    count: 5,
    gradientFrom: '#f97316',
    gradientTo: '#fb923c',
  },
  {
    key: 'leste',
    label: 'Leste',
    count: 3,
    gradientFrom: '#8b5cf6',
    gradientTo: '#a855f7',
  },
  {
    key: 'oeste',
    label: 'Oeste',
    count: 2,
    gradientFrom: '#ec4899',
    gradientTo: '#f43f5e',
  },
]

export const prefeituraRedeStationStatusSlices: DonutSlice[] = [
  {
    key: 'online',
    label: 'Online',
    count: 74,
    gradientFrom: '#22c55e',
    gradientTo: '#10b981',
  },
  {
    key: 'offline',
    label: 'Offline',
    count: 7,
    gradientFrom: '#ef4444',
    gradientTo: '#f87171',
  },
  {
    key: 'manutencao',
    label: 'Manutenção',
    count: 5,
    gradientFrom: '#f97316',
    gradientTo: '#fb923c',
  },
]

export const prefeituraRedeQuickActions = [
  {
    id: 'broadcast',
    title: 'Notificar a rede',
    description: 'UBT inteira, responsável ou operadoras cadastradas na unidade.',
    icon: 'message' as const,
    iconClass: 'bg-rose-50 text-rose-600',
    imageSrc: '/mensagem_broad.png',
  },
  {
    id: 'maintenance',
    title: 'Colocar em manutenção',
    description: 'Indisponibilizar uma unidade temporariamente para atendimentos.',
    icon: 'wrench' as const,
    iconClass: 'bg-amber-50 text-amber-600',
    imageSrc: '/manutencao.png',
  },
  {
    id: 'settings',
    title: 'Configurações globais',
    description: 'Gerencie capacidades, especialidades e padrões da rede.',
    icon: 'settings' as const,
    iconClass: 'bg-violet-50 text-violet-600',
    imageSrc: '/config_globais.png',
  },
  {
    id: 'report',
    title: 'Relatório da rede',
    description: 'Visualize o desempenho geral da rede de unidades.',
    icon: 'chart' as const,
    iconClass: 'bg-sky-50 text-sky-600',
    imageSrc: '/rede_report.png',
  },
] as const

export type PrefeituraRedeQuickActionId = (typeof prefeituraRedeQuickActions)[number]['id']

export function getPrefeituraRedeQuickAction(id: PrefeituraRedeQuickActionId) {
  return prefeituraRedeQuickActions.find((action) => action.id === id)
}

export function findPrefeituraDashboardRowForRedeUnit(
  unit: PrefeituraRedeUnit,
): PrefeituraUbsRow | undefined {
  if (unit.dashboardRowId) {
    return prefeituraUbsRows.find((row) => row.id === unit.dashboardRowId)
  }
  return prefeituraUbsRows.find((row) => row.name === unit.name)
}
