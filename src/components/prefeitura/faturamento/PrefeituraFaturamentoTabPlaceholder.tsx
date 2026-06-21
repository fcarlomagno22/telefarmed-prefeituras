import { Receipt } from 'lucide-react'

type PrefeituraFaturamentoTabPlaceholderProps = {
  title: string
  description: string
}

export function PrefeituraFaturamentoTabPlaceholder({
  title,
  description,
}: PrefeituraFaturamentoTabPlaceholderProps) {
  return (
    <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
        <Receipt className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <h2 className="mt-5 text-base font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">{description}</p>
    </div>
  )
}
