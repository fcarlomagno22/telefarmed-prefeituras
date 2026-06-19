import { useEffect, useState } from 'react'
import { FileBarChart } from 'lucide-react'
import {
  FormSection,
  PsychologistDocumentModalShell,
  SelectField,
  TextAreaField,
  TextInputField,
  type PsychologistPatientInfo,
  type PsychologistProfessionalInfo,
} from '../psicologo/PsychologistDocumentModalShell'

export type NutritionistRelatorioFinalidade =
  | 'acompanhamento'
  | 'encaminhamento'
  | 'escolar'
  | 'trabalhista'
  | 'judicial'
  | 'outro'

export type NutritionistRelatorioSignedPayload = {
  finalidade: NutritionistRelatorioFinalidade
  destinatario?: string
  motivoRelatorio: string
  anamneseNutricional: string
  avaliacaoAntropometrica: string
  avaliacaoDietetica: string
  diagnosticoNutricional: string
  intervencaoProposta: string
  conclusao: string
  recomendacoes?: string
  observacoes?: string
}

type NutritionistRelatorioModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: NutritionistRelatorioSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

export function NutritionistRelatorioModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: NutritionistRelatorioModalProps) {
  const [finalidade, setFinalidade] = useState<NutritionistRelatorioFinalidade>('acompanhamento')
  const [destinatario, setDestinatario] = useState('')
  const [motivoRelatorio, setMotivoRelatorio] = useState('')
  const [anamneseNutricional, setAnamneseNutricional] = useState('')
  const [avaliacaoAntropometrica, setAvaliacaoAntropometrica] = useState('')
  const [avaliacaoDietetica, setAvaliacaoDietetica] = useState('')
  const [diagnosticoNutricional, setDiagnosticoNutricional] = useState('')
  const [intervencaoProposta, setIntervencaoProposta] = useState('')
  const [conclusao, setConclusao] = useState('')
  const [recomendacoes, setRecomendacoes] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFinalidade('acompanhamento')
    setDestinatario('')
    setMotivoRelatorio('')
    setAnamneseNutricional('')
    setAvaliacaoAntropometrica('')
    setAvaliacaoDietetica('')
    setDiagnosticoNutricional('')
    setIntervencaoProposta('')
    setConclusao('')
    setRecomendacoes('')
    setObservacoes('')
    setValidationHint(null)
    setSigning(false)
  }, [open])

  async function handleSign() {
    const required = [
      [motivoRelatorio, 'Informe o motivo do relatório.'],
      [anamneseNutricional, 'Descreva a anamnese nutricional.'],
      [avaliacaoAntropometrica, 'Descreva a avaliação antropométrica.'],
      [avaliacaoDietetica, 'Descreva a avaliação dietética.'],
      [diagnosticoNutricional, 'Informe o diagnóstico nutricional.'],
      [intervencaoProposta, 'Descreva a intervenção proposta.'],
      [conclusao, 'Informe a conclusão do relatório.'],
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
        finalidade,
        destinatario: destinatario.trim() || undefined,
        motivoRelatorio: motivoRelatorio.trim(),
        anamneseNutricional: anamneseNutricional.trim(),
        avaliacaoAntropometrica: avaliacaoAntropometrica.trim(),
        avaliacaoDietetica: avaliacaoDietetica.trim(),
        diagnosticoNutricional: diagnosticoNutricional.trim(),
        intervencaoProposta: intervencaoProposta.trim(),
        conclusao: conclusao.trim(),
        recomendacoes: recomendacoes.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir o relatório nutricional.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Relatório nutricional"
      subtitle="Síntese da avaliação e conduta nutricional"
      icon={FileBarChart}
      accent="violet"
      hint="Organize anamnese, avaliação, intervenção e conclusão de forma objetiva."
      onClose={onClose}
      onSign={handleSign}
      signing={signing}
      validationHint={validationHint}
      patient={patient}
      professional={professional}
    >
      <FormSection title="Identificação" accent="violet">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Finalidade"
            value={finalidade}
            onChange={setFinalidade}
            accent="violet"
            options={[
              { value: 'acompanhamento', label: 'Acompanhamento nutricional' },
              { value: 'encaminhamento', label: 'Encaminhamento' },
              { value: 'escolar', label: 'Escolar / institucional' },
              { value: 'trabalhista', label: 'Trabalhista / ocupacional' },
              { value: 'judicial', label: 'Judicial / pericial' },
              { value: 'outro', label: 'Outra finalidade' },
            ]}
          />
          <TextInputField
            label="Destinatário (opcional)"
            value={destinatario}
            onChange={setDestinatario}
            accent="violet"
          />
        </div>
        <TextAreaField
          label="Motivo do relatório"
          value={motivoRelatorio}
          onChange={setMotivoRelatorio}
          required
          accent="violet"
        />
      </FormSection>

      <FormSection title="Anamnese e avaliação" accent="violet">
        <TextAreaField
          label="Anamnese nutricional"
          value={anamneseNutricional}
          onChange={setAnamneseNutricional}
          required
          rows={3}
          accent="violet"
        />
        <TextAreaField
          label="Avaliação antropométrica"
          value={avaliacaoAntropometrica}
          onChange={setAvaliacaoAntropometrica}
          required
          rows={2}
          accent="violet"
        />
        <TextAreaField
          label="Avaliação dietética"
          value={avaliacaoDietetica}
          onChange={setAvaliacaoDietetica}
          required
          rows={2}
          accent="violet"
        />
        <TextInputField
          label="Diagnóstico nutricional"
          value={diagnosticoNutricional}
          onChange={setDiagnosticoNutricional}
          required
          accent="violet"
        />
      </FormSection>

      <FormSection title="Intervenção e conclusão" accent="violet">
        <TextAreaField
          label="Intervenção proposta"
          value={intervencaoProposta}
          onChange={setIntervencaoProposta}
          required
          accent="violet"
        />
        <TextAreaField
          label="Conclusão"
          value={conclusao}
          onChange={setConclusao}
          required
          accent="violet"
        />
        <TextAreaField
          label="Recomendações (opcional)"
          value={recomendacoes}
          onChange={setRecomendacoes}
          rows={2}
          accent="violet"
        />
      </FormSection>
    </PsychologistDocumentModalShell>
  )
}
