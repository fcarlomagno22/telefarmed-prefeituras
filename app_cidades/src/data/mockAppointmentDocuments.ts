import { ConsultationDocumentPdf } from '../types/appointmentDocuments'

const documentsByProtocol: Record<string, ConsultationDocumentPdf[]> = {
  'TF-2026-33812': [
    {
      id: 'rx-33812-1',
      kind: 'prescription',
      title: 'Receita Médica',
      fileName: 'receita-medica-33812.pdf',
      signedAt: '10:32',
      downloadLabel: 'Baixar receita médica',
      payload: {
        medications: [
          {
            name: 'Dipirona 500 mg',
            dosage: '1 comprimido',
            instructions: 'Tomar de 6 em 6 horas, se dor ou febre, por até 3 dias',
          },
          {
            name: 'Loratadina 10 mg',
            dosage: '1 comprimido',
            instructions: 'Tomar 1 vez ao dia pela manhã, por 5 dias',
          },
        ],
        validUntil: '2026-07-15',
        notes: 'Manter hidratação e repouso relativo.',
      },
    },
    {
      id: 'exam-33812-1',
      kind: 'exam',
      title: 'Pedido de Exames',
      fileName: 'pedido-exames-33812.pdf',
      signedAt: '10:34',
      downloadLabel: 'Baixar pedido de exames',
      payload: {
        exams: [
          {
            name: 'Hemograma completo',
            category: 'Laboratorial',
            instructions: 'Jejum de 4 horas. Levar pedido impresso ou digital na coleta.',
          },
        ],
      },
    },
    {
      id: 'cert-33812-1',
      kind: 'certificate',
      title: 'Atestado Médico',
      fileName: 'atestado-medico-33812.pdf',
      signedAt: '10:36',
      downloadLabel: 'Baixar atestado médico',
      payload: {
        daysOff: 2,
        reason: 'Quadro gripal em acompanhamento',
        cid: 'J06.9',
        startDate: '2026-05-28',
      },
    },
  ],
  'TF-2026-29177': [
    {
      id: 'rx-29177-1',
      kind: 'prescription',
      title: 'Receita Médica',
      fileName: 'receita-medica-29177.pdf',
      signedAt: '11:18',
      downloadLabel: 'Baixar receita médica',
      payload: {
        medications: [
          {
            name: 'Losartana 50 mg',
            dosage: '1 comprimido',
            instructions: 'Tomar 1 vez ao dia, preferencialmente no mesmo horário',
          },
          {
            name: 'Hidroclorotiazida 25 mg',
            dosage: '1 comprimido',
            instructions: 'Tomar pela manhã, após o café',
          },
        ],
        validUntil: '2026-08-10',
      },
    },
    {
      id: 'exam-29177-1',
      kind: 'exam',
      title: 'Pedido de Exames',
      fileName: 'pedido-exames-29177.pdf',
      signedAt: '11:20',
      downloadLabel: 'Baixar pedido de exames',
      payload: {
        exams: [
          {
            name: 'Perfil lipídico',
            category: 'Laboratorial',
            instructions: 'Jejum de 12 horas.',
          },
          {
            name: 'Eletrocardiograma',
            category: 'Cardiologia',
            instructions: 'Agendar na recepção da unidade em até 15 dias.',
          },
        ],
      },
    },
  ],
  'TF-2026-18403': [
    {
      id: 'rx-18403-1',
      kind: 'prescription',
      title: 'Receita Médica',
      fileName: 'receita-medica-18403.pdf',
      signedAt: '14:22',
      downloadLabel: 'Baixar receita médica',
      payload: {
        medications: [
          {
            name: 'Omeprazol 20 mg',
            dosage: '1 cápsula',
            instructions: 'Tomar em jejum, 30 minutos antes do café, por 14 dias',
          },
        ],
        validUntil: '2026-06-30',
      },
    },
    {
      id: 'exam-18403-1',
      kind: 'exam',
      title: 'Pedido de Exames',
      fileName: 'pedido-exames-18403.pdf',
      signedAt: '14:24',
      downloadLabel: 'Baixar pedido de exames',
      payload: {
        exams: [
          {
            name: 'Ultrassonografia abdominal total',
            category: 'Imagem',
            instructions:
              'Jejum de 8 horas e bexiga cheia conforme orientação do laboratório.',
          },
        ],
      },
    },
    {
      id: 'cert-18403-1',
      kind: 'certificate',
      title: 'Declaração de Comparecimento',
      fileName: 'declaracao-comparecimento-18403.pdf',
      signedAt: '14:26',
      downloadLabel: 'Baixar atestado médico',
      payload: {
        daysOff: 0,
        reason: 'Comparecimento à consulta médica nesta unidade',
        startDate: '2026-05-01',
      },
    },
  ],
}

export function getMockConsultationDocuments(
  appointmentId: string,
  protocol: string,
) {
  return {
    appointmentId,
    documents: documentsByProtocol[protocol] ?? [],
  }
}
