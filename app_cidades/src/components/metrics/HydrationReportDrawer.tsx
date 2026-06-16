import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { AppModal } from '../AppModal'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HydrationDayRecord } from '../../types/hydration'
import { PeriodSelection } from '../../types/metrics'
import {
  buildHydrationReport,
  formatHydrationDateLabel,
  formatHydrationDual,
  formatHydrationGoalLabel,
  getHydrationTrendDirectionLabel,
} from '../../utils/hydrationReport'
import { shareHydrationReportPdf } from '../../utils/hydrationReportPdf'
import { colors } from '../../theme/colors'
import { PrimaryButton } from '../PrimaryButton'
import { GlucoseTrendLineChart } from './GlucoseTrendLineChart'

const HYDRATION_GRADIENT = ['#7dd3fc', '#0ea5e9', '#0369a1'] as const

type HydrationReportDrawerProps = {
  visible: boolean
  onClose: () => void
  history: HydrationDayRecord[]
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

function DayRow({ date, totalMl, goalMl }: { date: string; totalMl: number; goalMl: number }) {
  const belowGoal = totalMl < goalMl

  return (
    <View style={styles.dayRow}>
      <View style={styles.dayRowMain}>
        <Text style={styles.dayRowDate}>{formatHydrationDateLabel(date)}</Text>
        <Text style={styles.dayRowValue}>{formatHydrationDual(totalMl)}</Text>
      </View>
      <Text style={[styles.dayRowStatus, belowGoal ? styles.dayRowStatusBelow : styles.dayRowStatusOk]}>
        {belowGoal ? 'Abaixo da meta' : 'Na meta'}
      </Text>
    </View>
  )
}

export function HydrationReportDrawer({
  visible,
  onClose,
  history,
  period,
  patientName,
}: HydrationReportDrawerProps) {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const [isMounted, setIsMounted] = useState(false)
  const [exporting, setExporting] = useState(false)

  const sheetTranslateX = useRef(new Animated.Value(screenWidth)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const report = useMemo(
    () => buildHydrationReport(history, period),
    [history, period],
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
      await shareHydrationReportPdf(report, { patientName })
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

  const trendLabel = getHydrationTrendDirectionLabel(report.trend.direction)

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
              paddingBottom: Math.max(insets.bottom, 16),
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
            colors={[...HYDRATION_GRADIENT]}
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
              accessibilityLabel="Fechar relatório de hidratação"
            >
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
            </Pressable>

            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Relatório de hidratação</Text>
              <Text style={styles.headerSubtitle}>{report.periodLabel}</Text>
            </View>

            <LinearGradient
              colors={[...HYDRATION_GRADIENT]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.headerOrb}
            >
              <MaterialCommunityIcons name="cup-water" size={20} color="#fff" />
            </LinearGradient>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            contentContainerStyle={styles.scrollContent}
          >
            {report.daysTracked === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="cup-water" size={42} color="#7dd3fc" />
                <Text style={styles.emptyTitle}>Nenhum registro no período</Text>
                <Text style={styles.emptyText}>
                  Registre água ou escolha outro intervalo no calendário.
                </Text>
              </View>
            ) : (
              <>
                <LinearGradient
                  colors={['rgba(14, 165, 233, 0.18)', 'rgba(14, 165, 233, 0.04)']}
                  style={styles.heroCard}
                >
                  <Text style={styles.heroEyebrow}>Média diária de água</Text>
                  <Text style={styles.heroValue}>{formatHydrationDual(report.dailyAverageMl)}</Text>
                  <Text style={styles.heroMeta}>
                    Meta diária {formatHydrationGoalLabel(report.goalMl)} · relatório de hábito para
                    idosos, gestantes e prevenção de cálculo renal
                  </Text>
                </LinearGradient>

                <View style={styles.statsGrid}>
                  <StatCard
                    label="Total no período"
                    value={formatHydrationDual(report.totalMl)}
                    note={`${report.daysTracked} dias`}
                  />
                  <StatCard
                    label="Abaixo da meta"
                    value={String(report.daysBelowGoal)}
                    note={`${report.belowGoalPct}% dos dias`}
                    accent="#fbbf24"
                  />
                  <StatCard
                    label="Na meta"
                    value={String(report.daysAtOrAboveGoal)}
                    note={`${report.atOrAboveGoalPct}% dos dias`}
                    accent="#34d399"
                  />
                  <StatCard
                    label="Tendência"
                    value={trendLabel}
                    note={
                      report.trend.changePct !== 0
                        ? `${report.trend.changePct > 0 ? '+' : ''}${report.trend.changePct}%`
                        : 'Estável'
                    }
                    accent="#0ea5e9"
                  />
                </View>

                {report.trend.buckets.length >= 2 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Evolução no período</Text>
                    <Text style={styles.sectionHint}>{trendLabel}</Text>
                    <View style={styles.trendCard}>
                      <GlucoseTrendLineChart
                        buckets={report.trend.buckets}
                        width={screenWidth - 32}
                        accentColor="#0ea5e9"
                      />
                    </View>
                  </View>
                ) : null}

                {report.belowGoalDays.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dias abaixo da meta</Text>
                    {report.belowGoalDays.slice(0, 10).map((day) => (
                      <DayRow
                        key={day.id}
                        date={day.date}
                        totalMl={day.totalMl}
                        goalMl={report.goalMl}
                      />
                    ))}
                  </View>
                ) : null}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Histórico recente</Text>
                  {report.days.slice(0, 12).map((day) => (
                    <DayRow
                      key={day.id}
                      date={day.date}
                      totalMl={day.totalMl}
                      goalMl={report.goalMl}
                    />
                  ))}
                </View>

                <Text style={styles.disclaimer}>
                  Acompanhamento de hábito — não substitui orientação médica, especialmente em gestação
                  ou doença renal.
                </Text>
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton
              label={exporting ? 'Gerando PDF…' : 'Compartilhar PDF'}
              onPress={handleShare}
              loading={exporting}
              disabled={report.daysTracked === 0}
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
  headerSubtitle: { color: '#7dd3fc', fontSize: 12, fontWeight: '600' },
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
    borderColor: 'rgba(125, 211, 252, 0.25)',
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
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
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
    fontSize: 18,
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
  trendCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: 8,
    overflow: 'visible',
  },
  dayRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 12,
    gap: 6,
  },
  dayRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayRowDate: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  dayRowValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  dayRowStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
  dayRowStatusBelow: {
    color: '#fbbf24',
  },
  dayRowStatusOk: {
    color: '#34d399',
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
