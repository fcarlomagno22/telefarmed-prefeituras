import {
  Building2,
  Gauge,
  MapPin,
  Monitor,
  Stethoscope,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import {
  formatPrefeituraRedeUnitLocation,
  type PrefeituraRedeUnitCadastral,
} from '../../../data/prefeituraRedeUnitDetail'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { prefeituraRedeStatusBadgeConfig } from './prefeituraRedeStatusBadge'

type PrefeituraRedeUnitCadastralSectionsProps = {
  cadastral: PrefeituraRedeUnitCadastral
}

function CadastralSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <article className="rounded-2xl border border-gray-200/90 bg-white shadow-sm">
      <header className="flex items-start gap-3 border-b border-gray-100 bg-gradient-to-r from-slate-50/90 to-white px-4 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {description ? <p className="mt-0.5 text-xs text-gray-500">{description}</p> : null}
        </div>
      </header>
      <div className="p-4">{children}</div>
    </article>
  )
}

function CadastralField({
  label,
  value,
  className = '',
  hint,
}: {
  label: string
  value: string
  className?: string
  hint?: string
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{value || '—'}</p>
      {hint ? <p className="mt-0.5 text-xs text-gray-500">{hint}</p> : null}
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

export function PrefeituraRedeUnitCadastralSections({
  cadastral,
}: PrefeituraRedeUnitCadastralSectionsProps) {
  const { unit } = cadastral
  const location = formatPrefeituraRedeUnitLocation(cadastral)
  const statusConfig = prefeituraRedeStatusBadgeConfig[unit.status]
  const stationsOffline = Math.max(0, unit.stationsTotal - unit.stationsOnline)
  const locationHint = [location.locality, location.meta].filter(Boolean).join(' · ')

  return (
    <div className="mb-6 space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <CadastralSection icon={Building2} title="Unidade" description="Identificação e situação cadastral">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
            <CadastralField label="Nome" value={unit.name} />
            <CadastralField
              label="Identificação"
              value={`CNES ${unit.cnes} · ${cadastral.unitType}`}
              hint={unit.region}
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Situação</p>
              <div className="mt-1.5">
                <SituationStatusBadge config={statusConfig} widthClass="w-[7.5rem]" />
              </div>
            </div>
          </div>
        </CadastralSection>

        <CadastralSection icon={MapPin} title="Localização" description="Endereço e contato da unidade">
          <CadastralField
            label="Endereço"
            value={location.primary}
            hint={locationHint || undefined}
          />
        </CadastralSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CadastralSection
          icon={UserRound}
          title="Responsável"
          description="Titular da unidade e credenciais de acesso"
        >
          <div className="space-y-3">
            <CadastralField label="Nome" value={unit.responsibleName} />
            <CadastralField
              label="Contato"
              value={cadastral.responsibleEmail}
              hint={`${cadastral.responsibleCpf} · ${unit.responsiblePhone}`}
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Credenciais de acesso
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <CredentialBadge
                  defined={cadastral.credentialsConfigured}
                  label="Senha de acesso definida"
                />
                <CredentialBadge
                  defined={cadastral.credentialsConfigured}
                  label="PIN de autorização definido"
                />
              </div>
            </div>
          </div>
        </CadastralSection>

        <CadastralSection
          icon={Monitor}
          title="Operação"
          description="Terminais, capacidade e especialidades habilitadas"
        >
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-gray-100 bg-slate-50/90 px-3 py-2.5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Terminais
              </p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-gray-900">
                {unit.stationsOnline}/{unit.stationsTotal}
              </p>
              <p className="text-[10px] text-gray-500">online / total</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-slate-50/90 px-3 py-2.5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Fora de linha
              </p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-gray-900">{stationsOffline}</p>
            </div>
          </div>
          <CadastralField label="Capacidade diária" value={cadastral.dailyCapacityLabel} />
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Especialidades ({cadastral.specialtyNames.length})
            </p>
            {cadastral.specialtyNames.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {cadastral.specialtyNames.map((name) => (
                  <li
                    key={name}
                    className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-100"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Nenhuma especialidade cadastrada.</p>
            )}
          </div>
        </CadastralSection>
      </div>

      <CadastralSection
        icon={Users}
        title="Operadoras"
        description="Equipe cadastrada pela responsável para operar os terminais"
      >
        {cadastral.operators.length > 0 ? (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
            {cadastral.operators.map((operator) => (
              <li
                key={operator.id}
                className="flex items-center justify-between gap-3 px-3 py-3 first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">{operator.name}</p>
                  <p className="text-xs text-gray-500">{operator.role}</p>
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                  Operadora
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            Nenhuma operadora vinculada a esta unidade no cadastro da rede.
          </p>
        )}
      </CadastralSection>

      {cadastral.notes ? (
        <CadastralSection icon={Stethoscope} title="Observações" description="Anotações do cadastro">
          <p className="text-sm leading-relaxed text-gray-700">{cadastral.notes}</p>
        </CadastralSection>
      ) : null}

      <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-slate-50/60 px-4 py-3">
        <Gauge className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
        <p className="text-xs font-semibold text-gray-600">
          Métricas operacionais do dia (abaixo) · fila, consultas e desempenho em tempo real simulado
        </p>
      </div>
    </div>
  )
}
