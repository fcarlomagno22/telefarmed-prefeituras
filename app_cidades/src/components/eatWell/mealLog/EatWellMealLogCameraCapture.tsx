import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../../theme/colors'
import { getModalFooterPadding } from '../../../utils/modalSafeArea'

type EatWellMealLogCameraCaptureProps = {
  onCapture: (uri: string, width?: number, height?: number) => void
  onBack: () => void
}

function PlateRadialVignette() {
  const { width, height } = useWindowDimensions()

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="plateSpotlight" cx="50%" cy="46%" rx="95%" ry="88%">
            <Stop offset="0%" stopColor="#030308" stopOpacity={0} />
            <Stop offset="26%" stopColor="#030308" stopOpacity={0} />
            <Stop offset="42%" stopColor="#030308" stopOpacity={0.28} />
            <Stop offset="62%" stopColor="#030308" stopOpacity={0.58} />
            <Stop offset="100%" stopColor="#030308" stopOpacity={0.86} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#plateSpotlight)" />
      </Svg>
    </View>
  )
}

export function EatWellMealLogCameraCapture({ onCapture, onBack }: EatWellMealLogCameraCaptureProps) {
  const insets = useSafeAreaInsets()
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [cameraReady, setCameraReady] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

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
      <View style={styles.permissionWrap}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={28} color="#a3e635" />
        </View>
        <Text style={styles.permissionTitle}>Permita o acesso à câmera</Text>
        <Text style={styles.permissionText}>
          Precisamos da câmera para fotografar seu prato de cima e identificar os alimentos.
        </Text>
        <Pressable
          onPress={() => void requestPermission()}
          style={({ pressed }) => [styles.permissionBtn, pressed && styles.permissionBtnPressed]}
        >
          <Text style={styles.permissionBtnText}>Permitir câmera</Text>
        </Pressable>
        <Pressable onPress={onBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        mode="picture"
        animateShutter={false}
        onCameraReady={() => setCameraReady(true)}
      />

      <PlateRadialVignette />

      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 8) }]}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.topBtn, pressed && styles.topBtnPressed]}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.topChip}>
          <Ionicons name="scan-outline" size={14} color="#a3e635" />
          <Text style={styles.topChipText}>Foto de cima do prato</Text>
        </View>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.frameArea} pointerEvents="none">
        <Animated.View style={[styles.plateFrame, { transform: [{ scale: pulse }] }]}>
          <View style={styles.plateOuterRing} />
          <View style={styles.plateInnerRing}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </Animated.View>
        <Text style={styles.hint}>Centralize o prato dentro do círculo</Text>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: getModalFooterPadding(insets.bottom, 8) }]}>
        <Pressable
          onPress={() => void handleCapture()}
          disabled={!cameraReady || isCapturing}
          style={({ pressed }) => [
            styles.shutterOuter,
            pressed && styles.shutterOuterPressed,
            (!cameraReady || isCapturing) && styles.shutterOuterDisabled,
          ]}
        >
          {isCapturing ? (
            <ActivityIndicator color="#0a0a0c" />
          ) : (
            <LinearGradient
              colors={['#d9f99d', '#84cc16', '#65a30d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shutterInner}
            >
              <Ionicons name="camera" size={28} color="#0a0a0c" />
            </LinearGradient>
          )}
        </Pressable>

        <Text style={styles.tipText}>
          Use boa iluminação e mantenha o celular paralelo ao prato
        </Text>
      </View>
    </View>
  )
}

const FRAME_SIZE = 280

const styles = StyleSheet.create({
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
