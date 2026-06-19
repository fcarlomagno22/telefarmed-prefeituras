import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FileSignature, Microscope, Stethoscope, X } from 'lucide-react'
import { Toast } from '../../ui/Toast'
import { CidSearchField, type CidSelection } from './CidSearchField'
import type {
  DoctorExamRequestDoctorInfo,
  DoctorExamRequestPatientInfo,
} from './DoctorExamRequestModal'

export type LaudoTipo =
  | 'exame_complementar'
  | 'condicao_clinica'
  | 'procedimento'
  | 'aptidao_inaptidao'
  | 'pericia_administrativa'

export type DoctorLaudoSignedPayload = {
  tipoLaudo: LaudoTipo
  destinatario?: string
  objetoLaudo: string
  solicitacaoOrigem?: string
  descricaoAchados: string
  correlacaoClinica: string
  discussaoInterpretacao?: string
  conclusaoLaudo: string
  cid?: string
  cidDescricao?: string
  recomendacoes?: string
  limitacoesExame?: string
  observacoes?: string
}

type DoctorLaudoModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: DoctorLaudoSignedPayload) => void | Promise<void>
  patient: DoctorExamRequestPatientInfo
  doctor: DoctorExamRequestDoctorInfo
}

const panelClass =
  'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm'

const TIPO_OPTIONS: Array<{
  value: LaudoTipo
  label: string
  description: string
}> = [
  {
    value: 'exame_complementar',
    label: 'Exame',
    description: 'Interpretação de exame',
  },
  {
    value: 'condicao_clinica',
    label: 'Condição',
    description: 'Parecer sobre quadro',
  },
  {
    value: 'procedimento',
    label: 'Procedimento',
    description: 'Avaliação realizada',
  },
  {
    value: 'aptidao_inaptidao',
    label: 'Aptidão',
    description: 'Apto ou inapto',
  },
  {
    value: 'pericia_administrativa',
    label: 'Perícia',
    description: 'Fins administrativos',
  },
]

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600/90">{children}</p>
  )
}

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-[11px] leading-snug text-gray-400">{children}</p>
}

export function DoctorLaudoModal({
  open,
  onClose,
  onSigned,
  patient,
  doctor,
}: DoctorLaudoModalProps) {
  const [tipoLaudo, setTipoLaudo] = useState<LaudoTipo>('exame_complementar')
  const [destinatario, setDestinatario] = useState('')
  const [objetoLaudo, setObjetoLaudo] = useState('')
  const [solicitacaoOrigem, setSolicitacaoOrigem] = useState('')
  const [descricaoAchados, setDescricaoAchados] = useState('')
  const [correlacaoClinica, setCorrelacaoClinica] = useState('')
  const [discussaoInterpretacao, setDiscussaoInterpretacao] = useState('')
  const [conclusaoLaudo, setConclusaoLaudo] = useState('')
  const [cidSelection, setCidSelection] = useState<CidSelection | null>(null)
  const [recomendacoes, setRecomendacoes] = useState('')
  const [limitacoesExame, setLimitacoesExame] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)
  const [successToastVisible, setSuccessToastVisible] = useState(false)

  useEffect(() => {
    if (!open) return
    setTipoLaudo('exame_complementar')
    setDestinatario('')
    setObjetoLaudo('')
    setSolicitacaoOrigem('')
    setDescricaoAchados('')
    setCorrelacaoClinica('')
    setDiscussaoInterpretacao('')
    setConclusaoLaudo('')
    setCidSelection(null)
    setRecomendacoes('')
    setLimitacoesExame('')
    setObservacoes('')
    setSigning(false)
    setValidationHint(null)
    setSuccessToastVisible(false)
  }, [open])

  async function handleSign() {
    if (!objetoLaudo.trim()) {
      setValidationHint('Informe o objeto do laudo (exame, condição ou questão avaliada).')
      return
    }
    if (!descricaoAchados.trim()) {
      setValidationHint('Descreva os achados ou a descrição técnica.')
      return
    }
    if (!correlacaoClinica.trim()) {
      setValidationHint('Informe a correlação clínica com o quadro do paciente.')
      return
    }
    if (!conclusaoLaudo.trim()) {
      setValidationHint('Elabore a conclusão do laudo.')
      return
    }

    setSigning(true)
    setValidationHint(null)

    try {
      const payload: DoctorLaudoSignedPayload = {
        tipoLaudo,
        destinatario: destinatario.trim() || undefined,
        objetoLaudo: objetoLaudo.trim(),
        solicitacaoOrigem: solicitacaoOrigem.trim() || undefined,
        descricaoAchados: descricaoAchados.trim(),
        correlacaoClinica: correlacaoClinica.trim(),
        discussaoInterpretacao: discussaoInterpretacao.trim() || undefined,
        conclusaoLaudo: conclusaoLaudo.trim(),
        cid: cidSelection?.code,
        cidDescricao: cidSelection?.title,
        recomendacoes: recomendacoes.trim() || undefined,
        limitacoesExame: limitacoesExame.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      }

      await onSigned?.(payload)
      setSuccessToastVisible(true)
      onClose()
    } catch {
      setValidationHint('Não foi possível concluir o laudo médico.')
    } finally {
      setSigning(false)
    }
  }

  if (!open) return null

  const textareaClass =
    'w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20'

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-[2px]"
        onClick={() => !signing && onClose()}
      />
      <div className="fixed inset-0 z-[121] flex items-center justify-center p-3 sm:p-4">
        <div className="flex max-h-[94vh] w-[96vw] max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-[#f5f6f8] shadow-2xl">
          <div className="flex items-center justify-between border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-white px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-md shadow-sky-200/60">
                  <Microscope className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Laudo médico</h2>
                  <p className="text-sm text-gray-500">
                    Parecer técnico sobre exame, condição ou questão clínica
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
                    Laudador
                  </p>
                </div>
                <div className="flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <Stethoscope className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-bold text-gray-900">{doctor.name}</p>
                    <p className="mt-0.5 text-gray-600">{doctor.specialty}</p>
                    <p className="mt-0.5 text-xs text-gray-500">CRM {doctor.crm}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-[11px] leading-relaxed text-sky-900/80">
                <p className="font-semibold text-sky-800">Laudo na rede de atenção</p>
                <p className="mt-1">
                  Descreva achados de forma objetiva, correlacione com o quadro clínico e conclua
                  com parecer claro. Essencial para regulação, contrarreferência e continuidade na
                  APS.
                </p>
              </div>
            </aside>

            <section className={panelClass}>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-6 p-4 sm:p-5">
                  <div className="space-y-4">
                    <SectionTitle>Tipo de laudo</SectionTitle>

                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
                      {TIPO_OPTIONS.map((option) => {
                        const selected = tipoLaudo === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            disabled={signing}
                            onClick={() => setTipoLaudo(option.value)}
                            title={option.description}
                            className={[
                              'min-w-0 rounded-lg border px-2 py-2 text-center transition',
                              selected
                                ? 'border-sky-300 bg-sky-50 shadow-sm ring-1 ring-sky-200'
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

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Destinatário
                      </span>
                      <input
                        type="text"
                        value={destinatario}
                        onChange={(event) => setDestinatario(event.target.value)}
                        placeholder="Ex.: Regulação, APS solicitante, RH, perícia…"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Objeto do laudo <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="text"
                        value={objetoLaudo}
                        onChange={(event) => setObjetoLaudo(event.target.value)}
                        placeholder="Ex.: Ecocardiograma, lombalgia crônica, aptidão para atividade física…"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Solicitação / origem
                      </span>
                      <input
                        type="text"
                        value={solicitacaoOrigem}
                        onChange={(event) => setSolicitacaoOrigem(event.target.value)}
                        placeholder="Quem solicitou, data do exame, serviço de origem…"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle>Achados técnicos</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Descrição dos achados <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={descricaoAchados}
                        onChange={(event) => setDescricaoAchados(event.target.value)}
                        rows={4}
                        placeholder="Descreva de forma objetiva os achados do exame, procedimento ou avaliação…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Limitações do exame
                      </span>
                      <textarea
                        value={limitacoesExame}
                        onChange={(event) => setLimitacoesExame(event.target.value)}
                        rows={2}
                        placeholder="Artefatos, janela acústica limitada, exame incompleto, etc."
                        className={textareaClass}
                      />
                      <FieldHint>Relevante principalmente para laudos de exames complementares.</FieldHint>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle>Interpretação clínica</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Correlação clínica <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={correlacaoClinica}
                        onChange={(event) => setCorrelacaoClinica(event.target.value)}
                        rows={3}
                        placeholder="Relacione os achados com queixa, história e exame físico do paciente…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Discussão e interpretação
                      </span>
                      <textarea
                        value={discussaoInterpretacao}
                        onChange={(event) => setDiscussaoInterpretacao(event.target.value)}
                        rows={3}
                        placeholder="Análise crítica dos achados, diagnósticos diferenciais, gravidade…"
                        className={textareaClass}
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle>Conclusão</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Conclusão do laudo <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={conclusaoLaudo}
                        onChange={(event) => setConclusaoLaudo(event.target.value)}
                        rows={3}
                        placeholder="Impressão diagnóstica, parecer final ou definição de aptidão/inaptidão…"
                        className={textareaClass}
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
                        Recomendações
                      </span>
                      <textarea
                        value={recomendacoes}
                        onChange={(event) => setRecomendacoes(event.target.value)}
                        rows={2}
                        placeholder="Conduta sugerida, seguimento, encaminhamentos, retorno à APS…"
                        className={textareaClass}
                      />
                      <FieldHint>
                        Em contrarreferência, oriente a unidade básica sobre o seguimento do caso.
                      </FieldHint>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Observações adicionais
                      </span>
                      <textarea
                        value={observacoes}
                        onChange={(event) => setObservacoes(event.target.value)}
                        rows={2}
                        placeholder="Ressalvas técnicas, necessidade de complementação, etc."
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(14,165,233,0.35)] transition hover:brightness-105 disabled:opacity-60"
                >
                  <FileSignature className="h-4 w-4" />
                  {signing ? 'Gerando documento…' : 'Assinar laudo médico'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Toast
        message="Laudo médico registrado com sucesso."
        visible={successToastVisible}
        onClose={() => setSuccessToastVisible(false)}
        variant="success"
        durationMs={2000}
      />
    </>,
    document.body,
  )
}
