import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MODALITY_OPTIONS } from '../../data/runWalkModalityConfig'
import { clearPreparationDraft } from '../../data/runWalkPreparationDraftStorage'
import { colors } from '../../theme/colors'
import type { ActivityModality } from '../../types/auth'
import { RunWalkSheetDrawer } from './RunWalkSheetDrawer'

type RunWalkModalityDrawerProps = {
  visible: boolean
  onClose: () => void
  onSelect: (modality: ActivityModality) => void
}

export function RunWalkModalityDrawer({
  visible,
  onClose,
  onSelect,
}: RunWalkModalityDrawerProps) {
  function handleSelect(modality: ActivityModality) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    void clearPreparationDraft()
    onSelect(modality)
    onClose()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Iniciar atividade"
      subtitle="Escolha a modalidade. Na sequência, você verá a tela de preparação."
      onClose={onClose}
    >
      <View style={styles.list}>
        {MODALITY_OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => handleSelect(option.id)}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            accessibilityRole="button"
            accessibilityLabel={option.label}
          >
            <LinearGradient
              colors={['rgba(255, 133, 51, 0.85)', 'rgba(255, 107, 0, 0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <MaterialCommunityIcons name={option.icon} size={22} color="#fff" />
            </LinearGradient>

            <View style={styles.textCol}>
              <Text style={styles.optionTitle}>{option.label}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>

            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSubtle} />
          </Pressable>
        ))}
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionPressed: {
    opacity: 0.88,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  optionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
})
