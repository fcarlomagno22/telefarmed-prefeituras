import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { pickAppImage } from '../../../adapters/appImagePicker'
import {
  Accuracy,
  getCurrentPositionAsync,
  isAppLocationPermissionDenied,
  requestForegroundPermissionsAsync,
} from '../../../adapters/appLocation'
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
import { VdApiError } from '../../../lib/api/vd/client'
import { colors } from '../../../theme/colors'
import { drawerChrome } from '../../../theme/drawerChrome'
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
  resolveRegistrationAddressFromCoordinates,
} from '../../../utils/runningRouteGeocoding'
import { normalizeBrazilianStateUf } from '../../../utils/brazilianStateUf'
import { GeoCoordinates } from '../../../utils/geo'
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
  /** Endereço do cadastro — usado só se GPS/reverse geocode falhar. */
  defaultAddress: RegistrationAddress
  /** Localização atual do mapa (GPS), priorizada sobre o cadastro. */
  initialOrigin: GeoCoordinates | null
  onClose: () => void
  onSubmitted: () => void
}

const EMPTY_REGISTRATION_ADDRESS: RegistrationAddress = {
  cep: '',
  street: '',
  neighborhood: '',
  city: '',
  state: '',
  number: '',
  complement: '',
}

type LocationMode = RunningRouteLocationSource

function getSubmitMissingFields(input: {
  coordinates: GeoCoordinates | null
  name: string
  isLocating: boolean
}): string[] {
  const missing: string[] = []

  if (input.isLocating) missing.push('aguardando localização')
  if (!input.coordinates) missing.push('local no mapa ou GPS')
  if (input.name.trim().length < 3) missing.push('nome (mín. 3 letras)')

  return missing
}

export function SubmitRunningRouteSpotDrawer({
  visible,
  patientCpf,
  patientName,
  defaultAddress,
  initialOrigin,
  onClose,
  onSubmitted,
}: SubmitRunningRouteSpotDrawerProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<RunningRouteSpotType>('park')
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | null>(null)
  const [locationMode, setLocationMode] = useState<LocationMode>('gps')
  const [addressDraft, setAddressDraft] = useState<RegistrationAddress>(defaultAddress)
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
    setResolvedAddressLabel(null)
    setCoordinates(null)
    setLocationError(null)
    setMapPickerVisible(false)
    setMapPickerCenter(null)

    if (initialOrigin) {
      void applyCoordinatesToForm(initialOrigin)
    } else {
      setAddressDraft(defaultAddress)
      void captureGpsLocation()
    }
  }, [visible, defaultAddress, initialOrigin])

  async function pickCoverPhoto() {
    const result = await pickAppImage({
      source: 'library',
      quality: 0.9,
      allowsEditing: true,
      aspect: [16, 9],
    })

    if (!result.ok) {
      if (result.reason === 'permission_denied') {
        Alert.alert('Permissão necessária', 'Precisamos acessar sua galeria para escolher a foto do lugar.')
        return
      }

      if (result.reason === 'unavailable' && result.message) {
        Alert.alert('Indisponível', result.message)
      }
      return
    }

    try {
      const persisted = await persistRunningRouteCoverPhoto(result.uri)
      setCoverPhotoUri(persisted)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      Alert.alert('Erro', 'Não foi possível preparar a foto do lugar.')
    }
  }

  async function applyCoordinatesToForm(
    nextCoordinates: GeoCoordinates,
    options?: { updateAddressDraft?: boolean },
  ) {
    setCoordinates(nextCoordinates)

    const [label, address] = await Promise.all([
      resolveAddressLabelFromCoordinates(nextCoordinates.latitude, nextCoordinates.longitude),
      resolveRegistrationAddressFromCoordinates(nextCoordinates.latitude, nextCoordinates.longitude),
    ])

    setResolvedAddressLabel(label)

    if (options?.updateAddressDraft !== false) {
      setAddressDraft(address ?? EMPTY_REGISTRATION_ADDRESS)
    }
  }

  async function captureGpsLocation() {
    setIsLocating(true)
    setLocationError(null)

    try {
      const permission = await requestForegroundPermissionsAsync()
      if (isAppLocationPermissionDenied(permission)) {
        setLocationError('Permita o acesso à localização para marcar onde você está.')
        if (initialOrigin) {
          await applyCoordinatesToForm(initialOrigin)
        }
        return
      }

      const position = await getCurrentPositionAsync({
        accuracy: Accuracy.High,
      })

      await applyCoordinatesToForm({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      })
    } catch {
      setLocationError('Não foi possível obter sua localização.')
      if (initialOrigin) {
        await applyCoordinatesToForm(initialOrigin)
      }
    } finally {
      setIsLocating(false)
    }
  }

  async function handleLocationModeChange(mode: LocationMode) {
    setLocationMode(mode)

    if (mode === 'gps') {
      void captureGpsLocation()
      return
    }

    setIsLocating(false)

    const source = coordinates ?? initialOrigin
    if (!source) return

    const address = await resolveRegistrationAddressFromCoordinates(
      source.latitude,
      source.longitude,
    )
    if (address) {
      setAddressDraft(address)
    }

    const label = await resolveAddressLabelFromCoordinates(source.latitude, source.longitude)
    setResolvedAddressLabel(label)
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

  async function handleMapPickerConfirm(result: {
    latitude: number
    longitude: number
    addressLabel: string
  }) {
    setCoordinates({ latitude: result.latitude, longitude: result.longitude })
    setResolvedAddressLabel(result.addressLabel)
    setMapPickerVisible(false)
    setLocationError(null)
    setIsLocating(false)

    const address = await resolveRegistrationAddressFromCoordinates(
      result.latitude,
      result.longitude,
    )
    if (address) {
      setAddressDraft(address)
    }
  }

  const submitMissingFields = getSubmitMissingFields({
    coordinates,
    name,
    isLocating,
  })

  const canSubmit =
    submitMissingFields.length === 0 && !isSubmitting

  async function handleSubmit() {
    if (!canSubmit || !coordinates) return

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
        submittedByCpf: patientCpf,
        submittedByName: patientName,
      }

      if (coverPhotoUri) {
        payload.coverPhotoUri = coverPhotoUri
      }

      await submitRunningRouteSpot(payload)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSubmitted()
      onClose()
    } catch (error) {
      if (error instanceof VdApiError && error.status === 401) {
        Alert.alert(
          'Sessão expirada',
          'Faça logout e entre novamente para publicar o local. Se preferir, publique sem foto por enquanto.',
        )
        return
      }

      if (error instanceof VdApiError && (error.status === 503 || error.code === 'STORAGE_UNAVAILABLE')) {
        Alert.alert(
          'Foto indisponível',
          error.message.includes('bucket')
            ? error.message
            : 'Não foi possível enviar a foto agora. Tente publicar sem foto ou tente de novo em instantes.',
        )
        return
      }

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
          {!canSubmit && submitMissingFields.length > 0 ? (
            <Text style={styles.submitHint}>
              Para publicar, falta: {submitMissingFields.join(', ')}.
            </Text>
          ) : null}
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
            onPress={() => void handleLocationModeChange('gps')}
            style={[styles.modeChip, locationMode === 'gps' && styles.modeChipActive]}
          >
            <Ionicons
              name="locate-outline"
              size={16}
              color={locationMode === 'gps' ? colors.primaryDark : colors.textMuted}
            />
            <Text style={[styles.modeChipText, locationMode === 'gps' && styles.modeChipTextActive]}>
              Estou no local
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void handleLocationModeChange('address')}
            style={[styles.modeChip, locationMode === 'address' && styles.modeChipActive]}
          >
            <Ionicons
              name="map-outline"
              size={16}
              color={locationMode === 'address' ? colors.primaryDark : colors.textMuted}
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
                onChangeText={(state) =>
                  setAddressDraft((current) => ({
                    ...current,
                    state: normalizeBrazilianStateUf(state),
                  }))
                }
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
              <Text style={styles.locationConfirmedText}>Local marcado: {resolvedAddressLabel}</Text>
            ) : null}
          </View>
        )}

        {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Foto do lugar (opcional)</Text>
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
        <Text style={styles.label}>Descrição (opcional)</Text>
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
    backgroundColor: drawerChrome.surfaceBottom,
    width: '100%',
    gap: 8,
  },
  submitHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    paddingHorizontal: 4,
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
    borderColor: colors.primaryLight,
    backgroundColor: 'rgba(255, 107, 0, 0.14)',
  },
  typeChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: colors.text,
    fontWeight: '700',
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
    borderColor: colors.primaryLight,
    backgroundColor: 'rgba(255, 107, 0, 0.14)',
  },
  modeChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: colors.text,
    fontWeight: '700',
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
  locationConfirmedText: {
    color: colors.primaryDark,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  locationAction: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationActionText: {
    color: colors.primaryDark,
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
