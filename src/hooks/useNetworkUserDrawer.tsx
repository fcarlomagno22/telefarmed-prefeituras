import { useCallback, useState } from 'react'
import { EditUnlockModal } from '../components/users/EditUnlockModal'
import { LgpdUnlockModal } from '../components/users/LgpdUnlockModal'
import { UserDetailDrawer } from '../components/users/UserDetailDrawer'
import { Toast, type ToastVariant } from '../components/ui/Toast'
import {
  buildEditChangeSummary,
  createActivityId,
  type ChangeLogEntry,
  type ContactChannel,
  type PatientContactLogEntry,
  type TeamContactRecord,
} from '../data/networkUserActivity'
import {
  createAnnotationId,
  type UserAnnotation,
  type UserProfileEdits,
} from '../data/networkUserLocalData'
import { getNetworkUserProfile } from '../data/networkUserProfiles'
import type { NetworkUserFullProfile } from '../data/networkUserProfiles'
import type { NetworkUser } from '../data/networkUsersMock'
import type { PatientContact } from '../types/attendance'
import {
  createUbtPacienteAnotacao,
  createUbtPacienteRegistroContato,
  fetchUbtPacienteAnotacoes,
  fetchUbtPacienteContatosRegistrados,
  inactivateUbtPacienteApi,
  updateUbtPacienteApi,
  type UbtPacienteRegistrationDetail,
} from '../lib/services/ubt/pacientes'
import { mergeDrawerEditsIntoRegistration } from '../utils/ubtPacienteDrawerPersistence'
import { getLoggedOperatorName } from '../utils/sessionUser'
import { useOptionalUbtLgpd } from '../contexts/UbtLgpdContext'

type UseNetworkUserDrawerOptions = {
  getAccessToken?: () => string | null
  loadPacienteDetail?: (pacienteId: string) => Promise<{
    row: NetworkUser
    profile: NetworkUserFullProfile
    extraContextItems?: { label: string; value: string }[]
    detail?: UbtPacienteRegistrationDetail
  }>
  canInactivate?: boolean
  onPatientInactivated?: () => void
}

export function useNetworkUserDrawer(options: UseNetworkUserDrawerOptions = {}) {
  const persistEnabled = Boolean(options.getAccessToken && options.loadPacienteDetail)
  const lgpdUnlock = useOptionalUbtLgpd()
  const persistLgpd = persistEnabled && lgpdUnlock

  const [localSensitiveUnlocked, setLocalSensitiveUnlocked] = useState(false)
  const sensitiveDataUnlocked = persistLgpd
    ? lgpdUnlock.sensitiveDataUnlocked
    : localSensitiveUnlocked
  const setSensitiveDataUnlocked = persistLgpd
    ? lgpdUnlock.setSensitiveDataUnlocked
    : setLocalSensitiveUnlocked
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const [drawerUser, setDrawerUser] = useState<NetworkUser | null>(null)
  const [profileOverride, setProfileOverride] = useState<NetworkUserFullProfile | null>(null)
  const [extraContextItems, setExtraContextItems] = useState<{ label: string; value: string }[]>(
    [],
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editSessionKey, setEditSessionKey] = useState(0)
  const [activePacienteId, setActivePacienteId] = useState<string | null>(null)
  const [activePacienteDetail, setActivePacienteDetail] = useState<UbtPacienteRegistrationDetail | null>(
    null,
  )
  const [userEditsMap, setUserEditsMap] = useState<Record<string, UserProfileEdits>>({})
  const [annotationsMap, setAnnotationsMap] = useState<Record<string, UserAnnotation[]>>({})
  const [lastReviewedMap, setLastReviewedMap] = useState<Record<string, string>>({})
  const [, setChangeLogsMap] = useState<Record<string, ChangeLogEntry[]>>({})
  const [contactLogsMap, setContactLogsMap] = useState<Record<string, PatientContactLogEntry[]>>({})

  const loggedOperatorName = getLoggedOperatorName()

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const showSuccessToast = useCallback(
    (message: string) => showToast(message, 'success'),
    [showToast],
  )

  const showErrorToast = useCallback((message: string) => showToast(message, 'error'), [showToast])

  const dismissToast = useCallback(() => setToast(null), [])

  const loadPacienteActivity = useCallback(
    async (pacienteId: string, userId: string) => {
      const token = options.getAccessToken?.()
      if (!token) return

      try {
        const [annotations, contactLogs] = await Promise.all([
          fetchUbtPacienteAnotacoes(token, pacienteId),
          fetchUbtPacienteContatosRegistrados(token, pacienteId),
        ])

        setAnnotationsMap((prev) => ({
          ...prev,
          [userId]: annotations.map((item) => ({
            id: item.id,
            text: item.text,
            createdAt: item.createdAt,
            authorLabel: item.authorLabel,
          })),
        }))

        setContactLogsMap((prev) => ({
          ...prev,
          [userId]: contactLogs.map((item) => ({
            id: item.id,
            at: item.at,
            channel: item.channel,
            phone: item.phone,
            note: item.note,
            authorLabel: item.authorLabel,
          })),
        }))
      } catch {
        showErrorToast('Não foi possível carregar anotações e contatos do paciente.')
      }
    },
    [options.getAccessToken, showErrorToast],
  )

  const seedAnnotationsIfNeeded = useCallback(
    (user: NetworkUser) => {
      if (persistEnabled) return
      const profile = getNetworkUserProfile(user)
      if (!profile.notes) return
      setAnnotationsMap((prev) => {
        if (prev[user.id]?.length) return prev
        return {
          ...prev,
          [user.id]: [
            {
              id: createAnnotationId(),
              text: profile.notes,
              createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
              authorLabel: 'Cadastro inicial',
            },
          ],
        }
      })
    },
    [persistEnabled],
  )

  const refreshPacienteDrawer = useCallback(
    async (pacienteId: string) => {
      if (!options.loadPacienteDetail) return null
      const refreshed = await options.loadPacienteDetail(pacienteId)
      setDrawerUser(refreshed.row)
      setProfileOverride(refreshed.profile)
      setExtraContextItems(refreshed.extraContextItems ?? [])
      if (refreshed.detail) {
        setActivePacienteDetail(refreshed.detail)
      }
      return refreshed
    },
    [options.loadPacienteDetail],
  )

  const openUser = useCallback(
    (user: NetworkUser) => {
      setDrawerClosing(false)
      setProfileOverride(null)
      setExtraContextItems([])
      setActivePacienteId(null)
      setActivePacienteDetail(null)
      setDrawerUser(user)
      setDrawerOpen(true)
      seedAnnotationsIfNeeded(user)
    },
    [seedAnnotationsIfNeeded],
  )

  const openUserWithPacienteDetail = useCallback(
    (pacienteId: string, fallbackUser: NetworkUser) => {
      setDrawerClosing(false)
      setProfileOverride(null)
      setExtraContextItems([])
      setActivePacienteId(pacienteId)
      setActivePacienteDetail(null)
      setDrawerUser(fallbackUser)
      setDrawerOpen(true)
      seedAnnotationsIfNeeded(fallbackUser)

      if (!options.loadPacienteDetail) return

      void (async () => {
        try {
          const { row, profile, extraContextItems: contextItems = [], detail } =
            await options.loadPacienteDetail!(pacienteId)
          setDrawerUser(row)
          setProfileOverride(profile)
          setExtraContextItems(contextItems)
          if (detail) {
            setActivePacienteDetail(detail)
          }
          if (persistEnabled) {
            await loadPacienteActivity(pacienteId, row.id)
          }
        } catch {
          showErrorToast('Não foi possível carregar o cadastro completo do paciente.')
        }
      })()
    },
    [
      loadPacienteActivity,
      options.loadPacienteDetail,
      persistEnabled,
      seedAnnotationsIfNeeded,
      showErrorToast,
    ],
  )

  const closeUser = useCallback(() => {
    setDrawerClosing(true)
  }, [])

  const handleDrawerTransitionEnd = useCallback(() => {
    if (drawerClosing) {
      setDrawerOpen(false)
      setDrawerUser(null)
      setProfileOverride(null)
      setExtraContextItems([])
      setActivePacienteId(null)
      setActivePacienteDetail(null)
      setDrawerClosing(false)
      setEditSessionKey(0)
    }
  }, [drawerClosing])

  const appendChangeLog = useCallback(
    (userId: string, summary: string, details?: string) => {
      const entry: ChangeLogEntry = {
        id: createActivityId('chg'),
        at: new Date().toISOString(),
        authorLabel: loggedOperatorName,
        summary,
        details,
      }
      setChangeLogsMap((prev) => ({
        ...prev,
        [userId]: [entry, ...(prev[userId] ?? [])],
      }))
    },
    [loggedOperatorName],
  )

  const persistPatientRegistration = useCallback(
    async (edits: UserProfileEdits) => {
      if (!drawerUser || !activePacienteId || !activePacienteDetail) {
        throw new Error('Paciente não carregado.')
      }

      const token = options.getAccessToken?.()
      if (!token) {
        throw new Error('Sessão expirada.')
      }

      const registration = mergeDrawerEditsIntoRegistration(activePacienteDetail, edits)
      await updateUbtPacienteApi(token, activePacienteId, registration)
      await refreshPacienteDrawer(activePacienteId)
    },
    [
      activePacienteDetail,
      activePacienteId,
      drawerUser,
      options.getAccessToken,
      refreshPacienteDrawer,
    ],
  )

  const handleSaveUserEdits = useCallback(
    (edits: UserProfileEdits, changedFields: string[]) => {
      if (!drawerUser) return

      void (async () => {
        if (persistEnabled && activePacienteId && activePacienteDetail) {
          try {
            await persistPatientRegistration(edits)
            setUserEditsMap((prev) => {
              const next = { ...prev }
              delete next[drawerUser.id]
              return next
            })
            setLastReviewedMap((prev) => ({ ...prev, [drawerUser.id]: new Date().toISOString() }))
            appendChangeLog(drawerUser.id, buildEditChangeSummary(changedFields))
            showSuccessToast('Alterações salvas com sucesso.')
          } catch {
            showErrorToast('Não foi possível salvar as alterações do paciente.')
          }
          return
        }

        setUserEditsMap((prev) => ({ ...prev, [drawerUser.id]: edits }))
        setLastReviewedMap((prev) => ({ ...prev, [drawerUser.id]: new Date().toISOString() }))
        appendChangeLog(drawerUser.id, buildEditChangeSummary(changedFields))
        showSuccessToast('Alterações salvas com sucesso.')
      })()
    },
    [
      activePacienteDetail,
      activePacienteId,
      appendChangeLog,
      drawerUser,
      persistEnabled,
      persistPatientRegistration,
      showErrorToast,
      showSuccessToast,
    ],
  )

  const handleSaveUserContacts = useCallback(
    (contacts: PatientContact[]) => {
      if (!drawerUser) return

      const previous = userEditsMap[drawerUser.id]
      const profile = profileOverride ?? getNetworkUserProfile(drawerUser)
      const merged: UserProfileEdits = {
        phone: previous?.phone ?? drawerUser.phone,
        email: previous?.email ?? profile.email,
        zipCode: previous?.zipCode ?? profile.zipCode,
        street: previous?.street ?? profile.street,
        number: previous?.number ?? profile.number,
        complement: previous?.complement ?? profile.complement,
        neighborhood: previous?.neighborhood ?? profile.neighborhood,
        city: previous?.city ?? profile.city,
        state: previous?.state ?? profile.state,
        guardianName: previous?.guardianName ?? profile.guardianName,
        guardianCpf: previous?.guardianCpf ?? profile.guardianCpf,
        contacts,
      }

      void (async () => {
        if (persistEnabled && activePacienteId && activePacienteDetail) {
          try {
            await persistPatientRegistration(merged)
            setUserEditsMap((prev) => {
              const next = { ...prev }
              delete next[drawerUser.id]
              return next
            })
            appendChangeLog(drawerUser.id, 'Contatos de emergência atualizados')
            showSuccessToast('Alterações salvas com sucesso.')
          } catch {
            showErrorToast('Não foi possível salvar os contatos do paciente.')
          }
          return
        }

        setUserEditsMap((prev) => ({ ...prev, [drawerUser.id]: merged }))
        appendChangeLog(drawerUser.id, 'Contatos de emergência atualizados')
        showSuccessToast('Alterações salvas com sucesso.')
      })()
    },
    [
      activePacienteDetail,
      activePacienteId,
      appendChangeLog,
      drawerUser,
      persistEnabled,
      persistPatientRegistration,
      profileOverride,
      showErrorToast,
      showSuccessToast,
      userEditsMap,
    ],
  )

  const lastTeamContactForUser = useCallback(
    (userId: string): TeamContactRecord | null => {
      const logs = contactLogsMap[userId] ?? []
      if (!logs.length) return null
      const latest = logs[0]!
      return {
        at: latest.at,
        channel: latest.channel,
        note: latest.note,
        authorLabel: latest.authorLabel,
      }
    },
    [contactLogsMap],
  )

  const handleRegisterContact = useCallback(
    (channel: ContactChannel, phone: string, note: string) => {
      if (!drawerUser) return

      void (async () => {
        if (persistEnabled && activePacienteId) {
          const token = options.getAccessToken?.()
          if (!token) {
            showErrorToast('Sessão expirada.')
            return
          }

          try {
            const contactLog = await createUbtPacienteRegistroContato(token, activePacienteId, {
              channel,
              phone,
              note: note.trim(),
            })
            setContactLogsMap((prev) => ({
              ...prev,
              [drawerUser.id]: [
                {
                  id: contactLog.id,
                  at: contactLog.at,
                  channel: contactLog.channel,
                  phone: contactLog.phone,
                  note: contactLog.note,
                  authorLabel: contactLog.authorLabel,
                },
                ...(prev[drawerUser.id] ?? []),
              ],
            }))
            showSuccessToast('Contato registrado com sucesso.')
          } catch {
            showErrorToast('Não foi possível registrar o contato.')
          }
          return
        }

        const entry: PatientContactLogEntry = {
          id: createActivityId('contact'),
          at: new Date().toISOString(),
          channel,
          phone,
          note: note.trim(),
          authorLabel: loggedOperatorName,
        }
        setContactLogsMap((prev) => ({
          ...prev,
          [drawerUser.id]: [entry, ...(prev[drawerUser.id] ?? [])],
        }))
        showSuccessToast('Contato registrado com sucesso.')
      })()
    },
    [
      activePacienteId,
      drawerUser,
      loggedOperatorName,
      options.getAccessToken,
      persistEnabled,
      showErrorToast,
      showSuccessToast,
    ],
  )

  const handleAddAnnotation = useCallback(
    (text: string) => {
      if (!drawerUser) return

      void (async () => {
        if (persistEnabled && activePacienteId) {
          const token = options.getAccessToken?.()
          if (!token) {
            showErrorToast('Sessão expirada.')
            return
          }

          try {
            const annotation = await createUbtPacienteAnotacao(token, activePacienteId, text)
            setAnnotationsMap((prev) => ({
              ...prev,
              [drawerUser.id]: [
                {
                  id: annotation.id,
                  text: annotation.text,
                  createdAt: annotation.createdAt,
                  authorLabel: annotation.authorLabel,
                },
                ...(prev[drawerUser.id] ?? []),
              ],
            }))
            showSuccessToast('Anotação criada com sucesso.')
          } catch {
            showErrorToast('Não foi possível criar a anotação.')
          }
          return
        }

        const annotation: UserAnnotation = {
          id: createAnnotationId(),
          text,
          createdAt: new Date().toISOString(),
          authorLabel: loggedOperatorName,
        }
        setAnnotationsMap((prev) => ({
          ...prev,
          [drawerUser.id]: [annotation, ...(prev[drawerUser.id] ?? [])],
        }))
        showSuccessToast('Anotação criada com sucesso.')
      })()
    },
    [
      activePacienteId,
      drawerUser,
      loggedOperatorName,
      options.getAccessToken,
      persistEnabled,
      showErrorToast,
      showSuccessToast,
    ],
  )

  const handleInactivatePatient = useCallback(() => {
    if (!activePacienteId || !options.canInactivate) return

    void (async () => {
      const token = options.getAccessToken?.()
      if (!token) {
        showErrorToast('Sessão expirada.')
        return
      }

      try {
        await inactivateUbtPacienteApi(token, activePacienteId)
        closeUser()
        options.onPatientInactivated?.()
        showSuccessToast('Cadastro inativado com sucesso.')
      } catch {
        showErrorToast('Não foi possível inativar o cadastro do paciente.')
      }
    })()
  }, [
    activePacienteId,
    closeUser,
    options.canInactivate,
    options.getAccessToken,
    options.onPatientInactivated,
    showErrorToast,
    showSuccessToast,
  ])

  const drawerLayer = (
    <>
      <LgpdUnlockModal
        open={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        onSuccess={() => {
          if (!persistLgpd) setSensitiveDataUnlocked(true)
          if (persistLgpd && activePacienteId) {
            void refreshPacienteDrawer(activePacienteId)
          }
          showSuccessToast('Dados liberados com sucesso.')
        }}
        verifyPin={persistLgpd ? lgpdUnlock.verifyAndUnlock : undefined}
      />
      <EditUnlockModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          if (!persistLgpd) setSensitiveDataUnlocked(true)
          setEditSessionKey((key) => key + 1)
          showSuccessToast('Edição liberada com sucesso.')
        }}
        verifyPin={persistLgpd ? lgpdUnlock.verifyAndUnlock : undefined}
      />
      <UserDetailDrawer
        user={drawerUser}
        open={drawerOpen}
        closing={drawerClosing}
        sensitiveDataUnlocked={sensitiveDataUnlocked}
        editSessionKey={editSessionKey}
        userEdits={drawerUser ? userEditsMap[drawerUser.id] ?? null : null}
        annotations={drawerUser ? annotationsMap[drawerUser.id] ?? [] : []}
        onClose={closeUser}
        onTransitionEnd={handleDrawerTransitionEnd}
        onRequestUnlock={() => setUnlockModalOpen(true)}
        onRequestEditUnlock={() => setEditModalOpen(true)}
        lastReviewedAt={drawerUser ? lastReviewedMap[drawerUser.id] ?? null : null}
        contactLogs={drawerUser ? contactLogsMap[drawerUser.id] ?? [] : []}
        lastTeamContact={drawerUser ? lastTeamContactForUser(drawerUser.id) : null}
        onSaveEdits={handleSaveUserEdits}
        onSaveContacts={handleSaveUserContacts}
        onRegisterContact={handleRegisterContact}
        onAddAnnotation={handleAddAnnotation}
        canInactivate={options.canInactivate}
        onInactivate={handleInactivatePatient}
        profileOverride={profileOverride}
        extraContextItems={extraContextItems}
        medicalRecordId={drawerUser?.municipalRecordId ?? null}
      />
      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant ?? 'success'}
        onClose={dismissToast}
      />
    </>
  )

  return {
    sensitiveDataUnlocked,
    setSensitiveDataUnlocked,
    lockSensitiveData: persistLgpd
      ? () => void lgpdUnlock.lockSensitiveData()
      : () => setSensitiveDataUnlocked(false),
    openUnlockModal: () => setUnlockModalOpen(true),
    openUser,
    openUserWithPacienteDetail,
    drawerLayer,
  }
}
