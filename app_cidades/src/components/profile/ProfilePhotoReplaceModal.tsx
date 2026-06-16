import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import LottieView from 'lottie-react-native'
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppModal } from '../AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import pictureAnimation from '../../../assets/picture.json'
import { colors } from '../../theme/colors'

export type ProfilePhotoReplaceSource = 'camera' | 'library'

type ProfilePhotoReplaceModalProps = {
  visible: boolean
  hasPhoto?: boolean
  onSelect: (source: ProfilePhotoReplaceSource) => void
  onClose: () => void
}

type OptionItem = {
  id: ProfilePhotoReplaceSource
  label: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
}

const YELLOW = {
  light: '#fde68a',
  main: '#fbbf24',
  dark: '#f59e0b',
  bg: 'rgba(251, 191, 36, 0.14)',
  border: 'rgba(251, 191, 36, 0.32)',
} as const

const OPTIONS: OptionItem[] = [
  {
    id: 'camera',
    label: 'Tirar foto',
    subtitle: 'Usar a câmera frontal',
    icon: 'camera-outline',
  },
  {
    id: 'library',
    label: 'Escolher da galeria',
    subtitle: 'Selecionar uma foto existente',
    icon: 'images-outline',
  },
]

const SHEET_OFFSET = 420

export function ProfilePhotoReplaceModal({
  visible,
  hasPhoto = false,
  onSelect,
  onClose,
}: ProfilePhotoReplaceModalProps) {
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

  function handleSelect(source: ProfilePhotoReplaceSource) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    closeSheet(() => {
      onClose()
      onSelect(source)
    })
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
              source={pictureAnimation}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>

          <Text style={styles.title}>{hasPhoto ? 'Trocar foto' : 'Adicionar foto'}</Text>
          <Text style={styles.subtitle}>Como deseja adicionar sua foto de perfil?</Text>

          <View style={styles.options}>
            {OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => handleSelect(option.id)}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              >
                <View style={styles.optionIconWrap}>
                  <Ionicons name={option.icon} size={22} color={YELLOW.main} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.optionPressed]}
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
  options: {
    gap: 10,
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  optionPressed: {
    opacity: 0.88,
  },
  optionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW.bg,
    borderWidth: 1,
    borderColor: YELLOW.border,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
  cancelButton: {
    minHeight: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
})
