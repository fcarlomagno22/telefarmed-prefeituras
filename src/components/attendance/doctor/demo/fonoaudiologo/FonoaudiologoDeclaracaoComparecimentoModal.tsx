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

export type FonoaudiologoDeclaracaoComparecimentoSignedPayload = {
  dataInicio: string
  observacoes?: string
}

type FonoaudiologoDeclaracaoComparecimentoModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: FonoaudiologoDeclaracaoComparecimentoSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

export function FonoaudiologoDeclaracaoComparecimentoModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: FonoaudiologoDeclaracaoComparecimentoModalProps) {
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
      subtitle="Comprovante de consulta fonoaudiológica realizada"
      icon={CalendarCheck}
      accent="emerald"
      hint="Documento simples para comprovar comparecimento à consulta fonoaudiológica."
      onClose={onClose}
      onSign={handleSign}
      signing={signing}
      validationHint={validationHint}
      patient={patient}
      professional={professional}
    >
      <FormSection title="Comparecimento" accent="emerald">
        <TextInputField
          label="Data da consulta"
          type="date"
          value={dataInicio}
          onChange={setDataInicio}
          accent="emerald"
        />
        <TextAreaField
          label="Observações adicionais (opcional)"
          value={observacoes}
          onChange={setObservacoes}
          rows={2}
          accent="emerald"
        />
      </FormSection>
    </PsychologistDocumentModalShell>
  )
}
