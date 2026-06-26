import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { EditableProfileFieldId, ProfileSnapshot } from '../../types/metrics'
import { keyboardAvoidingBehavior } from '../../utils/keyboardLayout'
import { getModalFooterPadding } from '../../utils/modalSafeArea'
import { PrimaryButton } from '../PrimaryButton'
import { AppModal } from '../AppModal'
import { WaveTitle } from '../WaveTitle'

const SHEET_OFFSET = 400
const KEYBOARD_EXTRA_PADDING = 20
const GENDER_OPTIONS = ['Feminino', 'Masculino', 'Outro', 'Prefiro não informar'] as const

type ProfileFieldEditDrawerProps = {
  visible: boolean
  field: EditableProfileFieldId | null
  profile: ProfileSnapshot
  onClose: () => void
  onSave: (field: EditableProfileFieldId, value: string) => void
}

type FieldConfig = {
  title: string
  subtitle: string
  placeholder: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  gradient: readonly [string, string, string]
  keyboardType: 'default' | 'decimal-pad' | 'number-pad'
  suffix: string
}

const FIELD_CONFIG: Record<EditableProfileFieldId, FieldConfig> = {
  height: {
    title: 'Altura',
    subtitle: 'Informe sua altura em metros',
    placeholder: 'Ex: 1,72',
    icon: 'human-male-height-variant',
    gradient: ['#7dd3fc', '#0284c7', '#0369a1'],
    keyboardType: 'decimal-pad',
    suffix: ' m',
  },
  weight: {
    title: 'Peso',
    subtitle: 'Atualize seu peso corporal',
    placeholder: 'Ex: 78',
    icon: 'weight-kilogram',
    gradient: ['#fda4af', '#e11d48', '#be123c'],
    keyboardType: 'decimal-pad',
    suffix: ' kg',
  },
  gender: {
    title: 'Gênero',
    subtitle: 'Escolha a opção que melhor te representa',
    placeholder: '',
    icon: 'gender-transgender',
    gradient: ['#c4b5fd', '#7c3aed', '#5b21b6'],
    keyboardType: 'default',
    suffix: '',
  },
}

function getDraftValue(field: EditableProfileFieldId, profile: ProfileSnapshot) {
  if (field === 'height') return profile.height.replace(/\s*m$/i, '').trim()
  if (field === 'weight') return profile.weight.replace(/\s*kg$/i, '').trim()
  return profile.gender
}

function formatSavedValue(field: EditableProfileFieldId, raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  if (field === 'gender') return trimmed

  const config = FIELD_CONFIG[field]
  return `${trimmed}${config.suffix}`
}

export function ProfileFieldEditDrawer({
  visible,
  field,
  profile,
  onClose,
  onSave,
}: ProfileFieldEditDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [draft, setDraft] = useState('')
  const [keyboardInset, setKeyboardInset] = useState(0)

  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const scrollRef = useRef<ScrollView>(null)

  const config = field ? FIELD_CONFIG[field] : null

  useEffect(() => {
    if (!visible) {
      setKeyboardInset(0)
      return
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    function handleKeyboardShow(event: KeyboardEvent) {
      setKeyboardInset(event.endCoordinates.height)
    }

    function handleKeyboardHide() {
      setKeyboardInset(0)
    }

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow)
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide)

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [visible])

  useEffect(() => {
    if (visible && field) {
      setDraft(getDraftValue(field, profile))
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
      return
    }

    if (isMounted) {
      closeSheet(onClose)
    }
  }, [visible, field])

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
    Keyboard.dismiss()
    closeSheet(onClose)
  }

  function handleSave() {
    if (!field) return
    const nextValue = formatSavedValue(field, draft)
    if (!nextValue) return

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onSave(field, nextValue)
    handleDismiss()
  }

  const canSave = draft.trim().length > 0
  const keyboardLift =
    keyboardInset > 0
      ? Math.max(0, keyboardInset - Math.max(insets.bottom, 0) + KEYBOARD_EXTRA_PADDING)
      : 0

  if (!isMounted || !config || !field) return null

  return (
    <AppModal visible transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={keyboardAvoidingBehavior}
          style={styles.keyboardWrap}
          enabled={Platform.OS === 'ios'}
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: getModalFooterPadding(insets.bottom, 8),
                transform: [
                  { translateY: sheetTranslateY },
                  { translateY: -keyboardLift },
                ],
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
              colors={[...config.gradient]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.topAccent}
            />

            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              contentContainerStyle={[
                styles.scrollContent,
                keyboardInset > 0 && { paddingBottom: KEYBOARD_EXTRA_PADDING },
              ]}
              bounces={keyboardInset === 0}
            >
              <View style={styles.handle} />

              <View style={[styles.headerRow, keyboardInset > 0 && styles.headerRowCompact]}>
                <LinearGradient
                  colors={[...config.gradient]}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={styles.fieldIconOrb}
                >
                  <MaterialCommunityIcons name={config.icon} size={22} color="#fff" />
                </LinearGradient>

                <View style={styles.headerTextCol}>
                  <WaveTitle text={config.title} active={visible} />
                  <Text style={styles.subtitle}>{config.subtitle}</Text>
                </View>

                <Pressable
                  onPress={handleDismiss}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar edição"
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </Pressable>
              </View>

              {field === 'gender' ? (
                <View style={styles.genderGrid}>
                  {GENDER_OPTIONS.map((option) => {
                    const active = draft === option
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setDraft(option)}
                        style={({ pressed }) => [
                          styles.genderChip,
                          active && styles.genderChipActive,
                          pressed && styles.genderChipPressed,
                        ]}
                      >
                        <Text style={[styles.genderChipText, active && styles.genderChipTextActive]}>
                          {option}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              ) : (
                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>
                    {field === 'height' ? 'Metros' : 'Quilogramas'}
                  </Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      value={draft}
                      onChangeText={setDraft}
                      placeholder={config.placeholder}
                      placeholderTextColor={colors.textSubtle}
                      keyboardType={config.keyboardType}
                      style={styles.input}
                      autoFocus
                      selectionColor={colors.primary}
                      onFocus={() => {
                        requestAnimationFrame(() => {
                          scrollRef.current?.scrollToEnd({ animated: true })
                        })
                      }}
                    />
                    <Text style={styles.inputSuffix}>
                      {field === 'height' ? 'm' : 'kg'}
                    </Text>
                  </View>
                </View>
              )}

              {keyboardInset === 0 ? (
                <Text style={styles.hint}>Segure o card na tela anterior para editar novamente</Text>
              ) : null}

              <PrimaryButton
                label="Salvar alteração"
                onPress={handleSave}
                disabled={!canSave}
              />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
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
  keyboardWrap: {
    flex: 1,
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
    maxHeight: '92%',
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 18,
  },
  headerRowCompact: {
    marginBottom: 12,
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
  inputCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    paddingVertical: 10,
  },
  inputSuffix: {
    color: colors.primaryLight,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  genderChip: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  genderChipActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.18)',
    borderColor: 'rgba(255, 133, 51, 0.55)',
  },
  genderChipPressed: {
    opacity: 0.86,
  },
  genderChipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  genderChipTextActive: {
    color: colors.primaryLight,
  },
  hint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 14,
  },
})
