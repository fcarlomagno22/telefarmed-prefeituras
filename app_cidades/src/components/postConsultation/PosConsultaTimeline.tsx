import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { AppointmentPosConsultaCheckinItem } from '../../types/appointmentPostConsultation'
import { getEvolucaoBadge } from '../../utils/appointmentPostConsultation'

const AVAILABLE_GRADIENT = ['#7dd3fc', '#0ea5e9', '#0284c7'] as const

type PosConsultaTimelineProps = {
  checkins: AppointmentPosConsultaCheckinItem[]
  availableCheckinId: string | null
  onCheckinPress: (checkin: AppointmentPosConsultaCheckinItem) => void
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
    dotColor: 'rgba(255, 255, 255, 0.2)',
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
                !isAvailable && styles.card,
                isAvailable && styles.cardAvailableWrap,
                pressed && pressable && styles.cardPressed,
              ]}
            >
              {isAvailable ? (
                <LinearGradient
                  colors={[...AVAILABLE_GRADIENT]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  <MaterialCommunityIcons
                    name="clipboard-check-outline"
                    size={20}
                    color="#fff"
                  />
                  <View style={styles.availableTextCol}>
                    <Text style={styles.availableTitle}>{meta.title}</Text>
                    {meta.subtitle ? (
                      <Text style={styles.availableSubtitle}>{meta.subtitle}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </LinearGradient>
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
                      <Ionicons name="chevron-forward" size={14} color="#7dd3fc" />
                    </View>
                  ) : null}
                </>
              )}
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
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dotAvailable: {
    borderColor: '#fff',
    shadowColor: 'rgba(14, 165, 233, 0.5)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 4,
    marginBottom: -4,
    borderRadius: 999,
  },
  cardWrap: {
    flex: 1,
    marginBottom: 12,
  },
  card: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: 6,
  },
  cardAvailableWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  availableTextCol: {
    flex: 1,
    gap: 2,
  },
  availableTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  availableSubtitle: {
    color: 'rgba(255, 255, 255, 0.82)',
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
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '700',
  },
})
