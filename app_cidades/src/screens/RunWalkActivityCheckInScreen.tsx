import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PrimaryButton } from '../components/PrimaryButton'
import { useAuth } from '../contexts/AuthContext'
import {
  loadRunWalkActivitySummary,
  updateRunWalkActivitySummary,
} from '../data/runWalkActivitySummaryStorage'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import { getRunWalkRouteParams } from '../types/auth'
import {
  RUN_WALK_DISCOMFORT_OPTIONS,
  RUN_WALK_INTENSITY_OPTIONS,
  RUN_WALK_WELLBEING_OPTIONS,
  type RunWalkActivityDiscomfort,
  type RunWalkActivityIntensity,
  type RunWalkActivityWellbeing,
} from '../types/runWalkActivityCheckIn'

type CheckInOption<T extends string> = {
  id: T
  label: string
}

function CheckInQuestionSection<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string
  options: CheckInOption<T>[]
  value: T | null
  onChange: (next: T) => void
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionsWrap}>
        {options.map((option) => {
          const selected = value === option.id

          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                void Haptics.selectionAsync()
                onChange(option.id)
              }}
              style={({ pressed }) => [
                styles.optionChip,
                selected && styles.optionChipSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export function RunWalkActivityCheckInScreen() {
  const insets = useSafeAreaInsets()
  const { navigateTo, routeParams } = useAuth()
  const params = getRunWalkRouteParams(routeParams)
  const summaryId = params.summaryId

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [intensity, setIntensity] = useState<RunWalkActivityIntensity | null>(null)
  const [wellbeing, setWellbeing] = useState<RunWalkActivityWellbeing | null>(null)
  const [discomfort, setDiscomfort] = useState<RunWalkActivityDiscomfort | null>(null)
  const [noteVisible, setNoteVisible] = useState(false)
  const [note, setNote] = useState('')

  const scrollRef = useRef<ScrollView>(null)
  const noteSectionRef = useRef<View>(null)
  const noteInputRef = useRef<TextInput>(null)

  const canSubmit = intensity != null && wellbeing != null && discomfort != null

  const scrollNoteIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true })

      setTimeout(() => {
        noteSectionRef.current?.measureInWindow((_x, y, _width, height) => {
          const windowHeight = Dimensions.get('window').height
          const footerHeight = 132 + insets.bottom
          const visibleBottom = windowHeight - footerHeight

          if (y + height > visibleBottom) {
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        })
        noteInputRef.current?.focus()
      }, 120)
    })
  }, [insets.bottom])

  useEffect(() => {
    if (!noteVisible) return

    scrollNoteIntoView()

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const subscription = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true })
      }, 50)
    })

    return () => subscription.remove()
  }, [noteVisible, scrollNoteIntoView])

  useEffect(() => {
    let active = true

    async function loadSummary() {
      if (!summaryId) {
        navigateTo('run-walk')
        return
      }

      const loaded = await loadRunWalkActivitySummary(summaryId)
      if (!active) return

      if (!loaded) {
        navigateTo('run-walk')
        return
      }

      setIsLoading(false)
    }

    void loadSummary()
    return () => {
      active = false
    }
  }, [navigateTo, summaryId])

  useAndroidBackHandler(
    useCallback(() => {
      return true
    }, []),
  )

  async function goToSummary() {
    if (!summaryId) return
    navigateTo('run-walk-summary', { summaryId })
  }

  async function handleSkip() {
    if (!summaryId || isSubmitting) return

    setIsSubmitting(true)
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      await updateRunWalkActivitySummary(summaryId, {
        checkIn: null,
        checkInSkipped: true,
      })
      await goToSummary()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit() {
    if (!summaryId || !canSubmit || isSubmitting) return

    setIsSubmitting(true)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    try {
      const trimmedNote = note.trim()

      await updateRunWalkActivitySummary(summaryId, {
        checkIn: {
          intensity: intensity!,
          wellbeing: wellbeing!,
          discomfort: discomfort!,
          note: trimmedNote.length > 0 ? trimmedNote : null,
          answeredAt: new Date().toISOString(),
        },
        checkInSkipped: false,
      })
      await goToSummary()
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleToggleNote() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (noteVisible) {
      setNoteVisible(false)
      noteInputRef.current?.blur()
      return
    }

    setNoteVisible(true)
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingRoot, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primaryLight} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0a0a0c', '#101018', '#0a0a0c']}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['rgba(37, 99, 235, 0.14)', 'transparent', 'rgba(16, 185, 129, 0.12)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 12) + 12,
              paddingBottom: 8,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formBody}>
            <View style={styles.hero}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="clipboard-outline" size={22} color="#93c5fd" />
              </View>
              <Text style={styles.title}>Check-in do treino</Text>
              <Text style={styles.subtitle}>
                Conte como foi a atividade. Leva menos de um minuto.
              </Text>
            </View>

            <CheckInQuestionSection
              title="Como foi a intensidade?"
              options={RUN_WALK_INTENSITY_OPTIONS}
              value={intensity}
              onChange={setIntensity}
            />

            <CheckInQuestionSection
              title="Como você está?"
              options={RUN_WALK_WELLBEING_OPTIONS}
              value={wellbeing}
              onChange={setWellbeing}
            />

            <CheckInQuestionSection
              title="Sentiu algum desconforto?"
              options={RUN_WALK_DISCOMFORT_OPTIONS}
              value={discomfort}
              onChange={setDiscomfort}
            />
          </View>

          <View ref={noteSectionRef} style={styles.noteSection} collapsable={false}>
            <Pressable
              accessibilityRole="button"
              onPress={handleToggleNote}
              style={({ pressed }) => [styles.noteButton, pressed && styles.optionPressed]}
            >
              <Ionicons
                name={noteVisible ? 'remove-circle-outline' : 'add-circle-outline'}
                size={18}
                color="#93c5fd"
              />
              <Text style={styles.noteButtonText}>
                {noteVisible ? 'Ocultar observação' : 'Adicionar observação'}
              </Text>
            </Pressable>

            {noteVisible ? (
              <TextInput
                ref={noteInputRef}
                value={note}
                onChangeText={setNote}
                placeholder="Caminhei bem, mas senti cansaço na subida."
                placeholderTextColor="rgba(245, 245, 247, 0.34)"
                multiline
                textAlignVertical="top"
                style={styles.noteInput}
                onLayout={() => scrollRef.current?.scrollToEnd({ animated: true })}
              />
            ) : null}
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}
        >
          <PrimaryButton
            label="Concluir check-in"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!canSubmit}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Não responder"
            onPress={handleSkip}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.skipButton, pressed && styles.optionPressed]}
          >
            <Text style={styles.skipButtonText}>Não responder</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  formBody: {
    flexGrow: 1,
    gap: 18,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.28)',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  section: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  optionChipSelected: {
    borderColor: 'rgba(59, 130, 246, 0.55)',
    backgroundColor: 'rgba(59, 130, 246, 0.16)',
  },
  optionLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  optionLabelSelected: {
    color: '#bfdbfe',
  },
  optionPressed: {
    opacity: 0.86,
  },
  noteSection: {
    gap: 8,
    marginTop: 8,
    paddingTop: 4,
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.22)',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  noteButtonText: {
    color: '#93c5fd',
    fontSize: 14,
    fontWeight: '700',
  },
  noteInput: {
    minHeight: 96,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(10, 10, 12, 0.96)',
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  skipButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
})
