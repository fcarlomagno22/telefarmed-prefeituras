import { CheckCircle2, FileText, Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import type {
  ProfissionalFinalizarCadastroEmpresaData,
  ProfissionalFinalizarCadastroProfissionalData,
} from '../../../types/profissionalFinalizarCadastro'
import { ProfissionalFinalizarCadastroContratoModal } from './ProfissionalFinalizarCadastroContratoModal'

type ProfissionalFinalizarCadastroContratoPanelProps = {
  empresa: ProfissionalFinalizarCadastroEmpresaData
  profissional: ProfissionalFinalizarCadastroProfissionalData
  contractOpened: boolean
  contractScrolledToEnd: boolean
  contractAccepted: boolean
  onContractOpened: () => void
  onContractScrolledToEnd: () => void
  onContractAcceptedChange: (accepted: boolean) => void
  readCardAttentionToken?: number
  errors?: {
    contractScrolledToEnd?: string
    contractAccepted?: string
  }
}

const READ_CARD_ATTENTION_MS = 2000

export function ProfissionalFinalizarCadastroContratoPanel({
  empresa,
  profissional,
  contractOpened,
  contractScrolledToEnd,
  contractAccepted,
  onContractOpened,
  onContractScrolledToEnd,
  onContractAcceptedChange,
  readCardAttentionToken = 0,
  errors,
}: ProfissionalFinalizarCadastroContratoPanelProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [readCardAttentionActive, setReadCardAttentionActive] = useState(false)

  useEffect(() => {
    if (readCardAttentionToken <= 0 || contractScrolledToEnd) return

    setReadCardAttentionActive(true)
    const timer = window.setTimeout(() => setReadCardAttentionActive(false), READ_CARD_ATTENTION_MS)
    return () => window.clearTimeout(timer)
  }, [readCardAttentionToken, contractScrolledToEnd])

  function openContract() {
    onContractOpened()
    setModalOpen(true)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50/90 px-3 py-2.5 text-xs leading-relaxed text-sky-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Abra o contrato de prestação de serviços, role até o final e só então confirme que leu
            e aceita os termos.
          </p>
        </div>

        <button
          type="button"
          onClick={openContract}
          className={[
            'flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-4 text-left transition',
            contractScrolledToEnd
              ? 'border-emerald-200 bg-emerald-50/70 hover:border-emerald-300'
              : 'border-gray-200 bg-white hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)]/20',
            readCardAttentionActive ? 'contract-read-card-attention' : '',
          ].join(' ')}
        >
          <span
            className={[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm',
              contractScrolledToEnd
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]',
            ].join(' ')}
          >
            {contractScrolledToEnd ? (
              <CheckCircle2 className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            ) : (
              <FileText className="h-5 w-5" strokeWidth={2} aria-hidden />
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-gray-900">
              {contractOpened ? 'Reabrir contrato' : 'Ler contrato de prestação de serviços'}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-gray-500">
              {contractScrolledToEnd
                ? 'Leitura concluída. Você já pode aceitar os termos abaixo.'
                : 'Clique para abrir o documento. É obrigatório rolar até o final.'}
            </span>
          </span>
        </button>

        {errors?.contractScrolledToEnd ? (
          <p className="text-xs font-medium text-red-600" role="alert">
            {errors.contractScrolledToEnd}
          </p>
        ) : null}

        <label
          className={[
            'flex items-start gap-3 rounded-xl border px-3 py-3 transition',
            contractScrolledToEnd
              ? 'border-gray-100 bg-gray-50/60'
              : 'cursor-not-allowed border-gray-100 bg-gray-50/40 opacity-70',
          ].join(' ')}
        >
          <input
            type="checkbox"
            checked={contractAccepted}
            disabled={!contractScrolledToEnd}
            onChange={(event) => onContractAcceptedChange(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/30 disabled:cursor-not-allowed"
          />
          <span className="text-xs leading-relaxed text-gray-700">
            Li e aceito integralmente o contrato de prestação de serviços profissionais e autorizo o
            tratamento dos dados conforme a LGPD.
          </span>
        </label>

        {!contractScrolledToEnd ? (
          <p className="text-[11px] text-gray-400">
            A confirmação será habilitada após você ler o contrato até o final.
          </p>
        ) : null}

        {errors?.contractAccepted ? (
          <p className="text-xs font-medium text-red-600" role="alert">
            {errors.contractAccepted}
          </p>
        ) : null}
      </div>

      <ProfissionalFinalizarCadastroContratoModal
        open={modalOpen}
        empresa={empresa}
        profissional={profissional}
        onClose={() => setModalOpen(false)}
        onScrolledToEnd={onContractScrolledToEnd}
        hasScrolledToEnd={contractScrolledToEnd}
      />
    </>
  )
}
