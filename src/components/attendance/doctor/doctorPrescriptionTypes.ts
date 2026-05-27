export type PrescriptionMedicationItem = {
  id: string
  name: string
  presentation: string
  route: string
  dosage: string
  instructions: string
  duration: string
  allowsGeneric: boolean
  quantity: string
  notes: string
}

export type PrescriptionMedicationDraft = Omit<PrescriptionMedicationItem, 'id'>

export const emptyPrescriptionMedicationDraft = (): PrescriptionMedicationDraft => ({
  name: '',
  presentation: '',
  route: 'Via oral',
  dosage: '',
  instructions: '',
  duration: '',
  allowsGeneric: true,
  quantity: '',
  notes: '',
})

export function formatPrescriptionMedicationSummary(item: PrescriptionMedicationItem): string {
  const parts = [
    item.dosage,
    item.instructions,
    item.duration,
    item.allowsGeneric ? 'Permite genérico' : 'Não substituir',
    item.quantity,
  ].filter(Boolean)

  return parts.join(' · ')
}
