import { Loader2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { maskCep } from '../../../../utils/masks'
import { CustomSelect } from '../../../ui/CustomSelect'
import { AttendanceFieldHighlight } from '../../../dashboard/AttendanceFieldHighlight'
import { AttendanceStepFooter } from '../../../dashboard/AttendanceStepFooter'
import { AttendanceStepShell } from '../../../dashboard/AttendanceStepShell'
import {
  brazilianStates,
  isAddressStepReady,
  type AdminProfessionalCreateDraft,
} from './adminProfessionalCreateTypes'

type AdminProfessionalAddressStepProps = {
  draft: AdminProfessionalCreateDraft
  onChange: (draft: AdminProfessionalCreateDraft) => void
  onSubmit: () => void
  onBack: () => void
}

const inputClass =
  'w-full rounded-xl border border-gray-200/80 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

type AddressFieldKey = 'zipCode' | 'street' | 'number' | 'neighborhood' | 'city' | 'state'

type ViaCepResponse = {
  erro?: boolean
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
}

function getAddressMissingFields(draft: AdminProfessionalCreateDraft): AddressFieldKey[] {
  const missing: AddressFieldKey[] = []
  if (draft.zipCode.replace(/\D/g, '').length !== 8) missing.push('zipCode')
  if (!draft.street.trim()) missing.push('street')
  if (!draft.number.trim()) missing.push('number')
  if (!draft.neighborhood.trim()) missing.push('neighborhood')
  if (!draft.city.trim()) missing.push('city')
  if (draft.state.trim().length !== 2) missing.push('state')
  return missing
}

export function AdminProfessionalAddressStep({
  draft,
  onChange,
  onSubmit,
  onBack,
}: AdminProfessionalAddressStepProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [cepMessage, setCepMessage] = useState<string | null>(null)
  const [showHints, setShowHints] = useState(false)

  const missingFields = useMemo(() => getAddressMissingFields(draft), [draft])
  const continueReady = isAddressStepReady(draft)

  function patch<K extends keyof AdminProfessionalCreateDraft>(
    field: K,
    value: AdminProfessionalCreateDraft[K],
  ) {
    onChange({ ...draft, [field]: value })
  }

  function highlight(field: AddressFieldKey) {
    return showHints && missingFields.includes(field)
  }

  async function handleCepBlur() {
    const digits = draft.zipCode.replace(/\D/g, '')
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
        ...draft,
        street: result.logradouro ?? draft.street,
        neighborhood: result.bairro ?? draft.neighborhood,
        city: result.localidade ?? draft.city,
        state: result.uf ?? draft.state,
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
      title="Endereço do profissional"
      description="Informe o endereço completo. O CEP preenche rua, bairro, cidade e UF automaticamente."
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
          continueReady={continueReady}
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      <form
        id="admin-professional-address-form"
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
                  value={draft.zipCode}
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
          </AttendanceFieldHighlight>

          <AttendanceFieldHighlight highlight={highlight('street')} className="block sm:col-span-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">Rua / logradouro</span>
              <input
                type="text"
                value={draft.street}
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
                value={draft.number}
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
              value={draft.complement}
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
                  value={draft.neighborhood}
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
                  value={draft.city}
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
                  value={draft.state}
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
