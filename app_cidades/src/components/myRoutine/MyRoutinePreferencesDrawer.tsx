import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import type { MyRoutinePreferences, MyRoutineScheduleType } from '../../types/myRoutine'
import { emptyMyRoutinePreferences } from '../../types/myRoutine'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

const ACCENT_LIGHT = '#f0abfc'

type MyRoutinePreferencesDrawerProps = {
  visible: boolean
  preferences: MyRoutinePreferences | null
  onClose: () => void
  onSave: (patch: Partial<MyRoutinePreferences>) => void | Promise<void>
}

const SCHEDULE_OPTIONS: { id: MyRoutineScheduleType; label: string; description: string }[] = [
  { id: 'fixed', label: 'Horário fixo', description: 'Tarefas com hora certa' },
  { id: 'window', label: 'Janelas flexíveis', description: 'Períodos do dia, sem hora exata' },
  { id: 'trigger', label: 'Gatilhos', description: 'Depois de um evento (ex.: café da manhã)' },
]

const INTENSITY_OPTIONS: {
  id: MyRoutinePreferences['intensity']
  label: string
  description: string
}[] = [
  { id: 'light', label: 'Leve', description: 'Poucas tarefas, foco no essencial' },
  { id: 'moderate', label: 'Moderada', description: 'Equilíbrio entre rotina e flexibilidade' },
  { id: 'ambitious', label: 'Ambiciosa', description: 'Mais desejáveis e bônus no plano' },
]

export function MyRoutinePreferencesDrawer({
  visible,
  preferences,
  onClose,
  onSave,
}: MyRoutinePreferencesDrawerProps) {
  const styles = useThemedStyles(createStyles)
  const [draft, setDraft] = useState<MyRoutinePreferences>(
    preferences ?? emptyMyRoutinePreferences(),
  )

  useEffect(() => {
    if (visible) setDraft(preferences ?? emptyMyRoutinePreferences())
  }, [preferences, visible])

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Preferências"
      subtitle="Notificações, horários e intensidade"
      onClose={onClose}
      footer={
        <PrimaryButton
          label="Salvar preferências"
          onPress={() => void Promise.resolve(onSave(draft))}
          style={styles.footerBtn}
        />
      }
    >
      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Notificações</Text>
        <ToggleRow
          label="Ativar notificações"
          value={draft.notificationsEnabled}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              notificationsEnabled: value,
              morningBlockReminder: value ? current.morningBlockReminder : false,
              taskReminders: value ? current.taskReminders : false,
              weeklyReviewReminder: value ? current.weeklyReviewReminder : false,
            }))
          }
        />
        <ToggleRow
          label="Lembrete do bloco da manhã"
          value={draft.morningBlockReminder}
          disabled={!draft.notificationsEnabled}
          onChange={(value) => setDraft((current) => ({ ...current, morningBlockReminder: value }))}
        />
        <ToggleRow
          label="Lembretes de tarefas"
          value={draft.taskReminders}
          disabled={!draft.notificationsEnabled}
          onChange={(value) => setDraft((current) => ({ ...current, taskReminders: value }))}
        />
        <ToggleRow
          label="Revisão semanal"
          value={draft.weeklyReviewReminder}
          disabled={!draft.notificationsEnabled}
          onChange={(value) =>
            setDraft((current) => ({ ...current, weeklyReviewReminder: value }))
          }
        />

        <Text style={styles.sectionLabel}>Estilo de horário</Text>
        {SCHEDULE_OPTIONS.map((option) => {
          const selected = draft.scheduleStyle === option.id
          return (
            <Pressable
              key={option.id}
              onPress={() => setDraft((current) => ({ ...current, scheduleStyle: option.id }))}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <View style={styles.optionCopy}>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {selected ? <View style={styles.checkDot} /> : null}
            </Pressable>
          )
        })}

        <Text style={styles.sectionLabel}>Intensidade do plano</Text>
        {INTENSITY_OPTIONS.map((option) => {
          const selected = draft.intensity === option.id
          return (
            <Pressable
              key={option.id}
              onPress={() => setDraft((current) => ({ ...current, intensity: option.id }))}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <View style={styles.optionCopy}>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {selected ? <View style={styles.checkDot} /> : null}
            </Pressable>
          )
        })}
      </View>
    </RunWalkSheetDrawer>
  )
}

function ToggleRow({
  label,
  value,
  disabled = false,
  onChange,
}: {
  label: string
  value: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={[styles.toggleRow, disabled && styles.toggleRowDisabled]}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(255,255,255,0.12)', true: 'rgba(217, 70, 239, 0.45)' }}
        thumbColor={value ? ACCENT_LIGHT : '#cbd5e1'}
      />
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 8 },
  sectionLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  toggleRowDisabled: { opacity: 0.45 },
  toggleLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  optionSelected: {
    borderColor: 'rgba(240, 171, 252, 0.35)',
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
  },
  optionCopy: { flex: 1, gap: 2 },
  optionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  optionLabelSelected: { color: ACCENT_LIGHT },
  optionDescription: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  checkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ACCENT_LIGHT,
  },
  footerBtn: { marginTop: 4 },
}
}

