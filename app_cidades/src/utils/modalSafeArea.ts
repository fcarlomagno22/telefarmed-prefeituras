import { Platform } from 'react-native'
import { getAndroidBottomInset } from './androidNavBar'

const ANDROID_FOOTER_CLEARANCE = 12
const IOS_FOOTER_CLEARANCE = 8

/**
 * Padding inferior para footers de modais/drawers.
 * No Android garante altura mínima da nav bar de 3 botões quando o inset vier zerado.
 */
export function getModalFooterPadding(insetsBottom: number, extra = 0): number {
  const bottomInset =
    Platform.OS === 'android' ? getAndroidBottomInset(insetsBottom) : insetsBottom
  const clearance = Platform.OS === 'android' ? ANDROID_FOOTER_CLEARANCE : IOS_FOOTER_CLEARANCE
  return Math.max(bottomInset, clearance) + extra
}

/** @deprecated Alias mantido para RunWalkSheetDrawer */
export const getSheetBottomPadding = getModalFooterPadding
