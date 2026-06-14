import { Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AdminClienteRow } from '../../../types/adminClientes'
import type { AdminClienteUbtRow } from '../../../types/adminClienteUbts'
import type { ClienteUbtPayload } from '../../../lib/services/admin/clientes'

type AdminClienteUbtFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  cliente: AdminClienteRow
  ubt?: AdminClienteUbtRow | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: ClienteUbtPayload) => void | Promise<void>
}

type FormState = {
  name: string
  cnes: string
  unitType: 'fixa' | 'movel'
  status: 'ativa' | 'manutencao' | 'inativa'
  regionKey: string
  regionLabel: string
  phone: string
  dailyCapacity: string
  stationsTotal: string
  street: string
  number: string
  city: string
  state: string
}

function defaultForm(cliente: AdminClienteRow, ubt?: AdminClienteUbtRow | null): FormState {
  const regionSlug = cliente.municipio
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')

  if (ubt) {
    return {
      name: ubt.name,
      cnes: ubt.cnes,
      unitType: ubt.unitType === 'Móvel' ? 'movel' : 'fixa',
      status: ubt.status,
      regionKey: ubt.regionKey,
      regionLabel: ubt.region,
      phone: ubt.phone,
      dailyCapacity: ubt.dailyCapacityLabel.replace(/\D/g, '') || '0',
      stationsTotal: String(ubt.stationsTotal),
      street: ubt.address.street,
      number: ubt.address.number,
      city: ubt.address.city,
      state: ubt.address.state,
    }
  }

  return {
    name: '',
    cnes: '',
    unitType: 'fixa',
    status: 'ativa',
    regionKey: regionSlug || 'centro',
    regionLabel: cliente.municipio,
    phone: '',
    dailyCapacity: '0',
    stationsTotal: '1',
    street: '',
    number: '',
    city: cliente.municipio,
    state: cliente.uf,
  }
}

function buildPayload(form: FormState): ClienteUbtPayload {
  const stationsTotal = Math.max(1, Number.parseInt(form.stationsTotal, 10) || 1)
  const dailyCapacity = Math.max(0, Number.parseInt(form.dailyCapacity, 10) || 0)

  return {
    name: form.name.trim(),
    cnes: form.cnes.trim() || undefined,
    unitType: form.unitType,
    status: form.status,
    regionKey: form.regionKey.trim(),
    regionLabel: form.regionLabel.trim(),
    phone: form.phone.trim() || undefined,
    dailyCapacity,
    stationsTotal,
    address: {
      street: form.street.trim() || undefined,
      number: form.number.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim().toUpperCase().slice(0, 2) || undefined,
    },
  }
}

const inputClass =
  'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)]/45 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.14)]'

export function AdminClienteUbtFormModal({
  open,
  mode,
  cliente,
  ubt,
  isSubmitting,
  onClose,
  onSubmit,
}: AdminClienteUbtFormModalProps) {
  const [form, setForm] = useState<FormState>(() => defaultForm(cliente, ubt))

  useEffect(() => {
    if (!open) return
    setForm(defaultForm(cliente, ubt))
  }, [cliente, open, ubt])

  if (!open) return null

  const title = mode === 'create' ? 'Nova UBT' : 'Editar UBT'

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/45" aria-label="Fechar" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-cliente-ubt-form-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id="admin-cliente-ubt-form-title" className="text-lg font-bold text-gray-900">
              {title}
            </h2>
            <p className="text-sm text-gray-500">{cliente.prefeitura}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!form.name.trim()) return
            void onSubmit(buildPayload(form))
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2 block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">Nome da unidade *</span>
              <input
                className={inputClass}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">CNES</span>
              <input
                className={inputClass}
                value={form.cnes}
                onChange={(event) => setForm((current) => ({ ...current, cnes: event.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">Telefone</span>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">Tipo</span>
              <select
                className={inputClass}
                value={form.unitType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    unitType: event.target.value as FormState['unitType'],
                  }))
                }
              >
                <option value="fixa">Fixa</option>
                <option value="movel">Móvel</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">Status operacional</span>
              <select
                className={inputClass}
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as FormState['status'],
                  }))
                }
              >
                <option value="ativa">Ativa</option>
                <option value="manutencao">Manutenção</option>
                <option value="inativa">Inativa</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">Região (rótulo)</span>
              <input
                className={inputClass}
                value={form.regionLabel}
                onChange={(event) =>
                  setForm((current) => ({ ...current, regionLabel: event.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">Chave da região</span>
              <input
                className={inputClass}
                value={form.regionKey}
                onChange={(event) => setForm((current) => ({ ...current, regionKey: event.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">Terminais</span>
              <input
                className={inputClass}
                type="number"
                min={1}
                value={form.stationsTotal}
                onChange={(event) =>
                  setForm((current) => ({ ...current, stationsTotal: event.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">Capacidade diária</span>
              <input
                className={inputClass}
                type="number"
                min={0}
                value={form.dailyCapacity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dailyCapacity: event.target.value }))
                }
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-semibold text-gray-700">Logradouro</span>
              <input
                className={inputClass}
                value={form.street}
                onChange={(event) => setForm((current) => ({ ...current, street: event.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">Número</span>
              <input
                className={inputClass}
                value={form.number}
                onChange={(event) => setForm((current) => ({ ...current, number: event.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">Cidade</span>
              <input
                className={inputClass}
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">UF</span>
              <input
                className={inputClass}
                maxLength={2}
                value={form.state}
                onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
              />
            </label>
          </div>

          <footer className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.name.trim()}
              className="btn-brand-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'create' ? 'Cadastrar UBT' : 'Salvar alterações'}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  )
}
