import { ArrowRightLeft, Pencil, ShieldCheck, Trash2, UserCheck, UserPlus, UserX } from 'lucide-react'
import { PinUnlockModal } from '../users/PinUnlockModal'

export type CredentialPinAction =
  | 'edit'
  | 'edit_permissions'
  | 'deactivate'
  | 'reactivate'
  | 'delete'
  | 'transfer_ubt'
  | 'save_interno_create'
  | 'save_interno_edit'

type CredentialActionPinModalProps = {
  open: boolean
  action: CredentialPinAction | null
  userName: string
  transferTargetUbtName?: string
  /** Textos do modal para ações sensíveis (editar, bloquear, excluir). */
  pinAudience?: 'admin' | 'portal'
  onClose: () => void
  onSuccess: () => void
  verifyPin?: (pin: string) => Promise<boolean>
}

function adminPinPhrase() {
  return 'informe sua senha de autorização de 6 dígitos'
}

function portalPinPhrase() {
  return 'informe a senha de 6 dígitos do responsável pela unidade'
}

function configFor(
  action: CredentialPinAction,
  userName: string,
  transferTargetUbtName?: string,
  pinAudience: 'admin' | 'portal' = 'portal',
) {
  const pinPhrase = pinAudience === 'admin' ? adminPinPhrase() : portalPinPhrase()
  if (action === 'save_interno_create') {
    return {
      title: 'Confirmar novo acesso interno',
      titleId: 'credential-save-interno-create-pin-title',
      description: `Para cadastrar ${userName} no painel administrativo, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar cadastro',
      pinCompleteHint: 'Senha completa. Toque em confirmar cadastro.',
      icon: UserPlus,
    }
  }

  if (action === 'save_interno_edit') {
    return {
      title: 'Confirmar alterações',
      titleId: 'credential-save-interno-edit-pin-title',
      description: `Para salvar as alterações de ${userName}, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar e salvar',
      pinCompleteHint: 'Senha completa. Toque em confirmar e salvar.',
      icon: Pencil,
    }
  }

  if (action === 'transfer_ubt') {
    const destination = transferTargetUbtName?.trim() || 'a nova UBT'
    return {
      title: 'Confirmar alteração de UBT',
      titleId: 'credential-transfer-ubt-pin-title',
      description: `Para transferir ${userName} para ${destination}, ${pinPhrase}.`,
      submitLabel: 'Confirmar transferência',
      pinCompleteHint: 'Senha completa. Toque em confirmar transferência.',
      icon: ArrowRightLeft,
    }
  }
  if (action === 'edit') {
    return {
      title: pinAudience === 'admin' ? 'Editar colaborador' : 'Editar usuário',
      titleId: 'credential-edit-pin-title',
      description: `Para editar os dados e permissões de ${userName}, ${pinPhrase}.`,
      submitLabel: 'Confirmar e editar',
      pinCompleteHint: 'Senha completa. Toque em confirmar e editar.',
      icon: Pencil,
    }
  }

  if (action === 'edit_permissions') {
    return {
      title: 'Editar páginas e autorizações',
      titleId: 'credential-edit-permissions-pin-title',
      description: `Para alterar as páginas e autorizações de ${userName}, ${pinPhrase}.`,
      submitLabel: 'Confirmar e editar',
      pinCompleteHint: 'Senha completa. Toque em confirmar e editar.',
      icon: ShieldCheck,
    }
  }

  if (action === 'deactivate') {
    return {
      title: pinAudience === 'admin' ? 'Bloquear colaborador' : 'Bloquear usuário',
      titleId: 'credential-deactivate-pin-title',
      description: `Para bloquear o acesso de ${userName}, ${pinPhrase}. O usuário não poderá entrar no painel até ser desbloqueado.`,
      submitLabel: 'Confirmar bloqueio',
      pinCompleteHint: 'Senha completa. Toque em confirmar bloqueio.',
      icon: UserX,
    }
  }

  if (action === 'reactivate') {
    return {
      title: pinAudience === 'admin' ? 'Desbloquear colaborador' : 'Desbloquear usuário',
      titleId: 'credential-reactivate-pin-title',
      description: `Para desbloquear o acesso de ${userName}, ${pinPhrase}. O login será liberado imediatamente.`,
      submitLabel: 'Confirmar desbloqueio',
      pinCompleteHint: 'Senha completa. Toque em confirmar desbloqueio.',
      icon: UserCheck,
    }
  }

  return {
    title: pinAudience === 'admin' ? 'Excluir colaborador' : 'Excluir usuário',
    titleId: 'credential-delete-pin-title',
    description: `Para excluir permanentemente ${userName} e remover suas credenciais, ${pinPhrase}. Esta ação não pode ser desfeita.`,
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
  pinAudience = 'portal',
  onClose,
  onSuccess,
  verifyPin,
}: CredentialActionPinModalProps) {
  if (!action) return null

  const config = configFor(action, userName, transferTargetUbtName, pinAudience)

  return (
    <PinUnlockModal
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      verifyPin={verifyPin}
      title={config.title}
      titleId={config.titleId}
      description={config.description}
      submitLabel={config.submitLabel}
      pinCompleteHint={config.pinCompleteHint}
      icon={config.icon}
    />
  )
}
