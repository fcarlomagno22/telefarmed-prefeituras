import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { isSameDay, toDateKey } from '../../utils/scheduleDate'
import { SkeletonBone } from '../SkeletonBone'

const WEEKDAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

type ScheduleCalendarPickerProps = {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  minDate: Date
  maxDate: Date
  slotCounts: Map<string, number>
  loading?: boolean
}

function startOfMonth(date: Date) {
  const next = new Date(date)
  next.setDate(1)
  next.setHours(12, 0, 0, 0)
  return next
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

function buildMonthGrid(monthDate: Date) {
  const firstDay = startOfMonth(monthDate)
  const startWeekday = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate()

  const cells: Array<{ date: Date | null; key: string }> = []
  for (let index = 0; index < startWeekday; index += 1) {
    cells.push({ date: null, key: `empty-start-${index}` })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), day, 12, 0, 0, 0)
    cells.push({ date, key: toDateKey(date) })
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, key: `empty-end-${cells.length}` })
  }
  return cells
}

function isBeforeDay(date: Date, min: Date) {
  return toDateKey(date) < toDateKey(min)
}

function isAfterDay(date: Date, max: Date) {
  return toDateKey(date) > toDateKey(max)
}

export function ScheduleCalendarPicker({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
  slotCounts,
  loading = false,
}: ScheduleCalendarPickerProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(selectedDate))

  useEffect(() => {
    setVisibleMonth(startOfMonth(selectedDate))
  }, [selectedDate.getFullYear(), selectedDate.getMonth()])

  const monthCells = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth])
  const monthTitle = visibleMonth.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const canGoPrev = startOfMonth(visibleMonth).getTime() > startOfMonth(minDate).getTime()
  const canGoNext = startOfMonth(visibleMonth).getTime() < startOfMonth(maxDate).getTime()

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          disabled={!canGoPrev}
          onPress={() => setVisibleMonth(addMonths(visibleMonth, -1))}
          style={({ pressed }) => [
            styles.navButton,
            !canGoPrev && styles.navButtonDisabled,
            pressed && canGoPrev && styles.navButtonPressed,
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={canGoPrev ? colors.text : colors.textSubtle} />
        </Pressable>

        <Text style={styles.monthTitle}>{monthTitle}</Text>

        <Pressable
          disabled={!canGoNext}
          onPress={() => setVisibleMonth(addMonths(visibleMonth, 1))}
          style={({ pressed }) => [
            styles.navButton,
            !canGoNext && styles.navButtonDisabled,
            pressed && canGoNext && styles.navButtonPressed,
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={canGoNext ? colors.text : colors.textSubtle}
          />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {loading ? (
        <View style={styles.daysGrid}>
          {Array.from({ length: 35 }, (_, index) => (
            <View key={index} style={styles.dayCell}>
              <SkeletonBone width="100%" height={36} borderRadius={10} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.daysGrid}>
          {monthCells.map((cell) => {
            if (!cell.date) {
              return <View key={cell.key} style={styles.dayCell} />
            }

            const date = cell.date
            const isSelected = isSameDay(date, selectedDate)
            const isToday = isSameDay(date, minDate)
            const outOfRange = isBeforeDay(date, minDate) || isAfterDay(date, maxDate)
            const slots = slotCounts.get(toDateKey(date)) ?? 0
            const hasSlots = slots > 0
            const disabled = outOfRange || !hasSlots

            return (
              <Pressable
                key={cell.key}
                disabled={disabled}
                onPress={() => onSelectDate(date)}
                style={({ pressed }) => [
                  styles.dayCell,
                  disabled && styles.dayCellDisabled,
                  pressed && !disabled && styles.dayCellPressed,
                ]}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
                    start={{ x: 0.15, y: 0 }}
                    end={{ x: 0.85, y: 1 }}
                    style={styles.dayCellSelectedGradient}
                  >
                    <Text style={styles.dayLabelSelected}>{date.getDate()}</Text>
                    {hasSlots ? (
                      <Text style={styles.daySlotsSelected}>{slots}</Text>
                    ) : null}
                  </LinearGradient>
                ) : (
                  <View style={[styles.dayCellContent, hasSlots && styles.dayCellHasSlots]}>
                    <Text
                      style={[
                        styles.dayLabel,
                        disabled && styles.dayLabelDisabled,
                        isToday && !disabled && styles.dayLabelToday,
                      ]}
                      {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                    >
                      {date.getDate()}
                    </Text>
                    {hasSlots && !outOfRange ? (
                      <View style={styles.slotDot} />
                    ) : null}
                  </View>
                )}
              </Pressable>
            )
          })}
        </View>
      )}

      <Text style={styles.legend}>
        Dias com ponto verde têm horários disponíveis (próximos 30 dias).
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  navButtonPressed: {
    opacity: 0.82,
  },
  monthTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 44,
    padding: 2,
  },
  dayCellDisabled: {
    opacity: 0.28,
  },
  dayCellPressed: {
    transform: [{ scale: 0.96 }],
  },
  dayCellContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 2,
  },
  dayCellHasSlots: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  dayCellSelectedGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 1,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  dayLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 14,
    textAlign: 'center',
  },
  dayLabelToday: {
    color: colors.primaryLight,
    fontWeight: '800',
  },
  dayLabelDisabled: {
    color: colors.textSubtle,
  },
  dayLabelSelected: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 14,
  },
  daySlotsSelected: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  slotDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34d399',
  },
  legend: {
    marginTop: 10,
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 15,
  },
})
