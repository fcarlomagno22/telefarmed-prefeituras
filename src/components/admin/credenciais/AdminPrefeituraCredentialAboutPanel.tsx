import { useMemo } from 'react'
import { accessLevelBadgeConfig } from '../../credenciais/accessCredentialBadges'
import { brand } from '../../../config/brand'
import type { AccessLevelId } from '../../../config/accessCredentials'
import type { PrefeituraCredentialUser } from '../../../config/prefeituraCredenciaisConfig'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatPercent(part: number, total: number) {
  if (total === 0) return '0%'
  return `${Math.round((part / total) * 100)}%`
}

type BarSlice = { label: string; count: number }

function buildCountSlices(
  rows: PrefeituraCredentialUser[],
  getKey: (row: PrefeituraCredentialUser) => string,
): BarSlice[] {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const key = getKey(row)
    map.set(key, (map.get(key) ?? 0) + 1)
  })
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

function HorizontalBars({
  data,
  gradientClass,
}: {
  data: BarSlice[]
  gradientClass: string
}) {
  if (data.length === 0) {
    return <p className="text-xs text-gray-500">Sem dados.</p>
  }
  const max = Math.max(...data.map((item) => item.count), 1)
  return (
    <ul className="space-y-2.5">
      {data.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex justify-between gap-2 text-xs">
            <span className="truncate font-medium text-gray-600">{item.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-gray-900">
              {formatNumber(item.count)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${gradientClass}`}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

type AdminPrefeituraCredentialAboutPanelProps = {
  rows: PrefeituraCredentialUser[]
}

export function AdminPrefeituraCredentialAboutPanel({ rows }: AdminPrefeituraCredentialAboutPanelProps) {
  const total = rows.length
  const activeCount = rows.filter((row) => row.status === 'ativo').length
  const blockedCount = total - activeCount

  const municipalities = useMemo(
    () =>
      buildCountSlices(
        rows,
        (row) => `${row.contractingEntity.municipality}/${row.contractingEntity.uf}`,
      ),
    [rows],
  )

  const accessLevels = useMemo(() => {
    const order: AccessLevelId[] = ['administrador', 'operador', 'editor', 'visualizador']
    const map = new Map<string, number>()
    rows.forEach((row) => {
      const label = accessLevelBadgeConfig[row.accessLevel].label
      map.set(label, (map.get(label) ?? 0) + 1)
    })
    return order
      .map((id) => ({
        label: accessLevelBadgeConfig[id].label,
        count: map.get(accessLevelBadgeConfig[id].label) ?? 0,
      }))
      .filter((item) => item.count > 0)
  }, [rows])

  const illustrationUrl = brand.dashboardCredentialsImageUrl

  return (
    <aside className="flex h-full w-full shrink-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
        <header className="shrink-0 text-center">
          <h2 className="text-lg font-bold text-gray-900">Portal</h2>
          <p className="mt-1 text-xs text-gray-500">Gestores com acesso ao portal da entidade</p>
        </header>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
          <div className="rounded-lg border border-gray-200/80 bg-white px-2.5 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase text-gray-500">Total</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{formatNumber(total)}</p>
          </div>
          <div className="rounded-lg border border-gray-200/80 bg-white px-2.5 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase text-gray-500">Ativos</p>
            <p className="mt-1 text-lg font-bold text-emerald-600">{formatNumber(activeCount)}</p>
            <p className="text-[10px] text-gray-500">{formatPercent(activeCount, total)}</p>
          </div>
          <div className="col-span-2 rounded-lg border border-gray-200/80 bg-white px-2.5 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase text-gray-500">Bloqueados</p>
            <p className="mt-1 text-lg font-bold text-red-600">{formatNumber(blockedCount)}</p>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Por localidade</h3>
            <div className="mt-3">
              <HorizontalBars
                data={municipalities}
                gradientClass="bg-gradient-to-r from-orange-500 to-amber-500"
              />
            </div>
          </section>
          <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Nível de acesso
            </h3>
            <div className="mt-3">
              <HorizontalBars
                data={accessLevels}
                gradientClass="bg-gradient-to-r from-amber-500 to-orange-500"
              />
            </div>
          </section>
        </div>

        {illustrationUrl ? (
          <div className="mt-2 flex shrink-0 items-end pb-1 pt-1">
            <img
              src={illustrationUrl}
              alt=""
              className="h-28 w-full object-contain object-bottom"
            />
          </div>
        ) : null}
      </div>
    </aside>
  )
}
