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
}

function SummaryStat({
  icon,
  label,
  value,
  metricParts,
  accent = '#93c5fd',
}: SummaryStatProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${accent}22` }]}>
        <Ionicons name={icon} size={16} color={accent} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      {metricParts ? (
        <ActivityMetricValue
          parts={metricParts}
          valueStyle={styles.statValue}
          unitStyle={styles.statUnit}
        />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
    </View>
  )
}

export function RunWalkActivitySummaryScreen() {
  const insets = useSafeAreaInsets()
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
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.background, colors.backgroundElevated, colors.background]}
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
            pressed && styles.shareButtonPressed,
            isSharing && styles.shareButtonDisabled,
          ]}
        >
          {isSharing ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Ionicons name="share-outline" size={22} color={colors.primary} />
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
        <View ref={shareCaptureRef} collapsable={false} style={styles.shareCapture}>
          <View style={styles.hero}>
            <View style={styles.lottieWrap}>
              <LottieView source={winnerAnimation} autoPlay loop={false} style={styles.lottie} />
            </View>

            <Text style={styles.title}>Parabéns!</Text>
            <Text style={styles.message}>{SUMMARY_MESSAGE}</Text>
          </View>

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
              <Text style={styles.highlightValue}>
                {formatElapsedActivityTime(summary.elapsedSeconds)}
              </Text>
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

          <View style={styles.statsGrid}>
            <SummaryStat
              icon="speedometer-outline"
              label="Vel. média"
              metricParts={speedParts}
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
              <Ionicons name="map-outline" size={16} color="#059669" />
              <Text style={styles.mapTitle}>Seu percurso</Text>
            </View>

            <View style={styles.mapFrame}>
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
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 12) },
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
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
    gap: 14,
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
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  message: {
    color: colors.textSubtle,
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  mapFrame: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.backgroundElevated,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  continueButton: {
    marginTop: 0,
  },
  continueButtonGradient: {
    minHeight: 58,
  },
})
