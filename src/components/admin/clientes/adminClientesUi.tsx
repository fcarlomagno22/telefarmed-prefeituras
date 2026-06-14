import type {
  AdminClienteContratoStatus,
  AdminClienteRow,
  AdminClienteStatus,
} from '../../../types/adminClientes'
import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'

export const ADMIN_CLIENTE_STATUS_BADGE_WIDTH = 'w-[9rem]'

export function formatAdminClientesNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function normalizeAdminClientesSearch(value: string) {
  return value.trim().toLowerCase()
}

export function matchesAdminClienteSearch(row: AdminClienteRow, query: string) {
  const normalized = normalizeAdminClientesSearch(query)
  if (!normalized) return true

  const haystack = [
    row.prefeitura,
    row.razaoSocial,
    row.municipio,
    row.uf,
    row.gestor.name,
    row.contatoTi.name,
    row.contatoSaude.name,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}

export const adminClienteStatusBadgeConfig: Record<
  AdminClienteStatus,
  SituationStatusBadgeStyle
> = {
  ativa: {
    label: 'Ativa',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  implantacao: {
    label: 'Implantação',
    text: 'text-blue-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.55)]',
  },
  prospect: {
    label: 'Prospect',
    text: 'text-violet-700',
    accent: 'bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(139,92,246,0.55)]',
  },
  suspensa: {
    label: 'Suspensa',
    text: 'text-orange-700',
    accent: 'bg-gradient-to-r from-orange-400 via-amber-500 to-orange-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(249,115,22,0.55)]',
  },
  sem_contrato: {
    label: 'Sem contrato',
    text: 'text-gray-600',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  },
}

export const adminClienteContratoStatusBadgeConfig: Record<
  AdminClienteContratoStatus,
  SituationStatusBadgeStyle
> = {
  ativo: {
    label: 'Ativo',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  implantacao: {
    label: 'Em implantação',
    text: 'text-blue-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.55)]',
  },
  suspenso: {
    label: 'Suspenso',
    text: 'text-orange-700',
    accent: 'bg-gradient-to-r from-orange-400 via-amber-500 to-orange-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(249,115,22,0.55)]',
  },
  encerrado: {
    label: 'Encerrado',
    text: 'text-gray-600',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  },
}

export const adminClientesLegendItems = [
  { key: 'prospect', label: 'Prospect', dot: 'bg-violet-500' },
  { key: 'implantacao', label: 'Implantação', dot: 'bg-blue-500' },
  { key: 'ativa', label: 'Ativa', dot: 'bg-emerald-500' },
  { key: 'suspensa', label: 'Suspensa', dot: 'bg-orange-500' },
  { key: 'sem_contrato', label: 'Sem contrato', dot: 'bg-gray-400' },
] as const

/** Grade fluida — adapta ao espaço disponível (janela reduzida ou monitor largo). */
export const adminClientesCardsRowClass = [
  'grid min-w-0 w-full items-stretch gap-4',
  'grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]',
].join(' ')

export const adminClientesPageStackClass =
  'flex min-w-0 w-full max-w-full flex-1 min-h-0 flex-col gap-3'

/** Card da tabela — estica até o footer; scroll só no corpo da grade. */
export const adminClientesTableSlotClass =
  'flex min-h-0 min-w-0 w-full flex-1 flex-col'

export const ADMIN_CLIENTE_TABLE_COL_COUNT = 9
