import { KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { AttendanceStepFooter } from '../../../dashboard/AttendanceStepFooter'
import { AttendanceStepShell } from '../../../dashboard/AttendanceStepShell'
import { PinInput } from '../../../ui/PinInput'
import { isPasswordStepReady, type AdminProfessionalCreateDraft } from './adminProfessionalCreateTypes'

type AdminProfessionalPasswordStepProps = {
  draft: AdminProfessionalCreateDraft
  onChange: (draft: AdminProfessionalCreateDraft) => void
  onSubmit: () => void
  onBack: () => void
}

export function AdminProfessionalPasswordStep({
  draft,
  onChange,
  onSubmit,
  onBack,
}: AdminProfessionalPasswordStepProps) {
  const [showHints, setShowHints] = useState(false)
  const [pinVisible, setPinVisible] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)

  const continueReady = isPasswordStepReady(draft)
  const mismatch =
    draft.password.length === 6 &&
    draft.passwordConfirm.length === 6 &&
    draft.password !== draft.passwordConfirm

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!continueReady) {
      setShowHints(true)
      return
    }
    onSubmit()
  }

  return (
    <AttendanceStepShell
      title="Senha de acesso"
      description="Defina uma senha de 6 dígitos para o profissional acessar a plataforma."
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          onContinue={() => {
            if (!continueReady) {
              setShowHints(true)
              return
            }
            onSubmit()
          }}
          continueLabel="Concluir cadastro"
          continueReady={continueReady}
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      <form
        id="admin-professional-password-form"
        noValidate
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto no-scrollbar px-2 py-4"
      >
        <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
          <KeyRound className="h-7 w-7" strokeWidth={2} />
        </span>

        <div className="w-full max-w-sm space-y-8">
          <PinInput
            id="admin-professional-pin"
            label="Senha"
            value={draft.password}
            onChange={(value) => onChange({ ...draft, password: value })}
            visible={pinVisible}
            onToggleVisible={() => setPinVisible((current) => !current)}
            error={showHints && draft.password.length < 6}
            autoFocus
          />

          <PinInput
            id="admin-professional-pin-confirm"
            label="Confirmar senha"
            value={draft.passwordConfirm}
            onChange={(value) => onChange({ ...draft, passwordConfirm: value })}
            visible={confirmVisible}
            onToggleVisible={() => setConfirmVisible((current) => !current)}
            error={showHints && (draft.passwordConfirm.length < 6 || mismatch)}
          />
        </div>

        {mismatch ? (
          <p className="mt-4 text-sm font-medium text-red-600">As senhas não coincidem.</p>
        ) : showHints && !continueReady ? (
          <p className="mt-4 text-sm text-gray-500">
            Preencha e confirme a senha de 6 dígitos para concluir.
          </p>
        ) : null}
      </form>
    </AttendanceStepShell>
  )
}
