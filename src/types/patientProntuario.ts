export type PatientProntuarioPrescription = {
  id: string
  medicationName: string
  dosage: string
  route: string
  frequency: string
  duration: string
  notes: string
}

export type PatientProntuarioExamRequest = {
  id: string
  examName: string
  notes: string
}

export type PatientProntuarioMessage = {
  id: string
  from: 'doctor' | 'patient' | 'system'
  time: string
  text: string
  attachmentUrl?: string
  attachmentName?: string
}

export type PatientProntuarioIssuedDocument = {
  id: string
  kind: string
  title: string
  meta: string
  fileName: string
  signedAtLabel?: string
  downloadUrl?: string
  codigoVerificacao?: string
}

export type PatientProntuarioPatientUpload = {
  id: string
  type: 'pdf' | 'image'
  url: string
  name: string
}

export type PatientProntuarioEntry = {
  id: string
  attendanceId: string
  dateTimeIso: string
  dateTimeLabel: string
  specialty: string
  professionalName: string
  professionalCrm: string
  ubtName: string
  status: 'concluido' | 'interrompido'
  durationMinutes: number
  triageSummary?: string
  clinicalNotes: string
  prescriptions: PatientProntuarioPrescription[]
  examRequests: PatientProntuarioExamRequest[]
  issuedDocuments: PatientProntuarioIssuedDocument[]
  patientUploads: PatientProntuarioPatientUpload[]
  messages: PatientProntuarioMessage[]
}

export type PatientProntuarioData = {
  patient: {
    id: string
    name: string
    photoUrl: string
    birthDate: string
    age: number
    genderLabel: string
    cpf: string
    municipalRecordId: string
    municipality: string
    contractingEntityRazaoSocial: string
    registrationUnit: string
    registeredAt: string
    city: string
    neighborhood: string
  }
  entries: PatientProntuarioEntry[]
}
