import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import LottieView from 'lottie-react-native'
import { useEffect, useRef, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getSleepStoryCategoryById } from '../../config/sleepStories'
import { colors } from '../../theme/colors'
import type { SleepStory } from '../../types/sleepStories'
import { AppModal } from '../AppModal'

const searchAnimation = require('../../../assets/Search.json')
const REVEAL_DELAY_MS = 2300

type DrawPhase = 'searching' | 'result'

type SleepStoryRandomDrawOverlayProps = {
  visible: boolean
  stories: SleepStory[]
  shuffleKey: number
  onClose: () => void
  onStoryPress: (story: SleepStory) => void
  onShuffleAgain: () => void
}

function pickRandomStory(stories: SleepStory[]) {
  if (stories.length === 0) return null
  const index = Math.floor(Math.random() * stories.length)
  return stories[index] ?? null
}

export function SleepStoryRandomDrawOverlay({
  visible,
  stories,
  shuffleKey,
  onClose,
  onStoryPress,
  onShuffleAgain,
}: SleepStoryRandomDrawOverlayProps) {
  const insets = useSafeAreaInsets()
  const [phase, setPhase] = useState<DrawPhase>('searching')
  const [story, setStory] = useState<SleepStory | null>(null)
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!visible) {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current)
        revealTimerRef.current = null
      }
      setPhase('searching')
      setStory(null)
      return
    }

    setPhase('searching')
    const picked = pickRandomStory(stories)
    setStory(picked)

    revealTimerRef.current = setTimeout(() => {
      setPhase('result')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }, REVEAL_DELAY_MS)

    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current)
        revealTimerRef.current = null
      }
    }
  }, [visible, stories, shuffleKey])

  function handleClose() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
  }

  function handleShuffleAgain() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onShuffleAgain()
  }

  function handleOpenStory() {
    if (!story) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onStoryPress(story)
  }

  if (!visible) return null

  const category = story ? getSleepStoryCategoryById(story.categoryId) : null
  const accent = category?.gradient[1] ?? '#6366f1'

  return (
    <AppModal visible transparent animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={32} tint="dark" style={StyleSheet.absoluteFillObject} />
        ) : null}
        <View style={styles.backdropTint} />

        <Pressable
          onPress={handleClose}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Fechar sorteio"
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.content}>
          {phase === 'searching' ? (
            <>
              <LottieView
                source={searchAnimation}
                autoPlay
                loop
                resizeMode="contain"
                style={styles.searchLottie}
              />
              <Text style={styles.searchingTitle}>Sorteando uma história...</Text>
              <Text style={styles.searchingSubtitle}>Aguarde um instantinho</Text>
            </>
          ) : story ? (
            <>
              <Text style={styles.resultEyebrow}>Sua história de hoje</Text>

              <View style={styles.resultCard}>
                <LinearGradient
                  colors={[`${accent}33`, 'rgba(255,255,255,0.04)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />

                <View style={[styles.resultIconWrap, { backgroundColor: `${accent}22` }]}>
                  <MaterialCommunityIcons
                    name={category?.icon ?? 'book-open-page-variant-outline'}
                    size={28}
                    color={accent}
                  />
                </View>

                <Text style={styles.resultTitle}>{story.title}</Text>
                {category ? (
                  <Text style={[styles.resultCategory, { color: accent }]}>{category.label}</Text>
                ) : null}
                <Text style={styles.resultSummary}>{story.summary}</Text>
              </View>

              <Pressable
                onPress={handleOpenStory}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${story.title}`}
              >
                <Text style={styles.primaryButtonText}>Abrir história</Text>
              </Pressable>

              <Pressable
                onPress={handleShuffleAgain}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Sortear outra história"
              >
                <Ionicons name="shuffle-outline" size={15} color="#c7d2fe" />
                <Text style={styles.secondaryButtonText}>Sortear outra</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.searchingTitle}>Nenhuma história disponível</Text>
              <Text style={styles.searchingSubtitle}>Ajuste os filtros e tente novamente.</Text>
            </>
          )}
        </View>
      </View>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 8, 18, 0.92)',
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 8,
  },
  searchLottie: {
    width: 220,
    height: 220,
  },
  searchingTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  searchingSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  resultEyebrow: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  resultCard: {
    width: '100%',
    borderRadius: 22,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  resultIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.35,
    textAlign: 'center',
    lineHeight: 24,
  },
  resultCategory: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultSummary: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  primaryButtonText: {
    color: '#e0e7ff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#c7d2fe',
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.86,
  },
})
