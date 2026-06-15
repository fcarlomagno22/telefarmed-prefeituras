import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { colors } from '../../theme/colors'
import type { NearbyUbt } from '../../types/nearbyUnits'
import { formatNearbyUbtMeta } from '../../utils/nearbyUnits'

type NearbyUnitsCollapsedPeekProps = {
  ubt: NearbyUbt
  totalCount: number
  onPress: () => void
  onExpandList: () => void
}

export function NearbyUnitsCollapsedPeek({
  ubt,
  totalCount,
  onPress,
  onExpandList,
}: NearbyUnitsCollapsedPeekProps) {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <LinearGradient
          colors={[...ACTION_ICON_PALETTES.nearbyUnits.iconGradient]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.icon}
        >
          <Text style={styles.iconText}>+</Text>
        </LinearGradient>

        <View style={styles.textCol}>
          <Text style={styles.kicker}>Mais próxima</Text>
          <Text style={styles.name} numberOfLines={1}>
            {ubt.name}
          </Text>
          <Text style={styles.meta}>{formatNearbyUbtMeta(ubt)}</Text>
        </View>

        <View style={[styles.badge, ubt.isOpenNow ? styles.badgeOpen : styles.badgeClosed]}>
          <Text style={styles.badgeText}>{ubt.isOpenNow ? 'Aberta' : 'Fechada'}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
      </Pressable>

      <Pressable onPress={onExpandList} style={styles.hintRow}>
        <Ionicons name="chevron-up" size={14} color={colors.textSubtle} />
        <Text style={styles.hintText}>
          Arraste para ver {totalCount} unidade{totalCount === 1 ? '' : 's'}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  pressed: {
    opacity: 0.9,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  textCol: {
    flex: 1,
    gap: 1,
  },
  kicker: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  name: {
    color: colors.text,
    fontSize: 14,
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
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 4,
  },
  hintText: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
  },
})
