import { useEffect, useState } from 'react'
import { Scale } from 'lucide-react'
import {
  FormSection,
  PsychologistDocumentModalShell,
  TextAreaField,
  TextInputField,
  type PsychologistPatientInfo,
  type PsychologistProfessionalInfo,
} from './PsychologistDocumentModalShell'

export type PsychologistParecerSignedPayload = {
  destinatario?: string
  questaoApresentada: string
  contextoAvaliacao: string
  analiseTecnica: string
  parecerConclusivo: string
  recomendacoes?: string
  observacoes?: string
}

type PsychologistParecerModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: PsychologistParecerSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

export function PsychologistParecerModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: PsychologistParecerModalProps) {
  const [destinatario, setDestinatario] = useState('')
  const [questaoApresentada, setQuestaoApresentada] = useState('')
  const [contextoAvaliacao, setContextoAvaliacao] = useState('')
  const [analiseTecnica, setAnaliseTecnica] = useState('')
  const [parecerConclusivo, setParecerConclusivo] = useState('')
  const [recomendacoes, setRecomendacoes] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDestinatario('')
    setQuestaoApresentada('')
    setContextoAvaliacao('')
    setAnaliseTecnica('')
    setParecerConclusivo('')
    setRecomendacoes('')
    setObservacoes('')
    setValidationHint(null)
    setSigning(false)
  }, [open])

  async function handleSign() {
    const required = [
      [questaoApresentada, 'Informe a questão apresentada.'],
      [contextoAvaliacao, 'Descreva o contexto da avaliação.'],
      [analiseTecnica, 'Descreva a análise técnica.'],
      [parecerConclusivo, 'Informe o parecer conclusivo.'],
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
        destinatario: destinatario.trim() || undefined,
        questaoApresentada: questaoApresentada.trim(),
        contextoAvaliacao: contextoAvaliacao.trim(),
        analiseTecnica: analiseTecnica.trim(),
        parecerConclusivo: parecerConclusivo.trim(),
        recomendacoes: recomendacoes.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir o parecer psicológico.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Parecer psicológico"
      subtitle="Resposta técnica formal a uma questão específica"
      icon={Scale}
      accent="fuchsia"
      hint="Responda diretamente à questão apresentada, com fundamentação técnica clara."
      onClose={onClose}
      onSign={handleSign}
      signing={signing}
      validationHint={validationHint}
      patient={patient}
      professional={professional}
    >
      <FormSection title="Identificação" accent="fuchsia">
        <TextInputField
          label="Destinatário (opcional)"
          value={destinatario}
          onChange={setDestinatario}
          accent="fuchsia"
        />
        <TextAreaField
          label="Questão apresentada"
          value={questaoApresentada}
          onChange={setQuestaoApresentada}
          required
          accent="fuchsia"
        />
      </FormSection>

      <FormSection title="Análise" accent="fuchsia">
        <TextAreaField
          label="Contexto da avaliação"
          value={contextoAvaliacao}
          onChange={setContextoAvaliacao}
          required
          accent="fuchsia"
        />
        <TextAreaField
          label="Análise técnica"
          value={analiseTecnica}
          onChange={setAnaliseTecnica}
          required
          rows={3}
          accent="fuchsia"
        />
      </FormSection>

      <FormSection title="Parecer" accent="fuchsia">
        <TextAreaField
          label="Parecer conclusivo"
          value={parecerConclusivo}
          onChange={setParecerConclusivo}
          required
          accent="fuchsia"
        />
        <TextAreaField
          label="Recomendações (opcional)"
          value={recomendacoes}
          onChange={setRecomendacoes}
          rows={2}
          accent="fuchsia"
        />
      </FormSection>
    </PsychologistDocumentModalShell>
  )
}
