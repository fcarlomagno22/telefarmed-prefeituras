import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarCheck, FileSignature, Stethoscope, X } from 'lucide-react'
import { Toast } from '../../ui/Toast'
import { CidSearchField, type CidSelection } from './CidSearchField'
import type {
  DoctorExamRequestDoctorInfo,
  DoctorExamRequestPatientInfo,
} from './DoctorExamRequestModal'
import type { AtestadoTipo } from '../../../types/clinicalDocument'

export type DoctorAtestadoSignedPayload = {
  tipo: AtestadoTipo
  dataInicio: string
  diasAfastamento?: number
  cid?: string
  cidDescricao?: string
  motivo?: string
  observacoes?: string
}

type DoctorAtestadoModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: DoctorAtestadoSignedPayload) => void | Promise<void>
  patient: DoctorExamRequestPatientInfo
  doctor: DoctorExamRequestDoctorInfo
}

const panelClass =
  'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm'

const TIPO_OPTIONS: Array<{
  value: AtestadoTipo
  label: string
  description: string
}> = [
  {
    value: 'afastamento',
    label: 'Afastamento',
    description: 'Declara período de afastamento das atividades.',
  },
  {
    value: 'comparecimento',
    label: 'Comparecimento',
    description: 'Declara presença do paciente na consulta.',
  },
]

export function DoctorAtestadoModal({
  open,
  onClose,
  onSigned,
  patient,
  doctor,
}: DoctorAtestadoModalProps) {
  const [tipo, setTipo] = useState<AtestadoTipo>('afastamento')
  const [diasAfastamento, setDiasAfastamento] = useState(1)
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().slice(0, 10))
  const [cidSelection, setCidSelection] = useState<CidSelection | null>(null)
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
    setTipo('afastamento')
    setDiasAfastamento(1)
    setDataInicio(new Date().toISOString().slice(0, 10))
    setCidSelection(null)
    setMotivo('')
    setObservacoes('')
    setValidationHint(null)
  }, [open])

  if (!open) return null

  async function handleSign() {
    if (tipo === 'afastamento' && !motivo.trim()) {
      setValidationHint('Informe o motivo do afastamento.')
      return
    }

    setSigning(true)
    setValidationHint(null)

    try {
      const payload: DoctorAtestadoSignedPayload = {
        tipo,
        dataInicio,
        cid: cidSelection?.code,
        cidDescricao: cidSelection?.title,
        observacoes: observacoes.trim() || undefined,
      }

      if (tipo === 'afastamento') {
        payload.diasAfastamento = diasAfastamento
        payload.motivo = motivo.trim()
      }

      await onSigned?.(payload)
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
      <div
        className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-[2px]"
        onClick={() => !signing && onClose()}
      />
      <div className="fixed inset-0 z-[121] flex items-center justify-center p-4">
        <div className="flex max-h-[92vh] w-[92vw] max-w-[1080px] flex-col overflow-hidden rounded-2xl bg-[#f5f6f8] shadow-2xl">
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

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[280px_minmax(0,1fr)]">
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
                <div>
                  <span className="mb-2 block text-xs font-semibold text-gray-800">Tipo de atestado</span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {TIPO_OPTIONS.map((option) => {
                      const selected = tipo === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={signing}
                          onClick={() => setTipo(option.value)}
                          className={[
                            'rounded-xl border px-3.5 py-3 text-left transition',
                            selected
                              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 shadow-sm ring-1 ring-[var(--brand-primary)]/20'
                              : 'border-gray-200 bg-white hover:border-gray-300',
                          ].join(' ')}
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <CalendarCheck
                              className={[
                                'h-4 w-4',
                                selected ? 'text-[var(--brand-primary)]' : 'text-gray-400',
                              ].join(' ')}
                            />
                            {option.label}
                          </span>
                          <span className="mt-1 block text-xs leading-snug text-gray-500">
                            {option.description}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {tipo === 'afastamento' ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-gray-800">
                        Dias de afastamento
                      </span>
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
                ) : (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-gray-800">
                      Data do comparecimento
                    </span>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(event) => setDataInicio(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)]"
                    />
                  </label>
                )}

                <CidSearchField
                  value={cidSelection}
                  onChange={setCidSelection}
                  disabled={signing}
                />

                {tipo === 'afastamento' ? (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-gray-800">
                      Motivo do afastamento
                    </span>
                    <textarea
                      value={motivo}
                      onChange={(event) => setMotivo(event.target.value)}
                      rows={3}
                      placeholder="Descreva o motivo clínico do afastamento..."
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)]"
                    />
                  </label>
                ) : null}

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-800">
                    Observações (opcional)
                  </span>
                  <textarea
                    value={observacoes}
                    onChange={(event) => setObservacoes(event.target.value)}
                    rows={2}
                    placeholder={
                      tipo === 'comparecimento'
                        ? 'Ex.: horário da consulta, local, observações adicionais…'
                        : 'Informações complementares para o documento…'
                    }
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
                  {signing
                    ? 'Gerando PDF…'
                    : tipo === 'comparecimento'
                      ? 'Assinar atestado de comparecimento'
                      : 'Assinar atestado de afastamento'}
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
        durationMs={2000}
      />
    </>,
    document.body,
  )
}
