import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors } from '../../theme/colors'
import {
  PosConsultaCheckinRespostas,
  PosConsultaMedicacaoAdesao,
} from '../../types/posConsulta'
import { PosConsultaStepActions } from './PosConsultaStepActions'

type PosConsultaMedicacaoStepProps = {
  respostas: PosConsultaCheckinRespostas
  onChange: (respostas: PosConsultaCheckinRespostas) => void
  onBack: () => void
  onContinue: () => void
}

const ADESAO_OPTIONS: {
  id: PosConsultaMedicacaoAdesao
  label: string
  icon: keyof typeof Ionicons.glyphMap
  selectedColors: { border: string; background: string; text: string }
}[] = [
  {
    id: 'sim',
    label: 'Sim, tomei conforme orientado',
    icon: 'checkmark-circle-outline',
    selectedColors: {
      border: 'rgba(16, 185, 129, 0.55)',
      background: 'rgba(16, 185, 129, 0.14)',
      text: '#6ee7b7',
    },
  },
  {
    id: 'parcial',
    label: 'Tomei em parte',
    icon: 'alert-circle-outline',
    selectedColors: {
      border: 'rgba(245, 158, 11, 0.55)',
      background: 'rgba(245, 158, 11, 0.14)',
      text: '#fcd34d',
    },
  },
  {
    id: 'nao',
    label: 'Não tomei',
    icon: 'close-circle-outline',
    selectedColors: {
      border: 'rgba(244, 63, 94, 0.55)',
      background: 'rgba(244, 63, 94, 0.14)',
      text: '#fda4af',
    },
  },
]

export function PosConsultaMedicacaoStep({
  respostas,
  onChange,
  onBack,
  onContinue,
}: PosConsultaMedicacaoStepProps) {
  const needsMotivo =
    respostas.medicacaoAdesao === 'parcial' || respostas.medicacaoAdesao === 'nao'
  const canContinue =
    respostas.medicacaoAdesao !== null &&
    (!needsMotivo || respostas.medicacaoAdesaoMotivo.trim().length >= 3)

  return (
    <View>
      <Text style={styles.title}>Você tomou os medicamentos prescritos?</Text>
      <Text style={styles.subtitle}>
        Inclua remédios receitados na consulta, incluindo uso contínuo orientado pelo médico.
      </Text>

      <View style={styles.options}>
        {ADESAO_OPTIONS.map((option) => {
          const selected = respostas.medicacaoAdesao === option.id

          return (
            <Pressable
              key={option.id}
              onPress={() =>
                onChange({
                  ...respostas,
                  medicacaoAdesao: option.id,
                  medicacaoAdesaoMotivo:
                    option.id === 'sim' ? '' : respostas.medicacaoAdesaoMotivo,
                })
              }
              style={({ pressed }) => [
                styles.optionCard,
                selected && {
                  borderColor: option.selectedColors.border,
                  backgroundColor: option.selectedColors.background,
                },
                pressed && styles.optionPressed,
              ]}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={selected ? option.selectedColors.text : colors.textMuted}
              />
              <Text
                style={[
                  styles.optionLabel,
                  selected && { color: option.selectedColors.text },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {needsMotivo ? (
        <View style={styles.motivoBlock}>
          <Text style={styles.label}>Conte o que aconteceu</Text>
          <TextInput
            value={respostas.medicacaoAdesaoMotivo}
            onChangeText={(medicacaoAdesaoMotivo) =>
              onChange({ ...respostas, medicacaoAdesaoMotivo })
            }
            placeholder="Ex.: esqueci em um dia, efeito colateral..."
            placeholderTextColor={colors.textSubtle}
            multiline
            maxLength={300}
            style={styles.textArea}
          />
        </View>
      ) : null}

      <PosConsultaStepActions
        onBack={onBack}
        onContinue={onContinue}
        continueDisabled={!canContinue}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  options: {
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  optionPressed: {
    opacity: 0.88,
  },
  optionLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  motivoBlock: {
    marginTop: 14,
    gap: 8,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  textArea: {
    minHeight: 92,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
})
