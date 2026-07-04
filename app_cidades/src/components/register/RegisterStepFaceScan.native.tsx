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
import {
  DETECTION_INTERVAL_MS,
  FACE_LOCK_STREAK,
  OVAL_HEIGHT,
  OVAL_WIDTH,
  SCAN_DURATION_MS,
  ringColor,
  statusCopy,
  statusDotStyle,
  statusIconColor,
  statusToneStyle,
  styles,
  wait,
  type RegisterStepFaceScanProps,
  type ScanPhase,
} from './registerStepFaceScanShared'

const nativeFaceDetection = isFaceDetectionAvailable()

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
        <View style={styles.platformNotice}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primaryLight} />
          <Text style={styles.platformNoticeText}>
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
                    {nativeFaceDetection ? status.label : 'Centralize seu rosto no oval'}
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
