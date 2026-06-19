import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import {
  FormSection,
  PsychologistDocumentModalShell,
  TextAreaField,
  TextInputField,
  type PsychologistPatientInfo,
  type PsychologistProfessionalInfo,
} from '../psicologo/PsychologistDocumentModalShell'

export type FonoaudiologoPlanoTerapeuticoSignedPayload = {
  objetivo: string
  diagnosticoFonoaudiologico: string
  metasTerapeuticas: string
  procedimentosOrientacoes: string
  frequenciaDuracao?: string
  orientacoesGerais?: string
  observacoes?: string
}

type FonoaudiologoPlanoTerapeuticoModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: FonoaudiologoPlanoTerapeuticoSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

export function FonoaudiologoPlanoTerapeuticoModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: FonoaudiologoPlanoTerapeuticoModalProps) {
  const [objetivo, setObjetivo] = useState('')
  const [diagnosticoFonoaudiologico, setDiagnosticoFonoaudiologico] = useState('')
  const [metasTerapeuticas, setMetasTerapeuticas] = useState('')
  const [procedimentosOrientacoes, setProcedimentosOrientacoes] = useState('')
  const [frequenciaDuracao, setFrequenciaDuracao] = useState('')
  const [orientacoesGerais, setOrientacoesGerais] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setObjetivo('')
    setDiagnosticoFonoaudiologico('')
    setMetasTerapeuticas('')
    setProcedimentosOrientacoes('')
    setFrequenciaDuracao('')
    setOrientacoesGerais('')
    setObservacoes('')
    setValidationHint(null)
    setSigning(false)
  }, [open])

  async function handleSign() {
    const required = [
      [objetivo, 'Informe o objetivo terapêutico.'],
      [diagnosticoFonoaudiologico, 'Informe o diagnóstico fonoaudiológico.'],
      [metasTerapeuticas, 'Descreva as metas terapêuticas.'],
      [procedimentosOrientacoes, 'Descreva os procedimentos e orientações.'],
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
        objetivo: objetivo.trim(),
        diagnosticoFonoaudiologico: diagnosticoFonoaudiologico.trim(),
        metasTerapeuticas: metasTerapeuticas.trim(),
        procedimentosOrientacoes: procedimentosOrientacoes.trim(),
        frequenciaDuracao: frequenciaDuracao.trim() || undefined,
        orientacoesGerais: orientacoesGerais.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir o plano terapêutico fonoaudiológico.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Plano terapêutico fonoaudiológico"
      subtitle="Objetivos, metas, procedimentos e orientações"
      icon={ClipboardList}
      accent="teal"
      hint="Descreva objetivos, metas e condutas de forma clara para o paciente e equipe."
      onClose={onClose}
      onSign={handleSign}
      signing={signing}
      validationHint={validationHint}
      patient={patient}
      professional={professional}
    >
      <FormSection title="Objetivo e diagnóstico" accent="teal">
        <TextAreaField
          label="Objetivo terapêutico"
          value={objetivo}
          onChange={setObjetivo}
          required
          accent="teal"
        />
        <TextInputField
          label="Diagnóstico fonoaudiológico"
          value={diagnosticoFonoaudiologico}
          onChange={setDiagnosticoFonoaudiologico}
          required
          accent="teal"
        />
        <TextAreaField
          label="Metas terapêuticas"
          value={metasTerapeuticas}
          onChange={setMetasTerapeuticas}
          required
          rows={3}
          accent="teal"
        />
      </FormSection>

      <FormSection title="Procedimentos e orientações" accent="teal">
        <TextAreaField
          label="Procedimentos e orientações"
          value={procedimentosOrientacoes}
          onChange={setProcedimentosOrientacoes}
          required
          accent="teal"
        />
        <TextInputField
          label="Frequência e duração (opcional)"
          value={frequenciaDuracao}
          onChange={setFrequenciaDuracao}
          accent="teal"
          placeholder="Ex.: 2 sessões/semana por 6 meses"
        />
        <TextAreaField
          label="Orientações gerais (opcional)"
          value={orientacoesGerais}
          onChange={setOrientacoesGerais}
          rows={2}
          accent="teal"
        />
      </FormSection>
    </PsychologistDocumentModalShell>
  )
}
