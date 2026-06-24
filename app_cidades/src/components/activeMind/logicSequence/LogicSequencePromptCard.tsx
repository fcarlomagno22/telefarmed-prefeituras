import { useThemedStyles } from '../../../hooks/useThemedStyles'
import type { ThemeColors } from '../../../theme/palettes'
import { StyleSheet, Text, View } from 'react-native'
import { getLogicSequenceTypeLabel } from '../../../data/logicSequencePuzzles'
import type { LogicSequenceItemType } from '../../../types/logicSequence'

type LogicSequencePromptCardProps = {
  enunciado: string
  tipo: LogicSequenceItemType
}

export function LogicSequencePromptCard({ enunciado, tipo }: LogicSequencePromptCardProps) {
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{getLogicSequenceTypeLabel(tipo)}</Text>
      <Text style={styles.enunciado}>{enunciado}</Text>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: 8,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 18,
      alignItems: 'center',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.28)',
    },
    label: {
      color: '#c4b5fd',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    enunciado: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 20,
      textAlign: 'center',
    },
  })
}
