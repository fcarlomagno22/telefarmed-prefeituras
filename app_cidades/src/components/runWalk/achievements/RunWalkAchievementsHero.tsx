import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { RunWalkProgressRing } from '../RunWalkProgressRing'
import { colors } from '../../../theme/colors'

const HERO_SPARKLES = [
  { top: '12%', left: '8%', size: 4 },
  { top: '22%', left: '78%', size: 3 },
  { top: '68%', left: '14%', size: 3 },
  { top: '58%', left: '88%', size: 4 },
  { top: '38%', left: '92%', size: 2 },
] as const

function HeroSparkles() {
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ]),
    )

    animation.start()
    return () => animation.stop()
  }, [pulse])

  return (
    <View style={styles.sparkleLayer} pointerEvents="none">
      {HERO_SPARKLES.map((sparkle, index) => (
        <Animated.View
          key={`${sparkle.left}-${sparkle.top}`}
          style={[
            styles.sparkleDot,
            {
              top: sparkle.top,
              left: sparkle.left,
              width: sparkle.size,
              height: sparkle.size,
              borderRadius: sparkle.size / 2,
              opacity: pulse.interpolate({
                inputRange: [0, 0.4 + (index % 3) * 0.15, 1],
                outputRange: [0.15, 1, 0.15],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      ))}
    </View>
  )
}

type RunWalkAchievementsHeroProps = {
  unlockedCount: number
  totalCount: number
  lockedCount: number
  categoryCount: number
}

export function RunWalkAchievementsHero({
  unlockedCount,
  totalCount,
  lockedCount,
  categoryCount,
}: RunWalkAchievementsHeroProps) {
  const progress = totalCount > 0 ? unlockedCount / totalCount : 0

  return (
    <LinearGradient
      colors={['rgba(251, 191, 36, 0.22)', 'rgba(14, 14, 20, 0.98)', 'rgba(168, 85, 247, 0.14)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.04)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
        style={styles.gloss}
        pointerEvents="none"
      />

      <HeroSparkles />

      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Sua vitrine</Text>
          <Text style={styles.title}>Cada medalha conta uma história</Text>
          <Text style={styles.subtitle}>
            Caminhadas, corridas, consistência e saúde — tudo em um só lugar.
          </Text>
        </View>

        <RunWalkProgressRing
          progress={progress}
          value={`${unlockedCount}/${totalCount}`}
          label="conquistas"
          size={92}
          stroke={6}
          gradientId="achievements-hero-ring"
          gradientColors={['#fde68a', '#f59e0b', '#d97706']}
          animate
          countTo={unlockedCount}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <MaterialCommunityIcons name="medal" size={16} color="#fde68a" />
          <Text style={styles.statValue}>{unlockedCount}</Text>
          <Text style={styles.statLabel}>Conquistadas</Text>
        </View>

        <View style={styles.statPill}>
          <MaterialCommunityIcons name="lock-outline" size={16} color="#c4b5fd" />
          <Text style={styles.statValue}>{lockedCount}</Text>
          <Text style={styles.statLabel}>Bloqueadas</Text>
        </View>

        <View style={styles.statPill}>
          <MaterialCommunityIcons name="view-list-outline" size={16} color="#6ee7b7" />
          <Text style={styles.statValue}>{categoryCount}</Text>
          <Text style={styles.statLabel}>Trilhas</Text>
        </View>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.28)',
    padding: 16,
    gap: 14,
    overflow: 'hidden',
  },
  gloss: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkleLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkleDot: {
    position: 'absolute',
    backgroundColor: '#fde68a',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
})
