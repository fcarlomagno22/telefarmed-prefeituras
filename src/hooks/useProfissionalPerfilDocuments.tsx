import { useCallback, useEffect, useState } from 'react'
import type { ProfissionalPerfilDocument } from '../types/profissionalPerfil'
import { simulateProfissionalDocumentUpload } from '../utils/profissional/profissionalPerfilDocumentUpload'

type UseProfissionalPerfilDocumentsOptions = {
  initialDocuments: ProfissionalPerfilDocument[]
}

export function useProfissionalPerfilDocuments({
  initialDocuments,
}: UseProfissionalPerfilDocumentsOptions) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [viewDocument, setViewDocument] = useState<ProfissionalPerfilDocument | null>(null)
  const [updateDocument, setUpdateDocument] = useState<ProfissionalPerfilDocument | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    setDocuments(initialDocuments)
  }, [initialDocuments])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const openDocumentAction = useCallback((document: ProfissionalPerfilDocument) => {
    if (document.status === 'pendente' || document.status === 'vencido') {
      setUpdateDocument(document)
      return
    }
    setViewDocument(document)
  }, [])

  const closeViewModal = useCallback(() => {
    setViewDocument(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }, [previewUrl])

  const openUpdateDocument = useCallback(
    (item: ProfissionalPerfilDocument) => {
      setViewDocument(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      setUpdateDocument(item)
    },
    [previewUrl],
  )

  const closeUpdateModal = useCallback(() => {
    setUpdateDocument(null)
  }, [])

  const submitDocumentUpdate = useCallback(
    async (documentId: string, file: File, onProgress?: (progress: number) => void) => {
      await simulateProfissionalDocumentUpload(onProgress)

      setDocuments((current) =>
        current.map((item) =>
          item.id === documentId
            ? {
                ...item,
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                status: 'pendente',
              }
            : item,
        ),
      )

      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      })
      setUpdateDocument(null)
    },
    [],
  )

  return {
    documents,
    viewDocument,
    updateDocument,
    previewUrl,
    openDocumentAction,
    openUpdateDocument,
    closeViewModal,
    closeUpdateModal,
    submitDocumentUpdate,
  }
}
