import { useCallback, useEffect, useState } from 'react'

type UseProfissionalPerfilAvatarOptions = {
  onSaveFoto?: (previewDataUrl: string) => Promise<string>
}

export function useProfissionalPerfilAvatar(
  initialAvatarUrl: string,
  options: UseProfissionalPerfilAvatarOptions = {},
) {
  const { onSaveFoto } = options
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [alterarFotoOpen, setAlterarFotoOpen] = useState(false)

  useEffect(() => {
    setAvatarUrl(initialAvatarUrl)
  }, [initialAvatarUrl])

  const openAlterarFotoModal = useCallback(() => {
    setAlterarFotoOpen(true)
  }, [])

  const closeAlterarFotoModal = useCallback(() => {
    setAlterarFotoOpen(false)
  }, [])

  const saveAvatar = useCallback(
    async (_file: File, previewDataUrl: string, onProgress: (progress: number) => void) => {
      onProgress(30)
      if (onSaveFoto) {
        const savedUrl = await onSaveFoto(previewDataUrl)
        onProgress(100)
        setAvatarUrl(savedUrl)
        return
      }
      onProgress(100)
      setAvatarUrl(previewDataUrl)
    },
    [onSaveFoto],
  )

  return {
    avatarUrl,
    alterarFotoOpen,
    openAlterarFotoModal,
    closeAlterarFotoModal,
    saveAvatar,
  }
}
