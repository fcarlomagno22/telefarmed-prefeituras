import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MY_ROUTINE_MAX_ESSENTIALS } from '../../hooks/useMyRoutineProfile'
import { MY_ROUTINE_IDEAL_ACTIVITY_OPTIONS } from '../../types/myRoutine'
import { reorderTasks } from '../../utils/myRoutineWeekStats'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

const ACCENT_LIGHT = '#f0abfc'

type MyRoutineEssentialsEditorDrawerProps = {
  visible: boolean
  essentials: string[]
  onClose: () => void
  onSave: (essentials: string[]) => void | Promise<void>
}

export function MyRoutineEssentialsEditorDrawer({
  visible,
  essentials,
  onClose,
  onSave,
}: MyRoutineEssentialsEditorDrawerProps) {
  const styles = useThemedStyles(createStyles)
  const [draft, setDraft] = useState<string[]>(essentials)

  useEffect(() => {
    if (visible) setDraft(essentials)
  }, [essentials, visible])

  const essentialOptions = useMemo(
    () => MY_ROUTINE_IDEAL_ACTIVITY_OPTIONS.filter((option) => option.tier === 'essential'),
    [],
  )

  const availableToAdd = essentialOptions.filter((option) => !draft.includes(option.id))

  function move(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const asTasks = current.map((id, order) => ({
        id,
        title: id,
        priority: 'essential' as const,
        scheduleType: 'window' as const,
        status: 'pending' as const,
        order,
      }))
      const reordered = reorderTasks(asTasks, index, index + direction)
      return reordered.map((task) => task.id)
    })
  }

  function remove(id: string) {
    setDraft((current) => current.filter((item) => item !== id))
  }

  function add(id: string) {
    if (draft.length >= MY_ROUTINE_MAX_ESSENTIALS) return
    setDraft((current) => [...current, id])
  }

  function labelFor(id: string) {
    return essentialOptions.find((option) => option.id === id)?.label ?? id
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Rotina mínima"
      subtitle={`Até ${MY_ROUTINE_MAX_ESSENTIALS} essenciais · ordem importa`}
      onClose={onClose}
      footer={
        <PrimaryButton
          label="Salvar essenciais"
          onPress={() => void Promise.resolve(onSave(draft))}
          style={styles.footerBtn}
        />
      }
    >
      <View style={styles.content}>
        {draft.length === 0 ? (
          <Text style={styles.empty}>Nenhum essencial selecionado.</Text>
        ) : (
          draft.map((id, index) => (
            <View key={id} style={styles.row}>
              <View style={styles.rowCopy}>
                <Text style={styles.rowIndex}>{index + 1}</Text>
                <Text style={styles.rowLabel}>{labelFor(id)}</Text>
              </View>
              <View style={styles.rowActions}>
                <Pressable
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    move(index, -1)
                  }}
                  disabled={index === 0}
                  hitSlop={6}
                  style={[styles.iconBtn, index === 0 && styles.iconBtnDisabled]}
                >
                  <Ionicons name="chevron-up" size={16} color={ACCENT_LIGHT} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    move(index, 1)
                  }}
                  disabled={index === draft.length - 1}
                  hitSlop={6}
                  style={[styles.iconBtn, index === draft.length - 1 && styles.iconBtnDisabled]}
                >
                  <Ionicons name="chevron-down" size={16} color={ACCENT_LIGHT} />
                </Pressable>
                <Pressable
                  onPress={() => remove(id)}
                  hitSlop={6}
                  style={styles.iconBtn}
                >
                  <Ionicons name="trash-outline" size={16} color="#fca5a5" />
                </Pressable>
              </View>
            </View>
          ))
        )}

        {availableToAdd.length > 0 && draft.length < MY_ROUTINE_MAX_ESSENTIALS ? (
          <View style={styles.addSection}>
            <Text style={styles.addLabel}>Adicionar</Text>
            {availableToAdd.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => add(option.id)}
                style={({ pressed }) => [styles.addRow, pressed && styles.addRowPressed]}
              >
                <Text style={styles.addRowText}>{option.label}</Text>
                <Ionicons name="add-circle-outline" size={18} color={ACCENT_LIGHT} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 8 },
  empty: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rowCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowIndex: {
    color: ACCENT_LIGHT,
    fontSize: 12,
    fontWeight: '900',
    width: 18,
  },
  rowLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDisabled: { opacity: 0.35 },
  addSection: { gap: 6, marginTop: 8 },
  addLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(217, 70, 239, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.18)',
  },
  addRowPressed: { opacity: 0.88 },
  addRowText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  footerBtn: { marginTop: 4 },
}
}

