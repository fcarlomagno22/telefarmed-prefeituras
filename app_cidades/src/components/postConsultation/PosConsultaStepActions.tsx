import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

type PosConsultaStepActionsProps = {
  onBack?: () => void
  onContinue: () => void
  continueLabel?: string
  continueDisabled?: boolean
  continueLoading?: boolean
  fullWidth?: boolean
}

export function PosConsultaStepActions({
  onBack,
  onContinue,
  continueLabel = 'Continuar',
  continueDisabled = false,
  continueLoading = false,
  fullWidth = false,
}: PosConsultaStepActionsProps) {
  if (fullWidth || !onBack) {
    return (
      <View style={styles.rootFullWidth}>
        <Pressable
          onPress={onContinue}
          disabled={continueDisabled || continueLoading}
          style={({ pressed }) => [
            styles.continueButtonFull,
            (continueDisabled || continueLoading) && styles.continueDisabled,
            pressed && !continueDisabled && !continueLoading && styles.buttonPressed,
          ]}
        >
          <LinearGradient
            colors={['#7dd3fc', '#0ea5e9', '#0284c7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            {continueLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.continueText}>{continueLabel}</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          disabled={continueLoading}
          style={({ pressed }) => [
            styles.backButton,
            pressed && !continueLoading && styles.buttonPressed,
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
      ) : (
        <View style={styles.backPlaceholder} />
      )}

      <Pressable
        onPress={onContinue}
        disabled={continueDisabled || continueLoading}
        style={({ pressed }) => [
          styles.continueButton,
          (continueDisabled || continueLoading) && styles.continueDisabled,
          pressed && !continueDisabled && !continueLoading && styles.buttonPressed,
        ]}
      >
        <LinearGradient
          colors={['#7dd3fc', '#0ea5e9', '#0284c7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.continueGradient}
        >
          {continueLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.continueText}>{continueLabel}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  rootFullWidth: {
    marginTop: 20,
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 48,
    paddingHorizontal: 4,
  },
  backPlaceholder: {
    width: 72,
  },
  backText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueButtonFull: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueDisabled: {
    opacity: 0.45,
  },
  continueGradient: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  continueText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
})
