import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { BedDouble, FileSignature, Stethoscope, X } from 'lucide-react'
import { Toast } from '../../ui/Toast'
import { CidSearchField, type CidSelection } from './CidSearchField'
import type {
  DoctorExamRequestDoctorInfo,
  DoctorExamRequestPatientInfo,
} from './DoctorExamRequestModal'

export type InternacaoTipo =
  | 'clinica'
  | 'cirurgica'
  | 'obstetrica'
  | 'pediatrica'
  | 'psiquiatrica'
  | 'uti'

export type InternacaoCarater = 'eletiva' | 'urgencia' | 'emergencia'

export type DoctorInternacaoSignedPayload = {
  tipoInternacao: InternacaoTipo
  caraterInternacao: InternacaoCarater
  unidadeDestino: string
  motivoInternacao: string
  justificativaClinica: string
  historiaClinica: string
  exameFisico: string
  hipoteseDiagnostica: string
  cid?: string
  cidDescricao?: string
  examesComplementares?: string
  tratamentosEMedicacoes: string
  condutaAdotada?: string
  procedimentoPrincipalPrevisto?: string
  tempoEstimadoInternacao?: string
  observacoes?: string
}

type DoctorInternacaoModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: DoctorInternacaoSignedPayload) => void | Promise<void>
  patient: DoctorExamRequestPatientInfo
  doctor: DoctorExamRequestDoctorInfo
}

const panelClass =
  'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm'

const TIPO_OPTIONS: Array<{
  value: InternacaoTipo
  label: string
  description: string
}> = [
  { value: 'clinica', label: 'Clínica', description: 'Tratamento clínico' },
  { value: 'cirurgica', label: 'Cirúrgica', description: 'Procedimento cirúrgico' },
  { value: 'obstetrica', label: 'Obstétrica', description: 'Parto / gestação' },
  { value: 'pediatrica', label: 'Pediátrica', description: 'Cuidado infantil' },
  { value: 'psiquiatrica', label: 'Psiquiátrica', description: 'Saúde mental' },
  { value: 'uti', label: 'UTI', description: 'Terapia intensiva' },
]

const CARATER_OPTIONS: Array<{
  value: InternacaoCarater
  label: string
  chipClass: string
}> = [
  { value: 'eletiva', label: 'Eletiva', chipClass: 'border-slate-200 bg-slate-50 text-slate-700' },
  {
    value: 'urgencia',
    label: 'Urgência',
    chipClass: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  {
    value: 'emergencia',
    label: 'Emergência',
    chipClass: 'border-rose-200 bg-rose-50 text-rose-800',
  },
]

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600/90">{children}</p>
  )
}

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-[11px] leading-snug text-gray-400">{children}</p>
}

export function DoctorInternacaoModal({
  open,
  onClose,
  onSigned,
  patient,
  doctor,
}: DoctorInternacaoModalProps) {
  const [tipoInternacao, setTipoInternacao] = useState<InternacaoTipo>('clinica')
  const [caraterInternacao, setCaraterInternacao] = useState<InternacaoCarater>('eletiva')
  const [unidadeDestino, setUnidadeDestino] = useState('')
  const [motivoInternacao, setMotivoInternacao] = useState('')
  const [justificativaClinica, setJustificativaClinica] = useState('')
  const [historiaClinica, setHistoriaClinica] = useState('')
  const [exameFisico, setExameFisico] = useState('')
  const [hipoteseDiagnostica, setHipoteseDiagnostica] = useState('')
  const [cidSelection, setCidSelection] = useState<CidSelection | null>(null)
  const [examesComplementares, setExamesComplementares] = useState('')
  const [tratamentosEMedicacoes, setTratamentosEMedicacoes] = useState('')
  const [condutaAdotada, setCondutaAdotada] = useState('')
  const [procedimentoPrincipalPrevisto, setProcedimentoPrincipalPrevisto] = useState('')
  const [tempoEstimadoInternacao, setTempoEstimadoInternacao] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)
  const [successToastVisible, setSuccessToastVisible] = useState(false)

  useEffect(() => {
    if (!open) return
    setTipoInternacao('clinica')
    setCaraterInternacao('eletiva')
    setUnidadeDestino('')
    setMotivoInternacao('')
    setJustificativaClinica('')
    setHistoriaClinica('')
    setExameFisico('')
    setHipoteseDiagnostica('')
    setCidSelection(null)
    setExamesComplementares('')
    setTratamentosEMedicacoes('')
    setCondutaAdotada('')
    setProcedimentoPrincipalPrevisto('')
    setTempoEstimadoInternacao('')
    setObservacoes('')
    setSigning(false)
    setValidationHint(null)
    setSuccessToastVisible(false)
  }, [open])

  async function handleSign() {
    if (!unidadeDestino.trim()) {
      setValidationHint('Informe a unidade hospitalar de destino.')
      return
    }
    if (!motivoInternacao.trim()) {
      setValidationHint('Descreva o motivo da solicitação de internação.')
      return
    }
    if (!justificativaClinica.trim()) {
      setValidationHint('Justifique clinicamente a indicação de internação.')
      return
    }
    if (!historiaClinica.trim()) {
      setValidationHint('Preencha a história clínica resumida.')
      return
    }
    if (!exameFisico.trim()) {
      setValidationHint('Descreva o exame físico ou avaliação clínica.')
      return
    }
    if (!hipoteseDiagnostica.trim()) {
      setValidationHint('Informe a hipótese diagnóstica.')
      return
    }
    if (!tratamentosEMedicacoes.trim()) {
      setValidationHint('Informe os tratamentos e medicações em uso.')
      return
    }

    setSigning(true)
    setValidationHint(null)

    try {
      const payload: DoctorInternacaoSignedPayload = {
        tipoInternacao,
        caraterInternacao,
        unidadeDestino: unidadeDestino.trim(),
        motivoInternacao: motivoInternacao.trim(),
        justificativaClinica: justificativaClinica.trim(),
        historiaClinica: historiaClinica.trim(),
        exameFisico: exameFisico.trim(),
        hipoteseDiagnostica: hipoteseDiagnostica.trim(),
        cid: cidSelection?.code,
        cidDescricao: cidSelection?.title,
        examesComplementares: examesComplementares.trim() || undefined,
        tratamentosEMedicacoes: tratamentosEMedicacoes.trim(),
        condutaAdotada: condutaAdotada.trim() || undefined,
        procedimentoPrincipalPrevisto: procedimentoPrincipalPrevisto.trim() || undefined,
        tempoEstimadoInternacao: tempoEstimadoInternacao.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      }

      await onSigned?.(payload)
      setSuccessToastVisible(true)
      onClose()
    } catch {
      setValidationHint('Não foi possível concluir a solicitação de internação.')
    } finally {
      setSigning(false)
    }
  }

  if (!open) return null

  const textareaClass =
    'w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20'

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-[2px]"
        onClick={() => !signing && onClose()}
      />
      <div className="fixed inset-0 z-[121] flex items-center justify-center p-3 sm:p-4">
        <div className="flex max-h-[94vh] w-[96vw] max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-[#f5f6f8] shadow-2xl">
          <div className="flex items-center justify-between border-b border-rose-100 bg-gradient-to-r from-rose-50 via-white to-white px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md shadow-rose-200/60">
                  <BedDouble className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Internação</h2>
                  <p className="text-sm text-gray-500">
                    Solicitação de internação hospitalar para regulação
                  </p>
                </div>
              </div>
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

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
              <div className={panelClass}>
                <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Paciente
                  </p>
                </div>
                <div className="flex gap-3 p-4">
                  <img
                    src={patient.photoUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white object-cover shadow-md"
                  />
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-bold leading-tight text-gray-900">{patient.name}</p>
                    <p className="mt-1 text-xs text-gray-600">CPF {patient.cpfMasked}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{patient.ageGenderLabel}</p>
                  </div>
                </div>
              </div>

              <div className={panelClass}>
                <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Solicitante
                  </p>
                </div>
                <div className="flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <Stethoscope className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-bold text-gray-900">{doctor.name}</p>
                    <p className="mt-0.5 text-gray-600">{doctor.specialty}</p>
                    <p className="mt-0.5 text-xs text-gray-500">CRM {doctor.crm}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-[11px] leading-relaxed text-rose-900/80">
                <p className="font-semibold text-rose-800">Referência no SUS</p>
                <p className="mt-1">
                  Documento para regulação de leitos. Inclua justificativa clínica, caráter da
                  internação e dados que permitam contrarreferência após a alta.
                </p>
              </div>
            </aside>

            <section className={panelClass}>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-6 p-4 sm:p-5">
                  <div className="space-y-4">
                    <SectionTitle>Tipo e caráter</SectionTitle>

                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
                      {TIPO_OPTIONS.map((option) => {
                        const selected = tipoInternacao === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            disabled={signing}
                            onClick={() => setTipoInternacao(option.value)}
                            title={option.description}
                            className={[
                              'min-w-0 rounded-lg border px-2 py-2 text-center transition',
                              selected
                                ? 'border-rose-300 bg-rose-50 shadow-sm ring-1 ring-rose-200'
                                : 'border-gray-200 bg-white hover:border-gray-300',
                            ].join(' ')}
                          >
                            <span className="block text-xs font-semibold text-gray-900">
                              {option.label}
                            </span>
                            <span className="mt-0.5 block text-[10px] leading-tight text-gray-500">
                              {option.description}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    <div>
                      <span className="mb-2 block text-sm font-semibold text-gray-900">
                        Caráter da internação
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {CARATER_OPTIONS.map((option) => {
                          const selected = caraterInternacao === option.value
                          return (
                            <button
                              key={option.value}
                              type="button"
                              disabled={signing}
                              onClick={() => setCaraterInternacao(option.value)}
                              className={[
                                'rounded-full border px-4 py-2 text-xs font-semibold transition',
                                selected
                                  ? 'border-rose-500 bg-rose-600 text-white shadow-sm'
                                  : option.chipClass,
                              ].join(' ')}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Unidade hospitalar de destino <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="text"
                        value={unidadeDestino}
                        onChange={(event) => setUnidadeDestino(event.target.value)}
                        placeholder="Ex.: Hospital Municipal, UPA referência, leito de retaguarda…"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                          Procedimento principal previsto
                        </span>
                        <input
                          type="text"
                          value={procedimentoPrincipalPrevisto}
                          onChange={(event) => setProcedimentoPrincipalPrevisto(event.target.value)}
                          placeholder="Ex.: apendicectomia, parto, estabilização clínica…"
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                          Tempo estimado de internação
                        </span>
                        <input
                          type="text"
                          value={tempoEstimadoInternacao}
                          onChange={(event) => setTempoEstimadoInternacao(event.target.value)}
                          placeholder="Ex.: 3 dias, 24 horas de observação…"
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle>Justificativa</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Motivo da internação <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={motivoInternacao}
                        onChange={(event) => setMotivoInternacao(event.target.value)}
                        rows={2}
                        placeholder="Por que o paciente precisa ser internado?"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Justificativa clínica <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={justificativaClinica}
                        onChange={(event) => setJustificativaClinica(event.target.value)}
                        rows={3}
                        placeholder="Por que não é possível manter o cuidado ambulatorial ou em observação breve?"
                        className={textareaClass}
                      />
                      <FieldHint>
                        Ex.: instabilidade hemodinâmica, falha de tratamento ambulatorial, necessidade
                        de monitorização contínua.
                      </FieldHint>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle>Dados clínicos</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        História clínica <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={historiaClinica}
                        onChange={(event) => setHistoriaClinica(event.target.value)}
                        rows={3}
                        placeholder="Queixa, evolução, antecedentes pertinentes…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Exame físico / avaliação <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={exameFisico}
                        onChange={(event) => setExameFisico(event.target.value)}
                        rows={3}
                        placeholder="Sinais vitais, achados relevantes, limitações da avaliação remota…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Hipótese diagnóstica <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="text"
                        value={hipoteseDiagnostica}
                        onChange={(event) => setHipoteseDiagnostica(event.target.value)}
                        placeholder="Diagnóstico provável ou sindrômico"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                      />
                    </label>

                    <div>
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        CID-10 (recomendado)
                      </span>
                      <CidSearchField
                        value={cidSelection}
                        onChange={setCidSelection}
                        disabled={signing}
                      />
                    </div>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Exames complementares realizados
                      </span>
                      <textarea
                        value={examesComplementares}
                        onChange={(event) => setExamesComplementares(event.target.value)}
                        rows={2}
                        placeholder="Laboratoriais, imagem e outros resultados relevantes…"
                        className={textareaClass}
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle>Conduta e tratamentos</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Tratamentos e medicações em uso <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={tratamentosEMedicacoes}
                        onChange={(event) => setTratamentosEMedicacoes(event.target.value)}
                        rows={2}
                        placeholder="Medicações, doses, tempo de uso, alergias…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Conduta já adotada
                      </span>
                      <textarea
                        value={condutaAdotada}
                        onChange={(event) => setCondutaAdotada(event.target.value)}
                        rows={2}
                        placeholder="Medidas realizadas na teleconsulta ou unidade de origem…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Observações adicionais
                      </span>
                      <textarea
                        value={observacoes}
                        onChange={(event) => setObservacoes(event.target.value)}
                        rows={2}
                        placeholder="Isolamento, suporte ventilatório, contraindicações, documentos…"
                        className={textareaClass}
                      />
                    </label>
                  </div>

                  {validationHint ? (
                    <p className="text-sm font-medium text-red-600" role="alert">
                      {validationHint}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3.5 sm:px-5">
                <button
                  type="button"
                  disabled={signing}
                  onClick={() => void handleSign()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)] transition hover:brightness-105 disabled:opacity-60"
                >
                  <FileSignature className="h-4 w-4" />
                  {signing ? 'Gerando documento…' : 'Assinar solicitação de internação'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Toast
        message="Solicitação de internação registrada com sucesso."
        visible={successToastVisible}
        onClose={() => setSuccessToastVisible(false)}
        variant="success"
        durationMs={2000}
      />
    </>,
    document.body,
  )
}
