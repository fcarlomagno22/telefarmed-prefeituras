import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { AppModal } from '../AppModal'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { BloodPressureHistoryEntry } from '../../types/bloodPressure'
import { PeriodSelection } from '../../types/metrics'
import {
  formatBloodPressureDateTime,
  formatBloodPressureShort,
  formatBloodPressureTime,
  formatBloodPressureValue,
  BLOOD_PRESSURE_TIME_SLOT_SHORT_LABELS,
  getBloodPressureZone,
} from '../../utils/bloodPressure'
import {
  buildBloodPressureReport,
  formatBloodPressureTargetLabel,
  getBloodPressureTrendDirectionLabel,
} from '../../utils/bloodPressureReport'
import { shareBloodPressureReportPdf } from '../../utils/bloodPressureReportPdf'
import { PrimaryButton } from '../PrimaryButton'
import { BloodPressureTrendLineChart } from './BloodPressureTrendLineChart'
import { getModalFooterPadding } from '../../utils/modalSafeArea'

const BP_GRADIENT = ['#fbbf24', '#f59e0b', '#d97706'] as const

type BloodPressureReportDrawerProps = {
  visible: boolean
  onClose: () => void
  history: BloodPressureHistoryEntry[]
  period: PeriodSelection
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

function TimeSlotCard({
  label,
  avgSystolic,
  avgDiastolic,
  count,
  aboveTargetPct,
  highlighted,
}: {
  label: string
  avgSystolic: number
  avgDiastolic: number
  count: number
  aboveTargetPct: number
  highlighted?: boolean
}) {
  if (count === 0) {
    return (
      <View style={styles.timeSlotCard}>
        <Text style={styles.timeSlotTitle}>{label}</Text>
        <Text style={styles.timeSlotEmpty}>Sem medições</Text>
      </View>
    )
  }

  return (
    <View style={[styles.timeSlotCard, highlighted && styles.timeSlotCardHighlight]}>
      <Text style={styles.timeSlotTitle}>{label}</Text>
      <Text style={styles.timeSlotAvg}>
        {formatBloodPressureShort(avgSystolic, avgDiastolic)}
      </Text>
      <Text style={styles.timeSlotMeta}>
        {count} {count === 1 ? 'medição' : 'medições'}
      </Text>
      <Text style={styles.timeSlotPct}>{aboveTargetPct}% acima da meta</Text>
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

function ReadingsTableHeader() {
  return (
    <View style={styles.readingsHeaderRow}>
      <Text style={styles.readingsHeaderCell}>Valor</Text>
      <Text style={styles.readingsHeaderCell}>Horário</Text>
      <Text style={styles.readingsHeaderCell}>Classificação</Text>
    </View>
  )
}

function ReadingRow({ entry }: { entry: BloodPressureHistoryEntry }) {
  const zone = getBloodPressureZone(entry.systolic, entry.diastolic)

  return (
    <View style={styles.readingBlock}>
      <Text style={styles.readingDate}>{formatBloodPressureDateTime(entry.recordedAt)}</Text>
      <View style={styles.readingRow}>
        <View style={styles.readingCell}>
          <Text style={styles.readingValue}>
            {formatBloodPressureValue(entry.systolic, entry.diastolic)}
          </Text>
        </View>
        <View style={styles.readingCell}>
          <Text style={styles.readingContext}>{formatBloodPressureTime(entry.recordedAt)}</Text>
        </View>
        <View style={styles.readingCell}>
          <ZoneMark label={zone.label} color={zone.color} />
        </View>
      </View>
    </View>
  )
}

export function BloodPressureReportDrawer({
  visible,
  onClose,
  history,
  period,
  patientName,
}: BloodPressureReportDrawerProps) {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const [isMounted, setIsMounted] = useState(false)
  const [exporting, setExporting] = useState(false)

  const sheetTranslateX = useRef(new Animated.Value(screenWidth)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const report = useMemo(
    () => buildBloodPressureReport(history, period),
    [history, period.end, period.preset, period.start],
  )

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
      await shareBloodPressureReportPdf(report, { patientName })
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

  const trendLabel = getBloodPressureTrendDirectionLabel(report.trend.direction)
  const trendColor =
    report.trend.direction === 'up'
      ? '#f87171'
      : report.trend.direction === 'down'
        ? '#34d399'
        : colors.textMuted
  const targetLabel = formatBloodPressureTargetLabel(report.target)

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
            colors={[...BP_GRADIENT]}
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
              accessibilityLabel="Fechar relatório de pressão arterial"
            >
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
            </Pressable>

            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Relatório de pressão</Text>
              <Text style={styles.headerSubtitle}>{report.periodLabel}</Text>
            </View>

            <LinearGradient
              colors={[...BP_GRADIENT]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.headerOrb}
            >
              <MaterialCommunityIcons name="heart-pulse" size={20} color="#fff" />
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
                <MaterialCommunityIcons name="heart-pulse" size={42} color="#fbbf24" />
                <Text style={styles.emptyTitle}>Nenhuma medição no período</Text>
                <Text style={styles.emptyText}>
                  Registre pressão arterial ou escolha outro intervalo no calendário.
                </Text>
              </View>
            ) : (
              <>
                <LinearGradient
                  colors={['rgba(245, 158, 11, 0.18)', 'rgba(245, 158, 11, 0.04)']}
                  style={styles.heroCard}
                >
                  <Text style={styles.heroEyebrow}>Média do período</Text>
                  <Text style={styles.heroValue}>
                    {formatBloodPressureShort(report.overall.avgSystolic, report.overall.avgDiastolic)}
                  </Text>
                  <Text style={styles.heroMeta}>
                    {report.totalReadings} medições · Sistólica {report.overall.minSystolic}–
                    {report.overall.maxSystolic} · Diastólica {report.overall.minDiastolic}–
                    {report.overall.maxDiastolic}
                  </Text>
                  <Text style={styles.heroTarget}>Meta: {targetLabel}</Text>
                </LinearGradient>

                <View style={styles.statsGrid}>
                  <StatCard
                    label="Na meta"
                    value={`${report.overall.inTargetPct}%`}
                    note={`< ${targetLabel}`}
                    accent="#34d399"
                  />
                  <StatCard
                    label="Acima da meta"
                    value={String(report.aboveTarget.count)}
                    note={`${report.aboveTarget.pct}% · ≥ ${targetLabel}`}
                    accent="#f87171"
                  />
                  <StatCard
                    label="Sustentada"
                    value={String(report.hypertensionPattern.sustainedDayCount)}
                    note="dias consecutivos"
                    accent="#fb923c"
                  />
                  <StatCard
                    label="Picos isolados"
                    value={String(report.hypertensionPattern.isolatedPeakCount)}
                    note="leituras pontuais"
                    accent="#fbbf24"
                  />
                </View>

                <View style={styles.statsGrid}>
                  <StatCard
                    label="Tendência"
                    value={trendLabel}
                    note={
                      report.trend.systolicChangePct === 0
                        ? 'Estável'
                        : `${report.trend.systolicChangePct > 0 ? '+' : ''}${report.trend.systolicChangePct}% sistólica`
                    }
                    accent={trendColor}
                  />
                  <StatCard
                    label="Horário de pico"
                    value={
                      report.peakTimeSlot
                        ? BLOOD_PRESSURE_TIME_SLOT_SHORT_LABELS[report.peakTimeSlot.slot]
                        : '—'
                    }
                    note={
                      report.peakTimeSlot
                        ? formatBloodPressureShort(
                            report.peakTimeSlot.avgSystolic,
                            report.peakTimeSlot.avgDiastolic,
                          )
                        : 'Sem dados'
                    }
                    accent="#f59e0b"
                  />
                </View>

                <Text style={styles.sectionTitle}>Pressão por horário</Text>
                <Text style={styles.sectionHint}>
                  Identifique quando a pressão tende a subir (manhã, tarde, noite ou madrugada)
                </Text>
                <View style={styles.timeSlotGrid}>
                  {report.timeSlots.map((slot) => (
                    <TimeSlotCard
                      key={slot.slot}
                      label={slot.label.split(' ')[0]}
                      avgSystolic={slot.avgSystolic}
                      avgDiastolic={slot.avgDiastolic}
                      count={slot.count}
                      aboveTargetPct={slot.aboveTargetPct}
                      highlighted={report.peakTimeSlot?.slot === slot.slot}
                    />
                  ))}
                </View>

                {report.trend.buckets.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>Tendência no período</Text>
                    <Text style={styles.sectionHint}>
                      Média diária sistólica e diastólica · Toque nos pontos para detalhes
                    </Text>
                    <View style={styles.trendCard}>
                      <BloodPressureTrendLineChart
                        buckets={report.trend.buckets}
                        width={screenWidth - 32}
                      />
                    </View>
                  </>
                ) : null}

                {(report.hypertensionPattern.sustainedDayCount > 0 ||
                  report.hypertensionPattern.isolatedPeakCount > 0 ||
                  report.aboveTarget.count > 0) && (
                  <>
                    <Text style={styles.sectionTitle}>Alertas clínicos</Text>
                    <View style={styles.alertsWrap}>
                      {report.hypertensionPattern.sustainedDayCount > 0 ? (
                        <View style={[styles.alertCard, styles.alertSustained]}>
                          <Text style={styles.alertTitle}>Hipertensão sustentada</Text>
                          <Text style={styles.alertSubtitle}>
                            {report.hypertensionPattern.sustainedDayCount} dias consecutivos com leituras elevadas
                          </Text>
                          {report.hypertensionPattern.sustainedReadings.slice(0, 4).map((entry) => (
                            <Text key={entry.id} style={styles.alertLine}>
                              {formatBloodPressureDateTime(entry.recordedAt)} ·{' '}
                              {formatBloodPressureShort(entry.systolic, entry.diastolic)}
                            </Text>
                          ))}
                        </View>
                      ) : null}
                      {report.hypertensionPattern.isolatedPeakCount > 0 ? (
                        <View style={[styles.alertCard, styles.alertIsolated]}>
                          <Text style={styles.alertTitle}>Picos isolados</Text>
                          <Text style={styles.alertSubtitle}>
                            Leituras acima da meta sem padrão sustentado
                          </Text>
                          {report.hypertensionPattern.isolatedPeakReadings.slice(0, 4).map((entry) => (
                            <Text key={entry.id} style={styles.alertLine}>
                              {formatBloodPressureDateTime(entry.recordedAt)} ·{' '}
                              {formatBloodPressureShort(entry.systolic, entry.diastolic)}
                            </Text>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  </>
                )}

                <Text style={styles.sectionTitle}>Histórico detalhado</Text>
                <View style={styles.readingsCard}>
                  <ReadingsTableHeader />
                  {report.readings.slice(0, 12).map((entry) => (
                    <ReadingRow key={entry.id} entry={entry} />
                  ))}
                  {report.readings.length > 12 ? (
                    <Text style={styles.readingsMore}>
                      + {report.readings.length - 12} medições no PDF completo
                    </Text>
                  ) : null}
                </View>
              </>
            )}

            <Text style={styles.disclaimer}>
              Relatório gerado para apoio à consulta e telemedicina. Não substitui avaliação médica presencial.
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
  headerSubtitle: { color: '#fbbf24', fontSize: 12, fontWeight: '600' },
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
    borderColor: 'rgba(251, 191, 36, 0.25)',
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
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 6,
    textAlign: 'center',
  },
  heroMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  heroTarget: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: {
    width: '48.5%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: '47%',
    alignItems: 'center',
  },
  statLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    textAlign: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  statNote: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sectionHint: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    marginTop: -8,
    textAlign: 'center',
  },
  timeSlotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlotCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '47%',
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    gap: 2,
  },
  timeSlotCardHighlight: {
    borderColor: 'rgba(251, 191, 36, 0.45)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  timeSlotTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  timeSlotAvg: { color: colors.text, fontSize: 18, fontWeight: '800' },
  timeSlotMeta: { color: colors.textSubtle, fontSize: 10, fontWeight: '500' },
  timeSlotPct: { color: '#fbbf24', fontSize: 10, fontWeight: '700', marginTop: 2 },
  timeSlotEmpty: { color: colors.textSubtle, fontSize: 11, marginTop: 8 },
  trendCard: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 4,
    paddingTop: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'visible',
    zIndex: 1,
  },
  alertsWrap: { gap: 8 },
  alertCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 6,
    alignItems: 'center',
  },
  alertSustained: {
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  alertIsolated: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  alertTitle: { color: colors.text, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  alertSubtitle: { color: colors.textMuted, fontSize: 10, fontWeight: '500', textAlign: 'center' },
  alertLine: { color: colors.textMuted, fontSize: 11, fontWeight: '500', textAlign: 'center' },
  readingsCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  readingsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  readingsHeaderCell: {
    flex: 1,
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  readingBlock: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  readingDate: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  readingRow: { flexDirection: 'row', alignItems: 'center' },
  readingCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  readingValue: { color: colors.text, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  readingContext: { color: colors.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  zoneMark: { alignItems: 'center', gap: 3 },
  zoneMarkText: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  zoneMarkLine: { width: 28, height: 2, borderRadius: 999, transform: [{ rotate: '-8deg' }] },
  readingsMore: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 10,
  },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  disclaimer: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
})
