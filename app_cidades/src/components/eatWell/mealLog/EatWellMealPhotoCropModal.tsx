import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../../theme/colors'
import {
  clampCropTransform,
  getCoverDisplaySize,
  type CropMetrics,
  type CropTransform,
} from '../../../utils/imageCrop'
import { saveMealPhotoCrop } from '../../../utils/eatWellMealPhotoImage'
import { AppModal } from '../../AppModal'
import { PrimaryButton } from '../../PrimaryButton'
import { getModalFooterPadding } from '../../../utils/modalSafeArea'

type EatWellMealPhotoCropModalProps = {
  visible: boolean
  imageUri: string | null
  initialSize?: { width: number; height: number } | null
  isPreparing?: boolean
  onClose: () => void
  onConfirm: (uri: string) => void
}

const INITIAL_TRANSFORM: CropTransform = {
  scale: 1,
  translateX: 0,
  translateY: 0,
}

async function loadImageDimensions(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => reject(new Error('getSize failed')),
    )
  })
}

export function EatWellMealPhotoCropModal({
  visible,
  imageUri,
  initialSize,
  isPreparing = false,
  onClose,
  onConfirm,
}: EatWellMealPhotoCropModalProps) {
  const insets = useSafeAreaInsets()
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const [transform, setTransform] = useState<CropTransform>(INITIAL_TRANSFORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shellLayout, setShellLayout] = useState({ width: 0, height: 0 })

  const transformRef = useRef(transform)
  const pinchStartScaleRef = useRef(1)
  const panStartRef = useRef({ x: 0, y: 0 })

  transformRef.current = transform

  const cropSize = useMemo(() => {
    if (shellLayout.width > 0 && shellLayout.height > 0) {
      return Math.floor(Math.min(shellLayout.width, shellLayout.height))
    }

    const horizontalInset = 16
    const maxByWidth = windowWidth - horizontalInset * 2
    const headerBlock = Math.max(insets.top, 12) + 48
    const subtitleBlock = 44 + 16
    const controlsBlock = 12 + 40 + 8
    const footerBlock = 16 + 52 + getModalFooterPadding(insets.bottom)
    const maxByHeight =
      windowHeight - headerBlock - subtitleBlock - controlsBlock - footerBlock

    return Math.floor(Math.min(maxByWidth, maxByHeight))
  }, [shellLayout.width, shellLayout.height, windowWidth, windowHeight, insets.top, insets.bottom])

  const metrics = useMemo<CropMetrics | null>(() => {
    if (!imageSize || cropSize <= 0) return null

    const display = getCoverDisplaySize(imageSize.width, imageSize.height, cropSize)

    return {
      cropSize,
      displayWidth: display.displayWidth,
      displayHeight: display.displayHeight,
      imageWidth: imageSize.width,
      imageHeight: imageSize.height,
    }
  }, [imageSize, cropSize])

  const metricsRef = useRef(metrics)
  metricsRef.current = metrics

  const applyTransform = useCallback((next: CropTransform) => {
    const currentMetrics = metricsRef.current
    if (!currentMetrics) return
    setTransform(clampCropTransform(next, currentMetrics))
  }, [])

  const adjustZoom = useCallback(
    (delta: number) => {
      if (!metrics) return
      applyTransform({
        ...transformRef.current,
        scale: transformRef.current.scale + delta,
      })
    },
    [applyTransform, metrics],
  )

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onBegin(() => {
          pinchStartScaleRef.current = transformRef.current.scale
        })
        .onUpdate((event) => {
          applyTransform({
            scale: pinchStartScaleRef.current * event.scale,
            translateX: transformRef.current.translateX,
            translateY: transformRef.current.translateY,
          })
        }),
    [applyTransform],
  )

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minPointers(1)
        .maxPointers(1)
        .onBegin(() => {
          panStartRef.current = {
            x: transformRef.current.translateX,
            y: transformRef.current.translateY,
          }
        })
        .onUpdate((event) => {
          applyTransform({
            scale: transformRef.current.scale,
            translateX: panStartRef.current.x + event.translationX,
            translateY: panStartRef.current.y + event.translationY,
          })
        }),
    [applyTransform],
  )

  const cropGesture = useMemo(
    () => Gesture.Simultaneous(pinchGesture, panGesture),
    [pinchGesture, panGesture],
  )

  useEffect(() => {
    if (!visible) return

    setError(null)
    setIsSaving(false)
    setTransform(INITIAL_TRANSFORM)
    setImageSize(null)
    setShellLayout({ width: 0, height: 0 })
  }, [visible])

  useEffect(() => {
    if (!visible || !imageUri) return

    if (initialSize) {
      setImageSize(initialSize)
      return
    }

    void loadImageDimensions(imageUri)
      .then(setImageSize)
      .catch(() => setError('Não foi possível carregar a imagem selecionada.'))
  }, [visible, imageUri, initialSize])

  useEffect(() => {
    setTransform(INITIAL_TRANSFORM)
  }, [cropSize])

  async function handleConfirm() {
    if (!imageUri || !metrics) return

    setIsSaving(true)
    setError(null)

    try {
      const croppedUri = await saveMealPhotoCrop(imageUri, metrics, transform)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onConfirm(croppedUri)
    } catch {
      setError('Não foi possível recortar a foto. Tente novamente.')
      setIsSaving(false)
    }
  }

  const isLoading = isPreparing || !imageUri || !metrics
  const innerRingSize = Math.max(cropSize - 14, 0)
  const cornerInset = Math.round(cropSize * 0.064)
  const cornerSize = Math.round(Math.min(32, cropSize * 0.09))

  const cropViewport = (
    <View
      style={[
        styles.cropViewport,
        { width: cropSize, height: cropSize, borderRadius: cropSize / 2 },
      ]}
    >
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#84cc16" />
          <Text style={styles.loadingText}>
            {isPreparing ? 'Preparando imagem...' : 'Carregando...'}
          </Text>
        </View>
      ) : (
        <View style={styles.imageLayer}>
          <Image
            source={{ uri: imageUri! }}
            style={{
              width: metrics!.displayWidth,
              height: metrics!.displayHeight,
              transform: [
                { translateX: transform.translateX },
                { translateY: transform.translateY },
                { scale: transform.scale },
              ],
            }}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.mask} pointerEvents="none">
        <View
          style={[
            styles.outerRing,
            { borderRadius: cropSize / 2 },
          ]}
        />
        <View
          style={{
            width: innerRingSize,
            height: innerRingSize,
            borderRadius: innerRingSize / 2,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.42)',
          }}
        />
        <View
          style={[
            styles.corner,
            {
              width: cornerSize,
              height: cornerSize,
              top: cornerInset,
              left: cornerInset,
              borderTopWidth: 3,
              borderLeftWidth: 3,
              borderTopLeftRadius: 8,
            },
          ]}
        />
        <View
          style={[
            styles.corner,
            {
              width: cornerSize,
              height: cornerSize,
              top: cornerInset,
              right: cornerInset,
              borderTopWidth: 3,
              borderRightWidth: 3,
              borderTopRightRadius: 8,
            },
          ]}
        />
        <View
          style={[
            styles.corner,
            {
              width: cornerSize,
              height: cornerSize,
              bottom: cornerInset,
              left: cornerInset,
              borderBottomWidth: 3,
              borderLeftWidth: 3,
              borderBottomLeftRadius: 8,
            },
          ]}
        />
        <View
          style={[
            styles.corner,
            {
              width: cornerSize,
              height: cornerSize,
              bottom: cornerInset,
              right: cornerInset,
              borderBottomWidth: 3,
              borderRightWidth: 3,
              borderBottomRightRadius: 8,
            },
          ]}
        />
      </View>
    </View>
  )

  if (!visible) return null

  return (
    <AppModal visible={visible} animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.flex}>
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
            <Text style={styles.headerTitle}>Enquadrar prato</Text>
            <View style={styles.headerButton} />
          </View>

          <Text style={styles.subtitle}>
            Ajuste zoom e posição para incluir o prato inteiro, como na foto de cima.
          </Text>

          <View
            style={styles.cropShell}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout
              setShellLayout({ width, height })
            }}
          >
            {isLoading ? (
              cropViewport
            ) : (
              <GestureDetector gesture={cropGesture}>{cropViewport}</GestureDetector>
            )}
          </View>

          <View style={styles.controlsRow}>
            <Pressable
              onPress={() => adjustZoom(-0.15)}
              disabled={isLoading || isSaving}
              style={({ pressed }) => [
                styles.zoomButton,
                (isLoading || isSaving) && styles.zoomButtonDisabled,
                pressed && !isLoading && !isSaving && styles.zoomButtonPressed,
              ]}
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </Pressable>
            <View style={styles.zoomHint}>
              <Ionicons name="scan-outline" size={16} color={colors.textMuted} />
              <Text style={styles.zoomHintText}>Pinça ou botões · arraste para mover</Text>
            </View>
            <Pressable
              onPress={() => adjustZoom(0.15)}
              disabled={isLoading || isSaving}
              style={({ pressed }) => [
                styles.zoomButton,
                (isLoading || isSaving) && styles.zoomButtonDisabled,
                pressed && !isLoading && !isSaving && styles.zoomButtonPressed,
              ]}
            >
              <Ionicons name="add" size={20} color={colors.text} />
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={[styles.footer, { paddingBottom: getModalFooterPadding(insets.bottom) }]}>
            <PrimaryButton
              label={isSaving ? 'Salvando...' : 'Usar esta foto'}
              onPress={() => void handleConfirm()}
              disabled={isLoading || isSaving}
            />
          </View>
        </View>
      </GestureHandlerRootView>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 28,
    marginBottom: 16,
  },
  cropShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropViewport: {
    overflow: 'hidden',
    backgroundColor: '#050508',
  },
  imageLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  mask: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 4,
    borderColor: 'rgba(163, 230, 53, 0.82)',
  },
  corner: {
    position: 'absolute',
    borderColor: '#a3e635',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  zoomButtonPressed: {
    opacity: 0.85,
  },
  zoomButtonDisabled: {
    opacity: 0.45,
  },
  zoomHint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  zoomHintText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 24,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
})
