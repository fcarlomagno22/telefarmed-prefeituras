import { ShieldCheck } from 'lucide-react'
import { PinUnlockModal } from './PinUnlockModal'

type LgpdUnlockModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function LgpdUnlockModal({ open, onClose, onSuccess }: LgpdUnlockModalProps) {
  return (
    <PinUnlockModal
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title="Dados protegidos (LGPD)"
      titleId="lgpd-unlock-title"
      description="Telefone, CPF e endereço ficam ocultos na lista. Informe a senha do responsável pela unidade para visualizar os dados completos."
      submitLabel="Liberar dados"
      pinCompleteHint="Senha completa. Toque em liberar dados."
      icon={ShieldCheck}
    />
  )
}
