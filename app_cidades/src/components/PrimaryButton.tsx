import { LinearGradient } from 'expo-linear-gradient'
import { ActivityIndicator, Pressable, Text } from 'react-native'
import { formStyles } from './AppShell'

type PrimaryButtonProps = {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
}

export function PrimaryButton({ label, onPress, loading = false, disabled = false }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        formStyles.primaryButton,
        pressed && !loading && !disabled && formStyles.primaryButtonPressed,
        (loading || disabled) && formStyles.primaryButtonDisabled,
      ]}
    >
      <LinearGradient
        colors={['#ff8533', '#ff6b00', '#e55f00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={formStyles.primaryButtonGradient}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={formStyles.primaryButtonText}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  )
}
