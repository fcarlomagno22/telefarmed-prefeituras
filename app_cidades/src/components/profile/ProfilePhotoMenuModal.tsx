import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppModal } from '../AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { getModalFooterPadding } from '../../utils/modalSafeArea'

export type ProfilePhotoMenuAction = 'view' | 'replace' | 'delete'

type ProfilePhotoMenuModalProps = {
  visible: boolean
  selfieUri?: string | null
  onClose: () => void
  onAction: (action: ProfilePhotoMenuAction) => void
}

type MenuItem = {
  id: ProfilePhotoMenuAction
  label: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
  destructive?: boolean
}

const SHEET_OFFSET = 480

export function ProfilePhotoMenuModal({
  visible,
  selfieUri,
  onClose,
  onAction,
}: ProfilePhotoMenuModalProps) {
  const insets = useSafeAreaInsets()
  const hasPhoto = Boolean(selfieUri?.trim())
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

  function handleAction(action: ProfilePhotoMenuAction) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    closeSheet(() => {
      onClose()
      onAction(action)
    })
  }

  const items: MenuItem[] = [
    ...(hasPhoto
      ? [
          {
            id: 'view' as const,
            label: 'Visualizar foto',
            subtitle: 'Ver em tela cheia',
            icon: 'expand-outline' as const,
          },
        ]
      : []),
    {
      id: 'replace',
      label: hasPhoto ? 'Trocar foto' : 'Adicionar foto',
      subtitle: 'Câmera ou galeria',
      icon: 'camera-outline',
    },
    ...(hasPhoto
      ? [
          {
            id: 'delete' as const,
            label: 'Excluir foto',
            subtitle: 'Remover foto de perfil',
            icon: 'trash-outline' as const,
            destructive: true,
          },
        ]
      : []),
  ]

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
              paddingBottom: getModalFooterPadding(insets.bottom),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.previewRow}>
            {hasPhoto ? (
              <Image source={{ uri: selfieUri! }} style={styles.previewImage} />
            ) : (
              <LinearGradient
                colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
                style={styles.previewFallback}
              >
                <Ionicons name="person" size={28} color="#fff" />
              </LinearGradient>
            )}

            <View style={styles.previewText}>
              <Text style={styles.previewTitle}>Foto de perfil</Text>
              <Text style={styles.previewSubtitle}>
                {hasPhoto
                  ? 'Gerencie sua foto de perfil'
                  : 'Adicione uma foto para personalizar seu perfil'}
              </Text>
            </View>
          </View>

          <View style={styles.menu}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleAction(item.id)}
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              >
                <View
                  style={[
                    styles.menuIconWrap,
                    item.destructive && styles.menuIconWrapDestructive,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.destructive ? colors.error : colors.primaryLight}
                  />
                </View>
                <View style={styles.menuText}>
                  <Text
                    style={[
                      styles.menuLabel,
                      item.destructive && styles.menuLabelDestructive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Pressable>
            ))}
          </View>

          <Pressable onPress={handleDismiss} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancelar</Text>
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
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 18,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  previewFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  menu: {
    gap: 8,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  menuItemPressed: {
    opacity: 0.88,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
  },
  menuIconWrapDestructive: {
    backgroundColor: colors.errorBg,
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuLabelDestructive: {
    color: colors.error,
  },
  menuSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
})
