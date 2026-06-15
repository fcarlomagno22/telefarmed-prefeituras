import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppointmentQuickAction } from '../appointments/AppointmentQuickAction'
import { PrimaryButton } from '../PrimaryButton'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { colors } from '../../theme/colors'
import type { NearbyUbt } from '../../types/nearbyUnits'
import { formatNearbyUbtMeta, getServiceLabel } from '../../utils/nearbyUnits'

type NearbyUnitDetailPanelProps = {
  ubt: NearbyUbt
  onDirections: () => void
  onCall: () => void
  onSchedule: () => void
  onClose: () => void
}

export function NearbyUnitDetailPanel({
  ubt,
  onDirections,
  onCall,
  onSchedule,
  onClose,
}: NearbyUnitDetailPanelProps) {
  return (
    <View style={styles.wrap}>
      {ubt.imageUrl ? (
        <Image source={{ uri: ubt.imageUrl }} style={styles.heroImage} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={['rgba(245, 158, 11, 0.25)', 'rgba(14, 14, 20, 0.6)']}
          style={styles.heroFallback}
        />
      )}

      <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar detalhes">
        <Ionicons name="close" size={18} color={colors.text} />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <LinearGradient
            colors={[...ACTION_ICON_PALETTES.nearbyUnits.iconGradient]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.icon}
          >
            <Text style={styles.iconText}>+</Text>
          </LinearGradient>

          <View style={styles.titleCol}>
            <Text style={styles.name}>{ubt.name}</Text>
            <Text style={styles.meta}>{formatNearbyUbtMeta(ubt)}</Text>
          </View>

          <View style={[styles.badge, ubt.isOpenNow ? styles.badgeOpen : styles.badgeClosed]}>
            <Text style={styles.badgeText}>{ubt.isOpenNow ? 'Aberta agora' : 'Fechada'}</Text>
          </View>
        </View>

        <Text style={styles.address}>
          {ubt.address}, {ubt.neighborhood}
        </Text>
        <Text style={styles.addressMuted}>
          {ubt.city} - {ubt.state}
        </Text>
        <Text style={styles.hours}>{ubt.openingHours}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{ubt.walkMinutes} min</Text>
            <Text style={styles.statLabel}>a pé</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{ubt.driveMinutes} min</Text>
            <Text style={styles.statLabel}>de carro</Text>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {ubt.services.map((service) => (
            <View key={service} style={styles.tag}>
              <Text style={styles.tagText}>{getServiceLabel(service)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.quickActions}>
          <AppointmentQuickAction
            label="Como chegar"
            icon="map-marker-radius"
            palette={ACTION_ICON_PALETTES.nearbyUnits}
            onPress={onDirections}
          />

          {ubt.phone ? (
            <AppointmentQuickAction
              label="Ligar"
              icon="phone-outline"
              palette={ACTION_ICON_PALETTES.myAppointments}
              onPress={onCall}
            />
          ) : null}
        </View>

        <PrimaryButton label="Agendar nesta unidade" onPress={onSchedule} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 0,
  },
  heroImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  heroFallback: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 10, 12, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    padding: 16,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  titleCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  meta: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  address: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  addressMuted: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  hours: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },
  tagText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 4,
  },
})
