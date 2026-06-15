import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import passAnimation from '../../../assets/pass_app.json'
import { colors } from '../../theme/colors'
import { formStyles } from '../AppShell'
import { RegisterTimeline } from './RegisterTimeline'
import { LottiePlayer } from '../LottiePlayer'
import { PrimaryButton } from '../PrimaryButton'
import { isPasswordValid, passwordRules } from '../../utils/password'

type RegisterStepPasswordProps = {
  password: string
  confirmPassword: string
  onChangePassword: (value: string) => void
  onChangeConfirmPassword: (value: string) => void
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

export function RegisterStepPassword({
  password,
  confirmPassword,
  onChangePassword,
  onChangeConfirmPassword,
  onSubmit,
  onBack,
  isSubmitting,
}: RegisterStepPasswordProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!isPasswordValid(password)) {
      setError('A senha precisa atender todos os requisitos de segurança.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas informadas não coincidem.')
      return
    }

    setError(null)
    onSubmit()
  }

  return (
    <>
      <RegisterTimeline currentStep={4} />
      <LottiePlayer source={passAnimation} />
      <Text style={formStyles.stepTitle}>Crie sua senha</Text>
      <Text style={formStyles.stepSubtitle}>
        Defina uma senha segura para acessar o app.
      </Text>

      {error ? (
        <View style={formStyles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#ff6b6b" />
          <Text style={formStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Senha</Text>
        <View style={formStyles.inputWrapper}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#ff6b00"
            style={formStyles.inputIcon}
          />
          <TextInput
            value={password}
            onChangeText={onChangePassword}
            placeholder="Sua senha"
            placeholderTextColor="rgba(245, 245, 247, 0.35)"
            secureTextEntry={!showPassword}
            style={formStyles.input}
          />
          <Pressable onPress={() => setShowPassword((current) => !current)} hitSlop={12}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      </View>

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Confirmar senha</Text>
        <View style={formStyles.inputWrapper}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color="#ff6b00"
            style={formStyles.inputIcon}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={onChangeConfirmPassword}
            placeholder="Repita a senha"
            placeholderTextColor="rgba(245, 245, 247, 0.35)"
            secureTextEntry={!showConfirmPassword}
            style={formStyles.input}
          />
          <Pressable
            onPress={() => setShowConfirmPassword((current) => !current)}
            hitSlop={12}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.rulesBox}>
        {passwordRules.map((rule) => {
          const passed = rule.test(password)
          return (
            <View key={rule.id} style={styles.ruleRow}>
              <Ionicons
                name={passed ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={passed ? colors.primary : colors.textSubtle}
              />
              <Text style={[styles.ruleText, passed && styles.ruleTextPassed]}>
                {rule.label}
              </Text>
            </View>
          )
        })}
      </View>

      <PrimaryButton label="Continuar" onPress={handleSubmit} loading={isSubmitting} />
      <Pressable onPress={onBack} style={formStyles.secondaryButton}>
        <Text style={formStyles.secondaryButtonText}>Voltar</Text>
      </Pressable>
    </>
  )
}

const styles = StyleSheet.create({
  rulesBox: {
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleText: {
    color: colors.textSubtle,
    fontSize: 13,
  },
  ruleTextPassed: {
    color: colors.textMuted,
  },
})
