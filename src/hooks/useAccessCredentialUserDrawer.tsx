import { useCallback, useState } from 'react'
import {
  AccessCredentialUserDrawer,
  type AccessCredentialDrawerMode,
} from '../components/credenciais/AccessCredentialUserDrawer'
import { initialAccessCredentialUsers, type AccessCredentialUser } from '../data/accessCredentialsMock'
import { Toast } from '../components/ui/Toast'

export function useAccessCredentialUserDrawer() {
  const [users, setUsers] = useState<AccessCredentialUser[]>(initialAccessCredentialUsers)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [editingUser, setEditingUser] = useState<AccessCredentialUser | null>(null)
  const [drawerMode, setDrawerMode] = useState<AccessCredentialDrawerMode>('create')
  const [toast, setToast] = useState<{ message: string } | null>(null)

  const openCreate = useCallback(() => {
    setEditingUser(null)
    setDrawerMode('create')
    setClosing(false)
    setOpen(true)
  }, [])

  const openEdit = useCallback((user: AccessCredentialUser) => {
    setEditingUser(user)
    setDrawerMode('edit')
    setClosing(false)
    setOpen(true)
  }, [])

  const openView = useCallback((user: AccessCredentialUser) => {
    setEditingUser(user)
    setDrawerMode('view')
    setClosing(false)
    setOpen(true)
  }, [])

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

  const handleSave = useCallback(
    (user: AccessCredentialUser) => {
      setUsers((prev) => {
        const exists = prev.some((item) => item.id === user.id)
        if (exists) {
          return prev.map((item) => (item.id === user.id ? user : item))
        }
        return [...prev, user]
      })
      setClosing(true)
      setToast({
        message:
          drawerMode === 'edit'
            ? 'Usuário atualizado com sucesso.'
            : 'Usuário cadastrado com sucesso.',
      })
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
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onSave={handleSave}
      />
      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant="success"
        onClose={dismissToast}
      />
    </>
  )

  return {
    users,
    setUsers,
    openCreate,
    openEdit,
    openView,
    drawerElement,
  }
}
