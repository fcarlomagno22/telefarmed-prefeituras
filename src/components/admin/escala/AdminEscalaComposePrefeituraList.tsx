import { Check } from 'lucide-react'
import { getAdminEscalaPrefeituras } from '../../../data/adminEscalaCatalog'
import type { AdminEscalaPrefeituraScope } from '../../../types/adminEscala'

type AdminEscalaComposePrefeituraListProps = {
  prefeituraScope: AdminEscalaPrefeituraScope
  activePrefeituraId: string | null
  onTogglePrefeitura: (id: string) => void
  onActivePrefeituraChange: (id: string) => void
}

export function AdminEscalaComposePrefeituraList({
  prefeituraScope,
  activePrefeituraId,
  onTogglePrefeitura,
  onActivePrefeituraChange,
}: AdminEscalaComposePrefeituraListProps) {
  const prefeituras = getAdminEscalaPrefeituras()

  return (
    <div className="flex flex-col gap-2">
      {prefeituras.map((p) => {
        const selected = prefeituraScope.prefeituraIds.includes(p.id)
        const active = activePrefeituraId === p.id

        return (
          <div
            key={p.id}
            className={[
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition',
              active
                ? 'bg-[var(--brand-primary-light)]/50 ring-2 ring-[var(--brand-primary)]'
                : 'bg-white ring-1 ring-gray-200/80 hover:bg-gray-50',
            ].join(' ')}
          >
            <button
              type="button"
              onClick={() => onTogglePrefeitura(p.id)}
              aria-label={selected ? `Remover ${p.name}` : `Selecionar ${p.name}`}
              className={[
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition',
                selected
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200/80',
              ].join(' ')}
            >
              {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
            </button>
            <button
              type="button"
              onClick={() => onActivePrefeituraChange(p.id)}
              className="min-w-0 flex-1 py-1 text-left"
            >
              <span className="block truncate text-sm font-semibold text-gray-900">{p.name}</span>
              <span className="block text-xs text-gray-500">{p.uf}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
