import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import newPassAnimation from '../../assets/new_pass.json'
import contactEmailAnimation from '../../assets/contact-email.json'
import pinValidationAnimation from '../../assets/PIN_validation.json'
import etapa3Animation from '../../assets/etapa_3.json'
import successAnimation from '../../assets/success.json'
import { AppShell, formStyles } from '../components/AppShell'
import { LottiePlayer } from '../components/LottiePlayer'
import { PrimaryButton } from '../components/PrimaryButton'
import { CodeInput } from '../components/recovery/CodeInput'
import { RecoveryTimeline } from '../components/recovery/RecoveryTimeline'
import {
  PASSWORD_RECOVERY_CODE_EXPIRES_MINUTES,
  PASSWORD_RECOVERY_CODE_LENGTH,
  PasswordRecoveryStep,
  resolveRecoveryTimelineStep,
} from '../config/passwordRecovery'
import { useAuth } from '../contexts/AuthContext'
import {
  mockCompletePasswordRecovery,
  mockRequestPasswordRecovery,
  mockVerifyPasswordRecoveryCode,
  PasswordRecoveryError,
} from '../services/mockPasswordRecovery'
import { colors } from '../theme/colors'
import { isValidCpf, maskCpf } from '../utils/cpf'
import { isPasswordValid, passwordRules } from '../utils/password'
import { playSuccessPasswordSound } from '../utils/appSounds'

export function ForgotPasswordScreen() {
  const { navigateTo } = useAuth()
  const [step, setStep] = useState<PasswordRecoveryStep>('cpf')
  const [cpf, setCpf] = useState('')
  const [sentToEmail, setSentToEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [verificationToken, setVerificationToken] = useState<string | null>(null)
  const [cpfTouched, setCpfTouched] = useState(false)
  const [codeError, setCodeError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const cpfInvalid = cpfTouched && !isValidCpf(cpf)
  const timelineStep = resolveRecoveryTimelineStep(step)

  useEffect(() => {
    if (step !== 'emailSent') return

    const timer = setTimeout(() => {
      setStep('code')
      setError(null)
      setCodeError(false)
    }, 3200)

    return () => clearTimeout(timer)
  }, [step])

  async function handleRequestCode() {
    setCpfTouched(true)
    setError(null)

    if (!isValidCpf(cpf)) {
      setError('Informe um CPF válido.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await mockRequestPasswordRecovery(cpf)
      setResetToken(result.resetToken)
      setSentToEmail(result.sentTo)
      setCode('')
      setCodeError(false)
      setStep('emailSent')
    } catch (err) {
      setError(
        err instanceof PasswordRecoveryError
          ? err.message
          : 'Não foi possível enviar o código. Tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerifyCode() {
    setError(null)
    setCodeError(false)

    if (code.length !== PASSWORD_RECOVERY_CODE_LENGTH || !resetToken) {
      setError(`Informe o código de ${PASSWORD_RECOVERY_CODE_LENGTH} dígitos.`)
      return
    }

    setIsSubmitting(true)
    try {
      const result = await mockVerifyPasswordRecoveryCode({ resetToken, code })
      setVerificationToken(result.verificationToken)
      setPassword('')
      setConfirmPassword('')
      setStep('password')
    } catch (err) {
      setCodeError(true)
      setError(
        err instanceof PasswordRecoveryError
          ? err.message
          : 'Não foi possível validar o código. Tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResetPassword() {
    setError(null)

    if (!verificationToken) return

    if (!isPasswordValid(password)) {
      setError('A senha precisa atender todos os requisitos de segurança.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas informadas não coincidem.')
      return
    }

    setIsSubmitting(true)
    try {
      await mockCompletePasswordRecovery({ verificationToken, password })
      setStep('success')
      void playSuccessPasswordSound()
    } catch (err) {
      setError(
        err instanceof PasswordRecoveryError
          ? err.message
          : 'Não foi possível redefinir a senha. Tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResendCode() {
    if (!isValidCpf(cpf)) return
    setError(null)
    setCodeError(false)
    setIsSubmitting(true)
    try {
      const result = await mockRequestPasswordRecovery(cpf)
      setResetToken(result.resetToken)
      setSentToEmail(result.sentTo)
      setCode('')
      setStep('emailSent')
    } catch (err) {
      setError(
        err instanceof PasswordRecoveryError
          ? err.message
          : 'Não foi possível reenviar o código.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBack() {
    setError(null)
    setCodeError(false)

    if (step === 'code') {
      setStep('cpf')
      setCode('')
      return
    }

    if (step === 'password') {
      setStep('code')
      setPassword('')
      setConfirmPassword('')
    }
  }

  if (step === 'success') {
    return (
      <AppShell>
        <LottiePlayer source={successAnimation} loop={false} style={styles.successLottie} />
        <Text style={formStyles.stepTitle}>Senha redefinida</Text>
        <Text style={formStyles.stepSubtitle}>
          Sua senha foi atualizada com sucesso. Entre com a nova senha na tela de login.
        </Text>
        <PrimaryButton label="Voltar ao login" onPress={() => navigateTo('login')} />
      </AppShell>
    )
  }

  if (step === 'emailSent') {
    return (
      <AppShell>
        <LottiePlayer source={contactEmailAnimation} loop={false} style={styles.emailLottie} />
        <Text style={formStyles.stepTitle}>E-mail enviado</Text>
        <Text style={formStyles.stepSubtitle}>
          Código de {PASSWORD_RECOVERY_CODE_LENGTH} dígitos enviado para{' '}
          <Text style={styles.emailHighlight}>{sentToEmail}</Text>.
          {'\n'}Válido por {PASSWORD_RECOVERY_CODE_EXPIRES_MINUTES} min.
        </Text>
        <PrimaryButton label="Continuar" onPress={() => setStep('code')} />
      </AppShell>
    )
  }

  return (
    <AppShell>
      {timelineStep ? <RecoveryTimeline currentStep={timelineStep} /> : null}

      {step === 'cpf' ? (
        <>
          <LottiePlayer source={newPassAnimation} />
          <Text style={formStyles.stepTitle}>Recuperar senha</Text>
          <Text style={formStyles.stepSubtitle}>
            Informe o CPF cadastrado para receber o código de verificação por e-mail.
          </Text>

          {error ? <ErrorBox message={error} /> : null}

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
                maxLength={14}
                style={formStyles.input}
              />
            </View>
            {cpfInvalid ? <Text style={formStyles.fieldError}>CPF inválido</Text> : null}
          </View>

          <PrimaryButton
            label="Enviar código"
            onPress={handleRequestCode}
            loading={isSubmitting}
            disabled={!isValidCpf(cpf)}
          />
          <Pressable onPress={() => navigateTo('login')} style={formStyles.secondaryButton}>
            <Text style={formStyles.secondaryButtonText}>Voltar ao login</Text>
          </Pressable>
        </>
      ) : null}

      {step === 'code' ? (
        <>
          <LottiePlayer source={pinValidationAnimation} />
          <Text style={formStyles.stepTitle}>Digite o código</Text>
          <Text style={formStyles.stepSubtitle}>
            Informe o código de {PASSWORD_RECOVERY_CODE_LENGTH} dígitos enviado para{' '}
            {sentToEmail}.
          </Text>

          {error ? <ErrorBox message={error} /> : null}

          <View style={formStyles.fieldGroup}>
            <Text style={formStyles.label}>Código</Text>
            <CodeInput
              value={code}
              onChange={(value) => {
                setCode(value)
                setCodeError(false)
                setError(null)
              }}
              error={codeError}
              disabled={isSubmitting}
            />
          </View>

          <PrimaryButton
            label="Continuar"
            onPress={handleVerifyCode}
            loading={isSubmitting}
            disabled={code.length !== PASSWORD_RECOVERY_CODE_LENGTH}
          />

          <View style={styles.inlineActions}>
            <Pressable onPress={handleBack} style={styles.inlineAction}>
              <Ionicons name="arrow-back" size={14} color={colors.textMuted} />
              <Text style={styles.inlineActionText}>Voltar</Text>
            </Pressable>
            <Pressable onPress={() => void handleResendCode()} style={styles.inlineAction}>
              <Text style={styles.resendText}>Reenviar código</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {step === 'password' ? (
        <>
          <LottiePlayer source={etapa3Animation} />
          <Text style={formStyles.stepTitle}>Nova senha</Text>
          <Text style={formStyles.stepSubtitle}>Defina uma nova senha segura para sua conta.</Text>

          {error ? <ErrorBox message={error} /> : null}

          <View style={formStyles.fieldGroup}>
            <Text style={formStyles.label}>Nova senha</Text>
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
                placeholder="Nova senha"
                placeholderTextColor={colors.textSubtle}
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
                color={colors.primary}
                style={formStyles.inputIcon}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repita a senha"
                placeholderTextColor={colors.textSubtle}
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

          <PrimaryButton
            label="Redefinir senha"
            onPress={handleResetPassword}
            loading={isSubmitting}
          />
          <Pressable onPress={handleBack} style={formStyles.secondaryButton}>
            <Text style={formStyles.secondaryButtonText}>Voltar</Text>
          </Pressable>
        </>
      ) : null}
    </AppShell>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <View style={formStyles.errorBox}>
      <Ionicons name="alert-circle" size={18} color={colors.error} />
      <Text style={formStyles.errorText}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  emailHighlight: {
    color: colors.text,
    fontWeight: '700',
  },
  emailLottie: {
    marginBottom: 8,
  },
  successLottie: {
    marginBottom: 8,
  },
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  inlineActionText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  resendText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
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
