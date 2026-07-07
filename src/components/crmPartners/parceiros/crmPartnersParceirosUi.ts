import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'
import type {
  CrmPartnersClienteTipo,
  CrmPartnersComissaoStatus,
  CrmPartnersParceiroRow,
  CrmPartnersParceiroStatus,
} from '../../../types/crmPartnersParceiros'
import { maskCnpj, maskCpf, maskPhone } from '../../../utils/masks'
import { getCrmPartnersClienteTipoLabel } from '../../../data/crmPartnersParceirosMock'

export const CRM_PARTNERS_PARCEIROS_PAGE_SIZE = 8

export const crmPartnersParceiroStatusBadgeConfig: Record<
  CrmPartnersParceiroStatus,
  SituationStatusBadgeStyle
> = {
  ativo: {
    label: 'Ativo',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  inativo: {
    label: 'Inativo',
    text: 'text-gray-600',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  },
}

export const crmPartnersComissaoStatusBadgeConfig: Record<
  CrmPartnersComissaoStatus,
  SituationStatusBadgeStyle
> = {
  pendente: {
    label: 'Pendente',
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
  },
  pago: {
    label: 'Pago',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
}

export const crmPartnersClienteTipoBadgeClass: Record<CrmPartnersClienteTipo, string> = {
  prefeitura: 'bg-sky-50 text-sky-700 ring-sky-100',
  santa_casa: 'bg-violet-50 text-violet-700 ring-violet-100',
  empresa: 'bg-orange-50 text-orange-700 ring-orange-100',
}

export const crmPartnersClienteTipoBadgeBaseClass =
  'inline-flex w-[7.25rem] items-center justify-center rounded-full px-2 py-1 text-center text-xs font-semibold ring-1 ring-inset'

export function formatCrmPartnersDocumento(row: Pick<CrmPartnersParceiroRow, 'documento' | 'documentoTipo'>): string {
  return row.documentoTipo === 'cnpj' ? maskCnpj(row.documento) : maskCpf(row.documento)
}

export function formatCrmPartnersTelefone(telefone: string): string {
  return maskPhone(telefone)
}

export function formatCrmPartnersCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCrmPartnersPercent(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value}%`
}

export function formatCrmPartnersClienteTipo(tipo: CrmPartnersClienteTipo): string {
  return getCrmPartnersClienteTipoLabel(tipo)
}

export const crmPartnersParceiroStatusFilterOptions = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'inativo', label: 'Inativos' },
] as const

export const crmPartnersPixKeyTypeOptions = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'aleatoria', label: 'Chave aleatória' },
] as const

export const crmPartnersParceirosTableHeadClass =
  'px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500'

export const crmPartnersParceirosTableHeadCenterClass =
  'px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500'

export const crmPartnersParceirosTableCellClass = 'px-4 py-3.5 text-sm text-gray-700'

export const crmPartnersParceirosTableCellCenterClass =
  'px-4 py-3.5 text-center text-sm text-gray-700'

export const crmPartnersParceirosInputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/40 focus:shadow-[var(--brand-primary-focus-ring)]'

export const crmPartnersParceirosDrawerShellClass =
  'absolute inset-y-0 right-0 z-10 flex h-full w-full max-w-3xl flex-col overflow-hidden border-l border-gray-200/90 bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none'
