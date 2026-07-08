import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import { colors } from '../../theme/colors'
import { parseHeightMeters, parseWeightKg } from '../../utils/bmi'
import { isValidBirthDate, maskBirthDate } from '../../utils/birthDate'
import { maskHeightMetersInput, maskWeightKgInput } from '../../utils/eatWellMenuWizard'
import type { ProfileSnapshot } from '../../types/metrics'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type MetricsProfileOnboardingDrawerProps = {
  visible: boolean
  profile: ProfileSnapshot
  onComplete: (height: string, weight: string, birthDate: string) => void
}

function formatHeightValue(raw: string) {
  const trimmed = raw.trim()
  return trimmed ? `${trimmed} m` : ''
}

function formatWeightValue(raw: string) {
  const trimmed = raw.trim()
  return trimmed ? `${trimmed} kg` : ''
}

export function MetricsProfileOnboardingDrawer({
  visible,
  profile,
  onComplete,
}: MetricsProfileOnboardingDrawerProps) {
  const [heightDraft, setHeightDraft] = useState('')
  const [weightDraft, setWeightDraft] = useState('')
  const [birthDateDraft, setBirthDateDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setHeightDraft(profile.height.replace(/\s*m$/i, '').trim())
    setWeightDraft(profile.weight.replace(/\s*kg$/i, '').trim())
    setBirthDateDraft(profile.birthDate.trim())
    setError(null)
  }, [visible, profile])

  useAndroidBackHandler(() => visible)

  const heightValid = parseHeightMeters(formatHeightValue(heightDraft)) !== null
  const weightValid = parseWeightKg(formatWeightValue(weightDraft)) !== null
  const birthDateValid = isValidBirthDate(birthDateDraft)
  const canSave = heightValid && weightValid && birthDateValid

  function handleSave() {
    if (!canSave) {
      setError('Informe altura, peso e data de nascimento válidos para continuar.')
      return
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onComplete(
      formatHeightValue(heightDraft),
      formatWeightValue(weightDraft),
      birthDateDraft.trim(),
    )
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Seus dados básicos"
      subtitle="Para calcular o IMC e acompanhar sua evolução, precisamos da sua altura, peso e data de nascimento."
      onClose={() => {}}
      hideCloseButton
      scrollable={false}
      keyboardAware
      minHeight={320}
      footer={
        <PrimaryButton
          label="Salvar e continuar"
          onPress={handleSave}
          disabled={!canSave}
        />
      }
    >
      <View style={styles.form}>
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={[styles.fieldIconOrb, styles.heightOrb]}>
              <MaterialCommunityIcons name="human-male-height-variant" size={20} color="#fff" />
            </View>
            <Text style={styles.inputLabel}>Altura</Text>
          </View>
          <View style={styles.inputWrap}>
            <TextInput
              value={heightDraft}
              onChangeText={(raw) => {
                setError(null)
                setHeightDraft(maskHeightMetersInput(raw))
              }}
              placeholder="Ex: 1,72"
              placeholderTextColor={colors.textSubtle}
              keyboardType="decimal-pad"
              style={styles.input}
              autoFocus={visible}
              selectionColor={colors.primary}
            />
            <Text style={styles.inputSuffix}>m</Text>
          </View>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={[styles.fieldIconOrb, styles.weightOrb]}>
              <MaterialCommunityIcons name="weight-kilogram" size={20} color="#fff" />
            </View>
            <Text style={styles.inputLabel}>Peso</Text>
          </View>
          <View style={styles.inputWrap}>
            <TextInput
              value={weightDraft}
              onChangeText={(raw) => {
                setError(null)
                setWeightDraft(maskWeightKgInput(raw))
              }}
              placeholder="Ex: 78"
              placeholderTextColor={colors.textSubtle}
              keyboardType="decimal-pad"
              style={styles.input}
              selectionColor={colors.primary}
            />
            <Text style={styles.inputSuffix}>kg</Text>
          </View>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={[styles.fieldIconOrb, styles.birthDateOrb]}>
              <MaterialCommunityIcons name="cake-variant-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.inputLabel}>Data de nascimento</Text>
          </View>
          <View style={styles.inputWrap}>
            <TextInput
              value={birthDateDraft}
              onChangeText={(raw) => {
                setError(null)
                setBirthDateDraft(maskBirthDate(raw))
              }}
              placeholder="Ex: 15/03/1985"
              placeholderTextColor={colors.textSubtle}
              keyboardType="number-pad"
              style={styles.input}
              selectionColor={colors.primary}
            />
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  inputCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  fieldIconOrb: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heightOrb: {
    backgroundColor: '#0284c7',
  },
  weightOrb: {
    backgroundColor: '#e11d48',
  },
  birthDateOrb: {
    backgroundColor: '#7c3aed',
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
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
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
          borderWidth: 0,
          boxShadow: 'none',
        } as object)
      : null),
  },
  inputSuffix: {
    color: colors.primaryLight,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
})
