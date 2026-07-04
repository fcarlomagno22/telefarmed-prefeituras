import * as Sharing from 'expo-sharing'
import type { ShareFileOptions, ShareUrlOptions } from './appSharing.types'

export type { ShareFileOptions, ShareUrlOptions } from './appSharing.types'

export async function isSharingAvailable(): Promise<boolean> {
  return Sharing.isAvailableAsync()
}

export function isWebShareApiAvailable(): boolean {
  return false
}

export async function shareLocalFile(uri: string, options: ShareFileOptions = {}): Promise<void> {
  if (!(await isSharingAvailable())) {
    throw new Error('Compartilhamento indisponivel neste dispositivo.')
  }

  await Sharing.shareAsync(uri, {
    mimeType: options.mimeType,
    UTI: options.UTI,
    dialogTitle: options.dialogTitle,
  })
}

export async function shareBlob(_blob: Blob, options: ShareFileOptions = {}): Promise<void> {
  throw new Error(
    `shareBlob nao e suportado no mobile. Salve o arquivo antes de compartilhar: ${options.filename ?? 'arquivo'}`,
  )
}

export async function downloadBlob(_blob: Blob, options: ShareFileOptions = {}): Promise<void> {
  throw new Error(
    `downloadBlob nao e suportado no mobile. Use shareLocalFile: ${options.filename ?? 'arquivo'}`,
  )
}

export async function shareUrl(_url: string, _options: ShareUrlOptions = {}): Promise<void> {
  throw new Error('shareUrl no mobile deve usar Linking ou shareLocalFile.')
}

export async function fetchShareableBlobFromUri(_uri: string): Promise<Blob> {
  throw new Error('fetchShareableBlobFromUri nao e suportado no mobile.')
}

export function dataUriToBlob(_dataUri: string): Blob {
  throw new Error('dataUriToBlob nao e suportado no mobile.')
}
