import { dataUriToBlob, shareBlob } from '../adapters/appSharing'
import type { RefObject } from 'react'
import type { View } from 'react-native'
import { captureRef } from 'react-native-view-shot'

const SHARE_FILENAME = 'treino-telefarmed.png'

export async function shareRunWalkActivitySummaryImage(
  viewRef: RefObject<View | null>,
): Promise<boolean> {
  if (!viewRef.current || typeof window === 'undefined') return false

  try {
    const dataUri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'data-uri',
    })

    await shareBlob(dataUriToBlob(dataUri), {
      mimeType: 'image/png',
      dialogTitle: 'Compartilhar treino',
      filename: SHARE_FILENAME,
    })

    return true
  } catch {
    return false
  }
}
