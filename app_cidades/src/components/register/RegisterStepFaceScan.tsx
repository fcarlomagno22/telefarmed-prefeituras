import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { CameraPermissionSheet } from '../CameraPermissionSheet'
import { formStyles } from '../AppShell'
import { PrimaryButton } from '../PrimaryButton'
import { RegisterTimeline } from './RegisterTimeline'
import { colors } from '../../theme/colors'
import { analyzeCameraFrame, isFaceDetectionAvailable } from '../../utils/faceDetection'

const nativeFaceDetection = isFaceDetectionAvailable()

const OVAL_WIDTH = 224
const OVAL_HEIGHT = 286
const SCANNER_HEIGHT = 392
const SCAN_DURATION_MS = 2600
const DETECTION_INTERVAL_MS = 650
const FACE_LOCK_STREAK = 2

type ScanPhase =
  | 'idle'
  | 'seeking'
  | 'aligning'
  | 'off_center'
  | 'multiple_faces'
  | 'locked'
  | 'scanning'
  | 'capturing'

type RegisterStepFaceScanProps = {
  value: string | null
  onChange: (uri: string | null) => void
  onContinue: () => void
  onBack: () => void
}

const statusCopy: Record<
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

function ringColor(phase: ScanPhase): string {
  if (phase === 'locked' || phase === 'capturing') return '#4ade80'
  if (phase === 'scanning' || phase === 'aligning') return colors.primary
  if (phase === 'off_center' || phase === 'multiple_faces') return '#fbbf24'
  return 'rgba(255, 255, 255, 0.82)'
}

export function RegisterStepFaceScan({
  value,
  onChange,
  onContinue,
  onBack,
}: RegisterStepFaceScanProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [phase, setPhase] = useState<'camera' | 'preview'>(value ? 'preview' : 'camera')
  const [previewUri, setPreviewUri] = useState<string | null>(value)
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [cameraSession, setCameraSession] = useState(0)
  const [permissionSheetVisible, setPermissionSheetVisible] = useState(false)

  const cameraRef = useRef<CameraView>(null)
  const scanPhaseRef = useRef<ScanPhase>('idle')
  const isProbingRef = useRef(false)
  const isCapturingRef = useRef(false)
  const detectionActiveRef = useRef(false)
  const faceStreakRef = useRef(0)
  const [cameraReady, setCameraReady] = useState(false)

  const scanLineAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(0)).current
  const bracketGlowAnim = useRef(new Animated.Value(0.4)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const breatheAnim = useRef(new Animated.Value(0)).current

  function setScanPhaseSafe(next: ScanPhase) {
    scanPhaseRef.current = next
    setScanPhase(next)
  }

  useEffect(() => {
    if (!permission) return

    if (permission.granted) {
      setPermissionSheetVisible(false)
      return
    }

    setPermissionSheetVisible(true)
  }, [permission])

  async function handleRequestCameraPermission() {
    const result = await requestPermission()
    if (result.granted) {
      setPermissionSheetVisible(false)
    }
  }

  function handleDismissPermissionSheet() {
    setPermissionSheetVisible(false)
  }

  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(bracketGlowAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bracketGlowAnim, {
          toValue: 0.4,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )
    glow.start()
    return () => glow.stop()
  }, [bracketGlowAnim])

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )
    pulse.start()
    return () => pulse.stop()
  }, [pulseAnim])

  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    )
    breathe.start()
    return () => breathe.stop()
  }, [breatheAnim])

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 5200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    spin.start()
    return () => spin.stop()
  }, [rotateAnim])

  useEffect(() => {
    if (phase !== 'camera' || !permission?.granted) return

    const scanLoop = Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    )

    if (scanPhase === 'scanning') {
      scanLoop.start()
    } else {
      scanLineAnim.setValue(0)
      scanLoop.stop()
    }

    return () => scanLoop.stop()
  }, [phase, permission?.granted, scanLineAnim, scanPhase])

  useEffect(() => {
    if (!nativeFaceDetection) return

    if (phase !== 'camera' || !permission?.granted || !cameraReady) return

    let cancelled = false
    detectionActiveRef.current = true
    setScanPhaseSafe('seeking')
    setProgress(0)
    faceStreakRef.current = 0

    async function detectionLoop() {
      while (!cancelled && detectionActiveRef.current) {
        const current = scanPhaseRef.current
        if (
          current === 'locked' ||
          current === 'scanning' ||
          current === 'capturing' ||
          current === 'idle'
        ) {
          break
        }

        await probeForFace()
        await wait(DETECTION_INTERVAL_MS)
      }
    }

    void detectionLoop()

    return () => {
      cancelled = true
      detectionActiveRef.current = false
    }
  }, [phase, permission?.granted, cameraReady, cameraSession])

  async function probeForFace() {
    if (isProbingRef.current || isCapturingRef.current || !cameraRef.current) return

    const current = scanPhaseRef.current
    if (current === 'locked' || current === 'scanning' || current === 'capturing') return

    isProbingRef.current = true

    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.4,
        skipProcessing: Platform.OS === 'android',
      })

      if (!picture?.uri) return

      const analysis = await analyzeCameraFrame(picture.uri, picture.width, picture.height)

      if (analysis.ok) {
        faceStreakRef.current += 1
        if (faceStreakRef.current >= FACE_LOCK_STREAK) {
          detectionActiveRef.current = false
          await beginScan()
          return
        }
        setScanPhaseSafe('aligning')
        return
      }

      faceStreakRef.current = 0

      if (analysis.reason === 'multiple_faces') {
        setScanPhaseSafe('multiple_faces')
        return
      }

      if (analysis.reason === 'off_center') {
        setScanPhaseSafe('off_center')
        return
      }

      if (analysis.reason === 'unavailable') {
        setError(
          'Não foi possível iniciar a detecção facial. Use npx expo run:android em vez do Expo Go.',
        )
        return
      }

      setScanPhaseSafe('seeking')
    } catch {
      faceStreakRef.current = 0
      setScanPhaseSafe('seeking')
    } finally {
      isProbingRef.current = false
    }
  }

  async function beginScan() {
    setScanPhaseSafe('locked')
    setProgress(0)
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    await wait(500)
    if (scanPhaseRef.current !== 'locked') return

    setScanPhaseSafe('scanning')
    const startedAt = Date.now()

    while (Date.now() - startedAt < SCAN_DURATION_MS) {
      const elapsed = Date.now() - startedAt
      setProgress(Math.min(1, elapsed / SCAN_DURATION_MS))
      await wait(40)
    }

    setProgress(1)
    setScanPhaseSafe('capturing')
    await capturePhoto()
  }

  async function capturePhoto() {
    if (isCapturingRef.current || !cameraRef.current) return

    isCapturingRef.current = true
    setIsCapturing(true)

    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.82,
        skipProcessing: Platform.OS === 'android',
      })

      if (!picture?.uri) {
        setError('Não foi possível capturar a foto. Tente novamente.')
        resetScanner()
        return
      }

      const analysis = nativeFaceDetection
        ? await analyzeCameraFrame(picture.uri, picture.width, picture.height)
        : { ok: true as const, bounds: { x: 0, y: 0, width: 0, height: 0 } }

      if (!analysis.ok) {
        setError('Não detectamos um rosto válido na foto. Tente novamente.')
        resetScanner()
        return
      }

      setPreviewUri(picture.uri)
      setScanPhaseSafe('locked')

      if (Platform.OS === 'android') {
        await wait(280)
      }

      setPhase('preview')
      onChange(picture.uri)
      setError(null)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      setError('Falha ao capturar a foto. Tente novamente.')
      resetScanner()
    } finally {
      isCapturingRef.current = false
      setIsCapturing(false)
    }
  }

  function resetScanner() {
    detectionActiveRef.current = false
    isProbingRef.current = false
    isCapturingRef.current = false
    setIsCapturing(false)
    faceStreakRef.current = 0
    setCameraReady(false)
    setPreviewUri(null)
    setPhase('camera')
    setScanPhaseSafe('idle')
    setProgress(0)
    setCameraSession((current) => current + 1)
    onChange(null)
  }

  async function handleManualCapture() {
    setError(null)
    setScanPhaseSafe('capturing')
    await capturePhoto()
  }

  function handleContinue() {
    const photoUri = previewUri ?? value
    if (!photoUri) {
      setError('Capture sua foto para continuar.')
      return
    }
    setError(null)
    onContinue()
  }

  if (!permission) {
    return (
      <>
        <RegisterTimeline currentStep={3} />
        <View style={styles.permissionLoading}>
          <Ionicons name="camera-outline" size={28} color={colors.primary} />
          <Text style={styles.permissionLoadingText}>Verificando permissão da câmera...</Text>
        </View>
      </>
    )
  }

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, OVAL_HEIGHT - 20],
  })

  const ovalScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.025],
  })

  const breatheScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  })

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const status = statusCopy[scanPhase]
  const showScanBeam = scanPhase === 'scanning' || scanPhase === 'locked'
  const showRotatingRing = scanPhase === 'seeking' || scanPhase === 'aligning' || scanPhase === 'off_center'

  const cameraBlocked = !permission.granted && permission.canAskAgain === false

  return (
    <>
      <RegisterTimeline currentStep={3} />
      <Text style={formStyles.stepTitle}>Verificação facial</Text>
      <Text style={formStyles.stepSubtitle}>
        {nativeFaceDetection
          ? 'Enquadre seu rosto no oval. O escaneamento só começa quando detectarmos você na câmera.'
          : 'Centralize seu rosto no oval e capture a selfie para continuar.'}
      </Text>

      {!nativeFaceDetection && phase === 'camera' ? (
        <View style={styles.expoGoNotice}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primaryLight} />
          <Text style={styles.expoGoNoticeText}>
            No Expo Go a detecção automática não está disponível. Use o botão abaixo para capturar a
            foto. No app compilado, o scanner detecta o rosto sozinho.
          </Text>
        </View>
      ) : null}

      {error ? (
        <View style={formStyles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text style={formStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      {phase === 'camera' ? (
        <LinearGradient
          colors={['rgba(255, 133, 51, 0.55)', 'rgba(255, 107, 0, 0.15)', 'rgba(255, 133, 51, 0.45)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glowShell}
        >
          <View style={styles.scannerFrame}>
            {!permission.granted ? (
              <View style={styles.cameraPlaceholder}>
                <LinearGradient
                  colors={['rgba(255, 133, 51, 0.2)', 'rgba(255, 107, 0, 0.08)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.cameraPlaceholderIcon}>
                  <Ionicons name="camera-outline" size={36} color={colors.primaryLight} />
                </View>
                <Text style={styles.cameraPlaceholderText}>
                  Permita o acesso à câmera para iniciar a verificação facial
                </Text>
                <Pressable
                  onPress={() => setPermissionSheetVisible(true)}
                  style={({ pressed }) => [styles.reopenPermissionBtn, pressed && { opacity: 0.88 }]}
                >
                  <Text style={styles.reopenPermissionBtnText}>Permitir câmera</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <CameraView
                  key={`face-scan-camera-${cameraSession}`}
                  ref={cameraRef}
                  style={styles.camera}
                  facing="front"
                  mode="picture"
                  animateShutter={false}
                  onCameraReady={() => {
                    setCameraReady(true)
                    setScanPhaseSafe(nativeFaceDetection ? 'seeking' : 'idle')
                  }}
                />

                <View style={styles.overlay} pointerEvents="none">
              <LinearGradient
                colors={['rgba(3, 3, 8, 0.78)', 'rgba(3, 3, 8, 0.42)', 'rgba(3, 3, 8, 0.78)']}
                style={StyleSheet.absoluteFillObject}
              />

              <View style={styles.maskMiddle}>
                <View style={styles.maskSide} />
                <View style={styles.ovalWindow}>
                  {showRotatingRing ? (
                    <Animated.View
                      style={[
                        styles.rotatingRing,
                        { transform: [{ rotate: spin }, { scale: breatheScale }] },
                      ]}
                    />
                  ) : null}

                  <Animated.View
                    style={[
                      styles.ovalRing,
                      {
                        transform: [{ scale: ovalScale }],
                        borderColor: ringColor(scanPhase),
                        shadowColor: ringColor(scanPhase),
                      },
                    ]}
                  />

                  <Animated.View
                    style={[styles.hudCorner, styles.hudTopLeft, { opacity: bracketGlowAnim }]}
                  />
                  <Animated.View
                    style={[styles.hudCorner, styles.hudTopRight, { opacity: bracketGlowAnim }]}
                  />
                  <Animated.View
                    style={[styles.hudCorner, styles.hudBottomLeft, { opacity: bracketGlowAnim }]}
                  />
                  <Animated.View
                    style={[styles.hudCorner, styles.hudBottomRight, { opacity: bracketGlowAnim }]}
                  />

                  {Array.from({ length: 7 }).map((_, index) => (
                    <View key={index} style={[styles.gridLine, { top: 22 + index * 36 }]} />
                  ))}

                  {Array.from({ length: 5 }).map((_, index) => (
                    <View
                      key={`v-${index}`}
                      style={[styles.gridLineVertical, { left: 28 + index * 38 }]}
                    />
                  ))}

                  {showScanBeam ? (
                    <Animated.View
                      style={[styles.scanBeam, { transform: [{ translateY: scanLineTranslate }] }]}
                    >
                      <LinearGradient
                        colors={[
                          'rgba(255, 107, 0, 0)',
                          'rgba(255, 133, 51, 0.95)',
                          'rgba(255, 107, 0, 0)',
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.scanBeamGradient}
                      />
                    </Animated.View>
                  ) : null}
                </View>
                <View style={styles.maskSide} />
              </View>
            </View>

            <View style={[styles.statusChip, statusToneStyle(status.tone)]}>
              <View style={[styles.statusDot, statusDotStyle(status.tone)]} />
              <Ionicons name={status.icon} size={15} color={statusIconColor(status.tone)} />
              <Text style={styles.statusText}>
                {nativeFaceDetection
                  ? status.label
                  : 'Centralize seu rosto no oval'}
              </Text>
            </View>

            {scanPhase === 'scanning' ? (
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={[colors.primaryLight, colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]}
                />
              </View>
            ) : null}
              </>
            )}
          </View>
        </LinearGradient>
      ) : (
        <View style={styles.previewShell}>
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={[styles.previewImage, styles.previewMirror]}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Ionicons name="image-outline" size={42} color={colors.textSubtle} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(4, 4, 8, 0.88)']}
            style={styles.previewFade}
          />
          <View style={styles.previewBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
            <Text style={styles.previewBadgeText}>Foto capturada com sucesso</Text>
          </View>
        </View>
      )}

      {phase === 'preview' ? (
        <>
          <PrimaryButton label="Continuar" onPress={handleContinue} />
          <Pressable onPress={resetScanner} style={formStyles.secondaryButton}>
            <Text style={formStyles.secondaryButtonText}>Tirar outra foto</Text>
          </Pressable>
        </>
      ) : nativeFaceDetection ? (
        <Pressable onPress={onBack} style={formStyles.secondaryButton}>
          <Text style={formStyles.secondaryButtonText}>Voltar</Text>
        </Pressable>
      ) : (
        <>
          <PrimaryButton
            label="Capturar selfie"
            onPress={handleManualCapture}
            disabled={!cameraReady || isCapturing}
          />
          <Pressable onPress={onBack} style={formStyles.secondaryButton}>
            <Text style={formStyles.secondaryButtonText}>Voltar</Text>
          </Pressable>
        </>
      )}

      <CameraPermissionSheet
        visible={permissionSheetVisible && !permission.granted}
        blocked={cameraBlocked}
        onAllow={() => void handleRequestCameraPermission()}
        onDismiss={handleDismissPermissionSheet}
      />
    </>
  )
}

function statusToneStyle(tone: 'neutral' | 'warn' | 'success' | 'active') {
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

function statusDotStyle(tone: 'neutral' | 'warn' | 'success' | 'active') {
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

function statusIconColor(tone: 'neutral' | 'warn' | 'success' | 'active') {
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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const styles = StyleSheet.create({
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
  expoGoNotice: {
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
  expoGoNoticeText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
})
