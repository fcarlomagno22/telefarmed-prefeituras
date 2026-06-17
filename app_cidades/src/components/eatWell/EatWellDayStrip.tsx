import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { getEatWellMonthLabel, type EatWellCalendarDay } from '../../utils/eatWellCalendarDays'

export type EatWellDayStripItem = EatWellCalendarDay

type EatWellDayStripProps = {
  days: EatWellDayStripItem[]
  monthKey: string
  selectedDateIso: string
  onSelectDate: (dateIso: string) => void
  onOpenMonthPicker: () => void
  onHorizontalScrollActive?: (active: boolean) => void
}

const DAY_SIZE = 54
const DAY_GAP = 8
const ITEM_LENGTH = DAY_SIZE + DAY_GAP
const LIST_PADDING_LEFT = 16
const STRIP_HEIGHT = DAY_SIZE + 4

function getSelectedIndex(days: EatWellDayStripItem[], selectedDateIso: string) {
  const index = days.findIndex((day) => day.dateIso === selectedDateIso)
  return index >= 0 ? index : 0
}

function getScrollOffsetForIndex(index: number) {
  return Math.max(index * ITEM_LENGTH, 0)
}

function renderDayDot(day: EatWellDayStripItem, selected: boolean) {
  if (day.menuDotStatus && !day.isFuture) {
    const dotColor =
      day.menuDotStatus === 'complete'
        ? selected
          ? '#bef264'
          : '#84cc16'
        : day.menuDotStatus === 'partial'
          ? selected
            ? '#fde68a'
            : '#fbbf24'
          : selected
            ? '#fca5a5'
            : '#f87171'

    return <View style={[styles.dot, { backgroundColor: dotColor }]} />
  }

  if (day.hasData) {
    return <View style={[styles.dot, selected && styles.dotSelected]} />
  }

  return <View style={styles.dotPlaceholder} />
}

export function EatWellDayStrip({
  days,
  monthKey,
  selectedDateIso,
  onSelectDate,
  onOpenMonthPicker,
  onHorizontalScrollActive,
}: EatWellDayStripProps) {
  const scrollRef = useRef<ScrollView>(null)
  const syncedIndexRef = useRef(getSelectedIndex(days, selectedDateIso))
  const monthLabel = getEatWellMonthLabel(monthKey)

  const selectedIndex = getSelectedIndex(days, selectedDateIso)
  const initialContentOffset = useMemo(
    () => ({ x: getScrollOffsetForIndex(selectedIndex), y: 0 }),
    [monthKey],
  )

  useEffect(() => {
    syncedIndexRef.current = selectedIndex
  }, [monthKey, selectedIndex])

  useEffect(() => {
    const index = getSelectedIndex(days, selectedDateIso)
    if (index === syncedIndexRef.current) return

    syncedIndexRef.current = index
    scrollRef.current?.scrollTo({
      x: getScrollOffsetForIndex(index),
      animated: false,
    })
  }, [selectedDateIso])

  function lockSegmentPager() {
    onHorizontalScrollActive?.(true)
  }

  function unlockSegmentPager() {
    onHorizontalScrollActive?.(false)
  }

  function handlePress(dateIso: string, isFuture: boolean) {
    if (isFuture) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSelectDate(dateIso)
  }

  function handleOpenMonthPicker() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onOpenMonthPicker()
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable
          onPress={handleOpenMonthPicker}
          style={({ pressed }) => [styles.calendarBtn, pressed && styles.calendarBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Escolher mês"
          hitSlop={8}
        >
          <Ionicons name="calendar-outline" size={22} color="#ffffff" />
        </Pressable>
      </View>

      <View style={styles.stripViewport}>
        <ScrollView
          key={monthKey}
          ref={scrollRef}
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          decelerationRate="fast"
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          contentOffset={initialContentOffset}
          contentContainerStyle={styles.daysRow}
          onScrollBeginDrag={lockSegmentPager}
          onScrollEndDrag={unlockSegmentPager}
          onMomentumScrollEnd={unlockSegmentPager}
          onTouchCancel={unlockSegmentPager}
        >
          {days.map((day) => {
            const selected = day.dateIso === selectedDateIso
            const disabled = day.isFuture

            return (
              <Pressable
                key={day.dateIso}
                onPress={() => handlePress(day.dateIso, day.isFuture)}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.dayCard,
                  selected && styles.dayCardSelected,
                  disabled && styles.dayCardDisabled,
                  pressed && !disabled && styles.dayCardPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
              >
                {selected ? (
                  <LinearGradient
                    colors={['rgba(132, 204, 22, 0.38)', 'rgba(77, 124, 15, 0.24)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                ) : null}

                <Text style={[styles.weekday, selected && styles.weekdaySelected]}>{day.weekdayLabel}</Text>
                <Text style={[styles.dayNumber, selected && styles.dayNumberSelected]}>{day.dayNumber}</Text>

                {renderDayDot(day, selected)}
              </Pressable>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  monthLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
  },
  calendarBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarBtnPressed: {
    opacity: 0.72,
  },
  stripViewport: {
    height: STRIP_HEIGHT,
  },
  daysRow: {
    paddingHorizontal: LIST_PADDING_LEFT,
    paddingRight: 24,
    paddingVertical: 2,
    alignItems: 'center',
  },
  dayCard: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    marginRight: DAY_GAP,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dayCardSelected: {
    borderColor: 'rgba(132, 204, 22, 0.6)',
  },
  dayCardDisabled: {
    opacity: 0.32,
  },
  dayCardPressed: {
    opacity: 0.88,
  },
  weekday: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  weekdaySelected: {
    color: '#d9f99d',
  },
  dayNumber: {
    color: colors.textMuted,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 20,
  },
  dayNumberSelected: {
    color: colors.text,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(132, 204, 22, 0.8)',
    marginTop: 1,
  },
  dotSelected: {
    backgroundColor: '#bef264',
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
    marginTop: 1,
  },
})
