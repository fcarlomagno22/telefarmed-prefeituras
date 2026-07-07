import { Ban, Pencil, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CrmPartnersParceiroDetail } from '../../../types/crmPartnersParceiros'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { CrmPartnersClienteTipoBadge } from '../clientes/CrmPartnersClienteTipoBadge'
import { CrmPartnersParceiroStatusBadge } from './CrmPartnersParceiroStatusBadge'
import {
  crmPartnersComissaoStatusBadgeConfig,
  crmPartnersParceirosDrawerShellClass,
  formatCrmPartnersCurrency,
  formatCrmPartnersDocumento,
  formatCrmPartnersPercent,
  formatCrmPartnersTelefone,
} from './crmPartnersParceirosUi'

type CrmPartnersParceiroDetailDrawerProps = {
  open: boolean
  closing: boolean
  detail: CrmPartnersParceiroDetail | null
  onClose: () => void
  onTransitionEnd: () => void
  onEdit: () => void
  onToggleStatus: () => void
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}

export function CrmPartnersParceiroDetailDrawer({
  open,
  closing,
  detail,
  onClose,
  onTransitionEnd,
  onEdit,
  onToggleStatus,
}: CrmPartnersParceiroDetailDrawerProps) {
  const [entered, setEntered] = useState(false)
  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

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

  if (!isActive || !detail) return null

  const { parceiro, clientesIndicados, historicoComissoes } = detail
  const comissaoPendente = historicoComissoes
    .filter((item) => item.status === 'pendente')
    .reduce((sum, item) => sum + item.valor, 0)
  const comissaoPaga = historicoComissoes
    .filter((item) => item.status === 'pago')
    .reduce((sum, item) => sum + item.valor, 0)

  return createPortal(
    <div className="fixed inset-0 z-[10000]">
      <button
        type="button"
        className={[
          'absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity duration-300',
          panelVisible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        aria-label="Fechar detalhes do parceiro"
        onClick={onClose}
      />

      <div
        className={crmPartnersParceirosDrawerShellClass}
        style={{ transform: panelVisible ? 'translateX(0)' : 'translateX(100%)' }}
        onTransitionEnd={onTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes de ${parceiro.nome}`}
      >
        <header className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                Parceiro comercial
              </p>
              <h2 className="mt-1 truncate text-xl font-bold text-gray-900">{parceiro.nome}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <CrmPartnersParceiroStatusBadge status={parceiro.status} />
                <span className="text-sm text-gray-500">
                  Cadastro em {parceiro.dataCadastro}
                </span>
              </div>
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

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
            <button
              type="button"
              onClick={onToggleStatus}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              <Ban className="h-3.5 w-3.5" />
              {parceiro.status === 'ativo' ? 'Inativar' : 'Reativar'}
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <section className="rounded-2xl border border-gray-200 bg-slate-50/60 p-4">
            <h3 className="text-sm font-bold text-gray-900">Dados cadastrais</h3>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Nome" value={parceiro.nome} />
              <DetailField
                label={parceiro.documentoTipo === 'cnpj' ? 'CNPJ' : 'CPF'}
                value={formatCrmPartnersDocumento(parceiro)}
              />
              <DetailField label="Telefone" value={formatCrmPartnersTelefone(parceiro.telefone)} />
              <DetailField label="E-mail" value={parceiro.email} />
              <DetailField
                label="% padrão de comissão"
                value={formatCrmPartnersPercent(parceiro.comissaoPadraoPercentual)}
              />
            </dl>
          </section>

          <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-bold text-gray-900">Dados bancários / PIX</h3>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Banco" value={parceiro.bank.banco} />
              <DetailField label="Agência" value={parceiro.bank.agencia} />
              <DetailField label="Conta" value={parceiro.bank.conta} />
              <DetailField label="Chave PIX" value={parceiro.bank.pixKey} />
            </dl>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Clientes indicados
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{parceiro.clientesIndicados}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Comissões pendentes
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-900">
                {formatCrmPartnersCurrency(comissaoPendente)}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Comissões pagas
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">
                {formatCrmPartnersCurrency(comissaoPaga)}
              </p>
            </div>
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-gray-900">Clientes indicados</h3>
              <span className="text-xs text-gray-500">{clientesIndicados.length} registros</span>
            </div>
            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Indicação
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Contrato
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {clientesIndicados.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                        Nenhum cliente indicado por este parceiro.
                      </td>
                    </tr>
                  ) : (
                    clientesIndicados.map((cliente) => (
                      <tr key={cliente.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{cliente.nome}</td>
                        <td className="px-4 py-3">
                          <CrmPartnersClienteTipoBadge tipo={cliente.tipo} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{cliente.dataIndicacao}</td>
                        <td className="px-4 py-3 text-sm capitalize text-gray-600">
                          {cliente.statusContrato}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 pb-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-gray-900">Histórico de comissões</h3>
              <span className="text-xs text-gray-500">{historicoComissoes.length} lançamentos</span>
            </div>
            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Referência
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {historicoComissoes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                        Nenhuma comissão registrada.
                      </td>
                    </tr>
                  ) : (
                    historicoComissoes.map((comissao) => (
                      <tr key={comissao.id}>
                        <td className="px-4 py-3 text-sm text-gray-700">{comissao.referencia}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {comissao.clienteNome}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {formatCrmPartnersCurrency(comissao.valor)}
                        </td>
                        <td className="px-4 py-3">
                          <SituationStatusBadge
                            config={crmPartnersComissaoStatusBadgeConfig[comissao.status]}
                            widthClass="w-[7.5rem]"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {comissao.status === 'pago'
                            ? comissao.dataPagamento ?? '—'
                            : comissao.dataPrevista ?? '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}
