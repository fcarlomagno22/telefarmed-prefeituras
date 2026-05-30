import { Eye, Trash2, type LucideIcon } from 'lucide-react'
import { PinUnlockModal } from '../../users/PinUnlockModal'

export type AdminConfigLegalPinAction = 'publish' | 'delete'

type AdminConfigLegalPinModalProps = {
  open: boolean
  action: AdminConfigLegalPinAction | null
  documentTitle: string
  onClose: () => void
  onSuccess: () => void
  verifyPin?: (pin: string) => Promise<boolean>
}

const actionConfig: Record<
  AdminConfigLegalPinAction,
  {
    title: string
    titleId: string
    description: (label: string) => string
    submitLabel: string
    pinCompleteHint: string
    icon: LucideIcon
  }
> = {
  publish: {
    title: 'Publicar documento legal',
    titleId: 'admin-config-legal-publish-pin-title',
    description: (label) =>
      `Para publicar "${label}" e torná-lo visível nos portais selecionados, informe sua senha de autorização de 6 dígitos.`,
    submitLabel: 'Confirmar publicação',
    pinCompleteHint: 'Senha completa. Toque em confirmar publicação.',
    icon: Eye,
  },
  delete: {
    title: 'Excluir documento legal',
    titleId: 'admin-config-legal-delete-pin-title',
    description: (label) =>
      `Para excluir permanentemente "${label}", informe sua senha de autorização de 6 dígitos. Esta ação não pode ser desfeita.`,
    submitLabel: 'Confirmar exclusão',
    pinCompleteHint: 'Senha completa. Toque em confirmar exclusão.',
    icon: Trash2,
  },
}

export function AdminConfigLegalPinModal({
  open,
  action,
  documentTitle,
  onClose,
  onSuccess,
  verifyPin,
}: AdminConfigLegalPinModalProps) {
  if (!action) return null

  const label = documentTitle.trim() || 'este documento'
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
