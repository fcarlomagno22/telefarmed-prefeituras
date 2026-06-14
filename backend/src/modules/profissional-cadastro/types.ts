export type FormacaoCandidatura = 'medicina' | 'psicologia' | 'nutricao' | 'fonoaudiologia'

export type TipoDocumentoCandidatura = 'identidade' | 'crm' | 'comprovante' | 'outro'

export type CandidaturaEndereco = {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export type CandidaturaEspecialidadeMedicaInput = {
  especialidadeNome: string
  rqe: string
}

export type SubmitCandidaturaInput = {
  nomeCompleto: string
  cpf: string
  dataNascimento: string
  email: string
  telefone: string
  formacao: FormacaoCandidatura
  especialidadesMedicas?: CandidaturaEspecialidadeMedicaInput[]
  conselhoNumero: string
  conselhoUf: string
  descricaoProfissional?: string
  endereco: CandidaturaEndereco
}

export type CandidaturaDocumentoUpload = {
  fieldId: string
  tipo: TipoDocumentoCandidatura
  rotulo: string
  buffer: Buffer
  mimeType: string
  nomeArquivo: string
  tamanhoBytes: number
}

export type SubmitCandidaturaResult = {
  candidaturaId: string
}
