import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ListRenderItem,
} from 'react-native'
import { MENTAL_HEALTH_HOW_IT_WORKS_INTRO, MENTAL_HEALTH_HOW_IT_WORKS_STEPS, type MentalHealthHowItWorksStep } from '../../types/mentalHealth'
import { colors } from '../../theme/colors'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { MentalHealthHowItWorksTimeline } from './MentalHealthHowItWorksTimeline'

type MentalHealthHowItWorksDrawerProps = {
  visible: boolean
  onClose: () => void
}

const TOTAL_STEPS = MENTAL_HEALTH_HOW_IT_WORKS_STEPS.length

function StepSlide({ step, width }: { step: MentalHealthHowItWorksStep; width: number }) {
  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.heroStage}>
        <Text style={styles.heroGhostNumber}>{step.id}</Text>

        <View style={styles.iconOrbit}>
          <View style={styles.iconOrbitRing} />
          <LinearGradient
            colors={['rgba(103, 232, 249, 0.28)', 'rgba(8, 145, 178, 0.12)']}
            style={styles.iconGlow}
          >
            <LinearGradient
              colors={['#67e8f9', '#0891b2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <Ionicons name={step.icon} size={34} color="#0a0a0c" />
            </LinearGradient>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.stepMeta}>
        <Text style={styles.stepEyebrow}>Passo {step.id}</Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepSummary}>{step.summary}</Text>
        <Text style={styles.stepDetail}>{step.detail}</Text>
      </View>
    </View>
  )
}

export function MentalHealthHowItWorksDrawer({
  visible,
  onClose,
}: MentalHealthHowItWorksDrawerProps) {
  const { width: screenWidth } = useWindowDimensions()
  const slideWidth = screenWidth - 40

  const [step, setStep] = useState(1)
  const pagerRef = useRef<FlatList<MentalHealthHowItWorksStep>>(null)
  const contentOpacity = useRef(new Animated.Value(1)).current
  const contentTranslateY = useRef(new Animated.Value(0)).current

  const currentStepMeta =
    MENTAL_HEALTH_HOW_IT_WORKS_STEPS.find((item) => item.id === step) ??
    MENTAL_HEALTH_HOW_IT_WORKS_STEPS[0]

  useEffect(() => {
    if (!visible) {
      setStep(1)
      pagerRef.current?.scrollToOffset({ offset: 0, animated: false })
    }
  }, [visible])

  const animateStepContent = useCallback(() => {
    contentOpacity.setValue(0)
    contentTranslateY.setValue(10)

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }, [contentOpacity, contentTranslateY])

  const goToStep = useCallback(
    (nextStep: number, animated = true) => {
      const clamped = Math.min(Math.max(nextStep, 1), TOTAL_STEPS)
      setStep(clamped)
      pagerRef.current?.scrollToOffset({
        offset: (clamped - 1) * slideWidth,
        animated,
      })
      animateStepContent()
    },
    [animateStepContent, slideWidth],
  )

  function handleBack() {
    if (step <= 1) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    goToStep(step - 1)
  }

  function handleNext() {
    if (step >= TOTAL_STEPS) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onClose()
      return
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    goToStep(step + 1)
  }

  function handlePagerScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth)
    const nextStep = Math.min(Math.max(nextIndex + 1, 1), TOTAL_STEPS)

    if (nextStep !== step) {
      setStep(nextStep)
      animateStepContent()
      void Haptics.selectionAsync()
    }
  }

  const renderSlide: ListRenderItem<MentalHealthHowItWorksStep> = useCallback(
    ({ item }) => <StepSlide step={item} width={slideWidth} />,
    [slideWidth],
  )

  const footer = (
    <View style={styles.footerRow}>
      <Pressable
        onPress={handleBack}
        disabled={step <= 1}
        style={({ pressed }) => [
          styles.navBtn,
          step <= 1 && styles.navBtnDisabled,
          pressed && step > 1 && styles.navBtnPressed,
        ]}
      >
        <Ionicons name="chevron-back" size={18} color={step <= 1 ? colors.textSubtle : colors.text} />
        <Text style={[styles.navBtnText, step <= 1 && styles.navBtnTextDisabled]}>Anterior</Text>
      </Pressable>

      <View style={styles.footerCounter}>
        <Text style={styles.footerCounterText}>
          {step} / {TOTAL_STEPS}
        </Text>
      </View>

      <Pressable
        onPress={handleNext}
        style={({ pressed }) => [styles.nextBtn, pressed && styles.nextBtnPressed]}
      >
        <LinearGradient
          colors={['#22d3ee', '#0891b2', '#0e7490']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.nextBtnGradient}
        >
          <Text style={styles.nextBtnText}>{step >= TOTAL_STEPS ? 'Entendi' : 'Próximo'}</Text>
          <Ionicons
            name={step >= TOTAL_STEPS ? 'checkmark' : 'chevron-forward'}
            size={18}
            color="#0a0a0c"
          />
        </LinearGradient>
      </Pressable>
    </View>
  )

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Como funciona"
      subtitle={`Passo ${step} de ${TOTAL_STEPS} · ${currentStepMeta.title}`}
      onClose={onClose}
      fullScreen
      scrollable={false}
      footer={footer}
      dense
    >
      <View style={styles.host}>
        <Text style={styles.intro}>{MENTAL_HEALTH_HOW_IT_WORKS_INTRO}</Text>

        <MentalHealthHowItWorksTimeline currentStep={step} onStepPress={(next) => goToStep(next)} />

        <Animated.View
          style={[
            styles.pagerWrap,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <FlatList
            ref={pagerRef}
            data={MENTAL_HEALTH_HOW_IT_WORKS_STEPS}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderSlide}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={slideWidth}
            snapToAlignment="start"
            disableIntervalMomentum
            onMomentumScrollEnd={handlePagerScrollEnd}
            getItemLayout={(_, index) => ({
              length: slideWidth,
              offset: slideWidth * index,
              index,
            })}
            style={styles.pager}
          />
        </Animated.View>

        <Text style={styles.swipeHint}>Deslize ou toque nos passos acima</Text>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    minHeight: 0,
    gap: 8,
  },
  intro: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  pagerWrap: {
    flex: 1,
    minHeight: 0,
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    gap: 18,
    paddingTop: 8,
  },
  heroStage: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 190,
  },
  heroGhostNumber: {
    position: 'absolute',
    color: 'rgba(103, 232, 249, 0.08)',
    fontSize: 160,
    fontWeight: '900',
    letterSpacing: -8,
    lineHeight: 160,
  },
  iconOrbit: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOrbitRing: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.18)',
  },
  iconGlow: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 6,
  },
  stepMeta: {
    gap: 8,
    paddingHorizontal: 4,
  },
  stepEyebrow: {
    color: '#67e8f9',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  stepTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  stepSummary: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  stepDetail: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  swipeHint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    paddingBottom: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 92,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  navBtnDisabled: {
    opacity: 0.45,
  },
  navBtnPressed: {
    opacity: 0.88,
  },
  navBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  navBtnTextDisabled: {
    color: colors.textSubtle,
  },
  footerCounter: {
    flex: 1,
    alignItems: 'center',
  },
  footerCounterText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  nextBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  nextBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  nextBtnGradient: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  nextBtnText: {
    color: '#0a0a0c',
    fontSize: 14,
    fontWeight: '800',
  },
})
