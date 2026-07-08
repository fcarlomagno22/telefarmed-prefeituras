import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import avatarAnimation from '../../../assets/avatar.json'
import { formStyles } from '../AppShell'
import { RegisterTimeline } from './RegisterTimeline'
import { LottiePlayer } from '../LottiePlayer'
import { PrimaryButton } from '../PrimaryButton'
import { lookupCpf, VdApiError } from '../../lib/api/vd'
import type { VdCadastroLookupPatient } from '../../types/vdApi'
import { RegistrationAddress, RegistrationProfile } from '../../types/auth'
import { colors } from '../../theme/colors'
import {
  mapLookupPatientToAddress,
  mapLookupPatientToProfile,
} from '../../utils/vdCadastroLookup'
import { cpfDigits, isValidCpf, maskCpf } from '../../utils/cpf'
import { isValidPhone, maskPhone } from '../../utils/phone'

type RegisterStepProfileProps = {
  value: RegistrationProfile
  onChange: (value: RegistrationProfile) => void
  onContinue: () => void
  onSkipToPassword: (payload: {
    profile: RegistrationProfile
    address?: Partial<RegistrationAddress>
    selfieUri?: string | null
  }) => void
  onBack: () => void
}

type CpfStatus =
  | 'idle'
  | 'checking'
  | 'invalid'
  | 'already_registered'
  | 'valid'
  | 'complete_credentials'

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function cpfStatusMessage(status: CpfStatus): string | null {
  switch (status) {
    case 'invalid':
      return 'CPF inválido. Verifique os números digitados.'
    case 'already_registered':
      return 'Este CPF já possui conta no app. Faça login para continuar.'
    case 'complete_credentials':
      return 'Encontramos seu cadastro na prefeitura. Defina sua senha para acessar o app.'
    default:
      return null
  }
}

export function RegisterStepProfile({
  value,
  onChange,
  onContinue,
  onSkipToPassword,
  onBack,
}: RegisterStepProfileProps) {
  const [error, setError] = useState<string | null>(null)
  const [cpfStatus, setCpfStatus] = useState<CpfStatus>('idle')
  const lastLookupCpfRef = useRef('')
  const completePatientRef = useRef<VdCadastroLookupPatient | null>(null)

  function patch(patch: Partial<RegistrationProfile>) {
    onChange({ ...value, ...patch })
  }

  useEffect(() => {
    const digits = cpfDigits(value.cpf)

    if (digits.length !== 11) {
      lastLookupCpfRef.current = ''
      completePatientRef.current = null
      setCpfStatus('idle')
      return
    }

    if (!isValidCpf(digits)) {
      lastLookupCpfRef.current = ''
      completePatientRef.current = null
      setCpfStatus('invalid')
      return
    }

    if (lastLookupCpfRef.current === digits) return

    let cancelled = false
    lastLookupCpfRef.current = digits
    setCpfStatus('checking')
    setError(null)

    void (async () => {
      try {
        const result = await lookupCpf(digits)
        if (cancelled) return

        if (result.status === 'already_registered') {
          completePatientRef.current = null
          setCpfStatus('already_registered')
          return
        }

        if (result.status === 'found_complete_needs_credentials') {
          completePatientRef.current = result.patient
          onChange(mapLookupPatientToProfile(result.patient))
          setCpfStatus('complete_credentials')
          return
        }

        completePatientRef.current = null
        setCpfStatus('valid')
      } catch (lookupError) {
        if (cancelled) return
        lastLookupCpfRef.current = ''
        completePatientRef.current = null
        setCpfStatus('idle')
        if (lookupError instanceof VdApiError) {
          setError(lookupError.message)
        } else {
          setError('Não foi possível verificar o CPF. Tente novamente.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [onChange, value.cpf])

  function handleContinue() {
    if (cpfStatus === 'complete_credentials' && completePatientRef.current) {
      const patient = completePatientRef.current
      setError(null)
      onSkipToPassword({
        profile: mapLookupPatientToProfile(patient),
        address: mapLookupPatientToAddress(patient),
        selfieUri: patient.photoDataUrl?.trim() || null,
      })
      return
    }

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
      setError('Aguarde a verificação do CPF ou informe um CPF válido.')
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
  const fieldsLocked = cpfStatus === 'complete_credentials'
  const continueDisabled =
    cpfStatus === 'checking' ||
    cpfStatus === 'invalid' ||
    cpfStatus === 'already_registered' ||
    cpfStatus === 'idle'

  return (
    <>
      <RegisterTimeline currentStep={2} />
      <LottiePlayer source={avatarAnimation} />
      <Text style={formStyles.stepTitle}>Seus dados</Text>
      <Text style={formStyles.stepSubtitle}>
        {fieldsLocked
          ? 'Seus dados já estão cadastrados na prefeitura. Confirme e crie sua senha de acesso.'
          : 'Preencha suas informações pessoais para criar sua conta.'}
      </Text>

      {error ? (
        <View style={formStyles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#ff6b6b" />
          <Text style={formStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Nome completo</Text>
        <View
          style={[
            formStyles.inputWrapper,
            fieldsLocked && formStyles.inputWrapperReadOnly,
          ]}
        >
          <Ionicons name="person-outline" size={20} color="#ff6b00" style={formStyles.inputIcon} />
          <TextInput
            value={value.name}
            onChangeText={(name) => patch({ name })}
            placeholder="Seu nome"
            placeholderTextColor="rgba(245, 245, 247, 0.35)"
            autoCapitalize="words"
            editable={!fieldsLocked}
            style={[formStyles.input, fieldsLocked && formStyles.inputReadOnly]}
          />
        </View>
      </View>

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>CPF</Text>
        <View
          style={[
            formStyles.inputWrapper,
            cpfFieldError && formStyles.inputWrapperError,
            (cpfStatus === 'valid' || cpfStatus === 'complete_credentials') && styles.inputWrapperSuccess,
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
          {cpfStatus === 'checking' ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : cpfStatus === 'valid' || cpfStatus === 'complete_credentials' ? (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          ) : null}
        </View>
        {cpfMessage ? <Text style={formStyles.fieldError}>{cpfMessage}</Text> : null}
      </View>

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>E-mail</Text>
        <View
          style={[
            formStyles.inputWrapper,
            fieldsLocked && formStyles.inputWrapperReadOnly,
          ]}
        >
          <Ionicons name="mail-outline" size={20} color="#ff6b00" style={formStyles.inputIcon} />
          <TextInput
            value={value.email}
            onChangeText={(email) => patch({ email })}
            placeholder="seu@email.com"
            placeholderTextColor="rgba(245, 245, 247, 0.35)"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!fieldsLocked}
            style={[formStyles.input, fieldsLocked && formStyles.inputReadOnly]}
          />
        </View>
      </View>

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Telefone</Text>
        <View
          style={[
            formStyles.inputWrapper,
            fieldsLocked && formStyles.inputWrapperReadOnly,
          ]}
        >
          <Ionicons name="call-outline" size={20} color="#ff6b00" style={formStyles.inputIcon} />
          <TextInput
            value={value.phone}
            onChangeText={(phone) => patch({ phone: maskPhone(phone) })}
            placeholder="(00) 00000-0000"
            placeholderTextColor="rgba(245, 245, 247, 0.35)"
            keyboardType="phone-pad"
            maxLength={15}
            editable={!fieldsLocked}
            style={[formStyles.input, fieldsLocked && formStyles.inputReadOnly]}
          />
        </View>
      </View>

      <PrimaryButton
        label={fieldsLocked ? 'Definir senha' : 'Continuar'}
        onPress={handleContinue}
        disabled={continueDisabled}
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
