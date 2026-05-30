import { Ban, Pencil, Trash2, UserCheck, type LucideIcon } from 'lucide-react'
import { PinUnlockModal } from '../../users/PinUnlockModal'

export type AdminConfigContractTypePinAction = 'edit' | 'delete' | 'activate' | 'deactivate'

type AdminConfigContractTypePinModalProps = {
  open: boolean
  action: AdminConfigContractTypePinAction | null
  contractLabel: string
  onClose: () => void
  onSuccess: () => void
  verifyPin?: (pin: string) => Promise<boolean>
}

const actionConfig: Record<
  AdminConfigContractTypePinAction,
  {
    title: string
    titleId: string
    description: (label: string) => string
    submitLabel: string
    pinCompleteHint: string
    icon: LucideIcon
  }
> = {
  edit: {
    title: 'Editar tipo de contrato',
    titleId: 'admin-config-contract-type-edit-pin-title',
    description: (label) =>
      `Para editar "${label}", informe sua senha de autorização de 6 dígitos.`,
    submitLabel: 'Confirmar e editar',
    pinCompleteHint: 'Senha completa. Toque em confirmar e editar.',
    icon: Pencil,
  },
  delete: {
    title: 'Excluir tipo de contrato',
    titleId: 'admin-config-contract-type-delete-pin-title',
    description: (label) =>
      `Para excluir "${label}", informe sua senha de autorização de 6 dígitos.`,
    submitLabel: 'Confirmar exclusão',
    pinCompleteHint: 'Senha completa. Toque em confirmar exclusão.',
    icon: Trash2,
  },
  activate: {
    title: 'Ativar tipo de contrato',
    titleId: 'admin-config-contract-type-activate-pin-title',
    description: (label) =>
      `Para ativar "${label}", informe sua senha de autorização de 6 dígitos.`,
    submitLabel: 'Confirmar ativação',
    pinCompleteHint: 'Senha completa. Toque em confirmar ativação.',
    icon: UserCheck,
  },
  deactivate: {
    title: 'Inativar tipo de contrato',
    titleId: 'admin-config-contract-type-deactivate-pin-title',
    description: (label) =>
      `Para inativar "${label}", informe sua senha de autorização de 6 dígitos.`,
    submitLabel: 'Confirmar inativação',
    pinCompleteHint: 'Senha completa. Toque em confirmar inativação.',
    icon: Ban,
  },
}

export function AdminConfigContractTypePinModal({
  open,
  action,
  contractLabel,
  onClose,
  onSuccess,
  verifyPin,
}: AdminConfigContractTypePinModalProps) {
  if (!action) return null

  const label = contractLabel.trim() || 'este tipo de contrato'
  const config = actionConfig[action]

  return (
    <PinUnlockModal
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      verifyPin={verifyPin}
      title={config.title}
      titleId={config.titleId}
      description={config.description(label)}
      submitLabel={config.submitLabel}
      pinCompleteHint={config.pinCompleteHint}
      icon={config.icon}
    />
  )
}
