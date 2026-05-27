import { useCallback, useState } from 'react'
import { AccessCredentialUserDrawer } from '../components/credenciais/AccessCredentialUserDrawer'
import {
  CredentialActionPinModal,
  type CredentialPinAction,
} from '../components/credenciais/CredentialActionPinModal'
import type { AccessCredentialUser } from '../data/accessCredentialsMock'
import {
  enrichPrefeituraCredentialUser,
  isResponsibleUbtRole,
  prefeituraAccessCredentialUsers,
  prefeituraCredentialsUbtOptions,
  transferPrefeituraCredentialToUbt,
  type PrefeituraAccessCredentialUser,
} from '../data/prefeituraAccessCredentialsMock'
import { Toast } from '../components/ui/Toast'

function demoteOtherResponsibles(
  users: PrefeituraAccessCredentialUser[],
  ubtId: string,
  keepUserId: string,
) {
  return users.map((user) => {
    if (user.ubtId !== ubtId || user.id === keepUserId || !user.isUbtResponsible) {
      return user
    }
    return {
      ...user,
      isUbtResponsible: false,
      role: user.role === 'Responsável pela UBT' ? 'Gestor da UBT' : user.role,
    }
  })
}

type PendingPinAction = {
  type: CredentialPinAction
  user: PrefeituraAccessCredentialUser
  transferTargetUbtId?: string
  transferTargetUbtName?: string
}

export function usePrefeituraAccessCredentialUserDrawer() {
  const [users, setUsers] = useState<PrefeituraAccessCredentialUser[]>(
    prefeituraAccessCredentialUsers,
  )
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [editingUser, setEditingUser] = useState<AccessCredentialUser | null>(null)
  const [drawerMode, setDrawerMode] = useState<
    'create' | 'edit' | 'edit_permissions' | 'view'
  >('create')
  const [pendingPin, setPendingPin] = useState<PendingPinAction | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null,
  )

  const openCreate = useCallback(() => {
    setEditingUser(null)
    setDrawerMode('create')
    setClosing(false)
    setOpen(true)
  }, [])

  const openView = useCallback((user: PrefeituraAccessCredentialUser) => {
    setEditingUser(user)
    setDrawerMode('view')
    setClosing(false)
    setOpen(true)
  }, [])

  const openEdit = useCallback((user: PrefeituraAccessCredentialUser) => {
    setEditingUser(user)
    setDrawerMode('edit')
    setClosing(false)
    setOpen(true)
  }, [])

  const requestPinAction = useCallback(
    (
      type: CredentialPinAction,
      user: PrefeituraAccessCredentialUser,
      extras?: { transferTargetUbtId: string; transferTargetUbtName: string },
    ) => {
      setPendingPin({ type, user, ...extras })
    },
    [],
  )

  const requestClose = useCallback(() => {
    setClosing(true)
  }, [])

  const handleTransitionEnd = useCallback(() => {
    if (closing) {
      setOpen(false)
      setClosing(false)
      setEditingUser(null)
      setDrawerMode('create')
    }
  }, [closing])

  function executePinAction() {
    if (!pendingPin) return

    const { type, user, transferTargetUbtId, transferTargetUbtName } = pendingPin
    setPendingPin(null)

    if (type === 'edit') {
      openEdit(user)
      return
    }

    if (type === 'edit_permissions') {
      setEditingUser(user)
      setDrawerMode('edit_permissions')
      setClosing(false)
      setOpen(true)
      setToast({
        message: 'Permissões liberadas para edição.',
        variant: 'success',
      })
      return
    }

    if (type === 'transfer_ubt' && transferTargetUbtId) {
      try {
        const transferred = transferPrefeituraCredentialToUbt(user, transferTargetUbtId)
        setUsers((prev) =>
          prev.map((item) => (item.id === user.id ? transferred : item)),
        )
        if (open && editingUser?.id === user.id) {
          setEditingUser(transferred)
        }
        setToast({
          message: `Usuário transferido para ${transferTargetUbtName ?? transferred.ubtName}.`,
          variant: 'success',
        })
      } catch {
        setToast({ message: 'UBT de destino inválida.', variant: 'error' })
      }
      return
    }

    if (type === 'deactivate') {
      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? { ...item, status: 'inativo' } : item)),
      )
      if (open && editingUser?.id === user.id) setClosing(true)
      setToast({ message: 'Usuário desativado com sucesso.', variant: 'success' })
      return
    }

    setUsers((prev) => prev.filter((item) => item.id !== user.id))
    if (open && editingUser?.id === user.id) setClosing(true)
    setToast({ message: 'Usuário excluído com sucesso.', variant: 'success' })
  }

  const handleSave = useCallback(
    (user: AccessCredentialUser) => {
      const ubtId = user.ubtId
      if (!ubtId) return

      const isResponsible = user.isUbtResponsible ?? isResponsibleUbtRole(user.role)

      try {
        const enriched = enrichPrefeituraCredentialUser(user, ubtId, isResponsible)

        setUsers((prev) => {
          const exists = prev.some((item) => item.id === enriched.id)
          let next = exists
            ? prev.map((item) => (item.id === enriched.id ? enriched : item))
            : [...prev, enriched]

          if (isResponsible) {
            next = demoteOtherResponsibles(next, enriched.ubtId, enriched.id)
          }

          return next
        })

        setClosing(true)
        setToast({
          message:
            drawerMode === 'edit_permissions'
              ? 'Permissões atualizadas com sucesso.'
              : drawerMode === 'edit'
                ? 'Usuário atualizado com sucesso.'
                : 'Usuário cadastrado na UBT com sucesso.',
          variant: 'success',
        })
      } catch {
        setToast({
          message: 'Selecione uma UBT válida para o usuário.',
          variant: 'error',
        })
      }
    },
    [drawerMode],
  )

  const dismissToast = useCallback(() => setToast(null), [])

  const drawerElement = (
    <>
      <AccessCredentialUserDrawer
        open={open}
        closing={closing}
        mode={drawerMode}
        editingUser={editingUser}
        municipalConfig={{ ubtOptions: prefeituraCredentialsUbtOptions }}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onSave={handleSave}
      />
      <CredentialActionPinModal
        open={pendingPin !== null}
        action={pendingPin?.type ?? null}
        userName={pendingPin?.user.name ?? ''}
        transferTargetUbtName={pendingPin?.transferTargetUbtName}
        onClose={() => setPendingPin(null)}
        onSuccess={executePinAction}
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
    users,
    setUsers,
    openCreate,
    openView,
    openEdit,
    requestPinAction,
    drawerElement,
  }
}
