import { KpiStatCards, type KpiStatCardItem } from '../../ui/KpiStatCards'

type AdminEscalaKpiRowProps = {
  items: KpiStatCardItem[]
}

export function AdminEscalaKpiRow({ items }: AdminEscalaKpiRowProps) {
  return (
    <KpiStatCards items={items} layout="grid-2x2" variant="centered" className="shrink-0" />
  )
}
