import { useEffect, useState } from 'react'
import { Microscope } from 'lucide-react'
import {
  FormSection,
  PsychologistDocumentModalShell,
  SelectField,
  TextAreaField,
  TextInputField,
  type PsychologistPatientInfo,
  type PsychologistProfessionalInfo,
} from '../psicologo/PsychologistDocumentModalShell'

export type NutritionistLaudoTipo =
  | 'avaliacao_nutricional'
  | 'antropometrica'
  | 'dietoterapia'
  | 'pericia'
  | 'outro'

export type NutritionistLaudoSignedPayload = {
  tipoLaudo: NutritionistLaudoTipo
  destinatario?: string
  objetoLaudo: string
  metodologiaAvaliacao: string
  achados: string
  interpretacao: string
  conclusao: string
  recomendacoes?: string
  observacoes?: string
}

type NutritionistLaudoModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: NutritionistLaudoSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

export function NutritionistLaudoModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: NutritionistLaudoModalProps) {
  const [tipoLaudo, setTipoLaudo] = useState<NutritionistLaudoTipo>('avaliacao_nutricional')
  const [destinatario, setDestinatario] = useState('')
  const [objetoLaudo, setObjetoLaudo] = useState('')
  const [metodologiaAvaliacao, setMetodologiaAvaliacao] = useState('')
  const [achados, setAchados] = useState('')
  const [interpretacao, setInterpretacao] = useState('')
  const [conclusao, setConclusao] = useState('')
  const [recomendacoes, setRecomendacoes] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTipoLaudo('avaliacao_nutricional')
    setDestinatario('')
    setObjetoLaudo('')
    setMetodologiaAvaliacao('')
    setAchados('')
    setInterpretacao('')
    setConclusao('')
    setRecomendacoes('')
    setObservacoes('')
    setValidationHint(null)
    setSigning(false)
  }, [open])

  async function handleSign() {
    const required = [
      [objetoLaudo, 'Informe o objeto do laudo.'],
      [metodologiaAvaliacao, 'Descreva a metodologia de avaliação.'],
      [achados, 'Descreva os achados.'],
      [interpretacao, 'Descreva a interpretação.'],
      [conclusao, 'Informe a conclusão do laudo.'],
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
        tipoLaudo,
        destinatario: destinatario.trim() || undefined,
        objetoLaudo: objetoLaudo.trim(),
        metodologiaAvaliacao: metodologiaAvaliacao.trim(),
        achados: achados.trim(),
        interpretacao: interpretacao.trim(),
        conclusao: conclusao.trim(),
        recomendacoes: recomendacoes.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir o laudo nutricional.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Laudo / avaliação nutricional"
      subtitle="Achados, interpretação e conclusão técnica"
      icon={Microscope}
      accent="blue"
      hint="Descreva metodologia, achados e conclusão de forma técnica e objetiva."
      onClose={onClose}
      onSign={handleSign}
      signing={signing}
      validationHint={validationHint}
      patient={patient}
      professional={professional}
    >
      <FormSection title="Identificação do laudo" accent="blue">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Tipo de laudo"
            value={tipoLaudo}
            onChange={setTipoLaudo}
            accent="blue"
            options={[
              { value: 'avaliacao_nutricional', label: 'Avaliação nutricional' },
              { value: 'antropometrica', label: 'Avaliação antropométrica' },
              { value: 'dietoterapia', label: 'Dietoterapia / plano alimentar' },
              { value: 'pericia', label: 'Perícia / avaliação pericial' },
              { value: 'outro', label: 'Outro' },
            ]}
          />
          <TextInputField
            label="Destinatário (opcional)"
            value={destinatario}
            onChange={setDestinatario}
            accent="blue"
          />
        </div>
        <TextInputField
          label="Objeto do laudo"
          value={objetoLaudo}
          onChange={setObjetoLaudo}
          required
          accent="blue"
        />
      </FormSection>

      <FormSection title="Metodologia e achados" accent="blue">
        <TextAreaField
          label="Metodologia de avaliação"
          value={metodologiaAvaliacao}
          onChange={setMetodologiaAvaliacao}
          required
          accent="blue"
        />
        <TextAreaField
          label="Achados"
          value={achados}
          onChange={setAchados}
          required
          rows={3}
          accent="blue"
        />
      </FormSection>

      <FormSection title="Interpretação e conclusão" accent="blue">
        <TextAreaField
          label="Interpretação"
          value={interpretacao}
          onChange={setInterpretacao}
          required
          rows={3}
          accent="blue"
        />
        <TextAreaField
          label="Conclusão"
          value={conclusao}
          onChange={setConclusao}
          required
          accent="blue"
        />
        <TextAreaField
          label="Recomendações (opcional)"
          value={recomendacoes}
          onChange={setRecomendacoes}
          rows={2}
          accent="blue"
        />
      </FormSection>
    </PsychologistDocumentModalShell>
  )
}
