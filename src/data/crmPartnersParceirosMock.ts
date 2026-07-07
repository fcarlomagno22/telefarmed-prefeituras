import type {
  CrmPartnersClienteTipo,
  CrmPartnersParceiroClienteIndicado,
  CrmPartnersParceiroComissao,
  CrmPartnersParceiroDetail,
  CrmPartnersParceiroRow,
} from '../types/crmPartnersParceiros'
import { formatCrmPartnersMonthLabel, getCurrentCrmPartnersMonthKey } from './crmPartnersDashboardMock'

const CLIENTE_TIPOS: CrmPartnersClienteTipo[] = ['prefeitura', 'santa_casa', 'empresa']
const CLIENTE_TIPO_LABELS: Record<CrmPartnersClienteTipo, string> = {
  prefeitura: 'Prefeitura',
  santa_casa: 'Santa Casa',
  empresa: 'Empresa',
}

const PARTNER_NAMES = [
  'Ana Paula Mendes',
  'Carlos Eduardo Ribeiro',
  'Distribuidora Saúde Norte LTDA',
  'Fernanda Costa Silva',
  'Grupo Indicar Brasil',
  'João Victor Almeida',
  'Luciana Ferreira Santos',
  'Marcos Antônio Duarte',
  'Rede Comercial Vida+',
  'Representações Médicas Sul',
  'Ricardo Oliveira Lima',
  'Soluções em Saúde Integrada',
] as const

const CLIENTE_NAMES = [
  'Prefeitura de Campinas',
  'Santa Casa de Misericórdia de Sorocaba',
  'Empresa TechHealth Ltda',
  'Prefeitura de Jundiaí',
  'Santa Casa de Limeira',
  'Grupo Industrial Alfa',
  'Prefeitura de Piracicaba',
  'Santa Casa de Americana',
  'Empresa Bem Estar Corp',
  'Prefeitura de Indaiatuba',
] as const

const BANKS = ['Itaú', 'Bradesco', 'Santander', 'Banco do Brasil', 'Nubank', 'Caixa'] as const

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function seededValue(seed: string, min: number, max: number): number {
  const span = max - min + 1
  return min + (hashString(seed) % span)
}

function padCpf(seed: number): string {
  const base = String(10000000000 + (seed % 90000000000)).slice(0, 11)
  return base
}

function padCnpj(seed: number): string {
  const base = String(10000000000000 + (seed % 9000000000000)).slice(0, 14)
  return base
}

function padPhone(seed: number): string {
  const ddd = 11 + (seed % 78)
  const suffix = String(900000000 + (seed % 100000000)).slice(0, 9)
  return `${ddd}9${suffix}`
}

function formatDateFromSeed(seed: string): string {
  const day = seededValue(`${seed}:day`, 1, 28)
  const month = seededValue(`${seed}:month`, 1, 12)
  const year = 2024 + (seededValue(`${seed}:year`, 0, 2))
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

function buildPartnerRow(index: number): CrmPartnersParceiroRow {
  const id = `partner-${index + 1}`
  const seed = `crm-partner:${id}`
  const isCnpj = index % 4 === 2 || index % 4 === 3
  const documento = isCnpj ? padCnpj(index + 17) : padCpf(index + 41)
  const clientesIndicados = seededValue(`${seed}:clients`, 0, 18)
  const comissaoAcumulada = seededValue(`${seed}:commission`, 1200, 48000)
  const hasDefaultCommission = index % 3 !== 0
  const status = index % 7 === 0 ? 'inativo' : 'ativo'
  const bankIndex = seededValue(`${seed}:bank`, 0, BANKS.length - 1)

  return {
    id,
    nome: PARTNER_NAMES[index % PARTNER_NAMES.length],
    documento,
    documentoTipo: isCnpj ? 'cnpj' : 'cpf',
    telefone: padPhone(index + 103),
    email: `contato+${index + 1}@parceiro.telefarmed.mock`,
    status,
    clientesIndicados,
    comissaoAcumulada,
    comissaoPadraoPercentual: hasDefaultCommission ? seededValue(`${seed}:pct`, 5, 15) : null,
    bank: {
      banco: BANKS[bankIndex],
      agencia: String(seededValue(`${seed}:ag`, 1000, 9999)),
      conta: `${seededValue(`${seed}:cc`, 10000, 99999)}-${seededValue(`${seed}:dv`, 0, 9)}`,
      pixKey: isCnpj ? padCnpj(index + 91) : padCpf(index + 55),
      pixKeyType: isCnpj ? 'cnpj' : 'cpf',
    },
    dataCadastro: formatDateFromSeed(seed),
  }
}

export function buildCrmPartnersParceirosMock(): CrmPartnersParceiroRow[] {
  return PARTNER_NAMES.map((_, index) => buildPartnerRow(index))
}

function buildClientesIndicados(partner: CrmPartnersParceiroRow): CrmPartnersParceiroClienteIndicado[] {
  const count = Math.min(partner.clientesIndicados, 8)
  const items: CrmPartnersParceiroClienteIndicado[] = []

  for (let index = 0; index < count; index += 1) {
    const seed = `${partner.id}:client:${index}`
    const tipo = CLIENTE_TIPOS[seededValue(seed, 0, CLIENTE_TIPOS.length - 1)]
    const statusRoll = seededValue(`${seed}:status`, 0, 10)
    const statusContrato =
      statusRoll <= 6 ? 'ativo' : statusRoll <= 8 ? 'pendente' : 'encerrado'

    items.push({
      id: `${partner.id}-client-${index + 1}`,
      nome: CLIENTE_NAMES[(index + hashString(partner.id)) % CLIENTE_NAMES.length],
      tipo,
      dataIndicacao: formatDateFromSeed(seed),
      statusContrato,
    })
  }

  return items
}

function buildHistoricoComissoes(partner: CrmPartnersParceiroRow): CrmPartnersParceiroComissao[] {
  const count = seededValue(`${partner.id}:history`, 4, 10)
  const currentMonth = getCurrentCrmPartnersMonthKey()
  const items: CrmPartnersParceiroComissao[] = []

  for (let index = 0; index < count; index += 1) {
    const seed = `${partner.id}:commission:${index}`
    const status = seededValue(`${seed}:st`, 0, 10) > 3 ? 'pago' : 'pendente'
    const valor = seededValue(`${seed}:val`, 350, 4200)
    const clientIndex = (index + hashString(partner.id)) % CLIENTE_NAMES.length

    items.push({
      id: `${partner.id}-com-${index + 1}`,
      referencia: formatCrmPartnersMonthLabel(currentMonth),
      clienteNome: CLIENTE_NAMES[clientIndex],
      valor,
      status,
      dataPrevista: status === 'pendente' ? formatDateFromSeed(`${seed}:prev`) : null,
      dataPagamento: status === 'pago' ? formatDateFromSeed(`${seed}:paid`) : null,
    })
  }

  return items.sort((left, right) => {
    if (left.status === right.status) return 0
    return left.status === 'pendente' ? -1 : 1
  })
}

export function buildCrmPartnersParceiroDetail(
  partner: CrmPartnersParceiroRow,
): CrmPartnersParceiroDetail {
  return {
    parceiro: partner,
    clientesIndicados: buildClientesIndicados(partner),
    historicoComissoes: buildHistoricoComissoes(partner),
  }
}

export function getCrmPartnersClienteTipoLabel(tipo: CrmPartnersClienteTipo): string {
  return CLIENTE_TIPO_LABELS[tipo]
}

export { CLIENTE_TIPO_LABELS }
