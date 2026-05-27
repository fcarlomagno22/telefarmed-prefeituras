import { ArrowRightLeft, Pencil, ShieldCheck, Trash2, UserX } from 'lucide-react'
import { PinUnlockModal } from '../users/PinUnlockModal'

export type CredentialPinAction =
  | 'edit'
  | 'edit_permissions'
  | 'deactivate'
  | 'delete'
  | 'transfer_ubt'

type CredentialActionPinModalProps = {
  open: boolean
  action: CredentialPinAction | null
  userName: string
  transferTargetUbtName?: string
  onClose: () => void
  onSuccess: () => void
}

function configFor(
  action: CredentialPinAction,
  userName: string,
  transferTargetUbtName?: string,
) {
  if (action === 'transfer_ubt') {
    const destination = transferTargetUbtName?.trim() || 'a nova UBT'
    return {
      title: 'Confirmar alteração de UBT',
      titleId: 'credential-transfer-ubt-pin-title',
      description: `Para transferir ${userName} para ${destination}, informe a senha de 6 dígitos do responsável pela unidade.`,
      submitLabel: 'Confirmar transferência',
      pinCompleteHint: 'Senha completa. Toque em confirmar transferência.',
      icon: ArrowRightLeft,
    }
  }
  if (action === 'edit') {
    return {
      title: 'Editar usuário',
      titleId: 'credential-edit-pin-title',
      description: `Para editar os dados e permissões de ${userName}, informe a senha de 6 dígitos do responsável pela unidade.`,
      submitLabel: 'Confirmar e editar',
      pinCompleteHint: 'Senha completa. Toque em confirmar e editar.',
      icon: Pencil,
    }
  }

  if (action === 'edit_permissions') {
    return {
      title: 'Editar páginas e autorizações',
      titleId: 'credential-edit-permissions-pin-title',
      description: `Para alterar as páginas e autorizações de ${userName}, informe a senha de 6 dígitos do responsável pela unidade.`,
      submitLabel: 'Confirmar e editar',
      pinCompleteHint: 'Senha completa. Toque em confirmar e editar.',
      icon: ShieldCheck,
    }
  }

  if (action === 'deactivate') {
    return {
      title: 'Desativar usuário',
      titleId: 'credential-deactivate-pin-title',
      description: `Para desativar o acesso de ${userName}, informe a senha de 6 dígitos do responsável pela unidade. O usuário não poderá entrar no painel até ser reativado.`,
      submitLabel: 'Confirmar desativação',
      pinCompleteHint: 'Senha completa. Toque em confirmar desativação.',
      icon: UserX,
    }
  }

  return {
    title: 'Excluir usuário',
    titleId: 'credential-delete-pin-title',
    description: `Para excluir permanentemente ${userName} e remover suas credenciais, informe a senha de 6 dígitos do responsável pela unidade. Esta ação não pode ser desfeita.`,
    submitLabel: 'Confirmar exclusão',
    pinCompleteHint: 'Senha completa. Toque em confirmar exclusão.',
    icon: Trash2,
  }
}

export function CredentialActionPinModal({
  open,
  action,
  userName,
  transferTargetUbtName,
  onClose,
  onSuccess,
}: CredentialActionPinModalProps) {
  if (!action) return null

  const config = configFor(action, userName, transferTargetUbtName)

  return (
    <PinUnlockModal
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title={config.title}
      titleId={config.titleId}
      description={config.description}
      submitLabel={config.submitLabel}
      pinCompleteHint={config.pinCompleteHint}
      icon={config.icon}
    />
  )
}
