import { StyleSheet } from 'react-native'
import { colors } from '../../../theme/colors'

export const FRAME_SIZE = 280

export type EatWellMealLogCameraCaptureProps = {
  onCapture: (uri: string, width?: number, height?: number) => void
  onBack: () => void
}

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#030308',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  permissionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.25)',
    marginBottom: 4,
  },
  permissionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  permissionText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
  },
  webNotice: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  permissionBtn: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#84cc16',
  },
  permissionBtnPressed: {
    opacity: 0.9,
  },
  permissionBtnText: {
    color: '#0a0a0c',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryBtn: {
    marginTop: 4,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.28)',
  },
  secondaryBtnText: {
    color: '#d9f99d',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  backLink: {
    paddingVertical: 8,
  },
  backLinkText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  topBtnPressed: {
    opacity: 0.85,
  },
  topChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.22)',
  },
  topChipText: {
    color: '#d9f99d',
    fontSize: 12,
    fontWeight: '700',
  },
  topSpacer: {
    width: 40,
  },
  frameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  plateFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateOuterRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: FRAME_SIZE / 2,
    borderWidth: 4,
    borderColor: 'rgba(163, 230, 53, 0.82)',
    backgroundColor: 'transparent',
  },
  plateInnerRing: {
    width: FRAME_SIZE - 14,
    height: FRAME_SIZE - 14,
    borderRadius: (FRAME_SIZE - 14) / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.42)',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#a3e635',
  },
  cornerTL: {
    top: 18,
    left: 18,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 18,
    right: 18,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 18,
    left: 18,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 18,
    right: 18,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  hint: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  bottomBar: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 28,
  },
  tipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 280,
  },
  shutterOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  shutterOuterPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }],
  },
  shutterOuterDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
