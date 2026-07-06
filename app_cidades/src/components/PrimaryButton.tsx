import { LinearGradient } from 'expo-linear-gradient'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native'
import { colors } from '../theme/colors'
import { formStyles } from './AppShell'

type PrimaryButtonProps = {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  gradientStyle?: StyleProp<ViewStyle>
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
  gradientStyle,
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        formStyles.primaryButton,
        styles.buttonShadow,
        style,
        pressed && !loading && !disabled && formStyles.primaryButtonPressed,
        (loading || disabled) && formStyles.primaryButtonDisabled,
      ]}
    >
      <LinearGradient
        colors={['#ff8533', '#ff6b00', '#e55f00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[formStyles.primaryButtonGradient, gradientStyle]}
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

const styles = StyleSheet.create({
  buttonShadow: {
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 10px rgba(255, 107, 0, 0.28)',
      },
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
})
