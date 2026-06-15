import { ScheduleUbt } from '../types/scheduleUbt'

const MOCK_DELAY_MS = 420

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export const scheduleUbts: ScheduleUbt[] = [
  {
    id: 'ubt-1',
    name: 'UBT Consolação',
    address: 'Rua da Consolação, 2300',
    neighborhood: 'Consolação',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.5564,
    longitude: -46.6638,
    phone: '(11) 3333-1100',
  },
  {
    id: 'ubt-2',
    name: 'UBT Higienópolia',
    address: 'Rua Maranhão, 415',
    neighborhood: 'Higienópolia',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.5448,
    longitude: -46.6594,
    phone: '(11) 3333-2200',
  },
  {
    id: 'ubt-3',
    name: 'UBT Bela Vista',
    address: 'Av. Paulista, 900',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.5619,
    longitude: -46.6562,
    phone: '(11) 3333-3300',
  },
  {
    id: 'ubt-4',
    name: 'UBT Pinheiros',
    address: 'Rua Teodoro Sampaio, 1441',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.5668,
    longitude: -46.6925,
    phone: '(11) 3333-4400',
  },
  {
    id: 'ubt-5',
    name: 'UBT Tatuapé',
    address: 'Rua Tuiuti, 515',
    neighborhood: 'Tatuapé',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.5371,
    longitude: -46.5761,
    phone: '(11) 3333-5500',
  },
  {
    id: 'ubt-6',
    name: 'UBT Santana',
    address: 'Rua Voluntários da Pátria, 1300',
    neighborhood: 'Santana',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.5036,
    longitude: -46.6264,
    phone: '(11) 3333-6600',
  },
]

export async function fetchScheduleUbts(): Promise<ScheduleUbt[]> {
  await delay(MOCK_DELAY_MS)
  return [...scheduleUbts]
}
