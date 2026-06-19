import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import {
  FormSection,
  PsychologistDocumentModalShell,
  TextAreaField,
  TextInputField,
  type PsychologistPatientInfo,
  type PsychologistProfessionalInfo,
} from './PsychologistDocumentModalShell'

export type PsychologistRelatorioMultiprofissionalSignedPayload = {
  destinatario?: string
  motivoRelatorio: string
  equipeEnvolvida: string
  demandaCompartilhada: string
  contribuicoesProfissionais: string
  sinteseClinica: string
  condutaIntegrada: string
  conclusaoMultiprofissional: string
  recomendacoes?: string
  observacoes?: string
}

type PsychologistRelatorioMultiprofissionalModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: PsychologistRelatorioMultiprofissionalSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

export function PsychologistRelatorioMultiprofissionalModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: PsychologistRelatorioMultiprofissionalModalProps) {
  const [destinatario, setDestinatario] = useState('')
  const [motivoRelatorio, setMotivoRelatorio] = useState('')
  const [equipeEnvolvida, setEquipeEnvolvida] = useState('')
  const [demandaCompartilhada, setDemandaCompartilhada] = useState('')
  const [contribuicoesProfissionais, setContribuicoesProfissionais] = useState('')
  const [sinteseClinica, setSinteseClinica] = useState('')
  const [condutaIntegrada, setCondutaIntegrada] = useState('')
  const [conclusaoMultiprofissional, setConclusaoMultiprofissional] = useState('')
  const [recomendacoes, setRecomendacoes] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDestinatario('')
    setMotivoRelatorio('')
    setEquipeEnvolvida('')
    setDemandaCompartilhada('')
    setContribuicoesProfissionais('')
    setSinteseClinica('')
    setCondutaIntegrada('')
    setConclusaoMultiprofissional('')
    setRecomendacoes('')
    setObservacoes('')
    setValidationHint(null)
    setSigning(false)
  }, [open])

  async function handleSign() {
    const required = [
      [motivoRelatorio, 'Informe o motivo do relatório multiprofissional.'],
      [equipeEnvolvida, 'Descreva a equipe envolvida.'],
      [demandaCompartilhada, 'Descreva a demanda compartilhada.'],
      [contribuicoesProfissionais, 'Descreva as contribuições de cada profissional.'],
      [sinteseClinica, 'Informe a síntese clínica.'],
      [condutaIntegrada, 'Descreva a conduta integrada.'],
      [conclusaoMultiprofissional, 'Informe a conclusão multiprofissional.'],
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
        motivoRelatorio: motivoRelatorio.trim(),
        equipeEnvolvida: equipeEnvolvida.trim(),
        demandaCompartilhada: demandaCompartilhada.trim(),
        contribuicoesProfissionais: contribuicoesProfissionais.trim(),
        sinteseClinica: sinteseClinica.trim(),
        condutaIntegrada: condutaIntegrada.trim(),
        conclusaoMultiprofissional: conclusaoMultiprofissional.trim(),
        recomendacoes: recomendacoes.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir o relatório multiprofissional.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Relatório multiprofissional"
      subtitle="Documento integrado com contribuições de diferentes profissionais"
      icon={Users}
      accent="teal"
      hint="Descreva a contribuição de cada profissional e a conduta integrada acordada pela equipe."
      onClose={onClose}
      onSign={handleSign}
      signing={signing}
      validationHint={validationHint}
      patient={patient}
      professional={professional}
    >
      <FormSection title="Identificação" accent="teal">
        <TextInputField
          label="Destinatário (opcional)"
          value={destinatario}
          onChange={setDestinatario}
          accent="teal"
          placeholder="Serviço, escola, equipe de referência..."
        />
        <TextAreaField
          label="Motivo do relatório"
          value={motivoRelatorio}
          onChange={setMotivoRelatorio}
          required
          accent="teal"
        />
      </FormSection>

      <FormSection title="Equipe e demanda" accent="teal">
        <TextAreaField
          label="Equipe envolvida"
          value={equipeEnvolvida}
          onChange={setEquipeEnvolvida}
          required
          rows={2}
          accent="teal"
          placeholder="Profissionais, funções e vínculo com o caso"
        />
        <TextAreaField
          label="Demanda compartilhada"
          value={demandaCompartilhada}
          onChange={setDemandaCompartilhada}
          required
          accent="teal"
        />
        <TextAreaField
          label="Contribuições dos profissionais"
          value={contribuicoesProfissionais}
          onChange={setContribuicoesProfissionais}
          required
          rows={3}
          accent="teal"
        />
      </FormSection>

      <FormSection title="Síntese e conduta" accent="teal">
        <TextAreaField
          label="Síntese clínica"
          value={sinteseClinica}
          onChange={setSinteseClinica}
          required
          accent="teal"
        />
        <TextAreaField
          label="Conduta integrada"
          value={condutaIntegrada}
          onChange={setCondutaIntegrada}
          required
          accent="teal"
        />
      </FormSection>

      <FormSection title="Conclusão" accent="teal">
        <TextAreaField
          label="Conclusão multiprofissional"
          value={conclusaoMultiprofissional}
          onChange={setConclusaoMultiprofissional}
          required
          accent="teal"
        />
        <TextAreaField
          label="Recomendações (opcional)"
          value={recomendacoes}
          onChange={setRecomendacoes}
          rows={2}
          accent="teal"
        />
      </FormSection>
    </PsychologistDocumentModalShell>
  )
}
