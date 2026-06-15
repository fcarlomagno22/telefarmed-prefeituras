import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { ConsultationDocumentKind } from '../../types/appointmentDocuments'
import type { FlatDocumentEntry } from '../../types/myDocuments'
import { getConsultationDocumentPalette } from '../../utils/appointmentDocuments'
import { getAppointmentDateTime } from '../../utils/myAppointments'
import { formatScheduleDayLabel } from '../../utils/scheduleDate'

const DOCUMENT_ICONS: Record<
  ConsultationDocumentKind,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  prescription: 'pill',
  exam: 'flask-outline',
  certificate: 'file-document-outline',
}

type DocumentFlatRowProps = {
  item: FlatDocumentEntry
  downloading: boolean
  onDownload: () => void
}

export function DocumentFlatRow({ item, downloading, onDownload }: DocumentFlatRowProps) {
  const { document, appointment } = item
  const palette = getConsultationDocumentPalette(document.kind)
  const appointmentDate = getAppointmentDateTime(appointment)
  const signedPrefix = document.kind === 'prescription' ? 'Assinada' : 'Assinado'

  function handleDownload() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onDownload()
  }

  return (
    <View
      style={[
        styles.row,
        { borderColor: palette.cardBorder, backgroundColor: palette.cardBackground },
      ]}
    >
      <LinearGradient colors={[...palette.iconGradient]} style={styles.icon}>
        <MaterialCommunityIcons name={DOCUMENT_ICONS[document.kind]} size={18} color="#fff" />
      </LinearGradient>

      <View style={styles.textCol}>
        <Text style={styles.title}>{document.title}</Text>
        <Text style={styles.meta}>
          {formatScheduleDayLabel(appointmentDate)} · {appointment.selectedDoctorName}
        </Text>
        <Text style={styles.signedMeta}>
          PDF · {signedPrefix} às {document.signedAt}
        </Text>
      </View>

      <Pressable
        onPress={handleDownload}
        disabled={downloading}
        style={({ pressed }) => [
          styles.downloadButton,
          { shadowColor: palette.shadowColor },
          pressed && !downloading && styles.downloadButtonPressed,
          downloading && styles.downloadButtonDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={document.downloadLabel}
      >
        <LinearGradient colors={[...palette.iconGradient]} style={styles.downloadButtonGradient}>
          {downloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="download-outline" size={18} color="#fff" />
          )}
        </LinearGradient>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  signedMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
  },
  downloadButton: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 5,
  },
  downloadButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  downloadButtonDisabled: {
    opacity: 0.7,
  },
})
