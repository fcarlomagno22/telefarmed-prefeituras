import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { PrimaryButton } from '../PrimaryButton'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

const ACCENT_LIGHT = '#f0abfc'

type MyRoutineMinimalRoutineExplainDrawerProps = {
  visible: boolean
  onClose: () => void
}

export function MyRoutineMinimalRoutineExplainDrawer({
  visible,
  onClose,
}: MyRoutineMinimalRoutineExplainDrawerProps) {
  const styles = useThemedStyles(createStyles)
  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Rotina mínima"
      subtitle="O essencial primeiro"
      onClose={onClose}
      footer={<PrimaryButton label="Entendi" onPress={onClose} style={styles.footerBtn} />}
    >
      <View style={styles.content}>
        <View style={styles.card}>
          <Ionicons name="shield-checkmark-outline" size={22} color={ACCENT_LIGHT} />
          <Text style={styles.cardTitle}>Essencial, desejável e bônus</Text>
          <Text style={styles.cardBody}>
            A barra mede só os hábitos essenciais do dia. Desejáveis e bônus são extras — não entram
            na consistência.
          </Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="heart-outline" size={22} color={ACCENT_LIGHT} />
          <Text style={styles.cardTitle}>Sem culpa por pular</Text>
          <Text style={styles.cardBody}>
            Pular ou simplificar não zera seu progresso emocional. O app existe para ajudar, não
            cobrar perfeição.
          </Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="calendar-outline" size={22} color={ACCENT_LIGHT} />
          <Text style={styles.cardTitle}>Revisão semanal</Text>
          <Text style={styles.cardBody}>
            Se a rotina mínima estiver pesada por alguns dias, a revisão semanal ajuda a ajustar o
            plano automaticamente.
          </Text>
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 10 },
  card: {
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 70, 239, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.22)',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  cardBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  footerBtn: { marginTop: 0 },
}
}

