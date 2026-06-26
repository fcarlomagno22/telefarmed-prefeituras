import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { getSleepSoundById } from '../../config/sleepSounds'
import { colors } from '../../theme/colors'
import type { SleepSoundId } from '../../types/sleepTime'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { SleepTimeSoundVolumeControls } from './SleepTimeSoundVolumeControls'
import { SleepTimeStarfield } from './SleepTimeStarfield'
import type { SleepTimerMinutes } from './sleepTimeSoundTypes'

type SleepTimeSoundPlayerDrawerProps = {
  visible: boolean
  soundId: SleepSoundId | null
  volume: number
  timerMinutes: SleepTimerMinutes
  timerRemainingSeconds: number | null
  onVolumeDecrease: () => void
  onVolumeIncrease: () => void
  onTimerSelect: (value: SleepTimerMinutes) => void
  onDismiss: () => void
  onStop: () => void
}

const TIMER_OPTIONS: { label: string; value: SleepTimerMinutes }[] = [
  { label: 'Sem timer', value: null },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
]

function formatTimerRemaining(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function SleepTimeSoundPlayerDrawer({
  visible,
  soundId,
  volume,
  timerMinutes,
  timerRemainingSeconds,
  onVolumeDecrease,
  onVolumeIncrease,
  onTimerSelect,
  onDismiss,
  onStop,
}: SleepTimeSoundPlayerDrawerProps) {
  const sound = soundId ? getSleepSoundById(soundId) : null
  const accentColor = sound?.palette.iconGradient[1] ?? '#6366f1'

  const subtitle = useMemo(() => {
    if (timerRemainingSeconds != null) {
      return `Timer · ${formatTimerRemaining(timerRemainingSeconds)} restantes`
    }
    return 'Reprodução contínua com transição suave'
  }, [timerRemainingSeconds])

  function handleDismiss() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onDismiss()
  }

  function handleStop() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onStop()
  }

  function handleTimerSelect(value: SleepTimerMinutes) {
    void Haptics.selectionAsync()
    onTimerSelect(value)
  }

  if (!sound) return null

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={sound.title}
      subtitle={subtitle}
      onClose={handleDismiss}
      fullScreen
      scrollable={false}
      keyboardAware={false}
      extraBottomInset={12}
      sheetBackground={
        <>
          <LinearGradient
            colors={['#070812', '#0a0a14', '#050508']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <SleepTimeStarfield active={visible} />
        </>
      }
      footer={
        <Pressable
          onPress={handleStop}
          style={({ pressed }) => [styles.stopButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Encerrar"
        >
          <Text style={styles.stopButtonText}>Encerrar</Text>
        </Pressable>
      }
    >
      <View style={styles.content}>
        <View style={styles.hero}>
          <MaterialCommunityIcons name={sound.icon} size={56} color={accentColor} />
          <Text style={styles.heroTitle}>{sound.title}</Text>
          <Text style={styles.heroSubtitle}>Deixe o som envolver você até adormecer</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Volume</Text>
          <SleepTimeSoundVolumeControls
            volume={volume}
            accentColor={accentColor}
            onDecrease={onVolumeDecrease}
            onIncrease={onVolumeIncrease}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Timer opcional</Text>
          <View style={styles.timerRow}>
            {TIMER_OPTIONS.map((option) => {
              const active = timerMinutes === option.value

              return (
                <Pressable
                  key={option.label}
                  onPress={() => handleTimerSelect(option.value)}
                  style={({ pressed }) => [
                    styles.timerChip,
                    active && [styles.timerChipActive, { borderColor: `${accentColor}88` }],
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  {active ? (
                    <LinearGradient
                      colors={[`${accentColor}33`, `${accentColor}14`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  ) : null}
                  <Text style={[styles.timerChipLabel, active && { color: colors.text }]}>
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 28,
    paddingTop: 12,
  },
  hero: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 8,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timerChip: {
    minWidth: '47%',
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  timerChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  timerChipLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  stopButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.86,
  },
})
