import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useEffect, useState } from 'react'
import { formatSleepTimeMinutes } from '../../utils/sleepLogFormat'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { PrimaryButton } from '../PrimaryButton'
import { Ionicons } from '@expo/vector-icons'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'

const ACCENT = '#d946ef'

type MyRoutineReminderDrawerProps = {
  visible: boolean
  onClose: () => void
  onConfirm: (title: string, time: string | null) => void
}

export function MyRoutineReminderDrawer({
  visible,
  onClose,
  onConfirm,
}: MyRoutineReminderDrawerProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const [title, setTitle] = useState('')
  const [minutes, setMinutes] = useState(12 * 60)
  const [useTime, setUseTime] = useState(true)

  useEffect(() => {
    if (!visible) {
      setTitle('')
      setMinutes(12 * 60)
      setUseTime(true)
    }
  }, [visible])

  function adjust(delta: number) {
    setMinutes((current) => Math.min(23 * 60 + 45, Math.max(0, current + delta)))
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Lembrete"
      subtitle="Para não esquecer no meio do dia"
      onClose={onClose}
      footer={
        <PrimaryButton
          label="Criar lembrete"
          disabled={!title.trim()}
          onPress={() => {
            onConfirm(title.trim(), useTime ? formatSleepTimeMinutes(minutes) : null)
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
          placeholder="Ex.: Tomar água, ligar para..."
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          selectionColor={ACCENT}
        />

        <Pressable
          onPress={() => setUseTime((current) => !current)}
          style={styles.toggleRow}
        >
          <Text style={styles.toggleLabel}>Horário específico</Text>
          <Ionicons
            name={useTime ? 'checkbox' : 'square-outline'}
            size={22}
            color={useTime ? '#f0abfc' : colors.textMuted}
          />
        </Pressable>

        {useTime ? (
          <View style={styles.timeRow}>
            <Pressable onPress={() => adjust(-15)} style={styles.stepper}>
              <Ionicons name="remove" size={20} color={colors.text} />
            </Pressable>
            <Text style={styles.timeValue}>{formatSleepTimeMinutes(minutes)}</Text>
            <Pressable onPress={() => adjust(15)} style={styles.stepper}>
              <Ionicons name="add" size={20} color={colors.text} />
            </Pressable>
          </View>
        ) : (
          <Text style={styles.hint}>Aparecerá como lembrete flexível na timeline.</Text>
        )}
      </View>
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 12 },
  input: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  timeValue: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  footerBtn: { marginTop: 0 },
}
}

