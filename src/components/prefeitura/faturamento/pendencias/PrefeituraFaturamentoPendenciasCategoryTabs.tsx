import type { PrefeituraFaturamentoPendenciasCategoryTab } from '../../../../types/prefeituraFaturamentoPendencias'
import { prefeituraFaturamentoPendenciasCategoryTabLabel } from './prefeituraFaturamentoPendenciasUi'

const tabs: PrefeituraFaturamentoPendenciasCategoryTab[] = [
  'todas',
  'bloqueantes',
  'paciente',
  'profissional',
  'consulta',
  'procedimento',
  'resolvidas',
]

type PrefeituraFaturamentoPendenciasCategoryTabsProps = {
  activeTab: PrefeituraFaturamentoPendenciasCategoryTab
  onTabChange: (tab: PrefeituraFaturamentoPendenciasCategoryTab) => void
}

export function PrefeituraFaturamentoPendenciasCategoryTabs({
  activeTab,
  onTabChange,
}: PrefeituraFaturamentoPendenciasCategoryTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Categorias de pendências"
      className="flex shrink-0 gap-0 overflow-x-auto border-b border-gray-200 bg-gray-50/70 px-2 sm:px-3"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab)}
            className={[
              'relative shrink-0 px-3 py-2.5 text-sm font-semibold transition sm:px-4',
              isActive ? 'text-[var(--brand-primary)]' : 'text-gray-500 hover:text-gray-800',
            ].join(' ')}
          >
            {prefeituraFaturamentoPendenciasCategoryTabLabel[tab]}
            <span
              className={[
                'pointer-events-none absolute inset-x-2 bottom-0 h-[3px] rounded-full transition-all duration-200 sm:inset-x-3',
                isActive
                  ? 'bg-[var(--brand-primary-gradient)] opacity-100 shadow-[var(--brand-primary-shadow-sm)]'
                  : 'scale-x-0 opacity-0',
              ].join(' ')}
              aria-hidden
            />
          </button>
        )
      })}
    </nav>
  )
}
