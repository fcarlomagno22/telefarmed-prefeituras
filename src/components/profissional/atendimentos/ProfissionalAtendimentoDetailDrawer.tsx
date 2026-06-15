import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, Clock3, FileText, Image, MapPin, Stethoscope, TrendingUp, X } from 'lucide-react'
import { ConsultationChatAttachmentViewer } from '../../attendance/ConsultationChatAttachmentViewer'
import type { ConsultationChatAttachment } from '../../attendance/consultationChatTypes'
import { ClinicalTriageSummaryPanel } from '../../attendance/doctor/ClinicalTriageSummaryPanel'
import { DoctorConsultationChatPanel } from '../../attendance/doctor/DoctorConsultationChatPanel'
import { doctorConsultationCardClass } from '../../attendance/doctor/doctorConsultationUi'
import { buildDoctorRecordPatientProfile } from '../../attendance/doctor/doctorRecordPatient'
import { DoctorFullRecordModal } from '../../attendance/doctor/DoctorFullRecordModal'
import {
  DOCTOR_RECORD_SPECIALTY_LABELS,
  resolveDoctorRecordSpecialtyKey,
} from '../../../data/doctorConsultationMock'
import { brand } from '../../../config/brand'
import {
  PROFISSIONAL_ATENDIMENTOS_TOUR_PREVIEW_ATTACHMENT_ID,
} from '../../../config/profissionalAtendimentosTour'
import { useProfissionalAuth } from '../../../contexts/ProfissionalAuthContext'
import {
  fetchProfissionalAtendimentoDetail,
  mapHistoricoToRecordNotes,
  mapProfissionalMensagensToChat,
} from '../../../lib/services/profissional/atendimentos'
import { fetchProfissionalPacienteHistoricoEspecialidade } from '../../../lib/services/profissional/posConsultaHistorico'
import type { ProfissionalConsultaHistoricoCheckin } from '../../../types/posConsultaHistorico'
import { EvolucaoPosConsultaTimeline } from '../../evolucao/EvolucaoPosConsultaTimeline'
import type { DoctorRecordNote } from '../../attendance/doctor/doctorRecordTypes'
import type { ProfissionalAttendanceRecord } from '../../../types/profissionalAtendimentos'
import {
  ProfissionalAttendanceReceivedPanel,
  ProfissionalAttendanceSentPanel,
} from './ProfissionalAttendanceFilesPanel'
import { profissionalAtendimentosStatusConfig } from './profissionalAtendimentosUi'

type ProfissionalAtendimentoDetailDrawerProps = {
  record: ProfissionalAttendanceRecord | null
  open: boolean
  closing: boolean
  onClose: () => void
  onTransitionEnd: () => void
  tourLockClose?: boolean
}

export type ProfissionalAtendimentoDetailDrawerHandle = {
  openFullRecord: () => void
  closeFullRecord: () => void
  openReceivedPreview: (attachmentId?: string) => void
  closeAttachmentPreview: () => void
}

export const ProfissionalAtendimentoDetailDrawer = forwardRef<
  ProfissionalAtendimentoDetailDrawerHandle,
  ProfissionalAtendimentoDetailDrawerProps
>(function ProfissionalAtendimentoDetailDrawer(
  { record, open, closing, onClose, onTransitionEnd, tourLockClose = false },
  ref,
) {
  const { getAccessToken } = useProfissionalAuth()
  const [entered, setEntered] = useState(false)
  const [fullRecordOpen, setFullRecordOpen] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState<ConsultationChatAttachment | null>(
    null,
  )
  const [detailRecord, setDetailRecord] = useState<ProfissionalAttendanceRecord | null>(null)
  const [historicoProntuario, setHistoricoProntuario] = useState<
    Array<{
      id: string
      date: string
      doctorName: string
      note: string
      specialty: string
    }>
  >([])
  const [chatMessages, setChatMessages] = useState<ReturnType<typeof mapProfissionalMensagensToChat>>(
    [],
  )
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [posConsultaCheckins, setPosConsultaCheckins] = useState<
    ProfissionalConsultaHistoricoCheckin[]
  >([])
  const [posConsultaLoading, setPosConsultaLoading] = useState(false)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing
  const displayRecord = detailRecord ?? record

  useEffect(() => {
    let frameId: number | null = null
    if (!open) {
      frameId = requestAnimationFrame(() => {
        setEntered(false)
        setFullRecordOpen(false)
        setPreviewAttachment(null)
        setDetailRecord(null)
        setHistoricoProntuario([])
        setChatMessages([])
        setPosConsultaCheckins([])
        setDetailError(null)
        setDetailLoading(false)
        setPosConsultaLoading(false)
      })
      return () => {
        if (frameId !== null) cancelAnimationFrame(frameId)
      }
    }
    frameId = requestAnimationFrame(() => setEntered(true))
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
    }
  }, [open])

  useEffect(() => {
    if (!open || !record) return

    let cancelled = false
    const token = getAccessToken()
    if (!token) {
      setDetailError('Sessão expirada. Faça login novamente.')
      return
    }

    setDetailLoading(true)
    setDetailError(null)
    setDetailRecord(null)
    setHistoricoProntuario([])
    setChatMessages([])

    fetchProfissionalAtendimentoDetail(token, record.id)
      .then((detail) => {
        if (cancelled) return
        setDetailRecord(detail.record)
        setHistoricoProntuario(detail.historicoProntuario ?? [])
        setChatMessages(mapProfissionalMensagensToChat(detail.mensagens))
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setDetailError(
          error instanceof Error ? error.message : 'Não foi possível carregar os detalhes.',
        )
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, record, getAccessToken])

  useEffect(() => {
    if (!open || !record) return

    let cancelled = false
    const token = getAccessToken()
    if (!token) return

    setPosConsultaLoading(true)
    setPosConsultaCheckins([])

    void fetchProfissionalPacienteHistoricoEspecialidade(token, {
      patientName: record.patientName,
      specialty: record.specialty,
    })
      .then((response) => {
        if (cancelled) return
        const match =
          response.consultas.find((item) => item.attendanceId === record.attendanceId) ??
          response.consultas.find((item) => item.consultaId === record.id) ??
          null
        setPosConsultaCheckins(match?.posConsultaCheckins ?? [])
      })
      .catch(() => {
        if (!cancelled) setPosConsultaCheckins([])
      })
      .finally(() => {
        if (!cancelled) setPosConsultaLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, record, getAccessToken])

  useEffect(() => {
    if (!isActive) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !previewAttachment && !fullRecordOpen && !tourLockClose) {
        onClose()
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose, previewAttachment, fullRecordOpen, tourLockClose])

  useImperativeHandle(
    ref,
    () => ({
      openFullRecord: () => setFullRecordOpen(true),
      closeFullRecord: () => setFullRecordOpen(false),
      openReceivedPreview: (attachmentId?: string) => {
        const source = displayRecord
        if (!source) return
        const attachment =
          source.patientUploads.find((file) => file.id === attachmentId) ??
          source.patientUploads.find(
            (file) => file.id === PROFISSIONAL_ATENDIMENTOS_TOUR_PREVIEW_ATTACHMENT_ID,
          ) ??
          source.patientUploads[0]
        if (attachment) setPreviewAttachment(attachment)
      },
      closeAttachmentPreview: () => setPreviewAttachment(null),
    }),
    [displayRecord],
  )

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  const patientProfile = useMemo(() => {
    if (!displayRecord) return null
    return buildDoctorRecordPatientProfile({
      patientName: displayRecord.patientName,
      patientPhotoUrl: displayRecord.patientPhotoUrl,
      patientBirthDateIso: displayRecord.birthDateIso,
      patientCity: 'Telemedicina',
    })
  }, [displayRecord])

  const allRecordNotes = useMemo((): DoctorRecordNote[] => {
    if (!displayRecord) return []

    const history = mapHistoricoToRecordNotes(historicoProntuario)
    const merged = [...history, ...displayRecord.recordNotes]
    const seen = new Set<string>()

    return merged.filter((note) => {
      if (seen.has(note.id)) return false
      seen.add(note.id)
      return true
    })
  }, [displayRecord, historicoProntuario])

  if (!isActive || !displayRecord || !patientProfile) return null

  const specialtyKey = resolveDoctorRecordSpecialtyKey(displayRecord.specialty)
  const specialtyLabel = DOCTOR_RECORD_SPECIALTY_LABELS[specialtyKey]
  const statusConfig = profissionalAtendimentosStatusConfig[displayRecord.status]

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[9996] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <button
          type="button"
          tabIndex={panelVisible ? 0 : -1}
          className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-label="Fechar detalhes do atendimento"
          onClick={(event) => {
            if (tourLockClose) {
              event.preventDefault()
              event.stopPropagation()
              return
            }
            onClose()
          }}
        />

        <aside
          data-tour="atendimentos-detail-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prof-atendimento-drawer-title"
          onTransitionEnd={(event) => {
            if (event.target !== event.currentTarget) return
            if (event.propertyName === 'transform') onTransitionEnd()
          }}
          className={`absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col overflow-hidden border-l border-gray-200 bg-white shadow-[-16px_0_48px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
            panelVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <header
            data-tour="atendimentos-drawer-header"
            className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/35 to-white px-5 py-4 sm:px-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <img
                  src={displayRecord.patientPhotoUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white object-cover shadow-md"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500">{displayRecord.attendanceId}</p>
                  <h2
                    id="prof-atendimento-drawer-title"
                    className="mt-0.5 text-lg font-bold text-gray-900 sm:text-xl"
                  >
                    {displayRecord.patientName}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    {displayRecord.dateTimeLabel} · {displayRecord.specialty}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  if (tourLockClose) {
                    event.preventDefault()
                    return
                  }
                  onClose()
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" strokeWidth={2} />
                <dd>
                  <span className="font-medium text-gray-500">Idade:</span> {displayRecord.age} anos
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                <dd>{patientProfile.birthDateLabel}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                <dd>{displayRecord.durationMinutes} min</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dd>
                  <span
                    className={[
                      'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                      displayRecord.status === 'concluido'
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-amber-50 text-amber-800',
                    ].join(' ')}
                  >
                    {statusConfig.label}
                  </span>
                </dd>
              </div>
            </dl>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-[#f5f6f8] px-5 py-4 sm:px-6">
            {detailError ? (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                <p>{detailError}</p>
              </div>
            ) : null}

            <div className="flex flex-col gap-4">
              {displayRecord.triageSummary?.trim() ? (
                <section className={[doctorConsultationCardClass, 'p-4'].join(' ')}>
                  <div className="mb-3 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
                    <h3 className="text-sm font-bold text-gray-900">Triagem clínica</h3>
                  </div>
                  <ClinicalTriageSummaryPanel triageSummary={displayRecord.triageSummary} compact />
                </section>
              ) : null}

              <section
                data-tour="atendimentos-drawer-chat"
                className={[doctorConsultationCardClass, 'flex max-h-[28rem] min-h-[16rem] flex-col'].join(
                  ' ',
                )}
              >
                <DoctorConsultationChatPanel
                  messages={chatMessages}
                  loading={detailLoading}
                  readOnly
                  cardClassName="flex min-h-0 flex-1 flex-col border-0 bg-transparent shadow-none"
                />
              </section>

              <section
                data-tour="atendimentos-drawer-notes"
                className={[doctorConsultationCardClass, 'flex flex-col'].join(' ')}
              >
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Anotações do prontuário</h3>
                    <p className="text-[10px] text-gray-500">{specialtyLabel}</p>
                  </div>
                  <button
                    type="button"
                    data-tour="atendimentos-full-record-btn"
                    onClick={() => setFullRecordOpen(true)}
                    className="shrink-0 text-xs font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
                  >
                    Ver histórico completo
                  </button>
                </div>

                <div className="p-4">
                  {displayRecord.recordNotes.length > 0 ? (
                    <ul className="space-y-3">
                      {displayRecord.recordNotes.map((note) => (
                        <li
                          key={note.id}
                          className="rounded-xl border border-gray-100 bg-gray-50/60 p-4"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-xs font-semibold text-gray-900">{note.doctorName}</p>
                            <p className="text-[11px] tabular-nums text-gray-500">{note.date}</p>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-gray-700">{note.note}</p>
                          {note.chatAttachments?.length ? (
                            <div className="mt-3 flex flex-wrap justify-end gap-2">
                              {note.chatAttachments.map((attachment) => (
                                <AttachmentChip
                                  key={attachment.id}
                                  attachment={attachment}
                                  onPreview={setPreviewAttachment}
                                />
                              ))}
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-xs text-gray-500">
                      Nenhuma anotação registrada neste atendimento.
                    </p>
                  )}
                </div>
              </section>

              <ProfissionalAttendanceSentPanel
                documents={displayRecord.issuedDocuments}
                dataTour="atendimentos-drawer-sent"
              />

              <section className={[doctorConsultationCardClass, 'p-4'].join(' ')}>
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
                  <h3 className="text-sm font-bold text-gray-900">Evolução pós-consulta</h3>
                </div>
                {posConsultaLoading ? (
                  <p className="text-sm text-gray-500">Carregando evolução…</p>
                ) : (
                  <EvolucaoPosConsultaTimeline checkins={posConsultaCheckins} />
                )}
              </section>

              <ProfissionalAttendanceReceivedPanel
                files={displayRecord.patientUploads}
                onPreview={setPreviewAttachment}
                tourPreviewAttachmentId={PROFISSIONAL_ATENDIMENTOS_TOUR_PREVIEW_ATTACHMENT_ID}
              />
            </div>
          </div>

          <footer className="shrink-0 border-t border-gray-200 bg-[#f5f6f8] px-5 py-5 sm:px-6">
            <div className="flex justify-center">
              <img
                src={brand.logoUrl}
                alt={brand.appName}
                className="h-9 w-auto max-w-[200px] object-contain opacity-90"
              />
            </div>
          </footer>
        </aside>
      </div>

      <DoctorFullRecordModal
        open={fullRecordOpen}
        onClose={() => setFullRecordOpen(false)}
        doctorSpecialty={displayRecord.specialty}
        patient={patientProfile}
        notes={allRecordNotes}
        tourTargetId="atendimentos-full-record-modal"
      />

      {previewAttachment ? (
        <ConsultationChatAttachmentViewer
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          tourTargetId="atendimentos-attachment-viewer"
        />
      ) : null}
    </>,
    document.body,
  )
})

function AttachmentChip({
  attachment,
  onPreview,
}: {
  attachment: ConsultationChatAttachment
  onPreview: (attachment: ConsultationChatAttachment) => void
}) {
  const isImage = attachment.type === 'image'
  return (
    <button
      type="button"
      onClick={() => onPreview(attachment)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-[var(--brand-primary)]/40 hover:bg-orange-50/60 hover:text-[var(--brand-primary)]"
    >
      {isImage ? (
        <Image className="h-3.5 w-3.5" strokeWidth={2} />
      ) : (
        <FileText className="h-3.5 w-3.5" strokeWidth={2} />
      )}
      {isImage ? 'Foto' : 'PDF'}
    </button>
  )
}
