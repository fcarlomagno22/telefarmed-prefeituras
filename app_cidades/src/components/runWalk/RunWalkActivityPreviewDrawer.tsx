import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { getTodayActivityPreset } from '../../data/mockRunWalk'
import { colors } from '../../theme/colors'
import type { TodayActivityPresetId } from '../../types/runWalk'
import { RunWalkActivityDetailContent } from './RunWalkActivityDetailContent'
import { RunWalkSheetDrawer } from './RunWalkSheetDrawer'

const BUTTON_HEIGHT = 52
const BUTTON_RADIUS = 16
const FOOTER_HORIZONTAL_PADDING = 20
const FOOTER_GAP = 10

type RunWalkActivityPreviewDrawerProps = {
  visible: boolean
  presetId: TodayActivityPresetId | null
  onClose: () => void
  onAccept: (presetId: TodayActivityPresetId) => void
  onChange: () => void
}

export function RunWalkActivityPreviewDrawer({
  visible,
  presetId,
  onClose,
  onAccept,
  onChange,
}: RunWalkActivityPreviewDrawerProps) {
  const { width: screenWidth } = useWindowDimensions()
  const buttonWidth =
    (screenWidth - FOOTER_HORIZONTAL_PADDING * 2 - FOOTER_GAP) / 2

  if (!presetId) return null

  const preset = getTodayActivityPreset(presetId)

  function handleAccept() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onAccept(preset.id)
  }

  function handleChange() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Atividade de hoje"
      subtitle="Revise o treino antes de confirmar"
      onClose={onClose}
      fullScreen
      footer={
        <View style={styles.footer}>
          <Pressable
            onPress={handleChange}
            style={({ pressed }) => [
              styles.footerButton,
              { width: buttonWidth },
              styles.changeButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Trocar atividade"
          >
            <Text style={styles.changeButtonText}>Trocar atividade</Text>
          </Pressable>

          <Pressable
            onPress={handleAccept}
            style={({ pressed }) => [
              styles.footerButton,
              { width: buttonWidth },
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Aceitar"
          >
            <LinearGradient
              colors={['#ff8533', '#ff6b00', '#e55f00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.acceptGradient}
            >
              <Text style={styles.acceptButtonText}>Aceitar</Text>
            </LinearGradient>
          </Pressable>
        </View>
      }
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{preset.title}</Text>
        <Text style={styles.heroSubtitle}>{preset.subtitle}</Text>
      </View>

      <RunWalkActivityDetailContent activity={preset.activity} />
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  heroCard: {
    gap: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.28)',
    marginBottom: 4,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: FOOTER_GAP,
    paddingBottom: 4,
    width: '100%',
  },
  footerButton: {
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    overflow: 'hidden',
  },
  changeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  acceptGradient: {
    width: '100%',
    height: BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  changeButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
})
