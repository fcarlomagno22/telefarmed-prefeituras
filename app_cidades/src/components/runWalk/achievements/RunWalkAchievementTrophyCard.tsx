import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { RunWalkAchievement } from '../../../types/runWalkAchievements'
import { formatAchievementDateShort } from '../../../utils/runWalkAchievementsUtils'
import { RunWalkAchievementMedalMark } from './RunWalkAchievementMedalMark'

type RunWalkAchievementTrophyCardProps = {
  achievement: RunWalkAchievement
  onPress: () => void
  featured?: boolean
}

export function RunWalkAchievementTrophyCard({
  achievement,
  onPress,
  featured = false,
}: RunWalkAchievementTrophyCardProps) {
  const locked = !achievement.unlocked
  const dateLabel = formatAchievementDateShort(achievement.unlockedAt)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={achievement.title}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={
          locked
            ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
            : [`${achievement.accentColor}30`, 'rgba(14, 14, 20, 0.98)', 'rgba(10, 10, 12, 0.98)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          locked ? styles.cardLocked : styles.cardUnlocked,
          featured && styles.cardFeatured,
          !locked && { borderColor: `${achievement.accentColor}44` },
        ]}
      >
        {!locked ? (
          <LinearGradient
            colors={['rgba(255,255,255,0.12)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGloss}
            pointerEvents="none"
          />
        ) : null}

        <View style={styles.leftCol}>
          <View style={styles.medalWrap}>
            <RunWalkAchievementMedalMark
              accentColor={achievement.accentColor}
              icon={achievement.icon}
              locked={locked}
              size="lg"
              showGlow={!locked}
            />

            {locked ? (
              <View style={styles.lockBadge}>
                <MaterialCommunityIcons name="lock" size={11} color="#fff" />
              </View>
            ) : (
              <View style={[styles.unlockedBadge, { backgroundColor: achievement.accentColor }]}>
                <MaterialCommunityIcons name="check-bold" size={11} color="#0a0a0c" />
              </View>
            )}
          </View>
        </View>

        <View style={styles.contentCol}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, locked && styles.titleLocked]}
              numberOfLines={featured ? 2 : 1}
            >
              {achievement.title}
            </Text>
            {!locked && dateLabel ? (
              <View style={styles.dateChip}>
                <Text style={styles.dateChipText}>{dateLabel}</Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.meaning, locked && styles.meaningLocked]} numberOfLines={2}>
            {achievement.meaning}
          </Text>

          <View style={styles.footerRow}>
            <Text style={[styles.status, locked && styles.statusLocked]}>
              {locked ? 'Ainda bloqueada' : 'Conquistada'}
            </Text>
            {achievement.relatedActivity && !locked ? (
              <Text style={styles.activity} numberOfLines={1}>
                {achievement.relatedActivity}
              </Text>
            ) : null}
          </View>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={locked ? colors.textSubtle : achievement.accentColor}
        />
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  cardUnlocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  cardLocked: {
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardFeatured: {
    paddingVertical: 14,
  },
  cardGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  leftCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.95)',
    borderWidth: 2,
    borderColor: '#0a0a0c',
  },
  unlockedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0a0a0c',
  },
  contentCol: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  titleLocked: {
    color: colors.textMuted,
  },
  dateChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.24)',
  },
  dateChipText: {
    color: '#fde68a',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  meaning: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  meaningLocked: {
    color: colors.textSubtle,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  status: {
    color: '#fde68a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statusLocked: {
    color: colors.textSubtle,
  },
  activity: {
    flex: 1,
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'right',
  },
})
