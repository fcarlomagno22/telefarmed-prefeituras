import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { GpsCalibrationPhase } from '../../../hooks/useGpsCalibration'
import type { GpsQuality } from '../../../hooks/useRunWalkLocation'
import { colors } from '../../../theme/colors'

type RunWalkActivityGpsNoticeProps = {
  gpsPhase: GpsCalibrationPhase
  gpsQuality: GpsQuality
  gpsPreCalibrated?: boolean
  isLocating: boolean
  isOffline: boolean
  hasLiveProgress?: boolean
}

function resolveMessage(props: RunWalkActivityGpsNoticeProps): string | null {
  const {
    gpsPhase,
    gpsQuality,
    gpsPreCalibrated = false,
    isLocating,
    isOffline,
    hasLiveProgress = false,
  } = props

  if (isLocating) {
    return 'Buscando sua localização. O cronômetro já está rodando.'
  }

  if (hasLiveProgress || gpsPhase === 'recording') {
    if (isOffline) {
      return 'Sem internet. Seu treino continua sendo salvo no aparelho.'
    }

    if (gpsQuality === 'poor' || gpsQuality === 'fair') {
      return 'Sinal fraco — a distância pode demorar a aparecer.'
    }

    return null
  }

  if (!gpsPreCalibrated && gpsPhase === 'awaiting') {
    return 'GPS ainda estabilizando — o treino já começou; distância e percurso podem demorar um pouco.'
  }

  if (gpsPhase === 'awaiting') {
    return 'Calibrando GPS… A distância e o percurso começam quando o sinal estabilizar.'
  }

  if (isOffline) {
    return 'Sem internet. Seu treino continua sendo salvo no aparelho.'
  }

  if (gpsQuality === 'poor' || gpsQuality === 'fair') {
    return 'Sinal fraco — a distância pode demorar a aparecer.'
  }

  return null
}

export function RunWalkActivityGpsNotice(props: RunWalkActivityGpsNoticeProps) {
  const message = resolveMessage(props)
  if (!message) return null

  return (
    <View style={styles.card}>
      <Ionicons name="information-circle-outline" size={16} color="#b45309" />
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 251, 235, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    maxWidth: 320,
  },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.text,
  },
})
