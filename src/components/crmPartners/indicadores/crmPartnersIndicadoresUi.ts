import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'
import type {
  CrmPartnersIndicadorNfStatus,
  CrmPartnersIndicadorStatus,
} from '../../../types/crmPartnersIndicadores'
import {
  crmPartnersParceirosDrawerShellClass,
  crmPartnersParceirosTableCellCenterClass,
  crmPartnersParceirosTableHeadCenterClass,
  formatCrmPartnersCurrency,
} from '../parceiros/crmPartnersParceirosUi'

export const CRM_PARTNERS_INDICADORES_PAGE_SIZE = 8

export {
  crmPartnersParceirosDrawerShellClass as crmPartnersIndicadoresDrawerShellClass,
  crmPartnersParceirosTableCellCenterClass as crmPartnersIndicadoresTableCellCenterClass,
  crmPartnersParceirosTableHeadCenterClass as crmPartnersIndicadoresTableHeadCenterClass,
  formatCrmPartnersCurrency as formatCrmPartnersIndicadoresCurrency,
}

export const crmPartnersIndicadoresTableHeadClass =
  'px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500'

export const crmPartnersIndicadorStatusBadgeConfig: Record<
  CrmPartnersIndicadorStatus,
  SituationStatusBadgeStyle
> = {
  previsto: {
    label: 'Previsto',
    text: 'text-slate-600',
    accent: 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  },
  aguardando_cliente_pagar: {
    label: 'Aguardando cliente pagar',
    text: 'text-blue-700',
    accent: 'bg-gradient-to-r from-blue-400 via-sky-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.45)]',
  },
  aguardando_nota_fiscal: {
    label: 'Aguardando nota fiscal',
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
  },
  nota_enviada: {
    label: 'Nota enviada',
    text: 'text-violet-700',
    accent: 'bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(139,92,246,0.45)]',
  },
  em_processamento: {
    label: 'Em processamento',
    text: 'text-orange-700',
    accent: 'bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(249,115,22,0.45)]',
  },
  pago: {
    label: 'Pago',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
}

export const crmPartnersIndicadorNfBadgeConfig: Record<
  CrmPartnersIndicadorNfStatus,
  SituationStatusBadgeStyle
> = {
  pendente: {
    label: 'Pendente',
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
  },
  enviada: {
    label: 'Enviada',
    text: 'text-violet-700',
    accent: 'bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(139,92,246,0.45)]',
  },
  aprovada: {
    label: 'Aprovada',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
}

export const crmPartnersIndicadorStatusFilterOptions = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'previsto', label: 'Previsto' },
  { value: 'aguardando_cliente_pagar', label: 'Aguardando cliente pagar' },
  { value: 'aguardando_nota_fiscal', label: 'Aguardando nota fiscal' },
  { value: 'nota_enviada', label: 'Nota enviada' },
  { value: 'em_processamento', label: 'Em processamento' },
  { value: 'pago', label: 'Pago' },
] as const

export const CRM_PARTNERS_TELEFARMED_NF_DESTINATARIO = {
  razaoSocial: 'Telefarmed Tecnologia em Saúde Ltda.',
  cnpj: '12.345.678/0001-90',
  municipio: 'São Paulo/SP',
} as const

export const CRM_PARTNERS_NF_ACCEPT = '.pdf,.xml,application/pdf,application/xml,text/xml'

export function buildCrmPartnersNfObservacoes(input: {
  cliente: string
  percentualComissao: number
  valorRecebidoTelefarmed: number
  dataPagamentoTelefarmed: string | null
}): string {
  const dataRecebimento = input.dataPagamentoTelefarmed ?? 'a confirmar'
  const valorRecebido = formatCrmPartnersIndicadoresCurrency(input.valorRecebidoTelefarmed)

  return [
    `Comissão sobre a intermediação do negócio do contrato com ${input.cliente}.`,
    `Pagamento recebido pela Telefarmed no dia ${dataRecebimento}.`,
    `Percentual de comissão: ${input.percentualComissao}% sobre ${valorRecebido}.`,
    'Prestação de serviços de intermediação comercial e indicação de clientes.',
  ].join(' ')
}

export function buildCrmPartnersNfDescricaoServico(cliente: string): string {
  return `Intermediação comercial — contrato ${cliente}`
}
