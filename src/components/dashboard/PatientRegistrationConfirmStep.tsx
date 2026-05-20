import { Camera, Loader2, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { PatientRegistration } from '../../data/unitDashboardMock'
import { CustomSelect } from '../ui/CustomSelect'
import { maskCep, maskPhone } from '../../utils/masks'
import { AttendanceStepFooter } from './AttendanceStepFooter'
import { AttendanceStepShell } from './AttendanceStepShell'

type PatientRegistrationConfirmStepProps = {
  data: PatientRegistration
  onChange: (data: PatientRegistration) => void
  onSubmit: () => void
  onBack: () => void
  onOpenPhotoCapture: () => void
}

const inputClass =
  'w-full rounded-xl border border-gray-200/80 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

type ViaCepResponse = {
  erro?: boolean
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
}

export function PatientRegistrationConfirmStep({
  data,
  onChange,
  onSubmit,
  onBack,
  onOpenPhotoCapture,
}: PatientRegistrationConfirmStepProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [cepMessage, setCepMessage] = useState<string | null>(null)

  function patch(field: keyof PatientRegistration, value: string) {
    onChange({ ...data, [field]: value })
  }

  async function handleCepBlur() {
    const digits = data.zipCode.replace(/\D/g, '')
    if (digits.length !== 8) return

    setIsLoadingCep(true)
    setCepMessage(null)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const result = (await response.json()) as ViaCepResponse

      if (result.erro) {
        setCepMessage('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }

      onChange({
        ...data,
        street: result.logradouro ?? data.street,
        neighborhood: result.bairro ?? data.neighborhood,
        city: result.localidade ?? data.city,
        state: result.uf ?? data.state,
      })
      setCepMessage('Endereço atualizado automaticamente.')
    } catch {
      setCepMessage('Não foi possível buscar o CEP. Preencha manualmente.')
    } finally {
      setIsLoadingCep(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <AttendanceStepShell
      title="Confirme seu cadastro"
      description="Você já possui cadastro. Revise telefone, e-mail, endereço e foto se desejar — todos os campos abaixo são opcionais."
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          continueLabel="Confirmar"
          continueType="submit"
          formId="patient-confirm-registration-form"
          continueReady
        />
      }
    >
      <form
        id="patient-confirm-registration-form"
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto no-scrollbar"
      >
        <section className="shrink-0 rounded-2xl border border-gray-100 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          <div className="overflow-visible rounded-t-2xl bg-gradient-to-r from-[var(--brand-primary-light)] via-orange-50/90 to-gray-50 px-5 py-3.5 sm:px-6 sm:py-4">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
              <div className="relative shrink-0">
                {data.photoDataUrl ? (
                  <div
                    className="size-24 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.1)] ring-1 ring-gray-100 sm:size-28"
                    style={{ borderRadius: '50%' }}
                  >
                    <img
                      src={data.photoDataUrl}
                      alt={`Foto de ${data.fullName}`}
                      className="size-full object-cover object-center"
                    />
                  </div>
                ) : (
                  <div
                    className="flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.1)] ring-1 ring-gray-100 sm:size-28"
                    style={{ borderRadius: '50%' }}
                  >
                    <UserRound className="h-10 w-10 text-gray-300 sm:h-12 sm:w-12" strokeWidth={1.5} aria-hidden />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-primary)]">
                  Paciente cadastrado
                </p>
                <h2 className="mt-0.5 text-lg font-bold leading-tight text-gray-900 sm:text-xl">
                  {data.fullName}
                </h2>
                <p className="mt-0.5 font-mono text-sm tracking-wide text-gray-500">{data.cpf}</p>
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
            <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onOpenPhotoCapture}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
              >
                <Camera className="h-4 w-4 shrink-0" strokeWidth={2} />
                {data.photoDataUrl ? 'Atualizar foto' : 'Tirar foto'}
              </button>
              <button
                type="button"
                onClick={onOpenPhotoCapture}
                disabled={!data.photoDataUrl}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-transparent px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-800 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:text-gray-400"
              >
                Capturar novamente
              </button>
            </div>
          </div>
        </section>

        <section className="shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Contato
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                Celular
              </span>
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => patch('phone', maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                E-mail
              </span>
              <input
                type="email"
                value={data.email}
                onChange={(e) => patch('email', e.target.value)}
                placeholder="seu@email.com"
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section className="shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Endereço
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                CEP
              </span>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={data.zipCode}
                  onChange={(e) => patch('zipCode', maskCep(e.target.value))}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  maxLength={9}
                  className={inputClass}
                />
                {isLoadingCep ? (
                  <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                ) : null}
              </div>
              {cepMessage ? <p className="mt-1.5 text-xs text-gray-500">{cepMessage}</p> : null}
            </label>

            <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,4.75rem)_minmax(0,0.9fr)]">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">
                  Rua / logradouro
                </span>
                <input
                  type="text"
                  value={data.street}
                  onChange={(e) => patch('street', e.target.value)}
                  placeholder="Nome da rua"
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">
                  Número
                </span>
                <input
                  type="text"
                  value={data.number}
                  onChange={(e) => patch('number', e.target.value)}
                  placeholder="Nº"
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">
                  Complemento
                </span>
                <input
                  type="text"
                  value={data.complement}
                  onChange={(e) => patch('complement', e.target.value)}
                  placeholder="Apto"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1.15fr)_4.25rem]">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">
                  Bairro
                </span>
                <input
                  type="text"
                  value={data.neighborhood}
                  onChange={(e) => patch('neighborhood', e.target.value)}
                  placeholder="Bairro"
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">
                  Cidade
                </span>
                <input
                  type="text"
                  value={data.city}
                  onChange={(e) => patch('city', e.target.value)}
                  placeholder="Cidade"
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">
                  UF
                </span>
                <CustomSelect
                  value={data.state}
                  onChange={(value) => patch('state', value)}
                  options={[
                    { value: '', label: '—' },
                    ...brazilianStates.map((uf) => ({ value: uf, label: uf })),
                  ]}
                  placeholder="UF"
                  className="py-2.5 px-2 text-center text-sm"
                />
              </label>
            </div>
          </div>
        </section>

      </form>
    </AttendanceStepShell>
  )
}
