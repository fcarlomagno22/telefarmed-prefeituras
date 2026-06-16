import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { colors } from '../../theme/colors'
import type { TodayActivity } from '../../types/runWalk'
import { AppointmentActionButton } from '../appointments/AppointmentActionButton'

const PALETTE = ACTION_ICON_PALETTES.runWalk

type RunWalkTodayActivityCardProps = {
  activity: TodayActivity
  onStartPress: () => void
  onDetailsPress: () => void
  onMenuPress: () => void
}

function getActivityIcon(type: TodayActivity['type']) {
  if (type === 'walk') return 'walk'
  if (type === 'run') return 'run-fast'
  return 'run'
}

export function RunWalkTodayActivityCard({
  activity,
  onStartPress,
  onDetailsPress,
  onMenuPress,
}: RunWalkTodayActivityCardProps) {
  function handleMenu() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onMenuPress()
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[
          'rgba(239, 68, 68, 0.28)',
          'rgba(220, 38, 38, 0.12)',
          'rgba(14, 14, 20, 0.98)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="calendar-today" size={12} color="#fca5a5" />
            <Text style={styles.badgeText}>Atividade de hoje</Text>
          </View>

          <Pressable
            onPress={handleMenu}
            style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Mais opções"
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={[...PALETTE.iconGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <MaterialCommunityIcons
                name={getActivityIcon(activity.type)}
                size={22}
                color="#fff"
              />
            </LinearGradient>
          </View>

          <View style={styles.titleCol}>
            <Text style={styles.title}>{activity.title}</Text>
            <Text style={styles.meta}>
              {activity.durationMinutes} minutos · {activity.intensityLabel}
            </Text>
          </View>
        </View>

        <View style={styles.goalRow}>
          <Ionicons name="flag-outline" size={14} color="#fca5a5" />
          <Text style={styles.goalText}>
            Objetivo: <Text style={styles.goalHighlight}>{activity.goal}</Text>
          </Text>
        </View>

        <View style={styles.structureBlock}>
          <Text style={styles.structureTitle}>Estrutura</Text>
          {activity.structure.map((step, index) => (
            <View key={`${step.label}-${index}`} style={styles.structureRow}>
              <View style={styles.structureDot} />
              <Text style={styles.structureText}>{step.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionsRow}>
          <AppointmentActionButton
            label="Iniciar atividade"
            icon="play"
            palette={PALETTE}
            onPress={onStartPress}
          />
          <AppointmentActionButton
            label="Ver detalhes"
            icon="information-outline"
            palette={ACTION_ICON_PALETTES.myGoals}
            onPress={onDetailsPress}
          />
        </View>
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
    borderColor: 'rgba(239, 68, 68, 0.32)',
    padding: 14,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.28)',
  },
  badgeText: {
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuBtnPressed: {
    opacity: 0.85,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    shadowColor: PALETTE.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  goalText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  goalHighlight: {
    color: colors.text,
    fontWeight: '700',
  },
  structureBlock: {
    gap: 6,
    paddingTop: 4,
    paddingBottom: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  structureTitle: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  structureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  structureDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fca5a5',
    marginTop: 6,
  },
  structureText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 2,
  },
})
