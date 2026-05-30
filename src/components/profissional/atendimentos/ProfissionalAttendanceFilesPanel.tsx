import { Download, FileText, Image } from 'lucide-react'
import { doctorConsultationCardClass } from '../../attendance/doctor/doctorConsultationUi'
import type { ConsultationChatAttachment } from '../../attendance/consultationChatTypes'
import { formatConsultationAttachmentSize } from '../../attendance/consultationChatTypes'
import type { ProfissionalIssuedDocument } from '../../../types/profissionalAtendimentos'

export function ProfissionalAttendanceSentPanel({
  documents,
  className,
  dataTour,
}: {
  documents: ProfissionalIssuedDocument[]
  className?: string
  dataTour?: string
}) {
  return (
    <section
      data-tour={dataTour}
      className={[doctorConsultationCardClass, 'flex min-h-0 flex-col', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="shrink-0 border-b border-gray-100 px-4 py-3.5">
        <h2 className="text-sm font-bold text-gray-900">Enviados</h2>
      </div>
      <div className="min-h-0 flex-1">
        {documents.length === 0 ? (
          <div className="flex min-h-[6rem] items-center justify-center px-4 py-6">
            <p className="text-center text-xs text-gray-500">
              Nenhum arquivo enviado neste atendimento.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[var(--brand-primary)]">
                  <FileText className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{doc.fileName}</p>
                  {doc.meta ? <p className="text-xs text-gray-500">{doc.meta}</p> : null}
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-50 hover:text-[var(--brand-primary)]"
                  aria-label={`Baixar ${doc.fileName}`}
                >
                  <Download className="h-4 w-4" strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export function ProfissionalAttendanceReceivedPanel({
  files,
  onPreview,
  className,
  tourPreviewAttachmentId,
}: {
  files: ConsultationChatAttachment[]
  onPreview: (attachment: ConsultationChatAttachment) => void
  className?: string
  tourPreviewAttachmentId?: string
}) {
  return (
    <section
      data-tour="atendimentos-drawer-received"
      className={[doctorConsultationCardClass, 'flex min-h-0 flex-col', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="shrink-0 border-b border-gray-100 px-4 py-3.5">
        <h2 className="text-sm font-bold text-gray-900">Recebidos</h2>
      </div>
      <div className="min-h-0 flex-1">
        {files.length === 0 ? (
          <div className="flex min-h-[6rem] items-center justify-center px-4 py-6">
            <p className="text-center text-xs text-gray-500">
              Nenhum arquivo recebido neste atendimento.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {files.map((attachment) => (
              <li key={attachment.id}>
                <button
                  type="button"
                  onClick={() => onPreview(attachment)}
                  data-tour={
                    attachment.id === tourPreviewAttachmentId
                      ? 'atendimentos-attachment-preview-btn'
                      : undefined
                  }
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-orange-50/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    {attachment.type === 'image' ? (
                      <Image className="h-5 w-5" strokeWidth={2} />
                    ) : (
                      <FileText className="h-5 w-5" strokeWidth={2} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {attachment.name}
                    </span>
                    {attachment.size ? (
                      <span className="text-xs text-gray-500">
                        {formatConsultationAttachmentSize(attachment.size)}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
