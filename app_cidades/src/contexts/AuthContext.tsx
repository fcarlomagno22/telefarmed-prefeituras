import AsyncStorage from '@react-native-async-storage/async-storage'
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
import { Linking, Platform } from 'react-native'
import { getInitialAppLinkUrl } from '../adapters/appLinking'
import {
  authenticateWithBiometricsAsync,
  hasBiometricHardwareAsync,
  isBiometricEnrolledAsync,
} from '../adapters/localAuthentication'
import {
  configureWebNavigationHistory,
  ensureWebNavigationHistoryListener,
  navigateBackInBrowserHistory,
  pushNavigationHistoryState,
  resetNavigationHistoryState,
  shouldSyncBrowserHistoryOnBack,
  syncInitialNavigationHistoryState,
} from '../adapters/webNavigationHistory'
import type { WebNavigationHistoryEntry } from '../adapters/webNavigationUrl'
import { login as vdLogin, logout as vdLogout, register as vdRegister } from '../lib/api/vd'
import { VdApiError } from '../lib/api/vd/client'
import { registerVdAccessTokenRefresh } from '../lib/api/vd/vdAuthRefresh'
import { useVdAuthSessionGuard } from '../hooks/useVdAuthSessionGuard'
import {
  applyAuthSession,
  clearAuthSession,
  persistAuthUser,
  refreshVdAuthSession,
  restoreAuthSession,
  restoreSessionAfterBiometric,
} from '../lib/vd/vdAuthSession'
import { getVdAccessToken } from '../lib/vd/vdAccessToken'
import { loadPersistedRefreshToken } from '../lib/vd/vdRefreshToken'
import { AppRouteParams, AppScreen, AuthUser, RegistrationData } from '../types/auth'
import { playLoginSound } from '../utils/appSounds'
import { cpfDigits } from '../utils/cpf'
import { profilePhotoToDataUri } from '../utils/profilePhotoImage'
import {
  mapRegistrationDataToVdRegisterInput,
} from '../utils/vdAuthMapper'
import { loadActiveLiveShareSession } from '../data/runWalkLiveShareService'
import {
  buildRunWalkActiveActivityRouteParams,
  loadRunWalkActiveActivity,
} from '../data/runWalkActiveActivityStorage'
import {
  resolveIncomingAppLink,
  type ResolvedIncomingAppLink,
} from '../utils/resolveIncomingAppLink'
import { normalizeLiveShareToken } from '../utils/runWalkLiveShareToken'

const BIOMETRIC_ENABLED_KEY = '@telefarmed/biometric-enabled'
const BIOMETRIC_ASKED_KEY = '@telefarmed/biometric-asked'
const BIOMETRIC_SESSION_KEY = '@telefarmed/biometric-session'

type HistoryEntry = {
  screen: AppScreen
  params: AppRouteParams | null
}

type AuthContextValue = {
  screen: AppScreen
  routeParams: AppRouteParams | null
  user: AuthUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  biometricEnabled: boolean
  canUseBiometricLogin: boolean
  shouldAskBiometric: boolean
  biometricAvailable: boolean
  navigateTo: (screen: AppScreen, params?: AppRouteParams) => void
  goBack: () => boolean
  canGoBack: () => boolean
  completeRegistration: (data: RegistrationData) => Promise<void>
  loginWithCredentials: (cpf: string, password: string) => Promise<'success' | 'invalid'>
  enableBiometric: () => Promise<void>
  dismissBiometricPrompt: () => Promise<void>
  loginWithBiometric: () => Promise<'success' | 'cancelled' | 'failed'>
  updateSelfie: (selfieUri: string | null) => Promise<void>
  updateContact: (patch: { email?: string; phone?: string }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [routeParams, setRouteParams] = useState<AppRouteParams | null>(null)
  const routeParamsRef = useRef<AppRouteParams | null>(null)
  const screenHistoryRef = useRef<HistoryEntry[]>([])
  const screenRef = useRef<AppScreen>('home')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [biometricAsked, setBiometricAsked] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [hasBiometricSession, setHasBiometricSession] = useState(false)
  const [biometricPromptSuppressed, setBiometricPromptSuppressed] = useState(false)
  const biometricReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (biometricReleaseTimerRef.current) {
        clearTimeout(biometricReleaseTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    return registerVdAccessTokenRefresh(async () => {
      await loadPersistedRefreshToken()
      const nextUser = await refreshVdAuthSession()
      setUser(nextUser)
      return getVdAccessToken()
    })
  }, [])

  const refreshAccessToken = useCallback(async () => {
    const nextUser = await refreshVdAuthSession()
    setUser(nextUser)
    const token = getVdAccessToken()
    if (!token) throw new Error('Sessão não renovada.')
    return token
  }, [])

  useVdAuthSessionGuard({
    isAuthenticated: user !== null,
    refreshAccessToken,
  })

  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        const [
          restoredUser,
          storedBiometric,
          storedAsked,
          storedBiometricSession,
          hasHardware,
          isEnrolled,
        ] = await Promise.all([
          restoreAuthSession(),
          AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY),
          AsyncStorage.getItem(BIOMETRIC_ASKED_KEY),
          AsyncStorage.getItem(BIOMETRIC_SESSION_KEY),
          hasBiometricHardwareAsync(),
          isBiometricEnrolledAsync(),
        ])

        if (!active) return

        if (restoredUser) {
          setUser(restoredUser)

          const activeActivity = await loadRunWalkActiveActivity(restoredUser.cpf)
          if (activeActivity) {
            const liveParams = buildRunWalkActiveActivityRouteParams(activeActivity)
            screenHistoryRef.current = []
            setRouteParams(liveParams)
            routeParamsRef.current = liveParams
            setScreen('run-walk-live')
            resetNavigationHistoryState('run-walk-live', liveParams)
          } else {
            screenHistoryRef.current = []
            setRouteParams(null)
            setScreen('home')
            resetNavigationHistoryState('home', null)
          }
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

  useEffect(() => {
    routeParamsRef.current = routeParams
  }, [routeParams])

  useEffect(() => {
    screenRef.current = screen
  }, [screen])

  const syncNavigationFromBrowserRef = useRef<(entry: WebNavigationHistoryEntry) => void>(() => {})

  const syncNavigationFromBrowser = useCallback((entry: WebNavigationHistoryEntry) => {
    const history = screenHistoryRef.current
    const currentScreen = screenRef.current
    const previous = history[history.length - 1]

    if (previous?.screen === entry.screen) {
      screenHistoryRef.current = history.slice(0, -1)
    } else if (currentScreen !== entry.screen) {
      screenHistoryRef.current = [
        ...history,
        { screen: currentScreen, params: routeParamsRef.current },
      ]
    }

    setRouteParams(entry.params)
    routeParamsRef.current = entry.params
    setScreen(entry.screen)
  }, [])

  useEffect(() => {
    syncNavigationFromBrowserRef.current = syncNavigationFromBrowser
  }, [syncNavigationFromBrowser])

  useEffect(() => {
    configureWebNavigationHistory({
      getScreen: () => screenRef.current,
      getRouteParams: () => routeParamsRef.current,
      getCanGoBack: () => screenHistoryRef.current.length > 0,
      onBrowserHistoryNavigate: (entry) => {
        syncNavigationFromBrowserRef.current(entry)
      },
    })
    ensureWebNavigationHistoryListener()
  }, [])

  const navigateTo = useCallback((nextScreen: AppScreen, params?: AppRouteParams) => {
    setScreen((current) => {
      if (current === nextScreen) {
        const nextParams = params ?? null
        setRouteParams(nextParams)
        routeParamsRef.current = nextParams
        resetNavigationHistoryState(nextScreen, nextParams)
        return current
      }

      const history = screenHistoryRef.current
      const existingIndex = history.findIndex((entry) => entry.screen === nextScreen)

      if (existingIndex >= 0) {
        screenHistoryRef.current = history.slice(0, existingIndex)
      } else {
        screenHistoryRef.current = [
          ...history,
          { screen: current, params: routeParamsRef.current },
        ]
      }

      const nextParams = params ?? null
      setRouteParams(nextParams)
      routeParamsRef.current = nextParams
      pushNavigationHistoryState(nextScreen, nextParams)
      return nextScreen
    })
  }, [])

  const openLiveShareViewerFromLink = useCallback((shareToken: string) => {
    screenHistoryRef.current = []
    setRouteParams({ token: shareToken })
    setScreen('run-walk-live-viewer')
    resetNavigationHistoryState('run-walk-live-viewer', { token: shareToken })
  }, [])

  const openRunnerLiveFromPublisherLink = useCallback((activityName?: string) => {
    screenHistoryRef.current = []
    const params = activityName ? { activityName } : null
    setRouteParams(params)
    setScreen('run-walk-live')
    resetNavigationHistoryState('run-walk-live', params)
  }, [])

  const initialIncomingUrlHandledRef = useRef(false)

  useEffect(() => {
    if (isBootstrapping) return

    async function applyResolvedIncomingLink(resolved: ResolvedIncomingAppLink) {
      if (resolved.kind === 'live-share') {
        const activeSession = await loadActiveLiveShareSession()
        if (
          activeSession?.isActive &&
          normalizeLiveShareToken(activeSession.shareToken) === resolved.token
        ) {
          openRunnerLiveFromPublisherLink(activeSession.activityName)
          return
        }

        openLiveShareViewerFromLink(resolved.token)
        return
      }

      screenHistoryRef.current = []
      setRouteParams(resolved.params)
      routeParamsRef.current = resolved.params
      setScreen(resolved.screen)
      syncInitialNavigationHistoryState(resolved.screen, resolved.params)
    }

    async function handleIncomingUrl(url: string, options?: { initial?: boolean }) {
      const resolved = resolveIncomingAppLink(url)

      if (!resolved) {
        if (Platform.OS === 'web') {
          syncInitialNavigationHistoryState(screenRef.current, routeParamsRef.current)
        }
        return
      }

      if (options?.initial && initialIncomingUrlHandledRef.current) return
      if (options?.initial) initialIncomingUrlHandledRef.current = true

      await applyResolvedIncomingLink(resolved)
    }

    void getInitialAppLinkUrl().then((url) => {
      if (!url) {
        if (Platform.OS === 'web') {
          syncInitialNavigationHistoryState(screenRef.current, routeParamsRef.current)
        }
        return
      }

      void handleIncomingUrl(url, { initial: true })
    })

    const subscription = Linking.addEventListener('url', (event) => {
      void handleIncomingUrl(event.url)
    })

    return () => subscription.remove()
  }, [isBootstrapping, openLiveShareViewerFromLink, openRunnerLiveFromPublisherLink])

  const goBack = useCallback(() => {
    const history = screenHistoryRef.current
    if (history.length === 0) return false

    const previous = history[history.length - 1]
    screenHistoryRef.current = history.slice(0, -1)
    setRouteParams(previous.params)
    routeParamsRef.current = previous.params
    setScreen(previous.screen)
    if (shouldSyncBrowserHistoryOnBack()) {
      navigateBackInBrowserHistory()
    }
    return true
  }, [])

  const canGoBack = useCallback(() => screenHistoryRef.current.length > 0, [])

  const finalizeLogin = useCallback(async (nextUser: AuthUser) => {
    await persistAuthUser(nextUser)
    setUser(nextUser)
    screenHistoryRef.current = []
    setRouteParams(null)
    setScreen('home')
    resetNavigationHistoryState('home', null)
    void playLoginSound()
  }, [])

  const completeRegistration = useCallback(
    async (data: RegistrationData) => {
      if (biometricReleaseTimerRef.current) {
        clearTimeout(biometricReleaseTimerRef.current)
        biometricReleaseTimerRef.current = null
      }

      setBiometricPromptSuppressed(true)

      try {
        const photoDataUrl = data.selfieUri ? await profilePhotoToDataUri(data.selfieUri) : null
        const result = await vdRegister(mapRegistrationDataToVdRegisterInput(data, photoDataUrl))
        const nextUser = await applyAuthSession(result)

        await finalizeLogin(nextUser)

        biometricReleaseTimerRef.current = setTimeout(() => {
          setBiometricPromptSuppressed(false)
          biometricReleaseTimerRef.current = null
        }, 500)
      } catch (error) {
        setBiometricPromptSuppressed(false)
        throw error
      }
    },
    [finalizeLogin],
  )

  const loginWithCredentials = useCallback(
    async (cpf: string, password: string) => {
      if (!password.trim()) return 'invalid'

      try {
        const result = await vdLogin({ cpf, password })
        const nextUser = await applyAuthSession(result)
        await finalizeLogin(nextUser)
        return 'success'
      } catch (error) {
        if (error instanceof VdApiError) {
          if (error.status === 401 || error.status === 403 || error.status === 423) {
            return 'invalid'
          }
        }
        throw error
      }
    },
    [finalizeLogin],
  )

  const enableBiometric = useCallback(async () => {
    const result = await authenticateWithBiometricsAsync({
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

    const biometricUser = JSON.parse(storedBiometricSession) as AuthUser

    const result = await authenticateWithBiometricsAsync({
      promptMessage: 'Entrar com biometria',
      cancelLabel: 'Cancelar',
    })

    if (!result.success) {
      return result.error === 'user_cancel' ? 'cancelled' : 'failed'
    }

    const restoredUser = await restoreSessionAfterBiometric()
    if (restoredUser) {
      if (cpfDigits(restoredUser.cpf) !== cpfDigits(biometricUser.cpf)) {
        return 'failed'
      }

      await finalizeLogin(restoredUser)
      return 'success'
    }

    return 'failed'
  }, [finalizeLogin])

  const dismissBiometricPrompt = useCallback(async () => {
    await AsyncStorage.setItem(BIOMETRIC_ASKED_KEY, 'true')
    setBiometricAsked(true)
  }, [])

  const logout = useCallback(async () => {
    try {
      await vdLogout()
    } catch {
      // Clear local session even when the API logout fails offline.
    }

    await clearAuthSession()
    setUser(null)
    screenHistoryRef.current = []
    setRouteParams(null)
    setScreen('home')
    resetNavigationHistoryState('home', null)
  }, [])

  const updateSelfie = useCallback(
    async (selfieUri: string | null) => {
      if (!user) return

      const nextUser: AuthUser = { ...user, selfieUri }
      setUser(nextUser)

      void (async () => {
        await persistAuthUser(nextUser)

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

  const updateContact = useCallback(
    async (patch: { email?: string; phone?: string }) => {
      if (!user) return

      const nextUser: AuthUser = {
        ...user,
        ...(patch.email !== undefined ? { email: patch.email } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      }
      setUser(nextUser)

      void (async () => {
        await persistAuthUser(nextUser)

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
      routeParams,
      user,
      isAuthenticated: user !== null,
      isBootstrapping,
      biometricEnabled,
      canUseBiometricLogin,
      shouldAskBiometric:
        user !== null &&
        biometricAvailable &&
        !biometricAsked &&
        !biometricEnabled &&
        !biometricPromptSuppressed,
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
      updateContact,
      logout,
    }),
    [
      screen,
      routeParams,
      user,
      isBootstrapping,
      biometricEnabled,
      canUseBiometricLogin,
      biometricAsked,
      biometricAvailable,
      biometricPromptSuppressed,
      navigateTo,
      goBack,
      canGoBack,
      completeRegistration,
      loginWithCredentials,
      enableBiometric,
      dismissBiometricPrompt,
      loginWithBiometric,
      updateSelfie,
      updateContact,
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
