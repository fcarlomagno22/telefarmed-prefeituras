import { useEffect, useState } from 'react'
import { Pill, Plus, Trash2 } from 'lucide-react'
import {
  FormSection,
  PsychologistDocumentModalShell,
  TextAreaField,
  TextInputField,
  type PsychologistPatientInfo,
  type PsychologistProfessionalInfo,
} from '../psicologo/PsychologistDocumentModalShell'

type SuplementoDraft = {
  id: string
  nome: string
  dosagem: string
  frequencia: string
  duracao: string
  observacoes: string
}

export type NutritionistPrescricaoSuplementosSignedPayload = {
  indicacaoClinica: string
  suplementos: Array<{
    nome: string
    dosagem?: string
    frequencia?: string
    duracao?: string
    observacoes?: string
  }>
  observacoesGerais?: string
}

type NutritionistPrescricaoSuplementosModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: NutritionistPrescricaoSuplementosSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

function createSuplementoDraft(): SuplementoDraft {
  return {
    id: crypto.randomUUID(),
    nome: '',
    dosagem: '',
    frequencia: '',
    duracao: '',
    observacoes: '',
  }
}

export function NutritionistPrescricaoSuplementosModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: NutritionistPrescricaoSuplementosModalProps) {
  const [indicacaoClinica, setIndicacaoClinica] = useState('')
  const [suplementos, setSuplementos] = useState<SuplementoDraft[]>([createSuplementoDraft()])
  const [observacoesGerais, setObservacoesGerais] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setIndicacaoClinica('')
    setSuplementos([createSuplementoDraft()])
    setObservacoesGerais('')
    setValidationHint(null)
    setSigning(false)
  }, [open])

  function updateSuplemento(id: string, patch: Partial<SuplementoDraft>) {
    setSuplementos((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  async function handleSign() {
    if (!indicacaoClinica.trim()) {
      setValidationHint('Informe a indicação clínica.')
      return
    }

    const validSuplementos = suplementos
      .filter((item) => item.nome.trim())
      .map((item) => ({
        nome: item.nome.trim(),
        dosagem: item.dosagem.trim() || undefined,
        frequencia: item.frequencia.trim() || undefined,
        duracao: item.duracao.trim() || undefined,
        observacoes: item.observacoes.trim() || undefined,
      }))

    if (validSuplementos.length === 0) {
      setValidationHint('Adicione ao menos um suplemento.')
      return
    }

    setSigning(true)
    setValidationHint(null)
    try {
      await onSigned?.({
        indicacaoClinica: indicacaoClinica.trim(),
        suplementos: validSuplementos,
        observacoesGerais: observacoesGerais.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir a prescrição de suplementos.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Prescrição de suplementos"
      subtitle="Suplementos permitidos conforme avaliação nutricional"
      icon={Pill}
      accent="amber"
      hint="Prescreva apenas suplementos permitidos e com posologia clara."
      onClose={onClose}
      onSign={handleSign}
      signing={signing}
      validationHint={validationHint}
      patient={patient}
      professional={professional}
    >
      <FormSection title="Indicação" accent="amber">
        <TextAreaField
          label="Indicação clínica"
          value={indicacaoClinica}
          onChange={setIndicacaoClinica}
          required
          accent="amber"
        />
      </FormSection>

      <FormSection title="Suplementos" accent="amber">
        <div className="space-y-3">
          {suplementos.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gray-900">Suplemento {index + 1}</span>
                {suplementos.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSuplementos((current) => current.filter((entry) => entry.id !== item.id))
                    }
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
                  </button>
                ) : null}
              </div>
              <TextInputField
                label="Nome do suplemento"
                value={item.nome}
                onChange={(value) => updateSuplemento(item.id, { nome: value })}
                required
                accent="amber"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <TextInputField
                  label="Dosagem"
                  value={item.dosagem}
                  onChange={(value) => updateSuplemento(item.id, { dosagem: value })}
                  accent="amber"
                />
                <TextInputField
                  label="Posologia"
                  value={item.frequencia}
                  onChange={(value) => updateSuplemento(item.id, { frequencia: value })}
                  accent="amber"
                />
                <TextInputField
                  label="Duração"
                  value={item.duracao}
                  onChange={(value) => updateSuplemento(item.id, { duracao: value })}
                  accent="amber"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSuplementos((current) => [...current, createSuplementoDraft()])}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
        >
          <Plus className="h-4 w-4" />
          Adicionar suplemento
        </button>
      </FormSection>

      <FormSection title="Observações" accent="amber">
        <TextAreaField
          label="Observações gerais (opcional)"
          value={observacoesGerais}
          onChange={setObservacoesGerais}
          rows={2}
          accent="amber"
        />
      </FormSection>
    </PsychologistDocumentModalShell>
  )
}
