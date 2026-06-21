import {
  CONTRATO_ORIGEM_ATENDIMENTO_OPTIONS,
  type ContratoOrigemAtendimento,
} from '../../../config/adminContratoOrigemAtendimento'

type ContratoOrigemAtendimentoToggleProps = {
  value: ContratoOrigemAtendimento
  disabled?: boolean
  onChange: (value: ContratoOrigemAtendimento) => void
  className?: string
}

export function ContratoOrigemAtendimentoToggle({
  value,
  disabled = false,
  onChange,
  className = '',
}: ContratoOrigemAtendimentoToggleProps) {
  return (
    <div
      className={[
        'inline-flex rounded-lg border border-gray-200 bg-white p-0.5',
        disabled ? 'opacity-60' : '',
        className,
      ].join(' ')}
      role="group"
      aria-label="Origem do atendimento"
    >
      {CONTRATO_ORIGEM_ATENDIMENTO_OPTIONS.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            title={option.title}
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={[
              'min-w-[2.5rem] rounded-md px-2 py-1 text-[11px] font-bold tracking-wide transition',
              active
                ? option.value === 'mt'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-[var(--brand-primary)] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50',
              disabled ? 'cursor-not-allowed' : '',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
