import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View, type ReactNode } from 'react-native'
import { colors } from '../theme/colors'

type ScreenStackHeaderProps = {
  title: string
  subtitle: string
  paddingTop: number
  onBack: () => void
  backAccessibilityLabel?: string
  onSettingsPress?: () => void
  settingsAccessibilityLabel?: string
  headerRight?: ReactNode
}

export function ScreenStackHeader({
  title,
  subtitle,
  paddingTop,
  onBack,
  backAccessibilityLabel = 'Voltar',
  onSettingsPress,
  settingsAccessibilityLabel = 'Configurações',
  headerRight,
}: ScreenStackHeaderProps) {
  function handleBack() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onBack()
  }

  function handleSettings() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSettingsPress?.()
  }

  return (
    <View style={[styles.header, { paddingTop }]}>
      <Pressable
        onPress={handleBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel={backAccessibilityLabel}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>

      <View style={styles.headerTextCol}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>

      {headerRight ? (
        <View style={styles.headerRight}>{headerRight}</View>
      ) : onSettingsPress ? (
        <Pressable
          onPress={handleSettings}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={settingsAccessibilityLabel}
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </Pressable>
      ) : (
        <View style={styles.headerPlaceholder} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerPlaceholder: {
    width: 40,
    height: 40,
  },
  headerRight: {
    minHeight: 40,
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.82,
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
})
