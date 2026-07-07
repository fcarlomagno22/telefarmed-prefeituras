import { ArrowLeftRight, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CrmPartnersClienteDetail } from '../../../types/crmPartnersClientes'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { crmPartnersComissaoStatusBadgeConfig } from '../parceiros/crmPartnersParceirosUi'
import { CrmPartnersClienteContratoStatusBadge } from './CrmPartnersClienteContratoStatusBadge'
import { CrmPartnersClienteTipoBadge } from './CrmPartnersClienteTipoBadge'
import {
  crmPartnersClientesDrawerShellClass,
  formatCrmPartnersCidadeUf,
  formatCrmPartnersCnpj,
  formatCrmPartnersValorPorConsulta,
  formatCrmPartnersCurrency,
  formatCrmPartnersTelefone,
  crmPartnersParticipacaoPorConsultaLabel,
} from './crmPartnersClientesUi'

type CrmPartnersClienteDetailDrawerProps = {
  open: boolean
  closing: boolean
  detail: CrmPartnersClienteDetail | null
  onClose: () => void
  onTransitionEnd: () => void
  onDefineParticipacao: () => void
  onTrocarParceiro: () => void
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}

export function CrmPartnersClienteDetailDrawer({
  open,
  closing,
  detail,
  onClose,
  onTransitionEnd,
  onDefineParticipacao,
  onTrocarParceiro,
}: CrmPartnersClienteDetailDrawerProps) {
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

  const { cliente, contrato, participacao, historicoParceiros, historicoPagamentos } = detail
  const totalParticipacao =
    participacao?.participacoes.reduce((sum, item) => sum + item.valorPorConsulta, 0) ?? 0

  return createPortal(
    <div className="fixed inset-0 z-[10000]">
      <button
        type="button"
        className={[
          'absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity duration-300',
          panelVisible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        aria-label="Fechar detalhes do cliente"
        onClick={onClose}
      />

      <div
        className={[crmPartnersClientesDrawerShellClass, 'max-w-4xl'].join(' ')}
        style={{ transform: panelVisible ? 'translateX(0)' : 'translateX(100%)' }}
        onTransitionEnd={onTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes de ${cliente.razaoSocial}`}
      >
        <header className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                Cliente indicado
              </p>
              <h2 className="mt-1 truncate text-xl font-bold text-gray-900">{cliente.razaoSocial}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <CrmPartnersClienteTipoBadge tipo={cliente.tipo} />
                <CrmPartnersClienteContratoStatusBadge status={contrato.status} />
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
              onClick={onDefineParticipacao}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-semibold text-orange-800 transition hover:bg-orange-100"
            >
              <Users className="h-3.5 w-3.5" />
              Definir participação
            </button>
            <button
              type="button"
              onClick={onTrocarParceiro}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-slate-50"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Trocar parceiro indicador
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <section className="rounded-2xl border border-gray-200 bg-slate-50/60 p-4">
            <h3 className="text-sm font-bold text-gray-900">Dados do cliente</h3>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Razão social" value={cliente.razaoSocial} />
              <DetailField label="CNPJ" value={formatCrmPartnersCnpj(cliente.cnpj)} />
              <DetailField label="Contato" value={cliente.contatoNome} />
              <DetailField label="E-mail" value={cliente.contatoEmail} />
              <DetailField label="Telefone" value={formatCrmPartnersTelefone(cliente.contatoTelefone)} />
              <DetailField
                label="Cidade"
                value={formatCrmPartnersCidadeUf(cliente.cidade, cliente.uf)}
              />
            </dl>
          </section>

          <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-bold text-gray-900">Parceiro indicador</h3>
            <p className="mt-2 text-base font-semibold text-gray-900">{cliente.parceiroIndicadorNome}</p>
            <p className="mt-1 text-sm text-gray-500">
              Responsável comercial que trouxe este cliente para a rede Telefarmed.
            </p>
          </section>

          <section className="mt-4 overflow-hidden rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">
                  Participação na operação
                </p>
                <h3 className="mt-1 text-lg font-bold text-gray-900">
                  {participacao && participacao.participacoes.length > 0
                    ? `${participacao.participacoes.length} parceiro${participacao.participacoes.length === 1 ? '' : 's'} envolvido${participacao.participacoes.length === 1 ? '' : 's'}`
                    : 'Participação não definida'}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{crmPartnersParticipacaoPorConsultaLabel}</p>
              </div>
              <span
                className={[
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  participacao ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600',
                ].join(' ')}
              >
                {cliente.participacaoResumo}
              </span>
            </div>

            {participacao && participacao.participacoes.length > 0 ? (
              <>
                <div className="mt-4 overflow-hidden rounded-xl border border-orange-100 bg-white">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Parceiro
                        </th>
                        <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Valor/consulta
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {participacao.participacoes.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.parceiroNome}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            {formatCrmPartnersValorPorConsulta(item.valorPorConsulta)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-orange-50/60">
                      <tr>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">Total por consulta</td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-orange-800">
                          {formatCrmPartnersValorPorConsulta(totalParticipacao)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailField label="Vigência início" value={participacao.vigenciaInicio} />
                  <DetailField label="Definida em" value={participacao.definidaEm} />
                  {participacao.observacoes ? (
                    <div className="sm:col-span-2">
                      <DetailField label="Observações" value={participacao.observacoes} />
                    </div>
                  ) : null}
                </dl>
              </>
            ) : (
              <p className="mt-3 text-sm text-gray-600">
                Defina os parceiros envolvidos na operação deste cliente e o valor fixo que cada um
                receberá por consulta realizada.
              </p>
            )}
          </section>

          <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-bold text-gray-900">Contrato</h3>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <DetailField label="Valor mensal" value={formatCrmPartnersCurrency(contrato.valorMensal)} />
              <DetailField label="Data início" value={contrato.dataInicio} />
              <DetailField label="Status" value={contrato.status} />
            </dl>
          </section>

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
                      Início
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Fim
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Motivo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {historicoParceiros.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.parceiroNome}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.dataInicio}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.dataFim ?? 'Atual'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.motivo ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 pb-2">
            <h3 className="text-sm font-bold text-gray-900">Histórico de repasses por participação</h3>
            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Referência
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Parceiro
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
                  {historicoPagamentos.map((pagamento) => (
                    <tr key={pagamento.id}>
                      <td className="px-4 py-3 text-sm text-gray-700">{pagamento.referencia}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{pagamento.parceiroNome}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {formatCrmPartnersCurrency(pagamento.valor)}
                      </td>
                      <td className="px-4 py-3">
                        <SituationStatusBadge
                          config={crmPartnersComissaoStatusBadgeConfig[pagamento.status]}
                          widthClass="w-[7.5rem]"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {pagamento.status === 'pago'
                          ? pagamento.dataPagamento ?? '—'
                          : pagamento.dataPrevista ?? '—'}
                      </td>
                    </tr>
                  ))}
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
