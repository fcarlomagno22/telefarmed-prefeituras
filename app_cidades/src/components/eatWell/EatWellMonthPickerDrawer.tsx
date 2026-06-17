import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import {
  formatMonthKey,
  getCurrentMonthKey,
  getEatWellMonthLabel,
  parseMonthKey,
} from '../../utils/eatWellCalendarDays'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type EatWellMonthPickerDrawerProps = {
  visible: boolean
  monthKey: string
  onClose: () => void
  onApply: (monthKey: string) => void
}

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

const MIN_YEAR = 2020

function isFutureMonth(year: number, monthIndex: number, referenceDate = new Date()) {
  const now = new Date(referenceDate)
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  if (year > currentYear) return true
  if (year === currentYear && monthIndex > currentMonth) return true
  return false
}

export function EatWellMonthPickerDrawer({
  visible,
  monthKey,
  onClose,
  onApply,
}: EatWellMonthPickerDrawerProps) {
  const parsed = parseMonthKey(monthKey)
  const [draftYear, setDraftYear] = useState(parsed.year)
  const [draftMonthIndex, setDraftMonthIndex] = useState(parsed.monthIndex)

  useEffect(() => {
    if (!visible) return
    const next = parseMonthKey(monthKey)
    setDraftYear(next.year)
    setDraftMonthIndex(next.monthIndex)
  }, [visible, monthKey])

  const currentMonthKey = getCurrentMonthKey()
  const draftMonthKey = formatMonthKey(draftYear, draftMonthIndex)
  const canGoNextYear = draftYear < new Date().getFullYear()
  const canGoPrevYear = draftYear > MIN_YEAR

  const footerHint = useMemo(() => {
    return `Visualizando: ${getEatWellMonthLabel(draftMonthKey)}`
  }, [draftMonthKey])

  function handleApply() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onApply(draftMonthKey)
  }

  function handleSelectMonth(monthIndex: number) {
    if (isFutureMonth(draftYear, monthIndex)) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setDraftMonthIndex(monthIndex)
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Escolher mês"
      subtitle="Um mês por vez no calendário diário"
      minHeight="48%"
      hideCloseButton
      extraBottomInset={28}
      onClose={onClose}
      scrollable={false}
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerHint}>{footerHint}</Text>
          <PrimaryButton label="Aplicar mês" onPress={handleApply} />
        </View>
      }
    >
      <View style={styles.yearRow}>
        <Pressable
          disabled={!canGoPrevYear}
          onPress={() => setDraftYear((value) => value - 1)}
          style={({ pressed }) => [
            styles.yearNavBtn,
            !canGoPrevYear && styles.yearNavBtnDisabled,
            pressed && canGoPrevYear && styles.yearNavBtnPressed,
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={canGoPrevYear ? colors.text : colors.textSubtle} />
        </Pressable>

        <Text style={styles.yearLabel}>{draftYear}</Text>

        <Pressable
          disabled={!canGoNextYear}
          onPress={() => setDraftYear((value) => value + 1)}
          style={({ pressed }) => [
            styles.yearNavBtn,
            !canGoNextYear && styles.yearNavBtnDisabled,
            pressed && canGoNextYear && styles.yearNavBtnPressed,
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={canGoNextYear ? colors.text : colors.textSubtle}
          />
        </Pressable>
      </View>

      <View style={styles.monthGrid}>
        {MONTH_LABELS.map((label, monthIndex) => {
          const disabled = isFutureMonth(draftYear, monthIndex)
          const selected = draftMonthIndex === monthIndex
          const isCurrent =
            formatMonthKey(draftYear, monthIndex) === currentMonthKey

          return (
            <Pressable
              key={label}
              disabled={disabled}
              onPress={() => handleSelectMonth(monthIndex)}
              style={({ pressed }) => [
                styles.monthCell,
                selected && styles.monthCellSelected,
                isCurrent && !selected && styles.monthCellCurrent,
                disabled && styles.monthCellDisabled,
                pressed && !disabled && styles.monthCellPressed,
              ]}
            >
              <Text
                style={[
                  styles.monthCellText,
                  selected && styles.monthCellTextSelected,
                  disabled && styles.monthCellTextDisabled,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  yearNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  yearNavBtnDisabled: {
    opacity: 0.45,
  },
  yearNavBtnPressed: {
    opacity: 0.88,
  },
  yearLabel: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
  },
  monthCell: {
    width: '23%',
    flexGrow: 1,
    minWidth: '22%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  monthCellSelected: {
    backgroundColor: 'rgba(132, 204, 22, 0.22)',
    borderColor: 'rgba(132, 204, 22, 0.55)',
  },
  monthCellCurrent: {
    borderColor: 'rgba(132, 204, 22, 0.35)',
  },
  monthCellDisabled: {
    opacity: 0.28,
  },
  monthCellPressed: {
    opacity: 0.9,
  },
  monthCellText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  monthCellTextSelected: {
    color: '#d9f99d',
  },
  monthCellTextDisabled: {
    color: colors.textSubtle,
  },
  footer: {
    gap: 10,
    paddingTop: 8,
  },
  footerHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
})
