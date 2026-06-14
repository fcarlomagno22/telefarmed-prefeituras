import type { CompiledReportHighlight } from '../../../lib/prefeitura/prefeituraRelatoriosCompiledRegistry'
import type { PrefeituraRelatorioId } from '../../../types/prefeituraRelatorios'

export type CompiledOverviewEntry = {
  id: PrefeituraRelatorioId
  title: string
  description: string
  highlights: CompiledReportHighlight[]
}

type Props = {
  categoryTitle?: string | null
  categoryDescription?: string | null
  entidadeRazaoSocial: string
  brandName: string
  logoUrl: string
  periodLabel: string
  generatedAtLabel: string
  generatedBy: string
  entries: CompiledOverviewEntry[]
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function PrefeituraRelatoriosCompiledOverview({
  categoryTitle,
  categoryDescription,
  entidadeRazaoSocial,
  brandName,
  logoUrl,
  periodLabel,
  generatedAtLabel,
  generatedBy,
  entries,
}: Props) {
  const title = categoryTitle ? `${categoryTitle} — Compilado` : 'Compilado de relatórios'

  return (
    <div className="p-6 sm:p-8">
      <div className="h-1 rounded-full bg-[var(--brand-primary)]" />

      <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Relatório operacional
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {categoryDescription ??
              'Visão consolidada dos relatórios selecionados, com indicadores gerais e detalhamento individual abaixo.'}
          </p>
          <div className="mt-3 space-y-1 text-xs text-gray-500">
            <p>
              <span className="font-medium text-gray-700">{entidadeRazaoSocial}</span> · {brandName}
            </p>
            <p>
              Período: <strong className="text-gray-800">{periodLabel}</strong>
            </p>
            <p>
              {formatNumber(entries.length)} relatório{entries.length === 1 ? '' : 's'} neste compilado
            </p>
          </div>
        </div>
        <img src={logoUrl} alt={brandName} className="h-9 w-auto shrink-0 self-start" crossOrigin="anonymous" />
      </header>

      <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Relatórios incluídos</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatNumber(entries.length)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Cada um inicia em página separada na impressão/PDF</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center sm:col-span-2 xl:col-span-2">
          <p className="text-xs font-medium text-gray-500">Conteúdo do compilado</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {entries.map((entry) => entry.title).join(' · ')}
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Gerado em</p>
          <p className="mt-1 text-sm font-bold text-gray-900">{generatedAtLabel}</p>
          <p className="mt-1 text-xs text-gray-500">por {generatedBy}</p>
        </article>
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Resumo dos relatórios selecionados
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {entries.map((entry, index) => (
            <article key={entry.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-bold text-orange-600">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900">{entry.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{entry.description}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {entry.highlights.map((highlight) => (
                      <div
                        key={`${entry.id}-${highlight.label}`}
                        className="rounded-lg border border-gray-100 bg-slate-50/80 px-3 py-2 text-center"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          {highlight.label}
                        </p>
                        <p className="mt-1 text-sm font-bold text-gray-900">{highlight.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
