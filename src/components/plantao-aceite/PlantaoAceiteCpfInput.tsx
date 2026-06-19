import { cpfDigits, isValidCpf } from '../../utils/cpf'
import { maskCpf } from '../../utils/masks'

type PlantaoAceiteCpfInputProps = {
  value: string
  onChange: (value: string) => void
  waveActive: boolean
  disabled?: boolean
}

export function PlantaoAceiteCpfInput({
  value,
  onChange,
  waveActive,
  disabled = false,
}: PlantaoAceiteCpfInputProps) {
  const showPlaceholder = value.trim().length === 0
  const cpfInvalid = cpfDigits(value).length === 11 && !isValidCpf(value)

  return (
    <div>
      <div className="relative">
        {showPlaceholder ? (
          <span
            className={[
              'pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-medium',
              waveActive ? 'plantao-cpf-placeholder-wave' : 'text-gray-400',
            ].join(' ')}
            aria-hidden
          >
            Digite seu CPF
          </span>
        ) : null}

        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label="Digite seu CPF"
          placeholder=""
          value={value}
          onChange={(event) => onChange(maskCpf(event.target.value))}
          disabled={disabled}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-center text-lg font-medium tabular-nums tracking-wide text-gray-900 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
        />
      </div>

      {cpfInvalid ? (
        <p className="mt-2 text-center text-xs text-red-600">CPF inválido</p>
      ) : null}
    </div>
  )
}
