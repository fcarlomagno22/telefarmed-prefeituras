import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import type { MyRoutineTemplateId } from '../../types/myRoutine'
import { MY_ROUTINE_TEMPLATES } from '../../utils/myRoutineTemplates'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

const ACCENT_LIGHT = '#f0abfc'

type MyRoutineTemplatePickerDrawerProps = {
  visible: boolean
  currentTemplateId: MyRoutineTemplateId | null
  previewTaskCount?: (templateId: MyRoutineTemplateId) => { beforeTasks: number; afterTasks: number }
  onClose: () => void
  onApply: (templateId: MyRoutineTemplateId) => void
}

export function MyRoutineTemplatePickerDrawer({
  visible,
  currentTemplateId,
  previewTaskCount,
  onClose,
  onApply,
}: MyRoutineTemplatePickerDrawerProps) {
  const styles = useThemedStyles(createStyles)
  const [selected, setSelected] = useState<MyRoutineTemplateId>(currentTemplateId ?? 'day-busy')
  const preview = previewTaskCount?.(selected)

  useEffect(() => {
    if (visible) setSelected(currentTemplateId ?? 'day-busy')
  }, [currentTemplateId, visible])

  const templates = Object.values(MY_ROUTINE_TEMPLATES)

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Trocar template"
      subtitle="Prévia de merge antes de aplicar"
      onClose={onClose}
      footer={
        <PrimaryButton
          label="Aplicar template"
          onPress={() => {
            onApply(selected)
            onClose()
          }}
          style={styles.footerBtn}
        />
      }
    >
      <View style={styles.content}>
        {preview ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Prévia da semana</Text>
            <Text style={styles.previewMeta}>
              {preview.beforeTasks} tarefas → {preview.afterTasks} tarefas
            </Text>
          </View>
        ) : null}

        {templates.map((template) => {
          const isSelected = selected === template.id
          return (
            <Pressable
              key={template.id}
              onPress={() => setSelected(template.id)}
              style={[styles.card, isSelected && styles.cardSelected]}
            >
              <LinearGradient
                colors={
                  isSelected
                    ? ['rgba(240, 171, 252, 0.16)', 'rgba(217, 70, 239, 0.06)']
                    : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']
                }
                style={styles.cardInner}
              >
                <View style={styles.header}>
                  <Text style={[styles.title, isSelected && styles.titleSelected]}>
                    {template.label}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={18} color={ACCENT_LIGHT} />
                  ) : null}
                </View>
                <Text style={styles.description}>{template.description}</Text>
              </LinearGradient>
            </Pressable>
          )
        })}
      </View>
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 10 },
  previewCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(217, 70, 239, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.2)',
    gap: 4,
  },
  previewTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  previewMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardSelected: {
    borderColor: 'rgba(240, 171, 252, 0.28)',
  },
  cardInner: { padding: 14, gap: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  titleSelected: { color: ACCENT_LIGHT },
  description: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  footerBtn: { marginTop: 0 },
}
}

