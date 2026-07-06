import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import successAnimation from '../../../assets/success.json'
import { colors } from '../../theme/colors'
import { playSuccessSound } from '../../utils/appSounds'
import { isValidPhone, maskPhone } from '../../utils/phone'
import { LottiePlayer } from '../LottiePlayer'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

export type MenuProfileContactField = 'email' | 'phone'

type ContactEditStep = 'form' | 'success'

type MenuProfileContactEditDrawerProps = {
  visible: boolean
  field: MenuProfileContactField | null
  initialValue?: string
  onClose: () => void
  onSave: (value: string) => void | Promise<void>
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function getFieldCopy(field: MenuProfileContactField | null, step: ContactEditStep) {
  if (step === 'success') {
    if (field === 'phone') {
      return {
        title: 'Telefone atualizado',
        subtitle: 'Seu contato foi salvo com sucesso',
        successTitle: 'Tudo certo!',
        successMessage: 'Seu telefone foi atualizado no perfil.',
      }
    }

    return {
      title: 'E-mail atualizado',
      subtitle: 'Seu contato foi salvo com sucesso',
      successTitle: 'Tudo certo!',
      successMessage: 'Seu e-mail foi atualizado no perfil.',
    }
  }

  if (field === 'phone') {
    return {
      title: 'Editar telefone',
      subtitle: 'Usado para contato e suporte',
      label: 'Telefone',
      placeholder: '(11) 98765-4321',
      keyboardType: 'phone-pad' as const,
      successTitle: '',
      successMessage: '',
    }
  }

  return {
    title: 'Editar e-mail',
    subtitle: 'Usado para login e comunicações',
    label: 'E-mail',
    placeholder: 'seu@email.com',
    keyboardType: 'email-address' as const,
    successTitle: '',
    successMessage: '',
  }
}

export function MenuProfileContactEditDrawer({
  visible,
  field,
  initialValue = '',
  onClose,
  onSave,
}: MenuProfileContactEditDrawerProps) {
  const [step, setStep] = useState<ContactEditStep>('form')
  const [draft, setDraft] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const copy = getFieldCopy(field, step)

  useEffect(() => {
    if (!visible || !field) return
    setStep('form')
    setDraft(field === 'phone' ? maskPhone(initialValue) : initialValue.trim())
    setError(null)
    setIsSaving(false)
  }, [field, initialValue, visible])

  function handleClose() {
    setStep('form')
    setError(null)
    setIsSaving(false)
    onClose()
  }

  function handleSuccessClose() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    handleClose()
  }

  function handleChange(value: string) {
    setError(null)
    setDraft(field === 'phone' ? maskPhone(value) : value)
  }

  async function handleSave() {
    const trimmed = draft.trim()
    if (!trimmed) {
      setError('Preencha este campo para continuar.')
      return
    }

    if (field === 'email' && !isValidEmail(trimmed)) {
      setError('Informe um e-mail válido.')
      return
    }

    if (field === 'phone' && !isValidPhone(trimmed)) {
      setError('Informe um telefone válido com DDD.')
      return
    }

    const nextValue = field === 'phone' ? maskPhone(trimmed) : trimmed

    setIsSaving(true)
    try {
      await onSave(nextValue)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      void playSuccessSound()
      setStep('success')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <RunWalkSheetDrawer
      visible={visible && field != null}
      title={copy.title}
      subtitle={copy.subtitle}
      onClose={step === 'success' ? handleSuccessClose : handleClose}
      hideCloseButton={step === 'success'}
      footer={
        step === 'success' ? (
          <PrimaryButton label="Fechar" onPress={handleSuccessClose} />
        ) : (
          <PrimaryButton label="Salvar" onPress={() => void handleSave()} loading={isSaving} />
        )
      }
    >
      {step === 'success' ? (
        <View style={styles.successWrap}>
          <LottiePlayer source={successAnimation} loop={false} style={styles.successLottie} />
          <Text style={styles.successTitle}>{copy.successTitle}</Text>
          <Text style={styles.successMessage}>{copy.successMessage}</Text>
        </View>
      ) : (
        <View style={styles.field}>
          <Text style={styles.label}>{copy.label}</Text>
          <TextInput
            value={draft}
            onChangeText={handleChange}
            placeholder={copy.placeholder}
            placeholderTextColor={colors.textSubtle}
            keyboardType={copy.keyboardType}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            selectionColor={colors.primary}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      )}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  successWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 8,
    gap: 10,
  },
  successLottie: {
    marginBottom: 4,
  },
  successTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  successMessage: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
})
