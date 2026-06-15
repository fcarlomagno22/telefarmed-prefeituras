import {
  Activity,
  ClipboardList,
  HeartPulse,
  Info,
  Pill,
  Stethoscope,
  Thermometer,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  extractTriagemChiefComplaint,
  parseTriagemResumoToSections,
  type TriagemResumoSectionId,
} from '../../../utils/triage/parseTriagemResumo'

type DoctorClinicalTriageDrawerProps = {
  open: boolean
  onClose: () => void
  patientName: string
  patientAgeGender?: string
  unitName?: string
  triageSummary: string
}

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

export function DoctorClinicalTriageDrawer({
  open,
  onClose,
  patientName,
  patientAgeGender,
  unitName,
  triageSummary,
}: DoctorClinicalTriageDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [closing, setClosing] = useState(false)

  const sections = useMemo(() => parseTriagemResumoToSections(triageSummary), [triageSummary])
  const chiefComplaint = useMemo(() => extractTriagemChiefComplaint(triageSummary), [triageSummary])
  const hasContent = sections.length > 0

  const panelVisible = open && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      setClosing(false)
      return
    }
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') handleClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleClose() {
    setClosing(true)
    window.setTimeout(() => {
      setClosing(false)
      setEntered(false)
      onClose()
    }, 280)
  }

  if (!open && !closing) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9998] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        tabIndex={panelVisible ? 0 : -1}
        className={`absolute inset-0 bg-gray-950/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Fechar triagem clínica"
        onClick={handleClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="doctor-clinical-triage-title"
        className={[
          'absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-hidden border-l border-gray-200 bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.14)] transition-transform duration-300 ease-out motion-reduce:transition-none sm:max-w-lg',
          panelVisible ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <header className="shrink-0 border-b border-gray-100 bg-gradient-to-br from-[var(--brand-primary-light)]/50 via-white to-white px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  <ClipboardList className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Terminal UBT
                  </p>
                  <h2
                    id="doctor-clinical-triage-title"
                    className="text-lg font-bold tracking-tight text-gray-900"
                  >
                    Triagem clínica
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">{patientName}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {[patientAgeGender, unitName].filter(Boolean).join(' · ')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {!hasContent ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 text-center">
              <Thermometer className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="mt-4 text-sm font-semibold text-gray-700">Triagem não registrada</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-gray-500">
                Este atendimento ainda não possui respostas da triagem clínica no terminal.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {chiefComplaint ? (
                <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-sky-700">
                    Motivo principal
                  </p>
                  <p className="mt-2 text-base font-semibold leading-snug text-gray-900">
                    {chiefComplaint}
                  </p>
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
                    <div className="flex items-center gap-2 border-b border-inherit px-4 py-3">
                      <Icon className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" strokeWidth={2} />
                      <h3 className="text-sm font-bold text-gray-900">{section.title}</h3>
                    </div>
                    <dl className="divide-y divide-gray-100/80 px-4">
                      {visibleItems.map((item) => (
                        <div key={`${section.id}-${item.label}`} className="py-3">
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            {item.label}
                          </dt>
                          <dd className="mt-1.5">
                            <TriageValue value={item.value} multiline={item.multiline} />
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
