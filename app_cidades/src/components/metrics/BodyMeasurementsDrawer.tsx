import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppModal } from '../AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  getBodyMeasurementSeries,
  getLatestBodyMeasurementValue,
} from '../../data/bodyMeasurements'
import { colors } from '../../theme/colors'
import {
  BodyMeasurementHistory,
  BodyMeasurementId,
  StorableBodyMeasurementId,
} from '../../types/bodyMeasurements'
import { MetricDataPoint, ProfileSnapshot } from '../../types/metrics'
import {
  BODY_MEASUREMENT_CONFIGS,
  formatBodyMeasurementValue,
  getMeasurementDeltaSummary,
  isStorableBodyMeasurementId,
} from '../../utils/bodyMeasurements'

const SHEET_OFFSET = 620
const ACCENT_GRADIENT = ['#f0abfc', '#d946ef', '#a21caf'] as const

type BodyMeasurementsDrawerProps = {
  visible: boolean
  profile: ProfileSnapshot
  history: BodyMeasurementHistory
  weightHistory: MetricDataPoint[]
  activeMeasurementId: BodyMeasurementId
  measurementOverrides?: Partial<Record<BodyMeasurementId, number>>
  onClose: () => void
  onSelectMeasurement: (id: BodyMeasurementId) => void
  onRegisterMeasurement: (id: StorableBodyMeasurementId | 'peso') => void
}

function MeasurementRow({
  id,
  label,
  valueLabel,
  icon,
  selected,
  computed,
  onPress,
  onRegister,
}: {
  id: BodyMeasurementId
  label: string
  valueLabel: string
  icon: string
  selected: boolean
  computed?: boolean
  onPress: () => void
  onRegister?: () => void
}) {
  return (
    <View style={[styles.rowShell, selected && styles.rowShellSelected]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.rowMain, pressed && styles.rowPressed]}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${label}: ${valueLabel}`}
      >
        <View style={styles.rowIconOrb}>
          <MaterialCommunityIcons
            name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={18}
            color="#fff"
          />
        </View>

        <View style={styles.rowTextCol}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowValue}>{valueLabel}</Text>
        </View>

        <Ionicons
          name={selected ? 'checkmark-circle' : 'chevron-forward'}
          size={18}
          color={selected ? ACCENT_GRADIENT[1] : colors.textMuted}
        />
      </Pressable>

      {!computed && onRegister ? (
        <Pressable
          onPress={onRegister}
          hitSlop={8}
          style={({ pressed }) => [styles.registerButton, pressed && styles.registerButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Registrar ${label}`}
        >
          <Ionicons name="add" size={18} color={ACCENT_GRADIENT[1]} />
        </Pressable>
      ) : null}
    </View>
  )
}

export function BodyMeasurementsDrawer({
  visible,
  profile,
  history,
  weightHistory,
  activeMeasurementId,
  measurementOverrides,
  onClose,
  onSelectMeasurement,
  onRegisterMeasurement,
}: BodyMeasurementsDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const summary = useMemo(() => {
    const series = getBodyMeasurementSeries(
      activeMeasurementId,
      history,
      weightHistory,
      profile,
    )
    return getMeasurementDeltaSummary(activeMeasurementId, series)
  }, [activeMeasurementId, history, weightHistory, profile])

  const principalItems = BODY_MEASUREMENT_CONFIGS.filter((item) => item.group === 'principal')
  const complementItems = BODY_MEASUREMENT_CONFIGS.filter((item) => item.group === 'complementar')

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
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
    if (!visible) return
    closeSheet(onClose)
  }

  function handleSelect(id: BodyMeasurementId) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSelectMeasurement(id)
    closeSheet(onClose)
  }

  function handleRegister(id: StorableBodyMeasurementId | 'peso') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    closeSheet(() => {
      onClose()
      onRegisterMeasurement(id)
    })
  }

  if (!isMounted) return null

  function renderRow(id: BodyMeasurementId) {
    const config = BODY_MEASUREMENT_CONFIGS.find((item) => item.id === id)
    if (!config) return null

    const latest = getLatestBodyMeasurementValue(
      id,
      history,
      weightHistory,
      profile,
      measurementOverrides,
    )

    return (
      <MeasurementRow
        key={id}
        id={id}
        label={config.label}
        valueLabel={formatBodyMeasurementValue(id, latest)}
        icon={config.icon}
        selected={activeMeasurementId === id}
        computed={config.computed}
        onPress={() => handleSelect(id)}
        onRegister={
          config.loggable && isStorableBodyMeasurementId(id)
            ? () => handleRegister(id)
            : id === 'peso'
              ? () => handleRegister('peso')
              : undefined
        }
      />
    )
  }

  return (
    <AppModal visible transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 8,
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
            colors={[...ACCENT_GRADIENT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.topAccent}
          />

          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>Medidas corporais</Text>
              <Text style={styles.subtitle}>Registre e acompanhe sua evolução</Text>
            </View>
            <Pressable
              onPress={handleDismiss}
              hitSlop={10}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {summary ? (
            <View style={styles.summaryCard}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={18} color={ACCENT_GRADIENT[1]} />
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          ) : null}

          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>Principais</Text>
            <View style={styles.sectionList}>{principalItems.map((item) => renderRow(item.id))}</View>

            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Complementares</Text>
            <View style={styles.sectionList}>
              {complementItems.map((item) => renderRow(item.id))}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </AppModal>
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
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 10,
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
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  headerTextCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(217, 70, 239, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.22)',
    marginBottom: 14,
  },
  summaryText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  listScroll: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: 8,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionLabelSpaced: {
    marginTop: 16,
  },
  sectionList: {
    gap: 8,
  },
  rowShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
  },
  rowShellSelected: {
    borderColor: 'rgba(240, 171, 252, 0.35)',
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowPressed: {
    opacity: 0.86,
  },
  rowIconOrb: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217, 70, 239, 0.18)',
  },
  rowTextCol: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  rowValue: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  registerButton: {
    width: 42,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  registerButtonPressed: {
    opacity: 0.82,
  },
})
