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

export type FonoaudiologoRelatorioFinalidade =
  | 'acompanhamento'
  | 'encaminhamento'
  | 'escolar'
  | 'trabalhista'
  | 'judicial'
  | 'outro'

export type FonoaudiologoRelatorioSignedPayload = {
  finalidade: FonoaudiologoRelatorioFinalidade
  destinatario?: string
  motivoRelatorio: string
  demandaFonoaudiologica: string
  historiaFonoaudiologica: string
  avaliacaoFonoaudiologica: string
  hipoteseFonoaudiologica: string
  intervencoesRealizadas: string
  evolucao?: string
  conclusao: string
  recomendacoes?: string
  observacoes?: string
}

type FonoaudiologoRelatorioModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: FonoaudiologoRelatorioSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

export function FonoaudiologoRelatorioModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: FonoaudiologoRelatorioModalProps) {
  const [finalidade, setFinalidade] = useState<FonoaudiologoRelatorioFinalidade>('acompanhamento')
  const [destinatario, setDestinatario] = useState('')
  const [motivoRelatorio, setMotivoRelatorio] = useState('')
  const [demandaFonoaudiologica, setDemandaFonoaudiologica] = useState('')
  const [historiaFonoaudiologica, setHistoriaFonoaudiologica] = useState('')
  const [avaliacaoFonoaudiologica, setAvaliacaoFonoaudiologica] = useState('')
  const [hipoteseFonoaudiologica, setHipoteseFonoaudiologica] = useState('')
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
    setDemandaFonoaudiologica('')
    setHistoriaFonoaudiologica('')
    setAvaliacaoFonoaudiologica('')
    setHipoteseFonoaudiologica('')
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
      [demandaFonoaudiologica, 'Descreva a demanda fonoaudiológica.'],
      [historiaFonoaudiologica, 'Descreva a história fonoaudiológica.'],
      [avaliacaoFonoaudiologica, 'Descreva a avaliação fonoaudiológica.'],
      [hipoteseFonoaudiologica, 'Informe a hipótese fonoaudiológica.'],
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
        demandaFonoaudiologica: demandaFonoaudiologica.trim(),
        historiaFonoaudiologica: historiaFonoaudiologica.trim(),
        avaliacaoFonoaudiologica: avaliacaoFonoaudiologica.trim(),
        hipoteseFonoaudiologica: hipoteseFonoaudiologica.trim(),
        intervencoesRealizadas: intervencoesRealizadas.trim(),
        evolucao: evolucao.trim() || undefined,
        conclusao: conclusao.trim(),
        recomendacoes: recomendacoes.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir o relatório fonoaudiológico.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Relatório fonoaudiológico"
      subtitle="Síntese da avaliação e conduta fonoaudiológica"
      icon={FileBarChart}
      accent="indigo"
      hint="Organize demanda, avaliação, intervenções e conclusão de forma objetiva."
      onClose={onClose}
      onSign={handleSign}
      signing={signing}
      validationHint={validationHint}
      patient={patient}
      professional={professional}
    >
      <FormSection title="Identificação" accent="indigo">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Finalidade"
            value={finalidade}
            onChange={setFinalidade}
            accent="indigo"
            options={[
              { value: 'acompanhamento', label: 'Acompanhamento fonoaudiológico' },
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
            accent="indigo"
          />
        </div>
        <TextAreaField
          label="Motivo do relatório"
          value={motivoRelatorio}
          onChange={setMotivoRelatorio}
          required
          accent="indigo"
        />
      </FormSection>

      <FormSection title="Demanda e história" accent="indigo">
        <TextAreaField
          label="Demanda fonoaudiológica"
          value={demandaFonoaudiologica}
          onChange={setDemandaFonoaudiologica}
          required
          accent="indigo"
        />
        <TextAreaField
          label="História fonoaudiológica"
          value={historiaFonoaudiologica}
          onChange={setHistoriaFonoaudiologica}
          required
          rows={3}
          accent="indigo"
        />
      </FormSection>

      <FormSection title="Avaliação e intervenções" accent="indigo">
        <TextAreaField
          label="Avaliação fonoaudiológica"
          value={avaliacaoFonoaudiologica}
          onChange={setAvaliacaoFonoaudiologica}
          required
          rows={3}
          accent="indigo"
        />
        <TextInputField
          label="Hipótese fonoaudiológica"
          value={hipoteseFonoaudiologica}
          onChange={setHipoteseFonoaudiologica}
          required
          accent="indigo"
        />
        <TextAreaField
          label="Intervenções realizadas"
          value={intervencoesRealizadas}
          onChange={setIntervencoesRealizadas}
          required
          accent="indigo"
        />
        <TextAreaField
          label="Evolução (opcional)"
          value={evolucao}
          onChange={setEvolucao}
          rows={2}
          accent="indigo"
        />
      </FormSection>

      <FormSection title="Conclusão" accent="indigo">
        <TextAreaField
          label="Conclusão"
          value={conclusao}
          onChange={setConclusao}
          required
          accent="indigo"
        />
        <TextAreaField
          label="Recomendações (opcional)"
          value={recomendacoes}
          onChange={setRecomendacoes}
          rows={2}
          accent="indigo"
        />
      </FormSection>
    </PsychologistDocumentModalShell>
  )
}
