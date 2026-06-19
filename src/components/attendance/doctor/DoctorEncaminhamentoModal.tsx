import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRightLeft,
  FileSignature,
  Stethoscope,
  X,
} from 'lucide-react'
import { DOCTOR_REFERRAL_SPECIALTIES } from '../../../data/doctorReferralSpecialties'
import { Toast } from '../../ui/Toast'
import { CustomSelect } from '../../ui/CustomSelect'
import { CidSearchField, type CidSelection } from './CidSearchField'
import type {
  DoctorExamRequestDoctorInfo,
  DoctorExamRequestPatientInfo,
} from './DoctorExamRequestModal'

export type EncaminhamentoTipoSolicitacao =
  | 'consulta_especializada'
  | 'retorno'
  | 'procedimento'
  | 'avaliacao_cirurgica'
  | 'segunda_opiniao'

export type EncaminhamentoPrioridade = 'eletivo' | 'prioritario' | 'urgente'

export type DoctorEncaminhamentoSignedPayload = {
  specialtyId: string
  specialtyLabel: string
  customSpecialty?: string
  tipoSolicitacao: EncaminhamentoTipoSolicitacao
  prioridade: EncaminhamentoPrioridade
  motivoEncaminhamento: string
  historiaClinica: string
  exameFisico: string
  hipoteseDiagnostica: string
  cid?: string
  cidDescricao?: string
  tratamentosEMedicacoes: string
  examesRealizados?: string
  observacoes?: string
}

type DoctorEncaminhamentoModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: DoctorEncaminhamentoSignedPayload) => void | Promise<void>
  patient: DoctorExamRequestPatientInfo
  doctor: DoctorExamRequestDoctorInfo
}

const panelClass =
  'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm'

const TIPO_OPTIONS: Array<{
  value: EncaminhamentoTipoSolicitacao
  label: string
  description: string
}> = [
  {
    value: 'consulta_especializada',
    label: 'Consulta especializada',
    description: 'Primeira avaliação no destino',
  },
  {
    value: 'retorno',
    label: 'Retorno',
    description: 'Reavaliação após consulta',
  },
  {
    value: 'procedimento',
    label: 'Procedimento',
    description: 'Procedimento no serviço',
  },
  {
    value: 'avaliacao_cirurgica',
    label: 'Avaliação cirúrgica',
    description: 'Avaliação para cirurgia',
  },
  {
    value: 'segunda_opiniao',
    label: 'Segunda opinião',
    description: 'Parecer sobre conduta',
  },
]

const PRIORIDADE_OPTIONS: Array<{
  value: EncaminhamentoPrioridade
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
    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600/90">{children}</p>
  )
}

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-[11px] leading-snug text-gray-400">{children}</p>
}

export function DoctorEncaminhamentoModal({
  open,
  onClose,
  onSigned,
  patient,
  doctor,
}: DoctorEncaminhamentoModalProps) {
  const [specialtyId, setSpecialtyId] = useState('')
  const [customSpecialty, setCustomSpecialty] = useState('')
  const [tipoSolicitacao, setTipoSolicitacao] =
    useState<EncaminhamentoTipoSolicitacao>('consulta_especializada')
  const [prioridade, setPrioridade] = useState<EncaminhamentoPrioridade>('eletivo')
  const [motivoEncaminhamento, setMotivoEncaminhamento] = useState('')
  const [historiaClinica, setHistoriaClinica] = useState('')
  const [exameFisico, setExameFisico] = useState('')
  const [hipoteseDiagnostica, setHipoteseDiagnostica] = useState('')
  const [cidSelection, setCidSelection] = useState<CidSelection | null>(null)
  const [tratamentosEMedicacoes, setTratamentosEMedicacoes] = useState('')
  const [examesRealizados, setExamesRealizados] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [successToastVisible, setSuccessToastVisible] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  const specialtyOptions = useMemo(
    () => DOCTOR_REFERRAL_SPECIALTIES.map((item) => ({ value: item.id, label: item.label })),
    [],
  )

  const selectedSpecialty = DOCTOR_REFERRAL_SPECIALTIES.find((item) => item.id === specialtyId)
  const showCustomSpecialty = specialtyId === 'outra'

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !signing) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, signing])

  useEffect(() => {
    if (open) return

    setSpecialtyId('')
    setCustomSpecialty('')
    setTipoSolicitacao('consulta_especializada')
    setPrioridade('eletivo')
    setMotivoEncaminhamento('')
    setHistoriaClinica('')
    setExameFisico('')
    setHipoteseDiagnostica('')
    setCidSelection(null)
    setTratamentosEMedicacoes('')
    setExamesRealizados('')
    setObservacoes('')
    setSigning(false)
    setValidationHint(null)
  }, [open])

  if (!open) return null

  function resolveSpecialtyLabel() {
    if (showCustomSpecialty) return customSpecialty.trim()
    return selectedSpecialty?.label ?? ''
  }

  async function handleSign() {
    const specialtyLabel = resolveSpecialtyLabel()

    if (!specialtyId) {
      setValidationHint('Selecione a especialidade ou serviço de destino.')
      return
    }
    if (showCustomSpecialty && !customSpecialty.trim()) {
      setValidationHint('Informe o nome da especialidade ou serviço de destino.')
      return
    }
    if (!motivoEncaminhamento.trim()) {
      setValidationHint('Descreva o motivo do encaminhamento e o que espera do especialista.')
      return
    }
    if (!historiaClinica.trim()) {
      setValidationHint('Preencha a história clínica sucinta (queixa, evolução e antecedentes).')
      return
    }
    if (!exameFisico.trim()) {
      setValidationHint('Descreva os achados relevantes do exame físico.')
      return
    }
    if (!hipoteseDiagnostica.trim()) {
      setValidationHint('Informe a hipótese diagnóstica.')
      return
    }
    if (!tratamentosEMedicacoes.trim()) {
      setValidationHint('Relate tratamentos já realizados e medicações em uso.')
      return
    }

    setSigning(true)
    setValidationHint(null)

    try {
      const payload: DoctorEncaminhamentoSignedPayload = {
        specialtyId,
        specialtyLabel,
        customSpecialty: showCustomSpecialty ? customSpecialty.trim() : undefined,
        tipoSolicitacao,
        prioridade,
        motivoEncaminhamento: motivoEncaminhamento.trim(),
        historiaClinica: historiaClinica.trim(),
        exameFisico: exameFisico.trim(),
        hipoteseDiagnostica: hipoteseDiagnostica.trim(),
        cid: cidSelection?.code,
        cidDescricao: cidSelection?.title,
        tratamentosEMedicacoes: tratamentosEMedicacoes.trim(),
        examesRealizados: examesRealizados.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      }

      await onSigned?.(payload)
      setSuccessToastVisible(true)
      onClose()
    } catch {
      setValidationHint('Não foi possível concluir o encaminhamento.')
    } finally {
      setSigning(false)
    }
  }

  const textareaClass =
    'w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20'

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-[2px]"
        onClick={() => !signing && onClose()}
      />
      <div className="fixed inset-0 z-[121] flex items-center justify-center p-3 sm:p-4">
        <div className="flex max-h-[94vh] w-[96vw] max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-[#f5f6f8] shadow-2xl">
          <div className="flex items-center justify-between border-b border-violet-100 bg-gradient-to-r from-violet-50 via-white to-white px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-400 text-white shadow-md shadow-violet-200/60">
                  <ArrowRightLeft className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Encaminhamento médico</h2>
                  <p className="text-sm text-gray-500">
                    Documento de referência para continuidade do cuidado
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
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Stethoscope className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-bold text-gray-900">{doctor.name}</p>
                    <p className="mt-0.5 text-gray-600">{doctor.specialty}</p>
                    <p className="mt-0.5 text-xs text-gray-500">CRM {doctor.crm}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-violet-100 bg-violet-50/50 px-4 py-3 text-[11px] leading-relaxed text-violet-900/80">
                <p className="font-semibold text-violet-800">Boas práticas de referência</p>
                <p className="mt-1">
                  Preencha história, exame físico, hipótese, condutas já tentadas e exames
                  prévios. Isso reduz devoluções pela regulação e orienta o especialista.
                </p>
              </div>
            </aside>

            <section className={panelClass}>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-6 p-4 sm:p-5">
                  <div className="space-y-4">
                    <SectionTitle>Destino da solicitação</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Especialidade ou serviço de destino <span className="text-red-500">*</span>
                      </span>
                      <CustomSelect
                        value={specialtyId}
                        onChange={setSpecialtyId}
                        options={specialtyOptions}
                        placeholder="Selecione a especialidade"
                        menuMinWidthPx={320}
                      />
                    </label>

                    {showCustomSpecialty ? (
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                          Nome da especialidade / serviço <span className="text-red-500">*</span>
                        </span>
                        <input
                          type="text"
                          value={customSpecialty}
                          onChange={(event) => setCustomSpecialty(event.target.value)}
                          placeholder="Ex.: Cirurgia vascular, Fisioterapia, CAPS…"
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                        />
                      </label>
                    ) : null}

                    <div>
                      <span className="mb-2 block text-sm font-semibold text-gray-900">
                        Tipo de solicitação
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
                        {TIPO_OPTIONS.map((option) => {
                          const selected = tipoSolicitacao === option.value
                          return (
                            <button
                              key={option.value}
                              type="button"
                              disabled={signing}
                              onClick={() => setTipoSolicitacao(option.value)}
                              title={option.description}
                              className={[
                                'min-w-0 rounded-lg border px-2 py-2 text-left transition',
                                selected
                                  ? 'border-violet-300 bg-violet-50 shadow-sm ring-1 ring-violet-200'
                                  : 'border-gray-200 bg-white hover:border-gray-300',
                              ].join(' ')}
                            >
                              <span className="block truncate text-xs font-semibold text-gray-900">
                                {option.label}
                              </span>
                              <span className="mt-0.5 block truncate text-[10px] leading-tight text-gray-500">
                                {option.description}
                              </span>
                            </button>
                          )
                        })}
                      </div>
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
                                  ? 'border-violet-500 bg-violet-600 text-white shadow-sm'
                                  : option.chipClass,
                              ].join(' ')}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                      <FieldHint>
                        Usada pela regulação para ordenar a fila. Urgente apenas com justificativa
                        clínica objetiva.
                      </FieldHint>
                    </div>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Motivo do encaminhamento <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={motivoEncaminhamento}
                        onChange={(event) => {
                          setMotivoEncaminhamento(event.target.value)
                          setValidationHint(null)
                        }}
                        rows={3}
                        placeholder="O que motiva o encaminhamento? O que você espera que o especialista avalie, confirme ou defina?"
                        className={textareaClass}
                      />
                      <FieldHint>
                        Evite descrições genéricas. Indique a dúvida clínica ou a conduta esperada.
                      </FieldHint>
                    </label>
                  </div>

                  <div className="space-y-4 border-t border-gray-100 pt-5">
                    <SectionTitle>Resumo clínico</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        História clínica sucinta <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={historiaClinica}
                        onChange={(event) => {
                          setHistoriaClinica(event.target.value)
                          setValidationHint(null)
                        }}
                        rows={4}
                        placeholder="Queixa principal, tempo de evolução, sintomas associados e antecedentes relevantes…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Exame físico — achados relevantes <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={exameFisico}
                        onChange={(event) => {
                          setExameFisico(event.target.value)
                          setValidationHint(null)
                        }}
                        rows={3}
                        placeholder="Descreva apenas os achados pertinentes ao encaminhamento (sinais vitais, foco da queixa, etc.)…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Hipótese diagnóstica <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={hipoteseDiagnostica}
                        onChange={(event) => {
                          setHipoteseDiagnostica(event.target.value)
                          setValidationHint(null)
                        }}
                        rows={2}
                        placeholder="Hipótese(s) diagnóstica(s) em linguagem clínica, não apenas códigos CID…"
                        className={textareaClass}
                      />
                      <FieldHint>
                        Não substitua a história clínica por siglas ou códigos isolados.
                      </FieldHint>
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
                      <FieldHint>
                        Facilita a regulação e deve ser coerente com a hipótese diagnóstica.
                      </FieldHint>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-gray-100 pt-5">
                    <SectionTitle>Conduta prévia e exames</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Tratamentos realizados e medicações em uso{' '}
                        <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={tratamentosEMedicacoes}
                        onChange={(event) => {
                          setTratamentosEMedicacoes(event.target.value)
                          setValidationHint(null)
                        }}
                        rows={3}
                        placeholder="Tratamentos não farmacológicos, medicamentos com dose/posologia e resposta obtida até o momento…"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Exames complementares já realizados
                      </span>
                      <textarea
                        value={examesRealizados}
                        onChange={(event) => setExamesRealizados(event.target.value)}
                        rows={3}
                        placeholder="Liste exames já feitos com data e principais resultados/laudos disponíveis…"
                        className={textareaClass}
                      />
                      <FieldHint>
                        Informar resultados evita repetição desnecessária de exames no serviço de
                        destino.
                      </FieldHint>
                    </label>
                  </div>

                  <div className="space-y-4 border-t border-gray-100 pt-5">
                    <SectionTitle>Complementos</SectionTitle>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                        Observações adicionais
                      </span>
                      <textarea
                        value={observacoes}
                        onChange={(event) => setObservacoes(event.target.value)}
                        rows={2}
                        placeholder="Orientações ao paciente, documentos que deve levar, contraindicações, etc."
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(124,58,237,0.35)] transition hover:brightness-105 disabled:opacity-60"
                >
                  <FileSignature className="h-4 w-4" />
                  {signing ? 'Gerando documento…' : 'Assinar encaminhamento'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Toast
        message="Encaminhamento registrado com sucesso."
        visible={successToastVisible}
        onClose={() => setSuccessToastVisible(false)}
        variant="success"
        durationMs={2000}
      />
    </>,
    document.body,
  )
}
