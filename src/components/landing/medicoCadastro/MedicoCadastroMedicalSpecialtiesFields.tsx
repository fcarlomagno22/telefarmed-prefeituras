import { Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  createMedicoCadastroMedicalSpecialty,
  MEDICO_CADASTRO_MAX_MEDICAL_SPECIALTIES,
} from '../../../config/medicoCadastroForm'
import type {
  MedicoCadastroFormErrors,
  MedicoCadastroMedicalSpecialty,
} from '../../../types/medicoCadastro'
import { CustomSelect } from '../../ui/CustomSelect'
import {
  MedicoCadastroFormField,
  medicoCadastroInputClass,
  medicoCadastroSelectClass,
} from './MedicoCadastroFormField'

type MedicoCadastroMedicalSpecialtiesFieldsProps = {
  specialties: MedicoCadastroMedicalSpecialty[]
  specialtyOptions: Array<{ value: string; label: string }>
  errors: MedicoCadastroFormErrors
  onChange: (specialties: MedicoCadastroMedicalSpecialty[]) => void
  onClearError: (key: `medicalSpecialty:${string}`) => void
}

function specialtyErrorKey(
  id: string,
  field: 'specialty' | 'rqe',
): `medicalSpecialty:${string}` {
  return `medicalSpecialty:${id}:${field}`
}

function isSpecialtyComplete(item: MedicoCadastroMedicalSpecialty): boolean {
  return (
    item.specialty.trim().length > 0 && item.rqe.replace(/\D/g, '').length >= 3
  )
}

export function MedicoCadastroMedicalSpecialtiesFields({
  specialties,
  specialtyOptions,
  errors,
  onChange,
  onClearError,
}: MedicoCadastroMedicalSpecialtiesFieldsProps) {
  const [draftOpen, setDraftOpen] = useState(false)

  useEffect(() => {
    if (specialties.length === 0) {
      onChange([createMedicoCadastroMedicalSpecialty()])
    }
  }, [specialties.length, onChange])

  const lastSpecialty = specialties[specialties.length - 1]
  const hasIncompleteLast = Boolean(lastSpecialty && !isSpecialtyComplete(lastSpecialty))
  const allComplete =
    specialties.length > 0 && specialties.every((item) => isSpecialtyComplete(item))

  const showDraftCard =
    specialties.length === 0 || hasIncompleteLast || draftOpen

  const lineItems =
    showDraftCard && specialties.length > 1
      ? specialties.slice(0, -1)
      : !showDraftCard
        ? specialties
        : []

  const activeSpecialty = lastSpecialty ?? createMedicoCadastroMedicalSpecialty()

  const selectedNames = new Set(
    specialties.map((item) => item.specialty.trim().toLowerCase()).filter(Boolean),
  )

  const canOpenDraft =
    allComplete &&
    !draftOpen &&
    !hasIncompleteLast &&
    specialties.length < MEDICO_CADASTRO_MAX_MEDICAL_SPECIALTIES

  const canCloseDraft = showDraftCard && specialties.length > 1

  const isPrincipalCard = lineItems.length === 0

  function patchActiveSpecialty(patch: Partial<MedicoCadastroMedicalSpecialty>) {
    if (!lastSpecialty) {
      onChange([{ ...createMedicoCadastroMedicalSpecialty(), ...patch }])
      return
    }

    onChange(
      specialties.map((item) =>
        item.id === lastSpecialty.id ? { ...item, ...patch } : item,
      ),
    )

    for (const field of Object.keys(patch) as Array<'specialty' | 'rqe'>) {
      onClearError(specialtyErrorKey(lastSpecialty.id, field))
    }
  }

  function openDraft() {
    if (!canOpenDraft) return
    onChange([...specialties, createMedicoCadastroMedicalSpecialty()])
    setDraftOpen(true)
  }

  function closeDraft() {
    if (!canCloseDraft || !lastSpecialty) return

    if (isSpecialtyComplete(lastSpecialty)) {
      setDraftOpen(false)
      return
    }

    onChange(specialties.slice(0, -1))
    setDraftOpen(false)
  }

  function removeSpecialty(id: string) {
    const next = specialties.filter((item) => item.id !== id)
    if (next.length === 0) {
      onChange([createMedicoCadastroMedicalSpecialty()])
      setDraftOpen(false)
      return
    }
    onChange(next)
    setDraftOpen(false)
  }

  function optionsForActiveRow() {
    const current = activeSpecialty.specialty.trim().toLowerCase()
    return specialtyOptions.filter((option) => {
      const key = option.value.trim().toLowerCase()
      return key === current || !selectedNames.has(key)
    })
  }

  const activeSpecialtyError = showDraftCard
    ? errors[specialtyErrorKey(activeSpecialty.id, 'specialty')]
    : undefined
  const activeRqeError = showDraftCard
    ? errors[specialtyErrorKey(activeSpecialty.id, 'rqe')]
    : undefined
  const activeCardTitle = isPrincipalCard ? 'Especialidade principal' : 'Nova especialidade'

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50/90 px-3 py-2.5 text-xs leading-relaxed text-sky-900">
        <p>
          Informe todas as especialidades em que você possui RQE. A primeira é considerada sua
          especialidade principal.
        </p>
      </div>

      {lineItems.length > 0 ? (
        <ul className="space-y-2">
          {lineItems.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-gray-900">{item.specialty}</p>
                  {index === 0 ? (
                    <span className="rounded-full bg-[var(--brand-primary-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-primary)]">
                      Principal
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-gray-600">
                  RQE <span className="font-medium tabular-nums text-gray-800">{item.rqe}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeSpecialty(item.id)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                aria-label={`Remover ${item.specialty}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {showDraftCard ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-gray-900">{activeCardTitle}</p>
            {canCloseDraft ? (
              <button
                type="button"
                onClick={closeDraft}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Fechar nova especialidade"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Fechar
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            <MedicoCadastroFormField label="Especialidade" error={activeSpecialtyError}>
              <CustomSelect
                value={activeSpecialty.specialty}
                onChange={(value) => patchActiveSpecialty({ specialty: value })}
                options={optionsForActiveRow()}
                placeholder="Selecione"
                required
                size="compact"
                className={medicoCadastroSelectClass(Boolean(activeSpecialtyError))}
              />
            </MedicoCadastroFormField>

            <MedicoCadastroFormField label="RQE" error={activeRqeError}>
              <input
                className={medicoCadastroInputClass(Boolean(activeRqeError))}
                type="text"
                inputMode="numeric"
                placeholder="Número do RQE"
                value={activeSpecialty.rqe}
                onChange={(e) =>
                  patchActiveSpecialty({
                    rqe: e.target.value.replace(/\D/g, '').slice(0, 8),
                  })
                }
              />
            </MedicoCadastroFormField>
          </div>
        </div>
      ) : null}

      {canOpenDraft ? (
        <button
          type="button"
          onClick={openDraft}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-[var(--brand-primary)]/40 hover:text-[var(--brand-primary)]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Adicionar outra especialidade
        </button>
      ) : null}

      {isPrincipalCard && showDraftCard ? (
        <p className="text-center text-[11px] text-gray-500">
          Selecione sua especialidade principal e informe o RQE para continuar.
        </p>
      ) : null}

      {canCloseDraft && hasIncompleteLast ? (
        <p className="text-center text-[11px] text-gray-500">
          Preencha a especialidade e o RQE, ou clique em <span className="font-medium">Fechar</span>{' '}
          para descartar.
        </p>
      ) : null}
    </div>
  )
}
