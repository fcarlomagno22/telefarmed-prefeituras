import { StyleSheet, Text, View } from 'react-native'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { PrimaryButton } from '../PrimaryButton'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

type MyRoutineDayDisruptionDrawerProps = {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
}

export function MyRoutineDayDisruptionDrawer({
  visible,
  onClose,
  onConfirm,
}: MyRoutineDayDisruptionDrawerProps) {
  const styles = useThemedStyles(createStyles)
  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Imprevisto no dia"
      subtitle="Modo dia leve"
      onClose={onClose}
      footer={
        <PrimaryButton
          label="Simplificar para essenciais"
          onPress={() => {
            onConfirm()
            onClose()
          }}
          style={styles.footerBtn}
        />
      }
    >
      <View style={styles.content}>
        <Text style={styles.body}>
          Quando o dia foge do plano, você pode manter só os hábitos essenciais. Desejáveis e bônus
          ficam de lado até amanhã — sem culpa.
        </Text>
        <View style={styles.note}>
          <Text style={styles.noteText}>
            Você pode voltar ao plano completo editando tarefas ou na revisão semanal.
            </Text>
            </View>
            </View>
      </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 12 },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  note: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(217, 70, 239, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.2)',
  },
  noteText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  footerBtn: { marginTop: 0 },
}
}

