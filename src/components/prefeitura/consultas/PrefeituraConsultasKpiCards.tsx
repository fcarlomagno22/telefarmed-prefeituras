import { ArrowDown, ArrowUp } from 'lucide-react'
import type { PrefeituraConsultasKpi } from '../../../data/prefeituraConsultasMock'

type PrefeituraConsultasKpiCardsProps = {
  items: PrefeituraConsultasKpi[]
  className?: string
}

function FooterIcon({ icon }: { icon: PrefeituraConsultasKpi['footerIcon'] }) {
  if (icon === 'up') {
    return <ArrowUp className="h-3 w-3 shrink-0 text-emerald-600" strokeWidth={2.5} />
  }
  if (icon === 'down') {
    return <ArrowDown className="h-3 w-3 shrink-0 text-emerald-600" strokeWidth={2.5} />
  }
  if (icon === 'dot') {
    return (
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-primary)]"
        aria-hidden
      />
    )
  }
  return null
}

function footerClass(tone: PrefeituraConsultasKpi['footerTone']) {
  if (tone === 'positive') return 'text-emerald-600'
  if (tone === 'muted') return 'text-gray-500'
  return 'text-gray-500'
}

export function PrefeituraConsultasKpiCards({
  items,
  className = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5',
}: PrefeituraConsultasKpiCardsProps) {
  return (
    <div className={className}>
      {items.map((card) => (
        <article
          key={card.label}
          className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
        >
          <span
            className={`absolute inset-x-4 top-0 h-0.5 rounded-full bg-gradient-to-r ${card.topBar}`}
            aria-hidden
          />
          <p className="text-center text-xs font-semibold text-gray-500">{card.label}</p>
          <p className="mt-1 text-center text-xl font-bold tracking-tight text-gray-900">
            {card.value}
          </p>
          <p
            className={[
              'mt-1 flex items-center justify-center gap-1 text-center text-xs font-medium',
              footerClass(card.footerTone),
            ].join(' ')}
          >
            <FooterIcon icon={card.footerIcon} />
            <span>{card.footer}</span>
          </p>
        </article>
      ))}
    </div>
  )
}
