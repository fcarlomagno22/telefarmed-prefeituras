import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import LottieView from 'lottie-react-native'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import trashAnimation from '../../assets/trash.json'
import { colors } from '../theme/colors'
import { getModalFooterPadding } from '../utils/modalSafeArea'
import { AppModal } from './AppModal'

type DeleteConfirmSheetProps = {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

const SHEET_OFFSET = 420

export function DeleteConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Excluir',
  loading = false,
  onConfirm,
  onClose,
}: DeleteConfirmSheetProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)

  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      sheetTranslateY.setValue(SHEET_OFFSET)
      backdropOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (isMounted) {
      closeSheet(onClose)
    }
  }, [visible])

  function closeSheet(done?: () => void) {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_OFFSET,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMounted(false)
      done?.()
    })
  }

  function handleDismiss() {
    if (!visible || loading) return
    closeSheet(onClose)
  }

  function handleConfirm() {
    if (loading) return
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    onConfirm()
  }

  if (!isMounted && !visible) return null

  return (
    <AppModal
      visible={isMounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.backdropTint} />
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={handleDismiss}
            disabled={loading}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: getModalFooterPadding(insets.bottom, 10),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.lottieWrap}>
            <LottieView source={trashAnimation} autoPlay loop style={styles.lottie} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{message}</Text>

          <Pressable
            onPress={handleConfirm}
            disabled={loading}
            style={({ pressed }) => [
              styles.deleteButton,
              (pressed || loading) && styles.buttonPressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <Text style={styles.deleteButtonText}>{confirmLabel}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleDismiss}
            disabled={loading}
            style={({ pressed }) => [
              styles.cancelButton,
              (pressed || loading) && styles.buttonPressed,
            ]}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
        </Animated.View>
      </View>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: 'rgba(22, 22, 28, 0.98)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 12,
  },
  lottieWrap: {
    alignSelf: 'center',
    width: 84,
    height: 84,
    marginBottom: 4,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  deleteButton: {
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.45)',
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.88,
  },
})
