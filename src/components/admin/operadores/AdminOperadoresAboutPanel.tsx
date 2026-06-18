import { useMemo } from 'react'
import { accessLevelBadgeConfig } from '../../credenciais/accessCredentialBadges'
import { brand } from '../../../config/brand'
import type { AccessLevelId } from '../../../config/accessCredentials'
import type { AdminOperatorRow } from '../../../data/adminOperadoresMock'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatPercent(part: number, total: number) {
  if (total === 0) return '0%'
  return `${Math.round((part / total) * 100)}%`
}

type AdminOperadoresAboutPanelProps = {
  rows: AdminOperatorRow[]
}

type BarSlice = { label: string; count: number }

function buildCountSlices(
  rows: AdminOperatorRow[],
  getKey: (row: AdminOperatorRow) => string,
  limit = 8,
): BarSlice[] {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const key = getKey(row)
    map.set(key, (map.get(key) ?? 0) + 1)
  })
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

function HorizontalBars({
  data,
  gradientClass,
}: {
  data: BarSlice[]
  gradientClass: string
}) {
  if (data.length === 0) {
    return <p className="text-xs text-gray-500">Sem dados para exibir.</p>
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

function MiniKpi({
  label,
  value,
  hint,
  valueClassName = 'text-gray-900',
}: {
  label: string
  value: string
  hint?: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-lg border border-gray-200/80 bg-white px-2.5 py-2 text-center">
      <p className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${valueClassName}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-gray-500">{hint}</p> : null}
    </div>
  )
}

export function AdminOperadoresAboutPanel({ rows }: AdminOperadoresAboutPanelProps) {
  const total = rows.length
  const activeCount = rows.filter((row) => row.status === 'ativo').length
  const blockedCount = total - activeCount
  const ubtScopeCount = rows.filter((row) => row.scope === 'UBT').length
  const prefeituraScopeCount = total - ubtScopeCount
  const accessedToday = rows.filter((row) =>
    row.lastAccessLabel.toLowerCase().includes('hoje'),
  ).length
  const accessedYesterday = rows.filter((row) =>
    row.lastAccessLabel.toLowerCase().includes('ontem'),
  ).length
  const noRecentAccess = rows.filter((row) =>
    row.lastAccessLabel.toLowerCase().includes('sem acesso'),
  ).length
  const uniqueCities = new Set(rows.map((row) => row.contractingEntity.municipality)).size

  const units = useMemo(
    () => buildCountSlices(rows, (row) => row.unitName, 8),
    [rows],
  )
  const profiles = useMemo(
    () => buildCountSlices(rows, (row) => row.profileLabel, 6),
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

  const statusSlices = useMemo<BarSlice[]>(
    () => [
      { label: 'Ativos', count: activeCount },
      { label: 'Bloqueados', count: blockedCount },
    ],
    [activeCount, blockedCount],
  )

  const scopeSlices = useMemo<BarSlice[]>(
    () => [
      { label: 'UBT', count: ubtScopeCount },
      { label: 'Entidade', count: prefeituraScopeCount },
    ],
    [ubtScopeCount, prefeituraScopeCount],
  )

  const accessRecencySlices = useMemo<BarSlice[]>(
    () =>
      [
        { label: 'Acesso hoje', count: accessedToday },
        { label: 'Acesso ontem', count: accessedYesterday },
        {
          label: 'Outros períodos',
          count: Math.max(0, total - accessedToday - accessedYesterday - noRecentAccess),
        },
        { label: 'Sem acesso recente', count: noRecentAccess },
      ].filter((item) => item.count > 0),
    [accessedToday, accessedYesterday, noRecentAccess, total],
  )

  const illustrationUrl = brand.dashboardCredentialsImageUrl

  return (
    <aside className="flex h-full w-full shrink-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
        <header className="shrink-0 text-center">
          <h2 className="text-lg font-bold text-gray-900">Indicadores de operadores</h2>
          <p className="mt-1 text-xs text-gray-500">
            Visão consolidada de acessos, unidades e perfis na rede das entidades
          </p>
        </header>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
          <MiniKpi
            label="Total"
            value={formatNumber(uniqueCities)}
            hint="localidades com operadores"
            valueClassName="text-gray-900"
          />
          <MiniKpi
            label="Ativos"
            value={formatNumber(activeCount)}
            hint={formatPercent(activeCount, total)}
            valueClassName="text-emerald-600"
          />
          <MiniKpi
            label="Bloqueados"
            value={formatNumber(blockedCount)}
            hint={formatPercent(blockedCount, total)}
            valueClassName="text-red-600"
          />
          <MiniKpi
            label="Operadores"
            value={formatNumber(total)}
            hint="cadastrados no total"
            valueClassName="text-sky-700"
          />
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status de acesso
              </h3>
              <p className="mt-1 text-[11px] text-gray-500">Ativos vs bloqueados na plataforma</p>
              <div className="mt-3">
                <HorizontalBars
                  data={statusSlices}
                  gradientClass="bg-gradient-to-r from-emerald-500 to-teal-400"
                />
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Escopo operacional
              </h3>
              <p className="mt-1 text-[11px] text-gray-500">Distribuição UBT e entidade</p>
              <div className="mt-3">
                <HorizontalBars
                  data={scopeSlices}
                  gradientClass="bg-gradient-to-r from-violet-500 to-purple-500"
                />
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Nível de acesso
              </h3>
              <p className="mt-1 text-[11px] text-gray-500">Perfil de permissão no painel</p>
              <div className="mt-3">
                <HorizontalBars
                  data={accessLevels}
                  gradientClass="bg-gradient-to-r from-amber-500 to-orange-500"
                />
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Recência de acesso
              </h3>
              <p className="mt-1 text-[11px] text-gray-500">Último login registrado</p>
              <div className="mt-3">
                <HorizontalBars
                  data={accessRecencySlices}
                  gradientClass="bg-gradient-to-r from-sky-500 to-indigo-500"
                />
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Top 8 unidades por usuários
              </h3>
              <div className="mt-3">
                <HorizontalBars
                  data={units}
                  gradientClass="bg-gradient-to-r from-cyan-500 to-blue-600"
                />
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Perfis mais frequentes
              </h3>
              <div className="mt-3">
                <HorizontalBars
                  data={profiles}
                  gradientClass="bg-gradient-to-r from-emerald-500 to-teal-400"
                />
              </div>
            </section>
          </div>

          {illustrationUrl ? (
            <div className="mt-2 flex shrink-0 items-end pb-1 pt-1">
              <img
                src={illustrationUrl}
                alt=""
                className="h-32 w-full object-contain object-bottom"
              />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
