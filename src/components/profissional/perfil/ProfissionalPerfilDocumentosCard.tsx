import { Eye, FileText, FolderOpen, Info, Upload } from 'lucide-react'
import { useId } from 'react'
import { useProfissionalPerfilDocuments } from '../../../hooks/useProfissionalPerfilDocuments'
import type { ProfissionalPerfil } from '../../../types/profissionalPerfil'
import type { ProfissionalPerfilDocument } from '../../../types/profissionalPerfil'
import { ProfissionalPerfilDocumentUpdateModal } from './ProfissionalPerfilDocumentUpdateModal'
import { ProfissionalPerfilDocumentViewModal } from './ProfissionalPerfilDocumentViewModal'
import { ProfissionalPerfilCard, ProfissionalPerfilInfoBox } from './ProfissionalPerfilCard'
import {
  profissionalPerfilDocumentIconToneClass,
  profissionalPerfilDocumentStatusConfig,
} from './profissionalPerfilUi'

type ProfissionalPerfilDocumentosCardProps = {
  profile: ProfissionalPerfil
  className?: string
}

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso))
}

type DocumentActionButtonProps = {
  label: string
  isPending: boolean
  onClick: () => void
}

function DocumentActionButton({ label, isPending, onClick }: DocumentActionButtonProps) {
  const tooltipId = useId()
  const ActionIcon = isPending ? Upload : Eye

  return (
    <div className="group absolute right-1.5 top-1/2 z-[1] -translate-y-1/2">
      <button
        type="button"
        onClick={onClick}
        className={[
          'flex h-7 w-7 items-center justify-center rounded-md transition',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]',
          isPending
            ? 'bg-[var(--brand-primary)] text-white hover:brightness-110'
            : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900',
        ].join(' ')}
        aria-label={label}
        aria-describedby={tooltipId}
      >
        <ActionIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className={[
          'pointer-events-none absolute bottom-full right-0 z-30 mb-1',
          'whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg',
          'opacity-0 transition-opacity duration-150',
          'group-hover:opacity-100 group-focus-within:opacity-100',
        ].join(' ')}
      >
        {label}
      </div>
    </div>
  )
}

function isDocumentUpdateAction(document: ProfissionalPerfilDocument) {
  return document.status === 'pendente' || document.status === 'vencido'
}

export function ProfissionalPerfilDocumentosCard({
  profile,
  className,
}: ProfissionalPerfilDocumentosCardProps) {
  const {
    documents,
    viewDocument,
    updateDocument,
    previewUrl,
    openDocumentAction,
    openUpdateDocument,
    closeViewModal,
    closeUpdateModal,
    submitDocumentUpdate,
  } = useProfissionalPerfilDocuments({ initialDocuments: profile.documents })

  return (
    <>
      <ProfissionalPerfilCard
        icon={FolderOpen}
        title="Documentos profissionais"
        className={['min-w-0', className].filter(Boolean).join(' ')}
        headerClassName="!px-4 !pb-0 !pt-4"
        bodyClassName="flex flex-col gap-2 !px-4 !pb-3.5 !pt-2"
      >
        <ul className="space-y-1.5">
          {documents.map((document) => {
            const status = profissionalPerfilDocumentStatusConfig[document.status]
            const isUpdateAction = isDocumentUpdateAction(document)
            const actionLabel = isUpdateAction ? 'Atualizar' : 'Ver'

            return (
              <li
                key={document.id}
                className="relative rounded-lg border border-gray-100 bg-gray-50/50 py-2 pl-2 pr-9"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={[
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      profissionalPerfilDocumentIconToneClass[document.iconTone],
                    ].join(' ')}
                  >
                    <FileText className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[12px] font-semibold leading-snug text-gray-900 break-words">
                      {document.label}
                    </p>
                    <p className="text-[10px] leading-snug text-gray-500">
                      Enviado em {formatShortDate(document.uploadedAt)}
                    </p>
                    <span
                      className={[
                        'inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none',
                        status.className,
                      ].join(' ')}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>

                <DocumentActionButton
                  label={actionLabel}
                  isPending={isUpdateAction}
                  onClick={() => openDocumentAction(document)}
                />
              </li>
            )
          })}
        </ul>

        <ProfissionalPerfilInfoBox icon={Info} className="!py-2 text-[11px] leading-snug">
          Mantenha seus documentos sempre atualizados para evitar bloqueios no atendimento e na
          emissão de receitas digitais.
        </ProfissionalPerfilInfoBox>
      </ProfissionalPerfilCard>

      <ProfissionalPerfilDocumentViewModal
        open={viewDocument !== null}
        document={viewDocument}
        previewUrl={previewUrl}
        onClose={closeViewModal}
        onRequestUpdate={openUpdateDocument}
      />

      <ProfissionalPerfilDocumentUpdateModal
        open={updateDocument !== null}
        document={updateDocument}
        onClose={closeUpdateModal}
        onSubmit={submitDocumentUpdate}
      />
    </>
  )
}
