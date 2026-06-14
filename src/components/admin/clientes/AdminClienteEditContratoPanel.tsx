import { useEffect, useMemo, useState } from 'react'
import type { AdminClienteContrato, AdminClienteRow } from '../../../types/adminClientes'
import type { ClienteSpecialtyOption } from '../../../hooks/useAdminClientesClinicoCatalog'
import {
  getClienteContratoTipoOption,
  useAdminClientesContratoCatalog,
} from '../../../hooks/useAdminClientesContratoCatalog'
import { maskBirthDate, maskCurrencyBrl, maskIntegerPtBr } from '../../../utils/masks'
import { CustomSelect } from '../../ui/CustomSelect'
import {
  AdminClienteContratoEspecialidadesPanel,
} from './AdminClienteContratoEspecialidadesPanel'
import {
  setSpecialtiesSelectionForProfession,
  toggleProfessionInContratoForm,
  type ClienteProfessionOption,
} from './adminClienteContratoCatalogUtils'
import {
  groupSpecialtiesBySelectedProfessions,
  resolvePrimaryProfessionIdForSpecialty,
} from './adminClienteContratoPricing'
import type { AddContratoFormState } from './adminClienteContratoForm'
import {
  buildAddContratoFormFromContrato,
  isPacoteOuMensalContrato,
  validateEditContratoStep,
} from './adminClienteContratoForm'
import { AdminClienteContratoPacientesTerritorioField } from './AdminClienteContratoPacientesTerritorioField'

const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600'
const inputClass =
  'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/45 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.14)]'

type AdminClienteEditContratoPanelProps = {
  cliente: AdminClienteRow
  contrato: AdminClienteContrato
  professions: ClienteProfessionOption[]
  specialties: ClienteSpecialtyOption[]
  onCancel: () => void
  onSubmit: (form: AddContratoFormState) => void
}

export function AdminClienteEditContratoPanel({
  cliente,
  contrato,
  professions,
  specialties,
  onCancel,
  onSubmit,
}: AdminClienteEditContratoPanelProps) {
  const { contractTypes, isLoading: isLoadingContratoCatalog, error: contratoCatalogError } =
    useAdminClientesContratoCatalog()
  const sortedSpecialties = useMemo(
    () => [...specialties].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [specialties],
  )
  const initialModalidade =
    contrato.modalidade ??
    getClienteContratoTipoOption(contractTypes, contrato.tipo)?.modalidade ??
    'pacote_fechado'

  const [form, setForm] = useState<AddContratoFormState>(() =>
    buildAddContratoFormFromContrato(contrato, initialModalidade),
  )
  const [stepError, setStepError] = useState<string | null>(null)

  const contratoTipoOptions = useMemo(
    () => contractTypes.map((item) => ({ value: item.id, label: item.label })),
    [contractTypes],
  )
  const pacoteOuMensal = isPacoteOuMensalContrato(form.tipoModalidade)
  const groupedExcedenteSpecialties = useMemo(
    () => groupSpecialtiesBySelectedProfessions(sortedSpecialties, form.professionIds, professions),
    [sortedSpecialties, form.professionIds, professions],
  )

  useEffect(() => {
    setForm(buildAddContratoFormFromContrato(contrato, initialModalidade))
    setStepError(null)
  }, [contrato.id, initialModalidade])

  function updateForm(patch: Partial<AddContratoFormState>) {
    setStepError(null)
    setForm((current) => ({ ...current, ...patch }))
  }

  function handleSubmit() {
    const steps: Array<'contrato' | 'especialidades' | 'excedente'> = [
      'contrato',
      'especialidades',
      'excedente',
    ]
    for (const step of steps) {
      const error = validateEditContratoStep(step, form, { pacoteOuMensal })
      if (error) {
        setStepError(error)
        return
      }
    }
    onSubmit(form)
  }

  return (
    <div className="space-y-4">
      {stepError ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {stepError}
        </p>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Dados comerciais</h3>
        {contratoCatalogError ? (
          <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {contratoCatalogError}
          </p>
        ) : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label>
            <span className={labelClass}>Numero do contrato</span>
            <input
              className={inputClass}
              value={form.numeroContrato}
              onChange={(e) => updateForm({ numeroContrato: e.target.value })}
            />
          </label>
          <label>
            <span className={labelClass}>Tipo de contrato</span>
            <CustomSelect
              value={form.tipo}
              onChange={(value) => {
                const selected = getClienteContratoTipoOption(contractTypes, value)
                updateForm({
                  tipo: value,
                  tipoModalidade: selected?.modalidade ?? form.tipoModalidade,
                })
              }}
              options={
                contratoTipoOptions.length
                  ? contratoTipoOptions
                  : [{ value: form.tipo, label: isLoadingContratoCatalog ? 'Carregando...' : form.tipo }]
              }
              size="compact"
              className="w-full"
            />
          </label>
          <label>
            <span className={labelClass}>Inicio da vigencia</span>
            <input
              className={inputClass}
              value={form.vigenciaInicio}
              onChange={(e) => updateForm({ vigenciaInicio: maskBirthDate(e.target.value) })}
              placeholder="dd/mm/aaaa"
            />
          </label>
          <label>
            <span className={labelClass}>Fim da vigencia</span>
            <input
              className={inputClass}
              value={form.vigenciaFim}
              onChange={(e) => updateForm({ vigenciaFim: maskBirthDate(e.target.value) })}
              placeholder="dd/mm/aaaa"
            />
          </label>
          {pacoteOuMensal ? (
            <label>
              <span className={labelClass}>Consultas contratadas</span>
              <input
                className={inputClass}
                value={form.consultasContratadas}
                onChange={(e) =>
                  updateForm({ consultasContratadas: maskIntegerPtBr(e.target.value) })
                }
                placeholder="Ex.: 5.000"
                inputMode="numeric"
              />
            </label>
          ) : null}
        </div>
      </section>

      <AdminClienteContratoPacientesTerritorioField
        checked={form.aceitaPacientesOutrosMunicipios}
        onChange={(checked) => updateForm({ aceitaPacientesOutrosMunicipios: checked })}
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <AdminClienteContratoEspecialidadesPanel
          professions={professions}
          specialties={sortedSpecialties}
          professionIds={form.professionIds}
          specialtyIds={form.specialtyIds}
          precosProfissao={form.precosProfissao}
          precosEspecialidade={form.precosEspecialidade}
          onToggleProfession={(professionId) =>
            setForm((current) => toggleProfessionInContratoForm(current, professionId, sortedSpecialties))
          }
          onToggleSpecialty={(id) =>
            setForm((current) => {
              const next = new Set(current.specialtyIds)
              const precosEspecialidade = { ...current.precosEspecialidade }
              const excedentePrecosEspecialidade = { ...current.excedentePrecosEspecialidade }
              if (next.has(id)) {
                next.delete(id)
                delete precosEspecialidade[id]
                delete excedentePrecosEspecialidade[id]
              } else {
                next.add(id)
              }
              return { ...current, specialtyIds: next, precosEspecialidade, excedentePrecosEspecialidade }
            })
          }
          onToggleAllSpecialtiesForProfession={(_professionId, specialtyIds, selectAll) =>
            setForm((current) => setSpecialtiesSelectionForProfession(current, specialtyIds, selectAll))
          }
          onPrecoProfissaoChange={(professionId, value) =>
            setForm((current) => ({
              ...current,
              precosProfissao: { ...current.precosProfissao, [professionId]: maskCurrencyBrl(value) },
            }))
          }
          onPrecoChange={(specialtyId, value) =>
            setForm((current) => ({
              ...current,
              precosEspecialidade: {
                ...current.precosEspecialidade,
                [specialtyId]: maskCurrencyBrl(value),
              },
            }))
          }
          inputClass={inputClass}
          labelClass={labelClass}
        />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Ultrapassagem</h3>
        {!pacoteOuMensal ? (
          <p className="mt-3 rounded-lg border border-gray-200 bg-slate-50 px-3 py-3 text-sm text-gray-600">
            Ultrapassagem se aplica apenas para contratos mensais ou pacote.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <input
                type="checkbox"
                checked={form.permiteUltrapassar}
                onChange={(e) => updateForm({ permiteUltrapassar: e.target.checked })}
              />
              <span className="text-sm font-medium text-gray-800">Permitir ultrapassagem</span>
            </label>
            {form.permiteUltrapassar ? (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Excedente padrão por profissão
                  </p>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {professions
                      .filter((item) => form.professionIds.has(item.id))
                      .map((profession) => (
                        <li key={profession.id}>
                          <label className="block rounded-lg border border-gray-200 px-3 py-2">
                            <span className="block text-sm font-medium text-gray-800">{profession.name}</span>
                            <span className={labelClass}>Valor padrão</span>
                            <input
                              className={`${inputClass} mt-1`}
                              value={form.excedentePrecosProfissao[profession.id] ?? ''}
                              onChange={(e) =>
                                setForm((current) => ({
                                  ...current,
                                  excedentePrecosProfissao: {
                                    ...current.excedentePrecosProfissao,
                                    [profession.id]: maskCurrencyBrl(e.target.value),
                                  },
                                }))
                              }
                              placeholder="R$ 0,00"
                            />
                          </label>
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  {groupedExcedenteSpecialties.map(({ profession, specialties: groupSpecialties }) => (
                    <div key={profession.id}>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                        {profession.name}
                      </p>
                      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                        {groupSpecialties
                          .filter((specialty) => form.specialtyIds.has(specialty.id))
                          .map((specialty) => {
                            const professionId = resolvePrimaryProfessionIdForSpecialty(
                              specialty,
                              form.professionIds,
                            )
                            const professionDefault = professionId
                              ? form.excedentePrecosProfissao[professionId] ?? ''
                              : ''
                            return (
                              <li key={specialty.id} className="rounded-lg border border-gray-200 px-3 py-2">
                                <p className="text-sm font-medium text-gray-800">{specialty.name}</p>
                                <label className="mt-2 block">
                                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                    Valor excedente
                                  </span>
                                  <input
                                    className={`${inputClass} mt-1`}
                                    value={form.excedentePrecosEspecialidade[specialty.id] ?? ''}
                                    onChange={(e) =>
                                      setForm((current) => ({
                                        ...current,
                                        excedentePrecosEspecialidade: {
                                          ...current.excedentePrecosEspecialidade,
                                          [specialty.id]: maskCurrencyBrl(e.target.value),
                                        },
                                      }))
                                    }
                                    placeholder={professionDefault ? `Padrão: ${professionDefault}` : 'R$ 0,00'}
                                  />
                                </label>
                              </li>
                            )
                          })}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="btn-brand-gradient inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold"
        >
          Salvar alterações
        </button>
      </div>
      <p className="text-center text-xs text-gray-500">
        Entidade: {cliente.prefeitura}. Ao confirmar, será solicitado o PIN de autorização.
      </p>
    </div>
  )
}
