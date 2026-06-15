import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { colors } from '../../theme/colors'
import type { NearbyUbt } from '../../types/nearbyUnits'
import { formatNearbyUbtMeta } from '../../utils/nearbyUnits'

type NearbyUnitsFloatingCardProps = {
  ubt: NearbyUbt
  isNearest: boolean
  onPress: () => void
  onDirections: () => void
  onSchedule: () => void
}

export function NearbyUnitsFloatingCard({
  ubt,
  isNearest,
  onPress,
  onDirections,
  onSchedule,
}: NearbyUnitsFloatingCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <LinearGradient
        colors={['rgba(20, 20, 26, 0.95)', 'rgba(14, 14, 20, 0.92)']}
        style={styles.card}
      >
        <View style={styles.headerRow}>
          <LinearGradient
            colors={[...ACTION_ICON_PALETTES.nearbyUnits.iconGradient]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.icon}
          >
            <Text style={styles.iconText}>+</Text>
          </LinearGradient>

          <View style={styles.textCol}>
            {isNearest ? <Text style={styles.kicker}>Mais próxima</Text> : null}
            <Text style={styles.name} numberOfLines={1}>
              {ubt.name}
            </Text>
            <Text style={styles.meta}>{formatNearbyUbtMeta(ubt)}</Text>
          </View>

          <View style={[styles.badge, ubt.isOpenNow ? styles.badgeOpen : styles.badgeClosed]}>
            <Text style={styles.badgeText}>{ubt.isOpenNow ? 'Aberta' : 'Fechada'}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={(event) => {
              event.stopPropagation()
              onDirections()
            }}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          >
            <Ionicons name="navigate-outline" size={16} color="#fbbf24" />
            <Text style={styles.actionText}>Como chegar</Text>
          </Pressable>

          <Pressable
            onPress={(event) => {
              event.stopPropagation()
              onSchedule()
            }}
            style={({ pressed }) => [styles.actionBtnPrimary, pressed && styles.actionBtnPressed]}
          >
            <Ionicons name="calendar-outline" size={16} color="#fff" />
            <Text style={styles.actionTextPrimary}>Agendar</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    padding: 14,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeClosed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.85)',
  },
  actionBtnPressed: {
    opacity: 0.88,
  },
  actionText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
  },
  actionTextPrimary: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
})
