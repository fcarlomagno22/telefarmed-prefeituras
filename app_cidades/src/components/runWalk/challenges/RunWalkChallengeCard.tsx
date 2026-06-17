import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, Share, StyleSheet, Text, View } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../../theme/actionIconColors'
import { colors } from '../../../theme/colors'
import type { RunWalkChallenge } from '../../../types/runWalkChallenges'
import { AppointmentActionButton } from '../../appointments/AppointmentActionButton'

const PARTICIPATE_PALETTE = ACTION_ICON_PALETTES.myAppointments
const RULES_PALETTE = ACTION_ICON_PALETTES.myGoals
const INVITE_PALETTE = {
  iconGradient: ['#fbcfe8', '#ec4899', '#db2777'] as const,
  shadowColor: 'rgba(236, 72, 153, 0.45)',
}

type RunWalkChallengeCardProps = {
  challenge: RunWalkChallenge
  isJoined: boolean
  onParticipate: () => void
  onRulesPress: () => void
}

function formatParticipants(count: number) {
  return count.toLocaleString('pt-BR')
}

export function RunWalkChallengeCard({
  challenge,
  isJoined,
  onParticipate,
  onRulesPress,
}: RunWalkChallengeCardProps) {
  const remainingUnits = Math.max(0, challenge.totalUnits - challenge.completedUnits)
  const progressRatio = Math.min(1, challenge.completedUnits / Math.max(challenge.totalUnits, 1))

  async function handleInvite() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      await Share.share({
        message: `Bora participar do desafio "${challenge.title}" comigo no Telefarmed? ${challenge.subtitle}`,
      })
    } catch {
      // usuário cancelou o compartilhamento
    }
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(236, 72, 153, 0.16)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {isJoined ? (
          <View style={styles.joinedBadge}>
            <MaterialCommunityIcons name="check-decagram" size={12} color="#fbcfe8" />
            <Text style={styles.joinedBadgeText}>No seu painel</Text>
          </View>
        ) : null}

        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={styles.subtitle}>{challenge.subtitle}</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{challenge.completedUnits}</Text>
            <Text style={styles.statLabel}>{challenge.unitLabel} concluídos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{remainingUnits}</Text>
            <Text style={styles.statLabel}>faltam</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{challenge.remainingDays}</Text>
            <Text style={styles.statLabel}>dias restantes</Text>
          </View>
        </View>

        <View style={styles.participantsRow}>
          <Ionicons name="people-outline" size={14} color="#f9a8d4" />
          <Text style={styles.participantsText}>
            {formatParticipants(challenge.participantsCount)} participantes
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <AppointmentActionButton
            label={isJoined ? 'Participando' : 'Participar'}
            icon={isJoined ? 'check' : 'account-plus-outline'}
            palette={PARTICIPATE_PALETTE}
            onPress={onParticipate}
          />
          <AppointmentActionButton
            label="Ver regras"
            icon="file-document-outline"
            palette={RULES_PALETTE}
            onPress={onRulesPress}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Convidar"
          onPress={handleInvite}
          style={({ pressed }) => [styles.inviteButton, pressed && styles.inviteButtonPressed]}
        >
          <LinearGradient
            colors={[...INVITE_PALETTE.iconGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.inviteGradient}
          >
            <MaterialCommunityIcons name="share-variant-outline" size={16} color="#fff" />
            <Text style={styles.inviteLabel}>Convidar</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.28)',
    padding: 14,
    gap: 10,
  },
  joinedBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.28)',
  },
  joinedBadgeText: {
    color: '#fbcfe8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#ec4899',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 2,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 13,
    textAlign: 'center',
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantsText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inviteButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  inviteButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  inviteGradient: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  inviteLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
})
