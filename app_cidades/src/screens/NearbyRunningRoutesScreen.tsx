import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { NearbyRunningRouteSpotDrawer } from '../components/runWalk/nearbyRoutes/NearbyRunningRouteSpotDrawer'
import { NearbyRunningRoutesMap } from '../components/runWalk/nearbyRoutes/NearbyRunningRoutesMap'
import { NearbyRunningRoutesSafetyBanner } from '../components/runWalk/nearbyRoutes/NearbyRunningRoutesSafetyBanner'
import { SubmitRunningRouteSpotDrawer } from '../components/runWalk/nearbyRoutes/SubmitRunningRouteSpotDrawer'
import { useAuth } from '../contexts/AuthContext'
import { useGuestAuth } from '../contexts/GuestAuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { useRunningRoutesOrigin } from '../hooks/useRunningRoutesOrigin'
import { colors } from '../theme/colors'
import type { RunningRouteSpot } from '../types/nearbyRunningRoutes'
import { fetchNearbyRunningRoutes } from '../utils/nearbyRunningRoutes'

export function NearbyRunningRoutesScreen() {
  const insets = useSafeAreaInsets()
  const { user, goBack } = useAuth()
  const { requireAuth } = useGuestAuth()

  const address = user?.address ?? {
    cep: '',
    street: '',
    neighborhood: '',
    city: 'São Paulo',
    state: 'SP',
    number: '',
    complement: '',
  }

  const { origin, isLocating, locationError, refreshLocation } = useRunningRoutesOrigin({
    address,
  })

  const [spots, setSpots] = useState<RunningRouteSpot[]>([])
  const [isLoadingSpots, setIsLoadingSpots] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [submitDrawerVisible, setSubmitDrawerVisible] = useState(false)

  const loadSpots = useCallback(async () => {
    if (!origin) return

    setIsLoadingSpots(true)
    try {
      const result = await fetchNearbyRunningRoutes(origin)
      setSpots(result)
    } finally {
      setIsLoadingSpots(false)
    }
  }, [origin])

  useEffect(() => {
    void loadSpots()
  }, [loadSpots])

  const selectedSpot = spots.find((spot) => spot.id === selectedId) ?? null
  const patientCpf = user?.cpf ?? 'guest'
  const userName = user?.name?.split(' ')[0] ?? 'Você'

  function handleSelectSpot(id: string) {
    requireAuth('vida:run-walk', () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setSelectedId(id)
      setDrawerVisible(true)
    })
  }

  function handleCloseDrawer() {
    setDrawerVisible(false)
    setSelectedId(null)
  }

  function handleBack() {
    if (submitDrawerVisible) {
      setSubmitDrawerVisible(false)
      return true
    }
    if (drawerVisible) {
      handleCloseDrawer()
      return true
    }
    goBack()
    return true
  }

  function handleOpenSubmit() {
    requireAuth('vida:run-walk', () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setSubmitDrawerVisible(true)
    })
  }

  useAndroidBackHandler(handleBack)

  const isBusy = isLocating || isLoadingSpots

  return (
    <View style={styles.root}>
      {origin ? (
        <NearbyRunningRoutesMap
          origin={origin}
          spots={spots}
          selectedId={selectedId}
          profilePhotoUri={user?.selfieUri}
          onSelectSpot={handleSelectSpot}
        />
      ) : null}

      <View style={[styles.overlayTop, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['rgba(10, 10, 12, 0.92)', 'rgba(10, 10, 12, 0.75)', 'rgba(10, 10, 12, 0)']}
          style={styles.headerGradient}
        >
          <ScreenStackHeader
            title="Locais para correr"
            subtitle="Cadastros da comunidade perto de você"
            paddingTop={8}
            onBack={handleBack}
          />

          <NearbyRunningRoutesSafetyBanner />

          {locationError ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void refreshLocation()}
              style={styles.locationError}
            >
              <Text style={styles.locationErrorText}>{locationError} Toque para tentar novamente.</Text>
            </Pressable>
          ) : null}

          {!isBusy && spots.length === 0 ? (
            <View style={styles.emptyChip}>
              <Text style={styles.emptyChipText}>
                Nenhum local cadastrado ainda. Seja o primeiro a compartilhar um lugar.
              </Text>
            </View>
          ) : null}

          {!isBusy && spots.length > 0 ? (
            <View style={styles.spotsChip}>
              <Text style={styles.spotsChipText}>
                {spots.length} {spots.length === 1 ? 'local encontrado' : 'locais encontrados'} perto de você
              </Text>
            </View>
          ) : null}
        </LinearGradient>
      </View>

      {isBusy ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#ff8533" size="large" />
          <Text style={styles.loadingText}>
            {isLocating ? 'Obtendo sua localização...' : 'Carregando locais da comunidade...'}
          </Text>
        </View>
      ) : null}

      {!isBusy ? (
        <View style={[styles.fabWrap, { bottom: insets.bottom + 20 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cadastrar local para corrida"
            onPress={handleOpenSubmit}
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          >
            <LinearGradient
              colors={['#ff8533', '#ff6b00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Text style={styles.fabText}>+ Cadastrar local</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}

      <SubmitRunningRouteSpotDrawer
        visible={submitDrawerVisible}
        patientCpf={patientCpf}
        patientName={user?.name ?? 'Usuário'}
        defaultAddress={address}
        onClose={() => setSubmitDrawerVisible(false)}
        onSubmitted={() => void loadSpots()}
      />

      <NearbyRunningRouteSpotDrawer
        visible={drawerVisible}
        spot={selectedSpot}
        patientCpf={patientCpf}
        userName={userName}
        onClose={handleCloseDrawer}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    paddingBottom: 12,
  },
  locationError: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  locationErrorText: {
    color: '#fecaca',
    fontSize: 12,
    lineHeight: 17,
  },
  spotsChip: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 107, 0, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  spotsChipText: {
    color: '#ffcc99',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 10, 12, 0.35)',
    zIndex: 5,
    gap: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  emptyChip: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  emptyChipText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  fabWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 12,
  },
  fab: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  fabPressed: {
    opacity: 0.92,
  },
  fabGradient: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  fabText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
})
