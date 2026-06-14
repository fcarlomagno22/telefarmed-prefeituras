import { ExternalLink } from 'lucide-react'
import { useMemo } from 'react'
import { brand } from '../../config/brand'
import type { AccessLevelId } from '../../config/accessCredentials'
import type { AccessCredentialUser, RecentAccessEntry } from '../../data/accessCredentialsMock'
import { AccessCredentialsSidebarIllustration } from './AccessCredentialsIllustration'
import {
  accessLevelGradients,
  statusGradients,
} from './accessCredentialsChartConfig'
import {
  CredentialDonutChart,
  useCredentialChartLegendAnimation,
  type DonutSlice,
} from './CredentialDonutChart'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

type AccessCredentialsSidebarPanelProps = {
  users: AccessCredentialUser[]
  recentAccessEntries?: RecentAccessEntry[]
  onOpenAllAccesses?: () => void
}

export function AccessCredentialsSidebarPanel({
  users,
  recentAccessEntries = [],
  onOpenAllAccesses,
}: AccessCredentialsSidebarPanelProps) {
  const totalUsers = users.length
  const activeCount = users.filter((user) => user.status === 'ativo').length
  const inactiveCount = totalUsers - activeCount
  const activePercent = totalUsers > 0 ? Math.round((activeCount / totalUsers) * 100) : 0

  const levelSlices = useMemo(() => {
    const counts: Record<AccessLevelId, number> = {
      administrador: 0,
      operador: 0,
      editor: 0,
      visualizador: 0,
    }
    for (const user of users) {
      counts[user.accessLevel] += 1
    }

    return (Object.keys(counts) as AccessLevelId[])
      .filter((level) => counts[level] > 0)
      .map(
        (level): DonutSlice => ({
          key: level,
          label: accessLevelGradients[level].label,
          count: counts[level],
          gradientFrom: accessLevelGradients[level].gradientFrom,
          gradientTo: accessLevelGradients[level].gradientTo,
        }),
      )
  }, [users])

  const statusSlices: DonutSlice[] = useMemo(
    () =>
      [
        {
          key: 'ativo',
          label: statusGradients.ativo.label,
          count: activeCount,
          gradientFrom: statusGradients.ativo.gradientFrom,
          gradientTo: statusGradients.ativo.gradientTo,
        },
        {
          key: 'inativo',
          label: statusGradients.inativo.label,
          count: inactiveCount,
          gradientFrom: statusGradients.inativo.gradientFrom,
          gradientTo: statusGradients.inativo.gradientTo,
        },
      ].filter((slice) => slice.count > 0),
    [activeCount, inactiveCount],
  )

  const levelLegendAnimate = useCredentialChartLegendAnimation([levelSlices])
  const statusLegendAnimate = useCredentialChartLegendAnimation([statusSlices])
  const hasIllustration = Boolean(brand.dashboardCredentialsImageUrl)

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <AccessCredentialsSidebarIllustration />

      <div className="min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section
          className={['p-5', hasIllustration ? 'border-t border-gray-200' : ''].filter(Boolean).join(' ')}
        >
          <h2 className="text-base font-bold text-gray-900">Resumo de acessos</h2>
          <p className="mt-1 text-xs text-gray-500">Total de usuários</p>
          <p className="mt-0.5 text-3xl font-bold tabular-nums text-gray-900">
            {formatNumber(totalUsers)}
          </p>

          <div className="mt-4 flex items-center gap-4">
            <ul className="min-w-0 flex-1 space-y-2">
              {(['administrador', 'operador', 'editor', 'visualizador'] as AccessLevelId[]).map(
                (level, index) => {
                  const count = users.filter((user) => user.accessLevel === level).length
                  const gradient = accessLevelGradients[level]
                  return (
                    <li key={level} className="flex items-center gap-2 text-sm">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          background: `linear-gradient(135deg, ${gradient.gradientFrom}, ${gradient.gradientTo})`,
                        }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-gray-600">{gradient.label}</span>
                      <span
                        className="shrink-0 font-semibold tabular-nums text-gray-900 transition-opacity duration-500"
                        style={{
                          opacity: levelLegendAnimate ? 1 : 0,
                          transitionDelay: `${0.35 + index * 0.1}s`,
                        }}
                      >
                        {count}
                      </span>
                    </li>
                  )
                },
              )}
            </ul>
            <CredentialDonutChart
              chartId="access-levels"
              slices={levelSlices}
              centerPrimary={String(totalUsers)}
              centerSecondary="Total"
              size="md"
            />
          </div>
        </section>

        <section className="border-t border-gray-200 p-5">
          <h2 className="text-base font-bold text-gray-900">Usuários por status</h2>
          <div className="mt-4 flex items-center gap-4">
            <CredentialDonutChart
              chartId="user-status"
              slices={statusSlices}
              centerPrimary={`${activePercent}%`}
              centerSecondary="Ativos"
              size="md"
            />
            <ul className="min-w-0 flex-1 space-y-2.5">
              <li className="flex items-center gap-2 text-sm">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${statusGradients.ativo.gradientFrom}, ${statusGradients.ativo.gradientTo})`,
                  }}
                  aria-hidden
                />
                <span className="flex-1 text-gray-600">{statusGradients.ativo.label}</span>
                <span
                  className="font-semibold tabular-nums text-gray-900 transition-opacity duration-500"
                  style={{
                    opacity: statusLegendAnimate ? 1 : 0,
                    transitionDelay: '0.35s',
                  }}
                >
                  {activeCount}
                </span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${statusGradients.inativo.gradientFrom}, ${statusGradients.inativo.gradientTo})`,
                  }}
                  aria-hidden
                />
                <span className="flex-1 text-gray-600">{statusGradients.inativo.label}</span>
                <span
                  className="font-semibold tabular-nums text-gray-900 transition-opacity duration-500"
                  style={{
                    opacity: statusLegendAnimate ? 1 : 0,
                    transitionDelay: '0.45s',
                  }}
                >
                  {inactiveCount}
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="border-t border-gray-200 p-5">
          <h2 className="text-base font-bold text-gray-900">Últimos acessos</h2>
          {recentAccessEntries.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Nenhum acesso recente registrado.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentAccessEntries.map((entry) => (
                <li key={entry.userId} className="flex items-center gap-3">
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${entry.avatarClassName}`}
                    >
                      {entry.initials}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                    {entry.name}
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">{entry.accessedAtLabel}</span>
                </li>
              ))}
            </ul>
          )}
          {onOpenAllAccesses ? (
            <button
              type="button"
              onClick={onOpenAllAccesses}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] transition hover:underline"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={2} />
              Ver todos os acessos
            </button>
          ) : null}
        </section>
      </div>
    </aside>
  )
}
