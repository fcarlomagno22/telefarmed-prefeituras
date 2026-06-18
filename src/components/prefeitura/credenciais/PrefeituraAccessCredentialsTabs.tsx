import { useEntidadeCopy } from '../../../hooks/useEntidadeCopy'

export type PrefeituraAccessCredentialsTab = 'portal' | 'ubt'

type PrefeituraAccessCredentialsTabsProps = {
  activeTab: PrefeituraAccessCredentialsTab
  onTabChange: (tab: PrefeituraAccessCredentialsTab) => void
}

export function PrefeituraAccessCredentialsTabs({
  activeTab,
  onTabChange,
}: PrefeituraAccessCredentialsTabsProps) {
  const copy = useEntidadeCopy()

  const tabs: { id: PrefeituraAccessCredentialsTab; label: string; hint: string }[] = [
    {
      id: 'portal',
      label: copy.portal.charAt(0).toUpperCase() + copy.portal.slice(1),
      hint: `Gestores · /prefeitura`,
    },
    {
      id: 'ubt',
      label: 'Operadores UBT',
      hint: 'Terminais · /ubt',
    },
  ]

  return (
    <nav
      role="tablist"
      aria-label="Tipos de credencial"
      className="flex shrink-0 gap-0 overflow-x-auto border-b border-gray-200 bg-white"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={[
              'relative shrink-0 px-4 py-3 text-left transition sm:px-5',
              isActive ? 'text-[var(--brand-primary)]' : 'text-gray-500 hover:text-gray-800',
            ].join(' ')}
          >
            <span className="block text-sm font-semibold">{tab.label}</span>
            <span className="mt-0.5 block text-[10px] font-medium text-gray-400">{tab.hint}</span>
            <span
              className={[
                'pointer-events-none absolute inset-x-3 bottom-0 h-[3px] rounded-full transition-all duration-200 sm:inset-x-4',
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
