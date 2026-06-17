import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { AppModal } from '../AppModal'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BodyMeasurementHistory, BodyMeasurementId } from '../../types/bodyMeasurements'
import { MetricDataPoint, PeriodSelection, ProfileSnapshot } from '../../types/metrics'
import {
  buildBodyMeasurementsReport,
  formatBodyMeasurementReportValue,
  getBodyMeasurementTrendDirectionLabel,
  getBodyMeasurementsReportAccent,
} from '../../utils/bodyMeasurementsReport'
import { shareBodyMeasurementsReportPdf } from '../../utils/bodyMeasurementsReportPdf'
import { colors } from '../../theme/colors'
import { PrimaryButton } from '../PrimaryButton'
import { GlucoseTrendLineChart } from './GlucoseTrendLineChart'
import { getModalFooterPadding } from '../../utils/modalSafeArea'

const MEASURES_GRADIENT = ['#f0abfc', '#d946ef', '#a21caf'] as const

type BodyMeasurementsReportDrawerProps = {
  visible: boolean
  onClose: () => void
  bodyMeasurementHistory: BodyMeasurementHistory
  weightHistory: MetricDataPoint[]
  profile: ProfileSnapshot
  period: PeriodSelection
  measurementOverrides?: Partial<Record<BodyMeasurementId, number>>
  activeMeasurementId?: BodyMeasurementId
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

function MeasurementRow({
  label,
  start,
  end,
  deltaLabel,
  count,
}: {
  label: string
  start: string
  end: string
  deltaLabel: string
  count: number
}) {
  return (
    <View style={styles.measurementRow}>
      <View style={styles.measurementRowHeader}>
        <Text style={styles.measurementRowTitle}>{label}</Text>
        <Text style={styles.measurementRowCount}>{count} reg.</Text>
      </View>
      <View style={styles.measurementRowValues}>
        <Text style={styles.measurementRowValue}>{start}</Text>
        <Text style={styles.measurementRowArrow}>→</Text>
        <Text style={[styles.measurementRowValue, styles.measurementRowValueEnd]}>{end}</Text>
      </View>
      <Text style={styles.measurementRowDelta}>{deltaLabel}</Text>
    </View>
  )
}

export function BodyMeasurementsReportDrawer({
  visible,
  onClose,
  bodyMeasurementHistory,
  weightHistory,
  profile,
  period,
  measurementOverrides,
  activeMeasurementId = 'abdomen',
  patientName,
}: BodyMeasurementsReportDrawerProps) {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const [isMounted, setIsMounted] = useState(false)
  const [exporting, setExporting] = useState(false)

  const sheetTranslateX = useRef(new Animated.Value(screenWidth)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const report = useMemo(
    () =>
      buildBodyMeasurementsReport(
        bodyMeasurementHistory,
        weightHistory,
        profile,
        period,
        measurementOverrides,
      ),
    [bodyMeasurementHistory, weightHistory, profile, period, measurementOverrides],
  )

  const activeSeries = useMemo(() => {
    if (activeMeasurementId === 'peso' || activeMeasurementId === 'cintura_quadril') {
      return report.waistHipRatio ?? report.allSeries[0] ?? null
    }
    return report.allSeries.find((entry) => entry.id === activeMeasurementId) ?? report.allSeries[0] ?? null
  }, [report, activeMeasurementId])

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
      await shareBodyMeasurementsReportPdf(report, { patientName })
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

  const heroLabel =
    report.mostChanged !== null
      ? `${report.mostChanged.label}: ${formatBodyMeasurementReportValue(report.mostChanged.id, report.mostChanged.end)}`
      : `${report.trackedMeasurementCount} medidas acompanhadas`

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
            colors={[...MEASURES_GRADIENT]}
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
              accessibilityLabel="Fechar relatório de medidas corporais"
            >
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
            </Pressable>

            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Relatório de medidas corporais</Text>
              <Text style={styles.headerSubtitle}>{report.periodLabel}</Text>
            </View>

            <LinearGradient
              colors={[...MEASURES_GRADIENT]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.headerOrb}
            >
              <MaterialCommunityIcons name="human" size={20} color="#fff" />
            </LinearGradient>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            contentContainerStyle={styles.scrollContent}
          >
            {report.totalReadings === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="human" size={42} color="#f0abfc" />
                <Text style={styles.emptyTitle}>Nenhuma medida no período</Text>
                <Text style={styles.emptyText}>
                  Registre circunferências corporais ou escolha outro intervalo no calendário.
                </Text>
              </View>
            ) : (
              <>
                <LinearGradient
                  colors={['rgba(217, 70, 239, 0.18)', 'rgba(217, 70, 239, 0.04)']}
                  style={styles.heroCard}
                >
                  <Text style={styles.heroEyebrow}>Evolução corporal</Text>
                  <Text style={styles.heroValue}>{heroLabel}</Text>
                  <Text style={styles.heroMeta}>
                    {report.totalReadings} registros · {report.trackedMeasurementCount} medidas ·
                    acompanhamento de emagrecimento e reabilitação
                  </Text>
                  {report.waistHipRatio ? (
                    <Text style={styles.heroMeta}>
                      Relação cintura/quadril:{' '}
                      {formatBodyMeasurementReportValue('cintura_quadril', report.waistHipRatio.end)}{' '}
                      ({report.waistHipRatio.deltaLabel})
                    </Text>
                  ) : null}
                </LinearGradient>

                <View style={styles.statsGrid}>
                  <StatCard
                    label="Medidas"
                    value={String(report.trackedMeasurementCount)}
                    note="com histórico"
                  />
                  <StatCard
                    label="Principais"
                    value={String(report.principal.length)}
                    note="abdômen, quadril"
                  />
                  <StatCard
                    label="Complementares"
                    value={String(report.complementar.length)}
                    note="braço, coxa, cintura"
                    accent="#f0abfc"
                  />
                  <StatCard
                    label="Maior mudança"
                    value={report.mostChanged?.shortLabel ?? '—'}
                    note={report.mostChanged?.deltaLabel ?? 'Estável'}
                    accent="#d946ef"
                  />
                </View>

                {report.highlights.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Principais mudanças</Text>
                    {report.highlights.map((item) => (
                      <Text key={item} style={styles.highlightItem}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {activeSeries && activeSeries.trend.buckets.length >= 2 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{activeSeries.label}</Text>
                    <Text style={styles.sectionHint}>
                      {getBodyMeasurementTrendDirectionLabel(activeSeries.trend.direction)} ·{' '}
                      {activeSeries.deltaLabel}
                    </Text>
                    <View style={styles.trendCard}>
                      <GlucoseTrendLineChart
                        buckets={activeSeries.trend.buckets}
                        width={screenWidth - 32}
                        accentColor={getBodyMeasurementsReportAccent(activeSeries.id)}
                      />
                    </View>
                  </View>
                ) : null}

                {report.principal.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Medidas principais</Text>
                    {report.principal.map((entry) => (
                      <MeasurementRow
                        key={entry.id}
                        label={entry.label}
                        start={formatBodyMeasurementReportValue(entry.id, entry.start)}
                        end={formatBodyMeasurementReportValue(entry.id, entry.end)}
                        deltaLabel={entry.deltaLabel}
                        count={entry.count}
                      />
                    ))}
                  </View>
                ) : null}

                {report.complementar.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Medidas complementares</Text>
                    {report.complementar.map((entry) => (
                      <MeasurementRow
                        key={entry.id}
                        label={entry.label}
                        start={formatBodyMeasurementReportValue(entry.id, entry.start)}
                        end={formatBodyMeasurementReportValue(entry.id, entry.end)}
                        deltaLabel={entry.deltaLabel}
                        count={entry.count}
                      />
                    ))}
                  </View>
                ) : null}

                <Text style={styles.disclaimer}>
                  Relatório indicado para acompanhamento de emagrecimento, hipertrofia e reabilitação.
                  Não substitui avaliação médica e não gera alertas automáticos.
                </Text>
              </>
            )}
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
  root: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.62)' },
  sheet: {
    ...StyleSheet.absoluteFillObject,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
  },
  topAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
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
  closeButtonPressed: { opacity: 0.75 },
  headerTextCol: { flex: 1, gap: 2 },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: { color: '#f0abfc', fontSize: 12, fontWeight: '600' },
  headerOrb: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 12, gap: 14 },
  heroCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.25)',
    alignItems: 'center',
  },
  heroEyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  heroValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 6,
    textAlign: 'center',
  },
  heroMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 17,
  },
  statsGrid: {
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
  section: { gap: 8 },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  highlightItem: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  trendCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: 8,
    overflow: 'visible',
  },
  measurementRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 12,
    gap: 6,
  },
  measurementRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  measurementRowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  measurementRowCount: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
  measurementRowValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  measurementRowValue: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  measurementRowArrow: {
    color: colors.textSubtle,
    fontSize: 12,
  },
  measurementRowValueEnd: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  measurementRowDelta: {
    color: '#f0abfc',
    fontSize: 11,
    fontWeight: '600',
  },
  disclaimer: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
})
