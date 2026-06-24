import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { colors } from '../../theme/colors'
import { PrimaryButton } from '../PrimaryButton'
import { ScheduleStepTitle } from './ScheduleStepTitle'

type ScheduleRemoteCareRequestStepProps = {
  onBack?: () => void
  isSubmitting?: boolean
  onSubmit: (payload: { reason: string; evidenceUri: string }) => void
}

const REASON_OPTIONS = [
  'Estou acamado(a) ou com mobilidade muito reduzida',
  'Uso cadeira de rodas e não consigo me deslocar até o posto',
  'Tenho dificuldade para caminhar até a unidade de saúde',
  'Estou temporariamente impossibilitado(a) de sair de casa',
]

export function ScheduleRemoteCareRequestStep({
  onBack,
  isSubmitting = false,
  onSubmit,
}: ScheduleRemoteCareRequestStepProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [evidenceUri, setEvidenceUri] = useState<string | null>(null)

  const canSubmit = Boolean(selectedReason) && Boolean(evidenceUri) && !isSubmitting

  async function pickEvidence(source: 'camera' | 'gallery') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        source === 'camera'
          ? 'Precisamos da câmera para registrar a foto de evidência.'
          : 'Precisamos acessar sua galeria para anexar a evidência.',
      )
      return
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.85,
          })

    if (result.canceled || !result.assets[0]?.uri) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setEvidenceUri(result.assets[0].uri)
  }

  function selectReason(reason: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedReason(reason)
  }

  function handleSubmit() {
    if (!canSubmit || !evidenceUri || !selectedReason) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onSubmit({ reason: selectedReason, evidenceUri })
  }

  return (
    <View style={styles.wrap}>
      <ScheduleStepTitle title="Solicitar atendimento pelo celular" onBack={onBack} />

      <Text style={styles.subtleNote}>
        Esse benefício é destinado a quem está acamado(a) ou com dificuldade real de locomoção. A
        aprovação depende da análise da equipe de saúde.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>Por que você não pode ir ao posto?</Text>

        <View style={styles.options}>
          {REASON_OPTIONS.map((option) => {
            const selected = selectedReason === option

            return (
              <Pressable
                key={option}
                onPress={() => selectReason(option)}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={option}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {option}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primaryLight} />
                ) : null}
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Foto de evidência</Text>
        <Text style={styles.fieldHint}>
          Anexe uma imagem que mostre sua condição de mobilidade reduzida — por exemplo, cama,
          cadeira de rodas ou ambiente em que você permanece.
        </Text>

        {evidenceUri ? (
          <View style={styles.evidencePreviewWrap}>
            <Image source={{ uri: evidenceUri }} style={styles.evidencePreview} contentFit="cover" />
            <Pressable
              onPress={() => setEvidenceUri(null)}
              style={({ pressed }) => [styles.evidenceRemoveBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Remover foto"
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.evidenceActions}>
            <Pressable
              onPress={() => void pickEvidence('gallery')}
              style={({ pressed }) => [styles.evidenceBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Escolher da galeria"
            >
              <Ionicons name="images-outline" size={20} color={colors.primaryLight} />
              <Text style={styles.evidenceBtnText}>Galeria</Text>
            </Pressable>

            <Pressable
              onPress={() => void pickEvidence('camera')}
              style={({ pressed }) => [styles.evidenceBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Tirar foto"
            >
              <Ionicons name="camera-outline" size={20} color={colors.primaryLight} />
              <Text style={styles.evidenceBtnText}>Câmera</Text>
            </Pressable>
          </View>
        )}
      </View>

      <PrimaryButton
        label={isSubmitting ? 'Enviando solicitação…' : 'Enviar solicitação'}
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={!canSubmit}
        style={styles.submitBtn}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  subtleNote: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  options: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(14, 14, 20, 0.75)',
  },
  optionSelected: {
    borderColor: 'rgba(255, 133, 51, 0.55)',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  optionText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  optionTextSelected: {
    color: colors.text,
  },
  fieldHint: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  evidenceActions: {
    flexDirection: 'row',
    gap: 10,
  },
  evidenceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
    borderStyle: 'dashed',
  },
  evidenceBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  evidencePreviewWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    aspectRatio: 4 / 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  evidencePreview: {
    width: '100%',
    height: '100%',
  },
  evidenceRemoveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  submitBtn: {
    marginTop: 4,
  },
  pressed: {
    opacity: 0.82,
  },
})
