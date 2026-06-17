import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PrimaryButton } from '../components/PrimaryButton'
import { RunWalkAchievementShareDrawer } from '../components/runWalk/achievements/RunWalkAchievementShareDrawer'
import { RunWalkAchievementMedalMark } from '../components/runWalk/achievements/RunWalkAchievementMedalMark'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { useAuth } from '../contexts/AuthContext'
import {
  getNextRunWalkAchievement,
  getRunWalkAchievementById,
} from '../data/mockRunWalkAchievements'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import { getRunWalkRouteParams } from '../types/auth'
import type { RunWalkAchievement } from '../types/runWalkAchievements'
import { formatAchievementDateShort } from '../utils/runWalkAchievementsUtils'

function formatAchievementDate(isoDate: string | null) {
  if (!isoDate) return 'Ainda não conquistada'

  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

export function RunWalkAchievementDetailScreen() {
  const insets = useSafeAreaInsets()
  const { user, goBack, routeParams } = useAuth()
  const params = getRunWalkRouteParams(routeParams)
  const achievementId = params.achievementId

  const [achievement, setAchievement] = useState<RunWalkAchievement | null>(null)
  const [shareVisible, setShareVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!achievementId) {
      goBack()
      return
    }

    const loaded = getRunWalkAchievementById(achievementId)
    setAchievement(loaded)
    setIsLoading(false)

    if (!loaded) {
      goBack()
    }
  }, [achievementId, goBack])

  useAndroidBackHandler(
    useCallback(() => {
      if (shareVisible) {
        setShareVisible(false)
        return true
      }
      goBack()
      return true
    }, [goBack, shareVisible]),
  )

  if (isLoading || !achievement) {
    return (
      <View style={[styles.loadingRoot, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primaryLight} size="large" />
      </View>
    )
  }

  const nextAchievement = getNextRunWalkAchievement(achievement)
  const userName = user?.name ?? 'Você'
  const locked = !achievement.unlocked
  const shortDate = formatAchievementDateShort(achievement.unlockedAt)

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0a0a0c', '#101018', '#0a0a0c']}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={[
          `${achievement.accentColor}22`,
          'transparent',
          locked ? 'rgba(100, 116, 139, 0.08)' : `${achievement.accentColor}12`,
        ]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScreenStackHeader
        title="Detalhes da conquista"
        subtitle={achievement.title}
        paddingTop={Math.max(insets.top, 12) + 8}
        onBack={goBack}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={
            locked
              ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
              : [`${achievement.accentColor}35`, 'rgba(14, 14, 20, 0.98)', '#0a0a0c']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.heroCard,
            locked ? styles.heroCardLocked : styles.heroCardUnlocked,
            !locked && { borderColor: `${achievement.accentColor}44` },
          ]}
        >
          {!locked ? (
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.5 }}
              style={styles.heroGloss}
              pointerEvents="none"
            />
          ) : null}

          <View style={styles.medalWrap}>
            <RunWalkAchievementMedalMark
              accentColor={achievement.accentColor}
              icon={achievement.icon}
              locked={locked}
              size="xl"
              showGlow={!locked}
            />

            {locked ? (
              <View style={styles.lockBadge}>
                <MaterialCommunityIcons name="lock" size={12} color="#fff" />
              </View>
            ) : (
              <View style={[styles.unlockedBadge, { backgroundColor: achievement.accentColor }]}>
                <MaterialCommunityIcons name="check-bold" size={12} color="#0a0a0c" />
              </View>
            )}
          </View>

          <Text style={[styles.heroTitle, locked && styles.heroTitleLocked]}>
            {achievement.title}
          </Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusChip,
                locked ? styles.statusChipLocked : { borderColor: `${achievement.accentColor}44` },
              ]}
            >
              <MaterialCommunityIcons
                name={locked ? 'lock-outline' : 'medal-outline'}
                size={14}
                color={locked ? colors.textSubtle : achievement.accentColor}
              />
              <Text style={[styles.heroStatus, locked && styles.heroStatusLocked]}>
                {locked ? 'Conquista bloqueada' : 'Conquista desbloqueada'}
              </Text>
            </View>

            {!locked && shortDate ? (
              <View style={styles.dateChip}>
                <Text style={styles.dateChipText}>{shortDate}</Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.heroMeaning, locked && styles.heroMeaningLocked]}>
            {achievement.meaning}
          </Text>
        </LinearGradient>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Informações</Text>
          <DetailRow label="Data" value={formatAchievementDate(achievement.unlockedAt)} />
          <DetailRow
            label="Atividade relacionada"
            value={achievement.relatedActivity ?? 'Será exibida quando você conquistar'}
          />
          <DetailRow
            label="Próxima conquista"
            value={nextAchievement?.title ?? 'Você chegou ao topo desta trilha'}
          />
        </View>

        {nextAchievement && !locked ? (
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.14)', 'rgba(14, 14, 20, 0.98)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextCard}
          >
            <View style={styles.nextIcon}>
              <MaterialCommunityIcons name="target" size={18} color="#93c5fd" />
            </View>
            <View style={styles.nextCopy}>
              <Text style={styles.nextEyebrow}>Próximo alvo</Text>
              <Text style={styles.nextTitle}>{nextAchievement.title}</Text>
            </View>
          </LinearGradient>
        ) : null}
      </ScrollView>

      {achievement.unlocked ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <PrimaryButton label="Compartilhar" onPress={() => setShareVisible(true)} />
        </View>
      ) : null}

      <RunWalkAchievementShareDrawer
        visible={shareVisible}
        achievement={achievement}
        userName={userName}
        onClose={() => setShareVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    gap: 14,
    paddingTop: 8,
  },
  heroCard: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroCardUnlocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  heroCardLocked: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  heroGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  medalWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.95)',
    borderWidth: 2,
    borderColor: '#0a0a0c',
  },
  unlockedBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0a0a0c',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  heroTitleLocked: {
    color: colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.24)',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  statusChipLocked: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  heroStatus: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  heroStatusLocked: {
    color: colors.textSubtle,
  },
  dateChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateChipText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroMeaning: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
  heroMeaningLocked: {
    color: colors.textSubtle,
  },
  detailsCard: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  detailsTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  detailRow: {
    gap: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  detailLabel: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.24)',
  },
  nextIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.16)',
  },
  nextCopy: {
    flex: 1,
    gap: 2,
  },
  nextEyebrow: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  nextTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(10, 10, 12, 0.96)',
  },
})
