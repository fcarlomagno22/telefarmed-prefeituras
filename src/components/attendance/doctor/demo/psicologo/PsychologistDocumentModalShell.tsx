import { useEffect, type LucideIcon, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Brain, FileSignature, X } from 'lucide-react'

export type PsychologistProfessionalInfo = {
  name: string
  specialty: string
  councilLabel: string
  councilRegistration: string
}

export type PsychologistPatientInfo = {
  name: string
  cpfMasked: string
  ageGenderLabel?: string
}

type PsychologistAccent =
  | 'violet'
  | 'teal'
  | 'amber'
  | 'blue'
  | 'fuchsia'
  | 'lime'
  | 'emerald'
  | 'indigo'
  | 'sky'

type PsychologistDocumentModalShellProps = {
  open: boolean
  title: string
  subtitle: string
  icon?: LucideIcon
  accent?: PsychologistAccent
  hint?: string
  onClose: () => void
  onSign: () => void | Promise<void>
  signing?: boolean
  validationHint?: string | null
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
  children: ReactNode
}

const panelClass =
  'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm'

const accentStyles: Record<
  PsychologistAccent,
  {
    headerBorder: string
    headerBg: string
    iconBg: string
    iconShadow: string
    sectionTitle: string
    focusRing: string
    signButton: string
    tipBorder: string
    tipBg: string
    tipText: string
    tipTitle: string
    proIconBg: string
    proIconText: string
  }
> = {
  violet: {
    headerBorder: 'border-violet-100',
    headerBg: 'from-violet-50 via-white to-white',
    iconBg: 'from-violet-500 to-violet-400',
    iconShadow: 'shadow-violet-200/60',
    sectionTitle: 'text-violet-600/90',
    focusRing: 'focus:border-violet-400 focus:ring-violet-400/20',
    signButton: 'from-violet-600 to-purple-600 shadow-violet-200/50',
    tipBorder: 'border-violet-100',
    tipBg: 'bg-violet-50/50',
    tipText: 'text-violet-900/80',
    tipTitle: 'text-violet-800',
    proIconBg: 'bg-violet-50',
    proIconText: 'text-violet-600',
  },
  teal: {
    headerBorder: 'border-teal-100',
    headerBg: 'from-teal-50 via-white to-white',
    iconBg: 'from-teal-500 to-emerald-400',
    iconShadow: 'shadow-teal-200/60',
    sectionTitle: 'text-teal-600/90',
    focusRing: 'focus:border-teal-400 focus:ring-teal-400/20',
    signButton: 'from-teal-600 to-emerald-600 shadow-teal-200/50',
    tipBorder: 'border-teal-100',
    tipBg: 'bg-teal-50/50',
    tipText: 'text-teal-900/80',
    tipTitle: 'text-teal-800',
    proIconBg: 'bg-teal-50',
    proIconText: 'text-teal-600',
  },
  amber: {
    headerBorder: 'border-amber-100',
    headerBg: 'from-amber-50 via-white to-white',
    iconBg: 'from-amber-500 to-orange-400',
    iconShadow: 'shadow-amber-200/60',
    sectionTitle: 'text-amber-700/90',
    focusRing: 'focus:border-amber-400 focus:ring-amber-400/20',
    signButton: 'from-amber-600 to-orange-600 shadow-amber-200/50',
    tipBorder: 'border-amber-100',
    tipBg: 'bg-amber-50/50',
    tipText: 'text-amber-900/80',
    tipTitle: 'text-amber-800',
    proIconBg: 'bg-amber-50',
    proIconText: 'text-amber-600',
  },
  blue: {
    headerBorder: 'border-blue-100',
    headerBg: 'from-blue-50 via-white to-white',
    iconBg: 'from-blue-500 to-cyan-400',
    iconShadow: 'shadow-blue-200/60',
    sectionTitle: 'text-blue-600/90',
    focusRing: 'focus:border-blue-400 focus:ring-blue-400/20',
    signButton: 'from-blue-600 to-cyan-600 shadow-blue-200/50',
    tipBorder: 'border-blue-100',
    tipBg: 'bg-blue-50/50',
    tipText: 'text-blue-900/80',
    tipTitle: 'text-blue-800',
    proIconBg: 'bg-blue-50',
    proIconText: 'text-blue-600',
  },
  fuchsia: {
    headerBorder: 'border-fuchsia-100',
    headerBg: 'from-fuchsia-50 via-white to-white',
    iconBg: 'from-fuchsia-500 to-pink-400',
    iconShadow: 'shadow-fuchsia-200/60',
    sectionTitle: 'text-fuchsia-600/90',
    focusRing: 'focus:border-fuchsia-400 focus:ring-fuchsia-400/20',
    signButton: 'from-fuchsia-600 to-pink-600 shadow-fuchsia-200/50',
    tipBorder: 'border-fuchsia-100',
    tipBg: 'bg-fuchsia-50/50',
    tipText: 'text-fuchsia-900/80',
    tipTitle: 'text-fuchsia-800',
    proIconBg: 'bg-fuchsia-50',
    proIconText: 'text-fuchsia-600',
  },
  lime: {
    headerBorder: 'border-lime-100',
    headerBg: 'from-lime-50 via-white to-white',
    iconBg: 'from-lime-500 to-emerald-400',
    iconShadow: 'shadow-lime-200/60',
    sectionTitle: 'text-lime-700/90',
    focusRing: 'focus:border-lime-400 focus:ring-lime-400/20',
    signButton: 'from-lime-600 to-emerald-600 shadow-lime-200/50',
    tipBorder: 'border-lime-100',
    tipBg: 'bg-lime-50/50',
    tipText: 'text-lime-900/80',
    tipTitle: 'text-lime-800',
    proIconBg: 'bg-lime-50',
    proIconText: 'text-lime-700',
  },
  emerald: {
    headerBorder: 'border-emerald-100',
    headerBg: 'from-emerald-50 via-white to-white',
    iconBg: 'from-emerald-500 to-teal-400',
    iconShadow: 'shadow-emerald-200/60',
    sectionTitle: 'text-emerald-700/90',
    focusRing: 'focus:border-emerald-400 focus:ring-emerald-400/20',
    signButton: 'from-emerald-600 to-teal-600 shadow-emerald-200/50',
    tipBorder: 'border-emerald-100',
    tipBg: 'bg-emerald-50/50',
    tipText: 'text-emerald-900/80',
    tipTitle: 'text-emerald-800',
    proIconBg: 'bg-emerald-50',
    proIconText: 'text-emerald-600',
  },
  indigo: {
    headerBorder: 'border-indigo-100',
    headerBg: 'from-indigo-50 via-white to-white',
    iconBg: 'from-indigo-500 to-violet-400',
    iconShadow: 'shadow-indigo-200/60',
    sectionTitle: 'text-indigo-600/90',
    focusRing: 'focus:border-indigo-400 focus:ring-indigo-400/20',
    signButton: 'from-indigo-600 to-violet-600 shadow-indigo-200/50',
    tipBorder: 'border-indigo-100',
    tipBg: 'bg-indigo-50/50',
    tipText: 'text-indigo-900/80',
    tipTitle: 'text-indigo-800',
    proIconBg: 'bg-indigo-50',
    proIconText: 'text-indigo-600',
  },
  sky: {
    headerBorder: 'border-sky-100',
    headerBg: 'from-sky-50 via-white to-white',
    iconBg: 'from-sky-500 to-blue-400',
    iconShadow: 'shadow-sky-200/60',
    sectionTitle: 'text-sky-600/90',
    focusRing: 'focus:border-sky-400 focus:ring-sky-400/20',
    signButton: 'from-sky-600 to-blue-600 shadow-sky-200/50',
    tipBorder: 'border-sky-100',
    tipBg: 'bg-sky-50/50',
    tipText: 'text-sky-900/80',
    tipTitle: 'text-sky-800',
    proIconBg: 'bg-sky-50',
    proIconText: 'text-sky-600',
  },
}

export function PsychologistDocumentModalShell({
  open,
  title,
  subtitle,
  icon: Icon = Brain,
  accent = 'violet',
  hint,
  onClose,
  onSign,
  signing = false,
  validationHint,
  patient,
  professional,
  children,
}: PsychologistDocumentModalShellProps) {
  const theme = accentStyles[accent]

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-[2px]"
        onClick={() => !signing && onClose()}
      />

      <div className="fixed inset-0 z-[121] flex items-center justify-center p-3 sm:p-4">
        <div className="flex max-h-[94vh] w-[96vw] max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-[#f5f6f8] shadow-2xl">
          <div
            className={[
              'flex shrink-0 items-center justify-between border-b bg-gradient-to-r px-5 py-4',
              theme.headerBorder,
              theme.headerBg,
            ].join(' ')}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md',
                  theme.iconBg,
                  theme.iconShadow,
                ].join(' ')}
              >
                <Icon className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-gray-900">{title}</h2>
                <p className="truncate text-sm text-gray-500">{subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={signing}
              className="shrink-0 rounded-xl p-2 text-gray-500 transition hover:bg-gray-100"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="hidden shrink-0 space-y-4 overflow-y-auto lg:block lg:max-h-full">
              <div className={panelClass}>
                <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Paciente
                  </p>
                </div>
                <div className="space-y-1 p-4 text-sm">
                  <p className="font-bold text-gray-900">{patient.name}</p>
                  <p className="text-xs text-gray-600">CPF {patient.cpfMasked}</p>
                  {patient.ageGenderLabel ? (
                    <p className="text-xs text-gray-500">{patient.ageGenderLabel}</p>
                  ) : null}
                </div>
              </div>

              <div className={panelClass}>
                <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Emissor
                  </p>
                </div>
                <div className="flex items-start gap-3 p-4">
                  <span
                    className={[
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      theme.proIconBg,
                      theme.proIconText,
                    ].join(' ')}
                  >
                    <Brain className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-bold text-gray-900">{professional.name}</p>
                    <p className="mt-0.5 text-gray-600">{professional.specialty}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {professional.councilLabel} {professional.councilRegistration}
                    </p>
                  </div>
                </div>
              </div>

              {hint ? (
                <div
                  className={[
                    'rounded-2xl border px-4 py-3 text-[11px] leading-relaxed',
                    theme.tipBorder,
                    theme.tipBg,
                    theme.tipText,
                  ].join(' ')}
                >
                  <p className={['font-semibold', theme.tipTitle].join(' ')}>Orientação</p>
                  <p className="mt-1">{hint}</p>
                </div>
              ) : null}
            </aside>

            <section className={`${panelClass} min-h-0 flex-1`}>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
                <div className="space-y-6 p-4 sm:p-5">{children}</div>
              </div>
            </section>
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 sm:px-5">
            {validationHint ? (
              <p className="mb-2 text-sm font-medium text-red-600">{validationHint}</p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-500 lg:hidden">
                {patient.name} · {professional.councilLabel} {professional.councilRegistration}
              </p>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={signing}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void onSign()}
                  disabled={signing}
                  className={[
                    'inline-flex items-center gap-2 rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60',
                    theme.signButton,
                  ].join(' ')}
                >
                  <FileSignature className="h-4 w-4" strokeWidth={2} />
                  {signing ? 'Gerando PDF…' : 'Assinar e emitir PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}

export function SectionTitle({
  children,
  accent = 'violet',
}: {
  children: ReactNode
  accent?: PsychologistAccent
}) {
  return (
    <p
      className={[
        'text-[11px] font-bold uppercase tracking-wider',
        accentStyles[accent].sectionTitle,
      ].join(' ')}
    >
      {children}
    </p>
  )
}

export function FormSection({
  title,
  accent = 'violet',
  children,
}: {
  title: string
  accent?: PsychologistAccent
  children: ReactNode
}) {
  return (
    <div className="space-y-4">
      <SectionTitle accent={accent}>{title}</SectionTitle>
      {children}
    </div>
  )
}

const fieldBaseClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:ring-2'

export function FieldLabel({
  children,
  required,
}: {
  children: ReactNode
  required?: boolean
}) {
  return (
    <span className="mb-1.5 block text-sm font-semibold text-gray-900">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </span>
  )
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 2,
  placeholder,
  required,
  accent = 'violet',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  required?: boolean
  accent?: PsychologistAccent
}) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={[
          fieldBaseClass,
          'resize-none leading-relaxed',
          accentStyles[accent].focusRing,
        ].join(' ')}
      />
    </label>
  )
}

export function TextInputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  accent = 'violet',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  accent?: PsychologistAccent
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={[fieldBaseClass, accentStyles[accent].focusRing].join(' ')}
      />
    </label>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  accent = 'violet',
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string }>
  accent?: PsychologistAccent
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={[fieldBaseClass, accentStyles[accent].focusRing].join(' ')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
