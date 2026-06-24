import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import LottieView from 'lottie-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import winnerAnimation from '../../assets/Winner.json'
import { PrimaryButton } from '../components/PrimaryButton'
import { RunWalkActivityTrailMap } from '../components/runWalk/liveActivity/RunWalkActivityTrailMap'
import { ActivityMetricValue } from '../components/runWalk/liveActivity/ActivityMetricValue'
import { getMockRunWalkTodayState } from '../data/mockRunWalk'
import {
  clearRunWalkActivitySummary,
  loadRunWalkActivitySummary,
  type RunWalkActivitySummary,
} from '../data/runWalkActivitySummaryStorage'
import { saveRunWalkHistoryActivity } from '../data/runWalkActivityHistoryStorage'
import {
  getMergedDayActiveMinutes,
  loadWeeklyProgress,
  recordRunWalkActivityCompletion,
} from '../data/runWalkWeeklyProgressStorage'
import { setPendingWeeklyGoalCelebration } from '../data/runWalkWeeklyCelebration'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import { getRunWalkRouteParams } from '../types/auth'
import { playWinnerSound } from '../utils/appSounds'
import {
  formatActivityDistanceKmParts,
  formatCaloriesBurned,
  formatElapsedActivityTime,
  formatPaceMinPerKm,
  formatSpeedKmhParts,
} from '../utils/runWalkActivityStats'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

type SummaryStatProps = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
  accent?: string
}

function SummaryStat({ icon, label, value, accent = '#93c5fd' }: SummaryStatProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${accent}22` }]}>
        <Ionicons name={icon} size={16} color={accent} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

export function RunWalkActivitySummaryScreen() {
  const insets = useSafeAreaInsets()
  const { user, navigateTo, routeParams } = useAuth()
  const params = getRunWalkRouteParams(routeParams)
  const summaryId = params.summaryId

  const [summary, setSummary] = useState<RunWalkActivitySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSummary() {
      if (!summaryId) {
        navigateTo('run-walk')
        return
      }

      const loaded = await loadRunWalkActivitySummary(summaryId)
      if (!active) return

      if (!loaded) {
        navigateTo('run-walk')
        return
      }

      setSummary(loaded)
      setIsLoading(false)
      void playWinnerSound()
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }

    void loadSummary()
    return () => {
      active = false
    }
  }, [navigateTo, summaryId])

  useAndroidBackHandler(
    useCallback(() => {
      return true
    }, []),
  )

  const heroMessage = useMemo(() => {
    if (!summary) return ''
    if (summary.distanceKm >= 5) return 'Que percurso incrível! Você mandou muito bem.'
    if (summary.distanceKm >= 2) return 'Treino sólido. Consistência faz a diferença.'
    if (summary.elapsedSeconds >= 20 * 60) return 'Tempo de qualidade em movimento. Parabéns!'
    return 'Cada passo conta. Você concluiu mais um treino.'
  }, [summary])

  async function handleContinue() {
    if (!summary || isSaving) return

    setIsSaving(true)

    try {
      const patientCpf = user?.cpf ?? summary.patientCpf
      const dateIso = toLocalDateIso(new Date(summary.completedAt))
      const baseTodayMinutes =
        getMockRunWalkTodayState().weeklyCalendar.find((day) => day.dateIso === dateIso)
          ?.activeMinutes ?? 0
      const existingProgress = await loadWeeklyProgress(patientCpf)
      const mergedBefore = getMergedDayActiveMinutes(
        baseTodayMinutes,
        existingProgress,
        dateIso,
      )

      const { previousTodayMinutes, newTodayMinutes } = await recordRunWalkActivityCompletion(
        patientCpf,
        summary.activeMinutes,
        baseTodayMinutes,
        dateIso,
      )

      await saveRunWalkHistoryActivity(patientCpf, summary)
      await clearRunWalkActivitySummary(summary.id)

      setPendingWeeklyGoalCelebration({
        dateIso,
        fromMinutes: previousTodayMinutes ?? mergedBefore,
        toMinutes: newTodayMinutes,
      })

      navigateTo('run-walk')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !summary) {
    return (
      <View style={[styles.loadingRoot, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primaryLight} size="large" />
      </View>
    )
  }

  const speedParts = formatSpeedKmhParts(summary.averageSpeedKmh)
  const distanceParts = formatActivityDistanceKmParts(summary.distanceKm)

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0a0a0c', '#101018', '#0a0a0c']}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['rgba(16, 185, 129, 0.18)', 'transparent', 'rgba(37, 99, 235, 0.12)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 12) + 8,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.lottieWrap}>
            <LottieView source={winnerAnimation} autoPlay loop={false} style={styles.lottie} />
          </View>

          <Text style={styles.title}>Parabéns!</Text>
          <Text style={styles.subtitle}>{summary.activityName}</Text>
          <Text style={styles.message}>{heroMessage}</Text>
        </View>

        <LinearGradient
          colors={['rgba(16, 185, 129, 0.16)', 'rgba(14, 14, 20, 0.96)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.highlightCard}
        >
          <View style={styles.highlightRow}>
            <View style={styles.highlightBlock}>
              <ActivityMetricValue
                parts={distanceParts}
                valueStyle={styles.highlightValue}
                unitStyle={styles.highlightUnit}
              />
              <Text style={styles.highlightLabel}>Distância</Text>
            </View>

            <View style={styles.highlightDivider} />

            <View style={styles.highlightBlock}>
              <Text style={styles.highlightValue}>{formatElapsedActivityTime(summary.elapsedSeconds)}</Text>
              <Text style={styles.highlightLabel}>Tempo</Text>
            </View>

            <View style={styles.highlightDivider} />

            <View style={styles.highlightBlock}>
              <ActivityMetricValue
                parts={speedParts}
                valueStyle={styles.highlightValue}
                unitStyle={styles.highlightUnit}
              />
              <Text style={styles.highlightLabel}>Vel. média</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <SummaryStat
            icon="speedometer-outline"
            label="Ritmo médio"
            value={formatPaceMinPerKm(summary.paceMinPerKm)}
            accent="#6ee7b7"
          />
          <SummaryStat
            icon="flame-outline"
            label="Calorias"
            value={formatCaloriesBurned(summary.estimatedCalories)}
            accent="#fb923c"
          />
        </View>

        <View style={styles.mapSection}>
          <View style={styles.mapHeader}>
            <Ionicons name="map-outline" size={16} color="#6ee7b7" />
            <Text style={styles.mapTitle}>Seu percurso</Text>
          </View>

          <View style={styles.mapFrame}>
            <RunWalkActivityTrailMap
              trail={summary.trail}
              height={220}
              profilePhotoUri={user?.selfieUri}
            />
          </View>
        </View>

        <PrimaryButton
          label={isSaving ? 'Salvando...' : 'Ver meu progresso semanal'}
          onPress={() => void handleContinue()}
          style={styles.continueButton}
        />
      </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  lottieWrap: {
    width: 168,
    height: 168,
    marginBottom: -8,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  highlightCard: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  highlightValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  highlightUnit: {
    fontSize: 11,
    fontWeight: '700',
  },
  highlightLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  highlightDivider: {
    width: 1,
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 320,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  mapSection: {
    gap: 10,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  mapFrame: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  continueButton: {
    marginTop: 4,
  },
})
