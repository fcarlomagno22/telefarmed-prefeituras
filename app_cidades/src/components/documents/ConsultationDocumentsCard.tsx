import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { scheduleDoctors } from '../../data/mockScheduleCatalog'
import { colors } from '../../theme/colors'
import { getDocumentsConsultationCardColors } from '../../theme/consultationDocumentColors'
import type { ConsultationDocumentsEntry } from '../../types/myDocuments'
import { formatDocumentCountsLabel } from '../../utils/myDocuments'
import { getAppointmentDateTime } from '../../utils/myAppointments'
import { formatScheduleDayLabel } from '../../utils/scheduleDate'

type ConsultationDocumentsCardProps = {
  entry: ConsultationDocumentsEntry
  featured?: boolean
  onPress: () => void
}

export function ConsultationDocumentsCard({
  entry,
  featured = false,
  onPress,
}: ConsultationDocumentsCardProps) {
  const { appointment, counts } = entry
  const doctor = scheduleDoctors.find((item) => item.id === appointment.selectedDoctorId)
  const appointmentDate = getAppointmentDateTime(appointment)
  const cardColors = getDocumentsConsultationCardColors(featured)

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[...cardColors.cardGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.card, { borderColor: cardColors.cardBorder }]}
      >
        {featured ? (
          <View
            style={[
              styles.featuredBadge,
              {
                backgroundColor: cardColors.tagBackground,
                borderColor: cardColors.tagBorder,
              },
            ]}
          >
            <Ionicons name="time-outline" size={12} color={cardColors.tagText} />
            <Text style={[styles.featuredBadgeText, { color: cardColors.tagText }]}>
              Última consulta
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [styles.bodyPressable, pressed && styles.pressed]}
        >
          <Text style={styles.specialty}>{appointment.specialtyName}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.ubt} numberOfLines={1}>
              {appointment.selectedUbtName}
            </Text>
          </View>

          <View style={styles.dateTimeRow}>
            <View style={styles.datetimeBlock}>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.primaryLight} />
                <Text style={styles.dateText}>{formatScheduleDayLabel(appointmentDate)}</Text>
              </View>
              <Text style={styles.timeText}>às {appointment.selectedTime}</Text>
            </View>

            <View style={styles.chevronWrap}>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </View>

          {doctor ? (
            <View style={styles.doctorRow}>
              <Image source={{ uri: doctor.avatarUrl }} style={styles.avatar} />
              <View style={styles.doctorTextCol}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorMeta}>{doctor.crm}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.doctorFallback}>com {appointment.selectedDoctorName}</Text>
          )}

          <View
            style={[
              styles.documentsChip,
              {
                backgroundColor: cardColors.tagBackground,
                borderColor: cardColors.tagBorder,
              },
            ]}
          >
            <Ionicons name="documents-outline" size={14} color={cardColors.tagText} />
            <Text style={[styles.documentsChipText, { color: cardColors.tagText }]}>
              {formatDocumentCountsLabel(counts)}
            </Text>
          </View>
        </Pressable>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  card: {
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: colors.cardBg,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  bodyPressable: {
    gap: 10,
  },
  pressed: {
    opacity: 0.92,
  },
  specialty: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ubt: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  datetimeBlock: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 20,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
  },
  doctorTextCol: {
    flex: 1,
    gap: 2,
  },
  doctorName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  doctorMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
  },
  doctorFallback: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  documentsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  documentsChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
})
