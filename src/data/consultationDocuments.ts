import type { ConsultationDocumentItem } from '../components/attendance/ConsultationDocumentsPanel'

export function createPrescriptionDocument(): ConsultationDocumentItem {
  const signedAt = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())

  return {
    id: 'prescription',
    title: 'Receita Médica',
    meta: `PDF • Assinada às ${signedAt}`,
    downloadLabel: 'Baixar receita médica',
    iconClass: 'bg-red-50 text-red-500',
  }
}

export function createExamOrderDocument(): ConsultationDocumentItem {
  const signedAt = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())

  return {
    id: 'exam-order',
    title: 'Pedido de Exames',
    meta: `PDF • Assinado às ${signedAt}`,
    downloadLabel: 'Baixar pedido de exames',
    iconClass: 'bg-sky-50 text-sky-600',
  }
}
