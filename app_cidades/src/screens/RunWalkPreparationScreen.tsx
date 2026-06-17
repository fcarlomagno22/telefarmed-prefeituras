import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import LottieView from 'lottie-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { RunWalkPreparationInfoGrid } from '../components/runWalk/preparation/RunWalkPreparationInfoGrid'
import { RunWalkShareLocationDrawer } from '../components/runWalk/preparation/RunWalkShareLocationDrawer'
import { appEnv } from '../config/env'
import { useAuth } from '../contexts/AuthContext'
import {
  ACTIVITY_MODALITY_LABELS,
  MODALITY_DEFAULTS,
} from '../data/runWalkModalityConfig'
import {
  loadPreparationDraft,
  savePreparationDraft,
} from '../data/runWalkPreparationDraftStorage'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { formatBatteryLevel, useDeviceBattery } from '../hooks/useDeviceBattery'
import { gpsQualityLabel, useRunWalkLocation } from '../hooks/useRunWalkLocation'
import { useRunWalkWeather } from '../hooks/useRunWalkWeather'
import { colors } from '../theme/colors'
import { getRunWalkRouteParams, type ActivityModality } from '../types/auth'
import { formatTemperature, formatWeatherLine } from '../utils/runWalkWeather'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')
const runnerAnimation = require('../../assets/runner.json')

export function RunWalkPreparationScreen() {
  const insets = useSafeAreaInsets()
  const { routeParams, navigateTo, goBack, user } = useAuth()
  const initial = getRunWalkRouteParams(routeParams)

  const [modality, setModality] = useState<ActivityModality>(initial.modality ?? 'walk')
  const [activityName, setActivityName] = useState(
    initial.activityName ?? MODALITY_DEFAULTS.walk.activityName,
  )
  const [intensity, setIntensity] = useState(
    initial.intensity ?? MODALITY_DEFAULTS.walk.intensity,
  )
  const [durationMinutes, setDurationMinutes] = useState(
    initial.durationMinutes ?? MODALITY_DEFAULTS.walk.durationMinutes,
  )

  const [audioConfigured, setAudioConfigured] = useState(false)
  const [shareLocationDrawerVisible, setShareLocationDrawerVisible] = useState(false)
  const [startFlowActive, setStartFlowActive] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [draftReady, setDraftReady] = useState(false)

  const address = user?.address

  const location = useRunWalkLocation({ address, enabled: true })
  const battery = useDeviceBattery()
  const weather = useRunWalkWeather(
    location.coordinates?.latitude ?? null,
    location.coordinates?.longitude ?? null,
  )

  const batteryDetail = formatBatteryLevel(battery.levelPercent, battery.isCharging)

  useEffect(() => {
    let active = true

    async function hydrateDraft() {
      const draft = await loadPreparationDraft()
      if (!active) return
      if (draft) {
        setModality(draft.modality)
        setActivityName(draft.activityName)
        setIntensity(draft.intensity)
        setDurationMinutes(draft.durationMinutes)
        setAudioConfigured(draft.audioConfigured)
      }
      setDraftReady(true)
    }

    void hydrateDraft()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!draftReady) return
    void savePreparationDraft({
      modality,
      activityName,
      intensity,
      durationMinutes,
      audioConfigured,
    })
  }, [activityName, audioConfigured, draftReady, durationMinutes, intensity, modality])

  const cityLabel = useMemo(() => {
    if (location.isLocating || location.isResolvingCity) return null
    if (location.cityLabel) return location.cityLabel
    if (address?.city?.trim()) return address.city.trim()
    return null
  }, [
    address?.city,
    location.cityLabel,
    location.isLocating,
    location.isResolvingCity,
  ])

  const infoRowPairs = useMemo(
    () => [
      [
        {
          id: 'activity',
          label: 'Atividade',
          value: activityName,
          icon: 'flag-outline' as const,
        },
        {
          id: 'modality',
          label: 'Modalidade',
          value: ACTIVITY_MODALITY_LABELS[modality],
          icon: 'footsteps-outline' as const,
        },
      ],
      [
        {
          id: 'intensity',
          label: 'Intensidade',
          value: intensity,
          icon: 'speedometer-outline' as const,
        },
        {
          id: 'city',
          label: 'Cidade',
          value: cityLabel ?? (location.isLocating || location.isResolvingCity ? 'Localizando...' : '—'),
          icon: 'location-outline' as const,
          loading: location.isLocating || location.isResolvingCity,
        },
      ],
      [
        {
          id: 'weather',
          label: 'Clima',
          value: weather.weather
            ? formatWeatherLine(weather.weather)
            : weather.error ?? '—',
          icon: 'partly-sunny-outline' as const,
          loading: weather.isLoading,
          singleLine: true,
        },
        {
          id: 'thermal',
          label: 'Sensação térmica',
          value: weather.weather
            ? formatTemperature(weather.weather.apparentTemperatureC)
            : weather.error ?? '—',
          icon: 'thermometer-outline' as const,
          loading: weather.isLoading,
        },
      ],
      [
        {
          id: 'gps',
          label: 'Qualidade do GPS',
          value: location.isLocating
            ? 'Localizando...'
            : gpsQualityLabel(location.gpsQuality),
          icon: 'navigate-outline' as const,
          loading: location.isLocating,
        },
        {
          id: 'battery',
          label: 'Bateria',
          value: batteryDetail,
          icon: 'battery-half-outline' as const,
          loading: battery.isLoading,
        },
      ],
    ],
    [
      activityName,
      battery.isLoading,
      batteryDetail,
      cityLabel,
      intensity,
      location.gpsQuality,
      location.isLocating,
      location.isResolvingCity,
      modality,
      weather.error,
      weather.isLoading,
      weather.weather,
    ],
  )

  function handleBack() {
    goBack()
  }

  useAndroidBackHandler(() => {
    if (shareLocationDrawerVisible) {
      closeShareLocationDrawer()
      return true
    }
    handleBack()
    return true
  })

  function proceedToChecklist() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setStartFlowActive(false)
    navigateTo('run-walk-checklist', {
      modality,
      activityName,
      intensity,
      durationMinutes,
    })
  }

  function openShareLocationDrawer() {
    setShareLocationDrawerVisible(true)
  }

  function closeShareLocationDrawer(cancelFlow = true) {
    setShareLocationDrawerVisible(false)
    if (cancelFlow) {
      setStartFlowActive(false)
    }
  }

  function handleStartPress() {
    setStartFlowActive(true)
    openShareLocationDrawer()
  }

  function handleShareLocationComplete() {
    closeShareLocationDrawer(false)
    proceedToChecklist()
  }

  return (
    <>
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
          title="Preparação"
          subtitle={`${durationMinutes} min · ${ACTIVITY_MODALITY_LABELS[modality]}`}
          paddingTop={Math.max(insets.top, 12) + 8}
          onBack={handleBack}
        />

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {notice ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          {location.error ? (
            <Pressable style={styles.alert} onPress={() => void location.refreshLocation()}>
              <Text style={styles.alertText}>{location.error}</Text>
              <Text style={styles.alertAction}>Toque para tentar novamente</Text>
            </Pressable>
          ) : null}

          <View style={styles.runnerHero}>
            <LottieView source={runnerAnimation} autoPlay loop style={styles.runnerLottie} />
          </View>

          <RunWalkPreparationInfoGrid rowPairs={infoRowPairs} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <Pressable
            onPress={handleStartPress}
            style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Começar"
          >
            <LinearGradient
              colors={['#ffb366', '#ff8533', '#ff6b00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startGradient}
            >
              <Text style={styles.startLabel}>Começar</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <RunWalkShareLocationDrawer
        visible={shareLocationDrawerVisible}
        participantName={user?.name ?? 'Participante'}
        activityName={activityName}
        latitude={location.coordinates?.latitude ?? null}
        longitude={location.coordinates?.longitude ?? null}
        onClose={closeShareLocationDrawer}
        showStartActions
        onConfirmShare={handleShareLocationComplete}
        onContinueWithoutShare={handleShareLocationComplete}
      />

    </>
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
    gap: 18,
    paddingTop: 8,
  },
  notice: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 133, 51, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.28)',
  },
  noticeText: {
    color: '#fdba74',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  alert: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.28)',
    gap: 4,
  },
  alertText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
  },
  alertAction: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  runnerHero: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    marginTop: -4,
    marginBottom: -6,
  },
  runnerLottie: {
    width: 140,
    height: 140,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'rgba(10, 10, 12, 0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  startBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  startGradient: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  startLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
})
