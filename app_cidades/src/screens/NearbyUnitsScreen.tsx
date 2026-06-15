import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppointmentDirectionsDrawer } from '../components/appointments/AppointmentDirectionsDrawer'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { MenuDrawer } from '../components/MenuDrawer'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { NearbyUnitsBottomSheet, NearbySheetSnap } from '../components/nearbyUnits/NearbyUnitsBottomSheet'
import { NearbyUnitsFilterChips } from '../components/nearbyUnits/NearbyUnitsFilterChips'
import { NearbyUnitsMap } from '../components/nearbyUnits/NearbyUnitsMap'
import { NearbyUnitsOriginToggle } from '../components/nearbyUnits/NearbyUnitsOriginToggle'
import { NearbyUnitsSearchBar } from '../components/nearbyUnits/NearbyUnitsSearchBar'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { useNearbyOrigin } from '../hooks/useNearbyOrigin'
import { colors } from '../theme/colors'
import type { NearbyUnitsFilter } from '../types/nearbyUnits'
import type { NearbyUbt } from '../types/nearbyUnits'
import { openAppointmentDirections, NavigationApp } from '../utils/appointmentMaps'
import { fetchNearbyUbts, filterNearbyUbts } from '../utils/nearbyUnits'
import { setScheduleUbtPrefill } from '../utils/schedulePrefill'

const TAB_BAR_ESTIMATED_HEIGHT = 78

export function NearbyUnitsScreen() {
  const insets = useSafeAreaInsets()
  const { user, goBack, navigateTo, logout } = useAuth()

  const [ubts, setUbts] = useState<NearbyUbt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<NearbyUnitsFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetSnap, setSheetSnap] = useState<NearbySheetSnap>('collapsed')
  const [directionsTarget, setDirectionsTarget] = useState<NearbyUbt | null>(null)
  const [directionsVisible, setDirectionsVisible] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)

  const address = user?.address ?? {
    cep: '',
    street: '',
    neighborhood: '',
    city: 'São Paulo',
    state: 'SP',
    number: '',
    complement: '',
  }

  const { mode, origin, isLocating, selectMode } = useNearbyOrigin({ address })

  const loadUbts = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await fetchNearbyUbts(origin)
      setUbts(result)
    } finally {
      setIsLoading(false)
    }
  }, [origin])

  useEffect(() => {
    void loadUbts()
  }, [loadUbts])

  const filteredUbts = useMemo(
    () => filterNearbyUbts(ubts, searchQuery, filter),
    [ubts, searchQuery, filter],
  )

  function handleSelectUbt(id: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedId(id)
    setSheetSnap('expanded')
  }

  function handleCloseDetail() {
    setSelectedId(null)
    setSheetSnap('mid')
  }

  const handleSheetSnapChange = useCallback((snap: NearbySheetSnap) => {
    setSheetSnap(snap)
    if (snap === 'collapsed') {
      setSelectedId(null)
    }
  }, [])

  function handleExpandList() {
    setSelectedId(null)
    setSheetSnap('mid')
  }

  function handleShowMap() {
    setSelectedId(null)
    setSheetSnap('collapsed')
  }

  function openDirectionsDrawer(ubt: NearbyUbt) {
    setDirectionsTarget(ubt)
    setDirectionsVisible(true)
  }

  function closeDirectionsDrawer() {
    setDirectionsVisible(false)
    setDirectionsTarget(null)
  }

  async function handleSelectNavigationApp(app: NavigationApp) {
    if (!directionsTarget) return
    await openAppointmentDirections(directionsTarget.id, app)
    closeDirectionsDrawer()
  }

  function handleSchedule(ubt: NearbyUbt) {
    setScheduleUbtPrefill({
      ubtId: ubt.id,
      ubtName: ubt.name,
      ubtAddress: `${ubt.address} · ${ubt.neighborhood}`,
    })
    navigateTo('schedule-appointment')
  }

  async function handleCall(ubt: NearbyUbt) {
    if (!ubt.phone) return
    const phone = ubt.phone.replace(/\D/g, '')
    await Linking.openURL(`tel:${phone}`)
  }

  function handleBack() {
    if (sheetSnap === 'expanded' || selectedId) {
      handleCloseDetail()
      return true
    }
    if (sheetSnap === 'mid') {
      handleShowMap()
      return true
    }
    goBack()
    return true
  }

  useAndroidBackHandler(handleBack)

  function handleTabPress(tab: BottomTabId) {
    if (tab === 'menu') {
      setMenuVisible(true)
      return
    }
    if (tab === 'agendar') {
      navigateTo('schedule-appointment')
      return
    }
    if (tab === 'my-metrics') {
      navigateTo('my-metrics')
      return
    }
    if (tab === 'pos-consulta') {
      navigateTo('post-consultation')
      return
    }
    if (tab === 'home') {
      goBack()
    }
  }

  function handleLogout() {
    setMenuVisible(false)
    void logout()
  }

  return (
    <View style={styles.root}>
      <NearbyUnitsMap
        origin={origin}
        ubts={filteredUbts}
        selectedId={selectedId}
        onSelectUbt={handleSelectUbt}
      />

      <View style={[styles.overlayTop, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['rgba(10, 10, 12, 0.92)', 'rgba(10, 10, 12, 0.75)', 'rgba(10, 10, 12, 0)']}
          style={styles.headerGradient}
        >
          <ScreenStackHeader
            title="Unidades Próximas"
            subtitle="Encontre a UBT mais perto de você"
            paddingTop={8}
            onBack={goBack}
          />

          <NearbyUnitsOriginToggle
            mode={mode}
            label={origin.label}
            isLocating={isLocating}
            onSelectMode={selectMode}
          />

          <NearbyUnitsSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />

          <NearbyUnitsFilterChips
            filter={filter}
            sheetSnap={sheetSnap}
            onFilterChange={setFilter}
            onExpandList={handleExpandList}
            onShowMap={handleShowMap}
          />
        </LinearGradient>
      </View>

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#fbbf24" size="large" />
        </View>
      ) : null}

      <NearbyUnitsBottomSheet
        ubts={filteredUbts}
        selectedId={selectedId}
        sheetSnap={sheetSnap}
        tabBarHeight={TAB_BAR_ESTIMATED_HEIGHT}
        onSelectUbt={handleSelectUbt}
        onSheetSnapChange={handleSheetSnapChange}
        onDirections={openDirectionsDrawer}
        onCall={handleCall}
        onSchedule={handleSchedule}
        onCloseDetail={handleCloseDetail}
      />

      <View style={styles.tabBar}>
        <BottomTabBar activeTab="home" onTabPress={handleTabPress} />
      </View>

      <MenuDrawer
        visible={menuVisible}
        userName={user?.name}
        selfieUri={user?.selfieUri}
        onClose={() => setMenuVisible(false)}
        onLogoutPress={handleLogout}
      />

      <AppointmentDirectionsDrawer
        visible={directionsVisible}
        destination={
          directionsTarget
            ? { ubtId: directionsTarget.id, ubtName: directionsTarget.name }
            : null
        }
        onClose={closeDirectionsDrawer}
        onSelectApp={(app) => void handleSelectNavigationApp(app)}
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 10, 12, 0.25)',
    zIndex: 5,
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
})
