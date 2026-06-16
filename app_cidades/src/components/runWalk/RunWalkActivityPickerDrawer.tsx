import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { TODAY_ACTIVITY_PRESETS } from '../../data/mockRunWalk'
import { colors } from '../../theme/colors'
import type { TodayActivityPreset, TodayActivityPresetId } from '../../types/runWalk'
import { RunWalkSheetDrawer } from './RunWalkSheetDrawer'

type RunWalkActivityPickerDrawerProps = {
  visible: boolean
  onClose: () => void
  onPreview: (presetId: TodayActivityPresetId) => void
}

const LEVEL_LABELS: Record<TodayActivityPreset['level'], string> = {
  simple: 'Simples',
  moderate: 'Moderada',
  advanced: 'Avançada',
}

const LEVEL_COLORS: Record<TodayActivityPreset['level'], string> = {
  simple: '#6ee7b7',
  moderate: '#93c5fd',
  advanced: '#fca5a5',
}

function getPresetIcon(id: TodayActivityPresetId) {
  if (id === 'easy-run') return 'run-fast'
  if (id === 'beginner-run-walk') return 'run'
  if (id === 'recovery-walk') return 'yoga'
  if (id === 'quick-activity') return 'lightning-bolt'
  return 'walk'
}

export function RunWalkActivityPickerDrawer({
  visible,
  onClose,
  onPreview,
}: RunWalkActivityPickerDrawerProps) {
  function handlePreview(id: TodayActivityPresetId) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPreview(id)
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Atividade de hoje"
      subtitle="Do mais simples ao mais completo — escolha o que faz sentido agora"
      onClose={onClose}
    >
      <View style={styles.list}>
        {TODAY_ACTIVITY_PRESETS.map((preset) => (
          <Pressable
            key={preset.id}
            onPress={() => handlePreview(preset.id)}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            accessibilityRole="button"
            accessibilityLabel={preset.title}
          >
            <View style={styles.iconWrap}>
              <LinearGradient
                colors={['rgba(255, 133, 51, 0.9)', 'rgba(255, 107, 0, 0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <MaterialCommunityIcons
                  name={getPresetIcon(preset.id)}
                  size={18}
                  color="#fff"
                />
              </LinearGradient>
            </View>

            <View style={styles.textCol}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{preset.title}</Text>
                <View
                  style={[
                    styles.levelBadge,
                    { borderColor: `${LEVEL_COLORS[preset.level]}44` },
                  ]}
                >
                  <Text style={[styles.levelText, { color: LEVEL_COLORS[preset.level] }]}>
                    {LEVEL_LABELS[preset.level]}
                  </Text>
                </View>
              </View>
              <Text style={styles.subtitle}>{preset.subtitle}</Text>
            </View>

            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSubtle} />
          </Pressable>
        ))}
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
    paddingBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionPressed: {
    opacity: 0.88,
  },
  iconWrap: {
    shadowColor: 'rgba(255, 107, 0, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  iconGradient: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  levelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
  },
  levelText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
})
