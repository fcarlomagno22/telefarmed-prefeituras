import { PencilLine } from 'lucide-react'
import { PinUnlockModal } from './PinUnlockModal'

type EditUnlockModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditUnlockModal({ open, onClose, onSuccess }: EditUnlockModalProps) {
  return (
    <PinUnlockModal
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title="Edição protegida"
      titleId="edit-unlock-title"
      description="Para alterar telefone, e-mail, endereço e demais dados do paciente, informe a senha do responsável pela unidade. As alterações ficam registradas na unidade."
      submitLabel="Liberar edição"
      pinCompleteHint="Senha completa. Toque em liberar edição."
      icon={PencilLine}
    />
  )
}
