import { StyleSheet, Text, View } from 'react-native'
import type { MentalHealthCheckInEntry } from '../../types/mentalHealth'
import { colors } from '../../theme/colors'
import {
  formatMentalHealthCheckInTime,
  formatMentalHealthEmotions,
  formatMentalHealthMoodDisplay,
} from '../../utils/mentalHealthCheckIn'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type MentalHealthCheckInRecordDrawerProps = {
  visible: boolean
  entry: MentalHealthCheckInEntry | null
  onClose: () => void
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

export function MentalHealthCheckInRecordDrawer({
  visible,
  entry,
  onClose,
}: MentalHealthCheckInRecordDrawerProps) {
  if (!entry) return null

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Meu registro"
      subtitle={`Registrado às ${formatMentalHealthCheckInTime(entry.recordedAt)}`}
      onClose={onClose}
    >
      <DetailLine label="Humor" value={formatMentalHealthMoodDisplay(entry.mood)} />
      <DetailLine label="Emoções" value={formatMentalHealthEmotions(entry.emotions)} />
      <DetailLine label="Principal influência" value={entry.mainInfluence ?? '—'} />
      <DetailLine
        label="Tipo de registro"
        value={entry.isQuickEntry ? 'Registro rápido' : 'Check-in completo'}
      />

      <Text style={styles.note}>
        Cada atualização cria um novo registro no mesmo dia. Registros anteriores permanecem
        salvos.
      </Text>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  line: {
    gap: 4,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  label: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  note: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    paddingTop: 12,
  },
})
