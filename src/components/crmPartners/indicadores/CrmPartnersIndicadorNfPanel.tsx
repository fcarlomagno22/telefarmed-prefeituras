import { Check, CloudUpload, Copy, FileText } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CrmPartnersIndicadorDetail } from '../../../types/crmPartnersIndicadores'
import {
  CRM_PARTNERS_NF_ACCEPT,
  CRM_PARTNERS_TELEFARMED_NF_DESTINATARIO,
  buildCrmPartnersNfDescricaoServico,
  buildCrmPartnersNfObservacoes,
  formatCrmPartnersIndicadoresCurrency,
} from './crmPartnersIndicadoresUi'

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      document.body.removeChild(textarea)
      return copied
    } catch {
      return false
    }
  }
}

type CrmPartnersIndicadorNfPanelProps = {
  detail: CrmPartnersIndicadorDetail
  onConfirmarEmissao: () => void
  onAnexarNf: (file: File) => void
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const success = await copyToClipboard(value)
    if (!success) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <p className="mt-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-gray-800">
        {value}
      </p>
    </div>
  )
}

export function CrmPartnersIndicadorNfPanel({
  detail,
  onConfirmarEmissao,
  onAnexarNf,
}: CrmPartnersIndicadorNfPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [confirmouEmissao, setConfirmouEmissao] = useState(detail.row.nfEmitida)

  useEffect(() => {
    setConfirmouEmissao(detail.row.nfEmitida)
  }, [detail.row.id, detail.row.nfEmitida])

  const { row } = detail
  const valorEmitir = detail.comissaoBrutaVendedor
  const observacoes = buildCrmPartnersNfObservacoes({
    cliente: row.cliente,
    percentualComissao: detail.percentualComissao,
    valorRecebidoTelefarmed: detail.valorRecebidoTelefarmed,
    dataPagamentoTelefarmed: detail.dataPagamentoTelefarmed,
  })
  const descricaoServico = buildCrmPartnersNfDescricaoServico(row.cliente)
  const podeAnexar = row.nfEmitida && row.nfStatus !== 'aprovada'
  const nfAnexada = Boolean(detail.notaFiscal)

  function handleFile(file: File | undefined) {
    if (!file) return
    const isValidType =
      file.type === 'application/pdf' ||
      file.type === 'application/xml' ||
      file.type === 'text/xml' ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.xml')
    if (!isValidType) return
    onAnexarNf(file)
  }

  function handleConfirmarEmissao() {
    if (!confirmouEmissao) return
    onConfirmarEmissao()
  }

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="border-b border-orange-100 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">
              Nota fiscal
            </p>
            <h3 className="mt-0.5 text-base font-bold text-gray-900">
              Emita e anexe a NF com os dados abaixo
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Use as informações orientadas para emitir a nota no seu sistema e depois anexe o PDF ou
              XML aqui.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div className="rounded-xl border border-orange-100 bg-white p-4">
          <h4 className="text-sm font-bold text-gray-900">1. Dados para emissão</h4>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Valor da nota
              </dt>
              <dd className="mt-1 text-lg font-bold text-orange-800">
                {formatCrmPartnersIndicadoresCurrency(valorEmitir)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Destinatário
              </dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">
                {CRM_PARTNERS_TELEFARMED_NF_DESTINATARIO.razaoSocial}
              </dd>
              <dd className="text-xs text-gray-600">
                CNPJ {CRM_PARTNERS_TELEFARMED_NF_DESTINATARIO.cnpj}
              </dd>
            </div>
          </dl>

          <div className="mt-4 space-y-3">
            <CopyField label="Descrição do serviço" value={descricaoServico} />
            <CopyField label="Campo observações" value={observacoes} />
          </div>

          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
            <span className="font-semibold">Importante:</span> o valor da nota deve ser exatamente{' '}
            <span className="font-bold">{formatCrmPartnersIndicadoresCurrency(valorEmitir)}</span>.
            No campo observações, utilize o texto acima para facilitar a conciliação do pagamento.
          </div>
        </div>

        <div className="rounded-xl border border-orange-100 bg-white p-4">
          <h4 className="text-sm font-bold text-gray-900">2. Confirme a emissão</h4>
          <p className="mt-1 text-sm text-gray-600">
            Após emitir a nota fiscal no seu emissor, confirme abaixo para liberar o anexo no sistema.
          </p>

          <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3">
            <input
              type="checkbox"
              checked={confirmouEmissao}
              disabled={row.nfEmitida}
              onChange={(event) => setConfirmouEmissao(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/30 disabled:opacity-60"
            />
            <span className="text-sm text-gray-700">
              Confirmo que emiti a nota fiscal no valor de{' '}
              <span className="font-semibold text-gray-900">
                {formatCrmPartnersIndicadoresCurrency(valorEmitir)}
              </span>{' '}
              com os dados orientados acima.
            </span>
          </label>

          {!row.nfEmitida ? (
            <button
              type="button"
              disabled={!confirmouEmissao}
              onClick={handleConfirmarEmissao}
              className="btn-brand-gradient mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              Marcar nota como emitida
            </button>
          ) : (
            <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              <Check className="h-4 w-4" />
              Nota fiscal marcada como emitida
            </p>
          )}
        </div>

        <div className="rounded-xl border border-orange-100 bg-white p-4">
          <h4 className="text-sm font-bold text-gray-900">3. Anexe a nota no sistema</h4>
          <p className="mt-1 text-sm text-gray-600">
            {podeAnexar
              ? 'Envie o arquivo PDF ou XML da nota fiscal emitida.'
              : row.nfStatus === 'aprovada'
                ? 'A nota fiscal deste registro já foi aprovada.'
                : 'Confirme a emissão acima para liberar o anexo.'}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={CRM_PARTNERS_NF_ACCEPT}
            className="sr-only"
            disabled={!podeAnexar}
            onChange={(event) => {
              handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />

          <div
            onDragEnter={(event) => {
              if (!podeAnexar) return
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault()
              setIsDragging(false)
            }}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              if (!podeAnexar) return
              handleFile(event.dataTransfer.files[0])
            }}
            className={[
              'mt-3 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition',
              !podeAnexar
                ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                : isDragging
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/40'
                  : 'border-gray-200 bg-gray-50/50 hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)]/10',
            ].join(' ')}
          >
            <CloudUpload className="h-7 w-7 text-[var(--brand-primary)]" aria-hidden />
            <p className="mt-2 text-sm text-gray-700">
              {nfAnexada ? (
                <>
                  Arquivo anexado:{' '}
                  <span className="font-semibold text-gray-900">{detail.notaFiscal}</span>
                </>
              ) : (
                <>
                  Arraste a NF ou{' '}
                  <button
                    type="button"
                    disabled={!podeAnexar}
                    onClick={() => fileInputRef.current?.click()}
                    className="font-semibold text-[var(--brand-primary)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    selecione o arquivo
                  </button>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-gray-500">Formatos aceitos: PDF ou XML</p>
            {detail.notaFiscalAnexadaEm ? (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                Anexada em {detail.notaFiscalAnexadaEm}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
