import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ConfigProfession, ConfigSpecialty } from '../../../types/adminConfiguracoes'
import { CustomSelect } from '../../ui/CustomSelect'
import { configInputClass } from './adminConfiguracoesUi'

type AdminConfigSpecialtyFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialValue: ConfigSpecialty
  professions: ConfigProfession[]
  onClose: () => void
  onSubmit: (value: ConfigSpecialty | ConfigSpecialty[]) => void
  isSubmitting?: boolean
}

function parseBulkSpecialtyNames(text: string): string[] {
  const seen = new Set<string>()
  return text
    .split(/\r?\n/)
    .flatMap((line) => line.split(/[;,]/).map((part) => part.trim()))
    .filter(Boolean)
    .filter((name) => {
      const key = name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function buildBulkSpecialties(
  names: string[],
  professionIds: string[],
  startSortOrder: number,
): ConfigSpecialty[] {
  const stamp = Date.now()
  return names.map((name, index) => ({
    id: `spec-${stamp}-${index}`,
    name,
    active: true,
    professionIds,
    sortOrder: startSortOrder + index,
  }))
}

export function AdminConfigSpecialtyFormModal({
  open,
  mode,
  initialValue,
  professions,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AdminConfigSpecialtyFormModalProps) {
  const [draft, setDraft] = useState(initialValue)
  const [bulkText, setBulkText] = useState('')

  useEffect(() => {
    if (open) {
      setDraft(initialValue)
      setBulkText('')
    }
  }, [open, initialValue])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const title = mode === 'create' ? 'Nova especialidade' : 'Editar especialidade'
  const bulkNames = parseBulkSpecialtyNames(bulkText)
  const canSubmit =
    mode === 'create'
      ? bulkNames.length > 0 && draft.professionIds.length > 0
      : draft.name.trim().length > 0 && draft.professionIds.length > 0

  function handleSubmit() {
    if (mode === 'create') {
      onSubmit(
        buildBulkSpecialties(bulkNames, draft.professionIds, initialValue.sortOrder),
      )
      return
    }
    onSubmit({ ...draft, name: draft.name.trim() })
  }

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-end justify-center bg-gray-900/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-config-specialty-form-title"
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)] sm:max-w-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h3 id="admin-config-specialty-form-title" className="text-base font-bold text-gray-900">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {mode === 'create'
                ? 'Informe várias especialidades de uma vez, uma por linha.'
                : 'Vincule a especialidade à profissão correspondente.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {mode === 'edit' ? <p className="text-xs text-gray-400">ID: {draft.id}</p> : null}

          {mode === 'create' ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                Especialidades
              </span>
              <textarea
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
                className={`${configInputClass} min-h-[160px] resize-y leading-relaxed`}
                placeholder={'Clínico Geral\nPediatria\nGinecologia'}
                autoFocus
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Uma especialidade por linha. Também aceita vírgula ou ponto e vírgula na mesma linha.
                {bulkNames.length > 0 ? (
                  <span className="font-medium text-gray-700">
                    {' '}
                    {bulkNames.length} {bulkNames.length === 1 ? 'item' : 'itens'} para cadastrar.
                  </span>
                ) : null}
              </p>
            </label>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">Nome</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                className={configInputClass}
                autoFocus
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-600">Profissão</span>
            <CustomSelect
              value={draft.professionIds[0] ?? ''}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  professionIds: value ? [value] : [],
                }))
              }
              options={[
                { value: '', label: 'Selecione' },
                ...professions.map((profession) => ({
                  value: profession.id,
                  label: profession.name,
                })),
              ]}
              className="text-left"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
            className="btn-brand-gradient rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? 'Salvando…'
              : mode === 'create'
                ? bulkNames.length > 1
                  ? `Adicionar ${bulkNames.length}`
                  : 'Adicionar'
                : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
