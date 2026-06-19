import type { ConsultationChatMessage } from '../components/attendance/consultationChatTypes'
import type { ConsultationDocumentItem } from '../components/attendance/ConsultationDocumentsPanel'
import type { DoctorRecordNote } from '../components/attendance/doctor/doctorRecordTypes'
import type { AttendanceSession } from './attendanceSession'
import { brand } from '../config/brand'
import { PROFISSIONAL_HISTORICO_DEMO_PACIENTE_ID } from '../config/profissionalHistoricoDemo'
import { CONSULTATION_CHAT_MOCK } from './consultationChatMock'
import { getDoctorRecordNotesForSpecialty } from './doctorConsultationMock'

export const DOCTOR_CONSULTATION_DEMO_CODIGO = 'demoSalaAtend2026'

/** Token fictício para drawers/mock em páginas públicas de demonstração. */
export const DOCTOR_CONSULTATION_PUBLIC_DEMO_TOKEN = 'public-demo-sala-atendimento'

const DOCTOR_PHOTO =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80'
const PATIENT_PHOTO =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'

export const DOCTOR_CONSULTATION_DEMO_TRIAGE_SUMMARY = [
  'Motivo: Tosse residual após IVAS',
  'Início: Há 2 dias',
  'Intensidade: Leve (3/10)',
  'Sintomas: Tosse seca ocasional, sem febre',
  'Pressão arterial: 118/76 mmHg',
  'Medicamentos em uso: Nenhum contínuo',
].join('\n')

export type DoctorConsultationDemoSnapshot = {
  codigo: string
  startedAtIso: string
  patientAgeGender: string
  attendanceSession: AttendanceSession
  messages: ConsultationChatMessage[]
  documents: ConsultationDocumentItem[]
  historicoNotes: DoctorRecordNote[]
  triageSummary: string
  clinicalNoteDraft: string
  pacienteId: string
}

export function buildDoctorConsultationDemoSnapshot(): DoctorConsultationDemoSnapshot {
  const startedAt = new Date(Date.now() - 14 * 60 * 1000)
  const codigo = DOCTOR_CONSULTATION_DEMO_CODIGO

  const attendanceSession: AttendanceSession = {
    id: codigo,
    patientName: 'Maria Souza Lima',
    patientBirthDateIso: '1991-08-14',
    patientAddress: 'Av. Brasil, 455 · Centro · Fernandópolis, SP · CEP 15600-000',
    patientCity: 'Fernandópolis, SP',
    patientCpfMasked: '412.876.530-**',
    patientPhotoUrl: PATIENT_PHOTO,
    doctorName: brand.profissionalOperatorName,
    doctorSpecialty: 'Clínica Médica',
    doctorCrm: '123456/SP',
    doctorPhotoUrl: DOCTOR_PHOTO,
    doctorVideoPosterUrl: DOCTOR_PHOTO,
    unitName: 'Teleatendimento',
    insuranceLabel: 'SUS · Atenção primária',
    appointmentDateLabel: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(startedAt),
    appointmentTimeLabel: new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(startedAt),
    startedAtIso: startedAt.toISOString(),
    quickNotes: '',
    specialty: 'Clínica Médica',
    consultationDocuments: [],
  }

  return {
    codigo,
    startedAtIso: startedAt.toISOString(),
    patientAgeGender: '34 anos • Feminino',
    attendanceSession,
    messages: [...CONSULTATION_CHAT_MOCK],
    documents: [],
    historicoNotes: getDoctorRecordNotesForSpecialty('Clínica Médica'),
    triageSummary: DOCTOR_CONSULTATION_DEMO_TRIAGE_SUMMARY,
    clinicalNoteDraft:
      'Paciente em teleconsulta por tosse residual pós-IVAS. Sem febre, sem dispneia. Orientada sobre hidratação e sinais de alerta.',
    pacienteId: PROFISSIONAL_HISTORICO_DEMO_PACIENTE_ID,
  }
}

export function isDoctorConsultationPublicDemoToken(token: string | null | undefined): boolean {
  return token === DOCTOR_CONSULTATION_PUBLIC_DEMO_TOKEN
}
