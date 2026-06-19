import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import {
  FormSection,
  PsychologistDocumentModalShell,
  SelectField,
  TextAreaField,
  TextInputField,
  type PsychologistPatientInfo,
  type PsychologistProfessionalInfo,
} from './PsychologistDocumentModalShell'

export type PsychologistAtestadoSignedPayload = {
  tipo: 'afastamento' | 'comparecimento'
  dataInicio: string
  diasAfastamento?: number
  motivo?: string
  observacoes?: string
}

type PsychologistAtestadoModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: PsychologistAtestadoSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

export function PsychologistAtestadoModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: PsychologistAtestadoModalProps) {
  const [tipo, setTipo] = useState<'afastamento' | 'comparecimento'>('comparecimento')
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().slice(0, 10))
  const [diasAfastamento, setDiasAfastamento] = useState(1)
  const [motivo, setMotivo] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTipo('comparecimento')
    setDataInicio(new Date().toISOString().slice(0, 10))
    setDiasAfastamento(1)
    setMotivo('')
    setObservacoes('')
    setValidationHint(null)
    setSigning(false)
  }, [open])

  async function handleSign() {
    if (tipo === 'afastamento' && !motivo.trim()) {
      setValidationHint('Informe o motivo do afastamento psicológico.')
      return
    }
    setSigning(true)
    setValidationHint(null)
    try {
      await onSigned?.({
        tipo,
        dataInicio,
        diasAfastamento: tipo === 'afastamento' ? diasAfastamento : undefined,
        motivo: tipo === 'afastamento' ? motivo.trim() : undefined,
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir o atestado psicológico.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Atestado psicológico"
      subtitle="Comparecimento ou afastamento por motivos psicológicos"
      icon={FileText}
      accent="amber"
      hint="Use linguagem objetiva e descreva apenas o necessário para a finalidade do documento."
      onClose={onClose}
      onSign={handleSign}
      signing={signing}
      validationHint={validationHint}
      patient={patient}
      professional={professional}
    >
      <FormSection title="Tipo e período" accent="amber">
        <SelectField
          label="Tipo de atestado"
          value={tipo}
          onChange={setTipo}
          accent="amber"
          options={[
            { value: 'comparecimento', label: 'Comparecimento à sessão' },
            { value: 'afastamento', label: 'Afastamento de atividades' },
          ]}
        />
        <TextInputField
          label="Data de referência"
          type="date"
          value={dataInicio}
          onChange={setDataInicio}
          accent="amber"
        />
        {tipo === 'afastamento' ? (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                Dias de afastamento
              </span>
              <input
                type="number"
                min={1}
                max={365}
                value={diasAfastamento}
                onChange={(event) => setDiasAfastamento(Number(event.target.value) || 1)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
            </label>
            <TextAreaField
              label="Motivo do afastamento"
              value={motivo}
              onChange={setMotivo}
              required
              accent="amber"
              placeholder="Descreva a necessidade de afastamento com base na avaliação psicológica"
            />
          </>
        ) : null}
      </FormSection>

      <FormSection title="Observações" accent="amber">
        <TextAreaField
          label="Observações adicionais (opcional)"
          value={observacoes}
          onChange={setObservacoes}
          rows={2}
          accent="amber"
        />
      </FormSection>
    </PsychologistDocumentModalShell>
  )
}
