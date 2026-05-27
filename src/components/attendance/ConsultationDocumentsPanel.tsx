import { useState } from 'react'
import { Download, FileText, Trash2 } from 'lucide-react'
import { ConsultationDocumentDeleteConfirmModal } from './ConsultationDocumentDeleteConfirmModal'

export type ConsultationDocumentItem = {
  id: string
  title: string
  meta: string
  downloadLabel: string
  iconClass: string
}

export const CONSULTATION_DOCUMENTS_DEFAULT: ConsultationDocumentItem[] = [
  {
    id: 'prescription',
    title: 'Receita Médica',
    meta: 'PDF • Gerado agora',
    downloadLabel: 'Baixar receita médica',
    iconClass: 'bg-red-50 text-red-500',
  },
  {
    id: 'exam-order',
    title: 'Pedido de Exames',
    meta: 'PDF • Gerado agora',
    downloadLabel: 'Baixar pedido de exames',
    iconClass: 'bg-sky-50 text-sky-600',
  },
]

type ConsultationDocumentsPanelProps = {
  cardClassName: string
  documents?: ConsultationDocumentItem[]
  className?: string
  onDeleteDocument?: (documentId: string) => void
}

export function ConsultationDocumentsPanel({
  cardClassName,
  documents = [],
  className,
  onDeleteDocument,
}: ConsultationDocumentsPanelProps) {
  const [documentPendingDelete, setDocumentPendingDelete] =
    useState<ConsultationDocumentItem | null>(null)

  function handleConfirmDelete() {
    if (!documentPendingDelete || !onDeleteDocument) return
    onDeleteDocument(documentPendingDelete.id)
    setDocumentPendingDelete(null)
  }

  return (
    <>
    <ConsultationDocumentDeleteConfirmModal
      open={documentPendingDelete !== null}
      documentItem={documentPendingDelete}
      onCancel={() => setDocumentPendingDelete(null)}
      onConfirm={handleConfirmDelete}
    />

    <section
      className={[cardClassName, 'flex h-full min-h-0 flex-col', className].filter(Boolean).join(' ')}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5">
        <h2 className="text-sm font-bold text-gray-900">Documentos da consulta</h2>
        {documents.length > 0 ? (
          <button
            type="button"
            className="text-xs font-semibold text-[var(--brand-primary)] transition hover:underline"
          >
            Ver todos
          </button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {documents.length > 0 ? (
          <ul className="min-h-0 flex-1 divide-y divide-gray-200 overflow-y-auto">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={[
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    doc.iconClass,
                  ].join(' ')}
                >
                  <FileText className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{doc.title}</p>
                  <p className="text-xs text-gray-500">{doc.meta}</p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-50 hover:text-[var(--brand-primary)]"
                    aria-label={doc.downloadLabel}
                  >
                    <Download className="h-4 w-4" strokeWidth={2} />
                  </button>
                  {onDeleteDocument ? (
                    <button
                      type="button"
                      onClick={() => setDocumentPendingDelete(doc)}
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Excluir ${doc.title}`}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-1 items-center justify-center px-4 py-4">
            <p className="text-center text-xs leading-relaxed text-gray-500">
              Nenhum documento gerado nesta consulta ainda.
            </p>
          </div>
        )}
      </div>
    </section>
    </>
  )
}
