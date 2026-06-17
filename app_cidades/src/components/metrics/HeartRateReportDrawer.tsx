import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { AppModal } from '../AppModal'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatDistanceKmLabel, formatStepsCount } from '../../data/mockStepsHistory'
import { colors } from '../../theme/colors'
import { HeartRateReading } from '../../types/heartRate'
import { PeriodSelection } from '../../types/metrics'
import { StepsDayRecord } from '../../types/steps'
import {
  formatHeartRateDateTime,
  formatHeartRateTime,
  formatHeartRateValue,
  getHeartRateContextLabel,
  getHeartRateZone,
  HEART_RATE_HIGH_PEAK_BPM,
  HEART_RATE_NORMAL_MAX_BPM,
} from '../../utils/heartRate'
import {
  buildHeartRateReport,
  getHeartRateTrendDirectionLabel,
  mapHeartRateTrendToChartBuckets,
} from '../../utils/heartRateReport'
import { shareHeartRateReportPdf } from '../../utils/heartRateReportPdf'
import { PrimaryButton } from '../PrimaryButton'
import { GlucoseTrendLineChart } from './GlucoseTrendLineChart'
import { getModalFooterPadding } from '../../utils/modalSafeArea'

const HR_GRADIENT = ['#fca5a5', '#ef4444', '#dc2626'] as const

type HeartRateReportDrawerProps = {
  visible: boolean
  onClose: () => void
  readings: HeartRateReading[]
  period: PeriodSelection
  stepsRecords?: StepsDayRecord[]
  hasActivityIntegration?: boolean
  patientName?: string
}

function StatCard({
  label,
  value,
  note,
  accent,
}: {
  label: string
  value: string
  note?: string
  accent?: string
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text>
      {note ? <Text style={styles.statNote}>{note}</Text> : null}
    </View>
  )
}

function ZoneMark({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.zoneMark}>
      <Text style={[styles.zoneMarkText, { color }]}>{label}</Text>
      <View style={[styles.zoneMarkLine, { backgroundColor: color }]} />
    </View>
  )
}

function ReadingRow({ reading }: { reading: HeartRateReading }) {
  const zone = getHeartRateZone(reading.bpm)

  return (
    <View style={styles.readingBlock}>
      <Text style={styles.readingDate}>{formatHeartRateDateTime(reading.recordedAt)}</Text>
      <View style={styles.readingRow}>
        <View style={styles.readingCell}>
          <Text style={styles.readingValue}>{formatHeartRateValue(reading.bpm)}</Text>
        </View>
        <View style={styles.readingCell}>
          <Text style={styles.readingContext}>{getHeartRateContextLabel(reading.context)}</Text>
          <Text style={styles.readingMeta}>{formatHeartRateTime(reading.recordedAt)}</Text>
        </View>
        <View style={styles.readingCell}>
          <ZoneMark label={zone.label} color={zone.color} />
        </View>
      </View>
    </View>
  )
}

export function HeartRateReportDrawer({
  visible,
  onClose,
  readings,
  period,
  stepsRecords = [],
  hasActivityIntegration = false,
  patientName,
}: HeartRateReportDrawerProps) {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const [isMounted, setIsMounted] = useState(false)
  const [exporting, setExporting] = useState(false)

  const sheetTranslateX = useRef(new Animated.Value(screenWidth)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const report = useMemo(
    () =>
      buildHeartRateReport(readings, period, {
        stepsRecords,
        hasActivityIntegration,
      }),
    [readings, period, stepsRecords, hasActivityIntegration],
  )

  const chartBuckets = useMemo(
    () => mapHeartRateTrendToChartBuckets(report.trend.buckets),
    [report.trend.buckets],
  )

  const peakReadings = useMemo(
    () => report.peaksAboveNormal.readings.slice(0, 8),
    [report.peaksAboveNormal.readings],
  )

  const historyReadings = useMemo(() => report.readings.slice(0, 12), [report.readings])

  useEffect(() => {
    sheetTranslateX.setValue(screenWidth)
  }, [screenWidth, sheetTranslateX])

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      sheetTranslateX.setValue(screenWidth)
      backdropOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(sheetTranslateX, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (isMounted) {
      closeSheet(onClose)
    }
  }, [visible, screenWidth])

  function closeSheet(done?: () => void) {
    Animated.parallel([
      Animated.timing(sheetTranslateX, {
        toValue: screenWidth,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMounted(false)
      done?.()
    })
  }

  function handleDismiss() {
    if (!visible || exporting) return
    closeSheet(onClose)
  }

  async function handleShare() {
    if (exporting) return
    setExporting(true)
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    try {
      await shareHeartRateReportPdf(report, { patientName })
    } catch (error) {
      Alert.alert(
        'Não foi possível compartilhar',
        error instanceof Error ? error.message : 'Tente novamente em instantes.',
      )
    } finally {
      setExporting(false)
    }
  }

  if (!isMounted) return null

  const trendLabel = getHeartRateTrendDirectionLabel(report.trend.direction)

  return (
    <AppModal visible transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} disabled={!!exporting} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingTop: insets.top,
              paddingBottom: getModalFooterPadding(insets.bottom),
              transform: [{ translateX: sheetTranslateX }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(24, 24, 32, 0.99)', 'rgba(10, 10, 14, 1)']}
            style={StyleSheet.absoluteFillObject}
          />
          {Platform.OS === 'ios' ? (
            <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFillObject} />
          ) : null}

          <LinearGradient
            colors={[...HR_GRADIENT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.topAccent}
          />

          <View style={styles.header}>
            <Pressable
              onPress={handleDismiss}
              disabled={!!exporting}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Fechar relatório de frequência cardíaca"
            >
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
            </Pressable>

            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Relatório de frequência cardíaca</Text>
              <Text style={styles.headerSubtitle}>{report.periodLabel}</Text>
            </View>

            <LinearGradient
              colors={[...HR_GRADIENT]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.headerOrb}
            >
              <MaterialCommunityIcons name="heart-pulse" size={20} color="#fff" />
            </LinearGradient>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>Média em repouso</Text>
              <Text style={styles.heroValue}>
                {report.restingAvg > 0 ? `${report.restingAvg} bpm` : '—'}
              </Text>
              <Text style={styles.heroMeta}>
                Referência em repouso: até {HEART_RATE_NORMAL_MAX_BPM} bpm · Tendência {trendLabel}
                {report.trend.changePct !== 0
                  ? ` (${report.trend.changePct > 0 ? '+' : ''}${report.trend.changePct}%)`
                  : ''}
              </Text>
            </View>

            <View style={styles.statGrid}>
              <StatCard
                label="Média geral"
                value={report.overall.avg > 0 ? `${report.overall.avg} bpm` : '—'}
                note={
                  report.overall.min > 0
                    ? `${report.overall.min}–${report.overall.max} bpm`
                    : undefined
                }
              />
              <StatCard
                label="Esforço"
                value={report.workout.avg > 0 ? `${report.workout.avg} bpm` : '—'}
                note={`${report.workout.count} leituras`}
              />
              <StatCard
                label={`Acima de ${HEART_RATE_NORMAL_MAX_BPM}`}
                value={String(report.peaksAboveNormal.count)}
                note={`${report.peaksAboveNormal.pct}% das leituras`}
                accent="#fbbf24"
              />
              <StatCard
                label={`Picos > ${HEART_RATE_HIGH_PEAK_BPM}`}
                value={String(report.highPeaks.count)}
                note="Muito elevados"
                accent="#f87171"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Picos acima do normal</Text>
              {peakReadings.length === 0 ? (
                <Text style={styles.sectionMuted}>
                  Nenhuma leitura acima de {HEART_RATE_NORMAL_MAX_BPM} bpm no período.
                </Text>
              ) : (
                peakReadings.map((reading) => <ReadingRow key={reading.id} reading={reading} />)
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Relação com esforço</Text>
              <Text style={styles.effortSummary}>{report.effort.summary}</Text>
              {report.effort.available ? (
                <View style={styles.effortGrid}>
                  <StatCard
                    label="Repouso"
                    value={
                      report.effort.avgRestingBpm > 0
                        ? `${report.effort.avgRestingBpm} bpm`
                        : '—'
                    }
                  />
                  <StatCard
                    label="Esforço"
                    value={
                      report.effort.avgWorkoutBpm > 0
                        ? `${report.effort.avgWorkoutBpm} bpm`
                        : '—'
                    }
                  />
                  <StatCard
                    label="Dias ativos"
                    value={String(report.effort.activeDayCount)}
                  />
                  <StatCard
                    label="Passos / distância"
                    value={
                      report.effort.avgStepsOnActiveDays > 0
                        ? `${formatStepsCount(report.effort.avgStepsOnActiveDays)} · ${formatDistanceKmLabel(report.effort.avgDistanceKmOnActiveDays)}`
                        : '—'
                    }
                  />
                </View>
              ) : null}
            </View>

            {chartBuckets.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tendência no período</Text>
                <Text style={styles.sectionMuted}>{trendLabel}</Text>
                <GlucoseTrendLineChart
                  buckets={chartBuckets}
                  width={screenWidth - 48}
                  accentColor="#ef4444"
                />
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Histórico recente</Text>
              {historyReadings.length === 0 ? (
                <Text style={styles.sectionMuted}>Nenhuma leitura no período selecionado.</Text>
              ) : (
                historyReadings.map((reading) => <ReadingRow key={reading.id} reading={reading} />)
              )}
            </View>

            <Text style={styles.disclaimer}>
              Picos durante esforço são esperados. Betabloqueadores podem reduzir a frequência
              cardíaca. Este relatório apoia o acompanhamento, mas não substitui avaliação médica.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton
              label={exporting ? 'Gerando PDF…' : 'Compartilhar PDF'}
              onPress={handleShare}
              loading={exporting}
              disabled={report.totalReadings === 0}
            />
          </View>
        </Animated.View>
      </View>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  closeButtonPressed: {
    opacity: 0.75,
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
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
  },
  headerOrb: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    padding: 16,
    alignItems: 'center',
  },
  heroEyebrow: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    width: '100%',
  },
  heroValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
    width: '100%',
  },
  heroMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
    textAlign: 'center',
    width: '100%',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
    width: '100%',
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  statNote: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionMuted: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  effortSummary: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  effortGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  readingBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 12,
    gap: 8,
  },
  readingDate: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readingCell: {
    flex: 1,
  },
  readingValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  readingContext: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  readingMeta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  zoneMark: {
    alignItems: 'flex-end',
  },
  zoneMarkText: {
    fontSize: 11,
    fontWeight: '800',
  },
  zoneMarkLine: {
    width: 24,
    height: 2,
    borderRadius: 999,
    marginTop: 4,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
})
