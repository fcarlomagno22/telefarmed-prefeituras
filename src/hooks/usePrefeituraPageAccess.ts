import { useCallback, useMemo } from 'react'
import type { PrefeituraPortalPageId } from '../config/prefeituraCredenciaisConfig'
import type { PermissionAction } from '../config/accessCredentials'
import {
  prefeituraUserCan,
  prefeituraUserCanViewPage,
  resolveDefaultPrefeituraHomePath,
  resolveFirstAccessiblePrefeituraPath,
} from '../config/prefeituraPageAccess'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'

export function usePrefeituraPageAccess(page?: PrefeituraPortalPageId) {
  const { user } = usePrefeituraAuth()

  const can = useCallback(
    (targetPage: PrefeituraPortalPageId, action: PermissionAction) =>
      prefeituraUserCan(user, targetPage, action),
    [user],
  )

  const canView = useCallback(
    (targetPage: PrefeituraPortalPageId) => prefeituraUserCanViewPage(user, targetPage),
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
      canView: prefeituraUserCan(user, page, 'visualizar'),
      canInsert: prefeituraUserCan(user, page, 'inserir'),
      canEdit: prefeituraUserCan(user, page, 'editar'),
      canDelete: prefeituraUserCan(user, page, 'excluir'),
    }
  }, [page, user])

  return {
    user,
    can,
    canView,
    pageAccess,
    defaultHomePath: resolveDefaultPrefeituraHomePath(user),
    firstAccessiblePath: resolveFirstAccessiblePrefeituraPath(user),
  }
}
