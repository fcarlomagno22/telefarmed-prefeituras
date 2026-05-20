import type { PatientContact } from './unitDashboardMock'
import type { NetworkUser } from './networkUsersMock'
import { photoUrlForNetworkUser } from './networkUserPhotos'

export type ConsultationRecord = {
  id: string
  date: string
  time: string
  specialty: string
  professional: string
  status: 'concluida' | 'cancelada' | 'agendada'
  protocol: string
}

export type NetworkUserFullProfile = {
  ageGroupLabel: string
  genderLabel: string
  email: string
  guardianName: string
  guardianCpf: string
  photoDataUrl: string
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  contacts: PatientContact[]
  consultations: ConsultationRecord[]
  registeredAt: string
  registrationUnit: string
  notes: string
}

const relationshipLabels: Record<string, string> = {
  pai: 'Pai',
  mae: 'Mãe',
  conjuge: 'Cônjuge / Companheiro(a)',
  filho: 'Filho(a)',
  irmao: 'Irmão(ã)',
  avo: 'Avô / Avó',
  tio: 'Tio(a)',
  amigo: 'Amigo(a)',
  outro: 'Outro',
}

export function formatRelationship(value: string) {
  return relationshipLabels[value] ?? value
}

const profiles: Record<string, NetworkUserFullProfile> = {
  '1': {
    ageGroupLabel: 'Maior de idade',
    genderLabel: 'Feminino',
    email: 'fernanda.silva@email.com',
    guardianName: '',
    guardianCpf: '',
    photoDataUrl: '',
    zipCode: '01310-100',
    street: 'Av. Paulista',
    number: '1578',
    complement: 'Apto 42',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    contacts: [
      {
        id: 'c1-1',
        name: 'Roberto Silva',
        phone: '(11) 98711-2233',
        relationship: 'conjuge',
      },
      {
        id: 'c1-2',
        name: 'Lucas Silva',
        phone: '(11) 91234-8899',
        relationship: 'filho',
      },
    ],
    consultations: [
      {
        id: 'h1-1',
        date: '19/05/2026',
        time: '21:45',
        specialty: 'Clínico geral',
        professional: 'Dr. André Martins',
        status: 'concluida',
        protocol: 'ATD-482901',
      },
      {
        id: 'h1-2',
        date: '02/04/2026',
        time: '14:20',
        specialty: 'Dermatologia',
        professional: 'Dra. Paula Rocha',
        status: 'concluida',
        protocol: 'ATD-471220',
      },
      {
        id: 'h1-3',
        date: '15/01/2026',
        time: '09:10',
        specialty: 'Clínico geral',
        professional: 'Dra. Helena Costa',
        status: 'concluida',
        protocol: 'ATD-450118',
      },
    ],
    registeredAt: '12/03/2024',
    registrationUnit: 'UBS Centro — Sala de Teleatendimento',
    notes: 'Paciente com histórico de hipertensão controlada. Preferência por contato no período da tarde.',
  },
  '2': {
    ageGroupLabel: 'Maior de idade',
    genderLabel: 'Masculino',
    email: 'joao.mendes@email.com',
    guardianName: '',
    guardianCpf: '',
    photoDataUrl: '',
    zipCode: '04547-130',
    street: 'Rua Funchal',
    number: '418',
    complement: '',
    neighborhood: 'Vila Nova',
    city: 'São Paulo',
    state: 'SP',
    contacts: [
      {
        id: 'c2-1',
        name: 'Cláudia Mendes',
        phone: '(11) 97654-1100',
        relationship: 'mae',
      },
    ],
    consultations: [
      {
        id: 'h2-1',
        date: '18/05/2026',
        time: '15:30',
        specialty: 'Cardiologia',
        professional: 'Dr. Ricardo Nunes',
        status: 'concluida',
        protocol: 'ATD-482780',
      },
      {
        id: 'h2-2',
        date: '20/02/2026',
        time: '11:00',
        specialty: 'Clínico geral',
        professional: 'Dra. Helena Costa',
        status: 'concluida',
        protocol: 'ATD-461902',
      },
    ],
    registeredAt: '08/07/2023',
    registrationUnit: 'UBS Centro — Sala de Teleatendimento',
    notes: '',
  },
  '3': {
    ageGroupLabel: 'Maior de idade',
    genderLabel: 'Feminino',
    email: 'maria.costa@email.com',
    guardianName: '',
    guardianCpf: '',
    photoDataUrl: '',
    zipCode: '01418-000',
    street: 'Alameda Santos',
    number: '90',
    complement: 'Sala 12',
    neighborhood: 'Jardim América',
    city: 'São Paulo',
    state: 'SP',
    contacts: [
      {
        id: 'c3-1',
        name: 'Eduardo Costa',
        phone: '(11) 99876-5432',
        relationship: 'pai',
      },
    ],
    consultations: [
      {
        id: 'h3-1',
        date: '16/05/2026',
        time: '10:15',
        specialty: 'Ginecologia',
        professional: 'Dra. Fernanda Lima',
        status: 'concluida',
        protocol: 'ATD-482501',
      },
    ],
    registeredAt: '22/11/2025',
    registrationUnit: 'UBS Centro — Sala de Teleatendimento',
    notes: 'Primeira consulta na rede em novembro de 2025.',
  },
  '4': {
    ageGroupLabel: 'Da melhor idade',
    genderLabel: 'Masculino',
    email: 'carlos.souza@email.com',
    guardianName: 'Ana Souza',
    guardianCpf: '111.222.333-44',
    photoDataUrl: '',
    zipCode: '01302-000',
    street: 'Rua da Consolação',
    number: '2300',
    complement: '',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    contacts: [
      {
        id: 'c4-1',
        name: 'Ana Souza',
        phone: '(11) 96543-7788',
        relationship: 'conjuge',
      },
      {
        id: 'c4-2',
        name: 'Marcos Souza',
        phone: '(11) 93456-2211',
        relationship: 'filho',
      },
    ],
    consultations: [
      {
        id: 'h4-1',
        date: '14/05/2026',
        time: '16:40',
        specialty: 'Geriatria',
        professional: 'Dra. Silvia Moraes',
        status: 'concluida',
        protocol: 'ATD-482310',
      },
      {
        id: 'h4-2',
        date: '03/05/2026',
        time: '08:30',
        specialty: 'Clínico geral',
        professional: 'Dr. André Martins',
        status: 'concluida',
        protocol: 'ATD-481905',
      },
      {
        id: 'h4-3',
        date: '12/12/2025',
        time: '14:00',
        specialty: 'Endocrinologia',
        professional: 'Dr. Paulo Azevedo',
        status: 'concluida',
        protocol: 'ATD-445201',
      },
    ],
    registeredAt: '05/01/2022',
    registrationUnit: 'UBS Centro — Sala de Teleatendimento',
    notes: 'Acompanhamento contínuo de diabetes tipo 2.',
  },
  '5': {
    ageGroupLabel: 'Maior de idade',
    genderLabel: 'Feminino',
    email: 'ana.lima@email.com',
    guardianName: '',
    guardianCpf: '',
    photoDataUrl: '',
    zipCode: '03162-010',
    street: 'Rua Taquari',
    number: '55',
    complement: '',
    neighborhood: 'Mooca',
    city: 'São Paulo',
    state: 'SP',
    contacts: [
      {
        id: 'c5-1',
        name: 'Juliana Lima',
        phone: '(11) 95432-6677',
        relationship: 'irmao',
      },
    ],
    consultations: [
      {
        id: 'h5-1',
        date: '12/05/2026',
        time: '13:25',
        specialty: 'Psicologia',
        professional: 'Dra. Camila Duarte',
        status: 'concluida',
        protocol: 'ATD-481102',
      },
    ],
    registeredAt: '18/09/2025',
    registrationUnit: 'UBS Centro — Sala de Teleatendimento',
    notes: '',
  },
  '6': {
    ageGroupLabel: 'Da melhor idade',
    genderLabel: 'Masculino',
    email: 'ricardo.almeida@email.com',
    guardianName: 'Fernanda Almeida',
    guardianCpf: '222.333.444-55',
    photoDataUrl: '',
    zipCode: '05422-030',
    street: 'Rua dos Pinheiros',
    number: '1201',
    complement: 'Casa',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    state: 'SP',
    contacts: [
      {
        id: 'c6-1',
        name: 'Fernanda Almeida',
        phone: '(11) 94321-0099',
        relationship: 'conjuge',
      },
    ],
    consultations: [
      {
        id: 'h6-1',
        date: '10/05/2026',
        time: '17:50',
        specialty: 'Ortopedia',
        professional: 'Dr. Gustavo Pires',
        status: 'concluida',
        protocol: 'ATD-480998',
      },
      {
        id: 'h6-2',
        date: '28/03/2026',
        time: '09:45',
        specialty: 'Clínico geral',
        professional: 'Dra. Helena Costa',
        status: 'cancelada',
        protocol: 'ATD-478201',
      },
    ],
    registeredAt: '14/06/2021',
    registrationUnit: 'UBS Centro — Sala de Teleatendimento',
    notes: '',
  },
  '7': {
    ageGroupLabel: 'Maior de idade',
    genderLabel: 'Feminino',
    email: 'patricia.oliveira@email.com',
    guardianName: '',
    guardianCpf: '',
    photoDataUrl: '',
    zipCode: '02012-021',
    street: 'Rua Voluntários da Pátria',
    number: '3300',
    complement: 'Bloco B',
    neighborhood: 'Santana',
    city: 'São Paulo',
    state: 'SP',
    contacts: [
      {
        id: 'c7-1',
        name: 'Marcos Oliveira',
        phone: '(11) 93210-4455',
        relationship: 'conjuge',
      },
      {
        id: 'c7-2',
        name: 'Sandra Oliveira',
        phone: '(11) 91122-3344',
        relationship: 'mae',
      },
    ],
    consultations: [
      {
        id: 'h7-1',
        date: '08/05/2026',
        time: '11:30',
        specialty: 'Clínico geral',
        professional: 'Dr. André Martins',
        status: 'concluida',
        protocol: 'ATD-480501',
      },
      {
        id: 'h7-2',
        date: '22/04/2026',
        time: '15:00',
        specialty: 'Nutrição',
        professional: 'Dra. Beatriz Fonseca',
        status: 'concluida',
        protocol: 'ATD-479880',
      },
    ],
    registeredAt: '30/04/2024',
    registrationUnit: 'UBS Centro — Sala de Teleatendimento',
    notes: 'Alergia a dipirona informada no cadastro.',
  },
}

export function getNetworkUserProfile(user: NetworkUser): NetworkUserFullProfile {
  const stored = profiles[user.id]
  const base: NetworkUserFullProfile = stored ?? {
    ageGroupLabel: 'Maior de idade',
    genderLabel: '—',
    email: '—',
    guardianName: '',
    guardianCpf: '',
    photoDataUrl: '',
    zipCode: '—',
    street: '—',
    number: '—',
    complement: '',
    neighborhood: user.bairro,
    city: 'São Paulo',
    state: 'SP',
    contacts: [],
    consultations: [],
    registeredAt: '—',
    registrationUnit: 'UBS Centro — Sala de Teleatendimento',
    notes: '',
  }

  return {
    ...base,
    photoDataUrl:
      base.photoDataUrl ||
      user.avatarUrl ||
      photoUrlForNetworkUser(user.id, base.genderLabel !== '—' ? base.genderLabel : undefined),
  }
}
