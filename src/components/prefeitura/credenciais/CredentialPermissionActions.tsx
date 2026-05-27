import { permissionActions, type PermissionAction } from '../../../config/accessCredentials'

const actionTone: Record<PermissionAction, string> = {
  visualizar: 'border-sky-200 bg-sky-50 text-sky-700',
  inserir: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  editar: 'border-violet-200 bg-violet-50 text-violet-700',
  excluir: 'border-red-200 bg-red-50 text-red-700',
}

type CredentialPermissionActionsProps = {
  actions: PermissionAction[]
}

export function CredentialPermissionActions({ actions }: CredentialPermissionActionsProps) {
  if (actions.length === 0) {
    return <span className="text-xs text-gray-400">—</span>
  }

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {actions.map((actionId) => {
        const config = permissionActions.find((item) => item.id === actionId)
        if (!config) return null
        return (
          <span
            key={actionId}
            className={[
              'inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold',
              actionTone[actionId],
            ].join(' ')}
          >
            {config.shortLabel}
          </span>
        )
      })}
    </div>
  )
}
