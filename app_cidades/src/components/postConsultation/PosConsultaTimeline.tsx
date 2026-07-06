import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { AppointmentPosConsultaCheckinItem } from '../../types/appointmentPostConsultation'
import { getEvolucaoBadge } from '../../utils/appointmentPostConsultation'

type PosConsultaTimelineProps = {
  checkins: AppointmentPosConsultaCheckinItem[]
  availableCheckinId: string | null
  onCheckinPress: (checkin: AppointmentPosConsultaCheckinItem) => void
}

function getTimelineCardColors(
  checkin: AppointmentPosConsultaCheckinItem,
  isAvailable: boolean,
) {
  const white = colors.cardBg

  if (isAvailable) {
    return {
      gradient: [white, white, 'rgba(14, 165, 233, 0.1)'] as const,
      border: 'rgba(14, 165, 233, 0.22)',
    }
  }

  if (checkin.status === 'respondido') {
    return {
      gradient: [white, white, 'rgba(16, 185, 129, 0.05)'] as const,
      border: 'rgba(16, 185, 129, 0.14)',
    }
  }

  if (checkin.status === 'expirado') {
    return {
      gradient: [white, white, 'rgba(245, 158, 11, 0.05)'] as const,
      border: 'rgba(245, 158, 11, 0.14)',
    }
  }

  return {
    gradient: [white, white, 'rgba(0, 0, 0, 0.02)'] as const,
    border: colors.surfaceBorder,
  }
}

function getStatusMeta(checkin: AppointmentPosConsultaCheckinItem, isAvailable: boolean) {
  if (checkin.status === 'respondido') {
    return {
      dotColor: '#10b981',
      title: checkin.respondedAtLabel ?? `Check-in ${checkin.checkinNumber}`,
      subtitle: checkin.summary,
      actionLabel: 'Ver resposta',
    }
  }

  if (isAvailable) {
    return {
      dotColor: '#0284c7',
      title: `Check-in ${checkin.checkinNumber} · disponível agora`,
      subtitle: 'Questionário rápido · cerca de 2 minutos',
      actionLabel: null,
    }
  }

  if (checkin.status === 'expirado') {
    return {
      dotColor: '#f59e0b',
      title: `Check-in ${checkin.checkinNumber} · não respondido`,
      subtitle: checkin.scheduledDateLabel
        ? `Previsto para ${checkin.scheduledDateLabel}`
        : 'Prazo encerrado',
      actionLabel: null,
    }
  }

  return {
    dotColor: colors.textSubtle,
    title: `Check-in ${checkin.checkinNumber}`,
    subtitle: checkin.scheduledDateLabel
      ? `Previsto para ${checkin.scheduledDateLabel}`
      : 'Aguardando data',
    actionLabel: null,
  }
}

export function PosConsultaTimeline({
  checkins,
  availableCheckinId,
  onCheckinPress,
}: PosConsultaTimelineProps) {
  return (
    <View style={styles.root}>
      {checkins.map((checkin, index) => {
        const isAvailable = checkin.id === availableCheckinId
        const meta = getStatusMeta(checkin, isAvailable)
        const cardColors = getTimelineCardColors(checkin, isAvailable)
        const evolucaoBadge = checkin.evolucaoComparacao
          ? getEvolucaoBadge(checkin.evolucaoComparacao)
          : null
        const isLast = index === checkins.length - 1
        const pressable = checkin.status === 'respondido' || isAvailable

        return (
          <View key={checkin.id} style={styles.itemRow}>
            <View style={styles.railCol}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: meta.dotColor },
                  isAvailable && styles.dotAvailable,
                ]}
              >
                <Text style={styles.dotText}>{checkin.checkinNumber}</Text>
              </View>
              {!isLast ? <View style={styles.connector} /> : null}
            </View>

            <Pressable
              disabled={!pressable}
              onPress={() => onCheckinPress(checkin)}
              style={({ pressed }) => [
                styles.cardWrap,
                pressed && pressable && styles.cardPressed,
              ]}
            >
              <LinearGradient
                colors={[...cardColors.gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[
                  styles.card,
                  { borderColor: cardColors.border },
                  isAvailable && styles.cardAvailable,
                ]}
              >
                {isAvailable ? (
                  <>
                    <MaterialCommunityIcons
                      name="clipboard-check-outline"
                      size={20}
                      color="#0369a1"
                    />
                    <View style={styles.availableTextCol}>
                      <Text style={styles.availableTitle}>{meta.title}</Text>
                      {meta.subtitle ? (
                        <Text style={styles.availableSubtitle}>{meta.subtitle}</Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#0369a1" />
                  </>
                ) : (
                  <>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{meta.title}</Text>
                      {evolucaoBadge ? (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: evolucaoBadge.background },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: evolucaoBadge.text }]}>
                            {evolucaoBadge.label}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {meta.subtitle ? (
                      <Text style={styles.cardSubtitle}>{meta.subtitle}</Text>
                    ) : null}

                    {meta.actionLabel ? (
                      <View style={styles.actionRow}>
                        <Text style={styles.actionText}>{meta.actionLabel}</Text>
                        <Ionicons name="chevron-forward" size={14} color="#0369a1" />
                      </View>
                    ) : null}
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: 0,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
  },
  railCol: {
    width: 28,
    alignItems: 'center',
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
  },
  dotAvailable: {
    borderColor: '#fff',
    shadowColor: 'rgba(14, 165, 233, 0.35)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  dotText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.surfaceBorder,
    marginTop: 4,
    marginBottom: -4,
    borderRadius: 999,
  },
  cardWrap: {
    flex: 1,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  card: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: colors.cardBg,
    gap: 6,
  },
  cardAvailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  availableTextCol: {
    flex: 1,
    gap: 2,
  },
  availableTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  availableSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  actionText: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '700',
  },
})
