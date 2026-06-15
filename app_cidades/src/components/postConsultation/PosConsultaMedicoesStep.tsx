import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { POS_CONSULTA_PLAN_TOTAL_DAYS } from '../../config/posConsulta'
import { colors } from '../../theme/colors'
import {
  PosConsultaCheckinRespostas,
  PosConsultaMeasurementId,
  PosConsultaVitalField,
} from '../../types/posConsulta'
import { PosConsultaStepActions } from './PosConsultaStepActions'

type PosConsultaMedicoesStepProps = {
  respostas: PosConsultaCheckinRespostas
  requestedMeasurements: PosConsultaMeasurementId[]
  onChange: (respostas: PosConsultaCheckinRespostas) => void
  onBack: () => void
  onContinue: () => void
}

function parseNumericInput(value: string): number | null {
  const normalized = value.replace(',', '.').trim()
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function VitalInput({
  label,
  value,
  onChange,
  placeholder,
  unit,
}: {
  label: string
  value: PosConsultaVitalField<number>
  onChange: (next: PosConsultaVitalField<number>) => void
  placeholder: string
  unit: string
}) {
  return (
    <View style={styles.vitalBlock}>
      <View style={styles.vitalHeader}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          onPress={() =>
            onChange({
              notMeasured: !value.notMeasured,
              value: !value.notMeasured ? null : value.value,
            })
          }
          style={({ pressed }) => [
            styles.notMeasuredButton,
            value.notMeasured && styles.notMeasuredButtonActive,
            pressed && styles.optionPressed,
          ]}
        >
          <Text
            style={[
              styles.notMeasuredText,
              value.notMeasured && styles.notMeasuredTextActive,
            ]}
          >
            Não medi
          </Text>
        </Pressable>
      </View>

      <View style={styles.inputWrap}>
        <TextInput
          value={value.notMeasured ? '' : value.value?.toString() ?? ''}
          onChangeText={(text) =>
            onChange({ notMeasured: false, value: parseNumericInput(text) })
          }
          editable={!value.notMeasured}
          keyboardType="decimal-pad"
          placeholder={value.notMeasured ? 'Não informado' : placeholder}
          placeholderTextColor={colors.textSubtle}
          style={[styles.input, value.notMeasured && styles.inputDisabled]}
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  )
}

function isBloodPressureComplete(respostas: PosConsultaCheckinRespostas) {
  const sys = respostas.bloodPressureSystolic
  const dia = respostas.bloodPressureDiastolic
  return (
    (sys.notMeasured || sys.value !== null) && (dia.notMeasured || dia.value !== null)
  )
}

function isGlucoseComplete(respostas: PosConsultaCheckinRespostas) {
  const glucose = respostas.bloodGlucose
  return glucose.notMeasured || glucose.value !== null
}

export function PosConsultaMedicoesStep({
  respostas,
  requestedMeasurements,
  onChange,
  onBack,
  onContinue,
}: PosConsultaMedicoesStepProps) {
  const showBloodPressure = requestedMeasurements.includes('blood_pressure')
  const showGlucose = requestedMeasurements.includes('blood_glucose')

  const canContinue =
    (!showBloodPressure || isBloodPressureComplete(respostas)) &&
    (!showGlucose || isGlucoseComplete(respostas))

  if (!showBloodPressure && !showGlucose) {
    return (
      <View>
        <Text style={styles.title}>Medições</Text>
        <Text style={styles.subtitle}>
          Nenhuma medição foi solicitada neste check-in. Continue para as perguntas de
          segurança.
        </Text>
        <PosConsultaStepActions onBack={onBack} onContinue={onContinue} />
      </View>
    )
  }

  return (
    <View>
      <Text style={styles.title}>Suas medições</Text>
      <Text style={styles.subtitle}>
        Informe os valores mais recentes, se tiver. Se não mediu, use &quot;Não medi&quot;.
      </Text>

      {showBloodPressure ? (
        <View style={styles.groupCard}>
          <Text style={styles.groupTitle}>Pressão arterial</Text>
          <VitalInput
            label="Sistólica"
            value={respostas.bloodPressureSystolic}
            onChange={(bloodPressureSystolic) =>
              onChange({ ...respostas, bloodPressureSystolic })
            }
            placeholder="Ex.: 120"
            unit="mmHg"
          />
          <VitalInput
            label="Diastólica"
            value={respostas.bloodPressureDiastolic}
            onChange={(bloodPressureDiastolic) =>
              onChange({ ...respostas, bloodPressureDiastolic })
            }
            placeholder="Ex.: 80"
            unit="mmHg"
          />
        </View>
      ) : null}

      {showGlucose ? (
        <View style={styles.groupCard}>
          <VitalInput
            label="Glicemia"
            value={respostas.bloodGlucose}
            onChange={(bloodGlucose) => onChange({ ...respostas, bloodGlucose })}
            placeholder="Ex.: 110"
            unit="mg/dL"
          />
        </View>
      ) : null}

      <Text style={styles.hint}>
        Estas informações complementam o acompanhamento pós-consulta de{' '}
        {POS_CONSULTA_PLAN_TOTAL_DAYS} dias.
      </Text>

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
  groupCard: {
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: 10,
  },
  groupTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  vitalBlock: {
    gap: 8,
  },
  vitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  notMeasuredButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  notMeasuredButtonActive: {
    borderColor: 'rgba(14, 165, 233, 0.45)',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
  },
  notMeasuredText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  notMeasuredTextActive: {
    color: '#7dd3fc',
  },
  inputWrap: {
    position: 'relative',
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingRight: 56,
  },
  inputDisabled: {
    opacity: 0.55,
  },
  unit: {
    position: 'absolute',
    right: 14,
    top: 15,
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  optionPressed: {
    opacity: 0.88,
  },
})
