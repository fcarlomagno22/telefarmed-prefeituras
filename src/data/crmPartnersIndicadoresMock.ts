import { CircleCheck, Clock, Handshake, TrendingUp, Wallet } from 'lucide-react'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import type {
  CrmPartnersIndicadorDetail,
  CrmPartnersIndicadorRow,
  CrmPartnersIndicadoresSummary,
} from '../types/crmPartnersIndicadores'

function formatTodayBr(): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date())
}

const indicadoresRows: CrmPartnersIndicadorRow[] = [
  {
    id: 'ind-001',
    cliente: 'Prefeitura X',
    minhaComissao: 5000,
    valorParceiros: 1500,
    valorDisponivel: 3500,
    nfEmitida: false,
    nfStatus: 'pendente',
    previsaoPagamento: '15/07/2026',
    status: 'aguardando_nota_fiscal',
  },
  {
    id: 'ind-002',
    cliente: 'Santa Casa Y',
    minhaComissao: 2000,
    valorParceiros: 500,
    valorDisponivel: 1500,
    nfEmitida: true,
    nfStatus: 'enviada',
    previsaoPagamento: '20/07/2026',
    status: 'em_processamento',
  },
  {
    id: 'ind-003',
    cliente: 'Empresa Z',
    minhaComissao: 1200,
    valorParceiros: 0,
    valorDisponivel: 1200,
    nfEmitida: true,
    nfStatus: 'aprovada',
    previsaoPagamento: null,
    status: 'pago',
  },
  {
    id: 'ind-004',
    cliente: 'Prefeitura de Campinas',
    minhaComissao: 3800,
    valorParceiros: 950,
    valorDisponivel: 0,
    nfEmitida: false,
    nfStatus: 'pendente',
    previsaoPagamento: '28/07/2026',
    status: 'aguardando_cliente_pagar',
  },
  {
    id: 'ind-005',
    cliente: 'Santa Casa de Sorocaba',
    minhaComissao: 2600,
    valorParceiros: 780,
    valorDisponivel: 1820,
    nfEmitida: true,
    nfStatus: 'enviada',
    previsaoPagamento: '05/08/2026',
    status: 'nota_enviada',
  },
  {
    id: 'ind-006',
    cliente: 'Empresa Tech Solutions',
    minhaComissao: 900,
    valorParceiros: 0,
    valorDisponivel: 900,
    nfEmitida: false,
    nfStatus: 'pendente',
    previsaoPagamento: '10/08/2026',
    status: 'previsto',
  },
]

const indicadoresDetails: Record<string, Omit<CrmPartnersIndicadorDetail, 'row'>> = {
  'ind-001': {
    valorRecebidoTelefarmed: 50000,
    percentualComissao: 10,
    comissaoBrutaVendedor: 5000,
    parceiros: [
      { id: 'p-01', nome: 'João Silva', valor: 900 },
      { id: 'p-02', nome: 'Maria Costa', valor: 600 },
    ],
    valorLiquidoVendedor: 3500,
    dataPrevistaPagamento: '15/07/2026',
    dataPagamentoTelefarmed: '01/07/2026',
    notaFiscal: null,
    notaFiscalAnexadaEm: null,
    comprovantePagamento: null,
  },
  'ind-002': {
    valorRecebidoTelefarmed: 20000,
    percentualComissao: 10,
    comissaoBrutaVendedor: 2000,
    parceiros: [{ id: 'p-03', nome: 'Carlos Mendes', valor: 500 }],
    valorLiquidoVendedor: 1500,
    dataPrevistaPagamento: '20/07/2026',
    dataPagamentoTelefarmed: '05/07/2026',
    notaFiscal: 'NF-2026-00482.pdf',
    notaFiscalAnexadaEm: '08/07/2026',
    comprovantePagamento: null,
  },
  'ind-003': {
    valorRecebidoTelefarmed: 12000,
    percentualComissao: 10,
    comissaoBrutaVendedor: 1200,
    parceiros: [],
    valorLiquidoVendedor: 1200,
    dataPrevistaPagamento: null,
    dataPagamentoTelefarmed: '15/06/2026',
    notaFiscal: 'NF-2026-00391.pdf',
    notaFiscalAnexadaEm: '18/06/2026',
    comprovantePagamento: 'comprovante-empresa-z.pdf',
  },
  'ind-004': {
    valorRecebidoTelefarmed: 38000,
    percentualComissao: 10,
    comissaoBrutaVendedor: 3800,
    parceiros: [{ id: 'p-04', nome: 'Ana Paula', valor: 950 }],
    valorLiquidoVendedor: 2850,
    dataPrevistaPagamento: '28/07/2026',
    dataPagamentoTelefarmed: null,
    notaFiscal: null,
    notaFiscalAnexadaEm: null,
    comprovantePagamento: null,
  },
  'ind-005': {
    valorRecebidoTelefarmed: 26000,
    percentualComissao: 10,
    comissaoBrutaVendedor: 2600,
    parceiros: [
      { id: 'p-05', nome: 'Roberto Lima', valor: 480 },
      { id: 'p-06', nome: 'Fernanda Alves', valor: 300 },
    ],
    valorLiquidoVendedor: 1820,
    dataPrevistaPagamento: '05/08/2026',
    dataPagamentoTelefarmed: '22/07/2026',
    notaFiscal: 'NF-2026-00517.pdf',
    notaFiscalAnexadaEm: '25/07/2026',
    comprovantePagamento: null,
  },
  'ind-006': {
    valorRecebidoTelefarmed: 9000,
    percentualComissao: 10,
    comissaoBrutaVendedor: 900,
    parceiros: [],
    valorLiquidoVendedor: 900,
    dataPrevistaPagamento: '10/08/2026',
    dataPagamentoTelefarmed: null,
    notaFiscal: null,
    notaFiscalAnexadaEm: null,
    comprovantePagamento: null,
  },
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function computeSummary(rows: CrmPartnersIndicadorRow[]): CrmPartnersIndicadoresSummary {
  return rows.reduce(
    (acc, row) => {
      acc.previsto += row.minhaComissao

      if (row.status !== 'aguardando_cliente_pagar' && row.status !== 'previsto') {
        acc.disponivel += row.valorDisponivel
      }

      if (row.status === 'em_processamento' || row.status === 'nota_enviada') {
        acc.emProcessamento += row.valorDisponivel
      }

      if (row.status === 'pago') {
        acc.pago += row.minhaComissao
      }

      if (row.status !== 'pago') {
        acc.aPagarParceiros += row.valorParceiros
      }

      return acc
    },
    {
      previsto: 0,
      disponivel: 0,
      emProcessamento: 0,
      pago: 0,
      aPagarParceiros: 0,
    },
  )
}

function buildKpiCards(summary: CrmPartnersIndicadoresSummary): KpiStatCardItem[] {
  return [
    {
      label: 'Previsto',
      value: formatCurrency(summary.previsto),
      suffix: 'tudo que você poderá receber',
      icon: TrendingUp,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-500',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.28)]',
      iconRing: 'ring-sky-100/80',
      topBar: 'from-sky-400 to-indigo-500',
    },
    {
      label: 'Disponível',
      value: formatCurrency(summary.disponivel),
      suffix: 'liberado para faturamento',
      icon: Wallet,
      iconGradient: 'from-violet-400 via-purple-500 to-fuchsia-500',
      iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.28)]',
      iconRing: 'ring-violet-100/80',
      topBar: 'from-violet-400 to-fuchsia-500',
    },
    {
      label: 'Em processamento',
      value: formatCurrency(summary.emProcessamento),
      suffix: 'nota enviada, aguardando pagamento',
      icon: Clock,
      iconGradient: 'from-amber-400 via-orange-500 to-orange-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.28)]',
      iconRing: 'ring-amber-100/80',
      topBar: 'from-amber-400 to-orange-500',
    },
    {
      label: 'Pago',
      value: formatCurrency(summary.pago),
      suffix: 'total já recebido',
      icon: CircleCheck,
      iconGradient: 'from-emerald-400 via-emerald-500 to-teal-500',
      iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.28)]',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-teal-500',
    },
    {
      label: 'A pagar aos parceiros',
      value: formatCurrency(summary.aPagarParceiros),
      suffix: 'valor a repassar',
      icon: Handshake,
      iconGradient: 'from-orange-400 via-orange-500 to-amber-500',
      iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
      iconRing: 'ring-orange-100/80',
      topBar: 'from-orange-400 to-amber-500',
    },
  ]
}

function buildDetailFromStore(id: string): CrmPartnersIndicadorDetail | null {
  const row = indicadoresRows.find((item) => item.id === id)
  const detail = indicadoresDetails[id]
  if (!row || !detail) return null
  return { row: { ...row }, ...detail }
}

export function listCrmPartnersIndicadoresRows(): CrmPartnersIndicadorRow[] {
  return indicadoresRows.map((row) => ({ ...row }))
}

export function getCrmPartnersIndicadorDetail(id: string): CrmPartnersIndicadorDetail | null {
  return buildDetailFromStore(id)
}

export function marcarCrmPartnersNfEmitida(id: string): CrmPartnersIndicadorDetail | null {
  const row = indicadoresRows.find((item) => item.id === id)
  if (!row || row.nfEmitida) return buildDetailFromStore(id)

  row.nfEmitida = true
  if (row.status === 'aguardando_nota_fiscal') {
    row.status = 'nota_enviada'
  }

  return buildDetailFromStore(id)
}

export function anexarCrmPartnersNotaFiscal(
  id: string,
  fileName: string,
): CrmPartnersIndicadorDetail | null {
  const row = indicadoresRows.find((item) => item.id === id)
  const detail = indicadoresDetails[id]
  if (!row || !detail || !row.nfEmitida) return buildDetailFromStore(id)

  detail.notaFiscal = fileName
  detail.notaFiscalAnexadaEm = formatTodayBr()
  row.nfStatus = 'enviada'
  if (row.status === 'aguardando_nota_fiscal' || row.status === 'nota_enviada') {
    row.status = 'em_processamento'
  }

  return buildDetailFromStore(id)
}

export function buildCrmPartnersIndicadoresData() {
  const rows = listCrmPartnersIndicadoresRows()
  const summary = computeSummary(rows)
  return {
    rows,
    summary,
    kpiCards: buildKpiCards(summary),
  }
}
