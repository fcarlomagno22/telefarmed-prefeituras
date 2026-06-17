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
import { GlucoseHistoryEntry } from '../../types/glucose'
import { PeriodSelection } from '../../types/metrics'
import {
  formatGlucoseDateTime,
  formatGlucoseValue,
  getGlucoseContextLabel,
  getGlucoseZone,
} from '../../utils/glucose'
import { buildGlucoseReport, getTrendDirectionLabel } from '../../utils/glucoseReport'
import { shareGlucoseReportPdf } from '../../utils/glucoseReportPdf'
import { PrimaryButton } from '../PrimaryButton'
import { GlucoseTrendLineChart } from './GlucoseTrendLineChart'
import { getModalFooterPadding } from '../../utils/modalSafeArea'

const BLOOD_GRADIENT = ['#fca5a5', '#ef4444', '#991b1b'] as const

type GlucoseReportDrawerProps = {
  visible: boolean
  onClose: () => void
  history: GlucoseHistoryEntry[]
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

function ContextCompareCard({
  title,
  stats,
}: {
  title: string
  stats: { count: number; avg: number; inTargetPct: number } | null
}) {
  if (!stats) {
    return (
      <View style={styles.contextCard}>
        <Text style={styles.contextTitle}>{title}</Text>
        <Text style={styles.contextEmpty}>Sem medições neste período</Text>
      </View>
    )
  }

  return (
    <View style={styles.contextCard}>
      <Text style={styles.contextTitle}>{title}</Text>
      <Text style={styles.contextAvg}>{formatGlucoseValue(stats.avg)}</Text>
      <Text style={styles.contextMeta}>
        {stats.count} {stats.count === 1 ? 'medição' : 'medições'}
      </Text>
      <View style={styles.contextPctRow}>
        <View style={[styles.contextPctDot, { backgroundColor: '#34d399' }]} />
        <Text style={styles.contextPctText}>{stats.inTargetPct}% na meta</Text>
      </View>
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
      <Text style={styles.readingsHeaderCell}>Contexto</Text>
      <Text style={styles.readingsHeaderCell}>Classificação</Text>
    </View>
  )
}

function ReadingRow({ entry }: { entry: GlucoseHistoryEntry }) {
  const zone = getGlucoseZone(entry.amountMg, entry.context)

  return (
    <View style={styles.readingBlock}>
      <Text style={styles.readingDate}>{formatGlucoseDateTime(entry.recordedAt)}</Text>
      <View style={styles.readingRow}>
        <View style={styles.readingCell}>
          <Text style={styles.readingValue}>{formatGlucoseValue(entry.amountMg)}</Text>
        </View>
        <View style={styles.readingCell}>
          <Text style={styles.readingContext}>{getGlucoseContextLabel(entry.context)}</Text>
        </View>
        <View style={styles.readingCell}>
          <ZoneMark label={zone.label} color={zone.color} />
        </View>
      </View>
    </View>
  )
}

export function GlucoseReportDrawer({
  visible,
  onClose,
  history,
  period,
  patientName,
}: GlucoseReportDrawerProps) {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const [isMounted, setIsMounted] = useState(false)
  const [exporting, setExporting] = useState(false)

  const sheetTranslateX = useRef(new Animated.Value(screenWidth)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const report = useMemo(
    () => buildGlucoseReport(history, period),
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
      await shareGlucoseReportPdf(report, { patientName })
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

  const trendLabel = getTrendDirectionLabel(report.trend.direction)
  const trendColor =
    report.trend.direction === 'up'
      ? '#f87171'
      : report.trend.direction === 'down'
        ? '#34d399'
        : colors.textMuted

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
            colors={[...BLOOD_GRADIENT]}
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
              accessibilityLabel="Fechar relatório de glicemia"
            >
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
            </Pressable>

            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Relatório de glicemia</Text>
              <Text style={styles.headerSubtitle}>{report.periodLabel}</Text>
            </View>

            <LinearGradient
              colors={[...BLOOD_GRADIENT]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.headerOrb}
            >
              <MaterialCommunityIcons name="file-chart-outline" size={20} color="#fff" />
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
                <MaterialCommunityIcons name="blood-bag" size={42} color="#fca5a5" />
                <Text style={styles.emptyTitle}>Nenhuma medição no período</Text>
                <Text style={styles.emptyText}>
                  Registre glicemia ou escolha outro intervalo no calendário para gerar o relatório.
                </Text>
              </View>
            ) : (
              <>
                <LinearGradient
                  colors={['rgba(239, 68, 68, 0.18)', 'rgba(239, 68, 68, 0.04)']}
                  style={styles.heroCard}
                >
                  <Text style={styles.heroEyebrow}>Resumo do período</Text>
                  <Text style={styles.heroValue}>{formatGlucoseValue(report.overall.avg)}</Text>
                  <Text style={styles.heroMeta}>
                    {report.totalReadings} medições · {report.overall.min}–{report.overall.max} mg/dL
                  </Text>
                </LinearGradient>

                <View style={styles.statsGrid}>
                  <StatCard
                    label="Na meta"
                    value={`${report.overall.inTargetPct}%`}
                    note={`${report.overall.outOfTargetPct}% fora`}
                    accent="#34d399"
                  />
                  <StatCard
                    label="Tendência"
                    value={trendLabel}
                    note={
                      report.trend.changePct === 0
                        ? 'Estável'
                        : `${report.trend.changePct > 0 ? '+' : ''}${report.trend.changePct}%`
                    }
                    accent={trendColor}
                  />
                  <StatCard
                    label="Hipoglicemias"
                    value={String(report.hypoglycemia.count)}
                    note="< 70 mg/dL"
                    accent="#38bdf8"
                  />
                  <StatCard
                    label="Picos elevados"
                    value={String(report.hyperglycemia.count)}
                    note="Fora da faixa"
                    accent="#f87171"
                  />
                </View>

                <Text style={styles.sectionTitle}>Jejum vs pós-refeição</Text>
                <View style={styles.contextRow}>
                  <ContextCompareCard title="Jejum" stats={report.fasting} />
                  <ContextCompareCard title="Pós-refeição" stats={report.postMeal} />
                </View>

                {report.trend.buckets.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>Tendência no período</Text>
                    <Text style={styles.sectionHint}>
                      Média diária de glicemia (mg/dL) · Toque nos pontos para detalhes
                    </Text>
                    <View style={styles.trendCard}>
                      <GlucoseTrendLineChart
                        buckets={report.trend.buckets}
                        width={screenWidth - 32}
                        accentColor="#ef4444"
                      />
                    </View>
                  </>
                ) : null}

                {(report.hypoglycemia.count > 0 || report.hyperglycemia.count > 0) && (
                  <>
                    <Text style={styles.sectionTitle}>Alertas clínicos</Text>
                    <View style={styles.alertsWrap}>
                      {report.hypoglycemia.count > 0 ? (
                        <View style={[styles.alertCard, styles.alertHypo]}>
                          <Text style={styles.alertTitle}>Hipoglicemias</Text>
                          {report.hypoglycemia.readings.slice(0, 4).map((entry) => (
                            <Text key={entry.id} style={styles.alertLine}>
                              {formatGlucoseDateTime(entry.recordedAt)} · {entry.amountMg} mg/dL
                            </Text>
                          ))}
                        </View>
                      ) : null}
                      {report.hyperglycemia.count > 0 ? (
                        <View style={[styles.alertCard, styles.alertHyper]}>
                          <Text style={styles.alertTitle}>Picos elevados</Text>
                          {report.hyperglycemia.readings.slice(0, 4).map((entry) => (
                            <Text key={entry.id} style={styles.alertLine}>
                              {formatGlucoseDateTime(entry.recordedAt)} · {entry.amountMg} mg/dL ·{' '}
                              {getGlucoseContextLabel(entry.context)}
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
              Relatório gerado para apoio à consulta. Não substitui avaliação médica presencial.
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
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  sheet: {
    ...StyleSheet.absoluteFillObject,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 14,
  },
  heroCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
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
    fontSize: 22,
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
  contextRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contextCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
    alignItems: 'center',
  },
  contextTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  contextAvg: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  contextMeta: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  contextPctRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  contextPctDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  contextPctText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  contextEmpty: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
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
  alertsWrap: {
    gap: 8,
  },
  alertCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 6,
    alignItems: 'center',
  },
  alertHypo: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  alertHyper: {
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  alertTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  alertLine: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  readingsHeaderCell: {
    flex: 1,
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  readingBlock: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 10,
  },
  readingDate: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  readingCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  readingContext: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  zoneMark: {
    alignItems: 'center',
    gap: 4,
  },
  zoneMarkText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  zoneMarkLine: {
    width: 30,
    height: 2,
    borderRadius: 999,
    transform: [{ rotate: '-3deg' }],
  },
  readingsMore: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
  },
  disclaimer: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 15,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
})
