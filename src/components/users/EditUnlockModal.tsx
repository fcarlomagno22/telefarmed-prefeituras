import { PencilLine } from 'lucide-react'
import { PinUnlockModal } from './PinUnlockModal'

type EditUnlockModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  verifyPin?: (pin: string) => Promise<boolean>
  description?: string
}

const defaultDescription =
  'Para alterar telefone, e-mail, endereço e demais dados do paciente, informe a senha do responsável pela unidade. As alterações ficam registradas na unidade.'

export function EditUnlockModal({
  open,
  onClose,
  onSuccess,
  verifyPin,
  description = defaultDescription,
}: EditUnlockModalProps) {
  return (
    <PinUnlockModal
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      verifyPin={verifyPin}
      title="Edição protegida"
      titleId="edit-unlock-title"
      description={description}
      submitLabel="Liberar edição"
      pinCompleteHint="Senha completa. Toque em liberar edição."
      icon={PencilLine}
    />
  )
}
