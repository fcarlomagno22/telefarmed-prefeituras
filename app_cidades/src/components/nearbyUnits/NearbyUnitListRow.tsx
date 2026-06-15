import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { colors } from '../../theme/colors'
import type { NearbyUbt } from '../../types/nearbyUnits'
import { formatNearbyUbtMeta, getServiceLabel } from '../../utils/nearbyUnits'

type NearbyUnitListRowProps = {
  ubt: NearbyUbt
  selected: boolean
  onPress: () => void
}

export function NearbyUnitListRow({ ubt, selected, onPress }: NearbyUnitListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <LinearGradient
        colors={['#1e1a14', '#18161c', '#14141a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={[...ACTION_ICON_PALETTES.nearbyUnits.iconGradient]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.icon}
          >
            <Text style={styles.iconText}>+</Text>
          </LinearGradient>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {ubt.name}
            </Text>
            <View style={[styles.badge, ubt.isOpenNow ? styles.badgeOpen : styles.badgeClosed]}>
              <Text style={styles.badgeText}>{ubt.isOpenNow ? 'Aberta' : 'Fechada'}</Text>
            </View>
          </View>

          <Text style={styles.address} numberOfLines={1}>
            {ubt.address} · {ubt.neighborhood}
          </Text>

          <Text style={styles.meta}>{formatNearbyUbtMeta(ubt)}</Text>

          <View style={styles.tagsRow}>
            {ubt.services.slice(0, 3).map((service) => (
              <Text key={service} style={styles.tag}>
                {getServiceLabel(service)}
              </Text>
            ))}
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={selected ? '#fbbf24' : colors.textSubtle}
        />
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardSelected: {
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  cardPressed: {
    opacity: 0.9,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  iconWrap: {
    shadowColor: ACTION_ICON_PALETTES.nearbyUnits.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  badgeClosed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  address: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  meta: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tag: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
})
