import { useEffect, useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import {
  FormSection,
  PsychologistDocumentModalShell,
  SelectField,
  TextAreaField,
  TextInputField,
  type PsychologistPatientInfo,
  type PsychologistProfessionalInfo,
} from './PsychologistDocumentModalShell'

export type PsychologistEncaminhamentoDestino = 'medico' | 'psiquiatra' | 'outro_profissional'

export type PsychologistEncaminhamentoSignedPayload = {
  profissionalDestino: PsychologistEncaminhamentoDestino
  destinoLabel: string
  prioridade: 'eletivo' | 'prioritario' | 'urgente'
  motivoEncaminhamento: string
  resumoAtendimento: string
  hipotesePsicologica: string
  condutaRealizada: string
  expectativaEncaminhamento: string
  observacoes?: string
}

const DESTINO_PRESETS: Record<
  PsychologistEncaminhamentoDestino,
  { label: string; destinoLabel: string }
> = {
  medico: { label: 'Médico(a)', destinoLabel: 'Clínica médica / medicina de família' },
  psiquiatra: { label: 'Psiquiatra', destinoLabel: 'Psiquiatria' },
  outro_profissional: { label: 'Outro profissional', destinoLabel: 'Serviço especializado' },
}

type PsychologistEncaminhamentoModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: PsychologistEncaminhamentoSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

export function PsychologistEncaminhamentoModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: PsychologistEncaminhamentoModalProps) {
  const [profissionalDestino, setProfissionalDestino] =
    useState<PsychologistEncaminhamentoDestino>('psiquiatra')
  const [destinoLabel, setDestinoLabel] = useState(DESTINO_PRESETS.psiquiatra.destinoLabel)
  const [prioridade, setPrioridade] = useState<'eletivo' | 'prioritario' | 'urgente'>('eletivo')
  const [motivoEncaminhamento, setMotivoEncaminhamento] = useState('')
  const [resumoAtendimento, setResumoAtendimento] = useState('')
  const [hipotesePsicologica, setHipotesePsicologica] = useState('')
  const [condutaRealizada, setCondutaRealizada] = useState('')
  const [expectativaEncaminhamento, setExpectativaEncaminhamento] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setProfissionalDestino('psiquiatra')
    setDestinoLabel(DESTINO_PRESETS.psiquiatra.destinoLabel)
    setPrioridade('eletivo')
    setMotivoEncaminhamento('')
    setResumoAtendimento('')
    setHipotesePsicologica('')
    setCondutaRealizada('')
    setExpectativaEncaminhamento('')
    setObservacoes('')
    setValidationHint(null)
    setSigning(false)
  }, [open])

  function handleDestinoChange(value: PsychologistEncaminhamentoDestino) {
    setProfissionalDestino(value)
    setDestinoLabel(DESTINO_PRESETS[value].destinoLabel)
  }

  async function handleSign() {
    const required = [
      [destinoLabel, 'Informe o serviço ou profissional de destino.'],
      [motivoEncaminhamento, 'Descreva o motivo do encaminhamento.'],
      [resumoAtendimento, 'Descreva o resumo do atendimento psicológico.'],
      [hipotesePsicologica, 'Informe a hipótese psicológica.'],
      [condutaRealizada, 'Descreva a conduta já realizada.'],
      [expectativaEncaminhamento, 'Descreva a expectativa do encaminhamento.'],
    ] as const

    for (const [value, message] of required) {
      if (!value.trim()) {
        setValidationHint(message)
        return
      }
    }

    setSigning(true)
    setValidationHint(null)
    try {
      await onSigned?.({
        profissionalDestino,
        destinoLabel: destinoLabel.trim(),
        prioridade,
        motivoEncaminhamento: motivoEncaminhamento.trim(),
        resumoAtendimento: resumoAtendimento.trim(),
        hipotesePsicologica: hipotesePsicologica.trim(),
        condutaRealizada: condutaRealizada.trim(),
        expectativaEncaminhamento: expectativaEncaminhamento.trim(),
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir o encaminhamento.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Encaminhamento psicológico"
      subtitle="Encaminhamento para médico, psiquiatra ou outro profissional"
      icon={ArrowRightLeft}
      accent="violet"
      hint="Descreva o motivo clínico e o que se espera do profissional de destino."
      onClose={onClose}
      onSign={handleSign}
      signing={signing}
      validationHint={validationHint}
      patient={patient}
      professional={professional}
    >
      <FormSection title="Destino" accent="violet">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Profissional de destino"
            value={profissionalDestino}
            onChange={handleDestinoChange}
            accent="violet"
            options={[
              { value: 'medico', label: DESTINO_PRESETS.medico.label },
              { value: 'psiquiatra', label: DESTINO_PRESETS.psiquiatra.label },
              { value: 'outro_profissional', label: DESTINO_PRESETS.outro_profissional.label },
            ]}
          />
          <SelectField
            label="Prioridade"
            value={prioridade}
            onChange={setPrioridade}
            accent="violet"
            options={[
              { value: 'eletivo', label: 'Eletivo' },
              { value: 'prioritario', label: 'Prioritário' },
              { value: 'urgente', label: 'Urgente' },
            ]}
          />
        </div>
        <TextInputField
          label="Serviço / especialidade de destino"
          value={destinoLabel}
          onChange={setDestinoLabel}
          required
          accent="violet"
        />
      </FormSection>

      <FormSection title="Motivo e resumo" accent="violet">
        <TextAreaField
          label="Motivo do encaminhamento"
          value={motivoEncaminhamento}
          onChange={setMotivoEncaminhamento}
          required
          accent="violet"
        />
        <TextAreaField
          label="Resumo do atendimento psicológico"
          value={resumoAtendimento}
          onChange={setResumoAtendimento}
          required
          rows={3}
          accent="violet"
        />
        <TextInputField
          label="Hipótese psicológica"
          value={hipotesePsicologica}
          onChange={setHipotesePsicologica}
          required
          accent="violet"
        />
      </FormSection>

      <FormSection title="Conduta e expectativa" accent="violet">
        <TextAreaField
          label="Conduta já realizada"
          value={condutaRealizada}
          onChange={setCondutaRealizada}
          required
          accent="violet"
        />
        <TextAreaField
          label="Expectativa do encaminhamento"
          value={expectativaEncaminhamento}
          onChange={setExpectativaEncaminhamento}
          required
          accent="violet"
        />
        <TextAreaField
          label="Observações (opcional)"
          value={observacoes}
          onChange={setObservacoes}
          rows={2}
          accent="violet"
        />
      </FormSection>
    </PsychologistDocumentModalShell>
  )
}
