import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { SleepSoundId } from '../../types/sleepTime'
import { NeonSectionDivider } from '../NeonSectionDivider'
import { SleepTimeBreathingCard } from './SleepTimeBreathingCard'
import { SleepTimeSoundGrid } from './SleepTimeSoundGrid'
import { SleepTimeStoriesCard } from './SleepTimeStoriesCard'

type SleepTimeGeneralTabProps = {
  bottomPadding: number
  activeSoundId: SleepSoundId | null
  onSoundPress: (soundId: SleepSoundId) => void
  onSoundsInfoPress: () => void
  onBreathingPress: () => void
  onStoriesPress: () => void
}

export function SleepTimeGeneralTab({
  bottomPadding,
  activeSoundId,
  onSoundPress,
  onSoundsInfoPress,
  onBreathingPress,
  onStoriesPress,
}: SleepTimeGeneralTabProps) {
  function handleInfoPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSoundsInfoPress()
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sons para dormir</Text>
          <Pressable
            onPress={handleInfoPress}
            style={({ pressed }) => [styles.infoBtn, pressed && styles.infoBtnPressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Como os sons ajudam a dormir"
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <SleepTimeSoundGrid activeSoundId={activeSoundId} onSoundPress={onSoundPress} />
      </View>

      <NeonSectionDivider />

      <SleepTimeBreathingCard onPress={onBreathingPress} />

      <SleepTimeStoriesCard onPress={onStoriesPress} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
    ...Platform.select({
      web: {
        overflowY: 'auto',
        overflowX: 'hidden',
      },
      default: {},
    }),
  },
  content: {
    gap: 14,
    paddingTop: 4,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  infoBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnPressed: {
    opacity: 0.72,
  },
})
