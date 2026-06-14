export type PublicFilaStatusDto = {
  position: number
  total: number
  status: 'aguardando' | 'chamado' | 'em_atendimento' | 'finalizado' | 'desistiu' | 'sem_fila'
  estimatedMinutes: number
  readyForConsultation: boolean
}

export type PublicConsultaDocumentoDto = {
  id: string
  title: string
  type: string
  origin: 'paciente' | 'profissional'
  signedAtLabel?: string
}

export type PublicAtendimentoSessaoDto = {
  token: string
  consultaId: string
  consultaStatus: string
  patientName: string
  patientAge: number
  patientCity: string
  patientCpfMasked: string
  patientPhotoUrl: string
  specialty: string
  unitName: string
  doctorName: string
  doctorSpecialty: string
  doctorCrm: string
  doctorPhotoUrl: string
  appointmentDateLabel: string
  appointmentTimeLabel: string
  startedAtIso: string
  quickNotes: string
  consultationDocuments: PublicConsultaDocumentoDto[]
  fila: PublicFilaStatusDto
  readyForConsultation: boolean
  avaliacaoEnviada: boolean
}

export type PublicAvaliacaoSessaoDto = {
  token: string
  consultaId: string
  consultaStatus: string
  doctorName: string
  doctorSpecialty: string
  doctorPhotoUrl: string | null
  avaliacaoEnviada: boolean
}
