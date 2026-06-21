import { useEffect, useMemo, useState } from 'react'
import type { AdminClienteContrato, AdminClienteRow } from '../../../types/adminClientes'
import type { ClienteSpecialtyOption } from '../../../hooks/useAdminClientesClinicoCatalog'
import {
  getClienteContratoTipoOption,
  useAdminClientesContratoCatalog,
} from '../../../hooks/useAdminClientesContratoCatalog'
import { maskCurrencyBrl } from '../../../utils/masks'
import {
  AdminClienteContratoEspecialidadesPanel,
} from './AdminClienteContratoEspecialidadesPanel'
import {
  setSpecialtiesSelectionForProfession,
  toggleProfessionInContratoForm,
  toggleSpecialtyInContratoForm,
  type ClienteProfessionOption,
} from './adminClienteContratoCatalogUtils'
import type { AddContratoFormState } from './adminClienteContratoForm'
import {
  buildAddContratoFormFromContrato,
  validateLimitedEditContratoForm,
} from './adminClienteContratoForm'

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
  const { contractTypes } = useAdminClientesContratoCatalog()
  const sortedSpecialties = useMemo(
    () => [...specialties].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [specialties],
  )
  const initialModalidade =
    contrato.modalidade ??
    getClienteContratoTipoOption(contractTypes, contrato.tipo)?.modalidade ??
    'pacote_fechado'

  const [form, setForm] = useState<AddContratoFormState>(() =>
    buildAddContratoFormFromContrato(contrato, initialModalidade, sortedSpecialties, professions),
  )
  const [stepError, setStepError] = useState<string | null>(null)

  useEffect(() => {
    setForm(buildAddContratoFormFromContrato(contrato, initialModalidade, sortedSpecialties, professions))
    setStepError(null)
  }, [contrato.id, initialModalidade, sortedSpecialties, professions])

  function updateForm(patch: Partial<AddContratoFormState>) {
    setStepError(null)
    setForm((current) => ({ ...current, ...patch }))
  }

  function handleSubmit() {
    const error = validateLimitedEditContratoForm(form, sortedSpecialties)
    if (error) {
      setStepError(error)
      return
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
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Identificação</h3>
        <div className="mt-3 max-w-md">
          <label>
            <span className={labelClass}>Número do contrato</span>
            <input
              className={inputClass}
              value={form.numeroContrato}
              onChange={(e) => updateForm({ numeroContrato: e.target.value })}
              placeholder="Ex.: 2026/001"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <AdminClienteContratoEspecialidadesPanel
          professions={professions}
          specialties={sortedSpecialties}
          professionIds={form.professionIds}
          specialtyIds={form.specialtyIds}
          precosProfissao={form.precosProfissao}
          precosEspecialidade={form.precosEspecialidade}
          origemAtendimentoProfissao={form.origemAtendimentoProfissao}
          origemAtendimentoEspecialidade={form.origemAtendimentoEspecialidade}
          onToggleProfession={(professionId) =>
            setForm((current) => toggleProfessionInContratoForm(current, professionId, sortedSpecialties))
          }
          onToggleSpecialty={(id) =>
            setForm((current) => toggleSpecialtyInContratoForm(current, id))
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
          onOrigemProfissaoChange={(professionId, origem) =>
            setForm((current) => ({
              ...current,
              origemAtendimentoProfissao: {
                ...current.origemAtendimentoProfissao,
                [professionId]: origem,
              },
            }))
          }
          onOrigemEspecialidadeChange={(specialtyId, origem) =>
            setForm((current) => ({
              ...current,
              origemAtendimentoEspecialidade: {
                ...current.origemAtendimentoEspecialidade,
                [specialtyId]: origem,
              },
            }))
          }
          inputClass={inputClass}
          labelClass={labelClass}
        />
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
