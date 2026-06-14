import { useCallback, useMemo } from 'react'
import type { SystemPageId, PermissionAction } from '../config/accessCredentials'
import {
  resolveDefaultUbtHomePath,
  resolveFirstAccessibleUbtPath,
  ubtUserCan,
  ubtUserCanViewPage,
} from '../config/ubtPageAccess'
import { useUbtAuth } from '../contexts/UbtAuthContext'

export function useUbtPageAccess(page?: SystemPageId) {
  const { user } = useUbtAuth()

  const can = useCallback(
    (targetPage: SystemPageId, action: PermissionAction) => ubtUserCan(user, targetPage, action),
    [user],
  )

  const canView = useCallback(
    (targetPage: SystemPageId) => ubtUserCanViewPage(user, targetPage),
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
      canView: ubtUserCan(user, page, 'visualizar'),
      canInsert: ubtUserCan(user, page, 'inserir'),
      canEdit: ubtUserCan(user, page, 'editar'),
      canDelete: ubtUserCan(user, page, 'excluir'),
    }
  }, [page, user])

  return {
    user,
    can,
    canView,
    pageAccess,
    defaultHomePath: resolveDefaultUbtHomePath(user),
    firstAccessiblePath: resolveFirstAccessibleUbtPath(user),
  }
}
