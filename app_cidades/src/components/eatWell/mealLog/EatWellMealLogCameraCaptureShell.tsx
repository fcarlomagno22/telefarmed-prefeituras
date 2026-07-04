import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, type ReactNode } from 'react'
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
import { getModalFooterPadding } from '../../../utils/modalSafeArea'
import { styles } from './eatWellMealLogCameraCaptureShared'

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

type EatWellMealLogCameraCaptureShellProps = {
  cameraReady: boolean
  isCapturing: boolean
  onCapture: () => void
  onBack: () => void
  tipText: string
  cameraLayer: ReactNode
  footerExtra?: ReactNode
}

export function EatWellMealLogCameraCaptureShell({
  cameraReady,
  isCapturing,
  onCapture,
  onBack,
  tipText,
  cameraLayer,
  footerExtra,
}: EatWellMealLogCameraCaptureShellProps) {
  const insets = useSafeAreaInsets()
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

  return (
    <View style={styles.root}>
      {cameraLayer}

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
          onPress={onCapture}
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

        {footerExtra}

        <Text style={styles.tipText}>{tipText}</Text>
      </View>
    </View>
  )
}

type EatWellMealLogCameraPermissionProps = {
  title: string
  message: string
  notice?: string | null
  error?: string | null
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  onBack: () => void
  isSecondaryLoading?: boolean
}

export function EatWellMealLogCameraPermission({
  title,
  message,
  notice,
  error,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onBack,
  isSecondaryLoading = false,
}: EatWellMealLogCameraPermissionProps) {
  return (
    <View style={styles.permissionWrap}>
      <View style={styles.permissionIcon}>
        <Ionicons name="camera-outline" size={28} color="#a3e635" />
      </View>
      <Text style={styles.permissionTitle}>{title}</Text>
      <Text style={styles.permissionText}>{message}</Text>
      {notice ? <Text style={styles.webNotice}>{notice}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Pressable
        onPress={onPrimary}
        style={({ pressed }) => [styles.permissionBtn, pressed && styles.permissionBtnPressed]}
      >
        <Text style={styles.permissionBtnText}>{primaryLabel}</Text>
      </Pressable>
      {secondaryLabel && onSecondary ? (
        <Pressable
          onPress={onSecondary}
          disabled={isSecondaryLoading}
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && styles.permissionBtnPressed,
            isSecondaryLoading && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.secondaryBtnText}>
            {isSecondaryLoading ? 'Abrindo arquivos...' : secondaryLabel}
          </Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onBack} style={styles.backLink}>
        <Text style={styles.backLinkText}>Voltar</Text>
      </Pressable>
    </View>
  )
}
