import { KpiStatCards, type KpiStatCardItem } from '../../ui/KpiStatCards'

type ProfissionalEscalaKpiRowProps = {
  items: KpiStatCardItem[]
}

export function ProfissionalEscalaKpiRow({ items }: ProfissionalEscalaKpiRowProps) {
  return (
    <div data-tour="escala-kpis">
      <KpiStatCards
        items={items}
        layout="grid-2x2"
        variant="centered"
        className="shrink-0"
      />
    </div>
  )
}
