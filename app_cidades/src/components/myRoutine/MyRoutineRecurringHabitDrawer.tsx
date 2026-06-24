import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useEffect, useState } from 'react'
import type { MyRoutineTask } from '../../types/myRoutine'
import { formatPriorityLabel } from '../../utils/myRoutineTodayHelpers'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'

const ACCENT = '#d946ef'
const PRIORITIES: MyRoutineTask['priority'][] = ['essential', 'desirable', 'bonus']

type MyRoutineRecurringHabitDrawerProps = {
  visible: boolean
  editingTask?: MyRoutineTask | null
  onClose: () => void
  onSave: (title: string, priority: MyRoutineTask['priority']) => void
}

export function MyRoutineRecurringHabitDrawer({
  visible,
  editingTask,
  onClose,
  onSave,
}: MyRoutineRecurringHabitDrawerProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<MyRoutineTask['priority']>('desirable')

  useEffect(() => {
    if (!visible) return
    setTitle(editingTask?.title ?? '')
    setPriority(editingTask?.priority ?? 'desirable')
  }, [editingTask, visible])

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={editingTask ? 'Editar hábito' : 'Novo hábito recorrente'}
      subtitle="Aplica-se aos dias da semana configurados"
      onClose={onClose}
      footer={
        <PrimaryButton
          label={editingTask ? 'Salvar hábito' : 'Adicionar hábito'}
          disabled={!title.trim()}
          onPress={() => {
            onSave(title.trim(), priority)
            onClose()
          }}
          style={styles.footerBtn}
        />
      }
    >
      <View style={styles.content}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ex.: Caminhada, meditação..."
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          selectionColor={ACCENT}
        />
        <Text style={styles.label}>Prioridade padrão</Text>
        <View style={styles.chips}>
          {PRIORITIES.map((item) => {
            const selected = priority === item
            return (
              <Pressable
                key={item}
                onPress={() => setPriority(item)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {formatPriorityLabel(item)}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 12 },
  input: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipSelected: {
    backgroundColor: 'rgba(217, 70, 239, 0.12)',
    borderColor: 'rgba(240, 171, 252, 0.35)',
  },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextSelected: { color: '#f0abfc', fontWeight: '700' },
  footerBtn: { marginTop: 0 },
}
}

