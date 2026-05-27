import {
  Building2,
  ClipboardCheck,
  Gauge,
  MapPin,
  Monitor,
  Stethoscope,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { prefeituraRedeStatusBadgeConfig } from '../prefeituraRedeStatusBadge'
import {
  formatNewUbtAddress,
  getNewUbtUnitTypeLabel,
  type NewUbtFormState,
} from './newUbtFormTypes'

type PrefeituraNewUbtReviewStepProps = {
  form: NewUbtFormState
  regionLabel: string
  specialtyNames: string[]
  credentialsReady: boolean
}

function ReviewSection({
  icon: Icon,
  title,
  description,
  children,
  className = '',
}: {
  icon: LucideIcon
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <article
      className={[
        'flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="flex items-start gap-3 border-b border-gray-100 bg-gradient-to-r from-slate-50/90 to-white px-4 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {description ? <p className="mt-0.5 text-xs text-gray-500">{description}</p> : null}
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
    </article>
  )
}

function ReviewField({
  label,
  value,
  className = '',
  valueClassName = '',
}: {
  label: string
  value: string
  className?: string
  valueClassName?: string
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-gray-900 ${valueClassName}`.trim()}>{value || '—'}</p>
    </div>
  )
}

function SummaryMetric({
  label,
  value,
  suffix,
  icon: Icon,
}: {
  label: string
  value: string
  suffix?: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" strokeWidth={2} />
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      </div>
      <p className="mt-1 tabular-nums text-lg font-bold text-gray-900">
        {value}
        {suffix ? <span className="ml-1 text-xs font-semibold text-gray-500">{suffix}</span> : null}
      </p>
    </div>
  )
}

function CredentialBadge({ defined, label }: { defined: boolean; label: string }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        defined ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80' : 'bg-gray-100 text-gray-500',
      ].join(' ')}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${defined ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      {label}
    </span>
  )
}

export function PrefeituraNewUbtReviewStep({
  form,
  regionLabel,
  specialtyNames,
  credentialsReady,
}: PrefeituraNewUbtReviewStepProps) {
  const statusStyle = prefeituraRedeStatusBadgeConfig[form.status]
  const capacityLabel = form.enableDailyCapacityLimit
    ? `${form.dailyCapacityPerUnit} consultas/dia`
    : 'Sem limite'

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--brand-primary)]/15 bg-gradient-to-br from-[var(--brand-primary-light)] via-white to-orange-50/80 p-5 shadow-[0_4px_24px_rgba(255,107,0,0.08)]">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--brand-primary)]/10 blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--brand-primary)] shadow-sm ring-1 ring-[var(--brand-primary)]/10">
              <ClipboardCheck className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                Confirme os dados
              </p>
              <h2 className="mt-0.5 truncate text-xl font-bold text-gray-900 sm:text-2xl">
                {form.name.trim() || 'Nova UBT'}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                CNES {form.cnes || '—'} · {getNewUbtUnitTypeLabel(form.unitType)} · {regionLabel}
              </p>
            </div>
          </div>
          <span
            className={[
              'inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-bold shadow-sm ring-1 ring-gray-200/80',
              statusStyle.text,
            ].join(' ')}
          >
            <span className={`h-2 w-2 rounded-full ${statusStyle.accent}`} />
            {statusStyle.label}
          </span>
        </div>

        <div className="relative grid gap-3 sm:grid-cols-3">
          <SummaryMetric
            icon={Monitor}
            label="Terminais"
            value={form.stationsTotal}
            suffix={parseInt(form.stationsTotal, 10) === 1 ? 'terminal' : 'terminais'}
          />
          <SummaryMetric
            icon={Stethoscope}
            label="Especialidades"
            value={String(specialtyNames.length)}
            suffix="habilitadas"
          />
          <SummaryMetric icon={Gauge} label="Capacidade diária" value={capacityLabel} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewSection icon={Building2} title="Unidade" description="Identificação na rede municipal">
          <div className="grid gap-4 sm:grid-cols-2">
            <ReviewField label="Nome da UBT" value={form.name} className="sm:col-span-2" />
            <ReviewField label="CNES" value={form.cnes} />
            <ReviewField label="Tipo da unidade" value={getNewUbtUnitTypeLabel(form.unitType)} />
            <ReviewField
              label="Status inicial"
              value={statusStyle.label}
              className="sm:col-span-2"
              valueClassName={statusStyle.text}
            />
          </div>
        </ReviewSection>

        <ReviewSection
          icon={MapPin}
          title="Endereço e região"
          description="Localização física e RA de gestão"
        >
          <ReviewField
            label="Endereço completo"
            value={formatNewUbtAddress(form)}
            className="rounded-xl border border-gray-100 bg-slate-50/80 px-3 py-2.5"
            valueClassName="font-medium leading-relaxed"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ReviewField label="Região administrativa (RA)" value={regionLabel} />
            {form.unitLandlinePhone.trim() ? (
              <ReviewField label="Telefone fixo" value={form.unitLandlinePhone} />
            ) : (
              <ReviewField label="Telefone fixo" value="Não informado" valueClassName="text-gray-400 font-medium" />
            )}
          </div>
        </ReviewSection>

        <ReviewSection
          icon={UserRound}
          title="Responsável pela unidade"
          description="Contato e credenciais de acesso"
        >
          <ReviewField
            label="Nome completo"
            value={form.responsibleName}
            className="rounded-xl border border-gray-100 bg-slate-50/80 px-3 py-2.5"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <ReviewField label="E-mail" value={form.responsibleEmail} />
            <ReviewField label="CPF" value={form.responsibleCpf} />
            <ReviewField label="Celular" value={form.responsiblePhone} />
          </div>
          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
            <CredentialBadge defined={credentialsReady} label="Senha de acesso definida" />
            <CredentialBadge
              defined={credentialsReady}
              label={
                credentialsReady
                  ? `Autorização ${'•'.repeat(form.responsibleAuthorizationPin.length)}`
                  : 'Senha de autorização pendente'
              }
            />
          </div>
        </ReviewSection>

        <ReviewSection icon={Stethoscope} title="Operação" description="Capacidade e especialidades da UBT">
          <div className="grid gap-4 sm:grid-cols-2">
            <ReviewField label="Terminais de atendimento" value={form.stationsTotal} />
            <ReviewField label="Limite diário" value={capacityLabel} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Especialidades ({specialtyNames.length})
            </p>
            {specialtyNames.length > 0 ? (
              <ul className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto overscroll-y-contain">
                {specialtyNames.map((name) => (
                  <li
                    key={name}
                    className="rounded-lg border border-[var(--brand-primary)]/15 bg-[var(--brand-primary-light)]/40 px-2.5 py-1 text-xs font-semibold text-gray-800"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-400">Nenhuma especialidade selecionada</p>
            )}
          </div>
        </ReviewSection>
      </div>

      {form.notes.trim() ? (
        <article className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/80">
            Observações internas
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{form.notes}</p>
        </article>
      ) : null}
    </div>
  )
}
