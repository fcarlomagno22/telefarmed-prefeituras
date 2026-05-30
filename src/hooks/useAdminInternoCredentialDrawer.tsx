import { useCallback, useState } from 'react'
import { AdminInternoCredentialDrawer } from '../components/admin/credenciais/AdminInternoCredentialDrawer'
import type { AdminInternoCredentialUser } from '../config/adminCredenciaisConfig'
import {
  CredentialActionPinModal,
  type CredentialPinAction,
} from '../components/credenciais/CredentialActionPinModal'
import { Toast } from '../components/ui/Toast'
import {
  activateInternoCredential,
  createInternoCredential,
  deactivateInternoCredential,
  deleteInternoCredential,
  isCredenciaisApiError,
  updateInternoCredential,
} from '../lib/api/adminCredenciaisApi'
import { AdminAuthApiError, verifyAdminAuthorizationPin } from '../lib/api/adminAuthApi'
import { cpfDigits } from '../utils/cpf'

type UseAdminInternoCredentialDrawerOptions = {
  getAccessToken: () => string | null
  onDataChanged?: () => Promise<void>
}

type PendingInternoPin = {
  pinAction: CredentialPinAction
  user: AdminInternoCredentialUser
  secrets?: { password?: string; authorizationPin?: string | null }
}

const SAVE_PIN_ACTIONS = new Set<CredentialPinAction>(['save_interno_create', 'save_interno_edit'])

export function useAdminInternoCredentialDrawer(
  rows: AdminInternoCredentialUser[],
  onRowsChange: (rows: AdminInternoCredentialUser[]) => void,
  options: UseAdminInternoCredentialDrawerOptions,
) {
  const { getAccessToken, onDataChanged } = options
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit' | 'view'>('view')
  const [editingUser, setEditingUser] = useState<AdminInternoCredentialUser | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [pendingPin, setPendingPin] = useState<PendingInternoPin | null>(null)

  const openCreate = useCallback(() => {
    setEditingUser(null)
    setMode('create')
    setClosing(false)
    setOpen(true)
  }, [])

  const openView = useCallback((user: AdminInternoCredentialUser) => {
    setEditingUser(user)
    setMode('view')
    setClosing(false)
    setOpen(true)
  }, [])

  const openEdit = useCallback((user: AdminInternoCredentialUser) => {
    setEditingUser(user)
    setMode('edit')
    setClosing(false)
    setOpen(true)
  }, [])

  const requestPinAction = useCallback(
    (
      pinAction: Extract<CredentialPinAction, 'edit' | 'deactivate' | 'reactivate' | 'delete'>,
      user: AdminInternoCredentialUser,
    ) => {
      setPendingPin({ pinAction, user })
    },
    [],
  )

  const requestClose = useCallback(() => setClosing(true), [])

  const handleTransitionEnd = useCallback(() => {
    if (closing) {
      setOpen(false)
      setClosing(false)
      setEditingUser(null)
    }
  }, [closing])

  const persistSave = useCallback(
    async (
      user: AdminInternoCredentialUser,
      secrets?: { password?: string; authorizationPin?: string | null },
    ) => {
      const token = getAccessToken()
      if (!token) {
        setToast({ message: 'Sessão expirada. Faça login novamente.', variant: 'error' })
        return
      }

      setIsSaving(true)
      try {
        const isCreate = mode === 'create'
        const payload = {
          name: user.name,
          email: user.email,
          cpf: cpfDigits(user.cpf),
          role: user.role,
          departmentId: user.departmentId,
          accessLevel: user.accessLevel,
          status: user.status,
          pagePermissions: user.pagePermissions,
          password: secrets?.password,
          authorizationPin: secrets?.authorizationPin ?? undefined,
        }

        if (isCreate) {
          if (!secrets?.password) {
            setToast({ message: 'Informe a senha de acesso.', variant: 'error' })
            return
          }
          const saved = await createInternoCredential(token, {
            ...payload,
            password: secrets.password,
          })
          onRowsChange([...rows, saved])
          setToast({ message: 'Acesso interno cadastrado.', variant: 'success' })
        } else {
          const saved = await updateInternoCredential(token, user.id, {
            name: payload.name,
            email: payload.email,
            cpf: payload.cpf,
            role: payload.role,
            departmentId: payload.departmentId,
            accessLevel: payload.accessLevel,
            status: payload.status,
            pagePermissions: payload.pagePermissions,
            password: secrets?.password,
            authorizationPin: secrets?.authorizationPin,
          })
          onRowsChange(rows.map((row) => (row.id === user.id ? saved : row)))
          setToast({ message: 'Colaborador atualizado com sucesso.', variant: 'success' })
        }

        setClosing(true)
        await onDataChanged?.()
      } catch (error) {
        const message = isCredenciaisApiError(error)
          ? error.message
          : 'Não foi possível salvar o colaborador.'
        setToast({ message, variant: 'error' })
      } finally {
        setIsSaving(false)
      }
    },
    [getAccessToken, mode, onDataChanged, onRowsChange, rows],
  )

  const persistDeactivate = useCallback(
    async (userId: string) => {
      const token = getAccessToken()
      if (!token) {
        setToast({ message: 'Sessão expirada. Faça login novamente.', variant: 'error' })
        return
      }

      try {
        const saved = await deactivateInternoCredential(token, userId)
        onRowsChange(rows.map((row) => (row.id === userId ? saved : row)))
        setToast({ message: 'Acesso bloqueado.', variant: 'success' })
        await onDataChanged?.()
      } catch (error) {
        const message = isCredenciaisApiError(error)
          ? error.message
          : 'Não foi possível bloquear o colaborador.'
        setToast({ message, variant: 'error' })
      }
    },
    [getAccessToken, onDataChanged, onRowsChange, rows],
  )

  const persistActivate = useCallback(
    async (userId: string) => {
      const token = getAccessToken()
      if (!token) {
        setToast({ message: 'Sessão expirada. Faça login novamente.', variant: 'error' })
        return
      }

      try {
        const saved = await activateInternoCredential(token, userId)
        onRowsChange(rows.map((row) => (row.id === userId ? saved : row)))
        if (open && editingUser?.id === userId) {
          setEditingUser(saved)
        }
        setToast({ message: 'Acesso desbloqueado. O colaborador já pode entrar no painel.', variant: 'success' })
        await onDataChanged?.()
      } catch (error) {
        const message = isCredenciaisApiError(error)
          ? error.message
          : 'Não foi possível desbloquear o colaborador.'
        setToast({ message, variant: 'error' })
      }
    },
    [editingUser?.id, getAccessToken, onDataChanged, onRowsChange, open, rows],
  )

  const persistDelete = useCallback(
    async (userId: string) => {
      const token = getAccessToken()
      if (!token) {
        setToast({ message: 'Sessão expirada. Faça login novamente.', variant: 'error' })
        return
      }

      try {
        await deleteInternoCredential(token, userId)
        onRowsChange(rows.filter((row) => row.id !== userId))
        if (editingUser?.id === userId) setClosing(true)
        setToast({ message: 'Colaborador removido.', variant: 'success' })
        await onDataChanged?.()
      } catch (error) {
        const message = isCredenciaisApiError(error)
          ? error.message
          : 'Não foi possível excluir o colaborador.'
        setToast({ message, variant: 'error' })
      }
    },
    [editingUser?.id, getAccessToken, onDataChanged, onRowsChange, rows],
  )

  const handleDrawerSave = useCallback(
    (
      user: AdminInternoCredentialUser,
      secrets?: { password?: string; authorizationPin?: string | null },
    ) => {
      setPendingPin({
        pinAction: mode === 'create' ? 'save_interno_create' : 'save_interno_edit',
        user,
        secrets,
      })
    },
    [mode],
  )

  const executePinAction = useCallback(async () => {
    if (!pendingPin) return

    const snapshot = pendingPin
    setPendingPin(null)

    if (SAVE_PIN_ACTIONS.has(snapshot.pinAction)) {
      await persistSave(snapshot.user, snapshot.secrets)
      return
    }

    if (snapshot.pinAction === 'edit') {
      openEdit(snapshot.user)
      return
    }

    if (snapshot.pinAction === 'deactivate') {
      await persistDeactivate(snapshot.user.id)
      return
    }

    if (snapshot.pinAction === 'reactivate') {
      await persistActivate(snapshot.user.id)
      return
    }

    if (snapshot.pinAction === 'delete') {
      await persistDelete(snapshot.user.id)
    }
  }, [openEdit, pendingPin, persistActivate, persistDeactivate, persistDelete, persistSave])

  const verifyAdminPin = useCallback(
    async (pin: string) => {
      const token = getAccessToken()
      if (!token) return false

      try {
        await verifyAdminAuthorizationPin(token, pin)
        return true
      } catch (error) {
        if (error instanceof AdminAuthApiError && error.code === 'PIN_NOT_CONFIGURED') {
          setToast({ message: error.message, variant: 'error' })
          setPendingPin(null)
        }
        return false
      }
    },
    [getAccessToken],
  )

  const drawerElement = (
    <>
      <AdminInternoCredentialDrawer
        open={open}
        closing={closing}
        mode={mode}
        editingUser={editingUser}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onSave={handleDrawerSave}
        isSaving={isSaving}
      />
      <CredentialActionPinModal
        open={pendingPin !== null}
        action={pendingPin?.pinAction ?? null}
        userName={pendingPin?.user.name ?? ''}
        pinAudience="admin"
        onClose={() => setPendingPin(null)}
        onSuccess={() => void executePinAction()}
        verifyPin={verifyAdminPin}
      />
      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant ?? 'success'}
        onClose={() => setToast(null)}
      />
    </>
  )

  return {
    openCreate,
    openView,
    requestPinAction,
    drawerElement,
    isSaving,
  }
}
