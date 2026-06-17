import { StyleSheet, Text, View } from 'react-native'
import type { BalanceScoreBreakdown } from '../../types/eatWell'
import { colors } from '../../theme/colors'
import { getBalanceTier } from '../../utils/eatWellNutritionStats'
import { RunWalkHistoryAnimatedBar } from '../runWalk/history/RunWalkHistoryAnimatedBar'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type ScoreRowProps = {
  label: string
  score: number
  weight: string
  color: string
}

function ScoreRow({ label, score, weight, color }: ScoreRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowMeta}>
          {score}/100 · peso {weight}
        </Text>
      </View>
      <RunWalkHistoryAnimatedBar progress={score / 100} animate color={color} />
    </View>
  )
}

type EatWellBalanceExplainDrawerProps = {
  visible: boolean
  balance: BalanceScoreBreakdown
  onClose: () => void
}

export function EatWellBalanceExplainDrawer({
  visible,
  balance,
  onClose,
}: EatWellBalanceExplainDrawerProps) {
  const tier = getBalanceTier(balance.score)

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Score de equilíbrio"
      subtitle={`${balance.score} · ${tier.label}`}
      onClose={onClose}
    >
      <Text style={styles.intro}>
        Seu equilíbrio considera calorias, distribuição de macros, fibras, açúcares, gordura
        saturada e hidratação — não apenas o total calórico.
      </Text>

      <ScoreRow label="Calorias" score={balance.caloriesScore} weight="25%" color="#fbbf24" />
      <ScoreRow label="Macros P/C/G" score={balance.macroScore} weight="25%" color="#60a5fa" />
      <ScoreRow label="Fibras" score={balance.fiberScore} weight="15%" color="#34d399" />
      <ScoreRow label="Açúcares" score={balance.sugarsScore} weight="15%" color="#fb923c" />
      <ScoreRow
        label="Gordura saturada"
        score={balance.saturatedFatScore}
        weight="10%"
        color="#f87171"
      />
      <ScoreRow label="Água" score={balance.waterScore} weight="10%" color="#22d3ee" />
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  intro: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 8,
  },
  row: {
    gap: 6,
    marginBottom: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  rowMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
})
