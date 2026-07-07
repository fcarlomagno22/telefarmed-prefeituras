export type CrmPartnersParceiroStatus = 'ativo' | 'inativo'

export type CrmPartnersClienteTipo = 'prefeitura' | 'santa_casa' | 'empresa'

export type CrmPartnersComissaoStatus = 'pendente' | 'pago'

export type CrmPartnersPixKeyType = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'

export type CrmPartnersParceiroBankInfo = {
  banco: string
  agencia: string
  conta: string
  pixKey: string
  pixKeyType: CrmPartnersPixKeyType
}

export type CrmPartnersParceiroRow = {
  id: string
  nome: string
  documento: string
  documentoTipo: 'cpf' | 'cnpj'
  telefone: string
  email: string
  status: CrmPartnersParceiroStatus
  clientesIndicados: number
  comissaoAcumulada: number
  comissaoPadraoPercentual: number | null
  bank: CrmPartnersParceiroBankInfo
  dataCadastro: string
}

export type CrmPartnersParceiroClienteIndicado = {
  id: string
  nome: string
  tipo: CrmPartnersClienteTipo
  dataIndicacao: string
  statusContrato: 'ativo' | 'pendente' | 'encerrado'
}

export type CrmPartnersParceiroComissao = {
  id: string
  referencia: string
  clienteNome: string
  valor: number
  status: CrmPartnersComissaoStatus
  dataPrevista: string | null
  dataPagamento: string | null
}

export type CrmPartnersParceiroDetail = {
  parceiro: CrmPartnersParceiroRow
  clientesIndicados: CrmPartnersParceiroClienteIndicado[]
  historicoComissoes: CrmPartnersParceiroComissao[]
}

export type CrmPartnersParceiroFormValues = {
  nome: string
  documento: string
  documentoTipo: 'cpf' | 'cnpj'
  telefone: string
  email: string
  comissaoPadraoPercentual: string
  banco: string
  agencia: string
  conta: string
  pixKey: string
  pixKeyType: CrmPartnersPixKeyType
}

export type CrmPartnersParceiroAction = 'view' | 'edit' | 'inactivate' | 'activate'
