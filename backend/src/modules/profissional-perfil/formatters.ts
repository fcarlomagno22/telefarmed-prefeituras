import type { ProfissionalPerfilDocumentDto, ProfissionalPerfilDto } from './types.js'

function formatCpfDisplay(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11) return value
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

const FORMACAO_TO_CONSELHO: Record<string, ProfissionalPerfilDto['conselhoClasse']> = {
  medicina: 'medico',
  psicologia: 'psicologo',
  nutricao: 'nutricionista',
  fonoaudiologia: 'fonoaudiologo',
}

const FORMACAO_PROFESSION: Record<string, string> = {
  medicina: 'Médicos',
  psicologia: 'Psicólogos',
  nutricao: 'Nutricionistas',
  fonoaudiologia: 'Fonoaudiólogos',
}

const FORMACAO_TITLE: Record<string, string> = {
  medicina: 'Médico(a)',
  psicologia: 'Psicólogo(a)',
  nutricao: 'Nutricionista',
  fonoaudiologia: 'Fonoaudiólogo(a)',
}

const DOC_ICON_TONE: Record<string, ProfissionalPerfilDocumentDto['iconTone']> = {
  crm: 'orange',
  identidade: 'blue',
  outro: 'green',
  comprovante: 'violet',
  contrato: 'violet',
}

function mapDocumentStatus(status: string): ProfissionalPerfilDocumentDto['status'] {
  if (status === 'aprovado') return 'aprovado'
  if (status === 'reprovado') return 'vencido'
  return 'pendente'
}

function mapDocumentKind(tipo: string): string {
  if (tipo === 'crm') return 'crm'
  if (tipo === 'identidade') return 'identidade'
  if (tipo === 'comprovante') return 'comprovante'
  if (tipo === 'contrato') return 'contrato'
  return 'outro'
}

export function formatEndereco(endereco: unknown): string {
  if (!endereco || typeof endereco !== 'object') return ''
  const obj = endereco as Record<string, unknown>
  if (typeof obj.formatted === 'string' && obj.formatted.trim()) return obj.formatted.trim()
  if (typeof obj.texto === 'string' && obj.texto.trim()) return obj.texto.trim()

  const parts = [
    obj.logradouro,
    obj.numero ? `nº ${obj.numero}` : null,
    obj.complemento,
    obj.bairro,
    obj.cidade,
    obj.uf,
    obj.cep ? `CEP ${obj.cep}` : null,
  ]
    .filter((part) => typeof part === 'string' && part.trim())
    .map((part) => String(part).trim())

  return parts.join(', ')
}

function normalizePixKeys(
  pixKeyType: string,
  pixKey: string,
  pj: Record<string, unknown>,
): Record<string, string> {
  const keys: Record<string, string> = {}
  const stored = pj.pixKeys
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    for (const [key, value] of Object.entries(stored as Record<string, unknown>)) {
      if (typeof value === 'string') keys[key] = value
    }
  }
  if (pixKeyType && pixKey) keys[pixKeyType] = pixKey
  return keys
}

function computeCompleteness(input: {
  nome: string
  telefone: string
  bio: string
  especialidade: string
  foto?: string | null
  endereco: string
  dadosPagamento: boolean
  certificadoStatus: string
  documentsApproved: number
  documentsTotal: number
}): number {
  let score = 0
  const weights = [
    input.nome.trim().length >= 3,
    input.telefone.trim().length >= 8,
    input.bio.trim().length >= 20,
    input.especialidade.trim().length >= 2,
    Boolean(input.foto),
    input.endereco.trim().length >= 10,
    input.dadosPagamento,
    input.certificadoStatus === 'ativo',
    input.documentsTotal > 0 && input.documentsApproved === input.documentsTotal,
  ]
  for (const item of weights) {
    if (item) score += 1
  }
  return Math.round((score / weights.length) * 100)
}

type ProfissionalRow = {
  id: string
  cpf: string
  nome: string
  email: string | null
  telefone: string | null
  rg: string | null
  formacao: string | null
  especialidade: string | null
  conselho_numero: string | null
  conselho_uf: string | null
  rqe: string | null
  bio: string | null
  endereco: unknown
  dados_pj: unknown
  assinatura: unknown
  foto_storage_path: string | null
  data_nascimento: string | null
  rating_media: number | string | null
  rating_total: number | null
  plantao_rotulo: string | null
  online_ate: string | null
}

type PagamentoRow = {
  pix_tipo: string | null
  pix_chave: string | null
  banco_nome: string | null
  banco_codigo: string | null
  agencia: string | null
  conta: string | null
  tipo_conta: string | null
  titular: string | null
} | null

type DocumentRow = {
  id: string
  tipo: string
  rotulo: string
  nome_arquivo: string
  criado_em: string
  status: string
}

export function mapDocumentRow(row: DocumentRow): ProfissionalPerfilDocumentDto {
  return {
    id: String(row.id),
    kind: mapDocumentKind(String(row.tipo)),
    label: String(row.rotulo),
    fileName: String(row.nome_arquivo),
    uploadedAt: String(row.criado_em),
    status: mapDocumentStatus(String(row.status)),
    iconTone: DOC_ICON_TONE[String(row.tipo)] ?? 'blue',
  }
}

export function mapAssinatura(raw: unknown): ProfissionalPerfilDto['certificadoDigital'] {
  const assinatura = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const modoRaw = String(assinatura.modo ?? 'nao_cadastrado')
  const modo =
    modoRaw === 'conselho_nuvem' || modoRaw === 'a1_arquivo' || modoRaw === 'nao_cadastrado'
      ? modoRaw
      : 'nao_cadastrado'

  const statusRaw = String(assinatura.status ?? 'nao_cadastrado')
  const status =
    statusRaw === 'ativo' ||
    statusRaw === 'pendente' ||
    statusRaw === 'vencido' ||
    statusRaw === 'nao_cadastrado'
      ? statusRaw
      : 'nao_cadastrado'

  return {
    modo,
    status,
    updatedAt: assinatura.updatedAt ? String(assinatura.updatedAt) : null,
    expiresAt: assinatura.expiresAt ? String(assinatura.expiresAt) : null,
    emissorDescricao: assinatura.emissorDescricao ? String(assinatura.emissorDescricao) : null,
    arquivoNome: assinatura.arquivoNome ? String(assinatura.arquivoNome) : null,
    titularNome: assinatura.titularNome ? String(assinatura.titularNome) : null,
  }
}

export function mapProfissionalPerfilDto(input: {
  row: ProfissionalRow
  pagamento: PagamentoRow
  documents: DocumentRow[]
  avatarUrl: string | null
  totalAttendances: number
}): ProfissionalPerfilDto {
  const { row, pagamento, documents, avatarUrl, totalAttendances } = input
  const pj = (row.dados_pj && typeof row.dados_pj === 'object' ? row.dados_pj : {}) as Record<
    string,
    unknown
  >

  const formacao = String(row.formacao ?? 'medicina')
  const conselhoClasse = FORMACAO_TO_CONSELHO[formacao] ?? 'medico'
  const pixKeyType = String(pagamento?.pix_tipo ?? pj.pixTipo ?? pj.pix_tipo ?? 'cnpj')
  const pixKey = String(pagamento?.pix_chave ?? pj.pixChave ?? pj.pix_chave ?? '')
  const accountType =
    String(pagamento?.tipo_conta ?? pj.tipoConta ?? pj.tipo_conta ?? 'corrente') === 'poupanca'
      ? 'poupanca'
      : 'corrente'

  const certificadoDigital = mapAssinatura(row.assinatura)
  const mappedDocuments = documents.map(mapDocumentRow)
  const professionalAddress = formatEndereco(row.endereco)

  const dadosPagamentoOk = Boolean(
    pagamento?.pix_chave?.trim() || pixKey.trim() || pagamento?.conta?.trim(),
  )

  return {
    id: String(row.id),
    fullName: String(row.nome),
    professionalTitle: FORMACAO_TITLE[formacao] ?? 'Profissional',
    cpf: formatCpfDisplay(String(row.cpf)),
    rg: String(row.rg ?? ''),
    conselhoClasse,
    conselhoRegistro: String(row.conselho_numero ?? ''),
    conselhoUf: String(row.conselho_uf ?? ''),
    rqe: String(row.rqe ?? ''),
    birthDate: row.data_nascimento ? String(row.data_nascimento) : '',
    specialty: String(row.especialidade ?? ''),
    profession: FORMACAO_PROFESSION[formacao] ?? 'Profissionais',
    professionalDescription: String(row.bio ?? ''),
    professionalAddress,
    phone: String(row.telefone ?? ''),
    email: String(row.email ?? ''),
    avatarUrl,
    empresa: {
      razaoSocial: String(pagamento?.titular ?? pj.razaoSocial ?? pj.razao_social ?? row.nome),
      nomeFantasia: String(pj.nomeFantasia ?? pj.nome_fantasia ?? ''),
      cnpj: String(pj.cnpj ?? ''),
      pixKeyType,
      pixKeys: normalizePixKeys(pixKeyType, pixKey, pj),
    },
    bankAccount: {
      bankName: String(pagamento?.banco_nome ?? pj.bancoNome ?? pj.banco_nome ?? ''),
      bankCode: String(pagamento?.banco_codigo ?? pj.bancoCodigo ?? pj.banco_codigo ?? ''),
      agency: String(pagamento?.agencia ?? pj.agencia ?? ''),
      account: String(pagamento?.conta ?? pj.conta ?? ''),
      accountType,
    },
    pixKeyType,
    documents: mappedDocuments,
    certificadoDigital,
    publicSummary: {
      isOnline: Boolean(row.online_ate && new Date(row.online_ate) > new Date()),
      onlineLabel: String(row.plantao_rotulo ?? 'Indisponível'),
      averageRating: Number(row.rating_media ?? 0),
      reviewCount: Number(row.rating_total ?? 0),
      totalAttendances,
    },
    profileCompletenessPercent: computeCompleteness({
      nome: String(row.nome),
      telefone: String(row.telefone ?? ''),
      bio: String(row.bio ?? ''),
      especialidade: String(row.especialidade ?? ''),
      foto: row.foto_storage_path,
      endereco: professionalAddress,
      dadosPagamento: dadosPagamentoOk,
      certificadoStatus: certificadoDigital.status,
      documentsApproved: mappedDocuments.filter((item) => item.status === 'aprovado').length,
      documentsTotal: mappedDocuments.length,
    }),
  }
}
