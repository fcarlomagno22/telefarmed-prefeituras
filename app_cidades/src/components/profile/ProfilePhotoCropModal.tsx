import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppModal } from '../AppModal'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PrimaryButton } from '../PrimaryButton'
import { colors } from '../../theme/colors'
import {
  clampCropTransform,
  getCoverDisplaySize,
  type CropMetrics,
  type CropTransform,
} from '../../utils/imageCrop'
import { saveProfilePhotoCrop } from '../../utils/profilePhotoImage'

const CROP_SIZE = 280

type ProfilePhotoCropModalProps = {
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

export function ProfilePhotoCropModal({
  visible,
  imageUri,
  initialSize,
  isPreparing = false,
  onClose,
  onConfirm,
}: ProfilePhotoCropModalProps) {
  const insets = useSafeAreaInsets()
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(
    null,
  )
  const [transform, setTransform] = useState<CropTransform>(INITIAL_TRANSFORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transformRef = useRef(transform)
  const pinchStartScaleRef = useRef(1)
  const panStartRef = useRef({ x: 0, y: 0 })

  transformRef.current = transform

  const metrics = useMemo<CropMetrics | null>(() => {
    if (!imageSize) return null

    const display = getCoverDisplaySize(imageSize.width, imageSize.height, CROP_SIZE)

    return {
      cropSize: CROP_SIZE,
      displayWidth: display.displayWidth,
      displayHeight: display.displayHeight,
      imageWidth: imageSize.width,
      imageHeight: imageSize.height,
    }
  }, [imageSize])

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
        })
        .onEnd(() => {
          pinchStartScaleRef.current = transformRef.current.scale
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

  async function handleConfirm() {
    if (!imageUri || !metrics) return

    setIsSaving(true)
    setError(null)

    try {
      const croppedUri = await saveProfilePhotoCrop(imageUri, metrics, transform)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onConfirm(croppedUri)
    } catch {
      setError('Não foi possível recortar a foto. Tente novamente.')
      setIsSaving(false)
    }
  }

  const isLoading = isPreparing || !imageUri || !metrics

  const cropViewport = (
    <View style={[styles.cropViewport, { width: CROP_SIZE, height: CROP_SIZE }]}>
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>
            {isPreparing ? 'Preparando imagem...' : 'Carregando...'}
          </Text>
        </View>
      ) : (
        <View style={styles.imageLayer}>
          <Image
            source={{ uri: imageUri! }}
            style={[
              {
                width: metrics!.displayWidth,
                height: metrics!.displayHeight,
                transform: [
                  { translateX: transform.translateX },
                  { translateY: transform.translateY },
                  { scale: transform.scale },
                ],
              },
            ]}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.mask} pointerEvents="none">
        <View style={styles.maskCorner} />
        <View style={[styles.maskCorner, styles.maskCornerTopRight]} />
        <View style={[styles.maskCorner, styles.maskCornerBottomLeft]} />
        <View style={[styles.maskCorner, styles.maskCornerBottomRight]} />
        <View style={styles.circleGuide} />
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
            <Text style={styles.headerTitle}>Enquadrar foto</Text>
            <View style={styles.headerButton} />
          </View>

          <Text style={styles.subtitle}>
            Ajuste zoom e posição para enquadrar seu rosto como preferir.
          </Text>

          <View style={styles.cropShell}>
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

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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

const CORNER = 28

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
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 28,
    marginBottom: 24,
  },
  cropShell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropViewport: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#050508',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
  circleGuide: {
    width: CROP_SIZE - 24,
    height: CROP_SIZE - 24,
    borderRadius: (CROP_SIZE - 24) / 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 133, 51, 0.85)',
  },
  maskCorner: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: CORNER,
    height: CORNER,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primaryLight,
  },
  maskCornerTopRight: {
    left: undefined,
    right: 12,
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  maskCornerBottomLeft: {
    top: undefined,
    bottom: 12,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  maskCornerBottomRight: {
    top: undefined,
    left: undefined,
    right: 12,
    bottom: 12,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
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
