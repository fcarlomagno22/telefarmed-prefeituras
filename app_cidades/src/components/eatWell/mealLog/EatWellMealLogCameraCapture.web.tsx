import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { pickImageFromDeviceWeb } from '../../../adapters/pickImageFromDevice.web'
import {
  EAT_WELL_MEAL_LOG_CAMERA_WEB_NOTICE,
  EAT_WELL_MEAL_LOG_CAMERA_WEB_TIP,
  getEatWellMealLogCameraWebEnvironmentError,
} from './eatWellMealLogCameraEnvironment.web'
import {
  EatWellMealLogCameraCaptureShell,
  EatWellMealLogCameraPermission,
} from './EatWellMealLogCameraCaptureShell'
import {
  styles,
  type EatWellMealLogCameraCaptureProps,
} from './eatWellMealLogCameraCaptureShared'

export function EatWellMealLogCameraCapture({ onCapture, onBack }: EatWellMealLogCameraCaptureProps) {
  const environmentError = useMemo(() => getEatWellMealLogCameraWebEnvironmentError(), [])
  const liveCameraBlocked = Boolean(environmentError)
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [cameraReady, setCameraReady] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isPickingImage, setIsPickingImage] = useState(false)
  const [error, setError] = useState<string | null>(environmentError)
  const [cameraSession, setCameraSession] = useState(0)

  const canUseLiveCamera = !liveCameraBlocked && Boolean(permission?.granted)

  async function handlePickFromDevice() {
    setError(environmentError)
    setIsPickingImage(true)

    try {
      const result = await pickImageFromDeviceWeb()

      if (result.ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        onCapture(result.uri, result.width, result.height)
        return
      }

      if (result.reason === 'permission_denied') {
        setError('Permita o acesso à galeria/arquivos para enviar a foto do prato.')
        return
      }

      if (result.reason === 'no_asset') {
        setError('Não foi possível ler a imagem selecionada. Tente outro arquivo.')
      }
    } finally {
      setIsPickingImage(false)
    }
  }

  async function handleCapture() {
    if (!cameraRef.current || !cameraReady || isCapturing) return

    setIsCapturing(true)
    setError(environmentError)
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      })

      if (photo?.uri) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        onCapture(photo.uri, photo.width, photo.height)
        return
      }

      setError('Não foi possível capturar a foto. Tente novamente ou envie uma imagem do dispositivo.')
    } catch {
      setError('Falha ao capturar a foto. Verifique a permissão da câmera ou envie uma imagem.')
    } finally {
      setIsCapturing(false)
    }
  }

  async function handleRequestPermission() {
    const result = await requestPermission()
    if (result.granted) {
      setError(environmentError)
      setCameraSession((current) => current + 1)
      return
    }

    setError('Permita a câmera ou envie uma foto do prato a partir do dispositivo.')
  }

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#84cc16" />
      </View>
    )
  }

  if (liveCameraBlocked || !permission.granted) {
    return (
      <EatWellMealLogCameraPermission
        title={liveCameraBlocked ? 'Câmera ao vivo indisponível' : 'Permita o acesso à câmera'}
        message={
          liveCameraBlocked
            ? 'Neste ambiente a câmera do navegador não pode ser usada. Envie uma foto do prato para continuar.'
            : 'Precisamos da câmera para fotografar seu prato de cima. Você também pode enviar uma foto existente.'
        }
        notice={EAT_WELL_MEAL_LOG_CAMERA_WEB_NOTICE}
        error={error}
        primaryLabel={liveCameraBlocked ? 'Enviar foto do dispositivo' : 'Permitir câmera'}
        onPrimary={() => (liveCameraBlocked ? void handlePickFromDevice() : void handleRequestPermission())}
        secondaryLabel={liveCameraBlocked ? undefined : 'Enviar foto do dispositivo'}
        onSecondary={liveCameraBlocked ? undefined : () => void handlePickFromDevice()}
        isSecondaryLoading={isPickingImage}
        onBack={onBack}
      />
    )
  }

  const galleryFallback = (
    <>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Pressable
        onPress={() => void handlePickFromDevice()}
        disabled={isPickingImage}
        style={({ pressed }) => [
          styles.secondaryBtn,
          pressed && styles.permissionBtnPressed,
          isPickingImage && { opacity: 0.6 },
        ]}
      >
        <Text style={styles.secondaryBtnText}>
          {isPickingImage ? 'Abrindo arquivos...' : 'Enviar foto do dispositivo'}
        </Text>
      </Pressable>
    </>
  )

  return (
    <EatWellMealLogCameraCaptureShell
        cameraReady={canUseLiveCamera ? cameraReady : false}
        isCapturing={isCapturing}
        onCapture={() => void handleCapture()}
        onBack={onBack}
        tipText={EAT_WELL_MEAL_LOG_CAMERA_WEB_TIP}
        footerExtra={galleryFallback}
        cameraLayer={
          canUseLiveCamera ? (
            <CameraView
              key={`meal-log-camera-web-${cameraSession}`}
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing="back"
              mode="picture"
              animateShutter={false}
              onCameraReady={() => setCameraReady(true)}
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#030308' }]} />
          )
        }
      />
  )
}
