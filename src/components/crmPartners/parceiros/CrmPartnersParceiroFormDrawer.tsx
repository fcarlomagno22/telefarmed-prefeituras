import { X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import type { CrmPartnersParceiroFormValues } from '../../../types/crmPartnersParceiros'
import { maskCnpj, maskCpf, maskPhone } from '../../../utils/masks'
import { CustomSelect } from '../../ui/CustomSelect'
import {
  crmPartnersParceirosDrawerShellClass,
  crmPartnersParceirosInputClass,
  crmPartnersPixKeyTypeOptions,
} from './crmPartnersParceirosUi'

type CrmPartnersParceiroFormDrawerProps = {
  open: boolean
  closing: boolean
  mode: 'create' | 'edit'
  initialValues: CrmPartnersParceiroFormValues
  onClose: () => void
  onTransitionEnd: () => void
  onSubmit: (values: CrmPartnersParceiroFormValues) => void
}

function maskDocumento(value: string, tipo: 'cpf' | 'cnpj') {
  return tipo === 'cnpj' ? maskCnpj(value) : maskCpf(value)
}

export function CrmPartnersParceiroFormDrawer({
  open,
  closing,
  mode,
  initialValues,
  onClose,
  onTransitionEnd,
  onSubmit,
}: CrmPartnersParceiroFormDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [values, setValues] = useState<CrmPartnersParceiroFormValues>(initialValues)
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

  function patch(patchValues: Partial<CrmPartnersParceiroFormValues>) {
    setValues((current) => ({ ...current, ...patchValues }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!values.nome.trim()) {
      setError('Informe o nome do parceiro.')
      return
    }

    const documentoDigits = values.documento.replace(/\D/g, '')
    const expectedLength = values.documentoTipo === 'cnpj' ? 14 : 11
    if (documentoDigits.length !== expectedLength) {
      setError(`Informe um ${values.documentoTipo === 'cnpj' ? 'CNPJ' : 'CPF'} válido.`)
      return
    }

    if (!values.telefone.replace(/\D/g, '').trim()) {
      setError('Informe o telefone do parceiro.')
      return
    }

    onSubmit({
      ...values,
      documento: documentoDigits,
      telefone: values.telefone.replace(/\D/g, ''),
    })
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
        aria-label="Fechar formulário"
        onClick={onClose}
      />

      <div
        className={crmPartnersParceirosDrawerShellClass}
        style={{ transform: panelVisible ? 'translateX(0)' : 'translateX(100%)' }}
        onTransitionEnd={onTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'create' ? 'Novo parceiro' : 'Editar parceiro'}
      >
        <header className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                CRM Partners
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">
                {mode === 'create' ? 'Novo parceiro' : 'Editar parceiro'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Cadastre vendedores e indicadores da rede comercial.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <section>
              <h3 className="text-sm font-bold text-gray-900">Dados cadastrais</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Nome</span>
                  <input
                    className={crmPartnersParceirosInputClass}
                    value={values.nome}
                    onChange={(event) => patch({ nome: event.target.value })}
                    placeholder="Nome completo ou razão social"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Tipo de documento</span>
                  <CustomSelect
                    value={values.documentoTipo}
                    onChange={(value) =>
                      patch({
                        documentoTipo: value as 'cpf' | 'cnpj',
                        documento: '',
                      })
                    }
                    options={[
                      { value: 'cpf', label: 'CPF' },
                      { value: 'cnpj', label: 'CNPJ' },
                    ]}
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                    {values.documentoTipo === 'cnpj' ? 'CNPJ' : 'CPF'}
                  </span>
                  <input
                    className={crmPartnersParceirosInputClass}
                    value={maskDocumento(values.documento, values.documentoTipo)}
                    onChange={(event) => patch({ documento: event.target.value.replace(/\D/g, '') })}
                    placeholder={values.documentoTipo === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Telefone</span>
                  <input
                    className={crmPartnersParceirosInputClass}
                    value={maskPhone(values.telefone)}
                    onChange={(event) => patch({ telefone: event.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">E-mail</span>
                  <input
                    type="email"
                    className={crmPartnersParceirosInputClass}
                    value={values.email}
                    onChange={(event) => patch({ email: event.target.value })}
                    placeholder="contato@parceiro.com"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                    % padrão de comissão (opcional)
                  </span>
                  <input
                    className={crmPartnersParceirosInputClass}
                    value={values.comissaoPadraoPercentual}
                    onChange={(event) =>
                      patch({ comissaoPadraoPercentual: event.target.value.replace(/[^\d.,]/g, '') })
                    }
                    placeholder="Ex.: 10"
                  />
                </label>
              </div>
            </section>

            <section className="mt-6">
              <h3 className="text-sm font-bold text-gray-900">Dados bancários / PIX</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Banco</span>
                  <input
                    className={crmPartnersParceirosInputClass}
                    value={values.banco}
                    onChange={(event) => patch({ banco: event.target.value })}
                    placeholder="Nome do banco"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Agência</span>
                  <input
                    className={crmPartnersParceirosInputClass}
                    value={values.agencia}
                    onChange={(event) => patch({ agencia: event.target.value })}
                    placeholder="0000"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Conta</span>
                  <input
                    className={crmPartnersParceirosInputClass}
                    value={values.conta}
                    onChange={(event) => patch({ conta: event.target.value })}
                    placeholder="00000-0"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Tipo de chave PIX</span>
                  <CustomSelect
                    value={values.pixKeyType}
                    onChange={(value) =>
                      patch({ pixKeyType: value as CrmPartnersParceiroFormValues['pixKeyType'] })
                    }
                    options={[...crmPartnersPixKeyTypeOptions]}
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Chave PIX</span>
                  <input
                    className={crmPartnersParceirosInputClass}
                    value={values.pixKey}
                    onChange={(event) => patch({ pixKey: event.target.value })}
                    placeholder="Informe a chave PIX"
                  />
                </label>
              </div>
            </section>

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
            <button
              type="submit"
              className="btn-brand-gradient rounded-xl px-4 py-2 text-sm font-semibold"
            >
              {mode === 'create' ? 'Cadastrar parceiro' : 'Salvar alterações'}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  )
}
