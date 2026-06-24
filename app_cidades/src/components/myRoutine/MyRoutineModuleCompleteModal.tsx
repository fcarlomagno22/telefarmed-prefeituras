import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppModal } from '../AppModal'
import type { MyRoutineModuleCompletionPrompt } from '../../hooks/useMyRoutineModuleReturn'
import { LINKED_MODULE_LABELS } from '../../utils/myRoutineTodayHelpers'
import { PrimaryButton } from '../PrimaryButton'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

type MyRoutineModuleCompleteModalProps = {
  visible: boolean
  prompt: MyRoutineModuleCompletionPrompt | null
  onConfirm: () => void
  onDismiss: () => void
}

export function MyRoutineModuleCompleteModal({
  visible,
  prompt,
  onConfirm,
  onDismiss,
}: MyRoutineModuleCompleteModalProps) {
  const styles = useThemedStyles(createStyles)
  if (!prompt) return null

  const moduleLabel = prompt.linkedModule ? LINKED_MODULE_LABELS[prompt.linkedModule] : 'Telefarmed'

  return (
    <AppModal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="heart-outline" size={22} color="#f0abfc" />
          </View>
          <Text style={styles.title}>Bom retorno!</Text>
          <Text style={styles.body}>
            Você voltou de {moduleLabel}. Quer marcar{' '}
            <Text style={styles.taskTitle}>«{prompt.taskTitle}»</Text> como feito?
          </Text>
          <Text style={styles.hint}>Sem pressa — só se fizer sentido para você agora.</Text>
          <PrimaryButton label="Marcar como feito" onPress={onConfirm} style={styles.primaryBtn} />
          <Pressable onPress={onDismiss} style={styles.secondaryWrap}>
            <Text style={styles.secondaryText}>Ainda não / deixa para depois</Text>
            </Pressable>
            </View>
            </View>
            </AppModal>)
}

function createStyles(colors: ThemeColors) {
  return {
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 18,
    padding: 18,
    gap: 10,
    backgroundColor: 'rgba(22, 16, 28, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.22)',
  },
  iconWrap: {
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217, 70, 239, 0.14)',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
  taskTitle: {
    color: '#f0abfc',
    fontWeight: '800',
  },
  hint: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
  },
  primaryBtn: { marginTop: 4 },
  secondaryWrap: { alignSelf: 'center', paddingVertical: 8 },
  secondaryText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
}
}

