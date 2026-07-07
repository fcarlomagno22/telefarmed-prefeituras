import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'
import type {
  CrmPartnersClienteContratoStatus,
  CrmPartnersClienteParticipacaoConfig,
} from '../../../types/crmPartnersClientes'
import { maskCnpj } from '../../../utils/masks'
import {
  crmPartnersClienteTipoBadgeBaseClass,
  crmPartnersClienteTipoBadgeClass,
  crmPartnersParceirosDrawerShellClass,
  crmPartnersParceirosInputClass,
  crmPartnersParceirosTableCellCenterClass,
  crmPartnersParceirosTableHeadCenterClass,
  formatCrmPartnersClienteTipo,
  formatCrmPartnersCurrency,
  formatCrmPartnersTelefone,
} from '../parceiros/crmPartnersParceirosUi'
import { buildParticipacaoResumo } from '../../../data/crmPartnersClientesMock'

export const CRM_PARTNERS_CLIENTES_PAGE_SIZE = 8

export {
  crmPartnersParceirosDrawerShellClass as crmPartnersClientesDrawerShellClass,
  crmPartnersParceirosInputClass as crmPartnersClientesInputClass,
  crmPartnersParceirosTableCellCenterClass as crmPartnersClientesTableCellCenterClass,
  crmPartnersParceirosTableHeadCenterClass as crmPartnersClientesTableHeadCenterClass,
  crmPartnersClienteTipoBadgeClass,
  crmPartnersClienteTipoBadgeBaseClass,
  formatCrmPartnersClienteTipo,
  formatCrmPartnersCurrency,
  formatCrmPartnersTelefone,
}

export const crmPartnersClienteContratoStatusBadgeConfig: Record<
  CrmPartnersClienteContratoStatus,
  SituationStatusBadgeStyle
> = {
  ativo: {
    label: 'Ativo',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  pendente: {
    label: 'Pendente',
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
  },
  encerrado: {
    label: 'Encerrado',
    text: 'text-gray-600',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  },
  suspenso: {
    label: 'Suspenso',
    text: 'text-red-700',
    accent: 'bg-gradient-to-r from-red-400 via-red-500 to-rose-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.45)]',
  },
}

export const crmPartnersParticipacaoPorConsultaLabel = 'Valor fixo por consulta realizada'

export const crmPartnersClienteTipoFilterOptions = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'prefeitura', label: 'Prefeitura' },
  { value: 'santa_casa', label: 'Santa Casa' },
  { value: 'empresa', label: 'Empresa' },
] as const

export const crmPartnersClienteContratoFilterOptions = [
  { value: 'todos', label: 'Todos os contratos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'encerrado', label: 'Encerrados' },
  { value: 'suspenso', label: 'Suspensos' },
] as const

export const crmPartnersClientesTableHeadClass =
  'px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500'

export function formatCrmPartnersCnpj(cnpj: string): string {
  return maskCnpj(cnpj)
}

export function formatCrmPartnersCidadeUf(cidade: string, uf: string): string {
  return `${cidade}/${uf}`
}

export function formatCrmPartnersParticipacaoResumo(
  config: CrmPartnersClienteParticipacaoConfig | null,
): string {
  return buildParticipacaoResumo(config)
}

export function formatCrmPartnersValorPorConsulta(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)
}
