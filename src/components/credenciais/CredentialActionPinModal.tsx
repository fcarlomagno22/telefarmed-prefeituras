import {
  ArrowRightLeft,
  FileText,
  Pencil,
  PlayCircle,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Wrench,
  Building2,
} from 'lucide-react'
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
  | 'save_prefeitura_create'
  | 'save_prefeitura_edit'
  | 'save_entidade_create'
  | 'save_entidade_edit'
  | 'save_entidade_contacts'
  | 'save_entidade_status'
  | 'save_contrato_create'
  | 'save_contrato_edit'
  | 'contrato_suspender'
  | 'contrato_reativar'
  | 'contrato_encerrar'
  | 'delete_entidade'
  | 'delete_contrato'
  | 'ubt_suspend'
  | 'ubt_delete'
  | 'ubt_edit'
  | 'ubt_maintenance'
  | 'ubt_reactivate'

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

  if (action === 'save_prefeitura_create') {
    return {
      title: 'Confirmar novo gestor municipal',
      titleId: 'credential-save-prefeitura-create-pin-title',
      description: `Para cadastrar ${userName} no portal municipal, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar cadastro',
      pinCompleteHint: 'Senha completa. Toque em confirmar cadastro.',
      icon: UserPlus,
    }
  }

  if (action === 'save_prefeitura_edit') {
    return {
      title: 'Confirmar alterações',
      titleId: 'credential-save-prefeitura-edit-pin-title',
      description: `Para salvar as alterações de ${userName}, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar e salvar',
      pinCompleteHint: 'Senha completa. Toque em confirmar e salvar.',
      icon: Pencil,
    }
  }

  if (action === 'save_entidade_create') {
    return {
      title: 'Confirmar nova entidade',
      titleId: 'cliente-save-entidade-create-pin-title',
      description: `Para cadastrar ${userName}, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar cadastro',
      pinCompleteHint: 'Senha completa. Toque em confirmar cadastro.',
      icon: Building2,
    }
  }

  if (action === 'save_entidade_edit') {
    return {
      title: 'Confirmar alterações cadastrais',
      titleId: 'cliente-save-entidade-edit-pin-title',
      description: `Para salvar os dados cadastrais de ${userName}, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar e salvar',
      pinCompleteHint: 'Senha completa. Toque em confirmar e salvar.',
      icon: Pencil,
    }
  }

  if (action === 'save_entidade_contacts') {
    return {
      title: 'Confirmar alterações de contatos',
      titleId: 'cliente-save-entidade-contacts-pin-title',
      description: `Para salvar os contatos de ${userName}, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar e salvar',
      pinCompleteHint: 'Senha completa. Toque em confirmar e salvar.',
      icon: Pencil,
    }
  }

  if (action === 'save_entidade_status') {
    return {
      title: 'Confirmar alteração de status',
      titleId: 'cliente-save-entidade-status-pin-title',
      description: `Para alterar o status de ${userName}, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar e salvar',
      pinCompleteHint: 'Senha completa. Toque em confirmar e salvar.',
      icon: Pencil,
    }
  }

  if (action === 'save_contrato_create') {
    return {
      title: 'Confirmar novo contrato',
      titleId: 'cliente-save-contrato-create-pin-title',
      description: `Para cadastrar o contrato de ${userName}, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar contrato',
      pinCompleteHint: 'Senha completa. Toque em confirmar contrato.',
      icon: FileText,
    }
  }

  if (action === 'save_contrato_edit') {
    return {
      title: 'Confirmar alterações do contrato',
      titleId: 'cliente-save-contrato-edit-pin-title',
      description: `Para salvar as alterações do contrato de ${userName}, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar e salvar',
      pinCompleteHint: 'Senha completa. Toque em confirmar e salvar.',
      icon: Pencil,
    }
  }

  if (action === 'contrato_suspender') {
    return {
      title: 'Suspender contrato',
      titleId: 'cliente-contrato-suspender-pin-title',
      description: `Para suspender o contrato de ${userName}, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar suspensão',
      pinCompleteHint: 'Senha completa. Toque em confirmar suspensão.',
      icon: UserX,
    }
  }

  if (action === 'contrato_reativar') {
    return {
      title: 'Reativar contrato',
      titleId: 'cliente-contrato-reativar-pin-title',
      description: `Para reativar o contrato de ${userName}, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar reativação',
      pinCompleteHint: 'Senha completa. Toque em confirmar reativação.',
      icon: PlayCircle,
    }
  }

  if (action === 'contrato_encerrar') {
    return {
      title: 'Encerrar contrato',
      titleId: 'cliente-contrato-encerrar-pin-title',
      description: `Para encerrar o contrato de ${userName}, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar encerramento',
      pinCompleteHint: 'Senha completa. Toque em confirmar encerramento.',
      icon: Trash2,
    }
  }

  if (action === 'delete_entidade') {
    return {
      title: 'Confirmar exclusão da entidade',
      titleId: 'cliente-delete-entidade-pin-title',
      description: `Para excluir permanentemente ${userName}, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar exclusão',
      pinCompleteHint: 'Senha completa. Toque em confirmar exclusão.',
      icon: Trash2,
    }
  }

  if (action === 'delete_contrato') {
    return {
      title: 'Confirmar exclusão do contrato',
      titleId: 'cliente-delete-contrato-pin-title',
      description: `Para excluir o contrato de ${userName}, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar exclusão',
      pinCompleteHint: 'Senha completa. Toque em confirmar exclusão.',
      icon: Trash2,
    }
  }

  if (action === 'ubt_edit') {
    return {
      title: 'Confirmar alterações da UBT',
      titleId: 'rede-ubt-edit-pin-title',
      description: `Para salvar as alterações de ${userName}, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar e salvar',
      pinCompleteHint: 'Senha completa. Toque em confirmar e salvar.',
      icon: Pencil,
    }
  }

  if (action === 'ubt_maintenance') {
    return {
      title: 'Colocar UBT em manutenção',
      titleId: 'rede-ubt-maintenance-pin-title',
      description: `Para colocar ${userName} em manutenção, informe sua senha de autorização de 6 dígitos. Os terminais ficarão indisponíveis até a reativação.`,
      submitLabel: 'Confirmar manutenção',
      pinCompleteHint: 'Senha completa. Toque em confirmar manutenção.',
      icon: Wrench,
    }
  }

  if (action === 'ubt_reactivate') {
    return {
      title: 'Reativar UBT',
      titleId: 'rede-ubt-reactivate-pin-title',
      description: `Para reativar ${userName} e encerrar a manutenção ou suspensão, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar reativação',
      pinCompleteHint: 'Senha completa. Toque em confirmar reativação.',
      icon: PlayCircle,
    }
  }

  if (action === 'ubt_suspend') {
    return {
      title: 'Suspender UBT',
      titleId: 'rede-ubt-suspend-pin-title',
      description: `Para suspender ${userName}, informe sua senha de autorização de 6 dígitos. A unidade ficará inativa e não receberá novos atendimentos.`,
      submitLabel: 'Confirmar suspensão',
      pinCompleteHint: 'Senha completa. Toque em confirmar suspensão.',
      icon: UserX,
    }
  }

  if (action === 'ubt_delete') {
    return {
      title: 'Excluir UBT',
      titleId: 'rede-ubt-delete-pin-title',
      description: `Para excluir ${userName} da rede municipal, informe sua senha de autorização de 6 dígitos. A unidade deixa de aparecer na listagem.`,
      submitLabel: 'Confirmar exclusão',
      pinCompleteHint: 'Senha completa. Toque em confirmar exclusão.',
      icon: Trash2,
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
