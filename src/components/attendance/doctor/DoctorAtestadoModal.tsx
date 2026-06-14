import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileSignature, Stethoscope, X } from 'lucide-react'
import { Toast } from '../../ui/Toast'
import type {
  DoctorExamRequestDoctorInfo,
  DoctorExamRequestPatientInfo,
} from './DoctorExamRequestModal'

type DoctorAtestadoModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: {
    diasAfastamento: number
    dataInicio: string
    cid?: string
    motivo: string
    observacoes?: string
  }) => void | Promise<void>
  patient: DoctorExamRequestPatientInfo
  doctor: DoctorExamRequestDoctorInfo
}

const panelClass =
  'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm'

export function DoctorAtestadoModal({
  open,
  onClose,
  onSigned,
  patient,
  doctor,
}: DoctorAtestadoModalProps) {
  const [diasAfastamento, setDiasAfastamento] = useState(1)
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().slice(0, 10))
  const [cid, setCid] = useState('')
  const [motivo, setMotivo] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [successToastVisible, setSuccessToastVisible] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (open) return
    setDiasAfastamento(1)
    setDataInicio(new Date().toISOString().slice(0, 10))
    setCid('')
    setMotivo('')
    setObservacoes('')
    setValidationHint(null)
  }, [open])

  if (!open) return null

  async function handleSign() {
    if (!motivo.trim()) {
      setValidationHint('Informe o motivo do afastamento.')
      return
    }

    setSigning(true)
    setValidationHint(null)
    try {
      await onSigned?.({
        diasAfastamento,
        dataInicio,
        cid: cid.trim() || undefined,
        motivo: motivo.trim(),
        observacoes: observacoes.trim() || undefined,
      })
      setSuccessToastVisible(true)
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir o atestado.')
    } finally {
      setSigning(false)
    }
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-[2px]" onClick={() => !signing && onClose()} />
      <div className="fixed inset-0 z-[121] flex items-center justify-center p-4">
        <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#f5f6f8] shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Emitir atestado médico</h2>
              <p className="mt-1 text-sm text-gray-500">
                {patient.name} · {patient.cpfMasked}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={signing}
              className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className={panelClass}>
              <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Profissional</p>
              </div>
              <div className="space-y-2 p-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{doctor.name}</p>
                <p>{doctor.specialty}</p>
                <p className="text-xs text-gray-500">{doctor.crm}</p>
              </div>
            </aside>

            <section className={panelClass}>
              <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Stethoscope className="h-4 w-4 text-[var(--brand-primary)]" />
                  Dados do atestado
                </div>
              </div>

              <div className="space-y-4 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-gray-800">Dias de afastamento</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={diasAfastamento}
                      onChange={(event) => setDiasAfastamento(Number(event.target.value) || 1)}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-gray-800">Data de início</span>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(event) => setDataInicio(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)]"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-800">CID (opcional)</span>
                  <input
                    type="text"
                    value={cid}
                    onChange={(event) => setCid(event.target.value)}
                    placeholder="Ex.: J06.9"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-800">Motivo do afastamento</span>
                  <textarea
                    value={motivo}
                    onChange={(event) => setMotivo(event.target.value)}
                    rows={3}
                    placeholder="Descreva o motivo clínico do afastamento..."
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-800">Observações (opcional)</span>
                  <textarea
                    value={observacoes}
                    onChange={(event) => setObservacoes(event.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)]"
                  />
                </label>

                {validationHint ? (
                  <p className="text-sm font-medium text-red-600" role="alert">
                    {validationHint}
                  </p>
                ) : null}
              </div>

              <div className="mt-auto border-t border-gray-100 bg-gray-50/60 px-4 py-3.5">
                <button
                  type="button"
                  disabled={signing}
                  onClick={() => void handleSign()}
                  className="btn-brand-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
                >
                  <FileSignature className="h-4 w-4" />
                  {signing ? 'Gerando PDF…' : 'Assinar e emitir atestado'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Toast
        message="Atestado emitido com sucesso."
        visible={successToastVisible}
        onClose={() => setSuccessToastVisible(false)}
        variant="success"
      />
    </>,
    document.body,
  )
}
