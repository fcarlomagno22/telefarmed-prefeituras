import { useState } from 'react'
import { AppShell } from '../components/AppShell'
import { RegisterFinishingOverlay } from '../components/register/RegisterFinishingOverlay'
import { RegisterStepCep } from '../components/register/RegisterStepCep'
import { RegisterStepFaceScan } from '../components/register/RegisterStepFaceScan'
import {
  emptyLegalAcceptances,
  RegisterStepLegal,
} from '../components/register/RegisterStepLegal'
import { RegisterStepPassword } from '../components/register/RegisterStepPassword'
import { RegisterPresentationVideoOverlay } from '../components/register/RegisterPresentationVideoOverlay'
import { RegisterStepProfile } from '../components/register/RegisterStepProfile'
import { markAppVideoUserGesture } from '../adapters/appVideo'
import { useAuth } from '../contexts/AuthContext'
import { RegistrationAddress, RegistrationData, RegistrationProfile } from '../types/auth'

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
  gender: '',
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
  const [skippedProfileAndSelfie, setSkippedProfileAndSelfie] = useState(false)

  function handleSkipToPassword(payload: {
    profile: RegistrationProfile
    address?: Partial<RegistrationAddress>
    selfieUri?: string | null
  }) {
    setProfile(payload.profile)
    if (payload.address) {
      setAddress((current) => ({ ...current, ...payload.address }))
    }
    if (payload.selfieUri !== undefined) {
      setSelfieUri(payload.selfieUri)
    }
    setSkippedProfileAndSelfie(true)
    setStep(4)
  }

  function handleStartPresentationVideo() {
    markAppVideoUserGesture()
    setShowPresentationVideo(true)
  }

  const [registrationError, setRegistrationError] = useState<string | null>(null)

  async function handleFinishRegistration() {
    setIsSubmitting(true)
    setRegistrationError(null)

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
    } catch (error) {
      setRegistrationError(
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Não foi possível concluir o cadastro. Tente novamente.',
      )
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

      {isSubmitting && !showPresentationVideo ? <RegisterFinishingOverlay /> : null}

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
          onContinue={() => {
            setSkippedProfileAndSelfie(false)
            setStep(3)
          }}
          onSkipToPassword={handleSkipToPassword}
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
          onBack={() => setStep(skippedProfileAndSelfie ? 2 : 3)}
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
          submitError={registrationError}
        />
      ) : null}
    </AppShell>
  )
}
