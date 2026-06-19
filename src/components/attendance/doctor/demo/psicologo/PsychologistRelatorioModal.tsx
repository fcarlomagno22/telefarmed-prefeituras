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
} from './PsychologistDocumentModalShell'

export type PsychologistRelatorioFinalidade =
  | 'acompanhamento'
  | 'encaminhamento'
  | 'escolar'
  | 'trabalhista'
  | 'judicial'
  | 'outro'

export type PsychologistRelatorioSignedPayload = {
  finalidade: PsychologistRelatorioFinalidade
  destinatario?: string
  motivoRelatorio: string
  demandaPsicologica: string
  historiaPsicologica: string
  instrumentosAplicados?: string
  avaliacaoPsicologica: string
  hipotesePsicologica: string
  intervencoesRealizadas: string
  evolucao?: string
  conclusao: string
  recomendacoes?: string
  observacoes?: string
}

type PsychologistRelatorioModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: PsychologistRelatorioSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

export function PsychologistRelatorioModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: PsychologistRelatorioModalProps) {
  const [finalidade, setFinalidade] = useState<PsychologistRelatorioFinalidade>('acompanhamento')
  const [destinatario, setDestinatario] = useState('')
  const [motivoRelatorio, setMotivoRelatorio] = useState('')
  const [demandaPsicologica, setDemandaPsicologica] = useState('')
  const [historiaPsicologica, setHistoriaPsicologica] = useState('')
  const [instrumentosAplicados, setInstrumentosAplicados] = useState('')
  const [avaliacaoPsicologica, setAvaliacaoPsicologica] = useState('')
  const [hipotesePsicologica, setHipotesePsicologica] = useState('')
  const [intervencoesRealizadas, setIntervencoesRealizadas] = useState('')
  const [evolucao, setEvolucao] = useState('')
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
    setDemandaPsicologica('')
    setHistoriaPsicologica('')
    setInstrumentosAplicados('')
    setAvaliacaoPsicologica('')
    setHipotesePsicologica('')
    setIntervencoesRealizadas('')
    setEvolucao('')
    setConclusao('')
    setRecomendacoes('')
    setObservacoes('')
    setValidationHint(null)
    setSigning(false)
  }, [open])

  async function handleSign() {
    const required = [
      [motivoRelatorio, 'Informe o motivo do relatório.'],
      [demandaPsicologica, 'Descreva a demanda psicológica.'],
      [historiaPsicologica, 'Descreva a história psicológica.'],
      [avaliacaoPsicologica, 'Descreva a avaliação psicológica.'],
      [hipotesePsicologica, 'Informe a hipótese psicológica.'],
      [intervencoesRealizadas, 'Descreva as intervenções realizadas.'],
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
        demandaPsicologica: demandaPsicologica.trim(),
        historiaPsicologica: historiaPsicologica.trim(),
        instrumentosAplicados: instrumentosAplicados.trim() || undefined,
        avaliacaoPsicologica: avaliacaoPsicologica.trim(),
        hipotesePsicologica: hipotesePsicologica.trim(),
        intervencoesRealizadas: intervencoesRealizadas.trim(),
        evolucao: evolucao.trim() || undefined,
        conclusao: conclusao.trim(),
        recomendacoes: recomendacoes.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir o relatório psicológico.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Relatório psicológico"
      subtitle="Síntese do acompanhamento e avaliação psicológica"
      icon={FileBarChart}
      accent="violet"
      hint="Organize o relatório de forma clara para escola, empresa, serviço solicitante ou continuidade do cuidado."
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
              { value: 'acompanhamento', label: 'Acompanhamento psicológico' },
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
            placeholder="Escola, empresa, serviço solicitante..."
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

      <FormSection title="Demanda e história" accent="violet">
        <TextAreaField
          label="Demanda psicológica"
          value={demandaPsicologica}
          onChange={setDemandaPsicologica}
          required
          accent="violet"
        />
        <TextAreaField
          label="História psicológica"
          value={historiaPsicologica}
          onChange={setHistoriaPsicologica}
          required
          rows={3}
          accent="violet"
        />
      </FormSection>

      <FormSection title="Avaliação" accent="violet">
        <TextAreaField
          label="Instrumentos aplicados (opcional)"
          value={instrumentosAplicados}
          onChange={setInstrumentosAplicados}
          rows={2}
          accent="violet"
        />
        <TextAreaField
          label="Avaliação psicológica"
          value={avaliacaoPsicologica}
          onChange={setAvaliacaoPsicologica}
          required
          rows={3}
          accent="violet"
        />
        <TextInputField
          label="Hipótese psicológica"
          value={hipotesePsicologica}
          onChange={setHipotesePsicologica}
          required
          accent="violet"
        />
      </FormSection>

      <FormSection title="Intervenções e conclusão" accent="violet">
        <TextAreaField
          label="Intervenções realizadas"
          value={intervencoesRealizadas}
          onChange={setIntervencoesRealizadas}
          required
          accent="violet"
        />
        <TextAreaField
          label="Evolução (opcional)"
          value={evolucao}
          onChange={setEvolucao}
          rows={2}
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
