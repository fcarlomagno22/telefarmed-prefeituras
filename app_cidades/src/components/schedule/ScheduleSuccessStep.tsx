import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { addScheduleAppointmentToDeviceCalendar } from '../../utils/scheduleCalendarEvent'
import successAnimation from '../../../assets/success.json'
import { ScheduleAppointmentDraft } from '../../types/scheduleAppointment'
import { formatScheduleDayLabel } from '../../utils/scheduleDate'
import { colors } from '../../theme/colors'
import { LottiePlayer } from '../LottiePlayer'
import { scheduleDoctors } from '../../data/mockScheduleCatalog'

type ScheduleSuccessStepProps = {
  draft: ScheduleAppointmentDraft
  patientName: string
}

export function ScheduleSuccessStep({ draft, patientName }: ScheduleSuccessStepProps) {
  const doctor = scheduleDoctors.find((d) => d.id === draft.selectedDoctorId)
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false)

  const handleAddToCalendar = async () => {
    if (isAddingToCalendar) return

    setIsAddingToCalendar(true)

    try {
      await addScheduleAppointmentToDeviceCalendar({
        specialtyName: draft.specialtyName,
        doctorName: doctor?.name ?? draft.selectedDoctorName,
        selectedDate: draft.selectedDate,
        selectedTime: draft.selectedTime,
        patientName,
        ubtName: draft.selectedUbtName,
        ubtAddress: draft.selectedUbtAddress,
      })
    } finally {
      setIsAddingToCalendar(false)
    }
  }

  return (
    <View style={styles.wrap}>
      <LottiePlayer source={successAnimation} loop={false} style={styles.lottie} />

      <Text style={styles.title}>Consulta agendada!</Text>
      <Text style={styles.message}>
        O agendamento de <Text style={styles.messageStrong}>{patientName}</Text> foi registrado com
        sucesso.
      </Text>

      <View style={styles.card}>
        <LinearGradient
          colors={['rgba(255, 133, 51, 0.22)', 'rgba(255, 107, 0, 0.08)', 'rgba(14, 14, 20, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="calendar" size={20} color={colors.primaryLight} />
            </View>
            <Text style={styles.cardHeaderText}>Detalhes da consulta</Text>
          </View>

          <Text style={styles.specialty}>{draft.specialtyName}</Text>
          {draft.selectedUbtName ? (
            <Text style={styles.ubtName}>{draft.selectedUbtName}</Text>
          ) : null}
          <Text style={styles.datetime}>
            {formatScheduleDayLabel(draft.selectedDate)} às{' '}
            <Text style={styles.datetimeStrong}>{draft.selectedTime}</Text>
          </Text>

          {doctor ? (
            <View style={styles.doctorRow}>
              <Image source={{ uri: doctor.avatarUrl }} style={styles.doctorAvatar} />
              <Text style={styles.doctorName}>com {doctor.name}</Text>
            </View>
          ) : null}
        </LinearGradient>
      </View>

      <Pressable
        onPress={handleAddToCalendar}
        disabled={isAddingToCalendar}
        style={({ pressed }) => [
          styles.calendarButton,
          pressed && !isAddingToCalendar && styles.calendarButtonPressed,
          isAddingToCalendar && styles.calendarButtonDisabled,
        ]}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.primaryLight} />
        <Text style={styles.calendarButtonText}>
          {isAddingToCalendar ? 'Abrindo calendário…' : 'Adicionar ao calendário'}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  lottie: {
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 8,
  },
  messageStrong: {
    color: colors.text,
    fontWeight: '700',
  },
  card: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.3)',
    marginTop: 8,
  },
  cardGradient: {
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.3)',
  },
  cardHeaderText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  specialty: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  ubtName: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  datetime: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  datetimeStrong: {
    color: colors.text,
    fontWeight: '800',
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  doctorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  doctorName: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  calendarButton: {
    width: '100%',
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.45)',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  calendarButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  calendarButtonDisabled: {
    opacity: 0.7,
  },
  calendarButtonText: {
    color: colors.primaryLight,
    fontSize: 15,
    fontWeight: '700',
  },
})
