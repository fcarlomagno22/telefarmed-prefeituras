import { isSharingAvailable, shareLocalFile } from '../adapters/appSharing'
import type { RefObject } from 'react'
import type { View } from 'react-native'
import { captureRef } from 'react-native-view-shot'

export async function shareRunWalkActivitySummaryImage(
  viewRef: RefObject<View | null>,
): Promise<boolean> {
  if (!viewRef.current) return false

  const uri = await captureRef(viewRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  })

  if (!(await isSharingAvailable())) return false

  await shareLocalFile(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Compartilhar treino',
    UTI: 'public.png',
    filename: 'treino-telefarmed.png',
  })

  return true
}
