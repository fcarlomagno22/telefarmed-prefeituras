import { useEffect, useId, useState } from 'react'
import type { PatientRegistration } from '../../data/unitDashboardMock'

type PatientSocialNameFieldsProps = {
  data: PatientRegistration
  onChange: (data: PatientRegistration) => void
  inputClass: string
  className?: string
}

export function PatientSocialNameFields({
  data,
  onChange,
  inputClass,
  className = '',
}: PatientSocialNameFieldsProps) {
  const checkboxId = useId()
  const inputId = useId()
  const [wantsSocialName, setWantsSocialName] = useState(() => Boolean(data.socialName.trim()))

  useEffect(() => {
    setWantsSocialName(Boolean(data.socialName.trim()))
  }, [data.socialName])

  function setSocialName(value: string) {
    onChange({ ...data, socialName: value })
  }

  function handleToggle(checked: boolean) {
    setWantsSocialName(checked)
    if (!checked) setSocialName('')
  }

  return (
    <div className={['space-y-2', className].filter(Boolean).join(' ')}>
      <label
        htmlFor={checkboxId}
        className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200/80 bg-slate-50/60 px-3 py-2.5 transition hover:border-gray-300"
      >
        <input
          id={checkboxId}
          type="checkbox"
          checked={wantsSocialName}
          onChange={(event) => handleToggle(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/25"
        />
        <span className="min-w-0 text-sm leading-snug text-gray-700">
          <span className="font-semibold text-gray-900">Informar nome social</span>
          <span className="mt-0.5 block text-xs text-gray-500">
            Marque se o paciente deseja ser chamado(a) por um nome diferente do registro civil.
          </span>
        </span>
      </label>

      {wantsSocialName ? (
        <label htmlFor={inputId} className="block">
          <span className="mb-1.5 block text-xs font-medium text-gray-700">Nome social</span>
          <input
            id={inputId}
            type="text"
            value={data.socialName}
            onChange={(event) => setSocialName(event.target.value)}
            placeholder="Como a pessoa prefere ser chamada"
            className={inputClass}
            autoComplete="nickname"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            O nome civil permanece no cadastro para documentos e CPF.
          </p>
        </label>
      ) : null}
    </div>
  )
}
