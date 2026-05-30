import { Sparkles } from 'lucide-react'
import type { AdminEscalaShift } from '../../../types/adminEscala'
import { formatAdminEscalaScopeSummary } from './adminEscalaUi'

type AdminEscalaComposePreviewPanelProps = {
  previewCount: number
  slotCount: number
  specialtyCount: number
  specialtyLabels: string[]
  programmingSummary: string
  scopeDraft: AdminEscalaShift
  activeStep: number
  onPublish: (status: 'publicada' | 'rascunho') => void
}

export function AdminEscalaComposePreviewPanel({
  previewCount,
  slotCount,
  specialtyCount,
  specialtyLabels,
  programmingSummary,
  scopeDraft,
  activeStep,
  onPublish,
}: AdminEscalaComposePreviewPanelProps) {
  return (
    <aside className="flex h-full w-[17.5rem] shrink-0 flex-col border-l border-gray-200/80 bg-gray-950 text-white lg:w-[18.5rem] xl:w-[19.5rem]">
      <div className="relative overflow-hidden px-6 pb-6 pt-8">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[var(--brand-primary)]/30 blur-3xl"
          aria-hidden
        />
        <div className="relative flex items-center gap-2 text-[var(--brand-primary)]">
          <Sparkles className="h-4 w-4" strokeWidth={2} />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
            Prévia ao vivo
          </span>
        </div>
        <p className="relative mt-4 text-5xl font-bold tabular-nums tracking-tight">
          {previewCount}
        </p>
        <p className="relative text-sm font-medium text-gray-400">plantões no período</p>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-gray-200">
            {slotCount} médico{slotCount === 1 ? '' : 's'} programado{slotCount === 1 ? '' : 's'}
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-gray-200">
            {specialtyCount} esp.
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-4">
        <PreviewBlock label="Cobertura" value={formatAdminEscalaScopeSummary(scopeDraft)} />
        <PreviewBlock
          label="Especialidades"
          value={specialtyLabels.length > 0 ? specialtyLabels.join(' · ') : 'Nenhuma selecionada'}
        />
        <PreviewBlock label="Programação" value={programmingSummary} />
      </div>

      <div className="shrink-0 space-y-2.5 border-t border-white/10 p-6">
        <button
          type="button"
          onClick={() => onPublish('publicada')}
          disabled={previewCount === 0 || activeStep < 3}
          className="w-full rounded-xl bg-[var(--brand-primary)] py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)] disabled:opacity-40"
        >
          Publicar escala
        </button>
        <button
          type="button"
          onClick={() => onPublish('rascunho')}
          disabled={previewCount === 0}
          className="w-full rounded-xl bg-white/10 py-3 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-40"
        >
          Salvar como rascunho
        </button>
      </div>
    </aside>
  )
}

function PreviewBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">{label}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-100">{value}</p>
    </div>
  )
}
