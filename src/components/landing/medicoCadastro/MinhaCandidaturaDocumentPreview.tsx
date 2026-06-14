import { Expand, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConsultationChatAttachmentViewer } from '../../attendance/ConsultationChatAttachmentViewer'
import type { MinhaCandidaturaDocumento } from '../../../types/minhaCandidatura'

type MinhaCandidaturaDocumentPreviewProps = {
  document: Pick<MinhaCandidaturaDocumento, 'id' | 'fileName' | 'previewType' | 'previewUrl'>
  replacementFile?: File
}

function inferPreviewTypeFromFile(file: File): 'image' | 'pdf' {
  if (file.type.startsWith('image/')) return 'image'
  return 'pdf'
}

export function MinhaCandidaturaDocumentPreview({
  document,
  replacementFile,
}: MinhaCandidaturaDocumentPreviewProps) {
  const [loadFailed, setLoadFailed] = useState(false)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!replacementFile) {
      setLocalPreviewUrl(null)
      setLoadFailed(false)
      return
    }

    const url = URL.createObjectURL(replacementFile)
    setLocalPreviewUrl(url)
    setLoadFailed(false)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [replacementFile])

  const previewUrl = localPreviewUrl ?? document.previewUrl
  const fileName = replacementFile?.name ?? document.fileName
  const previewType = replacementFile
    ? inferPreviewTypeFromFile(replacementFile)
    : document.previewType

  if (!previewUrl) {
    return (
      <div className="flex min-h-[10rem] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
        <FileText className="h-8 w-8 text-gray-400" aria-hidden />
        <p className="mt-2 text-xs text-gray-500">Arquivo indisponível para visualização.</p>
      </div>
    )
  }

  if (loadFailed) {
    return (
      <div className="flex min-h-[10rem] flex-col items-center justify-center rounded-lg border border-dashed border-red-200 bg-red-50 px-4 py-6 text-center">
        <FileText className="h-8 w-8 text-red-400" aria-hidden />
        <p className="mt-2 text-xs text-red-700">Não foi possível carregar o arquivo.</p>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setFullscreenOpen(true)}
        className="group relative block w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-left transition hover:border-[var(--brand-primary)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/30"
        aria-label={`Ver ${fileName} em tela cheia`}
      >
        {previewType === 'image' ? (
          <img
            src={previewUrl}
            alt={fileName}
            onError={() => setLoadFailed(true)}
            className="max-h-56 w-full object-contain"
          />
        ) : (
          <iframe
            src={`${previewUrl}#toolbar=0&navpanes=0`}
            title={fileName}
            className="pointer-events-none h-56 w-full bg-white"
          />
        )}

        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-900/0 transition group-hover:bg-gray-900/25">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-900 opacity-0 shadow-sm transition group-hover:opacity-100">
            <Expand className="h-3.5 w-3.5" aria-hidden />
            Ver em tela cheia
          </span>
        </span>
      </button>

      {fullscreenOpen ? (
        <ConsultationChatAttachmentViewer
          attachment={{
            id: document.id,
            type: previewType,
            url: previewUrl,
            name: fileName,
          }}
          onClose={() => setFullscreenOpen(false)}
        />
      ) : null}
    </>
  )
}
