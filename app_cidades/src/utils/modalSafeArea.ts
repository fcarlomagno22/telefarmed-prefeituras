import { Platform } from 'react-native'

const ANDROID_FOOTER_CLEARANCE = 12
const IOS_FOOTER_CLEARANCE = 8

/**
 * Padding inferior para footers de modais/drawers.
 * Usa o inset real da safe area (nav bar/gesture) + folga mínima — sem inset artificial de 48px.
 */
export function getModalFooterPadding(insetsBottom: number, extra = 0): number {
  const clearance = Platform.OS === 'android' ? ANDROID_FOOTER_CLEARANCE : IOS_FOOTER_CLEARANCE
  return Math.max(insetsBottom, clearance) + extra
}

/** @deprecated Alias mantido para RunWalkSheetDrawer */
export const getSheetBottomPadding = getModalFooterPadding
