export type ProfissionalPerfilContext = {
  profissionalId: string
}

export type ProfissionalPerfilDocumentDto = {
  id: string
  kind: string
  label: string
  fileName: string
  uploadedAt: string
  status: 'aprovado' | 'pendente' | 'vencido'
  iconTone: 'orange' | 'blue' | 'green' | 'violet'
}

export type ProfissionalPerfilDto = {
  id: string
  fullName: string
  professionalTitle: string
  cpf: string
  rg: string
  conselhoClasse: 'medico' | 'psicologo' | 'fonoaudiologo' | 'nutricionista'
  conselhoRegistro: string
  conselhoUf: string
  rqe: string
  birthDate: string
  specialty: string
  profession: string
  professionalDescription: string
  professionalAddress: string
  phone: string
  email: string
  avatarUrl: string | null
  empresa: {
    id?: string
    razaoSocial: string
    nomeFantasia: string
    cnpj: string
    pixKeyType: string
    pixKeys: Record<string, string>
  }
  bankAccount: {
    bankName: string
    bankCode: string
    agency: string
    account: string
    accountType: 'corrente' | 'poupanca'
  }
  pixKeyType: string
  documents: ProfissionalPerfilDocumentDto[]
  certificadoDigital: {
    modo: string
    status: string
    updatedAt: string | null
    expiresAt: string | null
    emissorDescricao: string | null
    arquivoNome: string | null
    titularNome: string | null
  }
  publicSummary: {
    isOnline: boolean
    onlineLabel: string
    averageRating: number
    reviewCount: number
    totalAttendances: number
  }
  profileCompletenessPercent: number
}
