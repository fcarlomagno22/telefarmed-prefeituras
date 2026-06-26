import * as Sharing from 'expo-sharing'
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

  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) return false

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Compartilhar treino',
    UTI: 'public.png',
  })

  return true
}
