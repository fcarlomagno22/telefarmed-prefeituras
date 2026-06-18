import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import {
  fetchDoctorScheduleOverview,
  fetchSpecialtyDaySlotCounts,
} from '../../data/mockScheduleCatalog'
import { ScheduleViewMode } from '../../types/scheduleAppointment'
import {
  formatScheduleDayLabel,
  getNextScheduleDays,
  getScheduleEndDate,
  getScheduleStartDate,
  SCHEDULE_DAY_COUNT,
  toDateKey,
} from '../../utils/scheduleDate'
import { colors } from '../../theme/colors'
import { ScheduleCalendarPicker } from './ScheduleCalendarPicker'
import { ScheduleCalendarSkeleton } from './ScheduleStepSkeletons'
import { ScheduleStepTitle } from './ScheduleStepTitle'

type ScheduleDateStepProps = {
  specialtyId: string
  specialtyName: string
  mode: ScheduleViewMode
  selectedDoctorName?: string
  selectedDoctorId?: string
  selectedDate: Date
  onSelectDate: (date: Date) => void
  onBack?: () => void
}

export function ScheduleDateStep({
  specialtyId,
  specialtyName,
  mode,
  selectedDoctorName,
  selectedDoctorId,
  selectedDate,
  onSelectDate,
  onBack,
}: ScheduleDateStepProps) {
  const [slotCounts, setSlotCounts] = useState<Map<string, number>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  const scheduleStart = useMemo(() => getScheduleStartDate(), [])
  const scheduleEnd = useMemo(() => getScheduleEndDate(), [])
  const scheduleDays = useMemo(
    () => getNextScheduleDays(SCHEDULE_DAY_COUNT, scheduleStart),
    [scheduleStart],
  )

  useEffect(() => {
    if (!specialtyId) return
    let active = true
    setIsLoading(true)

    const load =
      mode === 'by_day'
        ? fetchSpecialtyDaySlotCounts(specialtyId, scheduleDays)
        : selectedDoctorId
          ? fetchDoctorScheduleOverview(selectedDoctorId, scheduleStart, SCHEDULE_DAY_COUNT).then(
              (overview) => {
                const map = new Map<string, number>()
                for (const day of overview) {
                  if (day.worksThisDay) {
                    map.set(toDateKey(day.date), day.availableSlots)
                  }
                }
                return map
              },
            )
          : Promise.resolve(new Map<string, number>())

    void load
      .then((counts) => {
        if (active) setSlotCounts(counts)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [specialtyId, scheduleDays, mode, selectedDoctorId, scheduleStart])

  const title =
    mode === 'by_doctor' && selectedDoctorName
      ? `Agenda de ${selectedDoctorName}`
      : 'Escolha a data'

  const description =
    mode === 'by_day'
      ? `Selecione o dia da consulta em ${specialtyName}.`
      : `Veja os dias em que ${selectedDoctorName ?? 'o médico'} tem horários disponíveis.`

  return (
    <View style={styles.wrap}>
      <ScheduleStepTitle title={title} onBack={onBack} />
      <Text style={styles.description}>{description}</Text>

      {isLoading ? (
        <ScheduleCalendarSkeleton />
      ) : (
        <ScheduleCalendarPicker
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          minDate={scheduleStart}
          maxDate={scheduleEnd}
          slotCounts={slotCounts}
        />
      )}

      <Text style={styles.dateLabel}>{formatScheduleDayLabel(selectedDate)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  dateLabel: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
})
