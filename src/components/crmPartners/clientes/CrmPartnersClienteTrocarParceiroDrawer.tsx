import { X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import type {
  CrmPartnersClienteDetail,
  CrmPartnersClienteTrocarParceiroFormValues,
} from '../../../types/crmPartnersClientes'
import { CustomSelect } from '../../ui/CustomSelect'
import { crmPartnersClientesDrawerShellClass, crmPartnersClientesInputClass } from './crmPartnersClientesUi'

type CrmPartnersClienteTrocarParceiroDrawerProps = {
  open: boolean
  closing: boolean
  detail: CrmPartnersClienteDetail | null
  parceiroOptions: Array<{ value: string; label: string }>
  initialValues: CrmPartnersClienteTrocarParceiroFormValues
  onClose: () => void
  onTransitionEnd: () => void
  onSubmit: (values: CrmPartnersClienteTrocarParceiroFormValues) => void
}

export function CrmPartnersClienteTrocarParceiroDrawer({
  open,
  closing,
  detail,
  parceiroOptions,
  initialValues,
  onClose,
  onTransitionEnd,
  onSubmit,
}: CrmPartnersClienteTrocarParceiroDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState<string | null>(null)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  const options = parceiroOptions.filter(
    (item) => item.value !== detail?.cliente.parceiroIndicadorId,
  )

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    setValues(initialValues)
    setError(null)
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open, initialValues])

  useEffect(() => {
    if (!isActive) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  function patch(patchValues: Partial<CrmPartnersClienteTrocarParceiroFormValues>) {
    setValues((current) => ({ ...current, ...patchValues }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!values.parceiroId) {
      setError('Selecione o novo parceiro indicador.')
      return
    }
    if (!values.motivo.trim()) {
      setError('Informe o motivo da troca.')
      return
    }

    onSubmit(values)
  }

  if (!isActive || !detail) return null

  return createPortal(
    <div className="fixed inset-0 z-[10000]">
      <button
        type="button"
        className={[
          'absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity duration-300',
          panelVisible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        aria-label="Fechar troca de parceiro"
        onClick={onClose}
      />

      <div
        className={crmPartnersClientesDrawerShellClass}
        style={{ transform: panelVisible ? 'translateX(0)' : 'translateX(100%)' }}
        onTransitionEnd={onTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Trocar parceiro"
      >
        <header className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                Parceiro indicador
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">Trocar parceiro</h2>
              <p className="mt-1 text-sm text-gray-500">{detail.cliente.razaoSocial}</p>
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="rounded-2xl border border-gray-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Parceiro atual</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {detail.cliente.parceiroIndicadorNome}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Novo parceiro</span>
                <CustomSelect
                  value={values.parceiroId}
                  onChange={(value) => patch({ parceiroId: value })}
                  options={options}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Data de início</span>
                <input
                  className={crmPartnersClientesInputClass}
                  value={values.dataInicio}
                  onChange={(e) => patch({ dataInicio: e.target.value })}
                  placeholder="dd/mm/aaaa"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Motivo da troca</span>
                <textarea
                  className={[crmPartnersClientesInputClass, 'min-h-[5rem] resize-y'].join(' ')}
                  value={values.motivo}
                  onChange={(e) => patch({ motivo: e.target.value })}
                  placeholder="Descreva o motivo comercial da redistribuição..."
                />
              </label>
            </div>

            <section className="mt-6">
              <h3 className="text-sm font-bold text-gray-900">Histórico de parceiros</h3>
              <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Parceiro
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Período
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {detail.historicoParceiros.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.parceiroNome}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.dataInicio} — {item.dataFim ?? 'atual'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
          </div>

          <footer className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-5 py-4 sm:px-6">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="btn-brand-gradient rounded-xl px-4 py-2 text-sm font-semibold">
              Confirmar troca
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  )
}
