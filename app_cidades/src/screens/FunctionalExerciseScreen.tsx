import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ExerciseSessionOverlay } from '../components/functional/ExerciseSessionOverlay'
import { FunctionalDurationPicker } from '../components/functional/FunctionalDurationPicker'
import { FunctionalExerciseDetailContent } from '../components/functional/FunctionalExerciseDetailContent'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { appEnv } from '../config/env'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import type { ExerciseTimerConfig } from '../hooks/useExerciseTimer'
import {
  FUNCTIONAL_EXERCISES,
  getExerciseById,
} from '../data/functionalExercises'
import {
  loadFavoriteExerciseIds,
  saveWorkoutSession,
  toggleFavoriteExerciseId,
} from '../data/functionalTrainingStorage'
import { colors } from '../theme/colors'
import type { FunctionalDurationSec } from '../types/functionalTraining'
import { getFunctionalRouteParams } from '../types/auth'
import { getNextExerciseId } from '../utils/functionalTraining'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')

export function FunctionalExerciseScreen() {
  const insets = useSafeAreaInsets()
  const { routeParams, goBack, canGoBack, navigateTo, user } = useAuth()
  const functionalParams = getFunctionalRouteParams(routeParams)

  const exerciseId = functionalParams.exerciseId ?? FUNCTIONAL_EXERCISES[0]?.id
  const exercise = useMemo(() => getExerciseById(exerciseId), [exerciseId])

  const [durationSec, setDurationSec] = useState<FunctionalDurationSec>(30)
  const [isFavorite, setIsFavorite] = useState(false)
  const [sessionVisible, setSessionVisible] = useState(false)
  const [sessionConfig, setSessionConfig] = useState<ExerciseTimerConfig | null>(null)
  const [pendingNextExerciseId, setPendingNextExerciseId] = useState<string | null>(null)

  const allExerciseIds = useMemo(
    () => FUNCTIONAL_EXERCISES.map((item) => item.id),
    [],
  )

  useEffect(() => {
    if (!exercise) return
    setDurationSec(exercise.durationDefaultSec as FunctionalDurationSec)
  }, [exercise?.id])

  useEffect(() => {
    if (!user) return
    void loadFavoriteExerciseIds(user.cpf).then((ids) => {
      setIsFavorite(ids.includes(exerciseId))
    })
  }, [user, exerciseId])

  useEffect(() => {
    if (!pendingNextExerciseId) return
    navigateTo('functional-exercise', { exerciseId: pendingNextExerciseId })
    setPendingNextExerciseId(null)
  }, [pendingNextExerciseId, navigateTo])

  useAndroidBackHandler(
    useCallback(() => {
      if (sessionVisible) {
        setSessionVisible(false)
        setSessionConfig(null)
        return true
      }
      if (canGoBack()) return goBack()
      return false
    }, [sessionVisible, canGoBack, goBack]),
  )

  if (!exercise) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Exercício não encontrado.</Text>
      </View>
    )
  }

  const currentExercise = exercise
  const nextExerciseId = getNextExerciseId(currentExercise.id, allExerciseIds)

  function startSession() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSessionConfig({
      mode: 'single',
      workSec: durationSec,
      exerciseIds: [currentExercise.id],
    })
    setSessionVisible(true)
  }

  async function handleToggleFavorite() {
    if (!user) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = await toggleFavoriteExerciseId(user.cpf, currentExercise.id)
    setIsFavorite(next.includes(currentExercise.id))
  }

  async function handleSessionCompleted(payload: {
    totalActiveSec: number
    exerciseIds: string[]
    mode: ExerciseTimerConfig['mode']
    durationSec: number
  }) {
    if (!user) return

    await saveWorkoutSession({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      patientCpf: user.cpf,
      exerciseIds: payload.exerciseIds,
      mode: payload.mode,
      durationSec: payload.durationSec,
      completedAtIso: new Date().toISOString(),
      totalActiveSec: payload.totalActiveSec,
    })
  }

  function handleNextExercise(nextId: string) {
    setSessionVisible(false)
    setSessionConfig(null)
    setPendingNextExerciseId(nextId)
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
        <LinearGradient
          colors={['rgba(10, 10, 12, 0.55)', 'rgba(10, 10, 12, 0.92)', colors.background]}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <ScreenStackHeader
          title={exercise.name}
          subtitle="Detalhes e execução guiada"
          paddingTop={insets.top + 8}
          onBack={() => {
            if (canGoBack()) goBack()
            else navigateTo('functional-training')
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 120 },
          ]}
        >
          <FunctionalExerciseDetailContent exercise={exercise} />

          <View style={styles.durationSection}>
            <FunctionalDurationPicker value={durationSec} onChange={setDurationSec} />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={() => void handleToggleFavorite()}
            style={({ pressed }) => [styles.favoriteBtn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Remover favorito' : 'Favoritar exercício'}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#fb7185' : colors.text}
            />
          </Pressable>

          <Pressable
            onPress={startSession}
            style={({ pressed }) => [styles.startBtn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Iniciar treino por ${durationSec} segundos`}
          >
            <LinearGradient
              colors={['#fb923c', '#f97316', '#ea580c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startBtnGradient}
            >
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.startBtnText}>Iniciar treino · {durationSec}s</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ImageBackground>

      <ExerciseSessionOverlay
        visible={sessionVisible}
        config={sessionConfig}
        onClose={() => {
          setSessionVisible(false)
          setSessionConfig(null)
        }}
        onCompleted={(payload) => void handleSessionCompleted(payload)}
        onNextExercise={
          nextExerciseId ? () => handleNextExercise(nextExerciseId) : undefined
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    gap: 18,
  },
  durationSection: {
    marginHorizontal: 16,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(10, 10, 12, 0.94)',
  },
  favoriteBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  startBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  btnPressed: {
    opacity: 0.9,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  fallbackText: {
    color: colors.textMuted,
    fontSize: 14,
  },
})
