export type MinhaCandidaturaDocumento = {
  id: string
  label: string
  instruction?: string
  fieldId: string
  fileName: string
  previewType: 'image' | 'pdf'
  previewUrl?: string
}

export type MinhaCandidaturaEditableProfile = {
  email: string
  phone: string
  councilNumber: string
  councilUf: string
  councilLabel: string
  rqe?: string
}

export type MinhaCandidatura = {
  id: string
  fullName: string
  status: string
  statusLabel: string
  hasPendingCorrections: boolean
  dataCorrectionNote?: string
  editableProfile?: MinhaCandidaturaEditableProfile
  documents: MinhaCandidaturaDocumento[]
}

export type MinhaCandidaturaAccess = {
  cpf: string
  birthDate: string
}

export type MinhaCandidaturaDataCorrection = {
  email?: string
  telefone?: string
  conselhoNumero?: string
  conselhoUf?: string
  rqe?: string
}
