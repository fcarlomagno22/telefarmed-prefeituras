import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

const inputClass =
  'w-full rounded-xl border bg-white py-2.5 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

const iconClass =
  'pointer-events-none absolute left-3 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-gray-400'

type MedicoCadastroFormFieldProps = {
  label: string
  icon?: LucideIcon
  error?: string
  children?: ReactNode
  className?: string
}

export function MedicoCadastroFormField({
  label,
  icon: Icon,
  error,
  children,
  className = '',
}: MedicoCadastroFormFieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <div className="relative">
        {Icon ? <Icon className={iconClass} aria-hidden /> : null}
        {children}
      </div>
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  )
}

export function medicoCadastroInputClass(
  hasError: boolean,
  options?: { withIcon?: boolean },
) {
  return [
    inputClass,
    options?.withIcon ? 'pl-10' : 'pl-3',
    hasError ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200',
  ].join(' ')
}

export function medicoCadastroSelectClass(hasError: boolean) {
  return [
    'rounded-xl',
    hasError ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : '',
  ].join(' ')
}
