import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ActionToast } from '../ActionToast'
import { AppModal } from '../AppModal'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import { useGuestAuth } from '../../contexts/GuestAuthContext'
import { useMyRoutineProfile } from '../../hooks/useMyRoutineProfile'
import { clearMyRoutinePatientData } from '../../data/myRoutineResetStorage'
import type { MyRoutineOnboardingRecord } from '../../types/myRoutine'
import type { MyRoutineWeeklyHistoryPoint } from '../../utils/myRoutineHistoryStats'
import { PrimaryButton } from '../PrimaryButton'
import { MyRoutineEssentialsEditorDrawer } from './MyRoutineEssentialsEditorDrawer'
import { MyRoutineHistoryDetailDrawer } from './MyRoutineHistoryDetailDrawer'
import { MyRoutinePreferencesDrawer } from './MyRoutinePreferencesDrawer'
import { MyRoutinePrivacyDrawer } from './MyRoutinePrivacyDrawer'
import { MyRoutineProfileRefreshDrawer } from './MyRoutineProfileRefreshDrawer'
import { MyRoutineProfileTab, type MyRoutineProfileTabProps } from './MyRoutineProfileTab'
import { MyRoutineSettingsDrawer } from './MyRoutineSettingsDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

type DrawerKey = 'preferences' | 'essentials' | 'refresh' | 'history' | 'privacy'

type MyRoutineProfileProviderProps = {
  children: ReactNode
  bottomPadding: number
  patientCpf: string
  record: MyRoutineOnboardingRecord
  refreshKey?: number
  settingsVisible?: boolean
  onSettingsVisibleChange?: (visible: boolean) => void
  onOpenHowItWorks?: () => void
  onPartialRefresh?: () => void
  onFullReset?: () => void
}

type MyRoutineProfileContextValue = {
  tabProps: Omit<MyRoutineProfileTabProps, 'bottomPadding' | 'onOpenHowItWorks'> & {
    onOpenHowItWorks?: () => void
  }
}

const MyRoutineProfileContext = createContext<MyRoutineProfileContextValue | null>(null)

export function useMyRoutineProfileContext() {
  const value = useContext(MyRoutineProfileContext)
  if (!value) {
    throw new Error('useMyRoutineProfileContext must be used within MyRoutineProfileProvider')
  }
  return value
}

export function MyRoutineProfileProvider({
  children,
  bottomPadding,
  patientCpf,
  record,
  refreshKey = 0,
  settingsVisible = false,
  onSettingsVisibleChange,
  onOpenHowItWorks,
  onPartialRefresh,
  onFullReset,
}: MyRoutineProfileProviderProps) {
  const styles = useThemedStyles(createStyles)
  const { requireAuth } = useGuestAuth()
  const guardRoutine = (action: () => void) => {
    requireAuth('vida:my-routine', action)
  }
  const profile = useMyRoutineProfile({ patientCpf, record, refreshKey })

  const [activeDrawer, setActiveDrawer] = useState<DrawerKey | null>(null)
  const [selectedHistoryPoint, setSelectedHistoryPoint] =
    useState<MyRoutineWeeklyHistoryPoint | null>(null)
  const [resetConfirmVisible, setResetConfirmVisible] = useState(false)
  const [mapView, setMapView] = useState<'current' | 'ideal' | 'both'>('both')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const closeDrawers = useCallback(() => {
    setActiveDrawer(null)
    setSelectedHistoryPoint(null)
  }, [])

  const anyOverlayOpen =
    settingsVisible || activeDrawer != null || resetConfirmVisible || toastMessage != null

  useAndroidBackHandler(
    useCallback(() => {
      if (resetConfirmVisible) {
        setResetConfirmVisible(false)
        return true
      }
      if (settingsVisible) {
        onSettingsVisibleChange?.(false)
        return true
      }
      if (activeDrawer) {
        closeDrawers()
        return true
      }
      return false
    }, [activeDrawer, closeDrawers, onSettingsVisibleChange, resetConfirmVisible, settingsVisible]),
    anyOverlayOpen,
  )

  const idealLabels = useMemo(() => {
    const tier = profile.onboardingRecord.idealRoutine.weekday
    return [...tier.essential, ...tier.desirable, ...tier.bonus]
  }, [profile.onboardingRecord.idealRoutine.weekday])

  const preferenceSummary = useMemo(() => {
    if (!profile.preferences) return { notifications: '—', schedule: '—', intensity: '—' }
    const scheduleLabels = { fixed: 'Horário fixo', window: 'Janelas flexíveis', trigger: 'Gatilhos' }
    const intensityLabels = { light: 'Leve', moderate: 'Moderada', ambitious: 'Ambiciosa' }
    return {
      notifications: profile.preferences.notificationsEnabled ? 'Ativas' : 'Desativadas',
      schedule: scheduleLabels[profile.preferences.scheduleStyle],
      intensity: intensityLabels[profile.preferences.intensity],
    }
  }, [profile.preferences])

  function openDrawer(key: DrawerKey) {
    guardRoutine(() => {
      onSettingsVisibleChange?.(false)
      setActiveDrawer(key)
    })
  }

  function handleSelectHistoryWeek(point: MyRoutineWeeklyHistoryPoint) {
    guardRoutine(() => {
      setSelectedHistoryPoint(point)
      setActiveDrawer('history')
    })
  }

  async function handleConfirmReset() {
    await clearMyRoutinePatientData(patientCpf)
    setResetConfirmVisible(false)
    onSettingsVisibleChange?.(false)
    closeDrawers()
    setToastMessage('Rotina reiniciada. Vamos recomeçar.')
    onFullReset?.()
  }

  async function handlePartialRefresh() {
    await profile.requestPartialOnboardingRefresh()
    closeDrawers()
    onPartialRefresh?.()
  }

  const tabProps: MyRoutineProfileContextValue['tabProps'] = {
    isLoading: profile.isLoading,
    mapView,
    onMapViewChange: setMapView,
    currentActivityLabels: profile.currentActivityLabels,
    idealActivityIds: idealLabels,
    essentials: profile.essentials,
    preferencesSummary: preferenceSummary,
    historySeries: profile.historySeries,
    onEditEssentials: () => openDrawer('essentials'),
    onOpenPreferences: () => openDrawer('preferences'),
    onSelectHistoryWeek: handleSelectHistoryWeek,
    onOpenHowItWorks,
    onOpenPrivacy: () => openDrawer('privacy'),
    onOpenRefresh: () => openDrawer('refresh'),
    onRequestFullReset: () => guardRoutine(() => setResetConfirmVisible(true)),
  }

  return (
    <MyRoutineProfileContext.Provider value={{ tabProps }}>
      {children}

      <MyRoutineSettingsDrawer
        visible={settingsVisible}
        onClose={() => onSettingsVisibleChange?.(false)}
        preferencesSummary={preferenceSummary}
        essentialsCount={profile.essentials.length}
        onOpenPreferences={() => openDrawer('preferences')}
        onOpenEssentials={() => openDrawer('essentials')}
        onOpenRefresh={() => openDrawer('refresh')}
        onOpenHowItWorks={() => {
          onSettingsVisibleChange?.(false)
          onOpenHowItWorks?.()
        }}
        onOpenPrivacy={() => openDrawer('privacy')}
        onRequestFullReset={() => {
          onSettingsVisibleChange?.(false)
          setResetConfirmVisible(true)
        }}
      />

      <MyRoutinePreferencesDrawer
        visible={activeDrawer === 'preferences'}
        preferences={profile.preferences}
        onClose={closeDrawers}
        onSave={async (patch) => {
          await profile.savePreferences(patch)
          setToastMessage('Preferências salvas')
          closeDrawers()
        }}
      />

      <MyRoutineEssentialsEditorDrawer
        visible={activeDrawer === 'essentials'}
        essentials={profile.essentials}
        onClose={closeDrawers}
        onSave={async (next) => {
          await profile.saveEssentials(next)
          setToastMessage('Rotina mínima atualizada')
          closeDrawers()
        }}
      />

      <MyRoutineProfileRefreshDrawer
        visible={activeDrawer === 'refresh'}
        onClose={closeDrawers}
        onConfirm={() => void handlePartialRefresh()}
      />

      <MyRoutineHistoryDetailDrawer
        visible={activeDrawer === 'history'}
        point={selectedHistoryPoint}
        onClose={closeDrawers}
      />

      <MyRoutinePrivacyDrawer visible={activeDrawer === 'privacy'} onClose={closeDrawers} />

      <AppModal
        visible={resetConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetConfirmVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Recomeçar do zero?</Text>
            <Text style={styles.modalBody}>
              Isso apaga seu plano, histórico diário, preferências e onboarding. Você voltará ao
              início da configuração.
            </Text>
            <PrimaryButton
              label="Recomeçar"
              onPress={() => void handleConfirmReset()}
              style={styles.modalBtn}
            />
            <Pressable
              onPress={() => setResetConfirmVisible(false)}
              style={styles.modalLinkWrap}
            >
              <Text style={styles.modalLink}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>

      <ActionToast
        message={toastMessage}
        onHidden={() => setToastMessage(null)}
        bottomOffset={bottomPadding}
      />
    </MyRoutineProfileContext.Provider>
  )
}

export function MyRoutineProfileTabConnected({
  bottomPadding,
  onOpenHowItWorks,
}: {
  bottomPadding: number
  onOpenHowItWorks?: () => void
}) {
  const { tabProps } = useMyRoutineProfileContext()
  return (
    <MyRoutineProfileTab
      bottomPadding={bottomPadding}
      onOpenHowItWorks={onOpenHowItWorks}
      {...tabProps}
    />
  )
}

function createStyles(colors: ThemeColors) {
  return {
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    padding: 18,
    gap: 12,
    backgroundColor: 'rgba(22, 16, 28, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.22)',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  modalBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  modalBtn: { marginTop: 4 },
  modalLinkWrap: { alignSelf: 'center', paddingVertical: 8 },
  modalLink: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
}
}

