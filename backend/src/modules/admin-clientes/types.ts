export type AdminClienteStatus =
  | 'ativa'
  | 'implantacao'
  | 'prospect'
  | 'suspensa'
  | 'sem_contrato'

export type AdminClienteContratoTipo = 'mensal' | 'pacote_fechado' | 'sob_demanda'

export type AdminClienteContratoStatus = 'ativo' | 'encerrado' | 'suspenso' | 'implantacao'

export type AdminClienteContactDto = {
  name: string
  email: string
  phone?: string
  phoneType?: 'fixo' | 'celular'
}

export type AdminClientePrecoProfissaoDto = {
  professionId: string
  valorConsulta: number
}

export type AdminClientePrecoEspecialidadeDto = {
  specialtyId: string
  valorConsulta: number
}

export type AdminClienteContratoDetalhesDto = {
  consultasContratadas: number | null
  valorConsultaPacote: number | null
  permiteUltrapassar: boolean
  aceitaPacientesOutrosMunicipios: boolean
  precosPorProfissao: AdminClientePrecoProfissaoDto[]
  precosPorEspecialidade: AdminClientePrecoEspecialidadeDto[]
  excedentePrecosPorProfissao: AdminClientePrecoProfissaoDto[] | null
  excedentePrecosPorEspecialidade: AdminClientePrecoEspecialidadeDto[] | null
  especialidadesAutorizadas: string[]
}

export type AdminClienteContratoDto = {
  id: string
  numero?: string
  dataAssinatura: string
  dataEncerramento?: string | null
  /** ID em config_tipos_contrato */
  tipo: string
  /** Modalidade comercial para regras de volume/cobrança */
  modalidade: AdminClienteContratoTipo
  status: AdminClienteContratoStatus
  percentualUtilizado: number | null
  consultasRealizadas: number | null
  detalhes?: AdminClienteContratoDetalhesDto
}

export type AdminClienteRowDto = {
  id: string
  prefeitura: string
  subtitle: string
  razaoSocial: string
  cnpj: string
  municipio: string
  uf: string
  gestor: AdminClienteContactDto
  contatoContrato?: AdminClienteContactDto
  contatoTi: AdminClienteContactDto
  contatoSaude: AdminClienteContactDto
  status: AdminClienteStatus
  logoHue: number
  logoUrl?: string
  contratos: AdminClienteContratoDto[]
}

export type ClientesSummaryDto = {
  ativas: number
  ativasTrend: string
  implantacao: number
  implantacaoTrend: string
  prospects: number
  prospectsTrend: string
  suspensas: number
  suspensasTrend: string
  totalCadastrados: number
  ultimaAtualizacaoMunicipio: string
  ultimaAtualizacaoAgo: string
  porStatus: {
    ativas: number
    implantacao: number
    prospects: number
    suspensas: number
    semContrato: number
  }
}

export type ClinicoProfessionDto = {
  id: string
  name: string
  councilLabel: string
  councilAcronym: string
  active: boolean
  specialtyIds: string[]
}

export type ClinicoSpecialtyDto = {
  id: string
  name: string
  active: boolean
  professionIds: string[]
}

export type ClinicoCatalogDto = {
  professions: ClinicoProfessionDto[]
  specialties: ClinicoSpecialtyDto[]
}

export type ClienteContratoTipoDto = {
  id: string
  label: string
  description: string
  modalidade: AdminClienteContratoTipo
}

export type ClienteContratoCatalogDto = {
  contractTypes: ClienteContratoTipoDto[]
  defaultAllowExceedPackage: boolean
  defaultAvulsoUnitValueBrl: string
}
