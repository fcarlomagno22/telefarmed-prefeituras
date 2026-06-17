import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { PrimaryButton } from '../../PrimaryButton'
import { colors } from '../../../theme/colors'

type RunWalkHistoryEmptyStateProps = {
  onStartPress: () => void
}

export function RunWalkHistoryEmptyState({ onStartPress }: RunWalkHistoryEmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="run-fast" size={34} color="#6ee7b7" />
      </View>
      <Text style={styles.title}>Seu primeiro treino aparece aqui</Text>
      <Text style={styles.text}>
        Conclua uma corrida ou caminhada para ver gráficos, destaques e evolução completa.
      </Text>
      <PrimaryButton label="Iniciar atividade" onPress={onStartPress} style={styles.button} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.24)',
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  text: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    marginTop: 8,
  },
})
