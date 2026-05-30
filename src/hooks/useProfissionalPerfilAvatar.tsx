import { useCallback, useEffect, useState } from 'react'
import { simulateProfissionalPerfilPhotoUpload } from '../utils/profissional/profissionalPerfilPhotoUpload'

export function useProfissionalPerfilAvatar(initialAvatarUrl: string) {
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
      await simulateProfissionalPerfilPhotoUpload(onProgress)
      setAvatarUrl(previewDataUrl)
    },
    [],
  )

  return {
    avatarUrl,
    alterarFotoOpen,
    openAlterarFotoModal,
    closeAlterarFotoModal,
    saveAvatar,
  }
}
