import { useEffect, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import {
  FormSection,
  PsychologistDocumentModalShell,
  TextAreaField,
  TextInputField,
  type PsychologistPatientInfo,
  type PsychologistProfessionalInfo,
} from '../psicologo/PsychologistDocumentModalShell'

export type NutritionistDeclaracaoComparecimentoSignedPayload = {
  dataInicio: string
  observacoes?: string
}

type NutritionistDeclaracaoComparecimentoModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: NutritionistDeclaracaoComparecimentoSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

export function NutritionistDeclaracaoComparecimentoModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: NutritionistDeclaracaoComparecimentoModalProps) {
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().slice(0, 10))
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDataInicio(new Date().toISOString().slice(0, 10))
    setObservacoes('')
    setValidationHint(null)
    setSigning(false)
  }, [open])

  async function handleSign() {
    setSigning(true)
    setValidationHint(null)
    try {
      await onSigned?.({
        dataInicio,
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir a declaração de comparecimento.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Declaração de comparecimento"
      subtitle="Comprovante de consulta nutricional realizada"
      icon={CalendarCheck}
      accent="lime"
      hint="Documento simples para comprovar comparecimento à consulta nutricional."
      onClose={onClose}
      onSign={handleSign}
      signing={signing}
      validationHint={validationHint}
      patient={patient}
      professional={professional}
    >
      <FormSection title="Comparecimento" accent="lime">
        <TextInputField
          label="Data da consulta"
          type="date"
          value={dataInicio}
          onChange={setDataInicio}
          accent="lime"
        />
        <TextAreaField
          label="Observações adicionais (opcional)"
          value={observacoes}
          onChange={setObservacoes}
          rows={2}
          accent="lime"
        />
      </FormSection>
    </PsychologistDocumentModalShell>
  )
}
