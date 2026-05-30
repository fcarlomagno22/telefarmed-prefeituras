const ACCEPTED_PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const

export const ACCEPT_PROFISSIONAL_PERFIL_PHOTO =
  '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'

export const PROFISSIONAL_PERFIL_PHOTO_MIN_SIZE = 400

export const PROFISSIONAL_PERFIL_PHOTO_MAX_BYTES = 5 * 1024 * 1024

export function isProfissionalPerfilPhotoFile(file: File) {
  if (file.type.startsWith('image/')) {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    return ACCEPTED_PHOTO_EXTENSIONS.includes(extension as (typeof ACCEPTED_PHOTO_EXTENSIONS)[number])
  }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return ACCEPTED_PHOTO_EXTENSIONS.includes(extension as (typeof ACCEPTED_PHOTO_EXTENSIONS)[number])
}

export function readProfissionalPerfilPhotoAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Não foi possível ler a imagem.'))
    }
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(file)
  })
}

export function loadProfissionalPerfilPhotoDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível validar a imagem.'))
    }
    image.src = url
  })
}

export async function simulateProfissionalPerfilPhotoUpload(
  onProgress?: (progress: number) => void,
): Promise<void> {
  const steps = [25, 55, 82, 100]
  for (const progress of steps) {
    await new Promise<void>((resolve) => {
      window.setTimeout(() => {
        onProgress?.(progress)
        resolve()
      }, 280)
    })
  }
}
