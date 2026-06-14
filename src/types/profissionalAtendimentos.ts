import type { ConsultationChatAttachment } from '../components/attendance/consultationChatTypes'
import type { DoctorRecordNote } from '../components/attendance/doctor/doctorRecordTypes'

export type ProfissionalAttendanceStatus = 'concluido' | 'interrompido'

export type ProfissionalIssuedDocumentKind =
  | 'receita'
  | 'pedido_exame'
  | 'cardapio'
  | 'plano_alimentar'
  | 'orientacao'
  | 'atestado'
  | 'encaminhamento'

export type ProfissionalIssuedDocument = {
  id: string
  kind: ProfissionalIssuedDocumentKind
  title: string
  meta: string
  fileName: string
}

export type ProfissionalAtendimentoMensagem = {
  id: string
  from: 'doctor' | 'patient' | 'system'
  time: string
  text: string
  attachmentUrl?: string
  attachmentName?: string
}

export type ProfissionalAttendanceRecord = {
  id: string
  attendanceId: string
  dateTimeIso: string
  dateTimeLabel: string
  patientName: string
  patientPhotoUrl: string
  birthDateIso: string
  age: number
  gender: 'F' | 'M'
  specialty: string
  durationMinutes: number
  status: ProfissionalAttendanceStatus
  triageSummary?: string
  recordNotes: DoctorRecordNote[]
  issuedDocuments: ProfissionalIssuedDocument[]
  patientUploads: ConsultationChatAttachment[]
}

export type ProfissionalAtendimentoDetail = {
  record: ProfissionalAttendanceRecord
  mensagens: ProfissionalAtendimentoMensagem[]
}

export type ProfissionalAtendimentosFilters = {
  generalSearch: string
  specialty: string
  status: ProfissionalAttendanceStatus | ''
  periodStart: string
  periodEnd: string
}
