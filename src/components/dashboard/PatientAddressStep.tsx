import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { PatientRegistration } from '../../data/unitDashboardMock'
import { CustomSelect } from '../ui/CustomSelect'
import { maskCep } from '../../utils/masks'
import { AttendanceFieldHighlight } from './AttendanceFieldHighlight'
import { AttendanceStepFooter } from './AttendanceStepFooter'
import { AttendanceStepShell } from './AttendanceStepShell'
import {
  getAddressMissingFields,
  isAddressStepReady,
  type AddressFieldKey,
} from './registrationStepValidation'

type PatientAddressStepProps = {
  data: PatientRegistration
  onChange: (data: PatientRegistration) => void
  onSubmit: () => void
  onBack: () => void
  embedded?: boolean
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

export function PatientAddressStep({
  data,
  onChange,
  onSubmit,
  onBack,
  embedded = false,
}: PatientAddressStepProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [cepMessage, setCepMessage] = useState<string | null>(null)
  const [showHints, setShowHints] = useState(false)

  const missingFields = useMemo(() => getAddressMissingFields(data), [data])
  const continueReady = isAddressStepReady(data)
  const highlight = (field: AddressFieldKey) => showHints && missingFields.includes(field)

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
      setCepMessage('Endereço preenchido automaticamente.')
    } catch {
      setCepMessage('Não foi possível buscar o CEP. Preencha manualmente.')
    } finally {
      setIsLoadingCep(false)
    }
  }

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
      embedded={embedded}
      title="Endereço do paciente"
      description="Informe onde o paciente reside para concluir o cadastro."
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          continueType="submit"
          formId="patient-address-form"
          continueReady={continueReady}
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      <form
        id="patient-address-form"
        noValidate
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AttendanceFieldHighlight highlight={highlight('zipCode')} className="block sm:col-span-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-700">CEP</span>
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
            {cepMessage ? (
              <p className="mt-1.5 text-xs text-gray-500">{cepMessage}</p>
            ) : null}
          </label>
          </AttendanceFieldHighlight>

          <AttendanceFieldHighlight highlight={highlight('street')} className="block sm:col-span-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-700">Rua / logradouro</span>
            <input
              type="text"
              value={data.street}
              onChange={(e) => patch('street', e.target.value)}
              placeholder="Nome da rua"
              className={inputClass}
            />
          </label>
          </AttendanceFieldHighlight>

          <AttendanceFieldHighlight highlight={highlight('number')} className="block">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-700">Número</span>
            <input
              type="text"
              value={data.number}
              onChange={(e) => patch('number', e.target.value)}
              placeholder="Nº"
              className={inputClass}
            />
          </label>
          </AttendanceFieldHighlight>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-700">Complemento</span>
            <input
              type="text"
              value={data.complement}
              onChange={(e) => patch('complement', e.target.value)}
              placeholder="Apto, bloco (opcional)"
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1.15fr)_4.25rem]">
            <AttendanceFieldHighlight highlight={highlight('neighborhood')} className="block min-w-0">
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">Bairro</span>
              <input
                type="text"
                value={data.neighborhood}
                onChange={(e) => patch('neighborhood', e.target.value)}
                placeholder="Bairro"
                className={inputClass}
              />
            </label>
            </AttendanceFieldHighlight>

            <AttendanceFieldHighlight highlight={highlight('city')} className="block min-w-0">
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">Cidade</span>
              <input
                type="text"
                value={data.city}
                onChange={(e) => patch('city', e.target.value)}
                placeholder="Cidade"
                className={inputClass}
              />
            </label>
            </AttendanceFieldHighlight>

            <AttendanceFieldHighlight highlight={highlight('state')} className="block min-w-0">
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">UF</span>
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
            </AttendanceFieldHighlight>
          </div>
        </div>
      </form>
    </AttendanceStepShell>
  )
}
