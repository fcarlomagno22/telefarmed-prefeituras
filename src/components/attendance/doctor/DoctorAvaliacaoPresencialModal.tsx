import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FileSignature, MapPinned, Stethoscope, X } from 'lucide-react'
import { Toast } from '../../ui/Toast'
import { CidSearchField, type CidSelection } from './CidSearchField'
import type {
  DoctorExamRequestDoctorInfo,
  DoctorExamRequestPatientInfo,
} from './DoctorExamRequestModal'

export type AvaliacaoPresencialTipo =
  | 'retorno_presencial'
  | 'avaliacao_especializada'
  | 'reavaliacao_clinica'
  | 'procedimento_presencial'
  | 'urgencia_presencial'

export type AvaliacaoPresencialPrioridade = 'eletivo' | 'prioritario' | 'urgente'

export type DoctorAvaliacaoPresencialSignedPayload = {
  tipoAvaliacao: AvaliacaoPresencialTipo
  prioridade: AvaliacaoPresencialPrioridade
  servicoDestino: string
  motivoAvaliacao: string
  justificativaPresencial: string
  historiaClinica: string
  exameFisicoRemoto: string
  hipoteseDiagnostica: string
  cid?: string
  cidDescricao?: string
  examesRealizados?: string
  condutaAdotada?: string
  expectativaAvaliacao: string
  observacoes?: string
}

type DoctorAvaliacaoPresencialModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: DoctorAvaliacaoPresencialSignedPayload) => void | Promise<void>
  patient: DoctorExamRequestPatientInfo
  doctor: DoctorExamRequestDoctorInfo
}

const panelClass =
  'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm'

const TIPO_OPTIONS: Array<{
  value: AvaliacaoPresencialTipo
  label: string
  description: string
}> = [
  { value: 'retorno_presencial', label: 'Retorno', description: 'Retorno à unidade' },
  {
    value: 'avaliacao_especializada',
    label: 'Especializada',
    description: 'Consulta presencial',
  },
  { value: 'reavaliacao_clinica', label: 'Reavaliação', description: 'Novo exame físico' },
  { value: 'procedimento_presencial', label: 'Procedimento', description: 'No serviço' },
  { value: 'urgencia_presencial', label: 'Urgência', description: 'Avaliação imediata' },
]

const PRIORIDADE_OPTIONS: Array<{
  value: AvaliacaoPresencialPrioridade
  label: string
  chipClass: string
}> = [
  { value: 'eletivo', label: 'Eletivo', chipClass: 'border-slate-200 bg-slate-50 text-slate-700' },
  {
    value: 'prioritario',
    label: 'Prioritário',
    chipClass: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  { value: 'urgente', label: 'Urgente', chipClass: 'border-rose-200 bg-rose-50 text-rose-800' },
]

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600/90">{children}</p>
  )
}

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-[11px] leading-snug text-gray-400">{children}</p>
}

export function DoctorAvaliacaoPresencialModal({
  open,
  onClose,
  onSigned,
  patient,
  doctor,
}: DoctorAvaliacaoPresencialModalProps) {
  const [tipoAvaliacao, setTipoAvaliacao] = useState<AvaliacaoPresencialTipo>('retorno_presencial')
  const [prioridade, setPrioridade] = useState<AvaliacaoPresencialPrioridade>('eletivo')
  const [servicoDestino, setServicoDestino] = useState('')
  const [motivoAvaliacao, setMotivoAvaliacao] = useState('')
  const [justificativaPresencial, setJustificativaPresencial] = useState('')
  const [historiaClinica, setHistoriaClinica] = useState('')
  const [exameFisicoRemoto, setExameFisicoRemoto] = useState('')
  const [hipoteseDiagnostica, setHipoteseDiagnostica] = useState('')
  const [cidSelection, setCidSelection] = useState<CidSelection | null>(null)
  const [examesRealizados, setExamesRealizados] = useState('')
  const [condutaAdotada, setCondutaAdotada] = useState('')
  const [expectativaAvaliacao, setExpectativaAvaliacao] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)
  const [successToastVisible, setSuccessToastVisible] = useState(false)

  useEffect(() => {
    if (!open) return
    setTipoAvaliacao('retorno_presencial')
    setPrioridade('eletivo')
    setServicoDestino('')
    setMotivoAvaliacao('')
    setJustificativaPresencial('')
    setHistoriaClinica('')
    setExameFisicoRemoto('')
    setHipoteseDiagnostica('')
    setCidSelection(null)
    setExamesRealizados('')
    setCondutaAdotada('')
    setExpectativaAvaliacao('')
    setObservacoes('')
    setSigning(false)
    setValidationHint(null)
    setSuccessToastVisible(false)
  }, [open])

  async function handleSign() {
    if (!servicoDestino.trim()) {
      setValidationHint('Informe o serviço ou unidade de destino para a avaliação presencial.')
      return
    }
    if (!motivoAvaliacao.trim()) {
      setValidationHint('Descreva o motivo da solicitação de avaliação presencial.')
      return
    }
    if (!justificativaPresencial.trim()) {
      setValidationHint('Justifique por que a avaliação presencial é necessária.')
      return
    }
    if (!historiaClinica.trim()) {
      setValidationHint('Preencha a história clínica resumida.')
      return
    }
    if (!exameFisicoRemoto.trim()) {
      setValidationHint('Descreva os achados possíveis na teleconsulta ou limitações do exame remoto.')
      return
    }
    if (!hipoteseDiagnostica.trim()) {
      setValidationHint('Informe a hipótese diagnóstica.')
      return
    }
    if (!expectativaAvaliacao.trim()) {
      setValidationHint('Descreva o que espera da avaliação presencial no serviço de destino.')
      return
    }

    setSigning(true)
    setValidationHint(null)

    try {
      const payload: DoctorAvaliacaoPresencialSignedPayload = {
        tipoAvaliacao,
        prioridade,
        servicoDestino: servicoDestino.trim(),
        motivoAvaliacao: motivoAvaliacao.trim(),
        justificativaPresencial: justificativaPresencial.trim(),
        historiaClinica: historiaClinica.trim(),
        exameFisicoRemoto: exameFisicoRemoto.trim(),
        hipoteseDiagnostica: hipoteseDiagnostica.trim(),
        cid: cidSelection?.code,
        cidDescricao: cidSelection?.title,
        examesRealizados: examesRealizados.trim() || undefined,
        condutaAdotada: condutaAdotada.trim() || undefined,
        expectativaAvaliacao: expectativaAvaliacao.trim(),
        observacoes: observacoes.trim() || undefined,
      }

      await onSigned?.(payload)
      setSuccessToastVisible(true)
      onClose()
    } catch {
      setValidationHint('Não foi possível concluir a solicitação de avaliação presencial.')
    } finally {
      setSigning(false)
    }
  }

  if (!open) return null

  const textareaClass =
    'w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20'

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-[2px]"
        onClick={() => !signing && onClose()}
      />
      <div className="fixed inset-0 z-[121] flex items-center justify-center p-3 sm:p-4">
        <div className="flex max-h-[94vh] w-[96vw] max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-[#f5f6f8] shadow-2xl">
          <div className="flex items-center justify-between border-b border-teal-100 bg-gradient-to-r from-teal-50 via-white to-white px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-200/60">
                  <MapPinned className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Avaliação presencial</h2>
                  <p className="text-sm text-gray-500">
                    Solicitação de retorno ou avaliação no serviço de saúde
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
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                    <Stethoscope className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-bold text-gray-900">{doctor.name}</p>
                    <p className="mt-0.5 text-gray-600">{doctor.specialty}</p>
                    <p className="mt-0.5 text-xs text-gray-500">CRM {doctor.crm}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-teal-100 bg-teal-50/50 px-4 py-3 text-[11px] leading-relaxed text-teal-900/80">
                <p className="font-semibold text-teal-800">Quando solicitar presencial</p>
                <p className="mt-1">
                  Indique quando a teleconsulta não substitui o exame físico, procedimento ou
                  reavaliação presencial. Essencial para regulação e continuidade na rede de
                  atenção.
                </p>
              </div>
            </aside>

            <section className={panelClass}>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-6 p-4 sm:p-5">
                  <div className="space-y-4">
                    <SectionTitle>Tipo e prioridade</SectionTitle>

                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
                      {TIPO_OPTIONS.map((option) => {
                        const selected = tipoAvaliacao === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            disabled={signing}
                            onClick={() => setTipoAvaliacao(option.value)}
                            title={option.description}
                            className={[
                              'min-w-0 rounded-lg border px-2 py-2 text-center transition',
                              selected
                                ? 'border-teal-300 bg-teal-50 shadow-sm ring-1 ring-teal-200'
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
                        Classificação de prioridade
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {PRIORIDADE_OPTIONS.map((option) => {
                          const selected = prioridade === option.value
                          return (
                            <button
                              key={option.value}
                              type="button"
                              disabled={signing}
                              onClick={() => setPrioridade(option.value)}
                              className={[
                                'rounded-full border px-4 py-2 text-xs font-semibold transition',
                                selected
                                  ? 'border-teal-500 bg-teal-600 text-white shadow-sm'
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
                        Serviço / unidade de destino <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="text"
                        value={servicoDestino}
                        onChange={(event) => setServicoDestino(event.target.value)}
                        placeholder="Ex.: UBS Centro, UPA, ambulatório de cardiologia…"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle>Justificativa</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Motivo da avaliação presencial <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={motivoAvaliacao}
                        onChange={(event) => setMotivoAvaliacao(event.target.value)}
                        rows={2}
                        placeholder="Por que o paciente precisa ser avaliado presencialmente?"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Justificativa presencial <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={justificativaPresencial}
                        onChange={(event) => setJustificativaPresencial(event.target.value)}
                        rows={3}
                        placeholder="Por que a teleconsulta não é suficiente? O que exige contato presencial?"
                        className={textareaClass}
                      />
                      <FieldHint>
                        Ex.: necessidade de exame físico completo, procedimento, sinais de alarme
                        não confirmados remotamente.
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
                        Exame físico / avaliação remota <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={exameFisicoRemoto}
                        onChange={(event) => setExameFisicoRemoto(event.target.value)}
                        rows={3}
                        placeholder="O que foi possível avaliar na teleconsulta e o que permanece inconcluso…"
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
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
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
                        Exames já realizados
                      </span>
                      <textarea
                        value={examesRealizados}
                        onChange={(event) => setExamesRealizados(event.target.value)}
                        rows={2}
                        placeholder="Exames complementares e resultados relevantes…"
                        className={textareaClass}
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle>Conduta e expectativas</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Conduta já adotada
                      </span>
                      <textarea
                        value={condutaAdotada}
                        onChange={(event) => setCondutaAdotada(event.target.value)}
                        rows={2}
                        placeholder="Orientações, prescrições e medidas já realizadas na teleconsulta…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Expectativa da avaliação presencial <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={expectativaAvaliacao}
                        onChange={(event) => setExpectativaAvaliacao(event.target.value)}
                        rows={3}
                        placeholder="O que o serviço de destino deve avaliar, confirmar ou definir?"
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
                        placeholder="Orientações ao paciente, documentos a levar, contraindicações…"
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(13,148,136,0.35)] transition hover:brightness-105 disabled:opacity-60"
                >
                  <FileSignature className="h-4 w-4" />
                  {signing ? 'Gerando documento…' : 'Assinar avaliação presencial'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Toast
        message="Avaliação presencial registrada com sucesso."
        visible={successToastVisible}
        onClose={() => setSuccessToastVisible(false)}
        variant="success"
        durationMs={2000}
      />
    </>,
    document.body,
  )
}
