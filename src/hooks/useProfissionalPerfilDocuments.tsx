import { useCallback, useEffect, useState } from 'react'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import type { ProfissionalPerfilDocument } from '../types/profissionalPerfil'
import {
  fetchProfissionalDocumentoPreview,
  isProfissionalPerfilApiError,
  replaceProfissionalDocumento,
} from '../lib/services/profissional/perfil'

type UseProfissionalPerfilDocumentsOptions = {
  initialDocuments: ProfissionalPerfilDocument[]
  onDocumentsChange?: (documents: ProfissionalPerfilDocument[]) => void
}

export function useProfissionalPerfilDocuments({
  initialDocuments,
  onDocumentsChange,
}: UseProfissionalPerfilDocumentsOptions) {
  const { getAccessToken } = useProfissionalAuth()
  const [documents, setDocuments] = useState(initialDocuments)
  const [viewDocument, setViewDocument] = useState<ProfissionalPerfilDocument | null>(null)
  const [updateDocument, setUpdateDocument] = useState<ProfissionalPerfilDocument | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    setDocuments(initialDocuments)
  }, [initialDocuments])

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const updateDocuments = useCallback(
    (next: ProfissionalPerfilDocument[]) => {
      setDocuments(next)
      onDocumentsChange?.(next)
    },
    [onDocumentsChange],
  )

  const openDocumentAction = useCallback(
    async (document: ProfissionalPerfilDocument) => {
      if (document.status === 'pendente' || document.status === 'vencido') {
        setUpdateDocument(document)
        return
      }

      setViewDocument(document)
      setPreviewLoading(true)
      const token = getAccessToken()
      if (!token) {
        setPreviewLoading(false)
        return
      }

      try {
        const preview = await fetchProfissionalDocumentoPreview(token, document.id)
        setPreviewUrl(preview.previewUrl)
      } catch {
        setPreviewUrl(null)
      } finally {
        setPreviewLoading(false)
      }
    },
    [getAccessToken],
  )

  const closeViewModal = useCallback(() => {
    setViewDocument(null)
    setPreviewUrl(null)
  }, [])

  const openUpdateDocument = useCallback((item: ProfissionalPerfilDocument) => {
    setViewDocument(null)
    setPreviewUrl(null)
    setUpdateDocument(item)
  }, [])

  const closeUpdateModal = useCallback(() => {
    setUpdateDocument(null)
  }, [])

  const submitDocumentUpdate = useCallback(
    async (documentId: string, file: File, onProgress?: (progress: number) => void) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      const result = await replaceProfissionalDocumento(token, documentId, file, onProgress)
      const next = documents.map((item) => (item.id === documentId ? result.documento : item))
      updateDocuments(next)

      if (file.type.startsWith('image/')) {
        setPreviewUrl((current) => {
          if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
          return URL.createObjectURL(file)
        })
      } else {
        setPreviewUrl(null)
      }

      setUpdateDocument(null)
    },
    [documents, getAccessToken, updateDocuments],
  )

  return {
    documents,
    viewDocument,
    updateDocument,
    previewUrl,
    previewLoading,
    openDocumentAction,
    openUpdateDocument,
    closeViewModal,
    closeUpdateModal,
    submitDocumentUpdate,
  }
}
