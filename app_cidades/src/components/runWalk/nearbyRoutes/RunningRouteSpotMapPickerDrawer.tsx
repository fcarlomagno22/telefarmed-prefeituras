import * as Location from 'expo-location'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import { resolveAddressLabelFromCoordinates } from '../../../utils/runningRouteGeocoding'
import { PrimaryButton } from '../../PrimaryButton'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'
import { RunningRouteSpotPickerMap } from './RunningRouteSpotPickerMap'

type RunningRouteSpotMapPickerDrawerProps = {
  visible: boolean
  fallbackLatitude: number
  fallbackLongitude: number
  initialPin?: { latitude: number; longitude: number } | null
  onClose: () => void
  onConfirm: (result: {
    latitude: number
    longitude: number
    addressLabel: string
  }) => void
}

export function RunningRouteSpotMapPickerDrawer({
  visible,
  fallbackLatitude,
  fallbackLongitude,
  initialPin = null,
  onClose,
  onConfirm,
}: RunningRouteSpotMapPickerDrawerProps) {
  const [pickedCoordinates, setPickedCoordinates] = useState<{
    latitude: number
    longitude: number
  } | null>(initialPin)
  const [addressPreview, setAddressPreview] = useState<string | null>(null)
  const [isResolvingAddress, setIsResolvingAddress] = useState(false)
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [mapCenter, setMapCenter] = useState({
    latitude: fallbackLatitude,
    longitude: fallbackLongitude,
  })
  const [isLocatingUser, setIsLocatingUser] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return

    setPickedCoordinates(initialPin)
    setAddressPreview(null)
    setUserLocation(null)
    setMapCenter({ latitude: fallbackLatitude, longitude: fallbackLongitude })
    setLocationError(null)

    if (initialPin) {
      void resolvePreview(initialPin.latitude, initialPin.longitude)
    }
  }, [visible, fallbackLatitude, fallbackLongitude, initialPin?.latitude, initialPin?.longitude])

  useEffect(() => {
    if (!visible) return

    let cancelled = false

    async function locateUser() {
      setIsLocatingUser(true)
      setLocationError(null)

      try {
        const permission = await Location.requestForegroundPermissionsAsync()
        if (cancelled) return

        if (!permission.granted) {
          setLocationError('Permita o acesso à localização para ver onde você está no mapa.')
          return
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        if (cancelled) return

        const nextUserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        setUserLocation(nextUserLocation)
        setMapCenter(nextUserLocation)
      } catch {
        if (!cancelled) {
          setLocationError('Não foi possível obter sua localização. Use o mapa para marcar o local.')
        }
      } finally {
        if (!cancelled) setIsLocatingUser(false)
      }
    }

    void locateUser()

    return () => {
      cancelled = true
    }
  }, [visible])

  async function resolvePreview(latitude: number, longitude: number) {
    setIsResolvingAddress(true)
    try {
      const label = await resolveAddressLabelFromCoordinates(latitude, longitude)
      setAddressPreview(label)
    } catch {
      setAddressPreview(null)
    } finally {
      setIsResolvingAddress(false)
    }
  }

  function handlePick(coords: { latitude: number; longitude: number }) {
    setPickedCoordinates(coords)
    void resolvePreview(coords.latitude, coords.longitude)
  }

  function handleConfirm() {
    if (!pickedCoordinates) return

    onConfirm({
      latitude: pickedCoordinates.latitude,
      longitude: pickedCoordinates.longitude,
      addressLabel: addressPreview ?? 'Local selecionado no mapa',
    })
  }

  const mapReady = !isLocatingUser || userLocation !== null

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Marcar no mapa"
      subtitle="Arraste o mapa e toque no ponto exato do local"
      onClose={onClose}
      fullScreen
      scrollable={false}
      footer={
        <View style={styles.footer}>
          <View style={styles.previewBox}>
            {pickedCoordinates ? (
              isResolvingAddress ? (
                <ActivityIndicator color="#ff8533" size="small" />
              ) : (
                <Text style={styles.previewText}>
                  {addressPreview ?? 'Endereço aproximado será exibido aqui'}
                </Text>
              )
            ) : (
              <Text style={styles.previewHint}>Toque no mapa para marcar o local</Text>
            )}
          </View>
          <PrimaryButton
            label="Confirmar local"
            onPress={handleConfirm}
            disabled={!pickedCoordinates || isResolvingAddress}
          />
        </View>
      }
    >
      <View style={styles.mapWrap}>
        {mapReady ? (
          <RunningRouteSpotPickerMap
            key={`${mapCenter.latitude},${mapCenter.longitude},${userLocation?.latitude ?? 'none'}`}
            initialLatitude={mapCenter.latitude}
            initialLongitude={mapCenter.longitude}
            initialPin={initialPin}
            userLocation={userLocation}
            onPick={handlePick}
          />
        ) : (
          <View style={styles.locatingOverlay}>
            <ActivityIndicator color="#ff8533" size="large" />
            <Text style={styles.locatingText}>Obtendo sua localização...</Text>
          </View>
        )}
      </View>
      {userLocation ? (
        <Text style={styles.helperText}>
          O ponto azul é você. Arraste o mapa, toque no local ou arraste o pin laranja até o lugar certo.
        </Text>
      ) : (
        <Text style={styles.helperText}>
          {locationError ??
            'Você pode arrastar o mapa, tocar para posicionar o pin ou arrastar o pin até o lugar certo.'}
        </Text>
      )}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  mapWrap: {
    flex: 1,
    minHeight: 360,
  },
  locatingOverlay: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  locatingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  helperText: {
    marginTop: 10,
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0e0e14',
    gap: 10,
  },
  previewBox: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  previewText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  previewHint: {
    color: colors.textSubtle,
    fontSize: 12,
  },
})
