import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { POS_CONSULTA_PLAN_TOTAL_DAYS } from '../../config/posConsulta'
import { colors } from '../../theme/colors'
import {
  PosConsultaCheckinRespostas,
  PosConsultaEvolucaoComparacao,
} from '../../types/posConsulta'
import { PosConsultaStepActions } from './PosConsultaStepActions'

type PosConsultaSintomasStepProps = {
  respostas: PosConsultaCheckinRespostas
  onChange: (respostas: PosConsultaCheckinRespostas) => void
  onContinue: () => void
}

const COMPARACAO_OPTIONS: {
  id: PosConsultaEvolucaoComparacao
  label: string
  icon: keyof typeof Ionicons.glyphMap
  selectedColors: { border: string; background: string; text: string }
}[] = [
  {
    id: 'melhorou',
    label: 'Melhorou',
    icon: 'trending-up',
    selectedColors: {
      border: 'rgba(16, 185, 129, 0.55)',
      background: 'rgba(16, 185, 129, 0.14)',
      text: '#6ee7b7',
    },
  },
  {
    id: 'igual',
    label: 'Igual',
    icon: 'remove',
    selectedColors: {
      border: 'rgba(14, 165, 233, 0.55)',
      background: 'rgba(14, 165, 233, 0.14)',
      text: '#7dd3fc',
    },
  },
  {
    id: 'piorou',
    label: 'Piorou',
    icon: 'trending-down',
    selectedColors: {
      border: 'rgba(244, 63, 94, 0.55)',
      background: 'rgba(244, 63, 94, 0.14)',
      text: '#fda4af',
    },
  },
]

const INTENSITY_LOW = [0, 1, 2, 3, 4, 5]
const INTENSITY_HIGH = [6, 7, 8, 9, 10]

function IntensityChip({
  value,
  selected,
  onPress,
}: {
  value: number
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.intensityChip,
        selected && styles.intensityChipSelected,
        pressed && styles.optionPressed,
      ]}
    >
      <Text
        style={[
          styles.intensityChipText,
          selected && styles.intensityChipTextSelected,
        ]}
      >
        {value}
      </Text>
    </Pressable>
  )
}

export function PosConsultaSintomasStep({
  respostas,
  onChange,
  onContinue,
}: PosConsultaSintomasStepProps) {
  const canContinue =
    respostas.evolucaoComparacao !== null && respostas.intensidadeSintoma !== null

  return (
    <View>
      <Text style={styles.title}>Como você está comparado à consulta?</Text>
      <Text style={styles.subtitle}>
        Suas respostas ajudam a equipe de saúde a acompanhar sua evolução nos próximos{' '}
        {POS_CONSULTA_PLAN_TOTAL_DAYS} dias.
      </Text>

      <Text style={styles.sectionLabel}>Situação geral</Text>
      <View style={styles.comparacaoRow}>
        {COMPARACAO_OPTIONS.map((option) => {
          const selected = respostas.evolucaoComparacao === option.id

          return (
            <Pressable
              key={option.id}
              onPress={() => onChange({ ...respostas, evolucaoComparacao: option.id })}
              style={({ pressed }) => [
                styles.comparacaoCard,
                selected && {
                  borderColor: option.selectedColors.border,
                  backgroundColor: option.selectedColors.background,
                },
                pressed && styles.optionPressed,
              ]}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={selected ? option.selectedColors.text : colors.textMuted}
              />
              <Text
                style={[
                  styles.comparacaoLabel,
                  selected && { color: option.selectedColors.text },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.intensityHeader}>
        <Text style={styles.sectionLabel}>Intensidade dos sintomas (0 a 10)</Text>
        <Text style={styles.intensityValue}>
          {respostas.intensidadeSintoma ?? '—'}
        </Text>
      </View>

      <View style={styles.intensityRows}>
        <View style={styles.intensityRow}>
          {INTENSITY_LOW.map((value) => (
            <IntensityChip
              key={value}
              value={value}
              selected={respostas.intensidadeSintoma === value}
              onPress={() => onChange({ ...respostas, intensidadeSintoma: value })}
            />
          ))}
        </View>
        <View style={styles.intensityRow}>
          {INTENSITY_HIGH.map((value) => (
            <IntensityChip
              key={value}
              value={value}
              selected={respostas.intensidadeSintoma === value}
              onPress={() => onChange({ ...respostas, intensidadeSintoma: value })}
            />
          ))}
        </View>
      </View>

      <View style={styles.scaleHints}>
        <Text style={styles.hint}>0 — sem incômodo</Text>
        <Text style={styles.hint}>10 — intenso</Text>
      </View>
      <Text style={styles.hintCenter}>
        Use a escala considerando o principal sintoma que motivou sua consulta.
      </Text>

      <PosConsultaStepActions
        onContinue={onContinue}
        continueDisabled={!canContinue}
        fullWidth
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
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
  },
  comparacaoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  comparacaoCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  comparacaoLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  intensityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  intensityValue: {
    color: '#7dd3fc',
    fontSize: 14,
    fontWeight: '800',
  },
  intensityRows: {
    gap: 8,
    marginBottom: 2,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  intensityChip: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityChipSelected: {
    borderColor: 'rgba(14, 165, 233, 0.55)',
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
  },
  intensityChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  intensityChipTextSelected: {
    color: '#7dd3fc',
  },
  scaleHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  hint: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
  },
  hintCenter: {
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  optionPressed: {
    opacity: 0.88,
  },
})
