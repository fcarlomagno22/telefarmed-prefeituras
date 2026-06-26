import { useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { AppShell } from '../components/AppShell'
import { RegisterStepCep } from '../components/register/RegisterStepCep'
import { RegisterStepFaceScan } from '../components/register/RegisterStepFaceScan'
import {
  emptyLegalAcceptances,
  RegisterStepLegal,
} from '../components/register/RegisterStepLegal'
import { RegisterStepPassword } from '../components/register/RegisterStepPassword'
import { RegisterPresentationVideoOverlay } from '../components/register/RegisterPresentationVideoOverlay'
import { RegisterStepProfile } from '../components/register/RegisterStepProfile'
import { useAuth } from '../contexts/AuthContext'
import { RegistrationAddress, RegistrationData, RegistrationProfile } from '../types/auth'
import { colors } from '../theme/colors'

const VIDEO_MODAL_CLOSE_MS = 400

const emptyAddress = (): RegistrationAddress => ({
  cep: '',
  street: '',
  neighborhood: '',
  city: '',
  state: '',
  number: '',
  complement: '',
})

const emptyProfile = (): RegistrationProfile => ({
  name: '',
  cpf: '',
  email: '',
  phone: '',
})

export function RegisterScreen() {
  const { completeRegistration, navigateTo } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [address, setAddress] = useState<RegistrationAddress>(emptyAddress)
  const [profile, setProfile] = useState<RegistrationProfile>(emptyProfile)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selfieUri, setSelfieUri] = useState<string | null>(null)
  const [legalAcceptances, setLegalAcceptances] = useState(emptyLegalAcceptances)
  const [showPresentationVideo, setShowPresentationVideo] = useState(false)

  function handleStartPresentationVideo() {
    setShowPresentationVideo(true)
  }

  async function handleFinishRegistration() {
    setIsSubmitting(true)

    try {
      const payload: RegistrationData = {
        address,
        profile,
        password,
        selfieUri,
        legalAcceptances: {
          ...legalAcceptances,
          acceptedAt: new Date().toISOString(),
        },
      }

      await completeRegistration(payload)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handlePresentationVideoComplete() {
    setShowPresentationVideo(false)
    setIsSubmitting(true)

    setTimeout(() => {
      void handleFinishRegistration()
    }, VIDEO_MODAL_CLOSE_MS)
  }

  const hideRegistrationSteps = showPresentationVideo || isSubmitting

  return (
    <AppShell>
      {showPresentationVideo ? (
        <RegisterPresentationVideoOverlay onComplete={handlePresentationVideoComplete} />
      ) : null}
      {showPresentationVideo ? (
        <RegisterPresentationVideoOverlay onComplete={handlePresentationVideoComplete} />
      ) : null}

      {isSubmitting && !showPresentationVideo ? (
        <View style={styles.finishingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}

      {!hideRegistrationSteps && step === 1 ? (
        <RegisterStepCep
          value={address}
          onChange={setAddress}
          onContinue={() => setStep(2)}
          onBackToLogin={() => navigateTo('login')}
        />
      ) : null}

      {!hideRegistrationSteps && step === 2 ? (
        <RegisterStepProfile
          value={profile}
          onChange={setProfile}
          onContinue={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      ) : null}

      {!hideRegistrationSteps && step === 3 ? (
        <RegisterStepFaceScan
          value={selfieUri}
          onChange={setSelfieUri}
          onContinue={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      ) : null}

      {!hideRegistrationSteps && step === 4 ? (
        <RegisterStepPassword
          password={password}
          confirmPassword={confirmPassword}
          onChangePassword={setPassword}
          onChangeConfirmPassword={setConfirmPassword}
          onSubmit={() => setStep(5)}
          onBack={() => setStep(3)}
          isSubmitting={false}
        />
      ) : null}

      {!hideRegistrationSteps && step === 5 ? (
        <RegisterStepLegal
          value={legalAcceptances}
          onChange={setLegalAcceptances}
          onSubmit={handleStartPresentationVideo}
          onBack={() => setStep(4)}
          isSubmitting={isSubmitting || showPresentationVideo}
        />
      ) : null}
    </AppShell>
  )
}

const styles = StyleSheet.create({
  finishingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
})
