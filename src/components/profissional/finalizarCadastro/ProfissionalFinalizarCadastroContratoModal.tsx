import { CheckCircle2, ChevronDown, FileText, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  buildProfissionalFinalizarCadastroContract,
  profissionalFinalizarCadastroContractScrollThreshold_PX,
} from '../../../config/profissionalFinalizarCadastroContract'
import type {
  ProfissionalFinalizarCadastroEmpresaData,
  ProfissionalFinalizarCadastroProfissionalData,
} from '../../../types/profissionalFinalizarCadastro'

type ProfissionalFinalizarCadastroContratoModalProps = {
  open: boolean
  empresa: ProfissionalFinalizarCadastroEmpresaData
  profissional: ProfissionalFinalizarCadastroProfissionalData
  onClose: () => void
  onScrolledToEnd: () => void
  hasScrolledToEnd: boolean
}

export function ProfissionalFinalizarCadastroContratoModal({
  open,
  empresa,
  profissional,
  onClose,
  onScrolledToEnd,
  hasScrolledToEnd,
}: ProfissionalFinalizarCadastroContratoModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [localReachedEnd, setLocalReachedEnd] = useState(hasScrolledToEnd)
  const [showScrollHint, setShowScrollHint] = useState(true)

  const contract = useMemo(
    () => buildProfissionalFinalizarCadastroContract(empresa, profissional),
    [empresa, profissional],
  )

  const evaluateScroll = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const atBottom =
      element.scrollTop + element.clientHeight >=
      element.scrollHeight - profissionalFinalizarCadastroContractScrollThreshold_PX

    if (atBottom) {
      setLocalReachedEnd(true)
      setShowScrollHint(false)
      onScrolledToEnd()
    }
  }, [onScrolledToEnd])

  useEffect(() => {
    if (!open) return

    setShowScrollHint(!hasScrolledToEnd)
    setLocalReachedEnd(hasScrolledToEnd)

    const timer = window.setTimeout(() => {
      evaluateScroll()
    }, 80)

    return () => window.clearTimeout(timer)
  }, [open, hasScrolledToEnd, evaluateScroll, contract])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finalizar-cadastro-contrato-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px]"
        aria-label="Fechar contrato"
        onClick={onClose}
      />

      <div className="relative flex h-[min(92dvh,52rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <header className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-[var(--brand-primary-light)]/60 to-white px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-10">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--brand-primary)] shadow-sm ring-1 ring-gray-100">
              <FileText className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <h2 id="finalizar-cadastro-contrato-title" className="text-xl font-bold text-gray-900">
                {contract.title}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">Versão {contract.version}</p>
            </div>
          </div>
        </header>

        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollRef}
            onScroll={evaluateScroll}
            className="h-full overflow-y-auto px-6 py-6 no-scrollbar sm:px-8"
          >
            <div className="space-y-6 text-sm leading-relaxed text-gray-700 sm:text-[15px]">
              {contract.sections.map((section) => (
                <section key={section.heading}>
                  <h3 className="text-sm font-bold text-gray-900 sm:text-base">{section.heading}</h3>
                  <p className="mt-2 whitespace-pre-line">{section.body}</p>
                </section>
              ))}

              {localReachedEnd ? (
                <div
                  className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-4 shadow-sm"
                  role="status"
                  aria-live="polite"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      Leitura concluída
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-emerald-800">
                      Declaro que li integralmente este contrato e concordo com todos os termos de
                      prestação de serviços profissionais aqui descritos.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {showScrollHint && !localReachedEnd ? (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-4 pt-12"
              aria-hidden
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900/85 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg">
                <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
                Role até o final para aceitar
              </span>
            </div>
          ) : null}
        </div>

        {localReachedEnd ? (
          <footer className="shrink-0 border-t border-emerald-100 bg-emerald-50/50 px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                <p className="text-sm font-medium text-emerald-900">
                  Você leu e concorda com os termos do contrato.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-hover)]"
              >
                Fechar contrato
              </button>
            </div>
          </footer>
        ) : (
          <footer className="shrink-0 border-t border-gray-100 bg-gray-50/80 px-6 py-3">
            <p className="text-center text-xs text-gray-500">
              Leia todo o contrato até o final para concluir a leitura.
            </p>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
