import { useCallback, useState } from 'react'
import { EditUnlockModal } from '../components/users/EditUnlockModal'
import { LgpdUnlockModal } from '../components/users/LgpdUnlockModal'
import { UserDetailDrawer } from '../components/users/UserDetailDrawer'
import { Toast } from '../components/ui/Toast'
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
import type { NetworkUser } from '../data/networkUsersMock'
import type { PatientContact } from '../data/unitDashboardMock'
import { getLoggedOperatorName } from '../utils/sessionUser'

export function useNetworkUserDrawer() {
  const [sensitiveDataUnlocked, setSensitiveDataUnlocked] = useState(false)
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string } | null>(null)
  const [drawerUser, setDrawerUser] = useState<NetworkUser | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editSessionKey, setEditSessionKey] = useState(0)
  const [userEditsMap, setUserEditsMap] = useState<Record<string, UserProfileEdits>>({})
  const [annotationsMap, setAnnotationsMap] = useState<Record<string, UserAnnotation[]>>({})
  const [lastReviewedMap, setLastReviewedMap] = useState<Record<string, string>>({})
  const [, setChangeLogsMap] = useState<Record<string, ChangeLogEntry[]>>({})
  const [contactLogsMap, setContactLogsMap] = useState<Record<string, PatientContactLogEntry[]>>({
    '1': [
      {
        id: 'contact-seed-1',
        at: new Date(Date.now() - 86400000 * 3).toISOString(),
        channel: 'whatsapp',
        phone: '(11) 98604-5105',
        note: 'Confirmação de retorno agendado',
        authorLabel: getLoggedOperatorName(),
      },
    ],
  })

  const loggedOperatorName = getLoggedOperatorName()

  const showSuccessToast = useCallback((message: string) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const seedAnnotationsIfNeeded = useCallback((user: NetworkUser) => {
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
  }, [])

  const openUser = useCallback(
    (user: NetworkUser) => {
      setDrawerClosing(false)
      setDrawerUser(user)
      setDrawerOpen(true)
      seedAnnotationsIfNeeded(user)
    },
    [seedAnnotationsIfNeeded],
  )

  const closeUser = useCallback(() => {
    setDrawerClosing(true)
  }, [])

  const handleDrawerTransitionEnd = useCallback(() => {
    if (drawerClosing) {
      setDrawerOpen(false)
      setDrawerUser(null)
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

  const handleSaveUserEdits = useCallback(
    (edits: UserProfileEdits, changedFields: string[]) => {
      if (!drawerUser) return
      setUserEditsMap((prev) => ({ ...prev, [drawerUser.id]: edits }))
      setLastReviewedMap((prev) => ({ ...prev, [drawerUser.id]: new Date().toISOString() }))
      appendChangeLog(drawerUser.id, buildEditChangeSummary(changedFields))
      showSuccessToast('Alterações salvas com sucesso.')
    },
    [appendChangeLog, drawerUser, showSuccessToast],
  )

  const handleSaveUserContacts = useCallback(
    (contacts: PatientContact[]) => {
      if (!drawerUser) return
      const previous = userEditsMap[drawerUser.id]
      const profile = getNetworkUserProfile(drawerUser)
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
      setUserEditsMap((prev) => ({ ...prev, [drawerUser.id]: merged }))
      appendChangeLog(drawerUser.id, 'Contatos de emergência atualizados')
      showSuccessToast('Alterações salvas com sucesso.')
    },
    [appendChangeLog, drawerUser, showSuccessToast, userEditsMap],
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
    },
    [drawerUser, loggedOperatorName, showSuccessToast],
  )

  const handleAddAnnotation = useCallback(
    (text: string) => {
      if (!drawerUser) return
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
    },
    [drawerUser, loggedOperatorName, showSuccessToast],
  )

  const drawerLayer = (
    <>
      <LgpdUnlockModal
          open={unlockModalOpen}
          onClose={() => setUnlockModalOpen(false)}
          onSuccess={() => {
            setSensitiveDataUnlocked(true)
            showSuccessToast('Dados liberados com sucesso.')
          }}
        />
        <EditUnlockModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => {
            setSensitiveDataUnlocked(true)
            setEditSessionKey((key) => key + 1)
            showSuccessToast('Edição liberada com sucesso.')
          }}
        />
        <Toast message={toast?.message ?? ''} visible={toast !== null} onClose={dismissToast} />
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
        />
    </>
  )

  return {
    sensitiveDataUnlocked,
    setSensitiveDataUnlocked,
    openUnlockModal: () => setUnlockModalOpen(true),
    openUser,
    drawerLayer,
  }
}
