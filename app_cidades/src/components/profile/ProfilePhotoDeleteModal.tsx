import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import LottieView from 'lottie-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import trashAnimation from '../../../assets/trash.json'
import { colors } from '../../theme/colors'

type ProfilePhotoDeleteModalProps = {
  visible: boolean
  onConfirm: () => void
  onClose: () => void
}

const SHEET_OFFSET = 420

export function ProfilePhotoDeleteModal({
  visible,
  onConfirm,
  onClose,
}: ProfilePhotoDeleteModalProps) {
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
    if (!visible) return
    closeSheet(onClose)
  }

  function handleConfirm() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    closeSheet(() => {
      onClose()
      onConfirm()
    })
  }

  if (!isMounted && !visible) return null

  return (
    <Modal
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
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 10,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.lottieWrap}>
            <LottieView
              source={trashAnimation}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>

          <Text style={styles.title}>Excluir foto?</Text>
          <Text style={styles.subtitle}>
            Sua foto de perfil será removida. Você poderá adicionar outra a qualquer momento.
          </Text>

          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.deleteButtonText}>Excluir foto</Text>
          </Pressable>

          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
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
