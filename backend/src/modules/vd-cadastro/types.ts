export type VdCepElegibilidadeEnderecoDto = {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
  complemento: string
  codigoIbgeMunicipio?: string
}

export type VdCepElegibilidadeDto = {
  elegivel: boolean
  municipio: string
  uf: string
  contratoAtivo: true
  motivo?: string
  endereco?: VdCepElegibilidadeEnderecoDto
}

export type VdCadastroEntidadeScope = {
  entidadeId: string
  entidadeSlug: string
}

export type VdCadastroLookupPatientDto = {
  patientId: string
  fullName: string
  cpf: string
  email: string
  phone: string
  address: {
    cep: string
    logradouro: string
    numero: string
    bairro: string
    cidade: string
    uf: string
    complemento?: string
    codigoIbgeMunicipio?: string
  }
  photoDataUrl?: string
  dataQuality: 'complete' | 'incomplete'
}

export type VdCadastroLookupResult =
  | { status: 'not_found' }
  | {
      status: 'needs_full_registration'
      patientId?: string
      preCadastroId?: string
    }
  | {
      status: 'found_complete_needs_credentials'
      patient: VdCadastroLookupPatientDto
    }
  | { status: 'already_registered' }

export type VdPacienteRegistrationMode = 'created' | 'updated' | 'credentials_only'

export type VdPacienteUserPublic = {
  id: string
  credencialId: string
  name: string
  cpf: string
  email: string
  phone: string
  entidadeContratanteId: string
  avatarUrl?: string
  birthDate?: string | null
  genderLabel?: string | null
  address: {
    cep: string
    logradouro: string
    numero: string
    bairro: string
    cidade: string
    uf: string
    complemento?: string
  }
}

export type VdCadastroRegistrarResult = {
  accessToken: string
  refreshToken: string
  user: VdPacienteUserPublic
  mode: VdPacienteRegistrationMode
}
