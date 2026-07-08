import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { LongPressable } from '../components/LongPressable'
import { MenuDrawer } from '../components/MenuDrawer'
import { MetricsAreaChart } from '../components/metrics/MetricsAreaChart'
import { MetricsHoldToEditHint } from '../components/metrics/MetricsHoldToEditHint'
import { HealthIntegrationsCard } from '../components/metrics/HealthIntegrationsCard'
import { MetricsPeriodDrawer } from '../components/metrics/MetricsPeriodDrawer'
import { GlucoseLogDrawer, GlucoseReading } from '../components/metrics/GlucoseLogDrawer'
import { GlucoseReportDrawer } from '../components/metrics/GlucoseReportDrawer'
import { BloodPressureLogDrawer, BloodPressureReading } from '../components/metrics/BloodPressureLogDrawer'
import { BloodPressureReportDrawer } from '../components/metrics/BloodPressureReportDrawer'
import { BodyCompositionReportDrawer } from '../components/metrics/BodyCompositionReportDrawer'
import { BodyMeasurementsReportDrawer } from '../components/metrics/BodyMeasurementsReportDrawer'
import {
  AbdominalCircumferenceLogDrawer,
} from '../components/metrics/AbdominalCircumferenceLogDrawer'
import { HydrationLogDrawer } from '../components/metrics/HydrationLogDrawer'
import { HydrationReportDrawer } from '../components/metrics/HydrationReportDrawer'
import { HeartRateHistoryDrawer } from '../components/metrics/HeartRateHistoryDrawer'
import { HeartRateReportDrawer } from '../components/metrics/HeartRateReportDrawer'
import { StepsHistoryDrawer } from '../components/metrics/StepsHistoryDrawer'
import { ProfileFieldEditDrawer } from '../components/metrics/ProfileFieldEditDrawer'
import { MetricsProfileOnboardingDrawer } from '../components/metrics/MetricsProfileOnboardingDrawer'
import { ImcDrawer } from '../components/metrics/ImcDrawer'
import { DistanceHistoryDrawer } from '../components/metrics/DistanceHistoryDrawer'
import { BodyMeasurementsDrawer } from '../components/metrics/BodyMeasurementsDrawer'
import { BodyMeasurementLogDrawer } from '../components/metrics/BodyMeasurementLogDrawer'
import { NeonSectionDivider } from '../components/NeonSectionDivider'
import {
  applyLiveRegistrationSliding,
  createLiveRegistrationPoint,
  formatMetricValue,
  getMetricCardNumericValue,
} from '../utils/metricFormatting'
import {
  loadWeightHistoryDays,
  registerWeightReading,
} from '../data/weightHistoryStorage'
import {
  createDefaultMetricsProfile,
  saveMetricsProfile,
} from '../data/metricsProfileStorage'
import { loadMetricsResumo } from '../data/metricsResumoStorage'
import {
  loadBloodPressureHistoryDays,
  registerBloodPressureReading,
} from '../data/bloodPressureHistoryStorage'
import {
  loadHydrationHistoryDays,
  registerHydrationReading,
} from '../data/hydrationHistoryStorage'
import {
  loadGlucoseHistoryDays,
  registerGlucoseReading,
} from '../data/glucoseHistoryStorage'
import { getTodayHydrationLiters, getTodayHydrationRecord } from '../utils/hydration'
import {
  getHydrationSeriesForPeriod,
  hydrationHistoryToMetricPoints,
} from '../utils/hydrationHistory'
import {
  BODY_MEASUREMENT_CHART_PERIOD,
  getBodyMeasurementSeries,
  getBodyMeasurementSeriesForPeriod,
  getLatestBodyMeasurementValue,
} from '../data/bodyMeasurements'
import {
  loadBodyMeasurementHistoryDays,
  registerBodyMeasurementReading,
} from '../data/bodyMeasurementsStorage'
import {
  loadHeartRateHistoryDays,
  registerHeartRateReading,
  seedIntegrationHeartRateReadings,
} from '../data/heartRateHistoryStorage'
import {
  loadHealthConnections,
  saveHealthConnection,
} from '../data/healthIntegrationsStorage'
import {
  loadStepsDayRecordsDays,
  registerManualWalk,
  seedIntegrationStepsDayRecords,
} from '../data/stepsHistoryStorage'
import { hasHeartRateIntegration } from '../data/mockHeartRateHistory'
import {
  DEFAULT_STEPS_GOAL,
  formatStepsCount,
  getTodayDistanceKm,
  getTodaySteps,
  hasDistanceIntegration,
  hasStepsIntegration,
} from '../data/mockStepsHistory'
import { useAuth } from '../contexts/AuthContext'
import { useGuestAuth } from '../contexts/GuestAuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { useSimulatedPageSkeleton } from '../hooks/useSimulatedPageSkeleton'
import { colors } from '../theme/colors'
import { ACTION_ICON_PALETTES } from '../theme/actionIconColors'
import { ChartableMetricId, EditableProfileFieldId, MetricDataPoint, PeriodSelection, ProfileFieldId, ProfileSnapshot } from '../types/metrics'
import { BloodPressureHistoryEntry } from '../types/bloodPressure'
import { GlucoseHistoryEntry } from '../types/glucose'
import { BodyMeasurementHistory, BodyMeasurementId } from '../types/bodyMeasurements'
import {
  getBodyMeasurementConfig,
  getMeasurementDeltaSummary,
  isStorableBodyMeasurementId,
} from '../utils/bodyMeasurements'
import { getLatestBodyMeasurementSeriesValue } from '../utils/bodyMeasurementHistory'
import { getLatestHeartRateReading } from '../utils/heartRateHistory'
import { HeartRateReading } from '../types/heartRate'
import { HydrationDayRecord } from '../types/hydration'
import { ManualWalkEntry, StepsDayRecord } from '../types/steps'
import { IntegrationConnectionState, IntegrationId } from '../types/healthIntegrations'
import { buildPeriodSelection, formatPeriodLabel, isHourlyPeriod } from '../utils/metricsPeriod'
import { parseWeightKg } from '../utils/bmi'
import {
  buildImcSeriesFromWeightHistory,
  ensureMinimumWeightChartPoints,
  getWeightSeriesForPeriod,
} from '../utils/weightHistory'
import { DEFAULT_WEIGHT_HISTORY_DAYS } from '../utils/weightHistoryQuery'
import {
  getBloodPressureSeriesForPeriod,
  getLatestBloodPressureEntry,
  bloodPressureHistoryToMetricPoints,
} from '../utils/bloodPressureHistory'
import { getLatestGlucoseEntry, getGlucoseSeriesForPeriod } from '../utils/glucoseHistory'
import { formatBloodPressureShort } from '../utils/bloodPressure'
import { getHeartRateSeriesForPeriod } from '../utils/heartRateHistory'
import {
  getDistanceSeriesForPeriod,
  getStepsSeriesForPeriod,
} from '../utils/stepsHistory'
import type { MetricsResumoLatestDto } from '../lib/api/vd/metricas'
import { metricsResumoToProfileSnapshot } from '../utils/metricsResumo'
import {
  needsMetricsProfileOnboarding,
  onboardingProfileSnapshot,
  onboardingToUpdateInput,
  profileFieldToUpdateInput,
} from '../utils/metricsProfile'
import { SkeletonBone } from '../components/SkeletonBone'

const TAB_BAR_ESTIMATED_HEIGHT = 78
const METRIC_COLUMNS = 3
const METRIC_GRID_GAP = 8
const METRIC_GRID_PADDING = 16
const PROFILE_LONG_PRESS_MS = 400

/** Abre drawer após long-press sem bloquear a animação do botão. */
function runAfterUiReady(task: () => void) {
  setTimeout(task, 0)
}

type ProfileFieldMeta = {
  id: ProfileFieldId
  label: string
  editable: boolean
}

const PROFILE_FIELDS: ProfileFieldMeta[] = [
  { id: 'height', label: 'Altura', editable: true },
  { id: 'weight', label: 'Peso', editable: true },
  { id: 'age', label: 'Idade', editable: false },
  { id: 'gender', label: 'Gênero', editable: true },
]

type ChartMetricConfig = {
  id: ChartableMetricId
  label: string
  unit: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  gradient: readonly [string, string, string]
  accentColor: string
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized
  const value = Number.parseInt(expanded, 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function darkenHex(hex: string, factor = 0.72) {
  const normalized = hex.replace('#', '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized
  const red = Math.max(0, Math.min(255, Math.round(Number.parseInt(expanded.slice(0, 2), 16) * factor)))
  const green = Math.max(
    0,
    Math.min(255, Math.round(Number.parseInt(expanded.slice(2, 4), 16) * factor)),
  )
  const blue = Math.max(
    0,
    Math.min(255, Math.round(Number.parseInt(expanded.slice(4, 6), 16) * factor)),
  )

  return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`
}

function getMetricTopStripeColors(metric: ChartMetricConfig): readonly [string, string] {
  const base = metric.gradient[2]
  return [darkenHex(base, 0.62), darkenHex(base, 0.82)] as const
}

const CHART_METRICS: ChartMetricConfig[] = [
  {
    id: 'imc',
    label: 'IMC',
    unit: 'kg/m²',
    icon: 'scale-bathroom',
    gradient: ['#67e8f9', '#0891b2', '#0e7490'],
    accentColor: '#0891b2',
  },
  {
    id: 'glicemia',
    label: 'Glicemia',
    unit: 'mg/dL',
    icon: 'water-outline',
    gradient: ACTION_ICON_PALETTES.myMetrics.iconGradient,
    accentColor: '#e11d48',
  },
  {
    id: 'pressao',
    label: 'Pressão arterial',
    unit: 'mmHg',
    icon: 'heart-pulse',
    gradient: ['#fbbf24', '#f59e0b', '#d97706'],
    accentColor: '#f59e0b',
  },
  {
    id: 'corporais',
    label: 'Métricas corporais',
    unit: '%',
    icon: 'human',
    gradient: ['#f0abfc', '#d946ef', '#a21caf'],
    accentColor: '#d946ef',
  },
  {
    id: 'hidratacao',
    label: 'Hidratação',
    unit: 'L',
    icon: 'cup-water',
    gradient: ['#7dd3fc', '#0ea5e9', '#0369a1'],
    accentColor: '#0ea5e9',
  },
  {
    id: 'circunferencia',
    label: 'Circunf. abdominal',
    unit: 'cm',
    icon: 'tape-measure',
    gradient: ['#fdba74', '#f97316', '#c2410c'],
    accentColor: '#f97316',
  },
  {
    id: 'frequencia',
    label: 'Freq. cardíaca',
    unit: 'bpm',
    icon: 'heart',
    gradient: ['#fca5a5', '#ef4444', '#dc2626'],
    accentColor: '#ef4444',
  },
  {
    id: 'passos',
    label: 'Passos',
    unit: '',
    icon: 'walk',
    gradient: ['#6ee7b7', '#10b981', '#059669'],
    accentColor: '#10b981',
  },
  {
    id: 'distancia',
    label: 'Distância',
    unit: 'km',
    icon: 'map-marker-distance',
    gradient: ['#93c5fd', '#2563eb', '#1d4ed8'],
    accentColor: '#2563eb',
  },
]

const WEIGHT_CHART_METRIC: ChartMetricConfig = {
  id: 'peso',
  label: 'Peso',
  unit: 'kg',
  icon: 'weight-kilogram',
  gradient: ['#e2e8f0', '#cbd5e1', '#94a3b8'],
  accentColor: '#64748b',
}

const CHARTABLE_METRICS: ChartMetricConfig[] = [...CHART_METRICS, WEIGHT_CHART_METRIC]

function ProfileKpiStrip({
  profile,
  onEditField,
  onWeightPress,
  skeleton = false,
}: {
  profile: ProfileSnapshot
  onEditField: (field: EditableProfileFieldId) => void
  onWeightPress: () => void
  skeleton?: boolean
}) {
  function handleLongPress(field: EditableProfileFieldId) {
    onEditField(field)
  }

  function handleWeightPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onWeightPress()
  }

  return (
    <View style={styles.profileStripWrap}>
      <LinearGradient
        colors={['rgba(255, 107, 0, 0.22)', 'rgba(255, 107, 0, 0.06)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileStripBorder}
      >
        <View style={styles.profileStripInner}>
          {PROFILE_FIELDS.map((field, index) => {
            const content = skeleton ? (
              <>
                <SkeletonBone width="70%" height={9} borderRadius={4} />
                <SkeletonBone width="82%" height={13} borderRadius={5} style={{ marginTop: 4 }} />
              </>
            ) : (
              <>
                <Text style={styles.profileLabel}>{field.label}</Text>
                <Text style={styles.profileValue} numberOfLines={1}>
                  {profile[field.id]?.trim() || '—'}
                </Text>
              </>
            )

            return (
              <View key={field.id} style={styles.profileStripItem}>
                {skeleton || !field.editable ? (
                  <View style={styles.profileStripPressable}>{content}</View>
                ) : field.id === 'weight' ? (
                  <LongPressable
                    onPress={handleWeightPress}
                    onLongPress={() => handleLongPress('weight')}
                    delayLongPress={PROFILE_LONG_PRESS_MS}
                    style={({ pressed }) => [
                      styles.profileStripPressable,
                      pressed && styles.profileStripPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${field.label}: ${profile[field.id]}. Toque para ver evolução. Segure para editar.`}
                  >
                    {content}
                  </LongPressable>
                ) : (
                  <LongPressable
                    onLongPress={() => handleLongPress(field.id as EditableProfileFieldId)}
                    delayLongPress={PROFILE_LONG_PRESS_MS}
                    style={({ pressed }) => [
                      styles.profileStripPressable,
                      pressed && styles.profileStripPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${field.label}: ${profile[field.id]}. Segure para editar.`}
                  >
                    {content}
                  </LongPressable>
                )}

                {index < PROFILE_FIELDS.length - 1 ? <View style={styles.profileDivider} /> : null}
              </View>
            )
          })}
        </View>
      </LinearGradient>
    </View>
  )
}

function SelectableMetricCard({
  metric,
  selected,
  width,
  profile,
  resumoLatest,
  valueOverride,
  displayLabelOverride,
  onPress,
  onLongPress,
  skeleton = false,
}: {
  metric: ChartMetricConfig
  selected: boolean
  width: number
  profile: ProfileSnapshot
  resumoLatest: MetricsResumoLatestDto | null
  valueOverride?: number
  displayLabelOverride?: string
  onPress: () => void
  onLongPress?: () => void
  skeleton?: boolean
}) {
  const resolvedValue = valueOverride ?? getMetricCardNumericValue(metric.id, profile, resumoLatest)
  const latestValue = resolvedValue ?? 0
  const isCorporais = metric.id === 'corporais'
  const isImc = metric.id === 'imc'
  const isHeartRate = metric.id === 'frequencia'
  const valueLabel =
    displayLabelOverride ??
    (isCorporais
      ? 'Ver detalhes'
      : resolvedValue === undefined
        ? '—'
        : formatMetricValue(metric.id, latestValue))

  const prevImcRef = useRef<number | null>(null)
  const valueScale = useRef(new Animated.Value(1)).current
  const [displayedImc, setDisplayedImc] = useState(latestValue)

  useEffect(() => {
    if (!isImc || resolvedValue === undefined) return

    const previousValue = prevImcRef.current
    if (previousValue === null) {
      prevImcRef.current = latestValue
      setDisplayedImc(latestValue)
      return
    }

    if (previousValue === latestValue) {
      setDisplayedImc(latestValue)
      return
    }

    prevImcRef.current = latestValue

    const from = previousValue
    const to = latestValue
    const diff = to - from
    const steps = Math.max(6, Math.min(18, Math.ceil(Math.abs(diff) * 12)))
    const increment = diff / steps
    let currentStep = 0

    function bounceValue() {
      valueScale.setValue(1)
      Animated.sequence([
        Animated.timing(valueScale, {
          toValue: 1.18,
          duration: 75,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(valueScale, {
          toValue: 1,
          friction: 4,
          tension: 280,
          useNativeDriver: true,
        }),
      ]).start()
    }

    setDisplayedImc(Number(from.toFixed(1)))
    bounceValue()

    const timer = setInterval(() => {
      currentStep += 1
      const isLast = currentStep >= steps
      const nextValue = isLast ? to : Number((from + increment * currentStep).toFixed(1))

      setDisplayedImc(nextValue)
      bounceValue()

      if (isLast) {
        clearInterval(timer)
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }
    }, 58)

    return () => clearInterval(timer)
  }, [isImc, latestValue, resolvedValue, valueScale])

  const imcValueLabel = formatMetricValue('imc', displayedImc)

  if (skeleton) {
    return (
      <View style={[styles.metricCard, { width, maxWidth: width }]}>
        <View style={styles.metricCardShell}>
          <View style={[styles.metricCardInner, styles.metricCardInnerSkeleton]}>
            <View style={styles.metricCardContent}>
              <SkeletonBone width={20} height={20} borderRadius={5} />
              <SkeletonBone width="78%" height={9} borderRadius={4} style={{ marginTop: 2 }} />
              <SkeletonBone width="56%" height={11} borderRadius={4} />
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <LongPressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={onLongPress ? PROFILE_LONG_PRESS_MS : undefined}
      style={({ pressed }) => [
        styles.metricCard,
        { width, maxWidth: width },
        selected && styles.metricCardSelected,
        pressed && styles.metricCardPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={
        onLongPress
          ? `${metric.label}: ${valueLabel}. Segure para registrar.`
          : isCorporais
            ? `${metric.label}: ver detalhes`
            : `${metric.label}: ${valueLabel}`
      }
    >
      <View style={[styles.metricCardShell, selected && styles.metricCardShellSelected]}>
        {selected ? (
          <LinearGradient
            colors={[...getMetricTopStripeColors(metric)]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.metricTopStripe}
          />
        ) : null}

        <LinearGradient
          colors={[...metric.gradient]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.metricCardInner}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.18)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.55 }}
            style={styles.metricCardGloss}
            pointerEvents="none"
          />

          <View style={[styles.metricCardContent, isHeartRate && styles.metricCardContentCentered]}>
            <MaterialCommunityIcons name={metric.icon} size={17} color="#fff" />

            <Text
              style={[styles.metricLabel, isHeartRate && styles.metricCardTextCentered]}
              numberOfLines={2}
            >
              {metric.label}
            </Text>
            {isImc ? (
              <Animated.View style={{ transform: [{ scale: valueScale }], width: '100%' }}>
                <Text
                  style={[
                    styles.metricValue,
                    selected && styles.metricValueSelected,
                  ]}
                >
                  {imcValueLabel}
                </Text>
              </Animated.View>
            ) : (
              <Text
                style={[
                  isCorporais ? styles.metricValueHint : styles.metricValue,
                  isHeartRate && styles.metricCardTextCentered,
                  selected && !isCorporais && styles.metricValueSelected,
                  selected && isCorporais && styles.metricValueHintSelected,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {valueLabel}
                {isCorporais ? (
                  <Text style={styles.metricValueHintChevron}> ›</Text>
                ) : null}
              </Text>
            )}
          </View>
        </LinearGradient>
      </View>
    </LongPressable>
  )
}

export function MyMetricsScreen() {
  const { backgroundSource } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { user, navigateTo, logout, isBootstrapping } = useAuth()
  const { requireAuth } = useGuestAuth()
  const patientCpf = user?.cpf ?? 'guest'
  const withMetricsAuth = (action: () => void) => {
    requireAuth('vida:my-metrics', action)
  }
  const showSkeleton = useSimulatedPageSkeleton(isBootstrapping)

  const [activeTab, setActiveTab] = useState<BottomTabId | null>('my-metrics')
  const [menuVisible, setMenuVisible] = useState(false)
  const [selectedMetricId, setSelectedMetricId] = useState<ChartableMetricId>('peso')
  const [period, setPeriod] = useState<PeriodSelection>(() => buildPeriodSelection('week'))
  const [periodDrawerVisible, setPeriodDrawerVisible] = useState(false)
  const [profile, setProfile] = useState<ProfileSnapshot>(() => createDefaultMetricsProfile())
  const [profileReady, setProfileReady] = useState(false)
  const [editingProfileField, setEditingProfileField] = useState<EditableProfileFieldId | null>(null)
  const [hydrationDrawerVisible, setHydrationDrawerVisible] = useState(false)
  const [hydrationReportDrawerVisible, setHydrationReportDrawerVisible] = useState(false)
  const [hydrationHistory, setHydrationHistory] = useState<HydrationDayRecord[]>([])
  const [glucoseDrawerVisible, setGlucoseDrawerVisible] = useState(false)
  const [glucoseReportDrawerVisible, setGlucoseReportDrawerVisible] = useState(false)
  const [glucoseHistory, setGlucoseHistory] = useState<GlucoseHistoryEntry[]>([])
  const [bloodPressureDrawerVisible, setBloodPressureDrawerVisible] = useState(false)
  const [bloodPressureReportDrawerVisible, setBloodPressureReportDrawerVisible] = useState(false)
  const [bloodPressureHistory, setBloodPressureHistory] = useState<BloodPressureHistoryEntry[]>([])
  const [heartRateDrawerVisible, setHeartRateDrawerVisible] = useState(false)
  const [heartRateReportDrawerVisible, setHeartRateReportDrawerVisible] = useState(false)
  const [heartRateReadings, setHeartRateReadings] = useState<HeartRateReading[]>([])
  const [stepsDrawerVisible, setStepsDrawerVisible] = useState(false)
  const [stepsDayRecords, setStepsDayRecords] = useState<StepsDayRecord[]>([])
  const [healthConnections, setHealthConnections] = useState<
    Record<string, IntegrationConnectionState>
  >({})
  const [integrationConnectRequest, setIntegrationConnectRequest] = useState<IntegrationId | null>(
    null,
  )
  const [liveRegistrations, setLiveRegistrations] = useState<
    Partial<Record<ChartableMetricId, MetricDataPoint[]>>
  >({})
  const [chartScrollToken, setChartScrollToken] = useState(0)
  const [circumferenceDrawerVisible, setCircumferenceDrawerVisible] = useState(false)
  const [imcDrawerVisible, setImcDrawerVisible] = useState(false)
  const [bodyCompositionReportDrawerVisible, setBodyCompositionReportDrawerVisible] = useState(false)
  const [bodyMeasurementsReportDrawerVisible, setBodyMeasurementsReportDrawerVisible] = useState(false)
  const [distanceDrawerVisible, setDistanceDrawerVisible] = useState(false)
  const [bodyMeasurementHistory, setBodyMeasurementHistory] = useState<BodyMeasurementHistory>({})
  const [activeBodyMeasurementId, setActiveBodyMeasurementId] = useState<BodyMeasurementId>('peso')
  const [bodyMeasurementsDrawerVisible, setBodyMeasurementsDrawerVisible] = useState(false)
  const [bodyMeasurementLogTarget, setBodyMeasurementLogTarget] = useState<BodyMeasurementId | null>(
    null,
  )
  const [weightHistory, setWeightHistory] = useState<MetricDataPoint[]>([])
  const [resumoLatest, setResumoLatest] = useState<MetricsResumoLatestDto | null>(null)
  const [pageScrolling, setPageScrolling] = useState(false)

  const profileOnboardingVisible = profileReady && needsMetricsProfileOnboarding(profile)

  useEffect(() => {
    let cancelled = false

    void loadMetricsResumo(patientCpf).then((resumo) => {
      if (cancelled) return

      setProfile(metricsResumoToProfileSnapshot(resumo))
      setResumoLatest(resumo.latest)
      setProfileReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [patientCpf])

  useEffect(() => {
    if (!profileReady) return

    let cancelled = false

    void loadWeightHistoryDays(patientCpf, DEFAULT_WEIGHT_HISTORY_DAYS).then((entries) => {
      if (cancelled) return
      setWeightHistory(entries)
    })

    return () => {
      cancelled = true
    }
  }, [patientCpf, profileReady])

  useEffect(() => {
    if (!profileReady) return

    let cancelled = false

    void loadGlucoseHistoryDays(patientCpf, DEFAULT_WEIGHT_HISTORY_DAYS).then((entries) => {
      if (cancelled) return
      setGlucoseHistory(entries)
    })

    return () => {
      cancelled = true
    }
  }, [patientCpf, profileReady])

  useEffect(() => {
    if (!profileReady) return

    let cancelled = false

    void loadHydrationHistoryDays(patientCpf, DEFAULT_WEIGHT_HISTORY_DAYS).then((entries) => {
      if (cancelled) return
      setHydrationHistory(entries)
    })

    return () => {
      cancelled = true
    }
  }, [patientCpf, profileReady])

  useEffect(() => {
    if (!profileReady) return

    let cancelled = false

    void loadBloodPressureHistoryDays(patientCpf, DEFAULT_WEIGHT_HISTORY_DAYS).then((entries) => {
      if (cancelled) return
      setBloodPressureHistory(entries)
    })

    return () => {
      cancelled = true
    }
  }, [patientCpf, profileReady])

  useEffect(() => {
    if (!profileReady) return

    let cancelled = false

    void loadHeartRateHistoryDays(patientCpf, DEFAULT_WEIGHT_HISTORY_DAYS).then((entries) => {
      if (cancelled) return
      setHeartRateReadings(entries)
    })

    return () => {
      cancelled = true
    }
  }, [patientCpf, profileReady])

  useEffect(() => {
    if (!profileReady) return

    let cancelled = false

    void loadBodyMeasurementHistoryDays(patientCpf, DEFAULT_WEIGHT_HISTORY_DAYS).then((entries) => {
      if (cancelled) return
      setBodyMeasurementHistory(entries)
    })

    return () => {
      cancelled = true
    }
  }, [patientCpf, profileReady])

  useEffect(() => {
    if (!profileReady) return

    let cancelled = false

    void loadStepsDayRecordsDays(patientCpf, DEFAULT_WEIGHT_HISTORY_DAYS).then((records) => {
      if (cancelled) return
      setStepsDayRecords(records)
    })

    return () => {
      cancelled = true
    }
  }, [patientCpf, profileReady])

  useEffect(() => {
    if (!profileReady) return

    let cancelled = false

    void loadHealthConnections(patientCpf).then((connections) => {
      if (cancelled) return
      setHealthConnections(connections)
    })

    return () => {
      cancelled = true
    }
  }, [patientCpf, profileReady])

  const bottomContentPadding =
    TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 24

  const selectedMetric =
    CHARTABLE_METRICS.find((metric) => metric.id === selectedMetricId) ?? CHART_METRICS[0]
  const activeBodyMeasurement = getBodyMeasurementConfig(activeBodyMeasurementId)
  const chartMetricLabel =
    selectedMetricId === 'corporais' ? activeBodyMeasurement.label : selectedMetric.label
  const chartMetricUnit =
    selectedMetricId === 'corporais'
      ? activeBodyMeasurement.unit || activeBodyMeasurement.label
      : selectedMetric.unit
  const chartMetricAccent =
    selectedMetricId === 'corporais' ? '#d946ef' : selectedMetric.accentColor
  const chartWidth = screenWidth - 32
  const metricCardWidth = Math.floor(
    (screenWidth - METRIC_GRID_PADDING * 2 - METRIC_GRID_GAP * (METRIC_COLUMNS - 1)) /
      METRIC_COLUMNS,
  )

  const metricRows = useMemo(
    () =>
      Array.from({ length: Math.ceil(CHART_METRICS.length / METRIC_COLUMNS) }, (_, rowIndex) =>
        CHART_METRICS.slice(rowIndex * METRIC_COLUMNS, rowIndex * METRIC_COLUMNS + METRIC_COLUMNS),
      ),
    [],
  )

  const chartExtendedData = useMemo(() => {
    if (selectedMetricId === 'peso') {
      return ensureMinimumWeightChartPoints(weightHistory, profile)
    }
    if (selectedMetricId === 'imc') {
      return buildImcSeriesFromWeightHistory(
        ensureMinimumWeightChartPoints(weightHistory, profile),
        profile,
      )
    }
    if (selectedMetricId === 'corporais') {
      return getBodyMeasurementSeries(
        activeBodyMeasurementId,
        bodyMeasurementHistory,
        weightHistory,
        profile,
      )
    }
    if (selectedMetricId === 'circunferencia') {
      return getBodyMeasurementSeries(
        'abdomen',
        bodyMeasurementHistory,
        weightHistory,
        profile,
      )
    }
    if (selectedMetricId === 'pressao') {
      return bloodPressureHistoryToMetricPoints(
        bloodPressureHistory,
        isHourlyPeriod(period),
      )
    }
    if (selectedMetricId === 'hidratacao') {
      return hydrationHistoryToMetricPoints(hydrationHistory)
    }
    if (selectedMetricId === 'glicemia') {
      return getGlucoseSeriesForPeriod(glucoseHistory, period)
    }
    if (selectedMetricId === 'frequencia') {
      return getHeartRateSeriesForPeriod(heartRateReadings, period)
    }
    if (selectedMetricId === 'passos') {
      return getStepsSeriesForPeriod(stepsDayRecords, period)
    }
    if (selectedMetricId === 'distancia') {
      return getDistanceSeriesForPeriod(stepsDayRecords, period)
    }
    return []
  }, [
    selectedMetricId,
    period,
    profile,
    weightHistory,
    activeBodyMeasurementId,
    bodyMeasurementHistory,
    bloodPressureHistory,
    hydrationHistory,
    glucoseHistory,
    heartRateReadings,
    stepsDayRecords,
  ])

  const baseChartData = useMemo(() => {
    if (selectedMetricId === 'peso') {
      return getWeightSeriesForPeriod(
        ensureMinimumWeightChartPoints(weightHistory, profile),
        period,
      )
    }
    if (selectedMetricId === 'imc') {
      return getWeightSeriesForPeriod(
        buildImcSeriesFromWeightHistory(
          ensureMinimumWeightChartPoints(weightHistory, profile),
          profile,
        ),
        period,
      )
    }
    if (selectedMetricId === 'corporais') {
      return getBodyMeasurementSeriesForPeriod(
        activeBodyMeasurementId,
        bodyMeasurementHistory,
        weightHistory,
        profile,
        period,
      )
    }
    if (selectedMetricId === 'circunferencia') {
      return getBodyMeasurementSeriesForPeriod(
        'abdomen',
        bodyMeasurementHistory,
        weightHistory,
        profile,
        period,
      )
    }
    if (selectedMetricId === 'pressao') {
      return getBloodPressureSeriesForPeriod(bloodPressureHistory, period)
    }
    if (selectedMetricId === 'hidratacao') {
      return getHydrationSeriesForPeriod(hydrationHistory, period)
    }
    if (selectedMetricId === 'glicemia') {
      return getGlucoseSeriesForPeriod(glucoseHistory, period)
    }
    if (selectedMetricId === 'frequencia') {
      return getHeartRateSeriesForPeriod(heartRateReadings, period)
    }
    if (selectedMetricId === 'passos') {
      return getStepsSeriesForPeriod(stepsDayRecords, period)
    }
    if (selectedMetricId === 'distancia') {
      return getDistanceSeriesForPeriod(stepsDayRecords, period)
    }
    return []
  }, [
    selectedMetricId,
    period,
    profile,
    weightHistory,
    activeBodyMeasurementId,
    bodyMeasurementHistory,
    bloodPressureHistory,
    hydrationHistory,
    glucoseHistory,
    heartRateReadings,
    stepsDayRecords,
  ])

  const bodyMeasurementSummary = useMemo(() => {
    if (selectedMetricId !== 'corporais') return null
    const series = getBodyMeasurementSeriesForPeriod(
      activeBodyMeasurementId,
      bodyMeasurementHistory,
      weightHistory,
      profile,
      period,
    )
    return getMeasurementDeltaSummary(activeBodyMeasurementId, series)
  }, [
    selectedMetricId,
    activeBodyMeasurementId,
    bodyMeasurementHistory,
    weightHistory,
    profile,
    period,
  ])

  const chartData = useMemo(() => {
    if (
      selectedMetricId === 'peso' ||
      selectedMetricId === 'imc' ||
      selectedMetricId === 'corporais' ||
      selectedMetricId === 'circunferencia'
    ) {
      return chartExtendedData
    }
    if (selectedMetricId === 'pressao' || selectedMetricId === 'hidratacao') {
      return baseChartData
    }
    const livePoints = liveRegistrations[selectedMetricId] ?? []
    return applyLiveRegistrationSliding(chartExtendedData, livePoints)
  }, [baseChartData, chartExtendedData, liveRegistrations, selectedMetricId])

  const hasHeartRateSync = hasHeartRateIntegration(healthConnections)
  const hasStepsSync = hasStepsIntegration(healthConnections)
  const hasDistanceSync = hasDistanceIntegration(healthConnections)

  const isSelectedMetricChartUnavailable = useMemo(() => {
    if (selectedMetricId === 'frequencia') {
      return !hasHeartRateSync && heartRateReadings.length === 0
    }
    if (selectedMetricId === 'passos') {
      return !hasStepsSync && stepsDayRecords.length === 0
    }
    if (selectedMetricId === 'distancia') {
      return !hasStepsSync && !hasDistanceSync && stepsDayRecords.length === 0
    }
    return false
  }, [
    selectedMetricId,
    hasHeartRateSync,
    heartRateReadings.length,
    hasStepsSync,
    hasDistanceSync,
    stepsDayRecords.length,
  ])

  const chartDataForDisplay = isSelectedMetricChartUnavailable ? [] : chartData

  function handleHealthConnectionsChange(
    integrationId: string,
    connection: IntegrationConnectionState,
    merged: Record<string, IntegrationConnectionState>,
  ) {
    withMetricsAuth(() => {
      const wasHeartRateSynced = hasHeartRateIntegration(healthConnections)
      const nowHeartRateSynced = hasHeartRateIntegration(merged)
      const wasStepsSynced = hasStepsIntegration(healthConnections)
      const nowStepsSynced = hasStepsIntegration(merged)
      setHealthConnections(merged)

      void saveHealthConnection(patientCpf, integrationId, connection, merged).then((persisted) => {
        setHealthConnections(persisted)
      })

      if (!wasHeartRateSynced && nowHeartRateSynced) {
        void seedIntegrationHeartRateReadings(patientCpf).then((entries) => {
          setHeartRateReadings(entries)
        })
      }

      if (!wasStepsSynced && nowStepsSynced) {
        void seedIntegrationStepsDayRecords(patientCpf).then((records) => {
          setStepsDayRecords(records)
        })
      }
    })
  }

  function openHealthIntegration() {
    withMetricsAuth(() => {
      setIntegrationConnectRequest(Platform.OS === 'ios' ? 'apple-health' : 'health-connect')
    })
  }

  function handleEditProfileField(field: EditableProfileFieldId) {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      if (field === 'weight') {
        setSelectedMetricId('peso')
      }
      runAfterUiReady(() => {
        setEditingProfileField(field)
      })
    })
  }

  function handleMetricPress(metricId: ChartableMetricId) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (metricId === 'corporais') {
      setSelectedMetricId('corporais')
      setPeriod(buildPeriodSelection(BODY_MEASUREMENT_CHART_PERIOD))
      setChartScrollToken((token) => token + 1)
      return
    }
    setSelectedMetricId(metricId)
  }

  function handleWeightChartPress() {
    setSelectedMetricId('peso')
  }

  function handleBack() {
    navigateTo('home')
  }

  useAndroidBackHandler(() => {
    if (profileOnboardingVisible) {
      return true
    }

    if (bodyMeasurementLogTarget !== null) {
      setBodyMeasurementLogTarget(null)
      return true
    }

    if (bodyMeasurementsDrawerVisible) {
      setBodyMeasurementsDrawerVisible(false)
      return true
    }

    if (editingProfileField !== null) {
      setEditingProfileField(null)
      return true
    }

    if (periodDrawerVisible) {
      setPeriodDrawerVisible(false)
      return true
    }

    if (hydrationDrawerVisible) {
      setHydrationDrawerVisible(false)
      return true
    }

    if (hydrationReportDrawerVisible) {
      setHydrationReportDrawerVisible(false)
      return true
    }

    if (glucoseDrawerVisible) {
      setGlucoseDrawerVisible(false)
      return true
    }

    if (glucoseReportDrawerVisible) {
      setGlucoseReportDrawerVisible(false)
      return true
    }

    if (bloodPressureDrawerVisible) {
      setBloodPressureDrawerVisible(false)
      return true
    }

    if (bloodPressureReportDrawerVisible) {
      setBloodPressureReportDrawerVisible(false)
      return true
    }

    if (heartRateDrawerVisible) {
      setHeartRateDrawerVisible(false)
      return true
    }

    if (heartRateReportDrawerVisible) {
      setHeartRateReportDrawerVisible(false)
      return true
    }

    if (stepsDrawerVisible) {
      setStepsDrawerVisible(false)
      return true
    }

    if (circumferenceDrawerVisible) {
      setCircumferenceDrawerVisible(false)
      return true
    }

    if (imcDrawerVisible) {
      setImcDrawerVisible(false)
      return true
    }

    if (bodyCompositionReportDrawerVisible) {
      setBodyCompositionReportDrawerVisible(false)
      return true
    }

    if (bodyMeasurementsReportDrawerVisible) {
      setBodyMeasurementsReportDrawerVisible(false)
      return true
    }

    if (distanceDrawerVisible) {
      setDistanceDrawerVisible(false)
      return true
    }

    if (integrationConnectRequest !== null) {
      setIntegrationConnectRequest(null)
      return true
    }

    if (menuVisible) {
      closeMenu()
      return true
    }

    return false
  })

  function applyWeightHistoryUpdate(weight: string) {
    const weightKg = parseWeightKg(weight)
    if (weightKg === null) return

    setSelectedMetricId('peso')
    void registerWeightReading(patientCpf, weightKg).then((entries) => {
      setWeightHistory(entries)
      setChartScrollToken((token) => token + 1)
    })
  }

  function refreshResumoLatest() {
    void loadMetricsResumo(patientCpf).then((resumo) => {
      setProfile(metricsResumoToProfileSnapshot(resumo))
      setResumoLatest(resumo.latest)
    })
  }

  function handleProfileOnboardingComplete(height: string, weight: string, birthDate: string) {
    const fallback = onboardingProfileSnapshot(height, weight, birthDate)

    void saveMetricsProfile(
      patientCpf,
      onboardingToUpdateInput(height, weight, birthDate),
      fallback,
    ).then((next) => {
      setProfile(next)
      refreshResumoLatest()
      applyWeightHistoryUpdate(weight)
    })
  }

  function handleSaveProfileField(field: EditableProfileFieldId, value: string) {
    withMetricsAuth(() => {
      const fallback: ProfileSnapshot = { ...profile, [field]: value }
      const input = profileFieldToUpdateInput(field, value)

      void saveMetricsProfile(patientCpf, input, fallback).then((next) => {
        setProfile(next)
        refreshResumoLatest()
        if (field === 'weight') {
          applyWeightHistoryUpdate(value)
        }
      })
    })
  }

  function pushLiveRegistration(
    metricId: ChartableMetricId,
    value: number,
    options?: { diastolic?: number },
  ) {
    const point = createLiveRegistrationPoint(metricId, value, period, new Date(), options)
    setLiveRegistrations((prev) => ({
      ...prev,
      [metricId]: [...(prev[metricId] ?? []), point],
    }))
    setChartScrollToken((token) => token + 1)
  }

  function handleOpenHydrationReport() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('hidratacao')
      runAfterUiReady(() => {
        setHydrationReportDrawerVisible(true)
      })
    })
  }

  function handleOpenHydrationDrawer() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('hidratacao')
      runAfterUiReady(() => {
        setHydrationDrawerVisible(true)
      })
    })
  }

  function handleRegisterHydration(amountMl: number) {
    withMetricsAuth(() => {
      setSelectedMetricId('hidratacao')
      void registerHydrationReading(patientCpf, amountMl).then((entries) => {
        setHydrationHistory(entries)
      })
    })
  }

  function handleOpenGlucoseReport() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('glicemia')
      runAfterUiReady(() => {
        setGlucoseReportDrawerVisible(true)
      })
    })
  }

  function handleOpenGlucoseDrawer() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('glicemia')
      runAfterUiReady(() => {
        setGlucoseDrawerVisible(true)
      })
    })
  }

  function handleOpenBloodPressureDrawer() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('pressao')
      runAfterUiReady(() => {
        setBloodPressureDrawerVisible(true)
      })
    })
  }

  function handleOpenBloodPressureReport() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('pressao')
      runAfterUiReady(() => {
        setBloodPressureReportDrawerVisible(true)
      })
    })
  }

  function handleRegisterGlucose(reading: GlucoseReading) {
    withMetricsAuth(() => {
      setSelectedMetricId('glicemia')
      void registerGlucoseReading(patientCpf, reading.amountMg, reading.context).then((entries) => {
        setGlucoseHistory(entries)
      })
    })
  }

  function handleRegisterBloodPressure(reading: BloodPressureReading) {
    withMetricsAuth(() => {
      setSelectedMetricId('pressao')
      void registerBloodPressureReading(
        patientCpf,
        reading.systolic,
        reading.diastolic,
      ).then((entries) => {
        setBloodPressureHistory(entries)
      })
    })
  }

  function handleOpenHeartRateDrawer() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('frequencia')
      runAfterUiReady(() => {
        setHeartRateDrawerVisible(true)
      })
    })
  }

  function handleOpenHeartRateReport() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('frequencia')
      runAfterUiReady(() => {
        setHeartRateReportDrawerVisible(true)
      })
    })
  }

  function handleManualHeartRateReading(reading: HeartRateReading) {
    withMetricsAuth(() => {
      setSelectedMetricId('frequencia')
      pushLiveRegistration('frequencia', reading.bpm)
      void registerHeartRateReading(patientCpf, reading).then((entries) => {
        setHeartRateReadings(entries)
      })
    })
  }

  function handleOpenStepsDrawer() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('passos')
      runAfterUiReady(() => {
        setStepsDrawerVisible(true)
      })
    })
  }

  function handleManualWalk(entry: ManualWalkEntry) {
    withMetricsAuth(() => {
      void registerManualWalk(patientCpf, entry).then((nextRecords) => {
        setStepsDayRecords(nextRecords)
        const todaySteps = getTodaySteps(nextRecords)
        setSelectedMetricId('passos')
        pushLiveRegistration('passos', todaySteps)
        pushLiveRegistration('distancia', getTodayDistanceKm(nextRecords))
      })
    })
  }

  function handleOpenDistanceDrawer() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('distancia')
      runAfterUiReady(() => {
        setDistanceDrawerVisible(true)
      })
    })
  }

  function handleViewStepsFromDistance() {
    runAfterUiReady(() => {
      handleOpenStepsDrawer()
    })
  }

  function handleOpenCircumferenceDrawer() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('circunferencia')
      runAfterUiReady(() => {
        setCircumferenceDrawerVisible(true)
      })
    })
  }

  function handleOpenImcDrawer() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('imc')
      runAfterUiReady(() => {
        setImcDrawerVisible(true)
      })
    })
  }

  function handleOpenBodyCompositionReport() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('imc')
      runAfterUiReady(() => {
        setBodyCompositionReportDrawerVisible(true)
      })
    })
  }

  function handleOpenBodyMeasurementsReport() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('corporais')
      runAfterUiReady(() => {
        setBodyMeasurementsReportDrawerVisible(true)
      })
    })
  }

  function handleImcEditWeight() {
    runAfterUiReady(() => {
      handleEditProfileField('weight')
    })
  }

  function handleImcEditHeight() {
    runAfterUiReady(() => {
      handleEditProfileField('height')
    })
  }

  function handleRegisterCircumference(valueCm: number) {
    withMetricsAuth(() => {
      setSelectedMetricId('circunferencia')
      pushLiveRegistration('circunferencia', valueCm)
      void registerBodyMeasurementReading(patientCpf, 'abdomen', valueCm).then((history) => {
        setBodyMeasurementHistory(history)
        setChartScrollToken((token) => token + 1)
      })
    })
  }

  function handleOpenCorporaisDrawer() {
    withMetricsAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSelectedMetricId('corporais')
      setPeriod(buildPeriodSelection(BODY_MEASUREMENT_CHART_PERIOD))
      runAfterUiReady(() => {
        setBodyMeasurementsDrawerVisible(true)
      })
    })
  }

  function handleSelectBodyMeasurement(id: BodyMeasurementId) {
    setActiveBodyMeasurementId(id)
    setSelectedMetricId('corporais')
    setPeriod(buildPeriodSelection(BODY_MEASUREMENT_CHART_PERIOD))
    setChartScrollToken((token) => token + 1)
  }

  function handleOpenBodyMeasurementLog(id: BodyMeasurementId) {
    withMetricsAuth(() => {
      setBodyMeasurementLogTarget(id)
    })
  }

  function handleRegisterBodyMeasurement(id: BodyMeasurementId, value: number) {
    withMetricsAuth(() => {
    setSelectedMetricId('corporais')
    setActiveBodyMeasurementId(id)
    setChartScrollToken((token) => token + 1)

    if (id === 'peso') {
      const formattedWeight = `${value.toFixed(1).replace('.', ',')} kg`
      setProfile((prev) => ({ ...prev, weight: formattedWeight }))
      void registerWeightReading(patientCpf, value).then((entries) => {
        setWeightHistory(entries)
        setChartScrollToken((token) => token + 1)
      })
      return
    }

    if (id === 'abdomen') {
      setSelectedMetricId('corporais')
      setActiveBodyMeasurementId('abdomen')
      pushLiveRegistration('circunferencia', value)
      void registerBodyMeasurementReading(patientCpf, 'abdomen', value).then((history) => {
        setBodyMeasurementHistory(history)
        setChartScrollToken((token) => token + 1)
      })
      return
    }

    if (!isStorableBodyMeasurementId(id)) return

    void registerBodyMeasurementReading(patientCpf, id, value).then((history) => {
      setBodyMeasurementHistory(history)
      setChartScrollToken((token) => token + 1)
    })
    })
  }

  const bodyMeasurementLogInitialValue =
    bodyMeasurementLogTarget === null
      ? 0
      : getLatestBodyMeasurementValue(
          bodyMeasurementLogTarget,
          bodyMeasurementHistory,
          weightHistory,
          profile,
        )

  const latestAbdomenValue = useMemo(
    () => getLatestBodyMeasurementSeriesValue(bodyMeasurementHistory, 'abdomen'),
    [bodyMeasurementHistory],
  )

  const todayHydrationRecord = useMemo(
    () => getTodayHydrationRecord(hydrationHistory),
    [hydrationHistory],
  )
  const hydrationDisplayValue = todayHydrationRecord
    ? getTodayHydrationLiters(hydrationHistory)
    : resumoLatest?.hidratacaoMlHoje != null && resumoLatest.hidratacaoMlHoje > 0
      ? resumoLatest.hidratacaoMlHoje / 1000
      : undefined

  const latestGlucoseEntry = useMemo(() => getLatestGlucoseEntry(glucoseHistory), [glucoseHistory])
  const glucoseDisplayValue =
    latestGlucoseEntry?.amountMg ?? resumoLatest?.glicemiaMgDl ?? undefined

  const latestBloodPressureEntry = useMemo(
    () => getLatestBloodPressureEntry(bloodPressureHistory),
    [bloodPressureHistory],
  )
  const bloodPressureDisplayLabel = latestBloodPressureEntry
    ? formatBloodPressureShort(
        latestBloodPressureEntry.systolic,
        latestBloodPressureEntry.diastolic,
      )
    : resumoLatest?.pressaoSistolica != null && resumoLatest.pressaoDiastolica != null
      ? formatBloodPressureShort(
          resumoLatest.pressaoSistolica,
          resumoLatest.pressaoDiastolica,
        )
      : undefined

  const heartRateDisplayValue =
    getLatestHeartRateReading(heartRateReadings)?.bpm ?? resumoLatest?.frequenciaBpm ?? undefined

  const circumferenceDisplayValue =
    latestAbdomenValue ?? resumoLatest?.circunferenciaAbdomenCm ?? undefined

  const todaySteps = getTodaySteps(stepsDayRecords)
  const todayDistanceKm = getTodayDistanceKm(stepsDayRecords)
  const stepsDisplayValue =
    todaySteps > 0 ? todaySteps : resumoLatest?.passosHoje ?? undefined
  const distanceDisplayValue =
    todayDistanceKm > 0 ? todayDistanceKm : resumoLatest?.distanciaKmHoje ?? undefined
  const stepsDisplayLabel =
    !hasStepsSync && stepsDayRecords.length === 0
      ? 'Conectar'
      : todaySteps > 0
        ? `${formatStepsCount(todaySteps)} / ${formatStepsCount(DEFAULT_STEPS_GOAL)}`
        : undefined

  function handleTabPress(tab: BottomTabId) {
    if (tab === 'home') {
      setMenuVisible(false)
      navigateTo('home')
      return
    }

    if (tab === 'menu') {
      setMenuVisible(true)
      setActiveTab('menu')
      return
    }

    if (tab === 'agendar') {
      setMenuVisible(false)
      navigateTo('schedule-appointment')
      return
    }

    if (tab === 'my-metrics') {
      setMenuVisible(false)
      setActiveTab('my-metrics')
      return
    }

    if (tab === 'pos-consulta') {
      setMenuVisible(false)
      navigateTo('post-consultation')
      return
    }

    setMenuVisible(false)
    setActiveTab(tab)
  }

  function closeMenu() {
    setMenuVisible(false)
    setActiveTab(null)
  }

  function handleLogout() {
    closeMenu()
    void logout()
  }

  return (
    <>
      <View style={styles.root}>
        <ImageBackground
          source={backgroundSource}
          style={styles.background}
          resizeMode="cover"
          imageStyle={styles.backgroundImage}
        />

        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Voltar para início"
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Minhas Métricas</Text>
            <Text style={styles.headerSubtitle}>Acompanhe sua evolução de saúde</Text>
          </View>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: bottomContentPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          removeClippedSubviews={Platform.OS === 'android'}
          decelerationRate="normal"
          onScrollBeginDrag={() => setPageScrolling(true)}
          onScrollEndDrag={(event) => {
            if (Math.abs(event.nativeEvent.velocity?.y ?? 0) < 0.15) {
              setPageScrolling(false)
            }
          }}
          onMomentumScrollEnd={() => setPageScrolling(false)}
        >
          <ProfileKpiStrip
            profile={profile}
            onEditField={handleEditProfileField}
            onWeightPress={handleWeightChartPress}
            skeleton={showSkeleton}
          />

          <View style={styles.chartCard}>
            <View
              style={[
                styles.chartCardBorder,
                {
                  borderColor: hexToRgba(chartMetricAccent, 0.16),
                  shadowColor: chartMetricAccent,
                },
              ]}
            >
              <View style={styles.chartCardInner}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartTitleCol}>
                    {showSkeleton ? (
                      <>
                        <SkeletonBone width={92} height={18} borderRadius={6} />
                        <SkeletonBone width={118} height={12} borderRadius={5} style={{ marginTop: 6 }} />
                      </>
                    ) : (
                      <>
                        <Text style={styles.chartTitle}>{chartMetricLabel}</Text>
                        <Text style={[styles.chartPeriod, { color: chartMetricAccent }]}>
                          {formatPeriodLabel(period)}
                        </Text>
                        {bodyMeasurementSummary ? (
                          <Text style={styles.chartSummary}>{bodyMeasurementSummary}</Text>
                        ) : null}
                      </>
                    )}
                  </View>

                  {showSkeleton ? (
                    <SkeletonBone width={56} height={19} borderRadius={4} />
                  ) : (
                    <View style={styles.chartHeaderActions}>
                      {selectedMetricId === 'glicemia' ? (
                        <Pressable
                          onPress={handleOpenGlucoseReport}
                          hitSlop={8}
                          style={({ pressed }) => [
                            styles.reportButton,
                            pressed && styles.reportButtonPressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel="Abrir relatório de glicemia"
                        >
                          <MaterialCommunityIcons
                            name="file-chart-outline"
                            size={19}
                            color={colors.textMuted}
                          />
                        </Pressable>
                      ) : null}

                      {selectedMetricId === 'hidratacao' ? (
                        <Pressable
                          onPress={handleOpenHydrationReport}
                          hitSlop={8}
                          style={({ pressed }) => [
                            styles.reportButton,
                            pressed && styles.reportButtonPressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel="Abrir relatório de hidratação"
                        >
                          <MaterialCommunityIcons
                            name="file-chart-outline"
                            size={19}
                            color={colors.textMuted}
                          />
                        </Pressable>
                      ) : null}

                      {selectedMetricId === 'pressao' ? (
                        <Pressable
                          onPress={handleOpenBloodPressureReport}
                          hitSlop={8}
                          style={({ pressed }) => [
                            styles.reportButton,
                            pressed && styles.reportButtonPressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel="Abrir relatório de pressão arterial"
                        >
                          <MaterialCommunityIcons
                            name="file-chart-outline"
                            size={19}
                            color={colors.textMuted}
                          />
                        </Pressable>
                      ) : null}

                      {selectedMetricId === 'imc' ? (
                        <Pressable
                          onPress={handleOpenBodyCompositionReport}
                          hitSlop={8}
                          style={({ pressed }) => [
                            styles.reportButton,
                            pressed && styles.reportButtonPressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel="Abrir relatório de composição corporal"
                        >
                          <MaterialCommunityIcons
                            name="file-chart-outline"
                            size={19}
                            color={colors.textMuted}
                          />
                        </Pressable>
                      ) : null}

                      {selectedMetricId === 'corporais' ? (
                        <Pressable
                          onPress={handleOpenBodyMeasurementsReport}
                          hitSlop={8}
                          style={({ pressed }) => [
                            styles.reportButton,
                            pressed && styles.reportButtonPressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel="Abrir relatório de medidas corporais"
                        >
                          <MaterialCommunityIcons
                            name="file-chart-outline"
                            size={19}
                            color={colors.textMuted}
                          />
                        </Pressable>
                      ) : null}

                      {selectedMetricId === 'frequencia' && !isSelectedMetricChartUnavailable ? (
                        <Pressable
                          onPress={handleOpenHeartRateReport}
                          hitSlop={8}
                          style={({ pressed }) => [
                            styles.reportButton,
                            pressed && styles.reportButtonPressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel="Abrir relatório de frequência cardíaca"
                        >
                          <MaterialCommunityIcons
                            name="file-chart-outline"
                            size={19}
                            color={colors.textMuted}
                          />
                        </Pressable>
                      ) : null}

                      <Pressable
                        onPress={() => withMetricsAuth(() => setPeriodDrawerVisible(true))}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.calendarButton,
                          pressed && styles.calendarButtonPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Selecionar período"
                      >
                        <Ionicons name="calendar-outline" size={19} color={colors.textMuted} />
                      </Pressable>
                    </View>
                  )}
                </View>

                <MetricsAreaChart
                  data={chartDataForDisplay}
                  metricLabel={chartMetricLabel}
                  unit={chartMetricUnit}
                  accentColor={chartMetricAccent}
                  width={chartWidth - 28}
                  period={period}
                  forceDailyAxis={
                    selectedMetricId === 'peso' ||
                    selectedMetricId === 'imc' ||
                    selectedMetricId === 'corporais' ||
                    selectedMetricId === 'circunferencia'
                  }
                  animateKey={`${selectedMetricId}-${activeBodyMeasurementId}-${period.preset}-${formatPeriodLabel(period)}`}
                  scrollToken={chartScrollToken}
                  skeleton={showSkeleton}
                  interactionPaused={pageScrolling}
                  emptyMessage={
                    isSelectedMetricChartUnavailable
                      ? 'Gráfico não disponível. Conecte seus dados de saúde.'
                      : undefined
                  }
                />

                {showSkeleton ? (
                  <SkeletonBone width="72%" height={11} borderRadius={4} style={{ marginTop: 8 }} />
                ) : isSelectedMetricChartUnavailable ? null : (
                  <Text style={styles.chartAxisHint}>
                    Toque nos pontos · arraste ↔ para navegar no tempo · Eixo horizontal:{' '}
                    {selectedMetricId === 'peso' ||
                    selectedMetricId === 'imc' ||
                    selectedMetricId === 'corporais' ||
                    selectedMetricId === 'circunferencia' ||
                    !isHourlyPeriod(period)
                      ? 'data'
                      : 'hora'}{' '}
                    · Eixo vertical: {chartMetricUnit || chartMetricLabel}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Indicadores de saúde</Text>
            <MetricsHoldToEditHint />
          </View>

          <View style={styles.metricsGrid}>
            {metricRows.map((row, rowIndex) => (
              <View key={`metric-row-${rowIndex}`} style={styles.metricsRow}>
                {row.map((metric) => (
                  <SelectableMetricCard
                    key={metric.id}
                    metric={metric}
                    width={metricCardWidth}
                    profile={profile}
                    resumoLatest={resumoLatest}
                    skeleton={showSkeleton}
                    valueOverride={
                      metric.id === 'hidratacao'
                        ? hydrationDisplayValue
                        : metric.id === 'glicemia'
                          ? glucoseDisplayValue
                          : metric.id === 'frequencia'
                            ? heartRateDisplayValue
                            : metric.id === 'passos'
                              ? stepsDisplayValue
                              : metric.id === 'distancia'
                                ? distanceDisplayValue
                                : metric.id === 'circunferencia'
                                  ? circumferenceDisplayValue
                                  : undefined
                    }
                    displayLabelOverride={
                      metric.id === 'glicemia' && glucoseDisplayValue === undefined
                        ? '—'
                        : metric.id === 'hidratacao' && hydrationDisplayValue === undefined
                        ? '—'
                        : metric.id === 'pressao' && !bloodPressureDisplayLabel
                        ? '—'
                        : metric.id === 'pressao'
                        ? bloodPressureDisplayLabel
                        : metric.id === 'frequencia' && !hasHeartRateSync && heartRateReadings.length === 0
                          ? 'Conectar'
                          : metric.id === 'passos'
                            ? stepsDisplayLabel
                            : metric.id === 'distancia' &&
                                !hasStepsSync &&
                                !hasDistanceSync &&
                                stepsDayRecords.length === 0
                              ? 'Conectar'
                              : undefined
                    }
                    selected={metric.id === selectedMetricId}
                    onPress={() => handleMetricPress(metric.id)}
                    onLongPress={
                      metric.id === 'hidratacao'
                        ? handleOpenHydrationDrawer
                        : metric.id === 'glicemia'
                          ? handleOpenGlucoseDrawer
                          : metric.id === 'pressao'
                            ? handleOpenBloodPressureDrawer
                            : metric.id === 'frequencia'
                              ? handleOpenHeartRateDrawer
                              : metric.id === 'passos'
                                ? handleOpenStepsDrawer
                                : metric.id === 'distancia'
                                  ? handleOpenDistanceDrawer
                                  : metric.id === 'circunferencia'
                                  ? handleOpenCircumferenceDrawer
                                  : metric.id === 'corporais'
                                    ? handleOpenCorporaisDrawer
                                    : metric.id === 'imc'
                                    ? handleOpenImcDrawer
                                    : undefined
                    }
                  />
                ))}
              </View>
            ))}
          </View>

          <NeonSectionDivider />

          <Text style={styles.integrationsSectionTitle}>Conecte seus dados</Text>

          <HealthIntegrationsCard
            skeleton={showSkeleton}
            connections={healthConnections}
            onConnectionsChange={handleHealthConnectionsChange}
            connectRequestId={integrationConnectRequest}
            onConnectRequestHandled={() => setIntegrationConnectRequest(null)}
          />
        </ScrollView>

        <BottomTabBar
          activeTab={menuVisible ? 'menu' : activeTab}
          onTabPress={handleTabPress}
        />
      </View>

      <MenuDrawer
        visible={menuVisible}
        userName={user?.name}
        selfieUri={user?.selfieUri}
        onClose={closeMenu}
        onLogoutPress={handleLogout}
      />

      <MetricsPeriodDrawer
        visible={periodDrawerVisible}
        period={period}
        onClose={() => setPeriodDrawerVisible(false)}
        onApply={setPeriod}
      />

      <MetricsProfileOnboardingDrawer
        visible={profileOnboardingVisible}
        profile={profile}
        onComplete={handleProfileOnboardingComplete}
      />

      <ProfileFieldEditDrawer
        visible={editingProfileField !== null}
        field={editingProfileField}
        profile={profile}
        onClose={() => setEditingProfileField(null)}
        onSave={handleSaveProfileField}
      />

      <HydrationLogDrawer
        visible={hydrationDrawerVisible}
        onClose={() => setHydrationDrawerVisible(false)}
        onRegister={handleRegisterHydration}
      />

      <HydrationReportDrawer
        visible={hydrationReportDrawerVisible}
        onClose={() => setHydrationReportDrawerVisible(false)}
        patientCpf={patientCpf}
        period={period}
        patientName={user?.name}
      />

      <GlucoseLogDrawer
        visible={glucoseDrawerVisible}
        onClose={() => setGlucoseDrawerVisible(false)}
        onRegister={handleRegisterGlucose}
      />

      <GlucoseReportDrawer
        visible={glucoseReportDrawerVisible}
        onClose={() => setGlucoseReportDrawerVisible(false)}
        patientCpf={patientCpf}
        period={period}
        patientName={user?.name}
      />

      <BloodPressureLogDrawer
        visible={bloodPressureDrawerVisible}
        onClose={() => setBloodPressureDrawerVisible(false)}
        onRegister={handleRegisterBloodPressure}
      />

      <BloodPressureReportDrawer
        visible={bloodPressureReportDrawerVisible}
        onClose={() => setBloodPressureReportDrawerVisible(false)}
        patientCpf={patientCpf}
        period={period}
        patientName={user?.name}
      />

      <HeartRateHistoryDrawer
        visible={heartRateDrawerVisible}
        onClose={() => setHeartRateDrawerVisible(false)}
        readings={heartRateReadings}
        hasIntegration={hasHeartRateSync}
        onConnectPress={openHealthIntegration}
        onManualReading={handleManualHeartRateReading}
      />

      <HeartRateReportDrawer
        visible={heartRateReportDrawerVisible}
        onClose={() => setHeartRateReportDrawerVisible(false)}
        readings={heartRateReadings}
        period={period}
        stepsRecords={stepsDayRecords}
        hasActivityIntegration={hasStepsSync || hasDistanceSync}
        patientName={user?.name}
      />

      <StepsHistoryDrawer
        visible={stepsDrawerVisible}
        onClose={() => setStepsDrawerVisible(false)}
        records={stepsDayRecords}
        hasIntegration={hasStepsSync}
        onConnectPress={openHealthIntegration}
        onManualWalk={handleManualWalk}
      />

      <AbdominalCircumferenceLogDrawer
        visible={circumferenceDrawerVisible}
        profile={profile}
        initialValueCm={circumferenceDisplayValue}
        onClose={() => setCircumferenceDrawerVisible(false)}
        onRegister={({ valueCm }) => handleRegisterCircumference(valueCm)}
      />

      <ImcDrawer
        visible={imcDrawerVisible}
        profile={profile}
        onClose={() => setImcDrawerVisible(false)}
        onEditWeight={handleImcEditWeight}
        onEditHeight={handleImcEditHeight}
      />

      <BodyCompositionReportDrawer
        visible={bodyCompositionReportDrawerVisible}
        onClose={() => setBodyCompositionReportDrawerVisible(false)}
        profile={profile}
        weightHistory={weightHistory}
        bodyMeasurementHistory={bodyMeasurementHistory}
        period={period}
        patientName={user?.name}
      />

      <BodyMeasurementsReportDrawer
        visible={bodyMeasurementsReportDrawerVisible}
        onClose={() => setBodyMeasurementsReportDrawerVisible(false)}
        bodyMeasurementHistory={bodyMeasurementHistory}
        weightHistory={weightHistory}
        profile={profile}
        period={period}
        activeMeasurementId={activeBodyMeasurementId}
        patientName={user?.name}
      />

      <DistanceHistoryDrawer
        visible={distanceDrawerVisible}
        onClose={() => setDistanceDrawerVisible(false)}
        records={stepsDayRecords}
        hasIntegration={hasStepsSync || hasDistanceSync}
        hasDistanceSync={hasDistanceSync}
        onConnectPress={openHealthIntegration}
        onManualWalk={handleManualWalk}
        onViewStepsPress={handleViewStepsFromDistance}
      />

      <BodyMeasurementsDrawer
        visible={bodyMeasurementsDrawerVisible}
        profile={profile}
        history={bodyMeasurementHistory}
        weightHistory={weightHistory}
        activeMeasurementId={activeBodyMeasurementId}
        onClose={() => setBodyMeasurementsDrawerVisible(false)}
        onSelectMeasurement={handleSelectBodyMeasurement}
        onRegisterMeasurement={handleOpenBodyMeasurementLog}
      />

      <BodyMeasurementLogDrawer
        visible={bodyMeasurementLogTarget !== null}
        measurementId={bodyMeasurementLogTarget}
        initialValue={bodyMeasurementLogInitialValue}
        onClose={() => setBodyMeasurementLogTarget(null)}
        onRegister={handleRegisterBodyMeasurement}
      />
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  backButtonPressed: {
    opacity: 0.82,
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  profileStripWrap: {
    marginTop: 2,
  },
  profileStripBorder: {
    borderRadius: 18,
    padding: 1,
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  profileStripInner: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: 17,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  profileStripItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'stretch',
    justifyContent: 'center',
    position: 'relative',
  },
  profileStripPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 14,
    gap: 4,
  },
  profileStripPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  profileDivider: {
    position: 'absolute',
    right: 0,
    top: 16,
    bottom: 16,
    width: 1,
    backgroundColor: colors.surfaceBorder,
  },
  profileLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  profileValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  chartCard: {
    marginTop: 2,
  },
  chartCardBorder: {
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: colors.backgroundElevated,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 8,
  },
  chartCardInner: {
    borderRadius: 21,
    overflow: 'visible',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chartTitleCol: {
    flex: 1,
    gap: 2,
  },
  chartTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  chartPeriod: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartSummary: {
    color: '#f0abfc',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 15,
  },
  chartHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportButton: {
    padding: 2,
  },
  reportButtonPressed: {
    opacity: 0.55,
  },
  calendarButton: {
    padding: 2,
  },
  calendarButtonPressed: {
    opacity: 0.55,
  },
  chartAxisHint: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  integrationsSectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 2,
    marginBottom: 2,
  },
  metricsGrid: {
    gap: METRIC_GRID_GAP,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: METRIC_GRID_GAP,
  },
  metricCard: {
    flexShrink: 0,
    flexGrow: 0,
    alignSelf: 'stretch',
  },
  metricCardSelected: {
    transform: [{ scale: 1.015 }],
  },
  metricCardPressed: {
    opacity: 0.9,
  },
  metricCardShell: {
    flex: 1,
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  metricCardShellSelected: {
    borderColor: 'rgba(255, 255, 255, 0.42)',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
  },
  metricTopStripe: {
    height: 3,
    width: '100%',
  },
  metricCardInner: {
    flex: 1,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 6,
    minHeight: 80,
    justifyContent: 'center',
  },
  metricCardInnerSkeleton: {
    backgroundColor: colors.surface,
  },
  metricCardGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  metricCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
  },
  metricCardContentCentered: {
    alignSelf: 'center',
  },
  metricCardTextCentered: {
    width: '100%',
    textAlign: 'center',
    alignSelf: 'center',
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 8,
    fontWeight: '600',
    lineHeight: 11,
    textAlign: 'center',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    width: '100%',
  },
  metricValueSelected: {
    color: '#ffffff',
    ...Platform.select({
      web: {
        textShadow: '0px 1px 2px rgba(0, 0, 0, 0.2)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  metricValueHint: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.1,
    textAlign: 'center',
    width: '100%',
  },
  metricValueHintSelected: {
    color: '#ffffff',
  },
  metricValueHintChevron: {
    color: '#ffffff',
    fontWeight: '600',
  },
})
