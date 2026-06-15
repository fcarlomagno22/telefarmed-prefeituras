import { Clock3, LogIn, LogOut, Stethoscope, UserRound } from 'lucide-react'
import type { AdminEscalaPlantaoExecution } from '../../../types/adminEscala'
import { formatPlantaoAuditoriaDateTime } from '../../../utils/admin/formatPlantaoRepasseAuditoria'

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
    </article>
  )
}

function PlantaoStatusBadge({ plantao }: { plantao: AdminEscalaPlantaoExecution }) {
  if (plantao.plantaoStatus === 'realizado' || plantao.plantaoEncerrado) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-200">
        Realizado
      </span>
    )
  }
  if (plantao.sessaoAtiva) {
    return (
      <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-800 ring-1 ring-violet-200">
        Em andamento
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-800 ring-1 ring-indigo-200">
      Confirmado
    </span>
  )
}

type AdminEscalaShiftExecutionPanelProps = {
  plantoes: AdminEscalaPlantaoExecution[]
  loading?: boolean
  error?: string | null
}

export function AdminEscalaShiftExecutionPanel({
  plantoes,
  loading = false,
  error = null,
}: AdminEscalaShiftExecutionPanelProps) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">Carregando execução do plantão…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </section>
    )
  }

  if (plantoes.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-4">
        <p className="text-sm font-semibold text-gray-700">Nenhuma execução registrada</p>
        <p className="mt-1 text-xs text-gray-500">
          O médico ainda não entrou no plantão ou não há captura confirmada para este slot.
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      {plantoes.map((plantao) => (
        <section
          key={plantao.plantaoId}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div className="flex min-w-0 items-start gap-2">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                <UserRound className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">{plantao.profissionalNome}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Confirmado em {formatPlantaoAuditoriaDateTime(plantao.confirmadoEm)}
                </p>
              </div>
            </div>
            <PlantaoStatusBadge plantao={plantao} />
          </header>

          <div className="space-y-4 px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-xl border border-gray-100 bg-slate-50/80 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <LogIn className="h-3.5 w-3.5" />
                  Entrada no plantão
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatPlantaoAuditoriaDateTime(plantao.enteredAt)}
                </p>
              </article>
              <article className="rounded-xl border border-gray-100 bg-slate-50/80 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <LogOut className="h-3.5 w-3.5" />
                  Saída / encerramento
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatPlantaoAuditoriaDateTime(plantao.endedAt)}
                </p>
              </article>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile label="Atendimentos" value={String(plantao.atendidos)} />
              <MetricTile label="Não compareceu" value={String(plantao.naoCompareceu)} />
              <MetricTile label="Desistiu" value={String(plantao.desistiu)} />
              <MetricTile
                label="Duração do plantão"
                value={
                  plantao.duracaoPlantaoMin != null
                    ? `${plantao.duracaoPlantaoMin} min`
                    : '—'
                }
              />
              <MetricTile
                label="Tempo médio"
                value={
                  plantao.tempoMedioMin != null ? `${plantao.tempoMedioMin} min` : '—'
                }
              />
              <MetricTile
                label="Agendados + encaixes"
                value={String(plantao.consultasAgendadas + plantao.encaixes)}
              />
              <MetricTile
                label="Online no turno"
                value={
                  plantao.percentualOnline != null
                    ? `${plantao.percentualOnline}%`
                    : '—'
                }
              />
            </div>

            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock3 className="h-3.5 w-3.5 shrink-0" />
              {plantao.encerramentoFormal
                ? 'Plantão encerrado formalmente pelo médico.'
                : plantao.sessaoAtiva
                  ? 'Sessão ativa — médico ainda no plantão.'
                  : 'Encerramento formal não registrado.'}
            </p>
          </div>
        </section>
      ))}
    </div>
  )
}

export function AdminEscalaShiftExecutionSectionHeader() {
  return (
    <div className="flex items-center gap-2">
      <Stethoscope className="h-4 w-4 text-[var(--brand-primary)]" />
      <h3 className="text-sm font-bold text-gray-900">Execução do plantão</h3>
    </div>
  )
}
