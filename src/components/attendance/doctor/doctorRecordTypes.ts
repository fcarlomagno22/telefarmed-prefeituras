import type { ConsultationChatAttachment } from '../consultationChatTypes'
import type { DoctorRecordSpecialtyKey } from '../../../data/doctorConsultationMock'

export type DoctorRecordNote = {
  id: string
  specialty: DoctorRecordSpecialtyKey
  date: string
  doctorName: string
  note: string
  /** Anexos enviados no chat da consulta em que a anotação foi registrada */
  chatAttachments?: ConsultationChatAttachment[]
}
