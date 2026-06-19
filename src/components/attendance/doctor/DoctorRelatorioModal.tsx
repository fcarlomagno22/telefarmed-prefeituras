import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FileBarChart, FileSignature, Stethoscope, X } from 'lucide-react'
import { Toast } from '../../ui/Toast'
import { CidSearchField, type CidSelection } from './CidSearchField'
import type {
  DoctorExamRequestDoctorInfo,
  DoctorExamRequestPatientInfo,
} from './DoctorExamRequestModal'

export type RelatorioFinalidade =
  | 'referencia'
  | 'resumo_atendimento'
  | 'contrarreferencia'
  | 'parecer'
  | 'administrativo'

export type DoctorRelatorioSignedPayload = {
  finalidade: RelatorioFinalidade
  destinatario?: string
  motivoRelatorio: string
  queixaPrincipal: string
  historiaDoencaAtual: string
  antecedentesRelevantes?: string
  medicacoesEmUso?: string
  exameFisico: string
  examesComplementares?: string
  hipoteseDiagnostica: string
  cid?: string
  cidDescricao?: string
  condutaAdotada: string
  tratamentoEOrientacoes?: string
  evolucaoPrognostico?: string
  conclusaoParecer: string
  recomendacoes?: string
  observacoes?: string
}

type DoctorRelatorioModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: DoctorRelatorioSignedPayload) => void | Promise<void>
  patient: DoctorExamRequestPatientInfo
  doctor: DoctorExamRequestDoctorInfo
}

const panelClass =
  'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm'

const FINALIDADE_OPTIONS: Array<{
  value: RelatorioFinalidade
  label: string
  description: string
}> = [
  {
    value: 'referencia',
    label: 'Referência',
    description: 'Acompanha encaminhamento',
  },
  {
    value: 'resumo_atendimento',
    label: 'Resumo',
    description: 'Atendimento realizado',
  },
  {
    value: 'contrarreferencia',
    label: 'Contrarreferência',
    description: 'Retorno à APS',
  },
  {
    value: 'parecer',
    label: 'Parecer',
    description: 'Opinião técnica',
  },
  {
    value: 'administrativo',
    label: 'Administrativo',
    description: 'Fins legais / periciais',
  },
]

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600/90">{children}</p>
  )
}

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-[11px] leading-snug text-gray-400">{children}</p>
}

export function DoctorRelatorioModal({
  open,
  onClose,
  onSigned,
  patient,
  doctor,
}: DoctorRelatorioModalProps) {
  const [finalidade, setFinalidade] = useState<RelatorioFinalidade>('resumo_atendimento')
  const [destinatario, setDestinatario] = useState('')
  const [motivoRelatorio, setMotivoRelatorio] = useState('')
  const [queixaPrincipal, setQueixaPrincipal] = useState('')
  const [historiaDoencaAtual, setHistoriaDoencaAtual] = useState('')
  const [antecedentesRelevantes, setAntecedentesRelevantes] = useState('')
  const [medicacoesEmUso, setMedicacoesEmUso] = useState('')
  const [exameFisico, setExameFisico] = useState('')
  const [examesComplementares, setExamesComplementares] = useState('')
  const [hipoteseDiagnostica, setHipoteseDiagnostica] = useState('')
  const [cidSelection, setCidSelection] = useState<CidSelection | null>(null)
  const [condutaAdotada, setCondutaAdotada] = useState('')
  const [tratamentoEOrientacoes, setTratamentoEOrientacoes] = useState('')
  const [evolucaoPrognostico, setEvolucaoPrognostico] = useState('')
  const [conclusaoParecer, setConclusaoParecer] = useState('')
  const [recomendacoes, setRecomendacoes] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)
  const [successToastVisible, setSuccessToastVisible] = useState(false)

  useEffect(() => {
    if (!open) return
    setFinalidade('resumo_atendimento')
    setDestinatario('')
    setMotivoRelatorio('')
    setQueixaPrincipal('')
    setHistoriaDoencaAtual('')
    setAntecedentesRelevantes('')
    setMedicacoesEmUso('')
    setExameFisico('')
    setExamesComplementares('')
    setHipoteseDiagnostica('')
    setCidSelection(null)
    setCondutaAdotada('')
    setTratamentoEOrientacoes('')
    setEvolucaoPrognostico('')
    setConclusaoParecer('')
    setRecomendacoes('')
    setObservacoes('')
    setSigning(false)
    setValidationHint(null)
    setSuccessToastVisible(false)
  }, [open])

  async function handleSign() {
    if (!motivoRelatorio.trim()) {
      setValidationHint('Descreva o motivo e a finalidade deste relatório.')
      return
    }
    if (!queixaPrincipal.trim()) {
      setValidationHint('Informe a queixa principal.')
      return
    }
    if (!historiaDoencaAtual.trim()) {
      setValidationHint('Preencha a história da doença atual.')
      return
    }
    if (!exameFisico.trim()) {
      setValidationHint('Descreva os achados do exame físico ou avaliação clínica.')
      return
    }
    if (!hipoteseDiagnostica.trim()) {
      setValidationHint('Informe a hipótese diagnóstica.')
      return
    }
    if (!condutaAdotada.trim()) {
      setValidationHint('Relate a conduta adotada neste atendimento.')
      return
    }
    if (!conclusaoParecer.trim()) {
      setValidationHint('Elabore o parecer / conclusão do relatório.')
      return
    }

    setSigning(true)
    setValidationHint(null)

    try {
      const payload: DoctorRelatorioSignedPayload = {
        finalidade,
        destinatario: destinatario.trim() || undefined,
        motivoRelatorio: motivoRelatorio.trim(),
        queixaPrincipal: queixaPrincipal.trim(),
        historiaDoencaAtual: historiaDoencaAtual.trim(),
        antecedentesRelevantes: antecedentesRelevantes.trim() || undefined,
        medicacoesEmUso: medicacoesEmUso.trim() || undefined,
        exameFisico: exameFisico.trim(),
        examesComplementares: examesComplementares.trim() || undefined,
        hipoteseDiagnostica: hipoteseDiagnostica.trim(),
        cid: cidSelection?.code,
        cidDescricao: cidSelection?.title,
        condutaAdotada: condutaAdotada.trim(),
        tratamentoEOrientacoes: tratamentoEOrientacoes.trim() || undefined,
        evolucaoPrognostico: evolucaoPrognostico.trim() || undefined,
        conclusaoParecer: conclusaoParecer.trim(),
        recomendacoes: recomendacoes.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      }

      await onSigned?.(payload)
      setSuccessToastVisible(true)
      onClose()
    } catch {
      setValidationHint('Não foi possível concluir o relatório médico.')
    } finally {
      setSigning(false)
    }
  }

  if (!open) return null

  const textareaClass =
    'w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20'

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-[2px]"
        onClick={() => !signing && onClose()}
      />
      <div className="fixed inset-0 z-[121] flex items-center justify-center p-3 sm:p-4">
        <div className="flex max-h-[94vh] w-[96vw] max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-[#f5f6f8] shadow-2xl">
          <div className="flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-white px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-400 text-white shadow-md shadow-indigo-200/60">
                  <FileBarChart className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Relatório médico</h2>
                  <p className="text-sm text-gray-500">
                    Resumo clínico para referência, contrarreferência ou documentação
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
                    Emissor
                  </p>
                </div>
                <div className="flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Stethoscope className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-bold text-gray-900">{doctor.name}</p>
                    <p className="mt-0.5 text-gray-600">{doctor.specialty}</p>
                    <p className="mt-0.5 text-xs text-gray-500">CRM {doctor.crm}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-[11px] leading-relaxed text-indigo-900/80">
                <p className="font-semibold text-indigo-800">Referência e contrarreferência</p>
                <p className="mt-1">
                  Documente de forma objetiva o caso clínico, conduta e recomendações. Essencial
                  para regulação, continuidade na APS e retorno do especialista.
                </p>
              </div>
            </aside>

            <section className={panelClass}>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-6 p-4 sm:p-5">
                  <div className="space-y-4">
                    <SectionTitle>Finalidade do relatório</SectionTitle>

                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
                      {FINALIDADE_OPTIONS.map((option) => {
                        const selected = finalidade === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            disabled={signing}
                            onClick={() => setFinalidade(option.value)}
                            title={option.description}
                            className={[
                              'min-w-0 rounded-lg border px-2 py-2 text-center transition',
                              selected
                                ? 'border-indigo-300 bg-indigo-50 shadow-sm ring-1 ring-indigo-200'
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
                        placeholder="Ex.: Regulação municipal, especialista, RH, perícia médica…"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Motivo do relatório <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={motivoRelatorio}
                        onChange={(event) => setMotivoRelatorio(event.target.value)}
                        rows={2}
                        placeholder="Para que este relatório está sendo emitido? Qual a necessidade de comunicação clínica?"
                        className={textareaClass}
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle>Anamnese</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Queixa principal <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="text"
                        value={queixaPrincipal}
                        onChange={(event) => setQueixaPrincipal(event.target.value)}
                        placeholder="Motivo da consulta em palavras do paciente"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        História da doença atual <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={historiaDoencaAtual}
                        onChange={(event) => setHistoriaDoencaAtual(event.target.value)}
                        rows={4}
                        placeholder="Início, evolução, fatores de melhora/piora, sintomas associados…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Antecedentes relevantes
                      </span>
                      <textarea
                        value={antecedentesRelevantes}
                        onChange={(event) => setAntecedentesRelevantes(event.target.value)}
                        rows={2}
                        placeholder="Comorbidades, cirurgias, alergias, histórico familiar…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Medicações em uso
                      </span>
                      <textarea
                        value={medicacoesEmUso}
                        onChange={(event) => setMedicacoesEmUso(event.target.value)}
                        rows={2}
                        placeholder="Medicamentos contínuos, posologia quando relevante…"
                        className={textareaClass}
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle>Avaliação clínica</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Exame físico <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={exameFisico}
                        onChange={(event) => setExameFisico(event.target.value)}
                        rows={3}
                        placeholder="Sinais vitais e achados pertinentes ao caso…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Exames complementares
                      </span>
                      <textarea
                        value={examesComplementares}
                        onChange={(event) => setExamesComplementares(event.target.value)}
                        rows={2}
                        placeholder="Exames já realizados e resultados relevantes…"
                        className={textareaClass}
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle>Diagnóstico</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Hipótese diagnóstica <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="text"
                        value={hipoteseDiagnostica}
                        onChange={(event) => setHipoteseDiagnostica(event.target.value)}
                        placeholder="Diagnóstico provável ou sindrômico"
                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
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
                  </div>

                  <div className="space-y-4">
                    <SectionTitle>Conduta</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Conduta adotada <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={condutaAdotada}
                        onChange={(event) => setCondutaAdotada(event.target.value)}
                        rows={3}
                        placeholder="O que foi realizado neste atendimento: orientações, prescrições, encaminhamentos…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Tratamento e orientações
                      </span>
                      <textarea
                        value={tratamentoEOrientacoes}
                        onChange={(event) => setTratamentoEOrientacoes(event.target.value)}
                        rows={2}
                        placeholder="Prescrições, cuidados domiciliares, sinais de alerta…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Evolução e prognóstico
                      </span>
                      <textarea
                        value={evolucaoPrognostico}
                        onChange={(event) => setEvolucaoPrognostico(event.target.value)}
                        rows={2}
                        placeholder="Estado atual, expectativa de evolução, necessidade de seguimento…"
                        className={textareaClass}
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle>Parecer e recomendações</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Parecer / conclusão <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={conclusaoParecer}
                        onChange={(event) => setConclusaoParecer(event.target.value)}
                        rows={3}
                        placeholder="Síntese final do caso e posicionamento médico…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Recomendações
                      </span>
                      <textarea
                        value={recomendacoes}
                        onChange={(event) => setRecomendacoes(event.target.value)}
                        rows={2}
                        placeholder="Condutas sugeridas à APS, ao especialista ou ao paciente…"
                        className={textareaClass}
                      />
                      <FieldHint>
                        Em contrarreferência, descreva o que a unidade básica deve fazer no
                        seguimento.
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
                        placeholder="Informações complementares, limitações do exame, etc."
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(79,70,229,0.35)] transition hover:brightness-105 disabled:opacity-60"
                >
                  <FileSignature className="h-4 w-4" />
                  {signing ? 'Gerando documento…' : 'Assinar relatório médico'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Toast
        message="Relatório médico registrado com sucesso."
        visible={successToastVisible}
        onClose={() => setSuccessToastVisible(false)}
        variant="success"
        durationMs={2000}
      />
    </>,
    document.body,
  )
}
