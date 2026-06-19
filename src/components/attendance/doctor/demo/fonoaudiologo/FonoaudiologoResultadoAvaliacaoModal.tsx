import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import {
  FormSection,
  PsychologistDocumentModalShell,
  SelectField,
  TextAreaField,
  TextInputField,
  type PsychologistPatientInfo,
  type PsychologistProfessionalInfo,
} from '../psicologo/PsychologistDocumentModalShell'

export type FonoaudiologoResultadoAvaliacaoTipo =
  | 'audiologica'
  | 'linguagem'
  | 'voz'
  | 'degluticao'
  | 'motricidade_orofacial'
  | 'outro'

export type FonoaudiologoResultadoAvaliacaoSignedPayload = {
  tipoAvaliacao: FonoaudiologoResultadoAvaliacaoTipo
  nomeExameAvaliacao: string
  metodologia: string
  resultados: string
  interpretacao: string
  conclusao: string
  observacoes?: string
}

type FonoaudiologoResultadoAvaliacaoModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: FonoaudiologoResultadoAvaliacaoSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

export function FonoaudiologoResultadoAvaliacaoModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: FonoaudiologoResultadoAvaliacaoModalProps) {
  const [tipoAvaliacao, setTipoAvaliacao] = useState<FonoaudiologoResultadoAvaliacaoTipo>('audiologica')
  const [nomeExameAvaliacao, setNomeExameAvaliacao] = useState('')
  const [metodologia, setMetodologia] = useState('')
  const [resultados, setResultados] = useState('')
  const [interpretacao, setInterpretacao] = useState('')
  const [conclusao, setConclusao] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTipoAvaliacao('audiologica')
    setNomeExameAvaliacao('')
    setMetodologia('')
    setResultados('')
    setInterpretacao('')
    setConclusao('')
    setObservacoes('')
    setValidationHint(null)
    setSigning(false)
  }, [open])

  async function handleSign() {
    const required = [
      [nomeExameAvaliacao, 'Informe o nome do exame ou avaliação.'],
      [metodologia, 'Descreva a metodologia utilizada.'],
      [resultados, 'Descreva os resultados.'],
      [interpretacao, 'Descreva a interpretação.'],
      [conclusao, 'Informe a conclusão.'],
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
        tipoAvaliacao,
        nomeExameAvaliacao: nomeExameAvaliacao.trim(),
        metodologia: metodologia.trim(),
        resultados: resultados.trim(),
        interpretacao: interpretacao.trim(),
        conclusao: conclusao.trim(),
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir o resultado de avaliação/exame.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Resultado de avaliação / exame"
      subtitle="Resultado formal de avaliação ou exame fonoaudiológico"
      icon={Activity}
      accent="sky"
      hint="Registre metodologia, resultados, interpretação e conclusão de forma técnica."
      onClose={onClose}
      onSign={handleSign}
      signing={signing}
      validationHint={validationHint}
      patient={patient}
      professional={professional}
    >
      <FormSection title="Identificação" accent="sky">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Tipo de avaliação"
            value={tipoAvaliacao}
            onChange={setTipoAvaliacao}
            accent="sky"
            options={[
              { value: 'audiologica', label: 'Audiológica' },
              { value: 'linguagem', label: 'Linguagem' },
              { value: 'voz', label: 'Voz' },
              { value: 'degluticao', label: 'Deglutição' },
              { value: 'motricidade_orofacial', label: 'Motricidade orofacial' },
              { value: 'outro', label: 'Outro' },
            ]}
          />
          <TextInputField
            label="Nome do exame / avaliação"
            value={nomeExameAvaliacao}
            onChange={setNomeExameAvaliacao}
            required
            accent="sky"
          />
        </div>
      </FormSection>

      <FormSection title="Metodologia e resultados" accent="sky">
        <TextAreaField
          label="Metodologia"
          value={metodologia}
          onChange={setMetodologia}
          required
          accent="sky"
        />
        <TextAreaField
          label="Resultados"
          value={resultados}
          onChange={setResultados}
          required
          rows={3}
          accent="sky"
        />
      </FormSection>

      <FormSection title="Interpretação e conclusão" accent="sky">
        <TextAreaField
          label="Interpretação"
          value={interpretacao}
          onChange={setInterpretacao}
          required
          rows={3}
          accent="sky"
        />
        <TextAreaField
          label="Conclusão"
          value={conclusao}
          onChange={setConclusao}
          required
          accent="sky"
        />
      </FormSection>
    </PsychologistDocumentModalShell>
  )
}
