import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { PatientRegistration } from '../../types/attendance'
import {
  addressMatchesEntityTerritory,
  buildTerritoryMismatchMessage,
  PATIENT_TERRITORY_MISMATCH_SUBJECT,
} from '../../utils/municipalityTerritory'
import { maskCep } from '../../utils/masks'
import { fetchAddressByCep } from '../../utils/viacep'
import { CustomSelect } from '../ui/CustomSelect'
import { AttendanceFieldHighlight } from './AttendanceFieldHighlight'
import { AttendanceStepFooter } from './AttendanceStepFooter'
import { AttendanceStepShell } from './AttendanceStepShell'
import {
  getAddressMissingFields,
  isAddressStepReady,
  type AddressFieldKey,
} from './registrationStepValidation'

export type PatientAddressTerritoryRequirement = {
  municipality: string
  uf: string
}

type PatientAddressExtraAction = {
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

type PatientAddressStepProps = {
  data: PatientRegistration
  onChange: (data: PatientRegistration) => void
  onSubmit: () => void
  onBack: () => void
  embedded?: boolean
  /** Quando informado, só aceita CEP/endereço do município contratante. */
  requiredTerritory?: PatientAddressTerritoryRequirement
  /** Exibe aviso quando o contrato permite pacientes de outras cidades. */
  contractAllowsOtherMunicipalities?: boolean
  /** Texto de orientação quando há restrição territorial. */
  territoryScope?: 'patient_registration' | 'pre_registration'
  policyLoadWarning?: string | null
  isPolicyLoading?: boolean
  continueLabel?: string
  extraActions?: PatientAddressExtraAction[]
}

const inputClass =
  'w-full rounded-xl border border-gray-200/80 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

function resolveTerritoryError(
  data: PatientRegistration,
  requiredTerritory?: PatientAddressTerritoryRequirement,
): string | null {
  if (!requiredTerritory) return null
  if (!data.city.trim() || !data.state.trim()) return null

  if (
    !addressMatchesEntityTerritory(
      data.city,
      data.state,
      requiredTerritory.municipality,
      requiredTerritory.uf,
    )
  ) {
    return buildTerritoryMismatchMessage(
      requiredTerritory.municipality,
      requiredTerritory.uf,
      data.city,
      data.state,
      { subject: PATIENT_TERRITORY_MISMATCH_SUBJECT },
    )
  }

  return null
}

export function PatientAddressStep({
  data,
  onChange,
  onSubmit,
  onBack,
  embedded = false,
  requiredTerritory,
  contractAllowsOtherMunicipalities = false,
  territoryScope = 'pre_registration',
  policyLoadWarning = null,
  isPolicyLoading = false,
  continueLabel = 'Continuar',
  extraActions = [],
}: PatientAddressStepProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [cepMessage, setCepMessage] = useState<string | null>(null)
  const [territoryError, setTerritoryError] = useState<string | null>(null)
  const [showHints, setShowHints] = useState(false)

  const missingFields = useMemo(() => getAddressMissingFields(data), [data])
  const territoryMismatch = useMemo(
    () => resolveTerritoryError(data, requiredTerritory),
    [data, requiredTerritory],
  )
  const continueReady = isAddressStepReady(data) && !territoryMismatch
  const highlight = (field: AddressFieldKey) => showHints && missingFields.includes(field)

  const description = requiredTerritory
    ? territoryScope === 'patient_registration'
      ? `Informe o CEP do endereço do paciente em ${requiredTerritory.municipality}/${requiredTerritory.uf}. O contrato vigente aceita apenas moradores deste município.`
      : `Informe o CEP do endereço do paciente em ${requiredTerritory.municipality}/${requiredTerritory.uf}. Apenas moradores deste município podem ser pré-cadastrados.`
    : contractAllowsOtherMunicipalities
      ? 'Informe onde o paciente reside. O contrato vigente permite cadastrar pacientes de outras cidades.'
      : 'Informe onde o paciente reside para concluir o cadastro.'

  function patch(field: keyof PatientRegistration, value: string) {
    const next = { ...data, [field]: value }
    onChange(next)
    if (requiredTerritory && (field === 'city' || field === 'state')) {
      setTerritoryError(resolveTerritoryError(next, requiredTerritory))
    }
  }

  async function handleCepBlur() {
    const digits = data.zipCode.replace(/\D/g, '')
    if (digits.length !== 8) return

    setIsLoadingCep(true)
    setCepMessage(null)
    setTerritoryError(null)

    try {
      const address = await fetchAddressByCep(data.zipCode)

      if (!address) {
        setCepMessage('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }

      if (
        requiredTerritory &&
        !addressMatchesEntityTerritory(
          address.city,
          address.state,
          requiredTerritory.municipality,
          requiredTerritory.uf,
        )
      ) {
        const message = buildTerritoryMismatchMessage(
          requiredTerritory.municipality,
          requiredTerritory.uf,
          address.city,
          address.state,
          { subject: PATIENT_TERRITORY_MISMATCH_SUBJECT },
        )
        setTerritoryError(message)
        onChange({
          ...data,
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: address.city,
          state: address.state,
        })
        return
      }

      onChange({
        ...data,
        street: address.street || data.street,
        neighborhood: address.neighborhood || data.neighborhood,
        city: address.city || data.city,
        state: address.state || data.state,
        complement: address.complement || data.complement,
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

    const mismatch = resolveTerritoryError(data, requiredTerritory)
    if (mismatch) {
      setTerritoryError(mismatch)
      setShowHints(true)
      return
    }

    if (!continueReady) {
      setShowHints(true)
      return
    }
    onSubmit()
  }

  const displayTerritoryError = territoryError ?? territoryMismatch

  return (
    <AttendanceStepShell
      embedded={embedded}
      title="Endereço do paciente"
      description={description}
      footer={
        <div className="space-y-3 sm:ml-auto sm:w-full sm:max-w-[22rem]">
          <AttendanceStepFooter
            onBack={onBack}
            continueType="submit"
            formId="patient-address-form"
            continueLabel={isPolicyLoading ? 'Verificando contrato…' : continueLabel}
            continueReady={continueReady}
            continueLoading={isPolicyLoading}
            onContinueBlocked={() => setShowHints(true)}
          />
          {extraActions.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {extraActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading || isPolicyLoading}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {action.loading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {action.label}
                    </span>
                  ) : (
                    action.label
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      }
    >
      <form
        id="patient-address-form"
        noValidate
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar"
      >
        {displayTerritoryError ? (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {displayTerritoryError}
          </div>
        ) : null}

        {!requiredTerritory && contractAllowsOtherMunicipalities ? (
          <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            O contrato vigente permite cadastrar pacientes residentes em outras cidades.
          </div>
        ) : null}

        {policyLoadWarning ? (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {policyLoadWarning}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AttendanceFieldHighlight highlight={highlight('zipCode')} className="block sm:col-span-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-700">CEP</span>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={data.zipCode}
                onChange={(e) => {
                  setTerritoryError(null)
                  patch('zipCode', maskCep(e.target.value))
                }}
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

          <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(5.5rem,6rem)]">
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
                readOnly={Boolean(requiredTerritory)}
                className={`${inputClass}${requiredTerritory ? ' cursor-not-allowed bg-gray-50 text-gray-600' : ''}`}
              />
            </label>
            </AttendanceFieldHighlight>

            <AttendanceFieldHighlight highlight={highlight('state')} className="block min-w-0">
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">UF</span>
              {requiredTerritory ? (
                <input
                  type="text"
                  value={data.state}
                  readOnly
                  className={`${inputClass} cursor-not-allowed bg-gray-50 text-center text-gray-600`}
                />
              ) : (
                <CustomSelect
                  value={data.state}
                  onChange={(value) => patch('state', value)}
                  options={[
                    { value: '', label: '—' },
                    ...brazilianStates.map((uf) => ({ value: uf, label: uf })),
                  ]}
                  placeholder="UF"
                  size="compact"
                  menuMinWidthPx={72}
                  className="px-3 text-center text-sm"
                />
              )}
            </label>
            </AttendanceFieldHighlight>
          </div>
        </div>
      </form>
    </AttendanceStepShell>
  )
}
