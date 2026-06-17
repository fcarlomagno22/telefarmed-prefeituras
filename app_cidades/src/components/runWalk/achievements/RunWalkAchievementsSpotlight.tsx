import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { RunWalkAchievement } from '../../../types/runWalkAchievements'
import { formatAchievementDateShort } from '../../../utils/runWalkAchievementsUtils'
import { RunWalkAchievementMedalMark } from './RunWalkAchievementMedalMark'

type RunWalkAchievementsSpotlightProps = {
  achievements: RunWalkAchievement[]
  onPress: (achievementId: string) => void
}

const CARD_HEIGHT = 188

export function RunWalkAchievementsSpotlight({
  achievements,
  onPress,
}: RunWalkAchievementsSpotlightProps) {
  if (achievements.length === 0) return null

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Brilho recente</Text>
        <Text style={styles.sectionHint}>Suas últimas medalhas</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
      >
        {achievements.map((achievement) => (
          <Pressable
            key={achievement.id}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onPress(achievement.id)
            }}
            style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}
          >
            <LinearGradient
              colors={[`${achievement.accentColor}55`, 'rgba(14, 14, 20, 0.98)', '#0a0a0c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, { borderColor: `${achievement.accentColor}55` }]}
            >
              <View style={styles.cardTop}>
                <RunWalkAchievementMedalMark
                  accentColor={achievement.accentColor}
                  icon={achievement.icon}
                  size="md"
                  showGlow
                />

                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Nova</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.title} numberOfLines={2}>
                  {achievement.title}
                </Text>
                <Text style={styles.date}>
                  {formatAchievementDateShort(achievement.unlockedAt) ?? 'Conquistada'}
                </Text>
                <Text style={styles.activity} numberOfLines={1}>
                  {achievement.relatedActivity ?? 'Atividade registrada'}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  header: {
    paddingHorizontal: 4,
    gap: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  carousel: {
    gap: 12,
    paddingRight: 4,
  },
  cardPressable: {
    width: 220,
    height: CARD_HEIGHT,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 76,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.28)',
  },
  badgeText: {
    color: '#fde68a',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
    minHeight: 36,
  },
  date: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: '700',
  },
  activity: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
})
