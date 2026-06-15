import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import avatarAnimation from '../../../assets/avatar.json'
import { formStyles } from '../AppShell'
import { RegisterTimeline } from './RegisterTimeline'
import { LottiePlayer } from '../LottiePlayer'
import { PrimaryButton } from '../PrimaryButton'
import { RegistrationProfile } from '../../types/auth'
import { colors } from '../../theme/colors'
import { cpfDigits, isValidCpf, maskCpf } from '../../utils/cpf'
import { isValidPhone, maskPhone } from '../../utils/phone'

type RegisterStepProfileProps = {
  value: RegistrationProfile
  onChange: (value: RegistrationProfile) => void
  onContinue: () => void
  onBack: () => void
}

type CpfStatus = 'idle' | 'invalid' | 'already_registered' | 'valid'

const MOCK_ALREADY_REGISTERED_CPF = '11144477735'

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function cpfStatusMessage(status: CpfStatus): string | null {
  switch (status) {
    case 'invalid':
      return 'CPF inválido. Verifique os números digitados.'
    case 'already_registered':
      return 'Este CPF já possui conta no app. Faça login para continuar.'
    default:
      return null
  }
}

export function RegisterStepProfile({
  value,
  onChange,
  onContinue,
  onBack,
}: RegisterStepProfileProps) {
  const [error, setError] = useState<string | null>(null)
  const [cpfStatus, setCpfStatus] = useState<CpfStatus>('idle')

  function patch(patch: Partial<RegistrationProfile>) {
    onChange({ ...value, ...patch })
  }

  useEffect(() => {
    const digits = cpfDigits(value.cpf)

    if (digits.length !== 11) {
      setCpfStatus('idle')
      return
    }

    if (!isValidCpf(digits)) {
      setCpfStatus('invalid')
      return
    }

    if (digits === MOCK_ALREADY_REGISTERED_CPF) {
      setCpfStatus('already_registered')
      return
    }

    setCpfStatus('valid')
  }, [value.cpf])

  function handleContinue() {
    if (!value.name.trim()) {
      setError('Informe seu nome completo.')
      return
    }

    if (!isValidCpf(value.cpf)) {
      setError('Informe um CPF válido.')
      return
    }

    if (cpfStatus === 'already_registered') {
      setError('Este CPF já possui conta no app. Faça login para continuar.')
      return
    }

    if (cpfStatus !== 'valid') {
      setError('Informe um CPF válido para continuar.')
      return
    }

    if (!isValidEmail(value.email)) {
      setError('Informe um e-mail válido.')
      return
    }

    if (!isValidPhone(value.phone)) {
      setError('Informe um telefone válido com DDD.')
      return
    }

    setError(null)
    onContinue()
  }

  const cpfMessage = cpfStatusMessage(cpfStatus)
  const cpfFieldError = cpfStatus === 'invalid' || cpfStatus === 'already_registered'

  return (
    <>
      <RegisterTimeline currentStep={2} />
      <LottiePlayer source={avatarAnimation} />
      <Text style={formStyles.stepTitle}>Seus dados</Text>
      <Text style={formStyles.stepSubtitle}>
        Preencha suas informações pessoais para criar sua conta.
      </Text>

      {error ? (
        <View style={formStyles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#ff6b6b" />
          <Text style={formStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Nome completo</Text>
        <View style={formStyles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color="#ff6b00" style={formStyles.inputIcon} />
          <TextInput
            value={value.name}
            onChangeText={(name) => patch({ name })}
            placeholder="Seu nome"
            placeholderTextColor="rgba(245, 245, 247, 0.35)"
            autoCapitalize="words"
            style={formStyles.input}
          />
        </View>
      </View>

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>CPF</Text>
        <View
          style={[
            formStyles.inputWrapper,
            cpfFieldError && formStyles.inputWrapperError,
            cpfStatus === 'valid' && styles.inputWrapperSuccess,
          ]}
        >
          <Ionicons
            name="card-outline"
            size={20}
            color={cpfFieldError ? colors.error : colors.primary}
            style={formStyles.inputIcon}
          />
          <TextInput
            value={value.cpf}
            onChangeText={(cpf) => {
              patch({ cpf: maskCpf(cpf) })
              setError(null)
            }}
            placeholder="000.000.000-00"
            placeholderTextColor="rgba(245, 245, 247, 0.35)"
            keyboardType="number-pad"
            maxLength={14}
            style={formStyles.input}
          />
          {cpfStatus === 'valid' ? (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          ) : null}
        </View>
        {cpfMessage ? <Text style={formStyles.fieldError}>{cpfMessage}</Text> : null}
      </View>

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>E-mail</Text>
        <View style={formStyles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#ff6b00" style={formStyles.inputIcon} />
          <TextInput
            value={value.email}
            onChangeText={(email) => patch({ email })}
            placeholder="seu@email.com"
            placeholderTextColor="rgba(245, 245, 247, 0.35)"
            keyboardType="email-address"
            autoCapitalize="none"
            style={formStyles.input}
          />
        </View>
      </View>

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Telefone</Text>
        <View style={formStyles.inputWrapper}>
          <Ionicons name="call-outline" size={20} color="#ff6b00" style={formStyles.inputIcon} />
          <TextInput
            value={value.phone}
            onChangeText={(phone) => patch({ phone: maskPhone(phone) })}
            placeholder="(00) 00000-0000"
            placeholderTextColor="rgba(245, 245, 247, 0.35)"
            keyboardType="phone-pad"
            maxLength={15}
            style={formStyles.input}
          />
        </View>
      </View>

      <PrimaryButton
        label="Continuar"
        onPress={handleContinue}
        disabled={cpfStatus !== 'valid'}
      />
      <Pressable onPress={onBack} style={formStyles.secondaryButton}>
        <Text style={formStyles.secondaryButtonText}>Voltar</Text>
      </Pressable>
    </>
  )
}

const styles = {
  inputWrapperSuccess: {
    borderColor: 'rgba(255, 107, 0, 0.45)',
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
  },
}
