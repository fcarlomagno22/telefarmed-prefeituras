import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BR_UF_OPTIONS } from '../../../config/medicoCadastroLanding'
import type { MedicoCadastroFormErrors, MedicoCadastroFormValues } from '../../../types/medicoCadastro'
import { maskCep } from '../../../utils/masks'
import { fetchAddressByCep } from '../../../utils/viacep'
import { CustomSelect } from '../../ui/CustomSelect'
import {
  MedicoCadastroFormField,
  medicoCadastroInputClass,
  medicoCadastroSelectClass,
} from './MedicoCadastroFormField'

type MedicoCadastroAddressFieldsProps = {
  values: MedicoCadastroFormValues
  errors: MedicoCadastroFormErrors
  onChange: (patch: Partial<MedicoCadastroFormValues>) => void
  onClearErrors: (fields: (keyof MedicoCadastroFormValues)[]) => void
}

export function MedicoCadastroAddressFields({
  values,
  errors,
  onChange,
  onClearErrors,
}: MedicoCadastroAddressFieldsProps) {
  const [cepLoading, setCepLoading] = useState(false)
  const [cepMessage, setCepMessage] = useState<string | null>(null)
  const lastFetchedCepRef = useRef('')

  const cepDigits = values.zipCode.replace(/\D/g, '')

  const ufSelectOptions = BR_UF_OPTIONS.map((state) => ({
    value: state,
    label: state,
  }))

  function patch<K extends keyof MedicoCadastroFormValues>(
    field: K,
    value: MedicoCadastroFormValues[K],
  ) {
    onChange({ [field]: value })
    onClearErrors([field])
  }

  useEffect(() => {
    if (cepDigits.length !== 8) {
      if (cepDigits.length < 8) lastFetchedCepRef.current = ''
      return
    }
    if (lastFetchedCepRef.current === cepDigits) return

    let cancelled = false
    lastFetchedCepRef.current = cepDigits

    async function lookupCep() {
      setCepLoading(true)
      setCepMessage(null)

      const address = await fetchAddressByCep(values.zipCode)
      if (cancelled) return

      setCepLoading(false)

      if (!address) {
        setCepMessage('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }

      onChange({
        street: address.street || values.street,
        neighborhood: address.neighborhood || values.neighborhood,
        city: address.city || values.city,
        state: address.state || values.state,
        complement: address.complement || values.complement,
      })
      onClearErrors(['street', 'neighborhood', 'city', 'state'])
      setCepMessage('Endereço preenchido automaticamente.')
    }

    void lookupCep()

    return () => {
      cancelled = true
    }
  }, [cepDigits, values.zipCode])

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-gray-500">
        Informe o CEP para preencher rua, bairro, cidade e UF automaticamente.
      </p>

      <MedicoCadastroFormField label="CEP" error={errors.zipCode}>
        <div className="relative">
          <input
            className={medicoCadastroInputClass(Boolean(errors.zipCode))}
            type="text"
            name="zipCode"
            inputMode="numeric"
            placeholder="00000-000"
            maxLength={9}
            value={values.zipCode}
            onChange={(e) => {
              setCepMessage(null)
              patch('zipCode', maskCep(e.target.value))
            }}
          />
          {cepLoading ? (
            <Loader2
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400"
              aria-hidden
            />
          ) : null}
        </div>
        {cepMessage ? (
          <p className="mt-1 text-xs text-gray-500">{cepMessage}</p>
        ) : null}
      </MedicoCadastroFormField>

      <MedicoCadastroFormField label="Rua / logradouro" error={errors.street}>
        <input
          className={medicoCadastroInputClass(Boolean(errors.street))}
          type="text"
          name="street"
          placeholder="Nome da rua"
          value={values.street}
          onChange={(e) => patch('street', e.target.value)}
        />
      </MedicoCadastroFormField>

      <div className="grid gap-3 sm:grid-cols-2">
        <MedicoCadastroFormField label="Número" error={errors.number}>
          <input
            className={medicoCadastroInputClass(Boolean(errors.number))}
            type="text"
            name="number"
            placeholder="Nº"
            value={values.number}
            onChange={(e) => patch('number', e.target.value)}
          />
        </MedicoCadastroFormField>

        <MedicoCadastroFormField label="Complemento">
          <input
            className={medicoCadastroInputClass(false)}
            type="text"
            name="complement"
            placeholder="Apto, bloco (opcional)"
            value={values.complement}
            onChange={(e) => patch('complement', e.target.value)}
          />
        </MedicoCadastroFormField>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_88px]">
        <MedicoCadastroFormField label="Bairro" error={errors.neighborhood}>
          <input
            className={medicoCadastroInputClass(Boolean(errors.neighborhood))}
            type="text"
            name="neighborhood"
            placeholder="Bairro"
            value={values.neighborhood}
            onChange={(e) => patch('neighborhood', e.target.value)}
          />
        </MedicoCadastroFormField>

        <MedicoCadastroFormField label="Cidade" error={errors.city}>
          <input
            className={medicoCadastroInputClass(Boolean(errors.city))}
            type="text"
            name="city"
            placeholder="Cidade"
            value={values.city}
            onChange={(e) => patch('city', e.target.value)}
          />
        </MedicoCadastroFormField>

        <MedicoCadastroFormField label="UF" error={errors.state}>
          <CustomSelect
            value={values.state}
            onChange={(value) => patch('state', value)}
            options={ufSelectOptions}
            placeholder="UF"
            required
            size="compact"
            menuMinWidthPx={120}
            className={medicoCadastroSelectClass(Boolean(errors.state))}
          />
        </MedicoCadastroFormField>
      </div>
    </div>
  )
}
