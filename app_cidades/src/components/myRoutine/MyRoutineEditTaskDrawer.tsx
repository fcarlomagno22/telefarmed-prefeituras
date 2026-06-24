import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useEffect, useState } from 'react'
import type { MyRoutineTask, MyRoutineTaskPriority, MyRoutineTimeBlock } from '../../types/myRoutine'
import { MY_ROUTINE_BLOCK_LABELS, MY_ROUTINE_BLOCK_ORDER } from '../../utils/myRoutineTodayHelpers'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { PrimaryButton } from '../PrimaryButton'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'

const ACCENT = '#d946ef'
const ACCENT_LIGHT = '#f0abfc'
const PRIORITIES: MyRoutineTaskPriority[] = ['essential', 'desirable', 'bonus']

type MyRoutineEditTaskDrawerProps = {
  visible: boolean
  task: MyRoutineTask | null
  onClose: () => void
  onConfirm: (patch: Partial<MyRoutineTask>) => void
}

export function MyRoutineEditTaskDrawer({
  visible,
  task,
  onClose,
  onConfirm,
}: MyRoutineEditTaskDrawerProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<MyRoutineTaskPriority>('desirable')
  const [block, setBlock] = useState<MyRoutineTimeBlock>('anytime')
  const [time, setTime] = useState('')

  useEffect(() => {
    if (!visible || !task) return
    setTitle(task.title)
    setPriority(task.priority)
    setBlock(task.block)
    setTime(task.time ?? task.windowStart ?? '')
  }, [task, visible])

  if (!task) return null

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Editar tarefa"
      subtitle="Só para hoje"
      onClose={onClose}
      footer={
        <PrimaryButton
          label="Salvar"
          disabled={!title.trim()}
          onPress={() => {
            onConfirm({
              title: title.trim(),
              priority,
              block,
              scheduleType: time.trim() ? 'fixed' : task.scheduleType,
              time: time.trim() || null,
            })
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
          placeholder="Título"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          selectionColor={ACCENT}
        />

        <Text style={styles.label}>Prioridade</Text>
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
                  {item === 'essential' ? 'Essencial' : item === 'desirable' ? 'Desejável' : 'Bônus'}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <Text style={styles.label}>Parte do dia</Text>
        <View style={styles.chips}>
          {MY_ROUTINE_BLOCK_ORDER.map((item) => {
            const selected = block === item
            return (
              <Pressable
                key={item}
                onPress={() => setBlock(item)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {MY_ROUTINE_BLOCK_LABELS[item]}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <Text style={styles.label}>Horário (opcional, HH:MM)</Text>
        <TextInput
          value={time}
          onChangeText={setTime}
          placeholder="Ex.: 08:30"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          selectionColor={ACCENT}
        />
      </View>
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 10 },
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
    marginTop: 4,
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
  chipTextSelected: { color: ACCENT_LIGHT, fontWeight: '700' },
  footerBtn: { marginTop: 0 },
}
}

