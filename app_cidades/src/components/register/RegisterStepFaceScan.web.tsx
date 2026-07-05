import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native'
import { pickImageFromDeviceWeb } from '../../adapters/pickImageFromDevice.web'
import {
  getRegisterFaceScanWebEnvironmentError,
  REGISTER_FACE_SCAN_WEB_PERMISSION_DENIED_COPY,
  REGISTER_FACE_SCAN_WEB_PERMISSION_PROMPT_COPY,
  registerFaceVerification,
} from '../../adapters/registerFaceVerification.web'
import { CameraPermissionSheet } from '../CameraPermissionSheet'
import { formStyles } from '../AppShell'
import { PrimaryButton } from '../PrimaryButton'
import { RegisterTimeline } from './RegisterTimeline'
import { colors } from '../../theme/colors'
import {
  OVAL_HEIGHT,
  OVAL_WIDTH,
  ringColor,
  statusCopy,
  statusDotStyle,
  statusIconColor,
  statusToneStyle,
  styles,
  type RegisterStepFaceScanProps,
  type ScanPhase,
} from './registerStepFaceScanShared'

const faceVerification = registerFaceVerification

const webOvalClipStyle = {
  clipPath: `ellipse(${OVAL_WIDTH / 2}px ${OVAL_HEIGHT / 2}px at 50% 50%)`,
} as object

export function RegisterStepFaceScan({
  value,
  onChange,
  onContinue,
  onBack,
}: RegisterStepFaceScanProps) {
  const environmentError = useMemo(() => getRegisterFaceScanWebEnvironmentError(), [])
  const liveCameraBlocked = Boolean(environmentError)
  const [permission, requestPermission] = useCameraPermissions()
  const [phase, setPhase] = useState<'camera' | 'preview'>(value ? 'preview' : 'camera')
  const [previewUri, setPreviewUri] = useState<string | null>(value)
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle')
  const [error, setError] = useState<string | null>(environmentError)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isPickingGallery, setIsPickingGallery] = useState(false)
  const [cameraSession, setCameraSession] = useState(0)
  const [permissionSheetVisible, setPermissionSheetVisible] = useState(false)

  const cameraRef = useRef<CameraView>(null)
  const isCapturingRef = useRef(false)
  const [cameraReady, setCameraReady] = useState(false)

  const pulseAnim = useRef(new Animated.Value(0)).current
  const bracketGlowAnim = useRef(new Animated.Value(0.4)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const breatheAnim = useRef(new Animated.Value(0)).current

  const permissionDenied = Boolean(permission && !permission.granted && permission.canAskAgain === false)
  const permissionCopy = permissionDenied
    ? REGISTER_FACE_SCAN_WEB_PERMISSION_DENIED_COPY
    : REGISTER_FACE_SCAN_WEB_PERMISSION_PROMPT_COPY

  const canUseLiveCamera = !liveCameraBlocked && Boolean(permission?.granted)

  useEffect(() => {
    if (liveCameraBlocked || !permission) return

    if (permission.granted) {
      setPermissionSheetVisible(false)
      return
    }

    setPermissionSheetVisible(true)
  }, [liveCameraBlocked, permission])

  async function handleRequestCameraPermission() {
    const result = await requestPermission()
    if (result.granted) {
      setPermissionSheetVisible(false)
      setError(environmentError)
      return
    }

    const denied = !result.granted && result.canAskAgain === false
    setError(
      denied
        ? REGISTER_FACE_SCAN_WEB_PERMISSION_DENIED_COPY.message
        : 'Permita o acesso à câmera ou envie uma foto do dispositivo.',
    )
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

  function applySelfieUri(uri: string) {
    setPreviewUri(uri)
    setPhase('preview')
    onChange(uri)
    setError(environmentError)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  async function capturePhoto() {
    if (isCapturingRef.current || !cameraRef.current) return

    isCapturingRef.current = true
    setIsCapturing(true)
    setScanPhase('capturing')

    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.82,
      })

      if (!picture?.uri) {
        setError('Não foi possível capturar a foto. Tente novamente ou envie uma foto do dispositivo.')
        resetScanner()
        return
      }

      applySelfieUri(picture.uri)
    } catch {
      setError('Falha ao capturar a foto. Verifique a permissão da câmera ou envie uma foto do dispositivo.')
      resetScanner()
    } finally {
      isCapturingRef.current = false
      setIsCapturing(false)
    }
  }

  async function handlePickFromDevice() {
    setError(null)
    setIsPickingGallery(true)

    try {
      const result = await pickImageFromDeviceWeb()

      if (result.ok) {
        applySelfieUri(result.uri)
        return
      }

      if (result.reason === 'permission_denied') {
        setError('Permita o acesso à galeria/arquivos para enviar uma foto do dispositivo.')
        return
      }

      if (result.reason === 'no_asset') {
        setError('Não foi possível ler a imagem selecionada. Tente outro arquivo.')
      }
    } finally {
      setIsPickingGallery(false)
    }
  }

  function resetScanner() {
    isCapturingRef.current = false
    setIsCapturing(false)
    setCameraReady(false)
    setPreviewUri(null)
    setPhase('camera')
    setScanPhase('idle')
    setCameraSession((current) => current + 1)
    onChange(null)
    setError(environmentError)
  }

  async function handleManualCapture() {
    setError(null)
    await capturePhoto()
  }

  function handleContinue() {
    const photoUri = previewUri ?? value
    if (!photoUri) {
      setError('Registre uma selfie ou envie uma foto para continuar.')
      return
    }
    setError(null)
    onContinue()
  }

  function renderGalleryFallbackActions(primary = false) {
    return (
      <>
        {primary ? (
          <PrimaryButton
            label="Enviar foto do dispositivo"
            onPress={handlePickFromDevice}
            disabled={isPickingGallery}
          />
        ) : (
          <Pressable
            onPress={handlePickFromDevice}
            disabled={isPickingGallery}
            style={[formStyles.secondaryButton, isPickingGallery && { opacity: 0.6 }]}
          >
            <Text style={formStyles.secondaryButtonText}>
              {isPickingGallery ? 'Abrindo arquivos...' : 'Enviar foto do dispositivo'}
            </Text>
          </Pressable>
        )}
      </>
    )
  }

  if (liveCameraBlocked && phase === 'camera') {
    return (
      <>
        <RegisterTimeline currentStep={3} />
        <Text style={formStyles.stepTitle}>{faceVerification.stepTitle}</Text>

        {environmentError ? (
          <View style={formStyles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={formStyles.errorText}>{environmentError}</Text>
          </View>
        ) : null}

        <View style={styles.webFaceScanStage}>
          <View style={[styles.webOvalStack, webOvalClipStyle]}>
            <View style={[styles.webOvalCameraShell, styles.webOvalPlaceholder]}>
              <View style={styles.cameraPlaceholderIcon}>
                <Ionicons name="images-outline" size={36} color={colors.primaryLight} />
              </View>
              <Text style={styles.cameraPlaceholderText}>
                Câmera ao vivo indisponível neste ambiente. Use o fallback abaixo para enviar uma selfie
                manualmente.
              </Text>
            </View>
          </View>
        </View>

        {renderGalleryFallbackActions(true)}
        <Pressable onPress={onBack} style={formStyles.secondaryButton}>
          <Text style={formStyles.secondaryButtonText}>Voltar</Text>
        </Pressable>
      </>
    )
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
  const showRotatingRing = scanPhase === 'idle' || scanPhase === 'seeking'

  return (
    <>
      <RegisterTimeline currentStep={3} />
      <Text style={formStyles.stepTitle}>{faceVerification.stepTitle}</Text>

      {error ? (
        <View style={formStyles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text style={formStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      {phase === 'camera' ? (
        <View style={styles.webFaceScanStage}>
          {!canUseLiveCamera ? (
            <View style={[styles.webOvalStack, webOvalClipStyle]}>
              <View style={[styles.webOvalCameraShell, styles.webOvalPlaceholder]}>
                <View style={styles.cameraPlaceholderIcon}>
                  <Ionicons name="camera-outline" size={36} color={colors.primaryLight} />
                </View>
                <Text style={styles.cameraPlaceholderText}>
                  Permita a câmera ou use o fallback para enviar uma foto do dispositivo
                </Text>
                {!permission.granted ? (
                  <Pressable
                    onPress={() => setPermissionSheetVisible(true)}
                    style={({ pressed }) => [styles.reopenPermissionBtn, pressed && { opacity: 0.88 }]}
                  >
                    <Text style={styles.reopenPermissionBtnText}>Permitir câmera</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : (
            <>
              <View style={styles.webOvalStack}>
                <View style={[styles.webOvalCameraShell, webOvalClipStyle]}>
                  <CameraView
                    key={`face-scan-camera-web-${cameraSession}`}
                    ref={cameraRef}
                    style={styles.webOvalCamera}
                    facing="front"
                    mode="picture"
                    animateShutter={false}
                    onCameraReady={() => {
                      setCameraReady(true)
                      setScanPhase('seeking')
                    }}
                  />
                </View>

                <View style={styles.webOvalGuideOverlay} pointerEvents="none">
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
                  </View>
                </View>
              </View>

              <View style={[styles.webStatusChip, statusToneStyle(status.tone)]}>
                <View style={[styles.statusDot, statusDotStyle(status.tone)]} />
                <Ionicons name={status.icon} size={15} color={statusIconColor(status.tone)} />
                <Text style={styles.statusText}>Centralize seu rosto e capture manualmente</Text>
              </View>
            </>
          )}
        </View>
      ) : (
        <View style={styles.webFaceScanStage}>
          <View style={[styles.webOvalStack, webOvalClipStyle]}>
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                style={[styles.webPreviewImage, styles.previewMirror]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.webOvalCameraShell, styles.webOvalPlaceholder]}>
                <Ionicons name="image-outline" size={42} color={colors.textSubtle} />
              </View>
            )}
          </View>
          {previewUri ? (
            <View style={[styles.webStatusChip, styles.statusChipSuccess]}>
              <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
              <Text style={styles.previewBadgeText}>{faceVerification.previewBadgeText}</Text>
            </View>
          ) : null}
        </View>
      )}

      {phase === 'preview' ? (
        <>
          <PrimaryButton label="Continuar" onPress={handleContinue} />
          <Pressable onPress={resetScanner} style={formStyles.secondaryButton}>
            <Text style={formStyles.secondaryButtonText}>Registrar outra foto</Text>
          </Pressable>
        </>
      ) : canUseLiveCamera ? (
        <>
          <PrimaryButton
            label="Capturar selfie"
            onPress={handleManualCapture}
            disabled={!cameraReady || isCapturing}
          />
          {renderGalleryFallbackActions(false)}
          <Pressable onPress={onBack} style={formStyles.secondaryButton}>
            <Text style={formStyles.secondaryButtonText}>Voltar</Text>
          </Pressable>
        </>
      ) : (
        <>
          {renderGalleryFallbackActions(true)}
          {!permission.granted ? (
            <Pressable
              onPress={() => setPermissionSheetVisible(true)}
              style={formStyles.secondaryButton}
            >
              <Text style={formStyles.secondaryButtonText}>Tentar câmera ao vivo</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onBack} style={formStyles.secondaryButton}>
            <Text style={formStyles.secondaryButtonText}>Voltar</Text>
          </Pressable>
        </>
      )}

      <CameraPermissionSheet
        visible={permissionSheetVisible && !permission.granted}
        blocked={false}
        title={permissionCopy.title}
        message={permissionCopy.message}
        allowLabel={permissionCopy.allowLabel}
        dismissLabel={permissionCopy.dismissLabel}
        onAllow={() => void handleRequestCameraPermission()}
        onDismiss={handleDismissPermissionSheet}
      />
    </>
  )
}
