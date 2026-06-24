import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Linking, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { RemoteCareRequest } from '../../types/remoteCareRequest'
import { PrimaryButton } from '../PrimaryButton'

type RemoteCareRequestCardProps = {
  request: RemoteCareRequest
}

function formatRequestDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusMeta(status: RemoteCareRequest['status']) {
  if (status === 'approved') {
    return {
      label: 'Aprovado',
      background: 'rgba(16, 185, 129, 0.14)',
      border: 'rgba(16, 185, 129, 0.35)',
      text: '#6ee7b7',
      gradient: [
        'rgba(16, 185, 129, 0.18)',
        'rgba(16, 185, 129, 0.06)',
        'rgba(14, 14, 20, 0.95)',
      ] as const,
      cardBorder: 'rgba(16, 185, 129, 0.32)',
    }
  }

  return {
    label: 'Em análise',
    background: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.35)',
    text: '#fde68a',
    gradient: [
      'rgba(245, 158, 11, 0.16)',
      'rgba(245, 158, 11, 0.05)',
      'rgba(14, 14, 20, 0.95)',
    ] as const,
    cardBorder: 'rgba(245, 158, 11, 0.28)',
  }
}

export function RemoteCareRequestCard({ request }: RemoteCareRequestCardProps) {
  const statusMeta = getStatusMeta(request.status)
  const isApproved = request.status === 'approved'

  async function handleOpenTeleconsultation() {
    if (!request.teleconsultationLink) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const canOpen = await Linking.canOpenURL(request.teleconsultationLink)
    if (canOpen) {
      await Linking.openURL(request.teleconsultationLink)
    }
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[...statusMeta.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: statusMeta.cardBorder }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <View style={styles.modeRow}>
              <Ionicons name="phone-portrait-outline" size={16} color={colors.primaryLight} />
              <Text style={styles.modeLabel}>Consulta online</Text>
            </View>
            <Text style={styles.title}>Atendimento pelo celular</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusMeta.background,
                borderColor: statusMeta.border,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusMeta.text }]}>{statusMeta.label}</Text>
          </View>
        </View>

        <Text style={styles.reason} numberOfLines={2}>
          {request.reason}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="document-text-outline" size={14} color={colors.textSubtle} />
          <Text style={styles.metaText}>Protocolo {request.protocol}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSubtle} />
          <Text style={styles.metaText}>Solicitado em {formatRequestDate(request.createdAt)}</Text>
        </View>

        {isApproved ? (
          <View style={styles.approvedBox}>
            <Ionicons name="checkmark-circle" size={18} color="#6ee7b7" />
            <Text style={styles.approvedText}>
              Seu pedido foi aprovado. Use o link abaixo para entrar na teleconsulta quando estiver
              no horário combinado.
            </Text>
          </View>
        ) : (
          <View style={styles.reviewBox}>
            <Ionicons name="hourglass-outline" size={18} color="#fde68a" />
            <Text style={styles.reviewText}>
              Nossa equipe está analisando seu pedido. Você recebe a resposta por aqui em breve.
            </Text>
          </View>
        )}

        {isApproved && request.teleconsultationLink ? (
          <PrimaryButton
            label={request.teleconsultationLabel ?? 'Entrar na teleconsulta'}
            onPress={() => void handleOpenTeleconsultation()}
            style={styles.actionBtn}
          />
        ) : null}
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
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleCol: {
    flex: 1,
    gap: 4,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeLabel: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexShrink: 0,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  reason: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    flex: 1,
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  reviewBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.18)',
  },
  reviewText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  approvedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.18)',
  },
  approvedText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  actionBtn: {
    marginTop: 2,
  },
})
