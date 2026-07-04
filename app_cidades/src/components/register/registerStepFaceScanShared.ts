import { Ionicons } from '@expo/vector-icons'
import { StyleSheet } from 'react-native'
import { colors } from '../../theme/colors'

export const OVAL_WIDTH = 224
export const OVAL_HEIGHT = 286
export const SCANNER_HEIGHT = 392
export const SCAN_DURATION_MS = 2600
export const DETECTION_INTERVAL_MS = 650
export const FACE_LOCK_STREAK = 2

export type ScanPhase =
  | 'idle'
  | 'seeking'
  | 'aligning'
  | 'off_center'
  | 'multiple_faces'
  | 'locked'
  | 'scanning'
  | 'capturing'

export type RegisterStepFaceScanProps = {
  value: string | null
  onChange: (uri: string | null) => void
  onContinue: () => void
  onBack: () => void
}

export const statusCopy: Record<
  ScanPhase,
  { label: string; icon: keyof typeof Ionicons.glyphMap; tone: 'neutral' | 'warn' | 'success' | 'active' }
> = {
  idle: { label: 'Preparando câmera...', icon: 'scan-outline', tone: 'neutral' },
  seeking: { label: 'Posicione seu rosto no oval', icon: 'scan-outline', tone: 'neutral' },
  aligning: { label: 'Rosto detectado, mantenha a posição...', icon: 'radio-outline', tone: 'active' },
  off_center: { label: 'Centralize o rosto dentro do oval', icon: 'move-outline', tone: 'warn' },
  multiple_faces: { label: 'Apenas uma pessoa na câmera', icon: 'people-outline', tone: 'warn' },
  locked: { label: 'Rosto identificado!', icon: 'checkmark-circle', tone: 'success' },
  scanning: { label: 'Escaneando biometria facial...', icon: 'radio-outline', tone: 'active' },
  capturing: { label: 'Capturando imagem...', icon: 'camera', tone: 'active' },
}

export function ringColor(phase: ScanPhase): string {
  if (phase === 'locked' || phase === 'capturing') return '#4ade80'
  if (phase === 'scanning' || phase === 'aligning') return colors.primary
  if (phase === 'off_center' || phase === 'multiple_faces') return '#fbbf24'
  return 'rgba(255, 255, 255, 0.82)'
}

export function statusToneStyle(tone: 'neutral' | 'warn' | 'success' | 'active') {
  switch (tone) {
    case 'success':
      return styles.statusChipSuccess
    case 'warn':
      return styles.statusChipWarn
    case 'active':
      return styles.statusChipActive
    default:
      return styles.statusChipNeutral
  }
}

export function statusDotStyle(tone: 'neutral' | 'warn' | 'success' | 'active') {
  switch (tone) {
    case 'success':
      return styles.statusDotSuccess
    case 'warn':
      return styles.statusDotWarn
    case 'active':
      return styles.statusDotActive
    default:
      return styles.statusDotNeutral
  }
}

export function statusIconColor(tone: 'neutral' | 'warn' | 'success' | 'active') {
  switch (tone) {
    case 'success':
      return '#86efac'
    case 'warn':
      return '#fde68a'
    case 'active':
      return colors.primaryLight
    default:
      return colors.textMuted
  }
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const styles = StyleSheet.create({
  glowShell: {
    borderRadius: 28,
    padding: 1.5,
    marginBottom: 16,
  },
  scannerFrame: {
    height: SCANNER_HEIGHT,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#050508',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  maskMiddle: {
    height: OVAL_HEIGHT,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(3, 3, 8, 0.55)',
  },
  ovalWindow: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rotatingRing: {
    position: 'absolute',
    width: OVAL_WIDTH + 18,
    height: OVAL_HEIGHT + 18,
    borderRadius: (OVAL_WIDTH + 18) / 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 133, 51, 0.45)',
    borderTopColor: 'rgba(255, 133, 51, 0.95)',
    borderRightColor: 'rgba(255, 107, 0, 0.2)',
  },
  ovalRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: OVAL_WIDTH,
    borderWidth: 2.5,
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  hudCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primaryLight,
  },
  hudTopLeft: {
    top: 10,
    left: 10,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  hudTopRight: {
    top: 10,
    right: 10,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  hudBottomLeft: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  hudBottomRight: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  gridLine: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 18,
    bottom: 18,
    width: 1,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  scanBeam: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 4,
  },
  scanBeamGradient: {
    flex: 1,
    borderRadius: 999,
    shadowColor: colors.primary,
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  statusChip: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  statusChipNeutral: {
    backgroundColor: 'rgba(8, 8, 14, 0.78)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusChipActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.14)',
    borderColor: 'rgba(255, 107, 0, 0.35)',
  },
  statusChipWarn: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  statusChipSuccess: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderColor: 'rgba(74, 222, 128, 0.35)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  statusDotNeutral: {
    backgroundColor: colors.textSubtle,
  },
  statusDotActive: {
    backgroundColor: colors.primary,
  },
  statusDotWarn: {
    backgroundColor: '#fbbf24',
  },
  statusDotSuccess: {
    backgroundColor: '#4ade80',
  },
  statusText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  progressTrack: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 14,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  previewShell: {
    height: SCANNER_HEIGHT,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 16,
    backgroundColor: '#050508',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewMirror: {
    transform: [{ scaleX: -1 }],
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  previewFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  previewBadge: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(8, 8, 12, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.35)',
  },
  previewBadgeText: {
    color: '#bbf7d0',
    fontSize: 12,
    fontWeight: '600',
  },
  permissionLoading: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  permissionLoadingText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 14,
    zIndex: 2,
  },
  cameraPlaceholderIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.28)',
  },
  cameraPlaceholderText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontWeight: '600',
  },
  reopenPermissionBtn: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 107, 0, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.35)',
  },
  reopenPermissionBtnText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  platformNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.22)',
  },
  platformNoticeText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  limitationsBox: {
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 0, 0.18)',
  },
  limitationsTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  limitationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  limitationBullet: {
    color: colors.primaryLight,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 1,
  },
  limitationText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
  },
})
