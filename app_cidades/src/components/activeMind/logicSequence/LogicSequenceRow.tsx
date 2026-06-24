import { useThemedStyles } from '../../../hooks/useThemedStyles'
import type { ThemeColors } from '../../../theme/palettes'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { normalizeLogicSequenceItem } from '../../../data/logicSequencePuzzles'
import type { LogicSequenceItem, LogicSequenceItemType } from '../../../types/logicSequence'

type LogicSequenceRowProps = {
  sequencia: LogicSequenceItem[]
  tipo: LogicSequenceItemType
  feedbackActive: boolean
  feedbackKind: 'correct' | 'wrong' | null
  selectedOption: LogicSequenceItem | null
}

function getItemFontSize(tipo: LogicSequenceItemType): number {
  if (tipo === 'numero') return 22
  return 26
}

function SequenceToken({
  label,
  tipo,
  variant,
}: {
  label: string
  tipo: LogicSequenceItemType
  variant: 'item' | 'missing' | 'selected'
}) {
  const styles = useThemedStyles(createStyles)
  const fontSize = getItemFontSize(tipo)

  return (
    <View
      style={[
        styles.token,
        variant === 'missing' && styles.tokenMissing,
        variant === 'selected' && styles.tokenSelected,
        variant === 'item' && styles.tokenItem,
      ]}
    >
      <Text
        style={[
          styles.tokenLabel,
          { fontSize },
          variant === 'missing' && styles.tokenLabelMissing,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {label}
      </Text>
    </View>
  )
}

export function LogicSequenceRow({
  sequencia,
  tipo,
  feedbackActive,
  feedbackKind,
  selectedOption,
}: LogicSequenceRowProps) {
  const styles = useThemedStyles(createStyles)
  const missingLabel =
    selectedOption != null ? normalizeLogicSequenceItem(selectedOption) : '?'

  return (
    <View
      style={[
        styles.card,
        feedbackActive && feedbackKind === 'correct' && styles.cardCorrect,
        feedbackActive && feedbackKind === 'wrong' && styles.cardWrong,
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        centerContent
      >
        {sequencia.map((item, index) => (
          <SequenceToken
            key={`${normalizeLogicSequenceItem(item)}-${index}`}
            label={normalizeLogicSequenceItem(item)}
            tipo={tipo}
            variant="item"
          />
        ))}

        <Text style={styles.separator}>→</Text>

        <SequenceToken
          label={missingLabel}
          tipo={tipo}
          variant={selectedOption != null ? 'selected' : 'missing'}
        />
      </ScrollView>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  card: {
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.22)',
  },
  cardCorrect: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderColor: 'rgba(74, 222, 128, 0.45)',
  },
  cardWrong: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.45)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    minWidth: '100%',
    justifyContent: 'center',
  },
  separator: {
    color: '#c4b5fd',
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
  token: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tokenItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  tokenMissing: {
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  tokenSelected: {
    borderStyle: 'solid',
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderColor: 'rgba(139, 92, 246, 0.42)',
  },
  tokenLabel: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: -0.3,
    includeFontPadding: false,
    textAlign: 'center',
  },
  tokenLabelMissing: {
    color: colors.textSubtle,
  },
  })
}
