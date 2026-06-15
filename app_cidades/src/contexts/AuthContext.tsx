import AsyncStorage from '@react-native-async-storage/async-storage'
import * as LocalAuthentication from 'expo-local-authentication'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AppScreen, AuthUser, RegistrationData } from '../types/auth'
import { createMockAuthUser, isValidMockCredentials } from '../config/mockAuth'
import { playLoginSound } from '../utils/appSounds'
import { cpfDigits } from '../utils/cpf'

const SESSION_KEY = '@telefarmed/session'
const BIOMETRIC_ENABLED_KEY = '@telefarmed/biometric-enabled'
const BIOMETRIC_ASKED_KEY = '@telefarmed/biometric-asked'
const BIOMETRIC_SESSION_KEY = '@telefarmed/biometric-session'

type AuthContextValue = {
  screen: AppScreen
  user: AuthUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  biometricEnabled: boolean
  canUseBiometricLogin: boolean
  shouldAskBiometric: boolean
  biometricAvailable: boolean
  navigateTo: (screen: AppScreen) => void
  goBack: () => boolean
  canGoBack: () => boolean
  completeRegistration: (data: RegistrationData) => Promise<void>
  loginWithCredentials: (cpf: string, password: string) => Promise<'success' | 'invalid'>
  enableBiometric: () => Promise<void>
  dismissBiometricPrompt: () => Promise<void>
  loginWithBiometric: () => Promise<'success' | 'cancelled' | 'failed'>
  updateSelfie: (selfieUri: string | null) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<AppScreen>('home')
  const screenHistoryRef = useRef<AppScreen[]>([])
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [biometricAsked, setBiometricAsked] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [hasBiometricSession, setHasBiometricSession] = useState(false)

  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        const [
          storedSession,
          storedBiometric,
          storedAsked,
          storedBiometricSession,
          hasHardware,
          isEnrolled,
        ] = await Promise.all([
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY),
          AsyncStorage.getItem(BIOMETRIC_ASKED_KEY),
          AsyncStorage.getItem(BIOMETRIC_SESSION_KEY),
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ])

        if (!active) return

        if (storedSession) {
          setUser(JSON.parse(storedSession) as AuthUser)
          screenHistoryRef.current = []
          setScreen('home')
        }

        setBiometricEnabled(storedBiometric === 'true')
        setBiometricAsked(storedAsked === 'true')
        setHasBiometricSession(Boolean(storedBiometricSession))
        setBiometricAvailable(hasHardware && isEnrolled)
      } finally {
        if (active) setIsBootstrapping(false)
      }
    }

    void bootstrap()
    return () => {
      active = false
    }
  }, [])

  const navigateTo = useCallback((nextScreen: AppScreen) => {
    setScreen((current) => {
      if (current === nextScreen) return current

      const history = screenHistoryRef.current
      const existingIndex = history.lastIndexOf(nextScreen)

      if (existingIndex >= 0) {
        screenHistoryRef.current = history.slice(0, existingIndex)
      } else {
        screenHistoryRef.current = [...history, current]
      }

      return nextScreen
    })
  }, [])

  const goBack = useCallback(() => {
    const history = screenHistoryRef.current
    if (history.length === 0) return false

    const previous = history[history.length - 1]
    screenHistoryRef.current = history.slice(0, -1)
    setScreen(previous)
    return true
  }, [])

  const canGoBack = useCallback(() => screenHistoryRef.current.length > 0, [])

  const finalizeLogin = useCallback(async (nextUser: AuthUser) => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    screenHistoryRef.current = []
    setScreen('home')
    void playLoginSound()
  }, [])

  const completeRegistration = useCallback(
    async (data: RegistrationData) => {
      const nextUser: AuthUser = {
        name: data.profile.name.trim(),
        cpf: data.profile.cpf,
        email: data.profile.email.trim(),
        phone: data.profile.phone,
        address: data.address,
        selfieUri: data.selfieUri,
      }

      await finalizeLogin(nextUser)
    },
    [finalizeLogin],
  )

  const loginWithCredentials = useCallback(
    async (cpf: string, password: string) => {
      if (!password.trim()) return 'invalid'

      const digits = cpfDigits(cpf)

      if (isValidMockCredentials(cpf, password)) {
        const storedSession = await AsyncStorage.getItem(SESSION_KEY)
        const storedUser = storedSession ? (JSON.parse(storedSession) as AuthUser) : null
        const nextUser =
          storedUser && cpfDigits(storedUser.cpf) === digits ? storedUser : createMockAuthUser()

        await finalizeLogin(nextUser)
        return 'success'
      }

      const [storedSession, storedBiometricSession] = await Promise.all([
        AsyncStorage.getItem(SESSION_KEY),
        AsyncStorage.getItem(BIOMETRIC_SESSION_KEY),
      ])

      const candidates = [storedSession, storedBiometricSession].filter(Boolean) as string[]
      const matchedUser = candidates
        .map((value) => JSON.parse(value) as AuthUser)
        .find((candidate) => cpfDigits(candidate.cpf) === digits)

      if (!matchedUser) return 'invalid'

      await finalizeLogin(matchedUser)
      return 'success'
    },
    [finalizeLogin],
  )

  const enableBiometric = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirmar ativação da biometria',
      cancelLabel: 'Cancelar',
    })

    if (!result.success) return

    if (user) {
      await AsyncStorage.setItem(BIOMETRIC_SESSION_KEY, JSON.stringify(user))
      setHasBiometricSession(true)
    }

    await AsyncStorage.multiSet([
      [BIOMETRIC_ENABLED_KEY, 'true'],
      [BIOMETRIC_ASKED_KEY, 'true'],
    ])
    setBiometricEnabled(true)
    setBiometricAsked(true)
  }, [user])

  const loginWithBiometric = useCallback(async () => {
    const storedBiometricSession = await AsyncStorage.getItem(BIOMETRIC_SESSION_KEY)
    if (!storedBiometricSession) return 'failed'

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Entrar com biometria',
      cancelLabel: 'Cancelar',
    })

    if (!result.success) {
      return result.error === 'user_cancel' ? 'cancelled' : 'failed'
    }

    const restoredUser = JSON.parse(storedBiometricSession) as AuthUser
    await finalizeLogin(restoredUser)
    return 'success'
  }, [finalizeLogin])

  const dismissBiometricPrompt = useCallback(async () => {
    await AsyncStorage.setItem(BIOMETRIC_ASKED_KEY, 'true')
    setBiometricAsked(true)
  }, [])

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY)
    setUser(null)
    screenHistoryRef.current = []
    setScreen('home')
  }, [])

  const updateSelfie = useCallback(
    async (selfieUri: string | null) => {
      if (!user) return

      const nextUser: AuthUser = { ...user, selfieUri }
      setUser(nextUser)

      void (async () => {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))

        const storedBiometricSession = await AsyncStorage.getItem(BIOMETRIC_SESSION_KEY)
        if (storedBiometricSession) {
          const biometricUser = JSON.parse(storedBiometricSession) as AuthUser
          if (cpfDigits(biometricUser.cpf) === cpfDigits(user.cpf)) {
            await AsyncStorage.setItem(BIOMETRIC_SESSION_KEY, JSON.stringify(nextUser))
          }
        }
      })()
    },
    [user],
  )

  const canUseBiometricLogin =
    biometricEnabled && biometricAvailable && hasBiometricSession

  const value = useMemo<AuthContextValue>(
    () => ({
      screen,
      user,
      isAuthenticated: user !== null,
      isBootstrapping,
      biometricEnabled,
      canUseBiometricLogin,
      shouldAskBiometric:
        user !== null && biometricAvailable && !biometricAsked && !biometricEnabled,
      biometricAvailable,
      navigateTo,
      goBack,
      canGoBack,
      completeRegistration,
      loginWithCredentials,
      enableBiometric,
      dismissBiometricPrompt,
      loginWithBiometric,
      updateSelfie,
      logout,
    }),
    [
      screen,
      user,
      isBootstrapping,
      biometricEnabled,
      canUseBiometricLogin,
      biometricAsked,
      biometricAvailable,
      navigateTo,
      goBack,
      canGoBack,
      completeRegistration,
      loginWithCredentials,
      enableBiometric,
      dismissBiometricPrompt,
      loginWithBiometric,
      updateSelfie,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
