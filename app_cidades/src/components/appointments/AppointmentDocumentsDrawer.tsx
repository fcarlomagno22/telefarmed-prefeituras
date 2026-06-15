import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { ConsultationDocumentPalette } from '../../theme/consultationDocumentColors'
import { ConsultationDocumentKind, ConsultationDocumentPdf } from '../../types/appointmentDocuments'
import { StoredAppointment } from '../../types/myAppointments'
import {
  fetchConsultationDocuments,
  getConsultationDocumentPalette,
} from '../../utils/appointmentDocuments'
import { downloadConsultationDocumentPdf } from '../../utils/consultationDocumentPdf'
import { getAppointmentDateTime } from '../../utils/myAppointments'
import { formatScheduleDayLabel } from '../../utils/scheduleDate'

const SHEET_OFFSET = 640

const DOCUMENT_ICONS: Record<
  ConsultationDocumentKind,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  prescription: 'pill',
  exam: 'flask-outline',
  certificate: 'file-document-outline',
}

type AppointmentDocumentsDrawerProps = {
  visible: boolean
  appointment: StoredAppointment | null
  patientName?: string
  onClose: () => void
}

type DocumentRowProps = {
  document: ConsultationDocumentPdf
  palette: ConsultationDocumentPalette
  downloading: boolean
  onDownload: () => void
}

function DocumentRow({ document, palette, downloading, onDownload }: DocumentRowProps) {
  const signedPrefix = document.kind === 'prescription' ? 'Assinada' : 'Assinado'

  return (
    <View style={[styles.documentRow, { borderColor: palette.cardBorder, backgroundColor: palette.cardBackground }]}>
      <LinearGradient colors={[...palette.iconGradient]} style={styles.documentIcon}>
        <MaterialCommunityIcons
          name={DOCUMENT_ICONS[document.kind]}
          size={18}
          color="#fff"
        />
      </LinearGradient>

      <View style={styles.documentTextCol}>
        <Text style={styles.documentTitle}>{document.title}</Text>
        <Text style={styles.documentMeta}>
          PDF • {signedPrefix} às {document.signedAt}
        </Text>
      </View>

      <Pressable
        onPress={onDownload}
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

export function AppointmentDocumentsDrawer({
  visible,
  appointment,
  patientName,
  onClose,
}: AppointmentDocumentsDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const bundle = useMemo(
    () => (appointment ? fetchConsultationDocuments(appointment) : null),
    [appointment],
  )
  const documents = useMemo(() => bundle?.documents ?? [], [bundle])
  const hasDocuments = documents.length > 0
  const headerPalette = getConsultationDocumentPalette('prescription')

  useEffect(() => {
    if (visible && appointment) {
      setIsMounted(true)
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (!isMounted) return

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_OFFSET,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsMounted(false)
        setDownloadingId(null)
      }
    })
  }, [appointment, backdropOpacity, isMounted, sheetTranslateY, visible])

  if (!isMounted || !appointment) return null

  const appointmentDate = getAppointmentDateTime(appointment)

  async function handleDownload(document: ConsultationDocumentPdf) {
    if (!appointment || downloadingId) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setDownloadingId(document.id)

    try {
      await downloadConsultationDocumentPdf(document, appointment, { patientName })
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(36, 36, 46, 0.98)', 'rgba(14, 14, 20, 0.99)']}
            style={StyleSheet.absoluteFillObject}
          />

          <LinearGradient
            colors={['#059669', '#10b981', '#34d399']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.topAccent}
          />

          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <LinearGradient
              colors={[...headerPalette.iconGradient]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.headerIcon}
            >
              <MaterialCommunityIcons name="pill" size={22} color="#fff" />
            </LinearGradient>

            <View style={styles.headerTextCol}>
              <Text style={styles.title}>Atestados e +</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {formatScheduleDayLabel(appointmentDate)} · {appointment.selectedDoctorName}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.summaryLine}>
            <View style={styles.summaryDivider} />
            <Text style={styles.summaryText} numberOfLines={1}>
              {appointment.specialtyName} · Protocolo {appointment.protocol}
            </Text>
            <View style={styles.summaryDivider} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {!hasDocuments ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="file-search-outline"
                  size={28}
                  color={colors.textSubtle}
                />
                <Text style={styles.emptyTitle}>Nada registrado ainda</Text>
                <Text style={styles.emptyText}>
                  O médico não emitiu receitas, pedidos de exame ou atestados nesta consulta.
                </Text>
              </View>
            ) : (
              <View style={styles.documentsList}>
                {documents.map((document) => (
                  <DocumentRow
                    key={document.id}
                    document={document}
                    palette={getConsultationDocumentPalette(document.kind)}
                    downloading={downloadingId === document.id}
                    onDownload={() => void handleDownload(document)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    paddingHorizontal: 16,
    gap: 12,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(16, 185, 129, 0.45)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  closeButtonPressed: {
    opacity: 0.82,
  },
  summaryLine: {
    gap: 10,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  summaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  documentsList: {
    gap: 8,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  documentIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentTextCol: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  documentTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  documentMeta: {
    color: colors.textMuted,
    fontSize: 12,
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
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
  },
})
