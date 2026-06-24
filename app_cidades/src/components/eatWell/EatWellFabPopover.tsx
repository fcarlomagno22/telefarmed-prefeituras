import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { AppModal } from '../AppModal'
import type { MealSlot } from '../../types/eatWell'
import { colors } from '../../theme/colors'
import { getMealSlotConfig, MEAL_SLOT_ORDER } from '../../utils/eatWellMealSlots'

const FAB_RIGHT = 18
const POPOVER_WIDTH = 292
const OPTION_ROW_HEIGHT = 62
const HEADER_BLOCK_HEIGHT = 68
const CARD_MAX_HEIGHT =
  HEADER_BLOCK_HEIGHT + MEAL_SLOT_ORDER.length * OPTION_ROW_HEIGHT + 12
const BASE_LINE_HEIGHT = 0.5
const SEPARATOR_LEFT_INSET = 14
const OPEN_TOTAL_MS = 500
const LINE_PHASE_MS = 225
const CARD_PHASE_MS = 275

type EatWellFabPopoverProps = {
  visible: boolean
  fabBottom: number
  onClose: () => void
  onRegisterMeal: (slot: MealSlot) => void
}

export function EatWellFabPopover({
  visible,
  fabBottom,
  onClose,
  onRegisterMeal,
}: EatWellFabPopoverProps) {
  const [isMounted, setIsMounted] = useState(false)

  const backdropOpacity = useRef(new Animated.Value(0)).current
  const lineWidth = useRef(new Animated.Value(0)).current
  const cardHeight = useRef(new Animated.Value(0)).current
  const cardOpacity = useRef(new Animated.Value(0)).current

  const popoverRight = FAB_RIGHT

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      lineWidth.setValue(0)
      cardHeight.setValue(0)
      cardOpacity.setValue(0)
      backdropOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: OPEN_TOTAL_MS * 0.4,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(lineWidth, {
            toValue: POPOVER_WIDTH,
            duration: LINE_PHASE_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.parallel([
            Animated.timing(cardHeight, {
              toValue: CARD_MAX_HEIGHT,
              duration: CARD_PHASE_MS,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }),
            Animated.timing(cardOpacity, {
              toValue: 1,
              duration: CARD_PHASE_MS * 0.55,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start()
      return
    }

    if (!isMounted) return

    lineWidth.setValue(0)
    cardHeight.setValue(0)
    cardOpacity.setValue(0)
    backdropOpacity.setValue(0)
    setIsMounted(false)
  }, [backdropOpacity, cardHeight, cardOpacity, isMounted, lineWidth, visible])

  function handleSlotPress(slot: MealSlot) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onRegisterMeal(slot)
    onClose()
  }

  if (!isMounted) return null

  return (
    <AppModal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.host}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.backdropTint} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>

        <View
          style={[
            styles.anchor,
            {
              bottom: fabBottom,
              right: popoverRight,
              width: POPOVER_WIDTH,
            },
          ]}
        >
          <Animated.View style={[styles.cardClip, { maxHeight: cardHeight }]}>
            <Animated.View style={{ opacity: cardOpacity }}>
            <LinearGradient
              colors={['rgba(22, 24, 18, 0.98)', 'rgba(12, 13, 10, 0.98)']}
              style={styles.popoverShell}
            >
              <LinearGradient
                colors={[
                  'rgba(163, 230, 53, 0.35)',
                  'rgba(132, 204, 22, 0.08)',
                  'rgba(163, 230, 53, 0.2)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.popoverBorder}
              />

              <View style={styles.popoverInner}>
                <View style={styles.headerBanner}>
                  <View style={styles.headerBannerContent}>
                    <Text style={styles.headerEyebrow}>Registrar</Text>
                    <Text style={styles.headerHint}>Toque na refeição que deseja lançar</Text>
                  </View>
                  <View style={styles.rowSeparator} />
                </View>

                <View style={styles.optionsList}>
                  {MEAL_SLOT_ORDER.map((slot, index) => {
                    const config = getMealSlotConfig(slot)
                    const isLast = index === MEAL_SLOT_ORDER.length - 1

                    return (
                      <View key={slot}>
                        <Pressable
                          onPress={() => handleSlotPress(slot)}
                          style={({ pressed }) => [
                            styles.optionRow,
                            pressed && styles.optionRowPressed,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={config.icon}
                            size={18}
                            color={config.color}
                            style={styles.optionIcon}
                          />

                          <View style={styles.optionTextCol}>
                            <Text style={styles.optionLabel}>{config.label}</Text>
                            {config.suggestedTime !== '—' ? (
                              <Text style={styles.optionMeta}>
                                Sugerido · {config.suggestedTime}
                              </Text>
                            ) : (
                              <Text style={styles.optionMeta}>Fora do horário habitual</Text>
                            )}
                          </View>

                          <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
                        </Pressable>
                        {!isLast ? <View style={styles.rowSeparator} /> : null}
                      </View>
                    )
                  })}
                </View>
              </View>
            </LinearGradient>
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.baseLine, { width: lineWidth }]}>
            <LinearGradient
              colors={['rgba(163, 230, 53, 0.25)', '#a3e635', 'rgba(163, 230, 53, 0.55)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.baseLineGradient}
            />
          </Animated.View>
        </View>
      </View>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  anchor: {
    position: 'absolute',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  cardClip: {
    width: '100%',
    overflow: 'hidden',
    marginBottom: BASE_LINE_HEIGHT,
  },
  popoverShell: {
    width: '100%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    padding: 1,
    shadowColor: '#84cc16',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 14,
  },
  popoverBorder: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    opacity: 0.55,
  },
  popoverInner: {
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(14, 15, 12, 0.96)',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(163, 230, 53, 0.14)',
  },
  baseLine: {
    height: BASE_LINE_HEIGHT,
    alignSelf: 'flex-end',
    borderRadius: 999,
    overflow: 'hidden',
  },
  baseLineGradient: {
    flex: 1,
    borderRadius: 999,
  },
  headerBanner: {
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: 'rgba(132, 204, 22, 0.06)',
  },
  headerBannerContent: {
    paddingHorizontal: 14,
    gap: 3,
    marginBottom: 10,
  },
  headerEyebrow: {
    color: '#a3e635',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  headerHint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  optionsList: {
    paddingBottom: 6,
  },
  rowSeparator: {
    height: 0.5,
    marginLeft: SEPARATOR_LEFT_INSET,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 13,
  },
  optionRowPressed: {
    backgroundColor: 'rgba(132, 204, 22, 0.06)',
  },
  optionIcon: {
    width: 22,
  },
  optionTextCol: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  optionMeta: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
})
