import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import {
  EatWellMealLogCameraCaptureShell,
  EatWellMealLogCameraPermission,
} from './EatWellMealLogCameraCaptureShell'
import {
  styles,
  type EatWellMealLogCameraCaptureProps,
} from './eatWellMealLogCameraCaptureShared'

export function EatWellMealLogCameraCapture({ onCapture, onBack }: EatWellMealLogCameraCaptureProps) {
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [cameraReady, setCameraReady] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)

  async function handleCapture() {
    if (!cameraRef.current || !cameraReady || isCapturing) return

    setIsCapturing(true)
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      })
      if (photo?.uri) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        onCapture(photo.uri, photo.width, photo.height)
      }
    } finally {
      setIsCapturing(false)
    }
  }

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#84cc16" />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <EatWellMealLogCameraPermission
        title="Permita o acesso à câmera"
        message="Precisamos da câmera para fotografar seu prato de cima e identificar os alimentos."
        primaryLabel="Permitir câmera"
        onPrimary={() => void requestPermission()}
        onBack={onBack}
      />
    )
  }

  return (
    <EatWellMealLogCameraCaptureShell
      cameraReady={cameraReady}
      isCapturing={isCapturing}
      onCapture={() => void handleCapture()}
      onBack={onBack}
      tipText="Use boa iluminação e mantenha o celular paralelo ao prato"
      cameraLayer={
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="back"
          mode="picture"
          animateShutter={false}
          onCameraReady={() => setCameraReady(true)}
        />
      }
    />
  )
}
