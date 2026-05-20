import { photoUrlForNetworkUser } from './networkUserPhotos'

export type NetworkUser = {
  id: string
  name: string
  initials: string
  avatarUrl?: string
  avatarClassName: string
  bairro: string
  phone: string
  cpf: string
  birthDate: string
  age: number
  lastAppointmentDate: string
  lastAppointmentRelative: string
  totalAppointments: number
}

export const networkUsersSummary = {
  totalUsers: 2458,
  newUsers: 127,
  totalAppointments: 5982,
  attendedThisMonth: 248,
}

export type NetworkUsersAgeSlice = {
  label: string
  percent: number
}

export type NetworkUsersGenderSlice = {
  label: string
  percent: number
  gradientFrom: string
  gradientTo: string
}

export type NetworkUsersNeighborhoodSlice = {
  label: string
  appointments: number
}

export const networkUsersAbout = {
  ageDistribution: [
    { label: '0–17 anos', percent: 8 },
    { label: '18–29 anos', percent: 22 },
    { label: '30–59 anos', percent: 48 },
    { label: '60+ anos', percent: 22 },
  ] satisfies NetworkUsersAgeSlice[],
  genderDistribution: [
    { label: 'Feminino', percent: 58, gradientFrom: '#c4b5fd', gradientTo: '#7c3aed' },
    { label: 'Masculino', percent: 42, gradientFrom: '#fdba74', gradientTo: '#ea580c' },
  ] satisfies NetworkUsersGenderSlice[],
  topNeighborhoodsByAppointments: [
    { label: 'Centro', appointments: 842 },
    { label: 'Vila Nova', appointments: 691 },
    { label: 'Jardim América', appointments: 534 },
    { label: 'Bela Vista', appointments: 478 },
    { label: 'Mooca', appointments: 412 },
  ] satisfies NetworkUsersNeighborhoodSlice[],
}

export const networkUsers: NetworkUser[] = [
  {
    id: '1',
    name: 'Fernanda Silva',
    initials: 'FS',
    avatarUrl: photoUrlForNetworkUser('1', 'Feminino'),
    avatarClassName: 'bg-emerald-100 text-emerald-700',
    bairro: 'Centro',
    phone: '(11) 98604-5105',
    cpf: '123.456.789-01',
    birthDate: '12/04/1990',
    age: 34,
    lastAppointmentDate: '19/05/2026',
    lastAppointmentRelative: 'Hoje, 21:45',
    totalAppointments: 12,
  },
  {
    id: '2',
    name: 'João Victor Mendes',
    initials: 'JM',
    avatarUrl: photoUrlForNetworkUser('2', 'Masculino'),
    avatarClassName: 'bg-sky-100 text-sky-700',
    bairro: 'Vila Nova',
    phone: '(11) 98765-4321',
    cpf: '234.567.890-12',
    birthDate: '05/08/1985',
    age: 39,
    lastAppointmentDate: '18/05/2026',
    lastAppointmentRelative: 'Ontem, 15:30',
    totalAppointments: 8,
  },
  {
    id: '3',
    name: 'Maria Eduarda Costa',
    initials: 'MC',
    avatarUrl: photoUrlForNetworkUser('3', 'Feminino'),
    avatarClassName: 'bg-violet-100 text-violet-700',
    bairro: 'Jardim América',
    phone: '(11) 97654-3210',
    cpf: '345.678.901-23',
    birthDate: '22/11/1998',
    age: 26,
    lastAppointmentDate: '16/05/2026',
    lastAppointmentRelative: '3 dias atrás',
    totalAppointments: 5,
  },
  {
    id: '4',
    name: 'Carlos Alberto Souza',
    initials: 'CS',
    avatarUrl: photoUrlForNetworkUser('4', 'Masculino'),
    avatarClassName: 'bg-emerald-100 text-emerald-700',
    bairro: 'Bela Vista',
    phone: '(11) 96543-2109',
    cpf: '456.789.012-34',
    birthDate: '30/01/1972',
    age: 53,
    lastAppointmentDate: '14/05/2026',
    lastAppointmentRelative: '5 dias atrás',
    totalAppointments: 21,
  },
  {
    id: '5',
    name: 'Ana Beatriz Lima',
    initials: 'AL',
    avatarUrl: photoUrlForNetworkUser('5', 'Feminino'),
    avatarClassName: 'bg-amber-100 text-amber-700',
    bairro: 'Mooca',
    phone: '(11) 95432-1098',
    cpf: '567.890.123-45',
    birthDate: '17/06/2000',
    age: 24,
    lastAppointmentDate: '12/05/2026',
    lastAppointmentRelative: '1 semana atrás',
    totalAppointments: 3,
  },
  {
    id: '6',
    name: 'Ricardo Almeida',
    initials: 'RA',
    avatarUrl: photoUrlForNetworkUser('6', 'Masculino'),
    avatarClassName: 'bg-sky-100 text-sky-700',
    bairro: 'Pinheiros',
    phone: '(11) 94321-0987',
    cpf: '678.901.234-56',
    birthDate: '09/03/1968',
    age: 57,
    lastAppointmentDate: '10/05/2026',
    lastAppointmentRelative: '1 semana atrás',
    totalAppointments: 15,
  },
  {
    id: '7',
    name: 'Patrícia Oliveira',
    initials: 'PO',
    avatarUrl: photoUrlForNetworkUser('7', 'Feminino'),
    avatarClassName: 'bg-amber-100 text-amber-700',
    bairro: 'Santana',
    phone: '(11) 93210-9876',
    cpf: '789.012.345-67',
    birthDate: '25/09/1988',
    age: 36,
    lastAppointmentDate: '08/05/2026',
    lastAppointmentRelative: '11 dias atrás',
    totalAppointments: 9,
  },
]

export const networkUsersPagination = {
  page: 1,
  pageSize: 7,
  total: networkUsersSummary.totalUsers,
  totalPages: 350,
}
