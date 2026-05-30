import { useId, type ReactNode } from 'react'
import { Info } from 'lucide-react'

type ProfissionalPerfilInfoTooltipProps = {
  label: string
  content: ReactNode
  className?: string
  widthClass?: string
}

export function ProfissionalPerfilInfoTooltip({
  label,
  content,
  className,
  widthClass = 'w-[14.5rem]',
}: ProfissionalPerfilInfoTooltipProps) {
  const tooltipId = useId()
  const isAnchoredAbsolute = Boolean(className?.includes('absolute'))

  return (
    <div
      className={[
        'group shrink-0',
        isAnchoredAbsolute ? className : ['relative', className].filter(Boolean).join(' '),
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
        aria-label={label}
        aria-describedby={tooltipId}
      >
        <Info className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className={[
          'pointer-events-none absolute right-0 top-full z-50 mt-2',
          widthClass,
          'rounded-lg border border-gray-200 bg-gray-900 px-3 py-2.5 text-left text-[11px] leading-relaxed text-white shadow-lg',
          'opacity-0 transition-opacity duration-150',
          'group-hover:opacity-100 group-focus-within:opacity-100',
        ].join(' ')}
      >
        {content}
      </div>
    </div>
  )
}
