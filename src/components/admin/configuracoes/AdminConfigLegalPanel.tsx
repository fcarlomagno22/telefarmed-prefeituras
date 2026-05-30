import { Eye, Plus, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminAuthApiError, verifyAdminAuthorizationPin } from '../../../lib/api/adminAuthApi'
import type { ConfigLegalDocument, LegalDocumentPortal } from '../../../types/adminConfiguracoes'
import { isPresetLegalDocumentId } from '../../../types/adminConfiguracoes'
import {
  configInputClass,
  configStatusBadgeClass,
} from './adminConfiguracoesUi'
import { createCustomLegalDocumentId, presetLegalDocumentLabels } from './adminConfigLegalUi'
import {
  AdminConfigLegalPinModal,
  type AdminConfigLegalPinAction,
} from './AdminConfigLegalPinModal'

type PendingLegalPinAction = {
  type: AdminConfigLegalPinAction
  documentId: string
  documentTitle: string
}

const portalOptions: { value: LegalDocumentPortal; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'prefeitura', label: 'Prefeitura' },
  { value: 'ubt', label: 'UBT' },
  { value: 'terminal', label: 'Terminal' },
]

const defaultPortals: LegalDocumentPortal[] = ['admin', 'prefeitura', 'ubt', 'terminal']

type AdminConfigLegalPanelProps = {
  documents: ConfigLegalDocument[]
  onChange: (documents: ConfigLegalDocument[]) => void
  onCreateDocument?: (value: ConfigLegalDocument) => Promise<void>
  onSaveDocument?: (value: ConfigLegalDocument) => Promise<void>
  onPublishDocument?: (id: string) => Promise<void>
  onDeleteDocument?: (id: string) => Promise<void>
  getAccessToken?: () => string | null
  onNotify?: (message: string, variant?: 'success' | 'error') => void
}

function documentSidebarLabel(doc: ConfigLegalDocument) {
  if (doc.title.trim()) return doc.title.trim()
  if (isPresetLegalDocumentId(doc.id)) return presetLegalDocumentLabels[doc.id]
  return 'Documento sem título'
}

function documentTypeHint(doc: ConfigLegalDocument) {
  if (isPresetLegalDocumentId(doc.id)) return presetLegalDocumentLabels[doc.id]
  return 'Documento personalizado'
}

export function AdminConfigLegalPanel({
  documents,
  onChange,
  onCreateDocument,
  onSaveDocument,
  onPublishDocument,
  onDeleteDocument,
  getAccessToken,
  onNotify,
}: AdminConfigLegalPanelProps) {
  const [selectedId, setSelectedId] = useState(documents[0]?.id ?? '')
  const [pendingPin, setPendingPin] = useState<PendingLegalPinAction | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [unsavedIds, setUnsavedIds] = useState<Set<string>>(() => new Set())

  const selected = useMemo(
    () => documents.find((doc) => doc.id === selectedId) ?? documents[0],
    [documents, selectedId],
  )

  useEffect(() => {
    if (documents.length === 0) {
      setSelectedId('')
      return
    }
    if (!documents.some((doc) => doc.id === selectedId)) {
      setSelectedId(documents[0]!.id)
    }
  }, [documents, selectedId])

  const patchDocument = useCallback(
    (documentId: string, patch: Partial<ConfigLegalDocument>) => {
      onChange(
        documents.map((doc) => (doc.id === documentId ? { ...doc, ...patch } : doc)),
      )
    },
    [documents, onChange],
  )

  const verifyAdminPin = useCallback(
    async (pin: string) => {
      const token = getAccessToken?.()
      if (!token) {
        onNotify?.('Sessão expirada. Faça login novamente.', 'error')
        setPendingPin(null)
        return false
      }

      try {
        await verifyAdminAuthorizationPin(token, pin)
        return true
      } catch (error) {
        if (error instanceof AdminAuthApiError && error.code === 'PIN_NOT_CONFIGURED') {
          onNotify?.(error.message, 'error')
          setPendingPin(null)
        }
        return false
      }
    },
    [getAccessToken, onNotify],
  )

  const removeUnsavedDocument = useCallback(
    (documentId: string) => {
      setUnsavedIds((current) => {
        if (!current.has(documentId)) return current
        const next = new Set(current)
        next.delete(documentId)
        return next
      })
      const nextDocuments = documents.filter((doc) => doc.id !== documentId)
      onChange(nextDocuments)
      if (selectedId === documentId) {
        setSelectedId(nextDocuments[0]?.id ?? '')
      }
    },
    [documents, onChange, selectedId],
  )

  const handlePinConfirmed = useCallback(async () => {
    if (!pendingPin) return

    const { type, documentId } = pendingPin
    setPendingPin(null)

    try {
      if (type === 'publish') {
        if (unsavedIds.has(documentId)) {
          onNotify?.('Salve o documento antes de publicá-lo.', 'error')
          return
        }
        await onPublishDocument?.(documentId)
        onNotify?.('Documento publicado e visível nos portais selecionados.', 'success')
        return
      }

      if (unsavedIds.has(documentId)) {
        removeUnsavedDocument(documentId)
        onNotify?.('Rascunho descartado.', 'success')
        return
      }

      await onDeleteDocument?.(documentId)
      onNotify?.('Documento excluído.', 'success')
    } catch {
      // Erros tratados na página
    }
  }, [
    onDeleteDocument,
    onNotify,
    onPublishDocument,
    pendingPin,
    removeUnsavedDocument,
    unsavedIds,
  ])

  function requestPinAction(type: AdminConfigLegalPinAction, doc: ConfigLegalDocument) {
    setPendingPin({
      type,
      documentId: doc.id,
      documentTitle: documentSidebarLabel(doc),
    })
  }

  function addDocument() {
    const next: ConfigLegalDocument = {
      id: createCustomLegalDocumentId(),
      title: 'Novo documento',
      content: '',
      version: '1.0',
      updatedAtLabel: 'Mai/2026',
      published: false,
      portals: [...defaultPortals],
    }

    onChange([...documents, next])
    setUnsavedIds((current) => new Set(current).add(next.id))
    setSelectedId(next.id)
    onNotify?.('Rascunho criado. Preencha os campos e clique em Salvar alterações.', 'success')
  }

  async function handleSaveDocument() {
    const isNew = unsavedIds.has(selected.id)
    const persist = isNew ? onCreateDocument : onSaveDocument
    if (!persist) return

    setIsSaving(true)
    try {
      await persist(selected)
      if (isNew) {
        setUnsavedIds((current) => {
          const next = new Set(current)
          next.delete(selected.id)
          return next
        })
      }
      onNotify?.('Documento salvo.', 'success')
    } catch {
      // Erros tratados na página
    } finally {
      setIsSaving(false)
    }
  }

  if (!selected) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-gray-500">Nenhum documento legal cadastrado.</p>
        <button
          type="button"
          onClick={addDocument}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Novo documento
        </button>
      </div>
    )
  }

  function patchSelected(patch: Partial<ConfigLegalDocument>) {
    patchDocument(selected.id, patch)
  }

  function togglePortal(portal: LegalDocumentPortal) {
    const has = selected.portals.includes(portal)
    patchSelected({
      portals: has
        ? selected.portals.filter((p) => p !== portal)
        : [...selected.portals, portal],
    })
  }

  return (
    <>
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <aside className="shrink-0 border-b border-gray-200 bg-gray-50/80 p-4 lg:flex lg:min-h-0 lg:w-72 lg:flex-col lg:border-b-0 lg:border-r xl:w-80">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Documentos
          </p>
          <button
            type="button"
            onClick={addDocument}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 transition hover:border-[var(--brand-primary)]/30 hover:text-[var(--brand-primary)]"
            title="Adicionar documento"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Novo
          </button>
        </div>
        <ul className="max-h-[min(24rem,50vh)] overflow-y-auto overscroll-y-contain lg:min-h-0 lg:flex-1 lg:max-h-none">
          {documents.map((doc, index) => (
            <li key={doc.id}>
              {index > 0 ? (
                <div className="mx-3 border-t border-gray-200" aria-hidden />
              ) : null}
              <button
                type="button"
                onClick={() => setSelectedId(doc.id)}
                className={[
                  'w-full px-3 py-3 text-left text-sm font-medium transition',
                  selectedId === doc.id
                    ? 'bg-[var(--brand-primary-light)]/60 text-[var(--brand-primary)]'
                    : 'text-gray-700 hover:bg-gray-100/90',
                ].join(' ')}
              >
                <span className="block truncate">{documentSidebarLabel(doc)}</span>
                {doc.published ? (
                  <span className="mt-0.5 block text-[10px] font-normal text-emerald-600">
                    Publicado
                  </span>
                ) : unsavedIds.has(doc.id) ? (
                  <span className="mt-0.5 block text-[10px] font-normal text-amber-600">
                    Não salvo
                  </span>
                ) : (
                  <span className="mt-0.5 block text-[10px] font-normal text-gray-400">
                    Rascunho
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-gray-900">{selected.title || 'Sem título'}</h2>
            <p className="mt-1 text-sm text-gray-500">{documentTypeHint(selected)}</p>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            {!selected.published ? (
              <div className="flex items-center gap-2">
                <span className={configStatusBadgeClass(false)}>
                  {unsavedIds.has(selected.id) ? 'Não salvo' : 'Rascunho'}
                </span>
                {!unsavedIds.has(selected.id) ? (
                  <button
                    type="button"
                    onClick={() => requestPinAction('publish', selected)}
                    className="btn-brand-gradient inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold"
                  >
                    <Eye className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Publicar
                  </button>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (unsavedIds.has(selected.id)) {
                  removeUnsavedDocument(selected.id)
                  onNotify?.('Rascunho descartado.', 'success')
                  return
                }
                requestPinAction('delete', selected)
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
              aria-label={`Excluir ${documentSidebarLabel(selected)}`}
              title="Excluir documento"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        <article className="flex min-h-0 flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-4">
        <div className="shrink-0 grid gap-3.5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-gray-600">Título exibido</span>
            <input
              value={selected.title}
              onChange={(e) => patchSelected({ title: e.target.value })}
              className={configInputClass}
              placeholder="Ex.: Regulamento do programa municipal"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-600">Versão</span>
            <input
              value={selected.version}
              onChange={(e) => patchSelected({ version: e.target.value })}
              className={configInputClass}
              placeholder="1.0"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-600">
              Última atualização (rótulo)
            </span>
            <input
              value={selected.updatedAtLabel}
              onChange={(e) => patchSelected({ updatedAtLabel: e.target.value })}
              className={configInputClass}
              placeholder="Mai/2026"
            />
          </label>
        </div>

        <div className="mt-3.5 shrink-0">
          <p className="mb-2 text-xs font-semibold text-gray-600">Exibir nos portais</p>
          <div className="flex flex-wrap gap-2">
            {portalOptions.map((portal) => {
              const checked = selected.portals.includes(portal.value)
              return (
                <button
                  key={portal.value}
                  type="button"
                  onClick={() => togglePortal(portal.value)}
                  className={[
                    'rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                    checked
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                  ].join(' ')}
                >
                  {portal.label}
                </button>
              )
            })}
          </div>
        </div>

        <label className="mt-5 flex min-h-0 flex-1 flex-col">
          <span className="mb-1.5 block shrink-0 text-xs font-semibold text-gray-600">
            Conteúdo do documento
          </span>
          <textarea
            value={selected.content}
            onChange={(e) => patchSelected({ content: e.target.value })}
            className={`${configInputClass} min-h-0 flex-1 resize-none font-mono text-[13px] leading-relaxed`}
            placeholder="Texto do documento (suporta parágrafos; use ## para títulos no FAQ)"
          />
        </label>

        {onCreateDocument || onSaveDocument ? (
          <div className="mt-3.5 flex shrink-0 justify-end border-t border-gray-100 pt-3.5">
            <button
              type="button"
              onClick={() => void handleSaveDocument()}
              disabled={isSaving}
              className="btn-brand-gradient inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" strokeWidth={2.5} />
              {isSaving ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        ) : null}
        </article>
      </div>
    </div>

    <AdminConfigLegalPinModal
      open={pendingPin !== null}
      action={pendingPin?.type ?? null}
      documentTitle={pendingPin?.documentTitle ?? selected.title}
      onClose={() => setPendingPin(null)}
      onSuccess={() => void handlePinConfirmed()}
      verifyPin={verifyAdminPin}
    />
    </>
  )
}
