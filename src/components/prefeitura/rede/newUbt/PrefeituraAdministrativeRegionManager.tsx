import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  createPrefeituraAdministrativeRegion,
  deletePrefeituraAdministrativeRegion,
  getPrefeituraAdministrativeRegions,
  updatePrefeituraAdministrativeRegion,
  type PrefeituraAdministrativeRegion,
} from '../../../../data/prefeituraAdministrativeRegions'

type PrefeituraAdministrativeRegionManagerProps = {
  selectedRegionId: string
  onSelectRegion: (regionId: string) => void
  onRegionsChange: () => void
}

export function PrefeituraAdministrativeRegionManager({
  selectedRegionId,
  onSelectRegion,
  onRegionsChange,
}: PrefeituraAdministrativeRegionManagerProps) {
  const [regions, setRegions] = useState(() => getPrefeituraAdministrativeRegions())
  const [newRaName, setNewRaName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  function refresh() {
    const next = getPrefeituraAdministrativeRegions()
    setRegions(next)
    onRegionsChange()
    if (!next.some((region) => region.id === selectedRegionId) && next[0]) {
      onSelectRegion(next[0].id)
    }
  }

  function handleCreate() {
    const created = createPrefeituraAdministrativeRegion(newRaName)
    if (!created) return
    setNewRaName('')
    refresh()
    onSelectRegion(created.id)
  }

  function handleSaveEdit(region: PrefeituraAdministrativeRegion) {
    if (!updatePrefeituraAdministrativeRegion(region.id, editingName)) return
    setEditingId(null)
    setEditingName('')
    refresh()
  }

  function handleDelete(regionId: string) {
    if (!deletePrefeituraAdministrativeRegion(regionId)) return
    refresh()
  }

  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-gray-200 bg-slate-50/50">
      <header className="shrink-0 border-b border-gray-200 px-3 py-2">
        <p className="text-xs font-bold text-gray-900">Regiões administrativas (RA)</p>
        <p className="text-[11px] text-gray-500">Crie, edite ou remova RAs da rede.</p>
      </header>

      <div className="flex shrink-0 gap-2 border-b border-gray-200 p-2">
        <input
          type="text"
          value={newRaName}
          onChange={(event) => setNewRaName(event.target.value)}
          placeholder="Nome da nova RA"
          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]/40 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={!newRaName.trim()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Nova RA
        </button>
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto overscroll-y-contain">
        {regions.map((region) => {
          const selected = region.id === selectedRegionId
          const editing = editingId === region.id

          return (
            <li
              key={region.id}
              className={[
                'flex flex-col gap-1.5 px-2.5 py-2 sm:flex-row sm:items-center',
                selected ? 'bg-[var(--brand-primary-light)]/25' : 'bg-white',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => onSelectRegion(region.id)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${region.gradientFrom}, ${region.gradientTo})`,
                    }}
                  />
                  <span className="text-sm font-semibold text-gray-900">{region.label}</span>
                  {selected ? (
                    <span className="rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                      Selecionada
                    </span>
                  ) : null}
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-1">
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      className="w-32 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-[var(--brand-primary)]/40"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(region)}
                      className="rounded-lg bg-[var(--brand-primary)] px-2 py-1 text-xs font-semibold text-white"
                    >
                      Salvar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(region.id)
                        setEditingName(region.label)
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
                      aria-label={`Editar ${region.label}`}
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(region.id)}
                      disabled={regions.length <= 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                      aria-label={`Excluir ${region.label}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
