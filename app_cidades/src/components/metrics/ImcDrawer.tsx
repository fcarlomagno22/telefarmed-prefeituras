import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import LottieView from 'lottie-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import weightAnimation from '../../../assets/weight.json'
import { colors } from '../../theme/colors'
import { ProfileSnapshot } from '../../types/metrics'
import {
  calculateImc,
  formatImcValue,
  getImcZone,
  hasImcInputs,
} from '../../utils/bmi'
import { PrimaryButton } from '../PrimaryButton'

const SHEET_OFFSET = 460
const IMC_GRADIENT = ['#67e8f9', '#0891b2', '#0e7490'] as const

type ImcDrawerProps = {
  visible: boolean
  profile: ProfileSnapshot
  onClose: () => void
  onEditWeight: () => void
  onEditHeight: () => void
}

export function ImcDrawer({
  visible,
  profile,
  onClose,
  onEditWeight,
  onEditHeight,
}: ImcDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const canCalculate = hasImcInputs(profile)
  const imc = canCalculate ? calculateImc(profile) : null
  const zone = imc !== null ? getImcZone(imc) : null

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

  function handleEditWeight() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    closeSheet(() => {
      onClose()
      onEditWeight()
    })
  }

  function handleEditHeight() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    closeSheet(() => {
      onClose()
      onEditHeight()
    })
  }

  if (!isMounted) return null

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />
        </Animated.View>

        <View style={styles.keyboardWrap}>
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
              colors={[...IMC_GRADIENT]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.topAccent}
            />

            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <LinearGradient
                colors={[...IMC_GRADIENT]}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={styles.fieldIconOrb}
              >
                <MaterialCommunityIcons name="scale-bathroom" size={22} color="#fff" />
              </LinearGradient>

              <View style={styles.headerTextCol}>
                <Text style={styles.headerTitle}>IMC</Text>
                <Text style={styles.subtitle}>
                  {canCalculate
                    ? 'Calculado com base no seu peso e altura'
                    : 'Informe peso e altura para calcular'}
                </Text>
              </View>

              <Pressable
                onPress={handleDismiss}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                accessibilityRole="button"
                accessibilityLabel="Fechar IMC"
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.lottieWrap}>
              <LottieView source={weightAnimation} autoPlay loop style={styles.lottieAnimation} />
            </View>

            {canCalculate && imc !== null && zone ? (
              <View style={styles.metricsRow}>
                <View style={styles.valueCard}>
                  <Text style={styles.cardLabel}>Seu índice</Text>
                  <Text style={styles.valueText}>{formatImcValue(imc)}</Text>
                  <Text style={styles.valueUnit}>kg/m²</Text>
                </View>

                <View
                  style={[
                    styles.zoneCard,
                    { backgroundColor: zone.bg, borderColor: zone.border },
                  ]}
                >
                  <Text style={styles.cardLabel}>Classificação</Text>
                  <View style={styles.zoneBadgeRow}>
                    <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
                    <Text style={[styles.zoneLabel, { color: zone.color }]}>{zone.label}</Text>
                  </View>
                  <Text style={[styles.zoneRange, { color: zone.color }]}>OMS · {zone.rangeLabel}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="scale-off" size={24} color={colors.textMuted} />
                <Text style={styles.emptyText}>Informe peso e altura para calcular seu IMC.</Text>
              </View>
            )}

            <View style={styles.sourceCard}>
              <Text style={styles.sourceCardLabel}>Dados do perfil</Text>

              <View style={styles.sourceRow}>
                <Pressable
                  onPress={handleEditWeight}
                  style={({ pressed }) => [styles.sourceField, pressed && styles.sourceFieldPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Atualizar peso"
                >
                  <MaterialCommunityIcons name="weight-kilogram" size={18} color="#67e8f9" />
                  <Text style={styles.sourceFieldLabel}>Peso</Text>
                  <Text style={styles.sourceFieldValue}>{profile.weight || '—'}</Text>
                </Pressable>

                <View style={styles.sourceDivider} />

                <Pressable
                  onPress={handleEditHeight}
                  style={({ pressed }) => [styles.sourceField, pressed && styles.sourceFieldPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Atualizar altura"
                >
                  <MaterialCommunityIcons
                    name="human-male-height-variant"
                    size={18}
                    color="#67e8f9"
                  />
                  <Text style={styles.sourceFieldLabel}>Altura</Text>
                  <Text style={styles.sourceFieldValue}>{profile.height || '—'}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <View style={styles.primaryActionWrap}>
                <PrimaryButton label="Atualizar peso" onPress={handleEditWeight} />
              </View>
              <Pressable
                onPress={handleEditHeight}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.secondaryActionPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Atualizar altura"
              >
                <MaterialCommunityIcons name="human-male-height-variant" size={18} color="#67e8f9" />
                <Text style={styles.secondaryActionText}>Altura</Text>
              </Pressable>
            </View>

            <Text style={styles.disclaimer}>
              O IMC é um indicador de triagem. Não substitui avaliação médica e pode não refletir bem
              atletas, idosos ou gestantes.
            </Text>
          </Animated.View>
        </View>
      </View>
    </Modal>
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
  keyboardWrap: {
    justifyContent: 'flex-end',
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
    marginBottom: 4,
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
  lottieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginBottom: 12,
  },
  lottieAnimation: {
    width: 160,
    height: 120,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  valueCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(8, 145, 178, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
  },
  zoneCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 96,
    gap: 6,
  },
  cardLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  valueText: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    lineHeight: 40,
    marginTop: 4,
  },
  valueUnit: {
    color: '#67e8f9',
    fontSize: 12,
    fontWeight: '700',
  },
  zoneBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  zoneDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  zoneLabel: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  zoneRange: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.9,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  sourceCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sourceCardLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  sourceField: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sourceFieldPressed: {
    backgroundColor: 'rgba(103, 232, 249, 0.08)',
  },
  sourceFieldLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sourceFieldValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  sourceDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginBottom: 4,
  },
  primaryActionWrap: {
    flex: 1,
  },
  secondaryAction: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.22)',
    paddingVertical: 10,
  },
  secondaryActionPressed: {
    opacity: 0.82,
  },
  secondaryActionText: {
    color: '#67e8f9',
    fontSize: 11,
    fontWeight: '700',
  },
  disclaimer: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
})
