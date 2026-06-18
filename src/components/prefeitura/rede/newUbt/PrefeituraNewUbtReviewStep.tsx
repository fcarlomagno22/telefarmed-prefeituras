import { ClipboardCheck, KeyRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ubtPublicUrl } from '../../../../config/tenantHost'
import { prefeituraRedeStatusBadgeConfig } from '../prefeituraRedeStatusBadge'
import {
  formatNewUbtAddress,
  getNewUbtUnitTypeLabel,
  type NewUbtFormState,
} from './newUbtFormTypes'

type UbtReviewSpecialtyGroup = {
  professionName: string
  specialtyNames: string[]
  hasCatalogSpecialties: boolean
}

type PrefeituraNewUbtReviewStepProps = {
  form: NewUbtFormState
  regionLabel: string
  professionNames: string[]
  specialtyGroups: UbtReviewSpecialtyGroup[]
  operationNames: string[]
  naRedeLabel?: string
  isPrefeituraTipo?: boolean
  entidadeDisplayName?: string
  entidadeLogoUrl?: string | null
  entidadeCorPrimaria?: string
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm font-semibold text-gray-900">{value || '—'}</dd>
    </div>
  )
}

function ReviewGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="border-b border-gray-100 pb-2 text-sm font-bold text-gray-900">{title}</h3>
      <dl className="mt-3 space-y-2.5">{children}</dl>
    </section>
  )
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-sm font-medium text-gray-400">—</span>
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((name) => (
        <li
          key={name}
          className="rounded-md border border-gray-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-gray-800"
        >
          {name}
        </li>
      ))}
    </ul>
  )
}

export function PrefeituraNewUbtReviewStep({
  form,
  regionLabel,
  professionNames,
  specialtyGroups,
  operationNames,
  naRedeLabel = 'na rede municipal',
  isPrefeituraTipo = true,
  entidadeDisplayName,
  entidadeLogoUrl,
  entidadeCorPrimaria = '#ff6b00',
}: PrefeituraNewUbtReviewStepProps) {
  const statusStyle = prefeituraRedeStatusBadgeConfig[form.status]
  const publicUrl = form.slug.trim() ? ubtPublicUrl(form.slug.trim()) : ''
  const capacityLabel = form.enableDailyCapacityLimit
    ? `${form.dailyCapacityPerUnit} consultas/dia`
    : 'Sem limite'

  const operationSummary =
    specialtyGroups.length > 0
      ? specialtyGroups
          .flatMap((group) =>
            group.hasCatalogSpecialties && group.specialtyNames.length > 0
              ? group.specialtyNames
              : group.hasCatalogSpecialties
                ? []
                : [group.professionName],
          )
      : operationNames

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <header className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--brand-primary)]">
              <ClipboardCheck className="h-4 w-4" strokeWidth={2} />
              Confirme os dados
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">{form.name.trim() || 'Nova UBT'}</h2>
            <p className="mt-1 text-sm text-gray-600">
              CNES {form.cnes || '—'} · {getNewUbtUnitTypeLabel(form.unitType)}
              {isPrefeituraTipo ? ` · ${regionLabel}` : ''}
            </p>
          </div>
          <span
            className={[
              'inline-flex items-center gap-2 rounded-full border border-gray-200 bg-slate-50 px-3 py-1 text-sm font-semibold',
              statusStyle.text,
            ].join(' ')}
          >
            <span className={`h-2 w-2 rounded-full ${statusStyle.accent}`} />
            {statusStyle.label}
          </span>
        </div>

        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <p>
            <span className="text-gray-500">Terminais:</span>{' '}
            <span className="font-semibold text-gray-900">{form.stationsTotal}</span>
          </p>
          <p>
            <span className="text-gray-500">Profissões:</span>{' '}
            <span className="font-semibold text-gray-900">{professionNames.length}</span>
          </p>
          <p>
            <span className="text-gray-500">Capacidade:</span>{' '}
            <span className="font-semibold text-gray-900">{capacityLabel}</span>
          </p>
        </div>
      </header>

      {publicUrl ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <ReviewRow label="Portal da UBT" value={publicUrl} />
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">
            <div className="flex shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white p-2">
              {entidadeLogoUrl ? (
                <img
                  src={entidadeLogoUrl}
                  alt={entidadeDisplayName ?? 'Logo da instituição'}
                  className="max-h-20 max-w-[200px] object-contain"
                />
              ) : (
                <div className="flex h-16 w-24 items-center justify-center text-xs text-gray-400">
                  Sem logo
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {entidadeDisplayName ?? 'Marca da instituição'}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full border border-gray-200"
                  style={{ backgroundColor: entidadeCorPrimaria }}
                  aria-hidden
                />
                Marca herdada da instituição
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewGroup title="Unidade">
          <ReviewRow label="Nome" value={form.name} />
          <ReviewRow label="CNES" value={form.cnes} />
          <ReviewRow label="Tipo" value={getNewUbtUnitTypeLabel(form.unitType)} />
          <ReviewRow label="Status" value={statusStyle.label} />
        </ReviewGroup>

        <ReviewGroup title="Endereço e região">
          <ReviewRow label="Endereço" value={formatNewUbtAddress(form)} />
          {isPrefeituraTipo || (regionLabel !== '—' && regionLabel !== 'Não informada') ? (
            <ReviewRow label="Região (RA)" value={regionLabel} />
          ) : null}
          <ReviewRow
            label="Telefone fixo"
            value={form.unitLandlinePhone.trim() || 'Não informado'}
          />
        </ReviewGroup>

        <ReviewGroup title="Responsável">
          <ReviewRow label="Nome" value={form.responsibleName} />
          <ReviewRow label="E-mail" value={form.responsibleEmail} />
          <ReviewRow label="CPF" value={form.responsibleCpf} />
          <ReviewRow label="Celular" value={form.responsiblePhone} />
        </ReviewGroup>

        <ReviewGroup title="Operação">
          <ReviewRow label="Terminais" value={form.stationsTotal} />
          <ReviewRow label="Limite diário" value={capacityLabel} />
          <div className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-3">
            <dt className="text-xs font-medium text-gray-500">Profissões</dt>
            <dd>
              <TagList items={professionNames} />
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-3">
            <dt className="text-xs font-medium text-gray-500">Atendimentos</dt>
            <dd>
              <TagList items={operationSummary} />
            </dd>
          </div>
        </ReviewGroup>
      </div>

      {form.notes.trim() ? (
        <section className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-4">
          <p className="text-xs font-semibold text-amber-900">Observações internas</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{form.notes}</p>
        </section>
      ) : null}

      <p className="flex items-start gap-2 rounded-xl border border-sky-200/70 bg-sky-50/60 px-3 py-2.5 text-xs leading-relaxed text-gray-700">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" strokeWidth={2} />
        <span>
          Após cadastrar, crie a credencial de{' '}
          <strong>{form.responsibleName.trim() || 'a gestora'}</strong> em{' '}
          <Link
            to="/prefeitura/credenciais"
            className="font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
          >
            Credenciais de acesso
          </Link>
          .
        </span>
      </p>
    </div>
  )
}
