import { Ionicons } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { fetchScheduleUbts } from '../../data/mockScheduleUbts'
import { RegistrationAddress } from '../../types/auth'
import { ScheduleUbtWithDistance } from '../../types/scheduleUbt'
import { colors } from '../../theme/colors'
import { formatDistanceKm, haversineDistanceKm } from '../../utils/geo'
import { getHomeCoordinatesFromAddress } from '../../utils/mockHomeLocation'
import {
  ScheduleCardCheck,
  ScheduleCardIcon,
  ScheduleSelectableCard,
} from './ScheduleSelectableCard'
import { ScheduleUbtListSkeleton } from './ScheduleStepSkeletons'
import { ScheduleUbtMap } from './ScheduleUbtMap'

type ScheduleUbtStepProps = {
  specialtyName: string
  userAddress: RegistrationAddress
  selectedId: string
  onSelect: (id: string, name: string) => void
}

export function ScheduleUbtStep({
  specialtyName,
  userAddress,
  selectedId,
  onSelect,
}: ScheduleUbtStepProps) {
  const [ubts, setUbts] = useState<ScheduleUbtWithDistance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const homeCoordinates = useMemo(
    () => getHomeCoordinatesFromAddress(userAddress),
    [userAddress],
  )

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setLoadError(null)

    void fetchScheduleUbts()
      .then((result) => {
        if (!active) return
        const withDistance = result
          .map((ubt) => ({
            ...ubt,
            distanceKm: haversineDistanceKm(homeCoordinates, {
              latitude: ubt.latitude,
              longitude: ubt.longitude,
            }),
          }))
          .sort((a, b) => a.distanceKm - b.distanceKm)

        setUbts(withDistance)
      })
      .catch(() => {
        if (!active) return
        setLoadError('Não foi possível carregar as UBTs.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [homeCoordinates])

  const closestUbtId = ubts[0]?.id

  function handleRetry() {
    setIsLoading(true)
    setLoadError(null)
    void fetchScheduleUbts()
      .then((result) => {
        const withDistance = result
          .map((ubt) => ({
            ...ubt,
            distanceKm: haversineDistanceKm(homeCoordinates, {
              latitude: ubt.latitude,
              longitude: ubt.longitude,
            }),
          }))
          .sort((a, b) => a.distanceKm - b.distanceKm)
        setUbts(withDistance)
      })
      .catch(() => setLoadError('Não foi possível carregar as UBTs.'))
      .finally(() => setIsLoading(false))
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Escolha a UBT</Text>
      <Text style={styles.description}>
        Para {specialtyName}, selecione a unidade mais conveniente. A distância é calculada a partir
        do seu endereço em {userAddress.neighborhood}, {userAddress.city}.
      </Text>

      {isLoading ? (
        <ScheduleUbtListSkeleton />
      ) : loadError ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable onPress={handleRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScheduleUbtMap
            home={homeCoordinates}
            ubts={ubts}
            selectedId={selectedId}
            onSelectUbt={(id) => {
              const ubt = ubts.find((item) => item.id === id)
              if (ubt) onSelect(ubt.id, ubt.name)
            }}
          />

          <View style={styles.list}>
            {ubts.map((ubt) => {
              const isSelected = ubt.id === selectedId
              const isClosest = ubt.id === closestUbtId

              return (
                <ScheduleSelectableCard
                  key={ubt.id}
                  selected={isSelected}
                  onPress={() => onSelect(ubt.id, ubt.name)}
                >
                  <ScheduleCardIcon selected={isSelected} icon="hospital-building" />
                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                        {ubt.name}
                      </Text>
                      {isClosest ? (
                        <View
                          style={[
                            styles.closestBadge,
                            isSelected && styles.closestBadgeSelected,
                          ]}
                        >
                          <Ionicons
                            name="navigate"
                            size={10}
                            color={isSelected ? '#fff' : colors.primaryLight}
                          />
                          <Text
                            style={[
                              styles.closestBadgeText,
                              isSelected && styles.closestBadgeTextSelected,
                            ]}
                          >
                            Mais próxima
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.cardMeta, isSelected && styles.cardMetaSelected]}>
                      {ubt.address} · {ubt.neighborhood}
                    </Text>
                    <View style={styles.distanceRow}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={isSelected ? 'rgba(255,255,255,0.85)' : colors.textMuted}
                      />
                      <Text style={[styles.distanceText, isSelected && styles.distanceTextSelected]}>
                        {formatDistanceKm(ubt.distanceKm)} da sua casa
                      </Text>
                    </View>
                  </View>
                  <ScheduleCardCheck selected={isSelected} />
                </ScheduleSelectableCard>
              )
            })}
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  errorWrap: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.35)',
  },
  retryText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    gap: 8,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  cardTitleSelected: {
    color: '#fff',
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  cardMetaSelected: {
    color: 'rgba(255, 255, 255, 0.82)',
  },
  closestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.35)',
  },
  closestBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  closestBadgeText: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closestBadgeTextSelected: {
    color: '#fff',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  distanceTextSelected: {
    color: 'rgba(255, 255, 255, 0.88)',
  },
})
