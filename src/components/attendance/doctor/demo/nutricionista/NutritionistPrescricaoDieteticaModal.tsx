import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import {
  FormSection,
  PsychologistDocumentModalShell,
  TextAreaField,
  type PsychologistPatientInfo,
  type PsychologistProfessionalInfo,
} from '../psicologo/PsychologistDocumentModalShell'

export type NutritionistPrescricaoDieteticaSignedPayload = {
  indicacaoClinica: string
  prescricao: string
  restricoes?: string
  observacoes?: string
}

type NutritionistPrescricaoDieteticaModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: NutritionistPrescricaoDieteticaSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

export function NutritionistPrescricaoDieteticaModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: NutritionistPrescricaoDieteticaModalProps) {
  const [indicacaoClinica, setIndicacaoClinica] = useState('')
  const [prescricao, setPrescricao] = useState('')
  const [restricoes, setRestricoes] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setIndicacaoClinica('')
    setPrescricao('')
    setRestricoes('')
    setObservacoes('')
    setValidationHint(null)
    setSigning(false)
  }, [open])

  async function handleSign() {
    if (!indicacaoClinica.trim()) {
      setValidationHint('Informe a indicação clínica.')
      return
    }
    if (!prescricao.trim()) {
      setValidationHint('Descreva a prescrição dietética.')
      return
    }

    setSigning(true)
    setValidationHint(null)
    try {
      await onSigned?.({
        indicacaoClinica: indicacaoClinica.trim(),
        prescricao: prescricao.trim(),
        restricoes: restricoes.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir a prescrição dietética.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Prescrição dietética"
      subtitle="Dieta prescrita com base na avaliação nutricional"
      icon={ClipboardList}
      accent="teal"
      hint="Descreva a dieta de forma objetiva, incluindo porções e frequência quando aplicável."
      onClose={onClose}
      onSign={handleSign}
      signing={signing}
      validationHint={validationHint}
      patient={patient}
      professional={professional}
    >
      <FormSection title="Indicação" accent="teal">
        <TextAreaField
          label="Indicação clínica"
          value={indicacaoClinica}
          onChange={setIndicacaoClinica}
          required
          accent="teal"
        />
      </FormSection>

      <FormSection title="Prescrição" accent="teal">
        <TextAreaField
          label="Prescrição dietética"
          value={prescricao}
          onChange={setPrescricao}
          required
          rows={5}
          accent="teal"
        />
        <TextAreaField
          label="Restrições alimentares (opcional)"
          value={restricoes}
          onChange={setRestricoes}
          rows={2}
          accent="teal"
        />
        <TextAreaField
          label="Observações (opcional)"
          value={observacoes}
          onChange={setObservacoes}
          rows={2}
          accent="teal"
        />
      </FormSection>
    </PsychologistDocumentModalShell>
  )
}
