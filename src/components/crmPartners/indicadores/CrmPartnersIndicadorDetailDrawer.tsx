import {
  Calculator,
  Download,
  Handshake,
  Paperclip,
  UserPlus,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CrmPartnersIndicadorDetail } from '../../../types/crmPartnersIndicadores'
import { CrmPartnersIndicadorNfPanel } from './CrmPartnersIndicadorNfPanel'
import { CrmPartnersIndicadorStatusBadge } from './CrmPartnersIndicadorStatusBadge'
import {
  crmPartnersIndicadoresDrawerShellClass,
  formatCrmPartnersIndicadoresCurrency,
} from './crmPartnersIndicadoresUi'

type CrmPartnersIndicadorDetailDrawerProps = {
  open: boolean
  closing: boolean
  detail: CrmPartnersIndicadorDetail | null
  onClose: () => void
  onTransitionEnd: () => void
  onConfirmarNfEmitida: () => void
  onAnexarNf: (file: File) => void
  onAction: (action: CrmPartnersIndicadorDrawerAction) => void
}

export type CrmPartnersIndicadorDrawerAction =
  | 'ver_calculo'
  | 'cadastrar_parceiro'
  | 'registrar_repasse'
  | 'baixar_comprovante'

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}

export function CrmPartnersIndicadorDetailDrawer({
  open,
  closing,
  detail,
  onClose,
  onTransitionEnd,
  onConfirmarNfEmitida,
  onAnexarNf,
  onAction,
}: CrmPartnersIndicadorDetailDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [showCalculo, setShowCalculo] = useState(false)
  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      setShowCalculo(false)
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

  const { row, parceiros } = detail
  const canBaixarComprovante = Boolean(detail.comprovantePagamento)
  const showNfPanel =
    row.status !== 'pago' &&
    row.status !== 'aguardando_cliente_pagar' &&
    row.status !== 'previsto'

  return createPortal(
    <div className="fixed inset-0 z-[10000]">
      <button
        type="button"
        className={[
          'absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity duration-300',
          panelVisible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        aria-label="Fechar detalhes financeiros"
        onClick={onClose}
      />

      <div
        className={[crmPartnersIndicadoresDrawerShellClass, 'max-w-3xl'].join(' ')}
        style={{ transform: panelVisible ? 'translateX(0)' : 'translateX(100%)' }}
        onTransitionEnd={onTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes de ${row.cliente}`}
      >
        <header className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                Financeiro
              </p>
              <h2 className="mt-1 truncate text-xl font-bold text-gray-900">{row.cliente}</h2>
              <div className="mt-2">
                <CrmPartnersIndicadorStatusBadge status={row.status} />
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
              onClick={() => {
                setShowCalculo((current) => !current)
                onAction('ver_calculo')
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-semibold text-violet-800 transition hover:bg-violet-100"
            >
              <Calculator className="h-3.5 w-3.5" />
              Ver cálculo
            </button>
            <button
              type="button"
              onClick={() => onAction('cadastrar_parceiro')}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-slate-50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Cadastrar parceiro
            </button>
            <button
              type="button"
              onClick={() => onAction('registrar_repasse')}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-800 transition hover:bg-sky-100"
            >
              <Handshake className="h-3.5 w-3.5" />
              Registrar repasse
            </button>
            <button
              type="button"
              disabled={!canBaixarComprovante}
              onClick={() => onAction('baixar_comprovante')}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar comprovante
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {showNfPanel ? (
            <CrmPartnersIndicadorNfPanel
              detail={detail}
              onConfirmarEmissao={onConfirmarNfEmitida}
              onAnexarNf={onAnexarNf}
            />
          ) : null}

          {showCalculo ? (
            <section
              className={[
                'rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-white to-purple-50 p-4',
                showNfPanel ? 'mt-4' : '',
              ].join(' ')}
            >
              <h3 className="text-sm font-bold text-gray-900">Cálculo da comissão</h3>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-violet-100 bg-white px-4 py-3">
                  <dt className="text-sm text-gray-600">Valor recebido pela Telefarmed</dt>
                  <dd className="text-sm font-bold text-gray-900">
                    {formatCrmPartnersIndicadoresCurrency(detail.valorRecebidoTelefarmed)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-violet-100 bg-white px-4 py-3">
                  <dt className="text-sm text-gray-600">
                    Percentual da comissão ({detail.percentualComissao}%)
                  </dt>
                  <dd className="text-sm font-bold text-gray-900">
                    {formatCrmPartnersIndicadoresCurrency(detail.comissaoBrutaVendedor)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-violet-100 bg-white px-4 py-3">
                  <dt className="text-sm text-gray-600">Total parceiros vinculados</dt>
                  <dd className="text-sm font-bold text-red-600">
                    − {formatCrmPartnersIndicadoresCurrency(row.valorParceiros)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-violet-300 bg-violet-50 px-4 py-3">
                  <dt className="text-sm font-semibold text-violet-900">Valor líquido do vendedor</dt>
                  <dd className="text-base font-bold text-violet-900">
                    {formatCrmPartnersIndicadoresCurrency(detail.valorLiquidoVendedor)}
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}

          <section
            className={[
              'rounded-2xl border border-gray-200 bg-slate-50/60 p-4',
              showNfPanel || showCalculo ? 'mt-4' : '',
            ].join(' ')}
          >
            <h3 className="text-sm font-bold text-gray-900">Resumo financeiro</h3>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Cliente" value={row.cliente} />
              <DetailField
                label="Valor recebido pela Telefarmed"
                value={formatCrmPartnersIndicadoresCurrency(detail.valorRecebidoTelefarmed)}
              />
              <DetailField label="Percentual da comissão" value={`${detail.percentualComissao}%`} />
              <DetailField
                label="Comissão bruta do vendedor"
                value={formatCrmPartnersIndicadoresCurrency(detail.comissaoBrutaVendedor)}
              />
              <DetailField
                label="Valor líquido do vendedor"
                value={formatCrmPartnersIndicadoresCurrency(detail.valorLiquidoVendedor)}
              />
              <DetailField
                label="Data prevista de pagamento"
                value={detail.dataPrevistaPagamento ?? '—'}
              />
              <DetailField
                label="Nota fiscal"
                value={detail.notaFiscal ?? 'Não enviada'}
              />
              <DetailField
                label="Comprovante de pagamento"
                value={detail.comprovantePagamento ?? 'Indisponível'}
              />
            </dl>
          </section>

          <section className="mt-4 overflow-hidden rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">
                  Parceiros vinculados
                </p>
                <h3 className="mt-1 text-lg font-bold text-gray-900">
                  {parceiros.length > 0
                    ? `${parceiros.length} parceiro${parceiros.length === 1 ? '' : 's'}`
                    : 'Nenhum parceiro vinculado'}
                </h3>
              </div>
              <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-800">
                {formatCrmPartnersIndicadoresCurrency(row.valorParceiros)} a repassar
              </span>
            </div>

            {parceiros.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-orange-100 bg-white">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Parceiro
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parceiros.map((parceiro) => (
                      <tr key={parceiro.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {parceiro.nome}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {formatCrmPartnersIndicadoresCurrency(parceiro.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-orange-50/60">
                    <tr>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">Total</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-orange-800">
                        {formatCrmPartnersIndicadoresCurrency(row.valorParceiros)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-600">
                Nenhum parceiro vinculado a esta comissão. Use &quot;Cadastrar parceiro&quot; para
                incluir participantes no repasse.
              </p>
            )}
          </section>

          {detail.notaFiscal || detail.comprovantePagamento ? (
            <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-bold text-gray-900">Documentos</h3>
              <ul className="mt-3 space-y-2">
                {detail.notaFiscal ? (
                  <li className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                    <Paperclip className="h-4 w-4 shrink-0 text-gray-400" />
                    {detail.notaFiscal}
                  </li>
                ) : null}
                {detail.comprovantePagamento ? (
                  <li className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                    <Paperclip className="h-4 w-4 shrink-0 text-gray-400" />
                    {detail.comprovantePagamento}
                  </li>
                ) : null}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
