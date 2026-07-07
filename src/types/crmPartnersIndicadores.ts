export type CrmPartnersIndicadorStatus =
  | 'previsto'
  | 'aguardando_cliente_pagar'
  | 'aguardando_nota_fiscal'
  | 'nota_enviada'
  | 'em_processamento'
  | 'pago'

export type CrmPartnersIndicadorNfStatus = 'pendente' | 'enviada' | 'aprovada'

export type CrmPartnersIndicadorParceiro = {
  id: string
  nome: string
  valor: number
}

export type CrmPartnersIndicadorRow = {
  id: string
  cliente: string
  minhaComissao: number
  valorParceiros: number
  valorDisponivel: number
  nfEmitida: boolean
  nfStatus: CrmPartnersIndicadorNfStatus
  previsaoPagamento: string | null
  status: CrmPartnersIndicadorStatus
}

export type CrmPartnersIndicadorDetail = {
  row: CrmPartnersIndicadorRow
  valorRecebidoTelefarmed: number
  percentualComissao: number
  comissaoBrutaVendedor: number
  parceiros: CrmPartnersIndicadorParceiro[]
  valorLiquidoVendedor: number
  dataPrevistaPagamento: string | null
  dataPagamentoTelefarmed: string | null
  notaFiscal: string | null
  notaFiscalAnexadaEm: string | null
  comprovantePagamento: string | null
}

export type CrmPartnersIndicadoresSummary = {
  previsto: number
  disponivel: number
  emProcessamento: number
  pago: number
  aPagarParceiros: number
}
