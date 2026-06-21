import type { TipoEntidade } from './entidadeBranding'
import type { ContratoOrigemAtendimento } from '../config/adminContratoOrigemAtendimento'

export type AdminClienteStatus =
  | 'ativa'
  | 'implantacao'
  | 'prospect'
  | 'suspensa'
  | 'sem_contrato'

export type AdminClienteContratoTipo = 'mensal' | 'pacote_fechado' | 'sob_demanda'

export type AdminClienteContratoStatus = 'ativo' | 'encerrado' | 'suspenso' | 'implantacao'

export type AdminClientesTab = 'clientes' | 'implantacao' | 'prospect'

export type AdminClienteContact = {
  name: string
  email: string
  phone?: string
  phoneType?: 'fixo' | 'celular'
}

export type AdminClientePrecoEspecialidade = {
  specialtyId: string
  valorConsulta: number
  origemAtendimento?: ContratoOrigemAtendimento
}

export type AdminClientePrecoProfissao = {
  professionId: string
  valorConsulta: number
  origemAtendimento?: ContratoOrigemAtendimento
}

export type AdminClienteContratoDetalhes = {
  consultasContratadas: number | null
  /** @deprecated Preferir precosPorEspecialidade */
  valorConsultaPacote: number | null
  permiteUltrapassar: boolean
  aceitaPacientesOutrosMunicipios: boolean
  precosPorProfissao: AdminClientePrecoProfissao[]
  precosPorEspecialidade: AdminClientePrecoEspecialidade[]
  excedentePrecosPorProfissao: AdminClientePrecoProfissao[] | null
  excedentePrecosPorEspecialidade: AdminClientePrecoEspecialidade[] | null
  especialidadesAutorizadas: string[]
}

export type AdminClienteContrato = {
  id: string
  numero?: string
  dataAssinatura: string
  dataEncerramento?: string | null
  /** ID em config_tipos_contrato (ou preset legado no mock) */
  tipo: string
  /** Modalidade comercial — enviada pela API; opcional no mock legado */
  modalidade?: AdminClienteContratoTipo
  status: AdminClienteContratoStatus
  percentualUtilizado: number | null
  consultasRealizadas: number | null
  detalhes?: AdminClienteContratoDetalhes
}

export type AdminClienteRow = {
  id: string
  prefeitura: string
  /** Tipo da entidade contratante — default `prefeitura` quando ausente (legado). */
  tipoEntidade?: TipoEntidade
  subtitle: string
  razaoSocial: string
  cnpj: string
  municipio: string
  uf: string
  slug?: string
  publicUrl?: string
  slugLocked?: boolean
  gestor: AdminClienteContact
  contatoContrato?: AdminClienteContact
  contatoTi: AdminClienteContact
  contatoSaude: AdminClienteContact
  status: AdminClienteStatus
  logoHue: number
  logoUrl?: string
  loginBackgroundUrl?: string
  faviconUrl?: string
  corPrimaria?: string
  contratos: AdminClienteContrato[]
}

export const adminClientesStatusFilterOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'ativa', label: 'Ativa' },
  { value: 'implantacao', label: 'Implantação' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'suspensa', label: 'Suspensa' },
  { value: 'sem_contrato', label: 'Sem contrato' },
] as const

export const adminClienteContratoTipoLabels: Record<AdminClienteContratoTipo, string> = {
  mensal: 'Mensal',
  pacote_fechado: 'Pacote fechado',
  sob_demanda: 'Sob demanda',
}
