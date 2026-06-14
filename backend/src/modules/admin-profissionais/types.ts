export type DbCandidaturaStatus =
  | 'pendente'
  | 'em_analise'
  | 'aprovada'
  | 'reprovada'
  | 'correcao_solicitada'

export type UiCandidaturaStatus =
  | 'pendente'
  | 'em_analise'
  | 'incompleto'
  | 'aprovado'
  | 'reprovado'

export type FormacaoCandidatura = 'medicina' | 'psicologia' | 'nutricao' | 'fonoaudiologia'

export type CandidaturaListagemRow = {
  id: string
  cpf: string
  nome_completo: string
  email: string
  telefone: string | null
  data_nascimento: string
  formacao: FormacaoCandidatura
  especialidade_id: string
  especialidade_nome: string
  conselho_sigla: string
  conselho_numero: string
  conselho_uf: string
  rqe: string | null
  descricao_profissional: string
  endereco: Record<string, unknown>
  status: DbCandidaturaStatus
  analista_admin_id: string | null
  analista_nome: string | null
  profissional_id: string | null
  enviada_em: string | null
  codigo_acesso_enviado_em: string | null
  finalizada_em: string | null
  criado_em: string
  atualizado_em: string
  empresa_status: string | null
  empresa_cnpj: string | null
  empresa_razao_social: string | null
}

export type CandidaturaDocumentoRow = {
  id: string
  candidatura_id: string
  tipo: string
  rotulo: string
  nome_arquivo: string
  mime_type: string
  tamanho_bytes: number
  storage_path: string
  status: 'pendente' | 'aprovado' | 'reprovado'
  motivo_reprovacao: string | null
  complemento_solicitado_em: string | null
  criado_em: string
}

export type CandidaturaTimelineRow = {
  id: string
  candidatura_id: string
  titulo: string
  detalhe: string | null
  autor_nome: string
  criado_em: string
}

export type CandidaturaEmpresaRow = {
  status: 'nao_informado' | 'aguardando_finalizacao' | 'vinculada'
  cnpj: string | null
  razao_social: string | null
  municipio: string | null
  uf: string | null
}

export type ProfissionalAtivoRow = {
  id: string
  cpf: string
  nome: string
  email: string | null
  telefone: string | null
  rg: string | null
  formacao: FormacaoCandidatura | null
  especialidade_id: string | null
  especialidade_nome: string
  conselho_sigla: string | null
  conselho_numero: string | null
  conselho_uf: string | null
  rqe: string | null
  bio: string
  foto_storage_path: string | null
  endereco: Record<string, unknown>
  dados_pj: Record<string, unknown>
  rating_media: number
  rating_total: number
  status: 'ativo' | 'inativo'
  status_plantao: string
  plantao_rotulo: string
  alocacao: 'nacional' | 'por_contrato'
  entidade_contratante_id: string | null
  entidade_razao_social: string | null
  entidade_municipio: string | null
  entidade_uf: string | null
  online_ate: string | null
  pacientes_mes_atual: number
  ultimo_login_em: string | null
  data_nascimento: string | null
  criado_em: string
  atualizado_em: string
  online_agora: boolean
}

export type CandidaturasSummaryDto = {
  total: number
  pendente: number
  incompleto: number
  aprovado: number
  reprovado: number
  em_analise: number
  aguardandoFinalizacao: number
}

export type AtivosSummaryDto = {
  total: number
  ativos: number
  inativos: number
  online: number
  emPlantao: number
  nacional: number
  porContrato: number
  medicos: number
  psicologos: number
  nutricionistas: number
  fonoaudiologos: number
  averageRating: number
  avgPatientsMonth: number
}
