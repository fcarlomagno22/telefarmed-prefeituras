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
import { colors } from '../../theme/colors'
import { drawerChrome } from '../../theme/drawerChrome'
import { AppModal } from '../AppModal'

type CarePreferencesSummary = {
  focus: string[]
  frequency: string
  spirituality: string
}

type MentalHealthSettingsDrawerProps = {
  visible: boolean
  onClose: () => void
  preferences: CarePreferencesSummary
  initialAnamnesisPercent: number
  extendedAnamnesisPercent: number
  extendedAnamnesisComplete: boolean
  onEditPreferences: () => void
  onContinueExtendedAnamnesis: () => void
  onOpenHowItWorks: () => void
  onOpenPrivacyPolicy: () => void
  onOpenCrisisSupport: () => void
}

export function MentalHealthSettingsDrawer({
  visible,
  onClose,
  preferences,
  initialAnamnesisPercent,
  extendedAnamnesisPercent,
  extendedAnamnesisComplete,
  onEditPreferences,
  onContinueExtendedAnamnesis,
  onOpenHowItWorks,
  onOpenPrivacyPolicy,
  onOpenCrisisSupport,
}: MentalHealthSettingsDrawerProps) {
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
            <Text style={styles.headerTitle}>Configurações</Text>
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
              <Text style={styles.groupLabel}>Perfil de cuidado</Text>
              <View style={styles.groupCard}>
                <MetaRow label="Focos" value={preferences.focus.join(' · ') || '—'} />
                <MetaRow label="Frequência" value={preferences.frequency} />
                <MetaRow label="Espiritualidade" value={preferences.spirituality} last />
              </View>
              <MenuRow label="Editar preferências" onPress={() => handleAction(onEditPreferences)} />
            </View>

            <View style={styles.group}>
              <Text style={styles.groupLabel}>Conhecer você</Text>
              <Text style={styles.groupHint}>
                Perguntas que personalizam suas atividades.{' '}
                {initialAnamnesisPercent}% iniciais · {extendedAnamnesisPercent}% ampliado.
              </Text>
              {!extendedAnamnesisComplete ? (
                <MenuRow
                  label="Continuar perguntas"
                  onPress={() => handleAction(onContinueExtendedAnamnesis)}
                />
              ) : (
                <Text style={styles.doneNote}>Perfil ampliado concluído.</Text>
              )}
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
                  label="Política de privacidade"
                  onPress={() => handleAction(onOpenPrivacyPolicy)}
                  embedded
                />
                <MenuRow
                  label="Opções de apoio"
                  onPress={() => handleAction(onOpenCrisisSupport)}
                  embedded
                  last
                />
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </AppModal>
  )
}

function MetaRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
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

const styles = StyleSheet.create({
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
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  groupHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  groupCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  metaRow: {
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  metaRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  metaLabel: {
    color: colors.textSubtle,
    fontSize: 11,
  },
  metaValue: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  menuRowEmbedded: {
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  menuRowText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  doneNote: {
    color: colors.textMuted,
    fontSize: 13,
    paddingHorizontal: 2,
  },
  pressed: { opacity: 0.7 },
})
