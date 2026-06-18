import { Loader2, Stethoscope } from 'lucide-react'
import type { ConfigProfession, ConfigSpecialty } from '../../../../types/adminConfiguracoes'
import type { NewUbtFormState } from './newUbtFormTypes'
import {
  getVisibleSpecialtiesForUbtForm,
  groupSpecialtiesBySelectedProfessions,
  sortCatalogByName,
} from './newUbtCatalogUtils'

type PrefeituraNewUbtProfessionsSpecialtiesPanelProps = {
  form: NewUbtFormState
  professions: ConfigProfession[]
  specialties: ConfigSpecialty[]
  isLoading: boolean
  error: string | null
  onToggleProfession: (professionId: string) => void
  onToggleSpecialty: (specialtyId: string) => void
  onSelectAllSpecialties: () => void
  onClearSpecialties: () => void
}

export function PrefeituraNewUbtProfessionsSpecialtiesPanel({
  form,
  professions,
  specialties,
  isLoading,
  error,
  onToggleProfession,
  onToggleSpecialty,
  onSelectAllSpecialties,
  onClearSpecialties,
}: PrefeituraNewUbtProfessionsSpecialtiesPanelProps) {
  const sortedProfessions = sortCatalogByName(professions)
  const visibleSpecialties = getVisibleSpecialtiesForUbtForm(specialties, form.professionIds)
  const groupedSpecialties = groupSpecialtiesBySelectedProfessions(
    specialties,
    form.professionIds,
    sortedProfessions,
  )
  const professionsWithoutSpecialties = groupedSpecialties.filter(
    (group) => group.specialties.length === 0,
  )

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 sm:px-4">
        <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Stethoscope className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
          Profissões e especialidades
        </p>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
          {form.professionIds.size} profissão{form.professionIds.size === 1 ? '' : 'ões'} ·{' '}
          {form.specialtyIds.size} especialidade{form.specialtyIds.size === 1 ? '' : 's'}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        {isLoading ? (
          <p className="flex items-center gap-2 py-8 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-primary)]" />
            Carregando profissões e especialidades contratadas...
          </p>
        ) : error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : (
          <div className="space-y-4">
            <section>
              <p className="text-sm font-semibold text-gray-900">1. Profissões atendidas</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Selecione as profissões contratadas que esta UBT poderá atender.
              </p>
              {sortedProfessions.length === 0 ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Nenhuma profissão contratada nos contratos ativos da entidade.
                </p>
              ) : (
                <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                  {sortedProfessions.map((profession) => {
                    const checked = form.professionIds.has(profession.id)
                    return (
                      <li key={profession.id}>
                        <label
                          className={[
                            'flex h-full cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 transition',
                            checked
                              ? 'border-[var(--brand-primary)]/30 bg-[var(--brand-primary-muted)]/50'
                              : 'border-gray-200 bg-slate-50/60 hover:bg-white',
                          ].join(' ')}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleProfession(profession.id)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-gray-800">
                              {profession.name}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-gray-500">
                              {profession.councilAcronym}
                            </span>
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="border-t border-gray-100 pt-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">2. Especialidades</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    Marque as especialidades contratadas habilitadas nesta UBT.
                  </p>
                </div>
                {visibleSpecialties.length > 0 ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={onSelectAllSpecialties}
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Marcar todas
                    </button>
                    <button
                      type="button"
                      onClick={onClearSpecialties}
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Limpar especialidades
                    </button>
                  </div>
                ) : null}
              </div>

              {form.professionIds.size === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-gray-300 bg-slate-50 px-3 py-6 text-center text-sm text-gray-500">
                  Selecione ao menos uma profissão acima.
                </p>
              ) : groupedSpecialties.length === 0 ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Nenhuma especialidade contratada vinculada às profissões selecionadas.
                </p>
              ) : (
                <div className="mt-3 space-y-4">
                  {groupedSpecialties.map(({ profession, specialties: groupSpecialties }) =>
                    groupSpecialties.length === 0 ? null : (
                      <div
                        key={profession.id}
                        className="rounded-xl border border-gray-100 bg-slate-50/40 p-3"
                      >
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                          {profession.name}
                        </p>
                        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                          {sortCatalogByName(groupSpecialties).map((specialty) => {
                            const checked = form.specialtyIds.has(specialty.id)
                            return (
                              <li key={specialty.id}>
                                <label
                                  className={[
                                    'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition',
                                    checked
                                      ? 'border-[var(--brand-primary)]/25 bg-[var(--brand-primary-muted)]/40'
                                      : 'border-gray-200 bg-white hover:border-[var(--brand-primary)]/20',
                                  ].join(' ')}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => onToggleSpecialty(specialty.id)}
                                    className="h-4 w-4 shrink-0 rounded border-gray-300 text-[var(--brand-primary)]"
                                  />
                                  <span className="min-w-0 font-medium leading-snug text-gray-800">
                                    {specialty.name}
                                  </span>
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ),
                  )}

                  {professionsWithoutSpecialties.length > 0 ? (
                    <p className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs leading-relaxed text-emerald-900">
                      {professionsWithoutSpecialties.map((group) => group.profession.name).join(', ')}{' '}
                      {professionsWithoutSpecialties.length === 1 ? 'não possui' : 'não possuem'}{' '}
                      especialidades no catálogo — basta manter a profissão selecionada.
                    </p>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </section>
  )
}
