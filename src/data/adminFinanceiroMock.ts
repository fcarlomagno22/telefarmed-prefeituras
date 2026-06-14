import {
  adminClientesRows,
  type AdminClienteContrato,
  type AdminClienteContratoTipo,
} from './adminClientesMock'

export type {
  AdminCentroCusto,
  AdminContaPagarOrigem,
  AdminContaPagarRecorrencia,
  AdminContaPagarRepasseConferenciaStatus,
  AdminContaPagarRow,
  AdminContaPagarStatus,
  AdminContaReceberRow,
  AdminContaReceberStatus,
  AdminContaReceberStatusVencimento,
  AdminFechamentoCompetenciaRow,
  AdminFechamentoCompetenciaStatus,
  AdminFornecedorRow,
} from '../types/adminFinanceiro'

export {
  adminContaPagarRecorrenciaLabel,
  adminContaPagarStatusLabel,
  adminContaReceberStatusLabel,
  adminContaReceberStatusVencimentoLabel,
  adminFechamentoCompetenciaStatusLabel,
  getContratoModalidadeLabel,
} from '../types/adminFinanceiro'

import type {
  AdminContaReceberRow,
  AdminContaReceberStatus,
  AdminContaReceberStatusVencimento,
  AdminCentroCusto,
  AdminContaPagarRow,
  AdminFechamentoCompetenciaRow,
  AdminFechamentoCompetenciaStatus,
  AdminFornecedorRow,
} from '../types/adminFinanceiro'

function resolveFinanceiroContratoModalidade(
  contrato: AdminClienteContrato,
): AdminClienteContratoTipo {
  if (contrato.modalidade) return contrato.modalidade
  if (
    contrato.tipo === 'mensal' ||
    contrato.tipo === 'pacote_fechado' ||
    contrato.tipo === 'sob_demanda'
  ) {
    return contrato.tipo
  }
  return 'pacote_fechado'
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
    observacoes: 'Plataforma de telemedicina e integrações.',
  },
  {
    id: 'forn-002',
    cnpj: '98.765.432/0001-10',
    razaoSocial: 'MediPlantões Serviços Médicos S/A',
    situacao: 'ativa',
    contatoEmail: 'contas@mediplantoes.com.br',
    contatoTelefone: '(61) 98455-1032',
    pessoaContato: 'Carlos Nascimento',
    observacoes: 'Fornecimento de plantões médicos.',
  },
  {
    id: 'forn-003',
    cnpj: '44.222.111/0001-33',
    razaoSocial: 'Ativa Suporte Operacional Ltda',
    situacao: 'inativa',
    contatoEmail: 'cobranca@ativasuporte.com.br',
    contatoTelefone: '(31) 3333-5500',
    pessoaContato: 'Priscila Duarte',
    observacoes: '',
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
      const modalidade = resolveFinanceiroContratoModalidade(contrato)
      const permiteUltrapassar = contrato.detalhes?.permiteUltrapassar ?? modalidade === 'sob_demanda'
      const valorBase =
        modalidade === 'pacote_fechado'
          ? (consultasContratadas ?? 2_000) * 92
          : modalidade === 'mensal'
            ? 185_000
            : (contrato.consultasRealizadas ?? 1_100) * 118

      rows.push({
        id: `cr-${contrato.id}`,
        prefeitura: cliente.prefeitura,
        municipio: `${cliente.municipio}/${cliente.uf}`,
        contratoNumero: contrato.numero ?? contratoNumeroFallback(cliente.prefeitura, contrato.id),
        contratoModalidade: modalidade,
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
      const modalidade = resolveFinanceiroContratoModalidade(contrato)
      const valorBase =
        modalidade === 'pacote_fechado'
          ? (consultasContratadas || 2_000) * 92
          : modalidade === 'mensal'
            ? 185_000
            : (contrato.consultasRealizadas ?? 1_100) * 118
      const excedeuLimite = consumoPercentual !== null ? consumoPercentual > 100 : false
      const valorExcedente = excedeuLimite ? Math.round(valorBase * 0.08) : 0
      const ajustes = modalidade === 'mensal' ? -2_300 : 0
      const valorFinal = valorBase + valorExcedente + ajustes

      rows.push({
        id: `fc-${contrato.id}`,
        prefeitura: cliente.prefeitura,
        contratoNumero: contrato.numero ?? contratoNumeroFallback(cliente.prefeitura, contrato.id),
        modalidade,
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

