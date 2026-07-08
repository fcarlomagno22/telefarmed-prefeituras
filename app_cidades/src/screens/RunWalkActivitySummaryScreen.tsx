import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import LottieView from 'lottie-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
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
import {
  clearRunWalkActivitySummary,
  loadRunWalkActivitySummary,
  type RunWalkActivitySummary,
} from '../data/runWalkActivitySummaryStorage'
import { persistRunWalkHistoryActivity } from '../data/runWalkActivityHistoryStorage'
import {
  invalidateWeeklyGoalProgressCache,
  loadWeeklyGoalProgress,
  recordRunWalkActivityCompletion,
} from '../data/runWalkWeeklyProgressStorage'
import { setPendingWeeklyGoalCelebration } from '../data/runWalkWeeklyCelebration'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import type { ThemeColors } from '../theme/palettes'
import { getRunWalkRouteParams } from '../types/auth'
import { playWinnerSound } from '../utils/appSounds'
import {
  formatActivityDistanceKmParts,
  formatCaloriesBurned,
  formatElapsedActivityTime,
  formatSpeedKmhParts,
  type ActivityMetricParts,
} from '../utils/runWalkActivityStats'
import { shareRunWalkActivitySummaryImage } from '../utils/runWalkActivitySummaryShare'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

const SUMMARY_MESSAGE = 'Cada passo conta. Você concluiu mais um treino.'
const MAP_HEIGHT = Math.max(300, Math.round(Dimensions.get('window').height * 0.34))
const FOOTER_ESTIMATED_HEIGHT = 88

type SummaryStatProps = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value?: string
  metricParts?: ActivityMetricParts
  accent?: string
  themeColors: ThemeColors
}

function SummaryStat({
  icon,
  label,
  value,
  metricParts,
  accent = '#93c5fd',
  themeColors,
}: SummaryStatProps) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: themeColors.backgroundElevated,
          borderColor: themeColors.surfaceBorder,
        },
      ]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: `${accent}22` }]}>
        <Ionicons name={icon} size={16} color={accent} />
      </View>
      <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>{label}</Text>
      {metricParts ? (
        <ActivityMetricValue
          parts={metricParts}
          valueStyle={[styles.statValue, { color: themeColors.text }]}
          unitStyle={styles.statUnit}
        />
      ) : (
        <Text style={[styles.statValue, { color: themeColors.text }]}>{value}</Text>
      )}
    </View>
  )
}

export function RunWalkActivitySummaryScreen() {
  const insets = useSafeAreaInsets()
  const { colors: themeColors } = useTheme()
  const { user, navigateTo, routeParams } = useAuth()
  const params = getRunWalkRouteParams(routeParams)
  const summaryId = params.summaryId
  const shareCaptureRef = useRef<View>(null)

  const [summary, setSummary] = useState<RunWalkActivitySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [scrollEnabled, setScrollEnabled] = useState(true)

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

  const handleMapInteractionChange = useCallback((active: boolean) => {
    setScrollEnabled(!active)
  }, [])

  async function handleContinue() {
    if (!summary || isSaving) return

    setIsSaving(true)

    try {
      const patientCpf = user?.cpf ?? summary.patientCpf
      const dateIso = toLocalDateIso(new Date(summary.completedAt))

      await persistRunWalkHistoryActivity(patientCpf, summary)
      await invalidateWeeklyGoalProgressCache(patientCpf)

      let previousTodayMinutes = 0
      let newTodayMinutes = summary.activeMinutes

      if (patientCpf === 'guest') {
        const weeklyProgress = await loadWeeklyGoalProgress(patientCpf)
        const todayDay = weeklyProgress.weeklyCalendar.find((day) => day.dateIso === dateIso)
        const completion = await recordRunWalkActivityCompletion(
          patientCpf,
          summary.activeMinutes,
          todayDay?.activeMinutes ?? 0,
          dateIso,
        )
        previousTodayMinutes = completion.previousTodayMinutes
        newTodayMinutes = completion.newTodayMinutes
      } else {
        const weeklyProgress = await loadWeeklyGoalProgress(patientCpf, { forceRefresh: true })
        const todayDay = weeklyProgress.weeklyCalendar.find((day) => day.dateIso === dateIso)
        newTodayMinutes = todayDay?.activeMinutes ?? summary.activeMinutes
        previousTodayMinutes = Math.max(0, newTodayMinutes - summary.activeMinutes)
      }

      await clearRunWalkActivitySummary(summary.id)

      setPendingWeeklyGoalCelebration({
        dateIso,
        fromMinutes: previousTodayMinutes,
        toMinutes: newTodayMinutes,
      })

      navigateTo('run-walk')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleShare() {
    if (isSharing) return

    setIsSharing(true)
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      const shared = await shareRunWalkActivitySummaryImage(shareCaptureRef)
      if (!shared) {
        Alert.alert(
          'Compartilhar',
          'Não foi possível gerar a imagem do treino neste dispositivo.',
        )
      }
    } catch {
      Alert.alert('Compartilhar', 'Não foi possível compartilhar o treino.')
    } finally {
      setIsSharing(false)
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
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <LinearGradient
        colors={[
          themeColors.background,
          themeColors.backgroundElevated,
          themeColors.background,
        ]}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['rgba(16, 185, 129, 0.18)', 'transparent', 'rgba(37, 99, 235, 0.12)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.shareButtonWrap, { top: Math.max(insets.top, 8) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Compartilhar treino"
          onPress={() => void handleShare()}
          disabled={isSharing}
          style={({ pressed }) => [
            styles.shareButton,
            { backgroundColor: themeColors.backgroundElevated, borderColor: themeColors.surfaceBorder },
            pressed && styles.shareButtonPressed,
            isSharing && styles.shareButtonDisabled,
          ]}
        >
          {isSharing ? (
            <ActivityIndicator color={themeColors.primary} size="small" />
          ) : (
            <Ionicons name="share-outline" size={22} color={themeColors.primary} />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 8) + 4,
            paddingBottom: Math.max(insets.bottom, 12) + FOOTER_ESTIMATED_HEIGHT,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          ref={shareCaptureRef}
          collapsable={false}
          style={[
            styles.shareCapture,
            {
              backgroundColor: themeColors.background,
              borderColor: themeColors.surfaceBorder,
            },
          ]}
        >
          <LinearGradient
            colors={[
              themeColors.background,
              themeColors.backgroundElevated,
              themeColors.background,
            ]}
            style={styles.shareCaptureGradient}
            pointerEvents="none"
          />

          <LinearGradient
            colors={['rgba(16, 185, 129, 0.14)', 'transparent', 'rgba(37, 99, 235, 0.1)']}
            locations={[0, 0.45, 1]}
            style={styles.shareCaptureGradient}
            pointerEvents="none"
          />

          <View style={styles.shareCaptureContent}>
            <View style={styles.hero}>
              <View style={styles.lottieWrap}>
                <LottieView source={winnerAnimation} autoPlay loop={false} style={styles.lottie} />
              </View>

              <Text style={[styles.title, { color: themeColors.text }]}>Parabéns!</Text>
              <Text style={[styles.message, { color: themeColors.textSubtle }]}>{SUMMARY_MESSAGE}</Text>
            </View>

            <View style={styles.highlightRow}>
              <View style={styles.highlightBlock}>
                <ActivityMetricValue
                  parts={distanceParts}
                  valueStyle={[styles.highlightValue, { color: themeColors.text }]}
                  unitStyle={styles.highlightUnit}
                />
                <Text style={[styles.highlightLabel, { color: themeColors.textMuted }]}>Distância</Text>
              </View>

              <View style={[styles.highlightDivider, { backgroundColor: themeColors.surface }]} />

              <View style={styles.highlightBlock}>
                <Text style={[styles.highlightValue, { color: themeColors.text }]}>
                  {formatElapsedActivityTime(summary.elapsedSeconds)}
                </Text>
                <Text style={[styles.highlightLabel, { color: themeColors.textMuted }]}>Tempo</Text>
              </View>

              <View style={[styles.highlightDivider, { backgroundColor: themeColors.surface }]} />

              <View style={styles.highlightBlock}>
                <ActivityMetricValue
                  parts={speedParts}
                  valueStyle={[styles.highlightValue, { color: themeColors.text }]}
                  unitStyle={styles.highlightUnit}
                />
                <Text style={[styles.highlightLabel, { color: themeColors.textMuted }]}>Vel. média</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <SummaryStat
                icon="speedometer-outline"
                label="Vel. média"
                metricParts={speedParts}
                accent="#6ee7b7"
                themeColors={themeColors}
              />
              <SummaryStat
                icon="flame-outline"
                label="Calorias"
                value={formatCaloriesBurned(summary.estimatedCalories)}
                accent="#fb923c"
                themeColors={themeColors}
              />
            </View>

            <View style={styles.mapSection}>
              <View style={styles.mapHeader}>
                <Ionicons name="map-outline" size={16} color="#059669" />
                <Text style={[styles.mapTitle, { color: themeColors.text }]}>Seu percurso</Text>
              </View>

              <View style={[styles.mapFrame, { borderColor: themeColors.surfaceBorder }]}>
                <RunWalkActivityTrailMap
                  trail={summary.trail}
                  height={MAP_HEIGHT}
                  interactive
                  profilePhotoUri={user?.selfieUri}
                  onMapInteractionChange={handleMapInteractionChange}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: themeColors.backgroundElevated,
            borderTopColor: themeColors.surfaceBorder,
          },
        ]}
      >
        <PrimaryButton
          label={isSaving ? 'Salvando...' : 'Ver meu progresso semanal'}
          onPress={() => void handleContinue()}
          loading={isSaving}
          disabled={isSaving}
          style={styles.continueButton}
          gradientStyle={styles.continueButtonGradient}
        />
      </View>
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
    gap: 14,
  },
  shareButtonWrap: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  shareButtonPressed: {
    opacity: 0.85,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareCapture: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  shareCaptureGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  shareCaptureContent: {
    gap: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  hero: {
    alignItems: 'center',
    gap: 2,
    marginTop: -6,
  },
  lottieWrap: {
    width: 132,
    height: 132,
    marginBottom: -10,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginTop: 2,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  highlightBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  highlightValue: {
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
    fontSize: 11,
    fontWeight: '700',
  },
  highlightDivider: {
    width: 1,
    height: 42,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 6,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 14,
    fontWeight: '800',
  },
  mapFrame: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  continueButton: {
    marginTop: 0,
  },
  continueButtonGradient: {
    minHeight: 58,
  },
})
