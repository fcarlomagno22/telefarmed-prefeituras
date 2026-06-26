import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { submitRunningRouteSpot } from '../../../data/runningRouteSpotsService'
import { colors } from '../../../theme/colors'
import type { RegistrationAddress } from '../../../types/auth'
import type {
  RunningRouteLocationSource,
  RunningRouteSpotType,
  SubmitRunningRouteSpotInput,
} from '../../../types/nearbyRunningRoutes'
import {
  geocodeAddressLabel,
  formatRegistrationAddress,
  resolveAddressLabelFromCoordinates,
} from '../../../utils/runningRouteGeocoding'
import {
  RUNNING_ROUTE_SPOT_TYPE_OPTIONS,
} from '../../../utils/nearbyRunningRoutes'
import { getHomeCoordinatesFromAddress } from '../../../utils/mockHomeLocation'
import { persistRunningRouteCoverPhoto } from '../../../utils/runningRouteCoverPhoto'
import { PrimaryButton } from '../../PrimaryButton'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'
import { RunningRouteSpotMapPickerDrawer } from './RunningRouteSpotMapPickerDrawer'

type SubmitRunningRouteSpotDrawerProps = {
  visible: boolean
  patientCpf: string
  patientName: string
  defaultAddress: RegistrationAddress
  onClose: () => void
  onSubmitted: () => void
}

type LocationMode = RunningRouteLocationSource

export function SubmitRunningRouteSpotDrawer({
  visible,
  patientCpf,
  patientName,
  defaultAddress,
  onClose,
  onSubmitted,
}: SubmitRunningRouteSpotDrawerProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<RunningRouteSpotType>('park')
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | null>(null)
  const [locationMode, setLocationMode] = useState<LocationMode>('gps')
  const [addressDraft, setAddressDraft] = useState(defaultAddress)
  const [resolvedAddressLabel, setResolvedAddressLabel] = useState<string | null>(null)
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(
    null,
  )
  const [isLocating, setIsLocating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [mapPickerVisible, setMapPickerVisible] = useState(false)
  const [mapPickerCenter, setMapPickerCenter] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  useEffect(() => {
    if (!visible) return

    setName('')
    setDescription('')
    setType('park')
    setCoverPhotoUri(null)
    setLocationMode('gps')
    setAddressDraft(defaultAddress)
    setResolvedAddressLabel(null)
    setCoordinates(null)
    setLocationError(null)
    setMapPickerVisible(false)
    setMapPickerCenter(null)
  }, [visible, defaultAddress])

  async function pickCoverPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Precisamos acessar sua galeria para escolher a foto do lugar.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.9,
    })

    if (result.canceled || !result.assets[0]?.uri) return

    try {
      const persisted = await persistRunningRouteCoverPhoto(result.assets[0].uri)
      setCoverPhotoUri(persisted)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      Alert.alert('Erro', 'Não foi possível preparar a foto do lugar.')
    }
  }

  async function captureGpsLocation() {
    setIsLocating(true)
    setLocationError(null)

    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      if (!permission.granted) {
        setLocationError('Permita o acesso à localização para marcar onde você está.')
        return
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const nextCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }

      setCoordinates(nextCoordinates)
      const label = await resolveAddressLabelFromCoordinates(
        nextCoordinates.latitude,
        nextCoordinates.longitude,
      )
      setResolvedAddressLabel(label)
    } catch {
      setLocationError('Não foi possível obter sua localização.')
    } finally {
      setIsLocating(false)
    }
  }

  async function openAddressMapPicker() {
    setLocationError(null)

    const fallback = getHomeCoordinatesFromAddress(addressDraft)
    let center = coordinates ?? fallback

    try {
      const geocoded = await geocodeAddressLabel(addressDraft)
      if (geocoded) center = geocoded
    } catch {
      // usa fallback já definido
    }

    setMapPickerCenter(center)
    setMapPickerVisible(true)
  }

  function handleMapPickerConfirm(result: {
    latitude: number
    longitude: number
    addressLabel: string
  }) {
    setCoordinates({ latitude: result.latitude, longitude: result.longitude })
    setResolvedAddressLabel(result.addressLabel)
    setMapPickerVisible(false)
    setLocationError(null)
  }

  useEffect(() => {
    if (!visible || locationMode !== 'gps') return
    void captureGpsLocation()
  }, [visible, locationMode])

  const canSubmit =
    name.trim().length >= 3 &&
    description.trim().length >= 10 &&
    Boolean(coverPhotoUri) &&
    Boolean(coordinates) &&
    !isSubmitting &&
    !isLocating

  async function handleSubmit() {
    if (!canSubmit || !coverPhotoUri || !coordinates) return

    setIsSubmitting(true)

    try {
      const payload: SubmitRunningRouteSpotInput = {
        name: name.trim(),
        description: description.trim(),
        type,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        addressLabel:
          locationMode === 'gps'
            ? resolvedAddressLabel ?? formatRegistrationAddress(defaultAddress)
            : resolvedAddressLabel ?? formatRegistrationAddress(addressDraft),
        locationSource: locationMode,
        coverPhotoUri,
        submittedByCpf: patientCpf,
        submittedByName: patientName,
      }

      await submitRunningRouteSpot(payload)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSubmitted()
      onClose()
    } catch {
      Alert.alert('Erro', 'Não foi possível cadastrar o local. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <RunWalkSheetDrawer
      visible={visible}
      title="Cadastrar local"
      subtitle="Compartilhe um lugar para corrida ou caminhada"
      onClose={onClose}
      fullScreen
      keyboardAware
      footer={
        <View style={styles.footer}>
          <View style={styles.footerButtonWrap}>
            <PrimaryButton
              label={isSubmitting ? 'Salvando...' : 'Publicar local'}
              onPress={() => void handleSubmit()}
              disabled={!canSubmit}
            />
          </View>
        </View>
      }
    >
      <View style={styles.field}>
        <Text style={styles.label}>Onde fica?</Text>
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setLocationMode('gps')}
            style={[styles.modeChip, locationMode === 'gps' && styles.modeChipActive]}
          >
            <Ionicons
              name="locate-outline"
              size={16}
              color={locationMode === 'gps' ? '#fff' : colors.textMuted}
            />
            <Text style={[styles.modeChipText, locationMode === 'gps' && styles.modeChipTextActive]}>
              Estou no local
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setLocationMode('address')}
            style={[styles.modeChip, locationMode === 'address' && styles.modeChipActive]}
          >
            <Ionicons
              name="map-outline"
              size={16}
              color={locationMode === 'address' ? '#fff' : colors.textMuted}
            />
            <Text
              style={[styles.modeChipText, locationMode === 'address' && styles.modeChipTextActive]}
            >
              Por endereço
            </Text>
          </Pressable>
        </View>

        {locationMode === 'gps' ? (
          <View style={styles.locationCard}>
            {isLocating ? (
              <ActivityIndicator color="#ff8533" />
            ) : (
              <>
                <Text style={styles.locationTitle}>
                  {coordinates ? 'Localização capturada' : 'Aguardando GPS'}
                </Text>
                <Text style={styles.locationText}>
                  {resolvedAddressLabel ?? 'Toque abaixo se precisar atualizar a posição.'}
                </Text>
                <Pressable
                  onPress={() => void captureGpsLocation()}
                  style={styles.locationAction}
                >
                  <Text style={styles.locationActionText}>Atualizar minha localização</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <View style={styles.locationCard}>
            <TextInput
              value={addressDraft.street}
              onChangeText={(street) => setAddressDraft((current) => ({ ...current, street }))}
              placeholder="Rua / Avenida"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
            />
            <TextInput
              value={addressDraft.number}
              onChangeText={(number) => setAddressDraft((current) => ({ ...current, number }))}
              placeholder="Número"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
            />
            <TextInput
              value={addressDraft.neighborhood}
              onChangeText={(neighborhood) =>
                setAddressDraft((current) => ({ ...current, neighborhood }))
              }
              placeholder="Bairro"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
            />
            <View style={styles.inlineRow}>
              <TextInput
                value={addressDraft.city}
                onChangeText={(city) => setAddressDraft((current) => ({ ...current, city }))}
                placeholder="Cidade"
                placeholderTextColor={colors.textSubtle}
                style={[styles.input, styles.inlineInput]}
              />
              <TextInput
                value={addressDraft.state}
                onChangeText={(state) => setAddressDraft((current) => ({ ...current, state }))}
                placeholder="UF"
                placeholderTextColor={colors.textSubtle}
                style={[styles.input, styles.stateInput]}
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
            <Pressable
              onPress={() => void openAddressMapPicker()}
              style={styles.locationAction}
            >
              <Text style={styles.locationActionText}>Localizar endereço no mapa</Text>
            </Pressable>
            {resolvedAddressLabel ? (
              <Text style={styles.locationText}>{resolvedAddressLabel}</Text>
            ) : null}
          </View>
        )}

        {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Foto do lugar</Text>
        <Pressable style={styles.coverPicker} onPress={() => void pickCoverPhoto()}>
          {coverPhotoUri ? (
            <Image source={{ uri: coverPhotoUri }} style={styles.coverImage} contentFit="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={28} color={colors.textMuted} />
              <Text style={styles.coverPlaceholderText}>Adicionar foto do lugar</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Tipo de local</Text>
        <View style={styles.typeRow}>
          {RUNNING_ROUTE_SPOT_TYPE_OPTIONS.map((option) => {
            const active = type === option.id
            return (
              <Pressable
                key={option.id}
                onPress={() => setType(option.id)}
                style={[styles.typeChip, active && styles.typeChipActive]}
              >
                <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Nome do local</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ex: Parque da Cidade"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          maxLength={80}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Conte como é o local, horários, iluminação, segurança..."
          placeholderTextColor={colors.textSubtle}
          style={[styles.input, styles.textArea]}
          multiline
          maxLength={320}
        />
      </View>
    </RunWalkSheetDrawer>

      {mapPickerCenter ? (
        <RunningRouteSpotMapPickerDrawer
          visible={mapPickerVisible}
          fallbackLatitude={mapPickerCenter.latitude}
          fallbackLongitude={mapPickerCenter.longitude}
          initialPin={coordinates}
          onClose={() => setMapPickerVisible(false)}
          onConfirm={handleMapPickerConfirm}
        />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  footer: {
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0e0e14',
    width: '100%',
  },
  footerButtonWrap: {
    width: '100%',
    alignSelf: 'stretch',
  },
  coverPicker: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  coverPlaceholderText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  field: {
    marginBottom: 16,
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  typeChipActive: {
    borderColor: '#ff8533',
    backgroundColor: 'rgba(255, 107, 0, 0.18)',
  },
  typeChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: '#fff',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  modeChipActive: {
    borderColor: '#ff8533',
    backgroundColor: 'rgba(255, 107, 0, 0.18)',
  },
  modeChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: '#fff',
  },
  locationCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    gap: 10,
  },
  locationTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  locationText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  locationAction: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 107, 0, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationActionText: {
    color: '#ffcc99',
    fontSize: 12,
    fontWeight: '700',
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineInput: {
    flex: 1,
  },
  stateInput: {
    width: 72,
    textAlign: 'center',
  },
  errorText: {
    color: '#fecaca',
    fontSize: 12,
    lineHeight: 17,
  },
  helperText: {
    color: colors.textSubtle,
    fontSize: 11,
  },
})
