import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import LottieView from 'lottie-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import warmupAnimation from '../../assets/warmup.json'
import { NeonSectionDivider } from '../components/NeonSectionDivider'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { appEnv } from '../config/env'
import { useAuth } from '../contexts/AuthContext'
import { useGuestAuth } from '../contexts/GuestAuthContext'
import { loadActiveLiveShareSession } from '../data/runWalkLiveShareService'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { formatBatteryLevel, useDeviceBattery } from '../hooks/useDeviceBattery'
import {
  useRunWalkPreparationChecklist,
  type PreparationChecklistItem,
} from '../hooks/useRunWalkPreparationChecklist'
import { useRunWalkLocation } from '../hooks/useRunWalkLocation'
import { colors } from '../theme/colors'
import { getRunWalkRouteParams } from '../types/auth'
import { playCheckSound } from '../utils/appSounds'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')
const REVEAL_STAGGER_MS = 420

function ChecklistRow({
  item,
  visible,
  index,
}: {
  item: PreparationChecklistItem
  visible: boolean
  index: number
}) {
  const translateY = useRef(new Animated.Value(18)).current
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.92)).current
  const glow = useRef(new Animated.Value(0)).current
  const isShownRef = useRef(false)
  const prevOkRef = useRef(false)

  function triggerOkFeedback() {
    void playCheckSound()
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    Animated.sequence([
      Animated.timing(glow, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(glow, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }

  useEffect(() => {
    if (!visible) {
      isShownRef.current = false
      prevOkRef.current = false
      translateY.setValue(18)
      opacity.setValue(0)
      scale.setValue(0.92)
      glow.setValue(0)
      return
    }

    const delay = index * REVEAL_STAGGER_MS
    const timer = setTimeout(() => {
      isShownRef.current = true
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 16,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 14,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start()

      if (item.ok && !prevOkRef.current) {
        prevOkRef.current = true
        setTimeout(() => {
          triggerOkFeedback()
        }, 180)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [glow, index, item.ok, opacity, scale, translateY, visible])

  useEffect(() => {
    if (!visible || !isShownRef.current) return
    if (item.ok && !prevOkRef.current) {
      prevOkRef.current = true
      triggerOkFeedback()
    }
    if (!item.ok) {
      prevOkRef.current = false
    }
  }, [item.ok, visible])

  const borderColor = item.ok ? 'rgba(34, 197, 94, 0.35)' : 'rgba(255, 255, 255, 0.08)'
  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.85],
  })

  return (
    <Animated.View
      style={[
        styles.row,
        {
          opacity,
          transform: [{ translateY }, { scale }],
          borderColor,
        },
      ]}
    >
      <Animated.View pointerEvents="none" style={[styles.rowGlow, { opacity: glowOpacity }]} />
      <View style={[styles.iconWrap, item.ok ? styles.iconOk : styles.iconPending]}>
        <Ionicons
          name={item.ok ? 'checkmark-circle' : 'ellipse-outline'}
          size={18}
          color={item.ok ? '#86efac' : colors.textSubtle}
        />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.detail}>{item.detail}</Text>
      </View>
      {item.ok ? (
        <View style={styles.okBadge}>
          <Text style={styles.okBadgeText}>OK</Text>
        </View>
      ) : (
        <View style={styles.pendingDot} />
      )}
    </Animated.View>
  )
}

export function RunWalkPreparationChecklistScreen() {
  const insets = useSafeAreaInsets()
  const { routeParams, navigateTo, goBack, user } = useAuth()
  const { requireAuth } = useGuestAuth()
  const params = getRunWalkRouteParams(routeParams)

  const [liveShareConfigured, setLiveShareConfigured] = useState(false)
  const [revealStarted, setRevealStarted] = useState(false)
  const [showAction, setShowAction] = useState(false)
  const pulse = useRef(new Animated.Value(0)).current
  const progress = useRef(new Animated.Value(0)).current

  const address = user?.address
  const location = useRunWalkLocation({ address, enabled: true })
  const battery = useDeviceBattery()

  const batteryOk =
    battery.isCharging || (battery.levelPercent != null && battery.levelPercent >= 15)
  const batteryDetail = formatBatteryLevel(battery.levelPercent, battery.isCharging)

  const { items, canStart } = useRunWalkPreparationChecklist({
    gpsQuality: location.gpsQuality,
    gpsLocated: Boolean(location.coordinates),
    batteryOk,
    batteryDetail,
    liveShareConfigured,
  })

  const okCount = useMemo(() => items.filter((item) => item.ok).length, [items])
  const progressRatio = items.length > 0 ? okCount / items.length : 0

  const loadLiveShareState = useCallback(async () => {
    const session = await loadActiveLiveShareSession()
    setLiveShareConfigured(Boolean(session?.isActive))
  }, [])

  useEffect(() => {
    void loadLiveShareState()
  }, [loadLiveShareState])

  useEffect(() => {
    setRevealStarted(true)
    const actionTimer = setTimeout(() => setShowAction(true), items.length * REVEAL_STAGGER_MS + 500)

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start()

    return () => clearTimeout(actionTimer)
  }, [items.length, pulse])

  useEffect(() => {
    Animated.timing(progress, {
      toValue: progressRatio,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [progress, progressRatio])

  useAndroidBackHandler(() => {
    goBack()
    return true
  })

  const lottieScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  })

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  function handleProceed() {
    requireAuth('vida:run-walk', () => {
      if (!canStart) return
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      navigateTo('run-walk-countdown', {
        modality: params.modality,
        activityName: params.activityName,
        intensity: params.intensity,
        durationMinutes: params.durationMinutes,
      })
    })
  }

  return (
    <View style={styles.root}>
      <ImageBackground
        source={backgroundSource}
        style={styles.background}
        resizeMode="cover"
        imageStyle={styles.backgroundImage}
      />

      <LinearGradient
        colors={['rgba(10, 10, 12, 0.55)', 'transparent', 'rgba(10, 10, 12, 0.85)']}
        locations={[0, 0.35, 1]}
        style={styles.screenOverlay}
        pointerEvents="none"
      />

      <ScreenStackHeader
        title="Checklist automático"
        subtitle="Verificando requisitos"
        paddingTop={Math.max(insets.top, 12) + 8}
        onBack={goBack}
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          A internet não é obrigatória. A atividade pode ser salva localmente e sincronizada depois.
        </Text>

        <Animated.View style={[styles.lottieShell, { transform: [{ scale: lottieScale }] }]}>
          <LinearGradient
            colors={['rgba(255, 133, 51, 0.18)', 'rgba(255, 107, 0, 0.06)', 'transparent']}
            style={styles.lottieGlow}
          />
          <LottieView source={warmupAnimation} autoPlay loop style={styles.lottie} />
        </Animated.View>

        <NeonSectionDivider />

        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressLabel}>
            {okCount} de {items.length} itens verificados
          </Text>
        </View>

        <View style={styles.list}>
          {items.map((item, index) => (
            <ChecklistRow key={item.id} item={item} index={index} visible={revealStarted} />
          ))}
        </View>
      </ScrollView>

      {showAction ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          {!canStart ? (
            <Text style={styles.blockerText}>
              Aguarde o GPS e verifique a bateria para continuar.
            </Text>
          ) : null}

          <Pressable
            onPress={handleProceed}
            disabled={!canStart}
            style={({ pressed }) => [
              styles.proceedBtn,
              !canStart && styles.proceedBtnDisabled,
              pressed && canStart && styles.proceedBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Iniciar contagem regressiva"
          >
            <LinearGradient
              colors={canStart ? ['#86efac', '#22c55e', '#16a34a'] : ['#52525b', '#3f3f46']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.proceedGradient}
            >
              <Text style={styles.proceedLabel}>
                {canStart ? 'Iniciar contagem regressiva' : 'Aguardando requisitos'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    opacity: 0.35,
  },
  screenOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    gap: 16,
    paddingTop: 8,
  },
  lead: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
  },
  lottieShell: {
    alignSelf: 'center',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  lottieGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  lottie: {
    width: 120,
    height: 120,
  },
  progressBlock: {
    gap: 8,
    paddingTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.2)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  progressLabel: {
    color: '#86efac',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  list: {
    gap: 8,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.9)',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOk: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  iconPending: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  detail: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  okBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  okBadgeText: {
    color: '#86efac',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 133, 51, 0.85)',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
    backgroundColor: 'rgba(10, 10, 12, 0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  blockerText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  proceedBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  proceedBtnDisabled: {
    opacity: 0.75,
  },
  proceedBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  proceedGradient: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  proceedLabel: {
    color: '#052e16',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
})
