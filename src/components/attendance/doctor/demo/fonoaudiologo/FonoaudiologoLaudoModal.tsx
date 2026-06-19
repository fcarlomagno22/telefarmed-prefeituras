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

export type FonoaudiologoLaudoTipo =
  | 'avaliacao_fonoaudiologica'
  | 'linguagem'
  | 'audicao'
  | 'voz'
  | 'degluticao'
  | 'motricidade_orofacial'
  | 'pericia'
  | 'outro'

export type FonoaudiologoLaudoSignedPayload = {
  tipoLaudo: FonoaudiologoLaudoTipo
  destinatario?: string
  objetoLaudo: string
  metodologiaInstrumentos: string
  descricaoAchados: string
  analiseInterpretacao: string
  conclusaoLaudo: string
  recomendacoes?: string
  observacoes?: string
}

type FonoaudiologoLaudoModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: FonoaudiologoLaudoSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

export function FonoaudiologoLaudoModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: FonoaudiologoLaudoModalProps) {
  const [tipoLaudo, setTipoLaudo] = useState<FonoaudiologoLaudoTipo>('avaliacao_fonoaudiologica')
  const [destinatario, setDestinatario] = useState('')
  const [objetoLaudo, setObjetoLaudo] = useState('')
  const [metodologiaInstrumentos, setMetodologiaInstrumentos] = useState('')
  const [descricaoAchados, setDescricaoAchados] = useState('')
  const [analiseInterpretacao, setAnaliseInterpretacao] = useState('')
  const [conclusaoLaudo, setConclusaoLaudo] = useState('')
  const [recomendacoes, setRecomendacoes] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTipoLaudo('avaliacao_fonoaudiologica')
    setDestinatario('')
    setObjetoLaudo('')
    setMetodologiaInstrumentos('')
    setDescricaoAchados('')
    setAnaliseInterpretacao('')
    setConclusaoLaudo('')
    setRecomendacoes('')
    setObservacoes('')
    setValidationHint(null)
    setSigning(false)
  }, [open])

  async function handleSign() {
    const required = [
      [objetoLaudo, 'Informe o objeto do laudo.'],
      [metodologiaInstrumentos, 'Descreva a metodologia e instrumentos.'],
      [descricaoAchados, 'Descreva os achados.'],
      [analiseInterpretacao, 'Descreva a análise e interpretação.'],
      [conclusaoLaudo, 'Informe a conclusão do laudo.'],
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
        metodologiaInstrumentos: metodologiaInstrumentos.trim(),
        descricaoAchados: descricaoAchados.trim(),
        analiseInterpretacao: analiseInterpretacao.trim(),
        conclusaoLaudo: conclusaoLaudo.trim(),
        recomendacoes: recomendacoes.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir o laudo fonoaudiológico.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Laudo fonoaudiológico"
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
              { value: 'avaliacao_fonoaudiologica', label: 'Avaliação fonoaudiológica' },
              { value: 'linguagem', label: 'Linguagem' },
              { value: 'audicao', label: 'Audição' },
              { value: 'voz', label: 'Voz' },
              { value: 'degluticao', label: 'Deglutição' },
              { value: 'motricidade_orofacial', label: 'Motricidade orofacial' },
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
          label="Metodologia e instrumentos"
          value={metodologiaInstrumentos}
          onChange={setMetodologiaInstrumentos}
          required
          accent="blue"
        />
        <TextAreaField
          label="Descrição dos achados"
          value={descricaoAchados}
          onChange={setDescricaoAchados}
          required
          rows={3}
          accent="blue"
        />
      </FormSection>

      <FormSection title="Interpretação e conclusão" accent="blue">
        <TextAreaField
          label="Análise e interpretação"
          value={analiseInterpretacao}
          onChange={setAnaliseInterpretacao}
          required
          rows={3}
          accent="blue"
        />
        <TextAreaField
          label="Conclusão do laudo"
          value={conclusaoLaudo}
          onChange={setConclusaoLaudo}
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
