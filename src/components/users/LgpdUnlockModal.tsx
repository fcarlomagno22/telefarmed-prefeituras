import { ShieldCheck } from 'lucide-react'
import { PinUnlockModal } from './PinUnlockModal'

type LgpdUnlockModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  verifyPin?: (pin: string) => Promise<boolean>
  description?: string
}

const defaultDescription =
  'Telefone, CPF e endereço ficam ocultos na lista. Informe a senha do responsável pela unidade para visualizar os dados completos.'

export function LgpdUnlockModal({
  open,
  onClose,
  onSuccess,
  verifyPin,
  description = defaultDescription,
}: LgpdUnlockModalProps) {
  return (
    <PinUnlockModal
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      verifyPin={verifyPin}
      title="Dados protegidos (LGPD)"
      titleId="lgpd-unlock-title"
      description={description}
      submitLabel="Liberar dados"
      pinCompleteHint="Senha completa. Toque em liberar dados."
      icon={ShieldCheck}
    />
  )
}
