import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppShell, formStyles } from '../components/AppShell'
import { PrimaryButton } from '../components/PrimaryButton'
import { appEnv } from '../config/env'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../theme/colors'
import { isValidCpf, maskCpf } from '../utils/cpf'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const logoSource = resolveBrandImage(appEnv.logoUrl, 'logo.png')

export function LoginScreen() {
  const { navigateTo, canUseBiometricLogin, loginWithBiometric, loginWithCredentials } = useAuth()
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cpfTouched, setCpfTouched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isBiometricLoading, setIsBiometricLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cpfInvalid = cpfTouched && !isValidCpf(cpf)

  async function handleLogin() {
    setCpfTouched(true)
    setError(null)

    if (!isValidCpf(cpf)) {
      setError('Informe um CPF válido com 11 dígitos.')
      return
    }

    if (!password.trim()) {
      setError('Informe sua senha para continuar.')
      return
    }

    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const result = await loginWithCredentials(cpf, password)
      if (result === 'invalid') {
        setError('CPF ou senha inválidos.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleBiometricLogin() {
    setError(null)
    setIsBiometricLoading(true)

    try {
      const result = await loginWithBiometric()
      if (result === 'failed') {
        setError('Não foi possível entrar com biometria.')
      }
    } finally {
      setIsBiometricLoading(false)
    }
  }

  return (
    <AppShell>
      <Pressable onPress={() => navigateTo('home')} style={styles.backButton}>
        <Ionicons name="chevron-back" size={20} color={colors.primaryLight} />
        <Text style={styles.backButtonText}>Voltar ao app</Text>
      </Pressable>

      <View style={styles.logoWrap}>
        <Image source={logoSource} style={styles.logo} resizeMode="contain" />
      </View>

      <Text style={formStyles.stepTitle}>Bem-vindo</Text>
      <Text style={formStyles.stepSubtitle}>
        Acesse com seu CPF e senha para continuar
      </Text>

      {error ? (
        <View style={formStyles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text style={formStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>CPF</Text>
        <View
          style={[
            formStyles.inputWrapper,
            cpfInvalid && formStyles.inputWrapperError,
          ]}
        >
          <Ionicons
            name="card-outline"
            size={20}
            color={cpfInvalid ? colors.error : colors.primary}
            style={formStyles.inputIcon}
          />
          <TextInput
            value={cpf}
            onChangeText={(value) => setCpf(maskCpf(value))}
            onBlur={() => setCpfTouched(true)}
            placeholder="000.000.000-00"
            placeholderTextColor={colors.textSubtle}
            keyboardType="number-pad"
            autoComplete="username"
            maxLength={14}
            style={formStyles.input}
          />
        </View>
        {cpfInvalid ? <Text style={formStyles.fieldError}>CPF inválido</Text> : null}
      </View>

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Senha</Text>
        <View style={formStyles.inputWrapper}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={colors.primary}
            style={formStyles.inputIcon}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Sua senha"
            placeholderTextColor={colors.textSubtle}
            secureTextEntry={!showPassword}
            autoComplete="password"
            style={formStyles.input}
          />
          <Pressable
            onPress={() => setShowPassword((current) => !current)}
            hitSlop={12}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.forgotButton} onPress={() => navigateTo('forgot-password')}>
        <Text style={styles.forgotText}>Esqueci minha senha</Text>
      </Pressable>

      <PrimaryButton label="Entrar" onPress={handleLogin} loading={isLoading} />

      {canUseBiometricLogin ? (
        <>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={handleBiometricLogin}
            disabled={isBiometricLoading}
            style={({ pressed }) => [
              styles.biometricButton,
              pressed && styles.biometricButtonPressed,
              isBiometricLoading && styles.biometricButtonDisabled,
            ]}
          >
            <Ionicons name="finger-print" size={22} color={colors.primary} />
            <Text style={styles.biometricButtonText}>
              {isBiometricLoading ? 'Autenticando...' : 'Acessar com biometria'}
            </Text>
          </Pressable>
        </>
      ) : null}

      <View style={styles.signupRow}>
        <Text style={styles.signupText}>Não tem uma conta?</Text>
        <Pressable hitSlop={8} onPress={() => navigateTo('register')}>
          <Text style={styles.signupLink}>Cadastre-se</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>© 2026 Telefarmed. Todos os direitos reservados.</Text>
    </AppShell>
  )
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginBottom: 12,
    marginTop: -4,
  },
  backButtonText: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: '600',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 220,
    height: 64,
  },
  eyeButton: {
    padding: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    marginTop: -4,
  },
  forgotText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.35)',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    minHeight: 52,
    paddingHorizontal: 20,
  },
  biometricButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  biometricButtonDisabled: {
    opacity: 0.7,
  },
  biometricButtonText: {
    color: colors.primaryLight,
    fontSize: 15,
    fontWeight: '700',
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  signupText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  signupLink: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    textAlign: 'center',
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 16,
  },
})
