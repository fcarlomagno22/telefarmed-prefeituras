import type { ReactNode } from 'react'
import type { ClienteSpecialtyOption } from '../../../hooks/useAdminClientesClinicoCatalog'
import {
  isMedicoProfession,
} from '../../../config/adminContratoOrigemAtendimento'
import type { ContratoOrigemAtendimento } from '../../../config/adminContratoOrigemAtendimento'
import { ContratoOrigemAtendimentoToggle } from './ContratoOrigemAtendimentoToggle'
import {
  filterSpecialtiesByProfessions,
  sortClienteCatalogItems,
  areAllSpecialtiesSelected,
  type ClienteProfessionOption,
} from './adminClienteContratoCatalogUtils'
import {
  groupSpecialtiesBySelectedProfessions,
  hasPositiveCurrency,
  resolvePrimaryProfessionIdForSpecialty,
  specialtyUsesProfessionConsultaDefault,
} from './adminClienteContratoPricing'

const priceInputDisabledClass =
  'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 placeholder:text-gray-300'

type AdminClienteContratoEspecialidadesPanelProps = {
  professions: ClienteProfessionOption[]
  specialties: ClienteSpecialtyOption[]
  professionIds: Set<string>
  specialtyIds: Set<string>
  precosProfissao: Record<string, string>
  precosEspecialidade: Record<string, string>
  origemAtendimentoProfissao: Record<string, ContratoOrigemAtendimento>
  origemAtendimentoEspecialidade: Record<string, ContratoOrigemAtendimento>
  onToggleProfession: (professionId: string) => void
  onToggleSpecialty: (specialtyId: string) => void
  onToggleAllSpecialtiesForProfession?: (
    professionId: string,
    specialtyIds: string[],
    selectAll: boolean,
  ) => void
  onPrecoProfissaoChange: (professionId: string, value: string) => void
  onPrecoChange: (specialtyId: string, value: string) => void
  onOrigemProfissaoChange: (professionId: string, origem: ContratoOrigemAtendimento) => void
  onOrigemEspecialidadeChange: (specialtyId: string, origem: ContratoOrigemAtendimento) => void
  inputClass: string
  labelClass: string
  batchControls?: ReactNode
  listClassName?: string
  specialtyPriceLabel?: string
  specialtyPriceHint?: string
}

export function AdminClienteContratoEspecialidadesPanel({
  professions,
  specialties,
  professionIds,
  specialtyIds,
  precosProfissao,
  precosEspecialidade,
  origemAtendimentoProfissao,
  origemAtendimentoEspecialidade,
  onToggleProfession,
  onToggleSpecialty,
  onToggleAllSpecialtiesForProfession,
  onPrecoProfissaoChange,
  onPrecoChange,
  onOrigemProfissaoChange,
  onOrigemEspecialidadeChange,
  inputClass,
  labelClass,
  batchControls,
  listClassName = 'grid gap-2 sm:grid-cols-2',
  specialtyPriceLabel = 'Valor por consulta',
  specialtyPriceHint = 'Opcional — se vazio, usa o valor padrão da profissão.',
}: AdminClienteContratoEspecialidadesPanelProps) {
  const sortedProfessions = sortClienteCatalogItems(professions)
  const groupedSpecialties = groupSpecialtiesBySelectedProfessions(
    specialties,
    professionIds,
    sortedProfessions,
  )

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-900">1. Profissões e valores padrão</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          Selecione as profissões autorizadas e informe o valor padrão de consulta de cada uma.
          Especialidades podem ter valor próprio na etapa seguinte. Use MP (próprios) ou MT
          (terceirizados) conforme a origem do atendimento.
        </p>
        {sortedProfessions.length === 0 ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Nenhuma profissão ativa no catálogo clínico.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-4 gap-2">
            {sortedProfessions.map((profession) => {
              const checked = professionIds.has(profession.id)
              const preco = precosProfissao[profession.id] ?? ''
              const showOrigemToggle = checked && !isMedicoProfession(profession)
              return (
                <li key={profession.id}>
                  <div
                    className={[
                      'rounded-lg border px-3 py-2.5 transition',
                      checked
                        ? 'border-[var(--brand-primary)]/30 bg-orange-50/50'
                        : 'border-gray-200 bg-slate-50/60',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleProfession(profession.id)}
                          className="mt-0.5"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-gray-800">
                            {profession.name}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-gray-500">
                            Conselho: {profession.councilAcronym}
                          </span>
                        </span>
                      </label>
                      {showOrigemToggle ? (
                        <ContratoOrigemAtendimentoToggle
                          value={origemAtendimentoProfissao[profession.id] ?? 'mp'}
                          onChange={(origem) => onOrigemProfissaoChange(profession.id, origem)}
                        />
                      ) : null}
                    </div>
                    <label className="mt-2 block">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Valor padrão
                      </span>
                      <input
                        className={[
                          inputClass,
                          'mt-1',
                          !checked ? priceInputDisabledClass : '',
                        ].join(' ')}
                        disabled={!checked}
                        value={preco}
                        onChange={(e) => onPrecoProfissaoChange(profession.id, e.target.value)}
                        placeholder={checked ? 'R$ 0,00' : 'Selecione a profissão'}
                        inputMode="numeric"
                      />
                    </label>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-2 text-xs text-gray-500">
          {professionIds.size} de {sortedProfessions.length} profissão(ões) selecionada(s)
        </p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-900">2. Especialidades e valores</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          Marque as especialidades autorizadas. Deixe o valor em branco para herdar o padrão da
          profissão ou informe um valor específico.
        </p>

        {professionIds.size === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-gray-300 bg-slate-50 px-3 py-6 text-center text-sm text-gray-500">
            Selecione ao menos uma profissão acima para listar as especialidades.
          </p>
        ) : (
          <>
            {batchControls ? <div className="mt-3">{batchControls}</div> : null}
            {groupedSpecialties.length === 0 ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Nenhuma especialidade vinculada às profissões selecionadas.
              </p>
            ) : (
              <div className="mt-3 space-y-4">
                <p className="text-xs font-medium text-gray-500">
                  {specialtyIds.size} especialidade(s) selecionada(s)
                </p>
                {groupedSpecialties.map(({ profession, specialties: groupSpecialties }) => {
                  const groupSpecialtyIds = groupSpecialties.map((item) => item.id)
                  const allGroupSelected = areAllSpecialtiesSelected(specialtyIds, groupSpecialtyIds)
                  const someGroupSelected = groupSpecialtyIds.some((id) => specialtyIds.has(id))
                  const isMedicoGroup = isMedicoProfession(profession)

                  return (
                  <div key={profession.id} className="rounded-lg border border-gray-100 bg-slate-50/40 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                        {profession.name}
                      </p>
                      {onToggleAllSpecialtiesForProfession ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={allGroupSelected}
                            onClick={() =>
                              onToggleAllSpecialtiesForProfession(
                                profession.id,
                                groupSpecialtyIds,
                                true,
                              )
                            }
                            className="text-xs font-semibold text-[var(--brand-primary)] transition enabled:hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
                          >
                            Marcar todas
                          </button>
                          <span className="text-xs text-gray-300" aria-hidden>
                            |
                          </span>
                          <button
                            type="button"
                            disabled={!someGroupSelected}
                            onClick={() =>
                              onToggleAllSpecialtiesForProfession(
                                profession.id,
                                groupSpecialtyIds,
                                false,
                              )
                            }
                            className="text-xs font-semibold text-gray-600 transition enabled:hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
                          >
                            Desmarcar todas
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <ul className={`mt-2 ${listClassName}`}>
                      {groupSpecialties.map((specialty) => {
                        const checked = specialtyIds.has(specialty.id)
                        const preco = precosEspecialidade[specialty.id] ?? ''
                        const professionId = resolvePrimaryProfessionIdForSpecialty(
                          specialty,
                          professionIds,
                        )
                        const professionDefault = professionId
                          ? precosProfissao[professionId] ?? ''
                          : ''
                        const usesDefault =
                          checked && specialtyUsesProfessionConsultaDefault(
                            {
                              professionIds,
                              specialtyIds,
                              precosProfissao,
                              precosEspecialidade,
                              excedentePrecosProfissao: {},
                              excedentePrecosEspecialidade: {},
                            },
                            specialty,
                          )

                        return (
                          <li
                            key={specialty.id}
                            className={[
                              'rounded-lg border px-3 py-2 transition',
                              checked
                                ? 'border-[var(--brand-primary)]/25 bg-orange-50/40'
                                : 'border-gray-200 bg-white',
                            ].join(' ')}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <label className="flex min-w-0 flex-1 items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => onToggleSpecialty(specialty.id)}
                                />
                                <span className="text-sm font-medium text-gray-800">
                                  {specialty.name}
                                </span>
                              </label>
                              {checked && isMedicoGroup ? (
                                <ContratoOrigemAtendimentoToggle
                                  value={origemAtendimentoEspecialidade[specialty.id] ?? 'mp'}
                                  onChange={(origem) =>
                                    onOrigemEspecialidadeChange(specialty.id, origem)
                                  }
                                />
                              ) : null}
                            </div>
                            <label className="mt-2 block">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                {specialtyPriceLabel}
                              </span>
                              <input
                                className={[
                                  inputClass,
                                  'mt-1',
                                  !checked ? priceInputDisabledClass : '',
                                ].join(' ')}
                                disabled={!checked}
                                value={preco}
                                onChange={(e) => onPrecoChange(specialty.id, e.target.value)}
                                placeholder={
                                  checked
                                    ? hasPositiveCurrency(professionDefault)
                                      ? `Padrão: ${professionDefault}`
                                      : 'R$ 0,00'
                                    : 'Marque a especialidade'
                                }
                                inputMode="numeric"
                              />
                              {checked ? (
                                <span className="mt-1 block text-[11px] text-gray-500">
                                  {usesDefault
                                    ? 'Usando valor padrão da profissão.'
                                    : specialtyPriceHint}
                                </span>
                              ) : null}
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export function getVisibleSpecialtiesForContratoForm(
  specialties: ClienteSpecialtyOption[],
  professionIds: Set<string>,
) {
  return sortClienteCatalogItems(filterSpecialtiesByProfessions(specialties, professionIds))
}
