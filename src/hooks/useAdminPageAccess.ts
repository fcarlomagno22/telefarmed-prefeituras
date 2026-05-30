import { useCallback, useMemo } from 'react'
import type { AdminPortalPageId } from '../config/adminCredenciaisConfig'
import type { PermissionAction } from '../config/accessCredentials'
import {
  adminUserCan,
  adminUserCanViewPage,
  resolveDefaultAdminHomePath,
  resolveFirstAccessibleAdminPath,
} from '../config/adminPageAccess'
import { useAdminAuth } from '../contexts/AdminAuthContext'

export function useAdminPageAccess(page?: AdminPortalPageId) {
  const { user } = useAdminAuth()

  const can = useCallback(
    (targetPage: AdminPortalPageId, action: PermissionAction) =>
      adminUserCan(user, targetPage, action),
    [user],
  )

  const canView = useCallback(
    (targetPage: AdminPortalPageId) => adminUserCanViewPage(user, targetPage),
    [user],
  )

  const pageAccess = useMemo(() => {
    if (!page) {
      return {
        canView: false,
        canInsert: false,
        canEdit: false,
        canDelete: false,
      }
    }

    return {
      canView: adminUserCan(user, page, 'visualizar'),
      canInsert: adminUserCan(user, page, 'inserir'),
      canEdit: adminUserCan(user, page, 'editar'),
      canDelete: adminUserCan(user, page, 'excluir'),
    }
  }, [page, user])

  return {
    user,
    can,
    canView,
    pageAccess,
    defaultHomePath: resolveDefaultAdminHomePath(user),
    firstAccessiblePath: resolveFirstAccessibleAdminPath(user),
  }
}
