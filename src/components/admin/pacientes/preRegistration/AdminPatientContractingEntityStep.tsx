import { Building2, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AdminPatientContractingEntity } from '../../../../types/adminPacientes'
import { AttendanceFieldHighlight } from '../../../dashboard/AttendanceFieldHighlight'
import { AttendanceStepFooter } from '../../../dashboard/AttendanceStepFooter'
import { AttendanceStepShell } from '../../../dashboard/AttendanceStepShell'
import { SituationStatusBadge } from '../../../ui/SituationStatusBadge'

type AdminPatientContractingEntityStepProps = {
  entities: AdminPatientContractingEntity[]
  selectedId: string
  onSelect: (entity: AdminPatientContractingEntity) => void
  onBack: () => void
  onContinue: () => void
}

const contractBadgeConfig = {
  ativo: {
    label: 'Contrato ativo',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  encerrado: {
    label: 'Contrato encerrado',
    text: 'text-gray-600',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  },
} as const

export function AdminPatientContractingEntityStep({
  entities,
  selectedId,
  onSelect,
  onBack,
  onContinue,
}: AdminPatientContractingEntityStepProps) {
  const [search, setSearch] = useState('')
  const [showHints, setShowHints] = useState(false)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return entities
    return entities.filter((entity) => {
      const haystack =
        `${entity.razaoSocial} ${entity.municipality} ${entity.uf}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [entities, search])

  const selectedEntity = entities.find((entity) => entity.id === selectedId)
  const canContinue = Boolean(selectedEntity)

  return (
    <AttendanceStepShell
      hideScrollbar
      title="Entidade contratante"
      description="Selecione a prefeitura ou entidade municipal à qual o paciente será vinculado."
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          onContinue={onContinue}
          continueReady={canContinue}
          continueLabel="Continuar"
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      <label className="relative mb-3 block shrink-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por razão social ou município..."
          className="w-full rounded-xl border border-gray-200/80 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
        />
      </label>

      <AttendanceFieldHighlight highlight={showHints && !canContinue} className="block">
        <ul className="flex flex-col gap-2 pb-1">
          {filtered.map((entity) => {
            const isSelected = entity.id === selectedId
            return (
              <li key={entity.id}>
                <button
                  type="button"
                  onClick={() => onSelect(entity)}
                  className={[
                    'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition',
                    isSelected
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/60 ring-2 ring-[var(--brand-primary)]/15'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      isSelected
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-gray-100 text-gray-500',
                    ].join(' ')}
                  >
                    <Building2 className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {entity.razaoSocial}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {entity.municipality}/{entity.uf}
                    </span>
                  </span>
                  <SituationStatusBadge
                    config={contractBadgeConfig[entity.contractStatus]}
                    widthClass="w-[8.5rem] shrink-0"
                  />
                </button>
              </li>
            )
          })}
          {filtered.length === 0 ? (
            <li className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
              Nenhuma entidade encontrada para esta busca.
            </li>
          ) : null}
        </ul>
      </AttendanceFieldHighlight>
    </AttendanceStepShell>
  )
}
