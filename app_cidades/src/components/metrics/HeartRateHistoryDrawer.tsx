import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  formatHeartRateTime,
  getHeartRateContextLabel,
  getHeartRateZone,
  summarizeHeartRate,
} from '../../data/mockHeartRateHistory'
import { colors } from '../../theme/colors'
import { HeartRateReading } from '../../types/heartRate'
import { PrimaryButton } from '../PrimaryButton'

const SHEET_OFFSET = 560
const HR_GRADIENT = ['#fca5a5', '#ef4444', '#dc2626'] as const
const MEASURE_MS = 1400

type HeartRateHistoryDrawerProps = {
  visible: boolean
  onClose: () => void
  readings: HeartRateReading[]
  hasIntegration: boolean
  onConnectPress: () => void
  onManualReading: (reading: HeartRateReading) => void
}

function HistoryRow({ reading }: { reading: HeartRateReading }) {
  const contextLabel =
    reading.context !== 'manual' ? getHeartRateContextLabel(reading.context) : null

  return (
    <View style={styles.historyRow}>
      <View style={styles.historyTimeCol}>
        <Text style={styles.historyTime}>{formatHeartRateTime(reading.recordedAt)}</Text>
        <Text style={styles.historySource}>{reading.source}</Text>
      </View>

      <View style={styles.historyMetaCol}>
        <Text style={styles.historyBpm}>{reading.bpm}</Text>
        <Text style={styles.historyBpmUnit}>bpm</Text>
      </View>

      <View style={styles.historyTagsCol}>
        {contextLabel ? (
          <View style={styles.contextChip}>
            <Text style={styles.contextChipText}>{contextLabel}</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

export function HeartRateHistoryDrawer({
  visible,
  onClose,
  readings,
  hasIntegration,
  onConnectPress,
  onManualReading,
}: HeartRateHistoryDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [isMeasuring, setIsMeasuring] = useState(false)
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const measureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sortedReadings = useMemo(
    () => [...readings].sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime()),
    [readings],
  )

  const latestReading = sortedReadings[0]
  const summary = summarizeHeartRate(sortedReadings)
  const latestZone = latestReading ? getHeartRateZone(latestReading.bpm) : null
  const showEmpty = !hasIntegration && sortedReadings.length === 0

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      setIsMeasuring(false)
      sheetTranslateY.setValue(SHEET_OFFSET)
      backdropOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start()
    } else if (isMounted) {
      closeSheet(onClose)
    }
  }, [visible])

  useEffect(() => {
    return () => {
      if (measureTimerRef.current) {
        clearTimeout(measureTimerRef.current)
      }
    }
  }, [])

  function closeSheet(done?: () => void) {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_OFFSET,
        duration: 280,
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
    if (!visible || isMeasuring) return
    closeSheet(onClose)
  }

  function handleConnectPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    closeSheet(() => {
      onClose()
      onConnectPress()
    })
  }

  function handleMeasureNow() {
    if (isMeasuring) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsMeasuring(true)

    measureTimerRef.current = setTimeout(() => {
      const bpm = 68 + Math.floor(Math.random() * 19)
      onManualReading({
        id: `manual-${Date.now()}`,
        bpm,
        recordedAt: new Date(),
        source: 'Manual',
        context: 'manual',
      })
      setIsMeasuring(false)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }, MEASURE_MS)
  }

  if (!isMounted) return null

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 12,
              maxHeight: '88%',
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(36, 36, 46, 0.98)', 'rgba(14, 14, 20, 0.99)']}
            style={StyleSheet.absoluteFillObject}
          />
          {Platform.OS === 'ios' ? (
            <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
          ) : null}

          <LinearGradient
            colors={[...HR_GRADIENT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.topAccent}
          />

          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <LinearGradient
              colors={[...HR_GRADIENT]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.fieldIconOrb}
            >
              <MaterialCommunityIcons name="heart-pulse" size={22} color="#fff" />
            </LinearGradient>

            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Histórico cardíaco</Text>
              <Text style={styles.subtitle}>
                {showEmpty ? 'Conecte um dispositivo para sincronizar' : 'Leituras de hoje'}
              </Text>
            </View>

            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Fechar histórico cardíaco"
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            {showEmpty ? (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={['#fecaca', '#ef4444', '#b91c1c']}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={styles.emptyOrb}
                >
                  <MaterialCommunityIcons name="heart-pulse" size={42} color="#fff" />
                </LinearGradient>

                <Text style={styles.emptyTitle}>Nenhuma leitura sincronizada</Text>
                <Text style={styles.emptyBody}>
                  Conecte o Apple Health ou Health Connect para importar sua frequência cardíaca
                  automaticamente do relógio ou pulseira.
                </Text>

                <PrimaryButton
                  label={
                    Platform.OS === 'ios' ? 'Conectar Apple Health' : 'Conectar Health Connect'
                  }
                  onPress={handleConnectPress}
                />

                <Pressable
                  onPress={handleMeasureNow}
                  disabled={isMeasuring}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryButtonPressed,
                    isMeasuring && styles.secondaryButtonDisabled,
                  ]}
                >
                  {isMeasuring ? (
                    <ActivityIndicator color={colors.textMuted} size="small" />
                  ) : (
                    <Text style={styles.secondaryButtonText}>Medir agora</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.currentCard}>
                  <Text style={styles.sectionLabel}>Leitura atual</Text>
                  <View style={styles.currentRow}>
                    <View style={styles.currentBpmCol}>
                      <Text style={styles.currentBpm}>{latestReading?.bpm ?? '—'}</Text>
                      <Text style={styles.currentUnit}>bpm</Text>
                    </View>

                    {latestZone ? (
                      <View
                        style={[
                          styles.zoneBadge,
                          { backgroundColor: latestZone.bg, borderColor: latestZone.border },
                        ]}
                      >
                        <View style={[styles.zoneDot, { backgroundColor: latestZone.color }]} />
                        <Text style={[styles.zoneLabel, { color: latestZone.color }]}>
                          {latestZone.label}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {latestReading ? (
                    <Text style={styles.currentMeta}>
                      {formatHeartRateTime(latestReading.recordedAt)} · {latestReading.source}
                      {latestReading.context !== 'manual'
                        ? ` · ${getHeartRateContextLabel(latestReading.context)}`
                        : ''}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.sectionLabel}>Resumo · Hoje</Text>
                  <View style={styles.summaryRow}>
                    <SummaryStat label="Mín" value={`${summary.min}`} unit="bpm" />
                    <SummaryStat label="Média" value={`${summary.avg}`} unit="bpm" highlight />
                    <SummaryStat label="Máx" value={`${summary.max}`} unit="bpm" />
                  </View>
                  <Text style={styles.summaryHint}>
                    {summary.count} leitura{summary.count === 1 ? '' : 's'}
                  </Text>
                </View>

                <View style={styles.historyCard}>
                  <Text style={styles.sectionLabel}>Histórico</Text>
                  {sortedReadings.map((reading, index) => (
                    <View key={reading.id}>
                      <HistoryRow reading={reading} />
                      {index < sortedReadings.length - 1 ? <View style={styles.rowDivider} /> : null}
                    </View>
                  ))}
                </View>

                {!hasIntegration ? (
                  <View style={styles.connectBanner}>
                    <MaterialCommunityIcons name="link-variant" size={18} color="#fca5a5" />
                    <Text style={styles.connectBannerText}>
                      Conecte um app de saúde para manter o histórico sempre atualizado.
                    </Text>
                    <Pressable onPress={handleConnectPress} hitSlop={8}>
                      <Text style={styles.connectBannerAction}>Conectar</Text>
                    </Pressable>
                  </View>
                ) : null}

                <Pressable
                  onPress={handleMeasureNow}
                  disabled={isMeasuring}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    styles.secondaryButtonInline,
                    pressed && styles.secondaryButtonPressed,
                    isMeasuring && styles.secondaryButtonDisabled,
                  ]}
                >
                  {isMeasuring ? (
                    <View style={styles.measuringRow}>
                      <ActivityIndicator color="#fca5a5" size="small" />
                      <Text style={styles.measuringText}>Medindo...</Text>
                    </View>
                  ) : (
                    <Text style={styles.secondaryButtonText}>Medir agora</Text>
                  )}
                </Pressable>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
}

function SummaryStat({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string
  value: string
  unit: string
  highlight?: boolean
}) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryStatLabel}>{label}</Text>
      <Text style={[styles.summaryStatValue, highlight && styles.summaryStatValueHighlight]}>
        {value}
      </Text>
      <Text style={styles.summaryStatUnit}>{unit}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 10,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  fieldIconOrb: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 2,
  },
  headerTextCol: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  closeButtonPressed: {
    opacity: 0.8,
  },
  scrollContent: {
    paddingBottom: 8,
    gap: 12,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },
  currentCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.28)',
    alignItems: 'center',
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  currentBpmCol: {
    alignItems: 'center',
  },
  currentBpm: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 44,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  currentUnit: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: -2,
    textAlign: 'center',
  },
  currentMeta: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
  },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  zoneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  zoneLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryStatLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
    width: '100%',
  },
  summaryStatValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    width: '100%',
  },
  summaryStatValueHighlight: {
    color: '#fca5a5',
  },
  summaryStatUnit: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  summaryHint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
  },
  historyCard: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  historyTimeCol: {
    width: 74,
    gap: 2,
  },
  historyTime: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  historySource: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
  },
  historyMetaCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    minWidth: 58,
  },
  historyBpm: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  historyBpmUnit: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  historyTagsCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  contextChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  contextChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  connectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.18)',
  },
  connectBannerText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  connectBannerAction: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    gap: 12,
  },
  emptyOrb: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 4,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
  secondaryButton: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  secondaryButtonInline: {
    marginTop: 0,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryButtonPressed: {
    opacity: 0.86,
  },
  secondaryButtonDisabled: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  measuringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  measuringText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '600',
  },
})
