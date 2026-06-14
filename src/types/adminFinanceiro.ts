import type { AdminClienteContrato, AdminClienteContratoTipo } from './adminClientes'
import { adminClienteContratoTipoLabels } from './adminClientes'
import type { AdminContaPagarRepasseSnapshot } from './adminProfissionalRepasse'

export type AdminContaReceberStatus = 'pendente' | 'faturado' | 'recebido' | 'atrasado'
export type AdminContaReceberStatusVencimento = 'a_vencer' | 'paga' | 'atrasada'
export type AdminContaPagarStatus = 'pendente' | 'pago' | 'atrasado'
export type AdminContaPagarRecorrencia = 'mensal' | 'unica'
export type AdminFechamentoCompetenciaStatus =
  | 'aberto'
  | 'em_apuracao'
  | 'pre_fechado'
  | 'fechado'
  | 'reaberto'

export type AdminContaReceberRow = {
  id: string
  prefeitura: string
  municipio: string
  contratoNumero: string
  contratoModalidade: AdminClienteContratoTipo
  contratoStatus: AdminClienteContrato['status']
  consultasContratadas: number | null
  percentualUtilizado: number | null
  excedeuLimite: boolean
  permiteUltrapassar: boolean
  valorFaturado: number
  vencimento: string
  status: AdminContaReceberStatus
}

export type AdminCentroCusto = {
  id: string
  nome: string
}

export type AdminFornecedorRow = {
  id: string
  cnpj: string
  razaoSocial: string
  situacao: 'ativa' | 'inativa' | 'nao_informado'
  contatoEmail: string
  contatoTelefone: string
  pessoaContato: string
  observacoes: string
}

export type AdminContaPagarOrigem = 'manual' | 'repasse_profissional'

export type AdminContaPagarRepasseConferenciaStatus = 'pendente_conferencia' | 'conferido'

export type AdminContaPagarRow = {
  id: string
  fornecedorId: string
  descricao: string
  centroCustoId: string
  recorrencia: AdminContaPagarRecorrencia
  valor: number
  vencimento: string
  status: AdminContaPagarStatus
  origem?: AdminContaPagarOrigem
  repasseCompetenciaId?: string
  repasseDraftId?: string
  repasseConferenciaStatus?: AdminContaPagarRepasseConferenciaStatus
  repasseSnapshot?: AdminContaPagarRepasseSnapshot
}

export type AdminFechamentoCompetenciaRow = {
  id: string
  prefeitura: string
  contratoNumero: string
  modalidade: AdminClienteContratoTipo
  competencia: string
  consumoPercentual: number | null
  excedeuLimite: boolean
  valorBase: number
  valorExcedente: number
  ajustes: number
  valorFinal: number
  status: AdminFechamentoCompetenciaStatus
  vencimento: string
  statusVencimento: AdminContaReceberStatusVencimento
}

export const adminContaReceberStatusVencimentoLabel: Record<
  AdminContaReceberStatusVencimento,
  string
> = {
  a_vencer: 'À Vencer',
  paga: 'Paga',
  atrasada: 'Atrasada',
}

export const adminContaReceberStatusLabel: Record<AdminContaReceberStatus, string> = {
  pendente: 'Pendente',
  faturado: 'Faturado',
  recebido: 'Recebido',
  atrasado: 'Atrasado',
}

export const adminContaPagarStatusLabel: Record<AdminContaPagarStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
}

export const adminContaPagarRecorrenciaLabel: Record<AdminContaPagarRecorrencia, string> = {
  mensal: 'Mensal',
  unica: 'Unica',
}

export const adminFechamentoCompetenciaStatusLabel: Record<AdminFechamentoCompetenciaStatus, string> =
  {
    aberto: 'Aberto',
    em_apuracao: 'Em apuração',
    pre_fechado: 'Pré-fechado',
    fechado: 'Fechado',
    reaberto: 'Reaberto',
  }

export function getContratoModalidadeLabel(modalidade: AdminClienteContratoTipo) {
  return adminClienteContratoTipoLabels[modalidade]
}
