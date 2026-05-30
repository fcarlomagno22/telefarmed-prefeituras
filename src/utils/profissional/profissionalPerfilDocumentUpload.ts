const ACCEPTED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'] as const

export const ACCEPT_PROFISSIONAL_PERFIL_DOCUMENT =
  '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp'

export function isProfissionalPerfilDocumentFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return ACCEPTED_EXTENSIONS.includes(extension as (typeof ACCEPTED_EXTENSIONS)[number])
}

export function simulateProfissionalDocumentUpload(
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    const steps = [18, 42, 68, 88, 100]
    let index = 0

    const tick = () => {
      const progress = steps[index] ?? 100
      onProgress?.(progress)
      index += 1
      if (progress >= 100) {
        resolve()
        return
      }
      window.setTimeout(tick, 220)
    }

    window.setTimeout(tick, 120)
  })
}
