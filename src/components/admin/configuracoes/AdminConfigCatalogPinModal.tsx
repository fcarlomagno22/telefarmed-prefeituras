import { Ban, Pencil, Plus, Trash2, UserCheck, type LucideIcon } from 'lucide-react'
import { PinUnlockModal } from '../../users/PinUnlockModal'

export type AdminConfigCatalogPinAction = 'create' | 'edit' | 'delete' | 'activate' | 'deactivate'

type AdminConfigCatalogPinModalProps = {
  open: boolean
  action: AdminConfigCatalogPinAction | null
  itemLabel: string
  entityLabel: string
  onClose: () => void
  onSuccess: () => void
  verifyPin?: (pin: string) => Promise<boolean>
}

const actionVerbs: Record<
  AdminConfigCatalogPinAction,
  { verb: string; submitLabel: string; pinCompleteHint: string; icon: LucideIcon }
> = {
  create: {
    verb: 'criar',
    submitLabel: 'Confirmar e criar',
    pinCompleteHint: 'Senha completa. Toque em confirmar e criar.',
    icon: Plus,
  },
  edit: {
    verb: 'editar',
    submitLabel: 'Confirmar e editar',
    pinCompleteHint: 'Senha completa. Toque em confirmar e editar.',
    icon: Pencil,
  },
  delete: {
    verb: 'excluir',
    submitLabel: 'Confirmar exclusão',
    pinCompleteHint: 'Senha completa. Toque em confirmar exclusão.',
    icon: Trash2,
  },
  activate: {
    verb: 'ativar',
    submitLabel: 'Confirmar ativação',
    pinCompleteHint: 'Senha completa. Toque em confirmar ativação.',
    icon: UserCheck,
  },
  deactivate: {
    verb: 'inativar',
    submitLabel: 'Confirmar inativação',
    pinCompleteHint: 'Senha completa. Toque em confirmar inativação.',
    icon: Ban,
  },
}

export function AdminConfigCatalogPinModal({
  open,
  action,
  itemLabel,
  entityLabel,
  onClose,
  onSuccess,
  verifyPin,
}: AdminConfigCatalogPinModalProps) {
  if (!action) return null

  const label = itemLabel.trim() || `esta ${entityLabel}`
  const config = actionVerbs[action]
  const title = `${config.verb.charAt(0).toUpperCase()}${config.verb.slice(1)} ${entityLabel}`
  const description =
    action === 'create'
      ? `Para criar uma nova ${entityLabel}, informe sua senha de autorização de 6 dígitos.`
      : `Para ${config.verb} "${label}", informe sua senha de autorização de 6 dígitos.`

  return (
    <PinUnlockModal
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      verifyPin={verifyPin}
      title={title}
      titleId={`admin-config-catalog-${action}-pin-title`}
      description={description}
      submitLabel={config.submitLabel}
      pinCompleteHint={config.pinCompleteHint}
      icon={config.icon}
    />
  )
}
