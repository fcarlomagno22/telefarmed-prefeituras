const PHOTO_DATA_URL_REGEX = /^data:image\/(?:png|jpeg|webp);base64,/i

export function isPacientePhotoDataUrl(value: string | undefined | null): boolean {
  if (!value?.trim()) return false
  return PHOTO_DATA_URL_REGEX.test(value.trim())
}

export function stripPacientePhotoDataUrl<T extends { photoDataUrl?: string }>(
  registration: T,
): T {
  if (!isPacientePhotoDataUrl(registration.photoDataUrl)) {
    return registration
  }
  return { ...registration, photoDataUrl: undefined }
}
