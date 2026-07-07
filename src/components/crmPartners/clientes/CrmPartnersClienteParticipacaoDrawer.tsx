import { Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import type { CrmPartnersClienteParticipacaoFormValues } from '../../../types/crmPartnersClientes'
import { maskCurrencyBrl } from '../../../utils/masks'
import { CustomSelect } from '../../ui/CustomSelect'
import {
  crmPartnersClientesDrawerShellClass,
  crmPartnersClientesInputClass,
  crmPartnersParticipacaoPorConsultaLabel,
} from './crmPartnersClientesUi'

type CrmPartnersClienteParticipacaoDrawerProps = {
  open: boolean
  closing: boolean
  clienteNome: string
  parceiroOptions: Array<{ value: string; label: string }>
  initialValues: CrmPartnersClienteParticipacaoFormValues
  onCreateLinha: () => CrmPartnersClienteParticipacaoFormValues['linhas'][number]
  onClose: () => void
  onTransitionEnd: () => void
  onSubmit: (values: CrmPartnersClienteParticipacaoFormValues) => void
}

export function CrmPartnersClienteParticipacaoDrawer({
  open,
  closing,
  clienteNome,
  parceiroOptions,
  initialValues,
  onCreateLinha,
  onClose,
  onTransitionEnd,
  onSubmit,
}: CrmPartnersClienteParticipacaoDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState<string | null>(null)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

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

  function patch(patchValues: Partial<CrmPartnersClienteParticipacaoFormValues>) {
    setValues((current) => ({ ...current, ...patchValues }))
  }

  function patchLinha(key: string, patchLinha: Partial<CrmPartnersClienteParticipacaoFormValues['linhas'][number]>) {
    setValues((current) => ({
      ...current,
      linhas: current.linhas.map((linha) =>
        linha.key === key ? { ...linha, ...patchLinha } : linha,
      ),
    }))
  }

  function addLinha() {
    setValues((current) => ({
      ...current,
      linhas: [...current.linhas, onCreateLinha()],
    }))
  }

  function removeLinha(key: string) {
    setValues((current) => ({
      ...current,
      linhas: current.linhas.length <= 1 ? current.linhas : current.linhas.filter((linha) => linha.key !== key),
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const parceirosUsados = new Set<string>()
    for (const linha of values.linhas) {
      if (!linha.parceiroId) {
        setError('Selecione todos os parceiros envolvidos.')
        return
      }
      if (parceirosUsados.has(linha.parceiroId)) {
        setError('Cada parceiro só pode aparecer uma vez na participação.')
        return
      }
      parceirosUsados.add(linha.parceiroId)
      if (!linha.valorPorConsulta.trim()) {
        setError('Informe o valor por consulta de cada parceiro.')
        return
      }
    }

    if (!values.vigenciaInicio.trim()) {
      setError('Informe a data de início da vigência.')
      return
    }

    onSubmit(values)
  }

  if (!isActive) return null

  return createPortal(
    <div className="fixed inset-0 z-[10000]">
      <button
        type="button"
        className={[
          'absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity duration-300',
          panelVisible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        aria-label="Fechar definição de participação"
        onClick={onClose}
      />

      <div
        className={crmPartnersClientesDrawerShellClass}
        style={{ transform: panelVisible ? 'translateX(0)' : 'translateX(100%)' }}
        onTransitionEnd={onTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Definir participação"
      >
        <header className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Participação dos parceiros
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">Definir participação</h2>
              <p className="mt-1 text-sm text-gray-500">{clienteNome}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
              <p className="text-sm font-semibold text-orange-900">Repasse na operação do cliente</p>
              <p className="mt-1 text-sm text-orange-800/90">
                Indique todos os parceiros envolvidos neste cliente e quanto cada um receberá por
                consulta realizada.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {values.linhas.map((linha, index) => (
                <div
                  key={linha.key}
                  className="rounded-2xl border border-gray-200 bg-slate-50/50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Parceiro {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeLinha(linha.key)}
                      disabled={values.linhas.length <= 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition enabled:hover:bg-red-50 enabled:hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Remover parceiro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-xs font-semibold text-gray-600">Parceiro</span>
                      <CustomSelect
                        value={linha.parceiroId}
                        onChange={(value) => patchLinha(linha.key, { parceiroId: value })}
                        options={parceiroOptions}
                      />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                        {crmPartnersParticipacaoPorConsultaLabel}
                      </span>
                      <input
                        className={crmPartnersClientesInputClass}
                        value={linha.valorPorConsulta}
                        onChange={(e) =>
                          patchLinha(linha.key, { valorPorConsulta: maskCurrencyBrl(e.target.value) })
                        }
                        placeholder="R$ 0,00"
                      />
                    </label>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addLinha}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-[var(--brand-primary)]/40 hover:bg-orange-50/40"
              >
                <Plus className="h-4 w-4" />
                Adicionar parceiro
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Vigência início</span>
                <input
                  className={crmPartnersClientesInputClass}
                  value={values.vigenciaInicio}
                  onChange={(e) => patch({ vigenciaInicio: e.target.value })}
                  placeholder="dd/mm/aaaa"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Observações (opcional)</span>
                <textarea
                  className={[crmPartnersClientesInputClass, 'min-h-[5rem] resize-y'].join(' ')}
                  value={values.observacoes}
                  onChange={(e) => patch({ observacoes: e.target.value })}
                />
              </label>
            </div>

            {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
          </div>

          <footer className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-brand-gradient rounded-xl px-4 py-2 text-sm font-semibold">
              Salvar participação
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  )
}
