import {
  Activity,
  ClipboardList,
  HeartPulse,
  Info,
  Pill,
  Stethoscope,
  Thermometer,
} from 'lucide-react'
import { useMemo } from 'react'
import {
  extractTriagemChiefComplaint,
  parseTriagemResumoToSections,
  type TriagemResumoSectionId,
} from '../../../utils/triage/parseTriagemResumo'

const SECTION_ICONS: Record<TriagemResumoSectionId, typeof Stethoscope> = {
  queixa: Stethoscope,
  cronicas: HeartPulse,
  vitais: Activity,
  medicamentos: Pill,
  complementos: Info,
  outros: ClipboardList,
}

const SECTION_ACCENT: Record<TriagemResumoSectionId, string> = {
  queixa: 'from-sky-50 to-white border-sky-100',
  cronicas: 'from-rose-50/80 to-white border-rose-100',
  vitais: 'from-emerald-50/80 to-white border-emerald-100',
  medicamentos: 'from-violet-50/80 to-white border-violet-100',
  complementos: 'from-amber-50/80 to-white border-amber-100',
  outros: 'from-gray-50 to-white border-gray-100',
}

function TriageValue({ value, multiline }: { value: string; multiline?: boolean }) {
  if (multiline) {
    return (
      <div className="space-y-1.5">
        {value.split('\n').map((line) => (
          <p key={line} className="text-sm leading-relaxed text-gray-800">
            {line}
          </p>
        ))}
      </div>
    )
  }
  return <p className="text-sm leading-relaxed text-gray-800">{value}</p>
}

type ClinicalTriageSummaryPanelProps = {
  triageSummary: string
  compact?: boolean
}

export function ClinicalTriageSummaryPanel({
  triageSummary,
  compact = false,
}: ClinicalTriageSummaryPanelProps) {
  const sections = useMemo(() => parseTriagemResumoToSections(triageSummary), [triageSummary])
  const chiefComplaint = useMemo(() => extractTriagemChiefComplaint(triageSummary), [triageSummary])
  const hasContent = sections.length > 0 || Boolean(chiefComplaint)

  if (!hasContent) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center">
        <Thermometer className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-medium text-gray-600">Triagem não registrada</p>
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {chiefComplaint ? (
        <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-sky-700">
            Motivo principal
          </p>
          <p className="mt-2 text-sm font-semibold leading-snug text-gray-900">{chiefComplaint}</p>
        </div>
      ) : null}

      {sections.map((section) => {
        const Icon = SECTION_ICONS[section.id]
        const accent = SECTION_ACCENT[section.id]
        const visibleItems =
          section.id === 'queixa'
            ? section.items.filter((item) => item.label !== 'Motivo')
            : section.items

        if (visibleItems.length === 0) return null

        return (
          <section
            key={section.id}
            className={[
              'overflow-hidden rounded-2xl border bg-gradient-to-br shadow-sm',
              accent,
            ].join(' ')}
          >
            <div className="flex items-center gap-2 border-b border-inherit px-4 py-2.5">
              <Icon className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" strokeWidth={2} />
              <h3 className="text-sm font-bold text-gray-900">{section.title}</h3>
            </div>
            <dl className="divide-y divide-gray-100/80 px-4">
              {visibleItems.map((item) => (
                <div key={`${section.id}-${item.label}`} className="py-2.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {item.label}
                  </dt>
                  <dd className="mt-1">
                    <TriageValue value={item.value} multiline={item.multiline} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )
      })}
    </div>
  )
}
