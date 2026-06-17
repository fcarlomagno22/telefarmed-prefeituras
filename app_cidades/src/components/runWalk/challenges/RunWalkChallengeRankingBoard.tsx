import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type {
  RunWalkChallengeRankingBoard,
  RunWalkChallengeRankingEntry,
} from '../../../types/runWalkChallenges'

type RunWalkChallengeRankingBoardProps = {
  board: RunWalkChallengeRankingBoard
  currentUserPhotoUri?: string | null
  onCalendarPress: () => void
}

type PodiumMedalRank = 1 | 2 | 3

const PODIUM_MEDALS: Record<
  PodiumMedalRank,
  {
    label: string
    gradient: readonly [string, string, string]
    pedestalGradient: readonly [string, string, string, string]
    pedestalBorder: string
    glow: string
    pedestalHeight: number
    avatarSize: number
  }
> = {
  1: {
    label: '1º',
    gradient: ['#fde68a', '#f59e0b', '#b45309'],
    pedestalGradient: ['#fff7cc', '#fde047', '#f59e0b', '#b45309'],
    pedestalBorder: 'rgba(251, 191, 36, 0.55)',
    glow: 'rgba(245, 158, 11, 0.45)',
    pedestalHeight: 88,
    avatarSize: 52,
  },
  2: {
    label: '2º',
    gradient: ['#f8fafc', '#cbd5e1', '#64748b'],
    pedestalGradient: ['#ffffff', '#e2e8f0', '#94a3b8', '#475569'],
    pedestalBorder: 'rgba(148, 163, 184, 0.5)',
    glow: 'rgba(148, 163, 184, 0.4)',
    pedestalHeight: 76,
    avatarSize: 46,
  },
  3: {
    label: '3º',
    gradient: ['#fdba74', '#ea580c', '#9a3412'],
    pedestalGradient: ['#ffedd5', '#fb923c', '#ea580c', '#9a3412'],
    pedestalBorder: 'rgba(234, 88, 12, 0.48)',
    glow: 'rgba(234, 88, 12, 0.38)',
    pedestalHeight: 68,
    avatarSize: 44,
  },
}

const GOLD_PEDESTAL_SPARKLES = [
  { top: '14%', left: '18%', size: 5 },
  { top: '28%', left: '68%', size: 4 },
  { top: '46%', left: '34%', size: 3 },
  { top: '58%', left: '78%', size: 4 },
  { top: '22%', left: '48%', size: 3 },
  { top: '68%', left: '22%', size: 5 },
  { top: '52%', left: '58%', size: 2 },
] as const

const PODIUM_ORDER: PodiumMedalRank[] = [2, 1, 3]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function GoldPedestalSparkles() {
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    )

    animation.start()
    return () => animation.stop()
  }, [pulse])

  return (
    <View style={styles.sparkleLayer} pointerEvents="none">
      {GOLD_PEDESTAL_SPARKLES.map((sparkle, index) => (
          <Animated.View
            key={`${sparkle.left}-${sparkle.top}-${index}`}
            style={[
              styles.sparkleDot,
              {
                top: sparkle.top,
                left: sparkle.left,
                width: sparkle.size,
                height: sparkle.size,
                borderRadius: sparkle.size / 2,
                opacity: pulse.interpolate({
                  inputRange: [0, 0.45 + (index % 4) * 0.12, 1],
                  outputRange: [0.18, 1, 0.18],
                  extrapolate: 'clamp',
                }),
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.65, sparkle.size > 3 ? 1.2 : 1.05, 0.65],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
    </View>
  )
}

function RankingProfileAvatar({
  name,
  uri,
  size,
  borderColor,
}: {
  name: string
  uri?: string | null
  size: number
  borderColor: string
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const trimmedUri = uri?.trim()
  const showPhoto = Boolean(trimmedUri) && !imageFailed

  return (
    <View
      style={[
        styles.avatarRing,
        {
          width: size + 6,
          height: size + 6,
          borderRadius: (size + 6) / 2,
          borderColor,
        },
      ]}
    >
      {showPhoto ? (
        <Image
          source={{ uri: trimmedUri! }}
          style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
          contentFit="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View
          style={[
            styles.avatarFallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.avatarInitials, { fontSize: size * 0.34 }]}>{getInitials(name)}</Text>
        </View>
      )}
    </View>
  )
}

function PodiumSlot({
  entry,
  photoUri,
}: {
  entry: RunWalkChallengeRankingEntry
  photoUri?: string | null
}) {
  const medal = PODIUM_MEDALS[entry.rank as PodiumMedalRank]
  const avatarOverlap = Math.round(medal.avatarSize * 0.42)

  return (
    <View style={styles.podiumSlot}>
      <View style={[styles.medalHeroShadow, { shadowColor: medal.glow }]}>
        <LinearGradient colors={[...medal.gradient]} style={styles.medalHero}>
          <MaterialCommunityIcons name="medal" size={28} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={styles.podiumName} numberOfLines={1}>
        {entry.name}
      </Text>
      <Text style={styles.podiumDetail} numberOfLines={1}>
        {entry.detail}
      </Text>
      <Text style={styles.podiumScore}>{entry.scoreLabel}</Text>

      <View style={styles.pedestalWrap}>
        <View style={[styles.pedestalAvatarWrap, { marginBottom: -avatarOverlap }]}>
          <RankingProfileAvatar
            name={entry.name}
            uri={photoUri ?? entry.avatarUri}
            size={medal.avatarSize}
            borderColor={`${medal.gradient[0]}cc`}
          />
        </View>

        <LinearGradient
          colors={[...medal.pedestalGradient]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            styles.pedestal,
            {
              height: medal.pedestalHeight,
              paddingTop: avatarOverlap + 8,
              borderColor: medal.pedestalBorder,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.34)', 'rgba(255,255,255,0.08)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.55 }}
            style={styles.pedestalGloss}
            pointerEvents="none"
          />

          {entry.rank === 1 ? <GoldPedestalSparkles /> : null}

          <Text style={styles.pedestalRank}>{medal.label}</Text>
        </LinearGradient>
      </View>
    </View>
  )
}

function RankingRow({
  entry,
  photoUri,
  highlighted = false,
  showDivider = true,
}: {
  entry: RunWalkChallengeRankingEntry
  photoUri?: string | null
  highlighted?: boolean
  showDivider?: boolean
}) {
  return (
    <View
      style={[
        styles.row,
        highlighted && styles.rowHighlighted,
        showDivider && styles.rowDivider,
      ]}
    >
      <Text style={[styles.rowRankLabel, highlighted && styles.rowRankLabelHighlighted]}>
        {entry.rank}º
      </Text>

      <RankingProfileAvatar
        name={entry.name}
        uri={photoUri ?? entry.avatarUri}
        size={36}
        borderColor={highlighted ? 'rgba(236, 72, 153, 0.55)' : 'rgba(255, 255, 255, 0.16)'}
      />

      <View style={styles.rowTextCol}>
        <View style={styles.rowTitleLine}>
          <Text style={[styles.rowName, highlighted && styles.rowNameHighlighted]} numberOfLines={1}>
            {entry.name}
          </Text>
          {highlighted ? (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>Você</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.rowDetail} numberOfLines={1}>
          {entry.detail}
        </Text>
      </View>

      <Text style={[styles.rowScore, highlighted && styles.rowScoreHighlighted]}>
        {entry.scoreLabel}
      </Text>
    </View>
  )
}

function RankingGap() {
  return (
    <View style={styles.gapWrap}>
      <View style={styles.gapLine} />
      <Text style={styles.gapDots}>• • •</Text>
      <View style={styles.gapLine} />
    </View>
  )
}

export function RunWalkChallengeRankingBoardView({
  board,
  currentUserPhotoUri,
  onCalendarPress,
}: RunWalkChallengeRankingBoardProps) {
  const podiumEntries = PODIUM_ORDER.map(
    (rank) => board.top10.find((entry) => entry.rank === rank)!,
  )
  const restOfTop10 = board.top10.filter((entry) => entry.rank > 3)
  const userInTop10 = board.top10.some((entry) => entry.rank === board.currentUser.rank)

  function resolveEntryPhoto(entry: RunWalkChallengeRankingEntry) {
    if (entry.id === board.currentUser.id) {
      return currentUserPhotoUri ?? entry.avatarUri
    }

    return entry.avatarUri
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Ranking</Text>
          <Text style={styles.headerPeriod}>{board.periodLabel}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escolher período do ranking"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            onCalendarPress()
          }}
          style={({ pressed }) => [styles.calendarButton, pressed && styles.calendarButtonPressed]}
        >
          <Ionicons name="calendar-outline" size={20} color="#fbcfe8" />
        </Pressable>
      </View>

      <View style={styles.podiumCard}>
        <Text style={styles.sectionLabel}>Pódio</Text>
        <View style={styles.podiumRow}>
          {podiumEntries.map((entry) => (
            <PodiumSlot key={entry.id} entry={entry} photoUri={resolveEntryPhoto(entry)} />
          ))}
        </View>
      </View>

      <View style={[styles.listCard, !userInTop10 && styles.listCardWithUserTail]}>
        <Text style={styles.sectionLabel}>Classificação geral</Text>

        {restOfTop10.map((entry, index) => (
          <RankingRow
            key={entry.id}
            entry={entry}
            photoUri={resolveEntryPhoto(entry)}
            highlighted={entry.rank === board.currentUser.rank}
            showDivider={index < restOfTop10.length - 1 || !userInTop10}
          />
        ))}

        {!userInTop10 ? (
          <>
            <RankingGap />
            <RankingRow
              entry={board.currentUser}
              photoUri={resolveEntryPhoto(board.currentUser)}
              highlighted
              showDivider={false}
            />
          </>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 4,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerPeriod: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  calendarButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.28)',
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
  },
  calendarButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  podiumCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 10,
    overflow: 'visible',
  },
  sectionLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 6,
    overflow: 'visible',
  },
  podiumSlot: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    overflow: 'visible',
  },
  medalHeroShadow: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  medalHero: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  avatarRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: 'rgba(10, 10, 12, 0.35)',
  },
  avatarImage: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarInitials: {
    color: colors.text,
    fontWeight: '800',
  },
  podiumName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  podiumDetail: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  podiumScore: {
    color: '#fbcfe8',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  pedestalWrap: {
    width: '100%',
    alignItems: 'center',
    overflow: 'visible',
  },
  pedestalAvatarWrap: {
    zIndex: 2,
  },
  pedestal: {
    width: '100%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    overflow: 'hidden',
  },
  pedestalGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkleLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkleDot: {
    position: 'absolute',
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 4,
  },
  pedestalRank: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 14,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  listCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 2,
  },
  listCardWithUserTail: {
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 4,
  },
  rowRankLabel: {
    width: 28,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  rowRankLabelHighlighted: {
    color: '#fbcfe8',
  },
  rowHighlighted: {
    marginHorizontal: -4,
    marginBottom: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.28)',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  rowTextCol: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  rowName: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  rowNameHighlighted: {
    color: '#fff',
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(236, 72, 153, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.35)',
  },
  youBadgeText: {
    color: '#fbcfe8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  rowDetail: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  rowScore: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  rowScoreHighlighted: {
    color: '#fbcfe8',
  },
  gapWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  gapLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  gapDots: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
})
