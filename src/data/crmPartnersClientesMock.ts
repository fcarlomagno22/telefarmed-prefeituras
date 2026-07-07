import type { CrmPartnersClienteTipo } from '../types/crmPartnersParceiros'
import type {
  CrmPartnersClienteDetail,
  CrmPartnersClientePagamentoComissao,
  CrmPartnersClienteParceiroHistorico,
  CrmPartnersClienteParticipacaoConfig,
  CrmPartnersClienteRow,
} from '../types/crmPartnersClientes'
import { formatCrmPartnersMonthLabel, getCurrentCrmPartnersMonthKey } from './crmPartnersDashboardMock'
import { buildCrmPartnersParceirosMock } from './crmPartnersParceirosMock'

const CLIENTES: Array<{
  razaoSocial: string
  tipo: CrmPartnersClienteTipo
  cidade: string
  uf: string
}> = [
  { razaoSocial: 'Prefeitura Municipal de Campinas', tipo: 'prefeitura', cidade: 'Campinas', uf: 'SP' },
  { razaoSocial: 'Santa Casa de Misericórdia de Sorocaba', tipo: 'santa_casa', cidade: 'Sorocaba', uf: 'SP' },
  { razaoSocial: 'TechHealth Soluções em Saúde Ltda', tipo: 'empresa', cidade: 'São Paulo', uf: 'SP' },
  { razaoSocial: 'Prefeitura Municipal de Jundiaí', tipo: 'prefeitura', cidade: 'Jundiaí', uf: 'SP' },
  { razaoSocial: 'Santa Casa de Limeira', tipo: 'santa_casa', cidade: 'Limeira', uf: 'SP' },
  { razaoSocial: 'Grupo Industrial Alfa S.A.', tipo: 'empresa', cidade: 'Paulínia', uf: 'SP' },
  { razaoSocial: 'Prefeitura Municipal de Piracicaba', tipo: 'prefeitura', cidade: 'Piracicaba', uf: 'SP' },
  { razaoSocial: 'Santa Casa de Americana', tipo: 'santa_casa', cidade: 'Americana', uf: 'SP' },
  { razaoSocial: 'Bem Estar Corporativo Ltda', tipo: 'empresa', cidade: 'Campinas', uf: 'SP' },
  { razaoSocial: 'Prefeitura Municipal de Indaiatuba', tipo: 'prefeitura', cidade: 'Indaiatuba', uf: 'SP' },
  { razaoSocial: 'Santa Casa de Misericórdia de Sumaré', tipo: 'santa_casa', cidade: 'Sumaré', uf: 'SP' },
  { razaoSocial: 'Vida Corporativa Benefícios Ltda', tipo: 'empresa', cidade: 'Valinhos', uf: 'SP' },
]

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function seededValue(seed: string, min: number, max: number): number {
  return min + (hashString(seed) % (max - min + 1))
}

function padCnpj(seed: number): string {
  return String(10000000000000 + (seed % 9000000000000)).slice(0, 14)
}

function formatDate(seed: string): string {
  const day = seededValue(`${seed}:d`, 1, 28)
  const month = seededValue(`${seed}:m`, 1, 12)
  const year = 2023 + seededValue(`${seed}:y`, 0, 2)
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)
}

export function buildParticipacaoResumo(config: CrmPartnersClienteParticipacaoConfig | null): string {
  if (!config || config.participacoes.length === 0) return 'Não definida'

  const total = config.participacoes.reduce((sum, item) => sum + item.valorPorConsulta, 0)
  const count = config.participacoes.length

  if (count === 1) {
    return `${formatCurrency(config.participacoes[0].valorPorConsulta)}/consulta`
  }

  return `${count} parceiros · ${formatCurrency(total)}/consulta`
}

function buildParticipacao(clienteId: string, index: number): CrmPartnersClienteParticipacaoConfig | null {
  if (index % 5 === 0) return null

  const parceiros = buildCrmPartnersParceirosMock()
  const seed = `${clienteId}:participacao`
  const count = index % 4 === 0 ? 3 : index % 3 === 0 ? 2 : 1
  const start = index % parceiros.length

  const participacoes = Array.from({ length: count }, (_, offset) => {
    const parceiro = parceiros[(start + offset) % parceiros.length]
    return {
      id: `${clienteId}-part-${offset + 1}`,
      parceiroId: parceiro.id,
      parceiroNome: parceiro.nome,
      valorPorConsulta: seededValue(`${seed}:${offset}:val`, 6, 28),
    }
  })

  return {
    participacoes,
    vigenciaInicio: formatDate(`${seed}:ini`),
    observacoes:
      count > 1 ? 'Participação dividida entre parceiros envolvidos na operação do cliente.' : null,
    definidaEm: formatDate(`${seed}:def`),
  }
}

export function buildCrmPartnersClientesMock(): CrmPartnersClienteRow[] {
  const parceiros = buildCrmPartnersParceirosMock()

  return CLIENTES.map((item, index) => {
    const id = `cliente-${index + 1}`
    const seed = `crm-cliente:${id}`
    const parceiro = parceiros[index % parceiros.length]
    const participacao = buildParticipacao(id, index)
    const statusRoll = seededValue(`${seed}:st`, 0, 10)
    const contratoStatus =
      statusRoll <= 6 ? 'ativo' : statusRoll <= 8 ? 'pendente' : 'encerrado'

    return {
      id,
      razaoSocial: item.razaoSocial,
      tipo: item.tipo,
      cnpj: padCnpj(index + 29),
      contatoNome: `Contato ${index + 1}`,
      contatoEmail: `contato@${item.cidade.toLowerCase().replace(/\s/g, '')}.mock`,
      contatoTelefone: String(11900000000 + index * 137),
      cidade: item.cidade,
      uf: item.uf,
      contratoStatus,
      parceiroIndicadorId: parceiro.id,
      parceiroIndicadorNome: parceiro.nome,
      participacaoDefinida: participacao != null,
      participacaoResumo: buildParticipacaoResumo(participacao),
    }
  })
}

function buildHistoricoParceiros(cliente: CrmPartnersClienteRow): CrmPartnersClienteParceiroHistorico[] {
  const parceiros = buildCrmPartnersParceirosMock()
  const previous = parceiros.find((item) => item.id !== cliente.parceiroIndicadorId)
  const items: CrmPartnersClienteParceiroHistorico[] = []

  if (previous && seededValue(`${cliente.id}:hist`, 0, 10) > 4) {
    items.push({
      id: `${cliente.id}-par-hist-1`,
      parceiroId: previous.id,
      parceiroNome: previous.nome,
      dataInicio: formatDate(`${cliente.id}:ph1:ini`),
      dataFim: formatDate(`${cliente.id}:ph1:fim`),
      motivo: 'Redistribuição comercial da carteira',
    })
  }

  items.push({
    id: `${cliente.id}-par-atual`,
    parceiroId: cliente.parceiroIndicadorId,
    parceiroNome: cliente.parceiroIndicadorNome,
    dataInicio: formatDate(`${cliente.id}:ph:atual`),
    dataFim: null,
    motivo: null,
  })

  return items
}

function buildHistoricoPagamentos(
  cliente: CrmPartnersClienteRow,
  participacao: CrmPartnersClienteParticipacaoConfig | null,
): CrmPartnersClientePagamentoComissao[] {
  const count = seededValue(`${cliente.id}:pay`, 3, 8)
  const currentMonth = getCurrentCrmPartnersMonthKey()
  const items: CrmPartnersClientePagamentoComissao[] = []
  const parceirosPagamento =
    participacao?.participacoes.map((item) => item.parceiroNome) ?? [cliente.parceiroIndicadorNome]

  for (let index = 0; index < count; index += 1) {
    const seed = `${cliente.id}:pay:${index}`
    const status = seededValue(`${seed}:st`, 0, 10) > 3 ? 'pago' : 'pendente'
    items.push({
      id: `${cliente.id}-pay-${index + 1}`,
      referencia: formatCrmPartnersMonthLabel(currentMonth),
      parceiroNome: parceirosPagamento[index % parceirosPagamento.length],
      valor: seededValue(`${seed}:val`, 400, 5200),
      status,
      dataPrevista: status === 'pendente' ? formatDate(`${seed}:prev`) : null,
      dataPagamento: status === 'pago' ? formatDate(`${seed}:paid`) : null,
    })
  }

  return items
}

export function buildCrmPartnersClienteDetail(cliente: CrmPartnersClienteRow): CrmPartnersClienteDetail {
  const index = Number(cliente.id.replace('cliente-', '')) - 1
  const participacao = buildParticipacao(cliente.id, index)

  return {
    cliente: {
      ...cliente,
      participacaoDefinida: participacao != null,
      participacaoResumo: buildParticipacaoResumo(participacao),
    },
    contrato: {
      valorMensal: seededValue(`${cliente.id}:mensal`, 8000, 85000),
      dataInicio: formatDate(`${cliente.id}:contrato`),
      status: cliente.contratoStatus,
    },
    participacao,
    historicoParceiros: buildHistoricoParceiros(cliente),
    historicoPagamentos: buildHistoricoPagamentos(cliente, participacao),
  }
}
