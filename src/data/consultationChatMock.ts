import type { ConsultationChatMessage } from '../components/attendance/consultationChatTypes'

const SAMPLE_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
const SAMPLE_IMAGE_URL =
  'https://images.unsplash.com/photo-1582719366826-5a40d5c13f00?auto=format&fit=crop&w=640&q=80'

export const CONSULTATION_CHAT_MOCK: ConsultationChatMessage[] = [
  {
    id: '1',
    from: 'doctor',
    time: '17:11',
    text: 'Olá, Juliana! Vou iniciar a consulta agora, tudo bem?',
  },
  {
    id: '2',
    from: 'patient',
    time: '17:12',
    text: 'Tudo bem, doutor. Estou com um pouco de dor de cabeça desde ontem.',
  },
  {
    id: '3',
    from: 'patient',
    time: '17:03',
    attachments: [
      {
        id: 'att-pdf-1',
        type: 'pdf',
        url: SAMPLE_PDF_URL,
        name: 'Exame_Sangue_25-05.pdf',
        size: 1_258_291,
      },
    ],
  },
  {
    id: '4',
    from: 'patient',
    time: '17:05',
    attachments: [
      {
        id: 'att-img-1',
        type: 'image',
        url: SAMPLE_IMAGE_URL,
        name: 'Foto_rash_braco.jpg',
        size: 860_160,
      },
    ],
  },
  {
    id: '5',
    from: 'doctor',
    time: '17:12',
    text: 'Certo. Vou fazer algumas perguntas para entender melhor os sintomas.',
  },
]

/** @deprecated Use CONSULTATION_CHAT_MOCK */
export const PATIENT_CONSULTATION_CHAT_MOCK = CONSULTATION_CHAT_MOCK
