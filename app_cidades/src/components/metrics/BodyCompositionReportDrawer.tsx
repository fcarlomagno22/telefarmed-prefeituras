import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { AppModal } from '../AppModal'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BodyMeasurementHistory } from '../../types/bodyMeasurements'
import { MetricDataPoint, PeriodSelection, ProfileSnapshot } from '../../types/metrics'
import { IMC_REFERENCE_ZONES } from '../../utils/bmi'
import {
  buildBodyCompositionReport,
  formatCircumferenceCm,
  formatCompositionDate,
  formatImcValue,
  formatWeightKg,
  getCompositionTrendDirectionLabel,
} from '../../utils/bodyCompositionReport'
import { shareBodyCompositionReportPdf } from '../../utils/bodyCompositionReportPdf'
import { colors } from '../../theme/colors'
import { PrimaryButton } from '../PrimaryButton'
import { GlucoseTrendLineChart } from './GlucoseTrendLineChart'
import { getModalFooterPadding } from '../../utils/modalSafeArea'

const COMPOSITION_GRADIENT = ['#67e8f9', '#0891b2', '#0e7490'] as const

type BodyCompositionReportDrawerProps = {
  visible: boolean
  onClose: () => void
  profile: ProfileSnapshot
  weightHistory: MetricDataPoint[]
  bodyMeasurementHistory: BodyMeasurementHistory
  period: PeriodSelection
  abdomenOverride?: number | null
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

function ImcZonePill({
  label,
  rangeLabel,
  color,
  active,
}: {
  label: string
  rangeLabel: string
  color: string
  active?: boolean
}) {
  return (
    <View style={[styles.imcZonePill, active && { borderColor: `${color}88`, backgroundColor: `${color}18` }]}>
      <Text style={[styles.imcZonePillLabel, { color }]}>{label}</Text>
      <Text style={styles.imcZonePillRange}>{rangeLabel}</Text>
    </View>
  )
}

function HistoryRow({
  date,
  weight,
  imcLabel,
  imcColor,
  abdomen,
  abdomenLabel,
  abdomenColor,
}: {
  date: string
  weight?: number
  imcLabel?: string
  imcColor?: string
  abdomen?: number
  abdomenLabel?: string
  abdomenColor?: string
}) {
  return (
    <View style={styles.readingBlock}>
      <Text style={styles.readingDate}>{formatCompositionDate(date)}</Text>
      <View style={styles.readingRow}>
        <View style={styles.readingCell}>
          <Text style={styles.readingValue}>{weight !== undefined ? formatWeightKg(weight) : '—'}</Text>
        </View>
        <View style={styles.readingCell}>
          {imcLabel ? <ZoneMark label={imcLabel} color={imcColor ?? colors.textMuted} /> : <Text style={styles.readingMuted}>—</Text>}
        </View>
        <View style={styles.readingCell}>
          <Text style={styles.readingValue}>
            {abdomen !== undefined ? formatCircumferenceCm(abdomen) : '—'}
          </Text>
          {abdomenLabel ? <ZoneMark label={abdomenLabel} color={abdomenColor ?? colors.textMuted} /> : null}
        </View>
      </View>
    </View>
  )
}

export function BodyCompositionReportDrawer({
  visible,
  onClose,
  profile,
  weightHistory,
  bodyMeasurementHistory,
  period,
  abdomenOverride,
  patientName,
}: BodyCompositionReportDrawerProps) {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const [isMounted, setIsMounted] = useState(false)
  const [exporting, setExporting] = useState(false)

  const sheetTranslateX = useRef(new Animated.Value(screenWidth)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const report = useMemo(
    () =>
      buildBodyCompositionReport(
        profile,
        weightHistory,
        bodyMeasurementHistory,
        period,
        abdomenOverride,
      ),
    [profile, weightHistory, bodyMeasurementHistory, period, abdomenOverride],
  )

  const historyRows = useMemo(() => {
    const byDate = new Map<
      string,
      {
        weight?: number
        imcLabel?: string
        imcColor?: string
        abdomen?: number
        abdomenLabel?: string
        abdomenColor?: string
      }
    >()

    report.weight.readings.forEach((reading) => {
      const imc = report.imc.readings.find((entry) => entry.date === reading.date)
      byDate.set(reading.date, {
        weight: reading.valueKg,
        imcLabel: imc?.zoneLabel,
        imcColor: imc?.zoneColor,
      })
    })

    report.abdomen.readings.forEach((reading) => {
      const current = byDate.get(reading.date) ?? {}
      byDate.set(reading.date, {
        ...current,
        abdomen: reading.valueCm,
        abdomenLabel: reading.zoneLabel,
        abdomenColor: reading.zoneColor,
      })
    })

    return [...byDate.entries()]
      .sort((left, right) => right[0].localeCompare(left[0]))
      .slice(0, 12)
  }, [report])

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
      await shareBodyCompositionReportPdf(report, { patientName })
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

  const imcTrendLabel = getCompositionTrendDirectionLabel(report.imc.trend.direction)
  const weightTrendLabel = getCompositionTrendDirectionLabel(report.weight.trend.direction)
  const abdomenTrendLabel = getCompositionTrendDirectionLabel(report.abdomen.trend.direction)

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
            colors={[...COMPOSITION_GRADIENT]}
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
              accessibilityLabel="Fechar relatório de composição corporal"
            >
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
            </Pressable>

            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Composição corporal</Text>
              <Text style={styles.headerSubtitle}>{report.periodLabel}</Text>
            </View>

            <LinearGradient
              colors={[...COMPOSITION_GRADIENT]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.headerOrb}
            >
              <MaterialCommunityIcons name="scale-bathroom" size={20} color="#fff" />
            </LinearGradient>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            contentContainerStyle={styles.scrollContent}
          >
            {report.totalDataPoints === 0 && report.imc.current === null ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="scale-bathroom" size={42} color="#67e8f9" />
                <Text style={styles.emptyTitle}>Sem dados no período</Text>
                <Text style={styles.emptyText}>
                  Informe peso e altura no perfil e registre medições corporais para gerar o relatório.
                </Text>
              </View>
            ) : (
              <>
                <LinearGradient
                  colors={['rgba(8, 145, 178, 0.18)', 'rgba(8, 145, 178, 0.04)']}
                  style={styles.heroCard}
                >
                  <Text style={styles.heroEyebrow}>Índice de massa corporal</Text>
                  <Text style={styles.heroValue}>
                    {report.imc.current !== null ? formatImcValue(report.imc.current) : '—'}
                  </Text>
                  <Text style={[styles.heroZone, report.imc.zone ? { color: report.imc.zone.color } : null]}>
                    {report.imc.zone?.label ?? 'Informe peso e altura'}
                  </Text>
                  <Text style={styles.heroMeta}>
                    {report.profile.height} · {report.profile.weight}
                    {report.imc.zone ? ` · OMS ${report.imc.zone.rangeLabel}` : ''}
                  </Text>
                </LinearGradient>

                <View style={styles.statsGrid}>
                  <StatCard
                    label="Evolução do peso"
                    value={report.weight.deltaLabel}
                    note={
                      report.weight.startKg !== null && report.weight.endKg !== null
                        ? `${formatWeightKg(report.weight.startKg)} → ${formatWeightKg(report.weight.endKg)}`
                        : 'Sem medições de peso'
                    }
                    accent={report.weight.deltaKg !== null && report.weight.deltaKg < 0 ? '#34d399' : report.weight.deltaKg !== null && report.weight.deltaKg > 0 ? '#fbbf24' : colors.textMuted}
                  />
                  <StatCard
                    label="Peso médio"
                    value={report.weight.readings.length > 0 ? formatWeightKg(report.weight.avg) : '—'}
                    note={
                      report.weight.readings.length > 0
                        ? `${formatWeightKg(report.weight.min)} – ${formatWeightKg(report.weight.max)}`
                        : undefined
                    }
                    accent="#e2e8f0"
                  />
                  <StatCard
                    label="Circunferência"
                    value={
                      report.abdomen.readings.length > 0
                        ? formatCircumferenceCm(report.abdomen.avg)
                        : '—'
                    }
                    note={`Meta até ${report.abdomen.idealMaxCm} cm`}
                    accent="#f97316"
                  />
                  <StatCard
                    label="Risco metabólico"
                    value={String(report.abdomen.elevatedRiskCount)}
                    note={`${report.abdomen.aboveIdealPct}% acima do ideal`}
                    accent="#f87171"
                  />
                </View>

                <Text style={styles.sectionTitle}>Classificação do IMC</Text>
                <View style={styles.imcZoneGrid}>
                  {IMC_REFERENCE_ZONES.map((zone) => (
                    <ImcZonePill
                      key={zone.id}
                      label={zone.label}
                      rangeLabel={zone.rangeLabel}
                      color={zone.color}
                      active={report.imc.zone?.label === zone.label}
                    />
                  ))}
                </View>

                {report.weight.trend.buckets.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>Evolução do peso</Text>
                    <Text style={styles.sectionHint}>
                      {weightTrendLabel}
                      {report.weight.trend.changePct !== 0
                        ? ` · ${report.weight.trend.changePct > 0 ? '+' : ''}${report.weight.trend.changePct}%`
                        : ''}
                    </Text>
                    <View style={styles.trendCard}>
                      <GlucoseTrendLineChart
                        buckets={report.weight.trend.buckets}
                        width={screenWidth - 32}
                        accentColor="#94a3b8"
                      />
                    </View>
                  </>
                ) : null}

                {report.imc.trend.buckets.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>Evolução do IMC</Text>
                    <Text style={styles.sectionHint}>
                      {imcTrendLabel}
                      {report.imc.trend.changeAbs !== 0
                        ? ` · ${report.imc.trend.changeAbs > 0 ? '+' : ''}${report.imc.trend.changeAbs.toFixed(1).replace('.', ',')} pts`
                        : ''}
                    </Text>
                    <View style={styles.trendCard}>
                      <GlucoseTrendLineChart
                        buckets={report.imc.trend.buckets}
                        width={screenWidth - 32}
                        accentColor="#0891b2"
                      />
                    </View>
                  </>
                ) : null}

                {report.abdomen.trend.buckets.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>Circunferência abdominal</Text>
                    <Text style={styles.sectionHint}>
                      {abdomenTrendLabel} · risco elevado a partir de {report.abdomen.highRiskFromCm} cm
                    </Text>
                    <View style={styles.trendCard}>
                      <GlucoseTrendLineChart
                        buckets={report.abdomen.trend.buckets}
                        width={screenWidth - 32}
                        accentColor="#f97316"
                      />
                    </View>
                  </>
                ) : null}

                <Text style={styles.sectionTitle}>Histórico detalhado</Text>
                <View style={styles.readingsCard}>
                  <View style={styles.readingsHeaderRow}>
                    <Text style={styles.readingsHeaderCell}>Peso</Text>
                    <Text style={styles.readingsHeaderCell}>IMC</Text>
                    <Text style={styles.readingsHeaderCell}>Abdomen</Text>
                  </View>
                  {historyRows.map(([date, entry]) => (
                    <HistoryRow
                      key={date}
                      date={date}
                      weight={entry.weight}
                      imcLabel={entry.imcLabel}
                      imcColor={entry.imcColor}
                      abdomen={entry.abdomen}
                      abdomenLabel={entry.abdomenLabel}
                      abdomenColor={entry.abdomenColor}
                    />
                  ))}
                </View>
              </>
            )}

            <Text style={styles.disclaimer}>
              Relatório de composição corporal para apoio à consulta. IMC calculado com a altura atual do perfil.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton
              label={exporting ? 'Gerando PDF…' : 'Compartilhar PDF'}
              onPress={handleShare}
              loading={exporting}
              disabled={report.totalDataPoints === 0 && report.imc.current === null}
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
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  headerSubtitle: { color: '#67e8f9', fontSize: 12, fontWeight: '600' },
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
    borderColor: 'rgba(103, 232, 249, 0.25)',
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
  heroZone: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  heroMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
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
    fontSize: 18,
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
  imcZoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imcZonePill: {
    width: '48%',
    minWidth: '47%',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    gap: 2,
  },
  imcZonePillLabel: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  imcZonePillRange: { color: colors.textSubtle, fontSize: 10, fontWeight: '600', textAlign: 'center' },
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
  readingCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  readingValue: { color: colors.text, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  readingMuted: { color: colors.textSubtle, fontSize: 12, fontWeight: '600' },
  zoneMark: { alignItems: 'center', gap: 3 },
  zoneMarkText: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  zoneMarkLine: { width: 28, height: 2, borderRadius: 999, transform: [{ rotate: '-8deg' }] },
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
