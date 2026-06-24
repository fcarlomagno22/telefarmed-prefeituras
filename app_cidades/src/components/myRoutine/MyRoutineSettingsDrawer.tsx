import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { drawerChrome } from '../../theme/drawerChrome'
import { AppModal } from '../AppModal'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'

type PreferencesSummary = {
  notifications: string
  schedule: string
  intensity: string
}

type MyRoutineSettingsDrawerProps = {
  visible: boolean
  onClose: () => void
  preferencesSummary: PreferencesSummary
  essentialsCount: number
  onOpenPreferences: () => void
  onOpenEssentials: () => void
  onOpenRefresh: () => void
  onOpenHowItWorks: () => void
  onOpenPrivacy: () => void
  onRequestFullReset: () => void
}

export function MyRoutineSettingsDrawer({
  visible,
  onClose,
  preferencesSummary,
  essentialsCount,
  onOpenPreferences,
  onOpenEssentials,
  onOpenRefresh,
  onOpenHowItWorks,
  onOpenPrivacy,
  onRequestFullReset,
}: MyRoutineSettingsDrawerProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const panelWidth = Math.min(380, Math.round(screenWidth * 0.84))

  const [isMounted, setIsMounted] = useState(false)
  const slideX = useRef(new Animated.Value(panelWidth)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    slideX.setValue(panelWidth)
  }, [panelWidth, slideX])

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      slideX.setValue(panelWidth)
      backdropOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (isMounted) {
      closePanel(onClose)
    }
  }, [visible, panelWidth])

  function closePanel(done?: () => void) {
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: panelWidth,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMounted(false)
      done?.()
    })
  }

  function handleDismiss() {
    if (!visible) return
    closePanel(onClose)
  }

  function handleAction(action: () => void) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    closePanel(() => {
      onClose()
      action()
    })
  }

  if (!isMounted) return null

  return (
    <AppModal visible transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            {
              width: panelWidth,
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="settings-outline" size={20} color="#f0abfc" />
              <Text style={styles.headerTitle}>Configurações</Text>
            </View>
            <Pressable
              onPress={handleDismiss}
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Fechar configurações"
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 16) + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.group}>
              <Text style={styles.groupLabel}>Rotina mínima</Text>
              <View style={styles.groupCard}>
                <MetaRow label="Essenciais" value={`${essentialsCount} de 5`} last />
              </View>
              <MenuRow label="Editar essenciais" onPress={() => handleAction(onOpenEssentials)} />
            </View>

            <View style={styles.group}>
              <Text style={styles.groupLabel}>Preferências</Text>
              <View style={styles.groupCard}>
                <MetaRow label="Notificações" value={preferencesSummary.notifications} />
                <MetaRow label="Estilo de horário" value={preferencesSummary.schedule} />
                <MetaRow label="Intensidade" value={preferencesSummary.intensity} last />
              </View>
              <MenuRow label="Editar preferências" onPress={() => handleAction(onOpenPreferences)} />
            </View>

            <View style={styles.group}>
              <Text style={styles.groupLabel}>Ajustar plano</Text>
              <MenuRow
                label="Refazer onboarding parcial"
                onPress={() => handleAction(onOpenRefresh)}
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.groupLabel}>Privacidade e ajuda</Text>
              <View style={styles.groupCard}>
                <MenuRow
                  label="Como funciona"
                  onPress={() => handleAction(onOpenHowItWorks)}
                  embedded
                />
                <MenuRow
                  label="Privacidade"
                  onPress={() => handleAction(onOpenPrivacy)}
                  embedded
                  last
                />
              </View>
            </View>

            <View style={styles.group}>
              <Text style={styles.groupLabel}>Zona de risco</Text>
              <Pressable
                onPress={() => handleAction(onRequestFullReset)}
                style={({ pressed }) => [styles.dangerRow, pressed && styles.pressed]}
              >
                <Ionicons name="refresh-outline" size={16} color="#fca5a5" />
                <Text style={styles.dangerText}>Recomeçar do zero</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </AppModal>
  )
}

function MetaRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={[styles.metaRow, !last && styles.metaRowBorder]}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  )
}

function MenuRow({
  label,
  onPress,
  embedded = false,
  last = false,
}: {
  label: string
  onPress: () => void
  embedded?: boolean
  last?: boolean
}) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        embedded && styles.menuRowEmbedded,
        embedded && !last && styles.menuRowBorder,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.menuRowText}>{label}</Text>
      <Ionicons name="chevron-forward" size={15} color={colors.textSubtle} />
    </Pressable>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  root: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  panel: {
    flex: 1,
    maxWidth: '100%',
    backgroundColor: drawerChrome.surface,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderRightWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 28,
  },
  group: { gap: 8 },
  groupLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  groupCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metaRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  metaValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 70, 239, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.18)',
  },
  menuRowEmbedded: {
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  menuRowText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  dangerText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: { opacity: 0.86 },
}
}

