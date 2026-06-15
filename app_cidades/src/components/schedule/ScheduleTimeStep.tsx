import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { fetchDoctorSlots } from '../../data/mockScheduleCatalog'
import { ScheduleTimeSlot } from '../../types/scheduleAppointment'
import { formatScheduleDayLabel } from '../../utils/scheduleDate'
import { colors } from '../../theme/colors'
import { ScheduleTimeGridSkeleton } from './ScheduleStepSkeletons'

type ScheduleTimeStepProps = {
  selectedDate: Date
  selectedDoctorId: string
  selectedDoctorName: string
  selectedTime: string
  onSelectTime: (time: string) => void
}

export function ScheduleTimeStep({
  selectedDate,
  selectedDoctorId,
  selectedDoctorName,
  selectedTime,
  onSelectTime,
}: ScheduleTimeStepProps) {
  const [slots, setSlots] = useState<ScheduleTimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!selectedDoctorId) return
    let active = true
    setIsLoading(true)
    void fetchDoctorSlots(selectedDoctorId, selectedDate)
      .then((result) => {
        if (active) setSlots(result)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedDoctorId, selectedDate])

  const availableCount = slots.filter((s) => s.available).length

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Escolha o horário</Text>
      <Text style={styles.description}>
        Horários de <Text style={styles.descriptionStrong}>{selectedDoctorName}</Text> em{' '}
        {formatScheduleDayLabel(selectedDate)}.
      </Text>

      {!isLoading ? (
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={16} color={colors.primaryLight} />
          <Text style={styles.metaText}>
            {availableCount} {availableCount === 1 ? 'horário disponível' : 'horários disponíveis'}
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <ScheduleTimeGridSkeleton />
      ) : (
        <View style={styles.timeGrid}>
          {slots.map((slot) => {
            const isSelected = slot.time === selectedTime
            const disabled = !slot.available

            return (
              <Pressable
                key={slot.time}
                disabled={disabled}
                onPress={() => onSelectTime(slot.time)}
                style={[
                  styles.timeSlot,
                  isSelected && styles.timeSlotSelected,
                  disabled && styles.timeSlotDisabled,
                ]}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
                    style={styles.timeSlotGradient}
                  >
                    <Text style={styles.timeSlotTextSelected}>{slot.time}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={[styles.timeSlotText, disabled && styles.timeSlotTextDisabled]}>
                    {slot.time}
                  </Text>
                )}
              </Pressable>
            )
          })}
        </View>
      )}

      {selectedTime ? (
        <View style={styles.summary}>
          <Ionicons name="checkmark-circle" size={18} color="#34d399" />
          <Text style={styles.summaryText}>
            {formatScheduleDayLabel(selectedDate)} às{' '}
            <Text style={styles.summaryStrong}>{selectedTime}</Text>
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  descriptionStrong: {
    color: colors.text,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.2)',
  },
  metaText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    width: '30%',
    minWidth: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  timeSlotSelected: {
    borderColor: 'transparent',
  },
  timeSlotDisabled: {
    opacity: 0.35,
  },
  timeSlotGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 12,
  },
  timeSlotTextSelected: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  timeSlotTextDisabled: {
    color: colors.textSubtle,
    textDecorationLine: 'line-through',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  summaryText: {
    flex: 1,
    color: '#a7f3d0',
    fontSize: 13,
    fontWeight: '500',
  },
  summaryStrong: {
    fontWeight: '800',
    color: '#ecfdf5',
  },
})
