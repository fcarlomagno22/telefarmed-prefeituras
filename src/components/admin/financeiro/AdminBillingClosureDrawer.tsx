import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AdminFechamentoCompetenciaRow } from '../../../types/adminFinanceiro'

type AdminBillingClosureDrawerProps = {
  open: boolean
  closing: boolean
  row: AdminFechamentoCompetenciaRow | null
  onClose: () => void
  onTransitionEnd: () => void
  onConfirmCloseCompetencia: (id: string) => void
}

type BillingStep = 'conferencia' | 'ajustes' | 'confirmacao'

const steps: { id: BillingStep; label: string }[] = [
  { id: 'conferencia', label: 'Conferência' },
  { id: 'ajustes', label: 'Ajustes' },
  { id: 'confirmacao', label: 'Confirmação' },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function AdminBillingClosureDrawer({
  open,
  closing,
  row,
  onClose,
  onTransitionEnd,
  onConfirmCloseCompetencia,
}: AdminBillingClosureDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [step, setStep] = useState<BillingStep>('conferencia')
  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    // Para evitar cascading renders, atualiza o estado de animação/step no próximo frame.
    let frameId: number | null = null
    if (!open) {
      frameId = requestAnimationFrame(() => {
        setEntered(false)
        setStep('conferencia')
      })
      return () => {
        if (frameId !== null) cancelAnimationFrame(frameId)
      }
    }

    frameId = requestAnimationFrame(() => setEntered(true))
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
    }
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

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  if (!isActive || !row) return null

  const activeStepIndex = steps.findIndex((current) => current.id === step)

  return createPortal(
    <div
      className={`fixed inset-0 z-[9996] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/30 transition-opacity ${
          panelVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Fechar fechamento de competência"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-billing-closure-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-[-12px_0_40px_rgba(0,0,0,0.1)] transition-transform duration-300 ${
          panelVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id="admin-billing-closure-title" className="text-lg font-bold text-gray-900">
              Fechamento da competência {row.competencia}
            </h2>
            <p className="text-xs text-gray-500">
              {row.prefeitura} · {row.contratoNumero}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="border-b border-gray-200 px-5 py-3">
          <div className="flex gap-2">
            {steps.map((current, index) => {
              const isDone = index < activeStepIndex
              const isCurrent = index === activeStepIndex
              return (
                <button
                  key={current.id}
                  type="button"
                  onClick={() => setStep(current.id)}
                  className={[
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                    isCurrent
                      ? 'bg-[var(--brand-primary)] text-white'
                      : isDone
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-600',
                  ].join(' ')}
                >
                  {index + 1}. {current.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {step === 'conferencia' ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900">1. Conferência de consumo</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <article className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Modalidade</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{row.modalidade}</p>
                </article>
                <article className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Consumo do ciclo</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {row.consumoPercentual !== null ? `${row.consumoPercentual}%` : 'Sob demanda'}
                  </p>
                </article>
                <article className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ultrapassagem</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {row.excedeuLimite ? 'Acima do limite contratado' : 'Dentro do limite'}
                  </p>
                </article>
                <article className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Valor base</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(row.valorBase)}</p>
                </article>
              </div>
            </div>
          ) : null}

          {step === 'ajustes' ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900">2. Ajustes e memória de cálculo</h3>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-600">Valor base da competência</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(row.valorBase)}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-600">Excedente por ultrapassagem</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(row.valorExcedente)}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-600">Ajustes operacionais</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(row.ajustes)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-gray-900">Valor final do faturamento</td>
                      <td className="px-4 py-3 text-right text-base font-bold text-[var(--brand-primary)]">
                        {formatCurrency(row.valorFinal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {step === 'confirmacao' ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900">3. Confirmação e bloqueio da competência</h3>
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Ao confirmar o fechamento, os valores da competência são congelados para emissão da nota e envio da cobrança.
              </p>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Resumo final</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {row.prefeitura} · {row.contratoNumero} · {row.competencia}
                </p>
                <p className="mt-2 text-lg font-bold text-gray-900">{formatCurrency(row.valorFinal)}</p>
              </div>
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={() =>
              setStep((current) => {
                if (current === 'confirmacao') return 'ajustes'
                if (current === 'ajustes') return 'conferencia'
                return current
              })
            }
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={step === 'conferencia'}
          >
            Voltar
          </button>

          <div className="flex items-center gap-2">
            {step !== 'confirmacao' ? (
              <button
                type="button"
                onClick={() =>
                  setStep((current) => (current === 'conferencia' ? 'ajustes' : 'confirmacao'))
                }
                className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                Próximo passo
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onConfirmCloseCompetencia(row.id)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Fechar competência
              </button>
            )}
          </div>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
