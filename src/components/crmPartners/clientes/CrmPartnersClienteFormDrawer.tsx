import { X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import type { CrmPartnersClienteFormValues } from '../../../types/crmPartnersClientes'
import { maskCnpj, maskPhone } from '../../../utils/masks'
import { CustomSelect } from '../../ui/CustomSelect'
import {
  crmPartnersClientesDrawerShellClass,
  crmPartnersClientesInputClass,
} from './crmPartnersClientesUi'

type CrmPartnersClienteFormDrawerProps = {
  open: boolean
  closing: boolean
  initialValues: CrmPartnersClienteFormValues
  parceiroOptions: Array<{ value: string; label: string }>
  onClose: () => void
  onTransitionEnd: () => void
  onSubmit: (values: CrmPartnersClienteFormValues) => void
}

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR',
  'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
].map((uf) => ({ value: uf, label: uf }))

export function CrmPartnersClienteFormDrawer({
  open,
  closing,
  initialValues,
  parceiroOptions,
  onClose,
  onTransitionEnd,
  onSubmit,
}: CrmPartnersClienteFormDrawerProps) {
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

  function patch(patchValues: Partial<CrmPartnersClienteFormValues>) {
    setValues((current) => ({ ...current, ...patchValues }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!values.razaoSocial.trim()) {
      setError('Informe a razão social.')
      return
    }
    if (values.cnpj.replace(/\D/g, '').length !== 14) {
      setError('Informe um CNPJ válido.')
      return
    }
    if (!values.parceiroIndicadorId) {
      setError('Selecione o parceiro indicador.')
      return
    }

    onSubmit({
      ...values,
      cnpj: values.cnpj.replace(/\D/g, ''),
      contatoTelefone: values.contatoTelefone.replace(/\D/g, ''),
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
        className={crmPartnersClientesDrawerShellClass}
        style={{ transform: panelVisible ? 'translateX(0)' : 'translateX(100%)' }}
        onTransitionEnd={onTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Novo cliente"
      >
        <header className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                CRM Partners
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">Novo cliente</h2>
              <p className="mt-1 text-sm text-gray-500">
                Cadastro unificado: Prefeitura, Santa Casa ou Empresa.
              </p>
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Razão social</span>
                <input className={crmPartnersClientesInputClass} value={values.razaoSocial} onChange={(e) => patch({ razaoSocial: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Tipo</span>
                <CustomSelect
                  value={values.tipo}
                  onChange={(value) => patch({ tipo: value as CrmPartnersClienteFormValues['tipo'] })}
                  options={[
                    { value: 'prefeitura', label: 'Prefeitura' },
                    { value: 'santa_casa', label: 'Santa Casa' },
                    { value: 'empresa', label: 'Empresa' },
                  ]}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">CNPJ</span>
                <input className={crmPartnersClientesInputClass} value={maskCnpj(values.cnpj)} onChange={(e) => patch({ cnpj: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Contato</span>
                <input className={crmPartnersClientesInputClass} value={values.contatoNome} onChange={(e) => patch({ contatoNome: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">E-mail</span>
                <input type="email" className={crmPartnersClientesInputClass} value={values.contatoEmail} onChange={(e) => patch({ contatoEmail: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Telefone</span>
                <input className={crmPartnersClientesInputClass} value={maskPhone(values.contatoTelefone)} onChange={(e) => patch({ contatoTelefone: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Cidade</span>
                <input className={crmPartnersClientesInputClass} value={values.cidade} onChange={(e) => patch({ cidade: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">UF</span>
                <CustomSelect value={values.uf} onChange={(value) => patch({ uf: value })} options={UF_OPTIONS} />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Parceiro indicador</span>
                <CustomSelect value={values.parceiroIndicadorId} onChange={(value) => patch({ parceiroIndicadorId: value })} options={parceiroOptions} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Valor mensal (R$)</span>
                <input className={crmPartnersClientesInputClass} value={values.valorMensal} onChange={(e) => patch({ valorMensal: e.target.value.replace(/\D/g, '') })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Início do contrato</span>
                <input className={crmPartnersClientesInputClass} placeholder="dd/mm/aaaa" value={values.dataInicioContrato} onChange={(e) => patch({ dataInicioContrato: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Status do contrato</span>
                <CustomSelect
                  value={values.contratoStatus}
                  onChange={(value) => patch({ contratoStatus: value as CrmPartnersClienteFormValues['contratoStatus'] })}
                  options={[
                    { value: 'pendente', label: 'Pendente' },
                    { value: 'ativo', label: 'Ativo' },
                    { value: 'suspenso', label: 'Suspenso' },
                    { value: 'encerrado', label: 'Encerrado' },
                  ]}
                />
              </label>
            </div>
            {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
          </div>

          <footer className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-5 py-4 sm:px-6">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="btn-brand-gradient rounded-xl px-4 py-2 text-sm font-semibold">
              Cadastrar cliente
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  )
}
