import {
  adminClienteContratoTipoLabels,
  adminClientesRows,
  type AdminClienteContrato,
  type AdminClienteContratoTipo,
} from './adminClientesMock'

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
}

export type AdminContaPagarRow = {
  id: string
  fornecedorId: string
  descricao: string
  centroCustoId: string
  recorrencia: AdminContaPagarRecorrencia
  valor: number
  vencimento: string
  status: AdminContaPagarStatus
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

const statusReceberCycle: AdminContaReceberStatus[] = ['faturado', 'pendente', 'recebido', 'atrasado']
const statusVencimentoReceberCycle: AdminContaReceberStatusVencimento[] = [
  'a_vencer',
  'paga',
  'atrasada',
]
const statusFechamentoCycle: AdminFechamentoCompetenciaStatus[] = [
  'aberto',
  'em_apuracao',
  'pre_fechado',
  'fechado',
  'reaberto',
]

export const adminCentrosCustoIniciais: AdminCentroCusto[] = [
  { id: 'cc-medico', nome: 'Equipe medica' },
  { id: 'cc-tecnologia', nome: 'Tecnologia e plataforma' },
  { id: 'cc-operacao', nome: 'Operacao e atendimento' },
  { id: 'cc-suporte', nome: 'Suporte e sucesso do cliente' },
]

export const adminFornecedoresIniciais: AdminFornecedorRow[] = [
  {
    id: 'forn-001',
    cnpj: '12.345.678/0001-90',
    razaoSocial: 'Cloud Health Tecnologia Ltda',
    situacao: 'ativa',
    contatoEmail: 'financeiro@cloudhealth.com.br',
    contatoTelefone: '(11) 3245-8899',
    pessoaContato: 'Fernanda Ribeiro',
  },
  {
    id: 'forn-002',
    cnpj: '98.765.432/0001-10',
    razaoSocial: 'MediPlantões Serviços Médicos S/A',
    situacao: 'ativa',
    contatoEmail: 'contas@mediplantoes.com.br',
    contatoTelefone: '(61) 98455-1032',
    pessoaContato: 'Carlos Nascimento',
  },
  {
    id: 'forn-003',
    cnpj: '44.222.111/0001-33',
    razaoSocial: 'Ativa Suporte Operacional Ltda',
    situacao: 'inativa',
    contatoEmail: 'cobranca@ativasuporte.com.br',
    contatoTelefone: '(31) 3333-5500',
    pessoaContato: 'Priscila Duarte',
  },
]

export const adminContasPagarIniciais: AdminContaPagarRow[] = [
  {
    id: 'cp-001',
    fornecedorId: 'forn-001',
    descricao: 'Infraestrutura cloud e streaming',
    centroCustoId: 'cc-tecnologia',
    recorrencia: 'mensal',
    valor: 94_000,
    vencimento: '05/06/2026',
    status: 'pendente',
  },
  {
    id: 'cp-002',
    fornecedorId: 'forn-002',
    descricao: 'Repasse plantoes medicos - maio',
    centroCustoId: 'cc-medico',
    recorrencia: 'mensal',
    valor: 212_000,
    vencimento: '10/06/2026',
    status: 'pendente',
  },
  {
    id: 'cp-003',
    fornecedorId: 'forn-003',
    descricao: 'Campanha onboarding municipios',
    centroCustoId: 'cc-suporte',
    recorrencia: 'unica',
    valor: 36_500,
    vencimento: '25/05/2026',
    status: 'atrasado',
  },
  {
    id: 'cp-004',
    fornecedorId: 'forn-001',
    descricao: 'Licencas de observabilidade',
    centroCustoId: 'cc-operacao',
    recorrencia: 'mensal',
    valor: 18_800,
    vencimento: '20/05/2026',
    status: 'pago',
  },
]

function contratoNumeroFallback(prefeitura: string, contratoId: string) {
  const prefix = prefeitura.slice(0, 3).toUpperCase()
  return `CTR-${prefix}-${contratoId.slice(-3)}`
}

export function buildAdminContasReceberFromContratos(): AdminContaReceberRow[] {
  const rows: AdminContaReceberRow[] = []
  let index = 0

  for (const cliente of adminClientesRows) {
    for (const contrato of cliente.contratos) {
      if (contrato.status === 'encerrado') continue

      const consultasContratadas = contrato.detalhes?.consultasContratadas ?? null
      const percentualUtilizado = contrato.percentualUtilizado
      const excedeuLimite =
        percentualUtilizado !== null
          ? percentualUtilizado > 100
          : (contrato.consultasRealizadas ?? 0) > (consultasContratadas ?? Number.MAX_SAFE_INTEGER)
      const permiteUltrapassar = contrato.detalhes?.permiteUltrapassar ?? contrato.tipo === 'sob_demanda'
      const valorBase =
        contrato.tipo === 'pacote_fechado'
          ? (consultasContratadas ?? 2_000) * 92
          : contrato.tipo === 'mensal'
            ? 185_000
            : (contrato.consultasRealizadas ?? 1_100) * 118

      rows.push({
        id: `cr-${contrato.id}`,
        prefeitura: cliente.prefeitura,
        municipio: `${cliente.municipio}/${cliente.uf}`,
        contratoNumero: contrato.numero ?? contratoNumeroFallback(cliente.prefeitura, contrato.id),
        contratoModalidade: contrato.tipo,
        contratoStatus: contrato.status,
        consultasContratadas,
        percentualUtilizado,
        excedeuLimite,
        permiteUltrapassar,
        valorFaturado: Math.round(valorBase),
        vencimento: index % 2 === 0 ? '10/06/2026' : '20/06/2026',
        status: statusReceberCycle[index % statusReceberCycle.length],
      })

      index += 1
    }
  }

  return rows
}

export function buildAdminFechamentosCompetenciaFromContratos(): AdminFechamentoCompetenciaRow[] {
  const rows: AdminFechamentoCompetenciaRow[] = []
  let index = 0

  for (const cliente of adminClientesRows) {
    for (const contrato of cliente.contratos) {
      if (contrato.status === 'encerrado') continue

      const consumoPercentual = contrato.percentualUtilizado
      const consultasContratadas = contrato.detalhes?.consultasContratadas ?? 0
      const valorBase =
        contrato.tipo === 'pacote_fechado'
          ? (consultasContratadas || 2_000) * 92
          : contrato.tipo === 'mensal'
            ? 185_000
            : (contrato.consultasRealizadas ?? 1_100) * 118
      const excedeuLimite = consumoPercentual !== null ? consumoPercentual > 100 : false
      const valorExcedente = excedeuLimite ? Math.round(valorBase * 0.08) : 0
      const ajustes = contrato.tipo === 'mensal' ? -2_300 : 0
      const valorFinal = valorBase + valorExcedente + ajustes

      rows.push({
        id: `fc-${contrato.id}`,
        prefeitura: cliente.prefeitura,
        contratoNumero: contrato.numero ?? contratoNumeroFallback(cliente.prefeitura, contrato.id),
        modalidade: contrato.tipo,
        competencia: index % 2 === 0 ? '05/2026' : '04/2026',
        consumoPercentual,
        excedeuLimite,
        valorBase: Math.round(valorBase),
        valorExcedente,
        ajustes,
        valorFinal: Math.round(valorFinal),
        status: statusFechamentoCycle[index % statusFechamentoCycle.length],
        vencimento:
          index % 3 === 0 ? '10/06/2026' : index % 3 === 1 ? '25/05/2026' : '15/04/2026',
        statusVencimento: statusVencimentoReceberCycle[index % statusVencimentoReceberCycle.length],
      })

      index += 1
    }
  }

  return rows
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

export const adminFechamentoCompetenciaStatusLabel: Record<AdminFechamentoCompetenciaStatus, string> = {
  aberto: 'Aberto',
  em_apuracao: 'Em apuração',
  pre_fechado: 'Pré-fechado',
  fechado: 'Fechado',
  reaberto: 'Reaberto',
}

export function getContratoModalidadeLabel(modalidade: AdminClienteContratoTipo) {
  return adminClienteContratoTipoLabels[modalidade]
}
