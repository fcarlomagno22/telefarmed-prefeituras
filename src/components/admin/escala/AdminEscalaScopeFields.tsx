import { Building2, Landmark, Monitor } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  getAdminEscalaPrefeituras,
  getUbtsForPrefeituraIds,
} from '../../../data/adminEscalaCatalog'
import type {
  AdminEscalaPrefeituraScope,
  AdminEscalaSelectionMode,
  AdminEscalaUbtScope,
  AdminEscalaUbtScopeMode,
} from '../../../types/adminEscala'
import {
  escalaComposeSegmentBtn,
  escalaComposeSegmentClass,
} from './adminEscalaComposePremium'

type AdminEscalaScopeFieldsProps = {
  prefeituraScope: AdminEscalaPrefeituraScope
  ubtScope: AdminEscalaUbtScope
  onPrefeituraScopeChange: (scope: AdminEscalaPrefeituraScope) => void
  onUbtScopeChange: (scope: AdminEscalaUbtScope) => void
  variant?: 'card' | 'flat' | 'premium'
}

function toggleId(ids: string[], id: string) {
  const set = new Set(ids)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  return [...set]
}

function ScopeWorkspaceColumn({
  icon: Icon,
  iconClass,
  title,
  subtitle,
  controls,
  body,
}: {
  icon: typeof Landmark
  iconClass: string
  title: string
  subtitle: string
  controls: ReactNode
  body: ReactNode
}) {
  return (
    <div className="flex min-h-[min(18rem,36vh)] min-w-0 flex-1 flex-col border-b border-gray-200/80 last:border-b-0 lg:min-h-[min(20rem,40vh)] lg:border-b-0 lg:border-r lg:last:border-r-0">
      <div className="shrink-0 border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={[
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                iconClass,
              ].join(' ')}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-gray-900">{title}</h4>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{subtitle}</p>
            </div>
          </div>
        </div>
        <div className="mt-4">{controls}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/90 to-white px-5 py-4 sm:px-6 sm:py-5">
        {body}
      </div>
    </div>
  )
}

function SummaryHero({
  value,
  label,
  detail,
}: {
  value: string
  label: string
  detail?: string
}) {
  return (
    <div className="flex h-full min-h-[12rem] flex-col items-center justify-center rounded-2xl bg-white px-6 py-8 text-center ring-1 ring-gray-200/70">
      <p className="text-4xl font-bold tabular-nums tracking-tight text-gray-900">{value}</p>
      <p className="mt-1 text-sm font-semibold text-gray-700">{label}</p>
      {detail ? <p className="mt-2 max-w-xs text-xs text-gray-500">{detail}</p> : null}
    </div>
  )
}

export function AdminEscalaScopeFields({
  prefeituraScope,
  ubtScope,
  onPrefeituraScopeChange,
  onUbtScopeChange,
  variant = 'card',
}: AdminEscalaScopeFieldsProps) {
  const scopedPrefeituraIds =
    prefeituraScope.mode === 'all'
      ? getAdminEscalaPrefeituras().map((p) => p.id)
      : prefeituraScope.prefeituraIds

  const availableUbts = getUbtsForPrefeituraIds(scopedPrefeituraIds)
  const isPremium = variant === 'premium'

  const selectedPrefeituras =
    prefeituraScope.mode === 'all'
      ? getAdminEscalaPrefeituras()
      : getAdminEscalaPrefeituras().filter((p) => prefeituraScope.prefeituraIds.includes(p.id))

  function setPrefeituraMode(mode: AdminEscalaSelectionMode) {
    onPrefeituraScopeChange({
      mode,
      prefeituraIds: mode === 'all' ? [] : prefeituraScope.prefeituraIds,
    })
    if (mode === 'all') return
    const allowed = new Set(getUbtsForPrefeituraIds(prefeituraScope.prefeituraIds).map((u) => u.id))
    if (ubtScope.mode === 'selected') {
      onUbtScopeChange({
        ...ubtScope,
        ubtIds: ubtScope.ubtIds.filter((id) => allowed.has(id)),
      })
    }
  }

  function togglePrefeitura(id: string) {
    const prefeituraIds = toggleId(prefeituraScope.prefeituraIds, id)
    onPrefeituraScopeChange({ mode: 'selected', prefeituraIds })
    const allowed = new Set(getUbtsForPrefeituraIds(prefeituraIds).map((u) => u.id))
    if (ubtScope.mode === 'selected') {
      onUbtScopeChange({
        ...ubtScope,
        ubtIds: ubtScope.ubtIds.filter((ubtId) => allowed.has(ubtId)),
      })
    }
  }

  function setUbtMode(mode: AdminEscalaUbtScopeMode) {
    onUbtScopeChange({
      mode,
      ubtIds: mode === 'selected' ? ubtScope.ubtIds : [],
    })
  }

  const listClass =
    'space-y-0.5 rounded-xl bg-white p-2 ring-1 ring-gray-200/70'

  const prefeituraControls = (
    <div className={escalaComposeSegmentClass}>
      <button
        type="button"
        onClick={() => setPrefeituraMode('selected')}
        className={escalaComposeSegmentBtn(true)}
      >
        Escolher prefeitura(s)
      </button>
    </div>
  )

  const ubtControls = (
    <div className={`${escalaComposeSegmentClass} flex flex-wrap`}>
      {(
        [
          { value: 'all' as const, label: 'Todas UBTs' },
          { value: 'selected' as const, label: 'Escolher' },
          { value: 'tele_only' as const, label: 'Só tele' },
        ] as const
      ).map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setUbtMode(opt.value)}
          className={escalaComposeSegmentBtn(ubtScope.mode === opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )

  const prefeituraBody = (
    <div className={listClass}>
      {getAdminEscalaPrefeituras().map((p) => (
        <label
          key={p.id}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-gray-50"
        >
          <input
            type="checkbox"
            checked={prefeituraScope.prefeituraIds.includes(p.id)}
            onChange={() => togglePrefeitura(p.id)}
            className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
          />
          <span className="text-sm font-medium text-gray-800">
            {p.name}
            <span className="ml-1.5 text-gray-400">· {p.uf}</span>
          </span>
        </label>
      ))}
    </div>
  )

  const ubtBody =
    ubtScope.mode === 'selected' ? (
      <div className={listClass}>
        {availableUbts.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-gray-500">
            Selecione ao menos uma prefeitura com UBTs cadastradas.
          </p>
        ) : (
          availableUbts.map((u) => (
            <label
              key={u.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={ubtScope.ubtIds.includes(u.id)}
                onChange={() =>
                  onUbtScopeChange({
                    mode: 'selected',
                    ubtIds: toggleId(ubtScope.ubtIds, u.id),
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
              />
              <span className="text-sm font-medium text-gray-800">
                {u.name}
                <span className="text-gray-400"> · {u.municipalityName}</span>
              </span>
            </label>
          ))
        )}
      </div>
    ) : ubtScope.mode === 'tele_only' ? (
      <div className="flex h-full min-h-[12rem] flex-col items-center justify-center rounded-2xl bg-white px-6 py-8 text-center ring-1 ring-gray-200/70">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <Monitor className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <p className="text-sm font-bold text-gray-900">Somente telemedicina</p>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-gray-500">
          Plantões sem vínculo com UBT presencial — atendimento 100% remoto na plataforma.
        </p>
      </div>
    ) : (
      <div className="space-y-4">
        <SummaryHero
          value={String(availableUbts.length)}
          label={
            availableUbts.length === 1
              ? 'UBT na cobertura selecionada'
              : 'UBTs na cobertura selecionada'
          }
          detail={
            prefeituraScope.mode === 'all'
              ? 'Todas as unidades das prefeituras da rede.'
              : `Unidades em ${selectedPrefeituras.map((p) => p.name).join(', ') || '—'}.`
          }
        />
        {availableUbts.length > 0 ? (
          <ul className="max-h-[min(14rem,28vh)] space-y-1.5 overflow-y-auto pr-1">
            {availableUbts.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-gray-200/60"
              >
                <Building2 className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                <span className="min-w-0 font-medium text-gray-800">{u.name}</span>
                <span className="truncate text-xs text-gray-400">{u.municipalityName}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-sm text-gray-500">Nenhuma UBT para a seleção atual.</p>
        )}
      </div>
    )

  if (isPremium) {
    return (
      <div className="flex w-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200/80 shadow-[0_8px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col lg:flex-row">
          <ScopeWorkspaceColumn
            icon={Landmark}
            iconClass="bg-violet-100 text-violet-700"
            title="Prefeituras"
            subtitle="Marque cada município onde a escala será publicada (obrigatório)"
            controls={prefeituraControls}
            body={prefeituraBody}
          />
          <ScopeWorkspaceColumn
            icon={Building2}
            iconClass="bg-sky-100 text-sky-700"
            title="Unidades UBT"
            subtitle="Onde o atendimento presencial ou híbrido pode ocorrer"
            controls={ubtControls}
            body={ubtBody}
          />
        </div>
      </div>
    )
  }

  // Legacy variants
  const prefeituraBlock = (
    <>
      {prefeituraControls}
      <div className="mt-3">{prefeituraBody}</div>
    </>
  )
  const ubtBlock = (
    <>
      {ubtControls}
      <div className="mt-3">{ubtBody}</div>
    </>
  )

  if (variant === 'card') {
    return (
      <div className="grid gap-4 rounded-xl border border-gray-200 bg-slate-50/60 p-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Landmark className="h-4 w-4 text-violet-600" strokeWidth={2} />
            Prefeitura(s)
          </div>
          {prefeituraBlock}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Building2 className="h-4 w-4 text-sky-600" strokeWidth={2} />
            UBT(s)
          </div>
          {ubtBlock}
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Landmark className="h-4 w-4 text-violet-600" strokeWidth={2} />
          Prefeitura(s)
        </div>
        {prefeituraBlock}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Building2 className="h-4 w-4 text-sky-600" strokeWidth={2} />
          UBT(s)
        </div>
        {ubtBlock}
      </div>
    </div>
  )
}
