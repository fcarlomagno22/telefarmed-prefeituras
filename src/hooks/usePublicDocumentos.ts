import { useCallback, useEffect, useState } from 'react'
import type { ConsultationDocumentItem } from '../components/attendance/ConsultationDocumentsPanel'
import { useConsultationChatPolling } from './useConsultationChatPolling'
import {
  fetchPublicDocumentoDownloadUrl,
  fetchPublicDocumentos,
  mapPublicDocumentosToPanel,
} from '../lib/services/public/atendimento'

export function usePublicDocumentos(token: string | undefined) {
  const [documents, setDocuments] = useState<ConsultationDocumentItem[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!token) {
      setDocuments([])
      return
    }

    const raw = await fetchPublicDocumentos(token)
    setDocuments(mapPublicDocumentosToPanel(raw))
  }, [token])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setDocuments([])
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        await reload()
      } catch {
        if (!cancelled) setDocuments([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [token, reload])

  useConsultationChatPolling(reload, { enabled: Boolean(token), intervalMs: 8_000 })

  const downloadDocument = useCallback(
    async (document: ConsultationDocumentItem) => {
      if (!token) return
      if (document.downloadUrl && document.downloadUrl !== '#') {
        window.open(document.downloadUrl, '_blank', 'noopener,noreferrer')
        return
      }
      const url = await fetchPublicDocumentoDownloadUrl(token, document.id)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    },
    [token],
  )

  return { documents, loading, reload, downloadDocument }
}
