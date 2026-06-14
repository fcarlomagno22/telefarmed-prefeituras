export type SituationStatusBadgeStyle = {
  label: string
  text: string
  accent: string
  lineGlow: string
}

type SituationStatusBadgeProps = {
  config: SituationStatusBadgeStyle
  /** Largura fixa como na coluna Situação da agenda (padrão: 9rem). */
  widthClass?: string
}

export function SituationStatusBadge({
  config,
  widthClass = 'w-[9rem]',
}: SituationStatusBadgeProps) {
  const safeConfig = config ?? {
    label: '—',
    text: 'text-gray-600',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  }

  return (
    <span
      className={[
        'relative inline-flex h-8 items-center justify-center overflow-hidden rounded-lg bg-transparent px-2 pb-2 text-xs font-semibold',
        widthClass,
        safeConfig.text,
      ].join(' ')}
    >
      {safeConfig.label}
      <span
        className={`absolute inset-x-0 bottom-0 h-[3px] ${safeConfig.accent} ${safeConfig.lineGlow}`}
        aria-hidden
      />
    </span>
  )
}
