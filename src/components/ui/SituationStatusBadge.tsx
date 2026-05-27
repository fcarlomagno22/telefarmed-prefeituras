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
  return (
    <span
      className={[
        'relative inline-flex h-8 items-center justify-center overflow-hidden rounded-lg bg-transparent px-2 pb-2 text-xs font-semibold',
        widthClass,
        config.text,
      ].join(' ')}
    >
      {config.label}
      <span
        className={`absolute inset-x-0 bottom-0 h-[3px] ${config.accent} ${config.lineGlow}`}
        aria-hidden
      />
    </span>
  )
}
