import {
  BarChart3,
  Download,
  Filter,
  Headphones,
  ListChecks,
  RefreshCw,
} from 'lucide-react'

const guideSteps = [
  {
    icon: ListChecks,
    title: 'Selecione um relatório',
    description: 'Escolha a categoria desejada acima.',
  },
  {
    icon: Filter,
    title: 'Aplique filtros',
    description: 'Use os filtros disponíveis para refinar os dados.',
  },
  {
    icon: BarChart3,
    title: 'Visualize e analise',
    description: 'Interprete os gráficos e tabelas para tomar decisões.',
  },
  {
    icon: Download,
    title: 'Exportar dados',
    description: 'Gere relatórios em PDF ou Excel quando necessário.',
  },
  {
    icon: RefreshCw,
    title: 'Atualização automática',
    description: 'Os dados são atualizados em tempo real.',
  },
] as const

export function RelatoriosQuickGuideSidebar() {
  return (
    <aside className="flex h-full min-h-0 flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <div className="shrink-0">
        <span className="inline-flex rounded-full bg-[var(--brand-primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          Guia rápido
        </span>
        <h2 className="mt-3 text-lg font-bold text-gray-900">Como usar esta página</h2>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          Navegue pelos relatórios para obter insights e apoiar a gestão da unidade.
        </p>
      </div>

      <ol className="min-h-0 flex-1 space-y-4">
        {guideSteps.map((step) => {
          const Icon = step.icon
          return (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900">{step.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                  {step.description}
                </span>
              </span>
            </li>
          )
        })}
      </ol>

      <div className="shrink-0 rounded-xl border border-orange-100 bg-orange-50/80 px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <Headphones
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]"
            strokeWidth={2}
          />
          <p className="text-xs leading-relaxed text-[var(--brand-primary)]">
            <span className="font-semibold">Dúvidas ou sugestões?</span> Fale com a
            coordenação da unidade.
          </p>
        </div>
      </div>
    </aside>
  )
}
