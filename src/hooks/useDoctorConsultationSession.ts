import { useCallback, useEffect, useState } from 'react'
import type { ConsultationChatMessage } from '../components/attendance/consultationChatTypes'
import type { ConsultationDocumentItem } from '../components/attendance/ConsultationDocumentsPanel'
import type { DoctorRecordNote } from '../components/attendance/doctor/doctorRecordTypes'
import type { AttendanceSession } from '../data/attendanceSession'
import {
  fetchProfissionalConsultaSessao,
  fetchProfissionalMensagens,
  formatPatientAgeGender,
  iniciarProfissionalConsultaPorCodigo,
  isProfissionalAtendimentosApiError,
  mapHistoricoToRecordNotes,
  mapIssuedDocument,
  mapProfissionalMensagensToChat,
  mapProfissionalSessaoToAttendanceSession,
  type ProfissionalConsultaSessao,
} from '../lib/services/profissional/atendimentos'
import { useConsultationChatPolling } from './useConsultationChatPolling'

type UseDoctorConsultationSessionOptions = {
  accessToken: string | null
  autoIniciar?: boolean
}

export function useDoctorConsultationSession(
  codigo: string | undefined,
  options: UseDoctorConsultationSessionOptions,
) {
  const { accessToken, autoIniciar = true } = options
  const [sessao, setSessao] = useState<ProfissionalConsultaSessao | null>(null)
  const [attendanceSession, setAttendanceSession] = useState<AttendanceSession | null>(null)
  const [messages, setMessages] = useState<ConsultationChatMessage[]>([])
  const [documents, setDocuments] = useState<ConsultationDocumentItem[]>([])
  const [historicoNotes, setHistoricoNotes] = useState<DoctorRecordNote[]>([])
  const [patientAgeGender, setPatientAgeGender] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const applySessao = useCallback((next: ProfissionalConsultaSessao) => {
    setSessao(next)
    setAttendanceSession(mapProfissionalSessaoToAttendanceSession(next))
    setMessages(mapProfissionalMensagensToChat(next.mensagens))
    setDocuments(next.issuedDocuments.map(mapIssuedDocument))
    setHistoricoNotes(mapHistoricoToRecordNotes(next.historicoProntuario))
    setPatientAgeGender(formatPatientAgeGender(next))
  }, [])

  const refresh = useCallback(async () => {
    if (!codigo || !accessToken) return
    try {
      let next = await fetchProfissionalConsultaSessao(accessToken, codigo)
      if (autoIniciar && next.status === 'aguardando_medico') {
        next = await iniciarProfissionalConsultaPorCodigo(accessToken, codigo)
      }
      applySessao(next)
      setError(null)
    } catch (err) {
      if (isProfissionalAtendimentosApiError(err) && err.status === 404) {
        setError('Consulta não encontrada.')
      } else {
        setError('Não foi possível carregar o atendimento.')
      }
    } finally {
      setLoading(false)
    }
  }, [accessToken, applySessao, autoIniciar, codigo])

  const reloadMessages = useCallback(async () => {
    if (!accessToken || !sessao?.consultaId) return
    const raw = await fetchProfissionalMensagens(accessToken, sessao.consultaId)
    setMessages(mapProfissionalMensagensToChat(raw))
  }, [accessToken, sessao?.consultaId])

  useConsultationChatPolling(reloadMessages, {
    enabled: Boolean(accessToken && sessao?.consultaId),
  })

  useEffect(() => {
    if (!codigo || !accessToken) {
      setLoading(false)
      return
    }
    setLoading(true)
    void refresh()
  }, [codigo, accessToken, refresh])

  return {
    sessao,
    attendanceSession,
    messages,
    documents,
    historicoNotes,
    patientAgeGender,
    loading,
    error,
    refresh,
    reloadMessages,
    setDocuments,
  }
}
