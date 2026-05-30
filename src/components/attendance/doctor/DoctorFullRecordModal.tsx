import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Image, MapPin, Paperclip, X } from 'lucide-react'
import {
  DOCTOR_RECORD_SPECIALTY_LABELS,
  resolveDoctorRecordSpecialtyKey,
} from '../../../data/doctorConsultationMock'
import { ConsultationChatAttachmentViewer } from '../ConsultationChatAttachmentViewer'
import type { ConsultationChatAttachment } from '../consultationChatTypes'
import { formatConsultationAttachmentSize } from '../consultationChatTypes'
import type { DoctorRecordPatientProfile } from './doctorRecordPatient'
import type { DoctorRecordNote } from './doctorRecordTypes'

type DoctorFullRecordModalProps = {
  open: boolean
  onClose: () => void
  doctorSpecialty: string
  patient: DoctorRecordPatientProfile
  notes: DoctorRecordNote[]
  tourTargetId?: string
}

export function DoctorFullRecordModal({
  open,
  onClose,
  doctorSpecialty,
  patient,
  notes,
  tourTargetId,
}: DoctorFullRecordModalProps) {
  const [previewAttachment, setPreviewAttachment] = useState<ConsultationChatAttachment | null>(
    null,
  )

  const specialtyKey = resolveDoctorRecordSpecialtyKey(doctorSpecialty)
  const specialtyLabel = DOCTOR_RECORD_SPECIALTY_LABELS[specialtyKey]

  useEffect(() => {
    if (!open) {
      setPreviewAttachment(null)
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !previewAttachment) onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, previewAttachment])

  if (!open) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[500] flex items-center justify-center bg-gray-950/55 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="doctor-full-record-title"
        onClick={onClose}
      >
        <div
          data-tour={tourTargetId}
          className="flex h-[90vh] w-[90vw] flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-gray-50/90 to-white px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <img
                  src={patient.photoUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white object-cover shadow-md sm:h-[4.5rem] sm:w-[4.5rem]"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Paciente
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold leading-tight text-gray-900 sm:text-xl">
                    <span>{patient.firstName}</span>
                    {patient.lastName ? (
                      <span className="font-semibold text-gray-800"> {patient.lastName}</span>
                    ) : null}
                  </h2>
                  <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 sm:text-sm">
                    <div>
                      <dt className="sr-only">Data de nascimento</dt>
                      <dd>
                        <span className="font-medium text-gray-500">Nascimento:</span>{' '}
                        {patient.birthDateLabel}
                      </dd>
                    </div>
                    <div>
                      <dt className="sr-only">Idade</dt>
                      <dd>
                        <span className="font-medium text-gray-500">Idade:</span>{' '}
                        {patient.ageLabel}
                      </dd>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                      <dt className="sr-only">Cidade</dt>
                      <dd>{patient.city}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-800"
                aria-label="Fechar prontuário"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-gray-100 pt-3">
              <div>
                <h3 id="doctor-full-record-title" className="text-sm font-bold text-gray-900">
                  Prontuário completo
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {specialtyLabel} · {notes.length}{' '}
                  {notes.length === 1 ? 'anotação' : 'anotações'}
                </p>
              </div>
            </div>
          </div>

          {notes.length > 0 ? (
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
                  <tr className="border-b border-gray-100">
                    <th className="w-[7.5rem] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Data
                    </th>
                    <th className="w-[12rem] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Profissional da Saúde
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Anotação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-gray-50 align-top transition hover:bg-orange-50/30"
                    >
                      <td className="px-5 py-3.5 text-sm font-medium tabular-nums text-gray-600">
                        {entry.date}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">
                        {entry.doctorName}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex min-h-[3.25rem] flex-col justify-between gap-3">
                          <p className="text-sm leading-relaxed text-gray-700">{entry.note}</p>
                          <NoteAttachmentsRow
                            attachments={entry.chatAttachments}
                            onPreview={setPreviewAttachment}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-20 text-center">
              <Paperclip className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="text-base font-medium text-gray-700">
                Nenhuma anotação em {specialtyLabel}
              </p>
              <p className="max-w-md text-sm text-gray-500">
                As anotações desta especialidade aparecerão aqui após serem registradas nas
                consultas.
              </p>
            </div>
          )}
        </div>
      </div>

      {previewAttachment ? (
        <ConsultationChatAttachmentViewer
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      ) : null}
    </>,
    document.body,
  )
}

function NoteAttachmentsRow({
  attachments,
  onPreview,
}: {
  attachments?: ConsultationChatAttachment[]
  onPreview: (attachment: ConsultationChatAttachment) => void
}) {
  if (!attachments?.length) return null

  return (
    <div className="flex justify-end">
      <div className="flex flex-row flex-wrap items-center justify-end gap-2">
        {attachments.map((attachment) => {
          const isImage = attachment.type === 'image'
          const label = isImage ? 'Foto' : 'PDF'

          return (
            <button
              key={attachment.id}
              type="button"
              onClick={() => onPreview(attachment)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-[var(--brand-primary)]/40 hover:bg-orange-50/60 hover:text-[var(--brand-primary)]"
              title={`${attachment.name}${attachment.size ? ` · ${formatConsultationAttachmentSize(attachment.size)}` : ''}`}
              aria-label={`Ver ${label.toLowerCase()}: ${attachment.name}`}
            >
              {isImage ? (
                <Image className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              )}
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
